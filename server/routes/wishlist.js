import express from 'express';
import pool from '../db.js';
import authorization from '../middleware/authorization.js';

const router = express.Router();

// GET all wishlist items for the logged-in user
router.get('/', authorization, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    // Join wishlist with products to get product details
    const wishlist = await pool.query(
      `SELECT p.*, w.wishlist_id, w.created_at as added_at 
       FROM wishlist w 
       JOIN products p ON w.product_id = p.product_id 
       WHERE w.user_id = $1 
       ORDER BY w.created_at DESC`,
      [user_id]
    );
    
    res.json(wishlist.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

// ADD a product to wishlist
router.post('/', authorization, async (req, res) => {
  try {
    const { product_id } = req.body;
    const user_id = req.user.id;

    // Check if product is already in wishlist
    const check = await pool.query(
      "SELECT * FROM wishlist WHERE user_id = $1 AND product_id = $2", 
      [user_id, product_id]
    );

    if (check.rows.length > 0) {
        return res.status(400).json("Product already in wishlist");
    }

    const newWishlist = await pool.query(
      "INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) RETURNING *",
      [user_id, product_id]
    );

    res.json(newWishlist.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

// DELETE a product from wishlist
router.delete('/:id', authorization, async (req, res) => {
  try {
    const { id } = req.params; // This is the product_id
    const user_id = req.user.id;
    
    await pool.query("DELETE FROM wishlist WHERE product_id = $1 AND user_id = $2", [id, user_id]);
    
    res.json("Removed from wishlist");
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

export default router;