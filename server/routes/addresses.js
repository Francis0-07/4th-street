import express from 'express';
import pool from '../db.js';
import authorization from '../middleware/authorization.js';

const router = express.Router();

// GET all addresses for a user
router.get('/', authorization, async (req, res) => {
  try {
    const user_id = req.user.id;
    const addresses = await pool.query(
      "SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC",
      [user_id]
    );
    res.json(addresses.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error: " + err.message);
  }
});

// ADD a new address
router.post('/', authorization, async (req, res) => {
  try {
    const { full_name, address_line1, city, state, postal_code, country, is_default } = req.body;
    const user_id = req.user.id;

    // If setting as default, unset other defaults first
    if (is_default) {
      await pool.query("UPDATE addresses SET is_default = FALSE WHERE user_id = $1", [user_id]);
    }

    const newAddress = await pool.query(
      "INSERT INTO addresses (user_id, full_name, address_line1, city, state, postal_code, country, is_default) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [user_id, full_name, address_line1, city, state, postal_code, country, is_default]
    );

    res.json(newAddress.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error: " + err.message);
  }
});

// DELETE an address
router.delete('/:id', authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    await pool.query("DELETE FROM addresses WHERE address_id = $1 AND user_id = $2", [id, user_id]);
    res.json("Address deleted");
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error: " + err.message);
  }
});

// SET default address
router.put('/:id/default', authorization, async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        // Unset all defaults
        await pool.query("UPDATE addresses SET is_default = FALSE WHERE user_id = $1", [user_id]);

        // Set new default
        await pool.query("UPDATE addresses SET is_default = TRUE WHERE address_id = $1 AND user_id = $2", [id, user_id]);

        res.json("Default address updated");
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

export default router;
