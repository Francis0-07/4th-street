import express from 'express';
import crypto from 'crypto';
import pool from '../db.js';
import { sendEmail } from '../utils/emailService.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        // 1. Validate Event Signature
        const secret = process.env.PAYSTACK_SECRET_KEY;
        const hash = crypto.createHmac('sha512', secret)
                           .update(req.rawBody)
                           .digest('hex');

        if (hash !== req.headers['x-paystack-signature']) {
            return res.status(400).send('Invalid Signature');
        }

        // 2. Retrieve the event
        const event = req.body;

        if (event.event === 'charge.success') {
            const { reference, metadata, amount } = event.data;
            const { user_id, shipping_address, points_redeemed, points_earned } = metadata;

            // 3. Check if order already exists
            const existingOrder = await pool.query(
                "SELECT * FROM orders WHERE payment_reference = $1", 
                [reference]
            );

            if (existingOrder.rows.length > 0) {
                // Order exists, ensure it is marked as paid
                if (existingOrder.rows[0].status === 'pending') {
                    await pool.query(
                        "UPDATE orders SET status = 'paid' WHERE order_id = $1", 
                        [existingOrder.rows[0].order_id]
                    );
                }
                return res.status(200).send('Order already processed');
            }

            // 4. Create Order (If it doesn't exist)
            await pool.query('BEGIN');

            // Deduct Points if used
            if (points_redeemed > 0) {
                await pool.query(
                    "UPDATE users SET loyalty_points = GREATEST(0, COALESCE(loyalty_points, 0) - $1) WHERE user_id = $2", 
                    [points_redeemed, user_id]
                );
            }

            // Create Order Record
            const newOrder = await pool.query(
                "INSERT INTO orders (user_id, total_amount, shipping_address, status, points_redeemed, points_earned, payment_reference) VALUES ($1, $2, $3, 'paid', $4, $5, $6) RETURNING order_id",
                [user_id, amount / 100, JSON.stringify(shipping_address), points_redeemed || 0, points_earned || 0, reference]
            );
            const orderId = newOrder.rows[0].order_id;

            // Move items from Cart to Order Items
            // Note: We rely on the user's current cart in the DB. 
            // If the cart was cleared, we might need to rely on metadata items if passed.
            const cartItems = await pool.query(
                "SELECT c.product_id, c.quantity, c.size, COALESCE(p.sale_price, p.price) as price FROM cart_items c JOIN products p ON c.product_id = p.product_id WHERE c.user_id = $1",
                [user_id]
            );

            if (cartItems.rows.length > 0) {
                for (let item of cartItems.rows) {
                    await pool.query(
                        "INSERT INTO order_items (order_id, product_id, quantity, size, price_at_purchase) VALUES ($1, $2, $3, $4, $5)",
                        [orderId, item.product_id, item.quantity, item.size, item.price]
                    );

                    // Update Product Stock: Decrease quantity by the amount bought
                    await pool.query(
                        "UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE product_id = $2",
                        [item.quantity, item.product_id]
                    );
                }
                // Clear Cart
                await pool.query("DELETE FROM cart_items WHERE user_id = $1", [user_id]);
            }

            // Award Points
            if (points_earned > 0) {
                await pool.query(
                    "UPDATE users SET loyalty_points = COALESCE(loyalty_points, 0) + $1 WHERE user_id = $2",
                    [points_earned, user_id]
                );
            }

            await pool.query('COMMIT');
            console.log(`Order ${orderId} created via Webhook`);

            // Send Email Notification
            try {
                const userResult = await pool.query("SELECT email, name FROM users WHERE user_id = $1", [user_id]);
                if (userResult.rows.length > 0) {
                    const { email, name } = userResult.rows[0];
                    const subject = `Order Confirmation - #${orderId}`;
                    const message = `Hello ${name},\n\nThank you for your order! Your order #${orderId} has been successfully placed via Paystack.\n\nTotal Amount: ₦${(amount / 100).toLocaleString()}\n\nYou can view your order details in your dashboard.\n\n- The 4th-street Team`;
                    
                    await sendEmail(email, subject, message);
                }
            } catch (emailErr) {
                console.error("Failed to send webhook order confirmation email:", emailErr.message);
            }
        }

        res.sendStatus(200);
    } catch (err) {
        console.error("Webhook Error:", err.message);
        await pool.query('ROLLBACK');
        res.sendStatus(500);
    }
});

export default router;
