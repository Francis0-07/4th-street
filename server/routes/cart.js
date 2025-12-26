import express from 'express';
import pool from '../db.js';
import authorization from '../middleware/authorization.js';

const router = express.Router();

// GET user's cart
router.get('/', authorization, async (req, res) => {
  try {
    const user_id = req.user.id;
    const cart = await pool.query(
      `SELECT c.cart_item_id, c.quantity, c.size, p.product_id, p.name, p.price, p.sale_price, p.image_url, p.category 
       FROM cart_items c 
       JOIN products p ON c.product_id = p.product_id 
       WHERE c.user_id = $1
       ORDER BY c.created_at ASC`,
      [user_id]
    );
    res.json(cart.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

// ADD item to cart
router.post('/', authorization, async (req, res) => {
  try {
    const { product_id, quantity, size } = req.body;
    const user_id = req.user.id;

    // Check stock availability
    const productRes = await pool.query("SELECT stock_quantity FROM products WHERE product_id = $1", [product_id]);
    if (productRes.rows.length === 0) return res.status(404).json("Product not found");
    const stock = productRes.rows[0].stock_quantity;

    // Check if item already exists in cart
    const existingItem = await pool.query(
      "SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2 AND size IS NOT DISTINCT FROM $3",
      [user_id, product_id, size]
    );

    if (existingItem.rows.length > 0) {
      // Update quantity
      const newQuantity = existingItem.rows[0].quantity + parseInt(quantity);

      if (newQuantity > stock) {
        return res.status(400).json(`Cannot add to cart. Only ${stock} items left in stock.`);
      }

      await pool.query(
        "UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2",
        [newQuantity, existingItem.rows[0].cart_item_id]
      );
      return res.json("Cart updated");
    }

    if (parseInt(quantity) > stock) {
        return res.status(400).json(`Cannot add to cart. Only ${stock} items left in stock.`);
    }

    // Insert new item
    await pool.query(
      "INSERT INTO cart_items (user_id, product_id, quantity, size) VALUES ($1, $2, $3, $4)",
      [user_id, product_id, quantity, size]
    );
    res.json("Item added to cart");
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

// UPDATE cart item quantity
router.put('/:id', authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const user_id = req.user.id;

    if (quantity < 1) {
        return res.status(400).json("Quantity must be at least 1");
    }

    // Check stock
    const cartItem = await pool.query("SELECT product_id FROM cart_items WHERE cart_item_id = $1", [id]);
    if (cartItem.rows.length === 0) return res.status(404).json("Item not found");
    
    const productRes = await pool.query("SELECT stock_quantity FROM products WHERE product_id = $1", [cartItem.rows[0].product_id]);
    const stock = productRes.rows[0].stock_quantity;

    if (quantity > stock) {
        return res.status(400).json(`Cannot update quantity. Only ${stock} items left in stock.`);
    }

    await pool.query(
      "UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 AND user_id = $3",
      [quantity, id, user_id]
    );
    res.json("Cart updated");
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

// DELETE item from cart
router.delete('/:id', authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    await pool.query(
      "DELETE FROM cart_items WHERE cart_item_id = $1 AND user_id = $2",
      [id, user_id]
    );
    res.json("Item deleted");
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

// VALIDATE PROMO CODE
router.post('/validate-promo', authorization, async (req, res) => {
  try {
    const { code } = req.body;
    const promo = await pool.query("SELECT * FROM promotions WHERE code = $1 AND is_active = TRUE", [code]);

    if (promo.rows.length === 0) {
      return res.status(404).json("Invalid or expired promotion code");
    }

    res.json(promo.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

export default router;
