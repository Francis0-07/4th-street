import express from 'express';
import pool from '../db.js';
import authorization from '../middleware/authorization.js';

const router = express.Router();

// GET user's orders
router.get('/', authorization, async (req, res) => {
  try {
    const user_id = req.user.id;
    const orders = await pool.query(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [user_id]
    );
    res.json(orders.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error: " + err.message);
  }
});

// GET specific order details
router.get('/:id', authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Check if user is admin
    const userCheck = await pool.query("SELECT is_admin FROM users WHERE user_id = $1", [user_id]);
    const isAdmin = userCheck.rows.length > 0 && userCheck.rows[0].is_admin;

    let order;
    if (isAdmin) {
      order = await pool.query("SELECT * FROM orders WHERE order_id = $1", [id]);
    } else {
      order = await pool.query("SELECT * FROM orders WHERE order_id = $1 AND user_id = $2", [id, user_id]);
    }

    if (order.rows.length === 0) {
      return res.status(404).json("Order not found");
    }

    // 2. Get Order Items
    const orderItems = await pool.query(
      `SELECT oi.quantity, oi.price_at_purchase, p.name, p.image_url, p.product_id
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({ ...order.rows[0], items: orderItems.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error: " + err.message);
  }
});

// CREATE ORDER (Checkout)
router.post('/', authorization, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { total_amount, shipping_address, points_redeemed } = req.body;

    // Start transaction
    await pool.query('BEGIN');

    // 0. Handle Points Redemption (Deduct before creating order)
    if (points_redeemed && points_redeemed > 0) {
        const userRes = await pool.query("SELECT loyalty_points FROM users WHERE user_id = $1", [user_id]);
        const currentPoints = userRes.rows[0].loyalty_points || 0;

        if (currentPoints < points_redeemed) {
            await pool.query('ROLLBACK');
            return res.status(400).json("Insufficient loyalty points");
        }

        await pool.query("UPDATE users SET loyalty_points = GREATEST(0, COALESCE(loyalty_points, 0) - $1) WHERE user_id = $2", [points_redeemed, user_id]);
    }

    // Calculate points to be earned from this purchase (1 point for every ₦10,000 spent)
    const pointsEarned = Math.floor(Number(total_amount) / 10000);

    // 1. Create Order
    const newOrder = await pool.query(
      "INSERT INTO orders (user_id, total_amount, shipping_address, status, points_redeemed, points_earned) VALUES ($1, $2, $3, 'paid', $4, $5) RETURNING order_id",
      [user_id, total_amount, JSON.stringify(shipping_address), points_redeemed || 0, pointsEarned]
    );
    const orderId = newOrder.rows[0].order_id;

    // 2. Get Cart Items
    const cartItems = await pool.query(
      "SELECT c.product_id, c.quantity, c.size, COALESCE(p.sale_price, p.price) as price FROM cart_items c JOIN products p ON c.product_id = p.product_id WHERE c.user_id = $1",
      [user_id]
    );

    if (cartItems.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(400).json("Cart is empty");
    }

    // 3. Move items to order_items
    for (let item of cartItems.rows) {
      await pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity, size, price_at_purchase) VALUES ($1, $2, $3, $4, $5)",
        [orderId, item.product_id, item.quantity, item.size, item.price]
      );
    }

    // 4. Clear Cart
    await pool.query("DELETE FROM cart_items WHERE user_id = $1", [user_id]);

    // 5. Award loyalty points
    if (pointsEarned > 0) {
        await pool.query(
            "UPDATE users SET loyalty_points = COALESCE(loyalty_points, 0) + $1 WHERE user_id = $2",
            [pointsEarned, user_id]
        );
    }

    // Commit transaction
    await pool.query('COMMIT');

    res.json({ order_id: orderId, message: "Order placed successfully" });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json("Server Error: " + err.message);
  }
});

// REQUEST RETURN
router.post('/:id/return', authorization, async (req, res) => {
  try {
    const { id } = req.params; // order_id
    const { reason, comments, resolution } = req.body;
    const user_id = req.user.id;

    // Check if order exists and belongs to user
    const order = await pool.query("SELECT * FROM orders WHERE order_id = $1 AND user_id = $2", [id, user_id]);
    if (order.rows.length === 0) {
      return res.status(404).json("Order not found");
    }

    // Check if return already exists
    const existingReturn = await pool.query("SELECT * FROM returns WHERE order_id = $1", [id]);
    if (existingReturn.rows.length > 0) {
        return res.status(400).json("Return request already submitted for this order");
    }

    await pool.query('BEGIN');

    // Create return record
    await pool.query(
      "INSERT INTO returns (order_id, user_id, reason, comments, resolution) VALUES ($1, $2, $3, $4, $5)",
      [id, user_id, reason, comments, resolution]
    );

    // Update order status
    await pool.query("UPDATE orders SET status = 'return_requested' WHERE order_id = $1", [id]);

    await pool.query('COMMIT');
    res.json("Return request submitted");
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json("Server Error: " + err.message);
  }
});

export default router;
