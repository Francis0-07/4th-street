import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET Public Store Settings
router.get('/', async (req, res) => {
  try {
    const settings = await pool.query("SELECT * FROM store_settings WHERE id = 1");
    if (settings.rows.length === 0) {
         return res.json({});
    }
    res.json(settings.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

export default router;