import express from 'express';
import pool from '../db.js';
import { sendEmail } from '../utils/emailService.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Fetch admin email from settings
        const settings = await pool.query("SELECT contact_email FROM store_settings WHERE id = 1");
        const adminEmail = settings.rows[0]?.contact_email || process.env.EMAIL_USER;

        if (!adminEmail) {
            return res.status(500).json("Admin contact email is not configured.");
        }

        const subject = `New Contact Inquiry from ${name}`;
        const emailBody = `You have a new message from your website's contact form:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;

        await sendEmail(adminEmail, subject, emailBody);

        res.json("Thank you for your message. We will get back to you shortly.");
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error");
    }
});

export default router;