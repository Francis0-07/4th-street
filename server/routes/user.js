import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import authorization from '../middleware/authorization.js';

const router = express.Router();

router.get('/', authorization, async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.phone_number, u.created_at, u.is_admin, u.is_super_admin, u.loyalty_points, r.permissions 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.role_id 
       WHERE u.user_id = $1`, 
      [req.user.id]
    );
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

// UPDATE user profile
router.put('/', authorization, async (req, res) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;

    // Password change request
    if (currentPassword && newPassword) {
      const user = await pool.query("SELECT password_hash FROM users WHERE user_id = $1", [req.user.id]);
      const validPassword = await bcrypt.compare(currentPassword, user.rows[0].password_hash);

      if (!validPassword) {
        return res.status(401).json("Incorrect current password");
      }

      const saltRound = 10;
      const salt = await bcrypt.genSalt(saltRound);
      const bcryptPassword = await bcrypt.hash(newPassword, salt);

      await pool.query(
        "UPDATE users SET password_hash = $1 WHERE user_id = $2 RETURNING user_id, name, email, phone_number, created_at",
        [bcryptPassword, req.user.id]
      );
      return res.json("Password updated successfully");
    }

    // Name/Phone update
    const updateUser = await pool.query(
      "UPDATE users SET name = $1, phone_number = $2 WHERE user_id = $3 RETURNING user_id, name, email, phone_number, created_at",
      [name, phone, req.user.id]

    );
    res.json(updateUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

// GET Points History
router.get('/points-history', authorization, async (req, res) => {
  try {
    const history = await pool.query(`
      SELECT order_id, created_at, points_earned, points_redeemed, status
      FROM orders 
      WHERE user_id = $1 AND (points_earned > 0 OR points_redeemed > 0)
      ORDER BY created_at DESC
    `, [req.user.id]);

    const transactions = history.rows.map(order => {
      const items = [];
      if (order.points_earned > 0 && order.status !== 'returned') items.push({ type: 'earned', amount: order.points_earned, date: order.created_at, orderId: order.order_id });
      if (order.points_redeemed > 0 && order.status !== 'returned') items.push({ type: 'redeemed', amount: -order.points_redeemed, date: order.created_at, orderId: order.order_id });
      if (order.status === 'returned' && order.points_redeemed > 0) items.push({ type: 'refunded', amount: order.points_redeemed, date: order.created_at, orderId: order.order_id });
      return items;
    }).flat().sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

export default router;