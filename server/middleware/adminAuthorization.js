import pool from '../db.js';

export default async (req, res, next) => {
  try {
    // req.user.id was set by the previous 'authorization' middleware
    console.log("Admin Middleware: Checking status for User ID:", req.user.id);

    const user = await pool.query("SELECT email, is_admin FROM users WHERE user_id = $1", [req.user.id]);
    
    if (user.rows.length === 0 || !user.rows[0].is_admin) {
      if (user.rows.length > 0) {
        console.log(`Admin Middleware: User ${user.rows[0].email} is NOT an admin.`);
      } else {
        console.log("Admin Middleware: User not found in DB.");
      }
      return res.status(403).json("Access Denied: Admins only");
    }
    
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
};