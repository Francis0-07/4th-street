import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import jwtGenerator from '../utils/jwtGenerator.js';
import { sendEmail } from '../utils/emailService.js';
import crypto from 'crypto';
import authorization from '../middleware/authorization.js';

const router = express.Router();

// REGISTER ROUTE
router.post('/register', async (req, res) => {
  try {
    // 1. Destructure the req.body (name, email, password)
    const { name, email, password, phone } = req.body;

    // 2. Check if user exists (if user exists then throw error)
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (user.rows.length > 0) {
      return res.status(401).json("User already exists");
    }

    // 3. Bcrypt the user password
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    // 4. Enter the new user inside our database
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password_hash, phone_number) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, bcryptPassword, phone]
    );

    // 5. Generating our jwt token
    const token = jwtGenerator(newUser.rows[0].user_id);

    res.json({ token });

  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error: " + err.message);
  }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    // 1. Destructure the req.body
    const { email, password } = req.body;

    // 2. Check if user doesn't exist (if not then we throw error)
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (user.rows.length === 0) {
      return res.status(401).json("Password or Email is incorrect");
    }

    // 3. Check if incoming password is the same the database password
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);

    if (!validPassword) {
      return res.status(401).json("Password or Email is incorrect");
    }

    // 4. Give them the jwt token
    const token = jwtGenerator(user.rows[0].user_id);

    res.json({ token });

  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error: " + err.message);
  }
});

// GOOGLE LOGIN ROUTE
router.post("/google-login", async (req, res) => {
    try {
        const { access_token } = req.body;

        // Use access token to get user info from Google
        const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        if (!googleResponse.ok) {
            const errorData = await googleResponse.text();
            console.error("Google userinfo error:", errorData);
            throw new Error('Failed to fetch user info from Google');
        }

        const { email, name } = await googleResponse.json();

        // Check if user exists
        let user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        // If user doesn't exist, create them
        if (user.rows.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const bcryptPassword = await bcrypt.hash(randomPassword, salt);
            const newUser = await pool.query(
                "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
                [name, email, bcryptPassword]
            );
            user = newUser;
        }

        // Generate JWT token
        const token = jwtGenerator(user.rows[0].user_id);
        res.json({ token });

    } catch (err) {
        console.error("Google Login Error:", err.message);
        res.status(500).json("Server Error during Google authentication");
    }
});

// FORGOT PASSWORD ROUTE
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (user.rows.length === 0) {
            // Don't reveal if user exists or not for security
            return res.json("If an account with that email exists, a password reset link has been sent.");
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour from now

        await pool.query(
            "UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3",
            [passwordResetToken, passwordResetExpires, email]
        );

        // In production, use your actual domain
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`; 
        const subject = "Your Password Reset Request";
        const message = `Hello ${user.rows[0].name},\n\nYou requested a password reset for your 4th-street account.\n\nPlease click the following link to set a new password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request a password reset, please ignore this email.\n\n- The 4th-street Team`;

        await sendEmail(email, subject, message);

        res.json("If an account with that email exists, a password reset link has been sent.");
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// RESET PASSWORD ROUTE
router.put('/reset-password/:token', async (req, res) => {
    try {
        const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
        const user = await pool.query(
            "SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()",
            [hashedToken]
        );

        if (user.rows.length === 0) {
            return res.status(400).json("Token is invalid or has expired");
        }

        const { password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);

        await pool.query(
            "UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE user_id = $2",
            [bcryptPassword, user.rows[0].user_id]
        );

        res.json("Password has been reset successfully.");
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// VERIFY ROUTE (Used by frontend to check if logged in on refresh)
router.get('/is-verify', authorization, async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT u.is_admin, u.is_super_admin, r.permissions 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.role_id 
       WHERE u.user_id = $1`, 
      [req.user.id]
    );
    
    const userData = user.rows[0];
    res.json({ 
      auth: true, 
      isAdmin: userData.is_admin,
      isSuperAdmin: userData.is_super_admin,
      permissions: userData.permissions || {}
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error");
  }
});

export default router;
