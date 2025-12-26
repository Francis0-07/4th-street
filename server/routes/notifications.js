import express from 'express';
import pool from '../db.js';

const router = express.Router();

// SUBSCRIBE to back-in-stock alerts
router.post('/subscribe', async (req, res) => {
  try {
    const { email, product_id } = req.body;

    if (!email || !product_id) {
        return res.status(400).json("Email and Product ID are required");
    }

    // Check if already subscribed
    const check = await pool.query(
        "SELECT * FROM product_notifications WHERE email = $1 AND product_id = $2", 
        [email, product_id]
    );

    if (check.rows.length > 0) {
        return res.json("You are already subscribed to alerts for this product.");
    }

    await pool.query(
        "INSERT INTO product_notifications (email, product_id) VALUES ($1, $2)",
        [email, product_id]
    );

    res.json("You will be notified when this product is back in stock.");
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

export default router;