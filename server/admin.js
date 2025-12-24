import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import authorization from '../middleware/authorization.js';
import adminAuthorization from '../middleware/adminAuthorization.js';

const router = express.Router();

// Helper: Check Permission
const hasPermission = async (userId, permissionKey) => {
    const result = await pool.query(
        "SELECT u.is_super_admin, r.permissions FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = $1",
        [userId]
    );
    if (result.rows.length === 0) return false;
    const { is_super_admin, permissions } = result.rows[0];
    if (is_super_admin) return true;
    return permissions && permissions[permissionKey] === true;
};

// GET Admin Stats
router.get('/stats', authorization, adminAuthorization, async (req, res) => {
    try {
        if (!await hasPermission(req.user.id, 'viewReports')) return res.status(403).json("Access Denied: View Reports permission required");

        const userCount = await pool.query("SELECT COUNT(*) FROM users");
        const orderCount = await pool.query("SELECT COUNT(*) FROM orders");
        const productCount = await pool.query("SELECT COUNT(*) FROM products");
        const totalSales = await pool.query("SELECT SUM(total_amount) FROM orders WHERE status = 'paid'");

        res.json({
            users: userCount.rows[0].count,
            orders: orderCount.rows[0].count,
            products: productCount.rows[0].count,
            sales: totalSales.rows[0].sum || 0
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// CREATE a product
router.post('/products', authorization, adminAuthorization, async (req, res) => {
    try {
        if (!await hasPermission(req.user.id, 'manageProducts')) return res.status(403).json("Access Denied: Manage Products permission required");

        const { name, description, price, sale_price, stock_quantity, category, image_url, images, sizes } = req.body;
        const newProduct = await pool.query(
            "INSERT INTO products (name, description, price, sale_price, stock_quantity, category, image_url, images, sizes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
            [name, description, price, sale_price || null, stock_quantity, category, image_url, JSON.stringify(images || []), JSON.stringify(sizes || [])]
        );
        res.json(newProduct.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// UPDATE a product
router.put('/products/:id', authorization, adminAuthorization, async (req, res) => {
    try {
        if (!await hasPermission(req.user.id, 'manageProducts')) return res.status(403).json("Access Denied: Manage Products permission required");

        const { id } = req.params;
        const { name, description, price, sale_price, stock_quantity, category, image_url, images, sizes } = req.body;
        const updatedProduct = await pool.query(
            "UPDATE products SET name = $1, description = $2, price = $3, sale_price = $4, stock_quantity = $5, category = $6, image_url = $7, images = $8, sizes = $9 WHERE product_id = $10 RETURNING *",
            [name, description, price, sale_price || null, stock_quantity, category, image_url, JSON.stringify(images || []), JSON.stringify(sizes || []), id]
        );
        res.json(updatedProduct.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// DELETE a product
router.delete('/products/:id', authorization, adminAuthorization, async (req, res) => {
    try {
        if (!await hasPermission(req.user.id, 'deleteProducts')) return res.status(403).json("Access Denied: Delete Products permission required");

        const { id } = req.params;
        await pool.query("DELETE FROM products WHERE product_id = $1", [id]);
        res.json("Product was deleted.");
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// GET all orders (Admin)
router.get('/orders', authorization, adminAuthorization, async (req, res) => {
    try {
        if (!await hasPermission(req.user.id, 'processOrders')) return res.status(403).json("Access Denied: Process Orders permission required");

        const orders = await pool.query(
            "SELECT o.order_id, o.total_amount, o.status, o.created_at, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.user_id ORDER BY o.created_at DESC"
        );
        res.json(orders.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// GET all customers (Admin)
router.get('/customers', authorization, adminAuthorization, async (req, res) => {
    try {
        const customers = await pool.query(
            "SELECT u.user_id, u.name, u.email, u.created_at, u.is_admin, u.is_super_admin, u.role_id, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.role_id ORDER BY u.created_at DESC"
        );
        res.json(customers.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// CREATE a new customer/user (Admin)
router.post('/customers', authorization, adminAuthorization, async (req, res) => {
    try {
        const { name, email, password, role_id } = req.body;

        // Check if user exists
        const userExist = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExist.rows.length > 0) {
            return res.status(401).json("User already exists");
        }

        // Hash password
        const saltRound = 10;
        const salt = await bcrypt.genSalt(saltRound);
        const bcryptPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            "INSERT INTO users (name, email, password_hash, role_id, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, role_id, is_admin",
            [name, email, bcryptPassword, role_id || null, role_id ? true : false]
        );

        res.json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// GET single customer details (Admin)
router.get('/customers/:id', authorization, adminAuthorization, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get user details
        const user = await pool.query(
            "SELECT u.user_id, u.name, u.email, u.phone_number, u.created_at, u.is_admin, u.is_super_admin, u.admin_notes, u.role_id, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = $1",
            [id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json("Customer not found");
        }

        // Get user orders
        const orders = await pool.query(
            "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
            [id]
        );

        res.json({ customer: user.rows[0], orders: orders.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// UPDATE customer details
router.put('/customers/:id', authorization, adminAuthorization, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone_number, role_id, is_admin } = req.body;
        
        const updatedUser = await pool.query(
            "UPDATE users SET name = $1, email = $2, phone_number = $3, role_id = $4, is_admin = CASE WHEN is_super_admin THEN TRUE ELSE (CASE WHEN $4::int IS NOT NULL THEN TRUE ELSE $5 END) END WHERE user_id = $6 RETURNING *",
            [name, email, phone_number, role_id || null, is_admin || false, id]
        );

        if (updatedUser.rows.length === 0) {
            return res.status(404).json("Customer not found");
        }

        res.json(updatedUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// UPDATE customer role only
router.put('/customers/:id/role', authorization, adminAuthorization, async (req, res) => {
    try {
        const { id } = req.params;
        const { role_id } = req.body;
        
        await pool.query(
            "UPDATE users SET role_id = $1, is_admin = CASE WHEN $1::int IS NOT NULL THEN TRUE ELSE (CASE WHEN is_super_admin THEN TRUE ELSE FALSE END) END WHERE user_id = $2",
            [role_id, id]
        );

        res.json("Role updated");
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// RESET customer password
router.put('/customers/:id/reset-password', authorization, adminAuthorization, async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        
        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);

        await pool.query(
            "UPDATE users SET password_hash = $1 WHERE user_id = $2",
            [bcryptPassword, id]
        );

        res.json("Password reset successfully");
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// UPDATE customer notes
router.put('/customers/:id/notes', authorization, adminAuthorization, async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        const updatedUser = await pool.query(
            "UPDATE users SET admin_notes = $1 WHERE user_id = $2 RETURNING user_id, admin_notes",
            [notes, id]
        );

        if (updatedUser.rows.length === 0) {
            return res.status(404).json("Customer not found");
        }
        res.json(updatedUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// GET all promotions
router.get('/promotions', authorization, adminAuthorization, async (req, res) => {
    try {
        const promotions = await pool.query("SELECT * FROM promotions ORDER BY promotion_id DESC");
        res.json(promotions.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// CREATE a promotion
router.post('/promotions', authorization, adminAuthorization, async (req, res) => {
    try {
        const { code, type, value, is_active } = req.body;
        const newPromo = await pool.query(
            "INSERT INTO promotions (code, type, value, is_active) VALUES ($1, $2, $3, $4) RETURNING *",
            [code, type, value, is_active]
        );
        res.json(newPromo.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// UPDATE a promotion
router.put('/promotions/:id', authorization, adminAuthorization, async (req, res) => {
    try {
        const { id } = req.params;
        const { code, type, value, is_active } = req.body;
        await pool.query(
            "UPDATE promotions SET code = $1, type = $2, value = $3, is_active = $4 WHERE promotion_id = $5",
            [code, type, value, is_active, id]
        );
        res.json("Promotion updated.");
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// DELETE a promotion
router.delete('/promotions/:id', authorization, adminAuthorization, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM promotions WHERE promotion_id = $1", [id]);
        res.json("Promotion deleted.");
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// GET Analytics Data (Sales & Top Products)
router.get('/analytics', authorization, adminAuthorization, async (req, res) => {
    try {
        if (!await hasPermission(req.user.id, 'viewReports')) return res.status(403).json("Access Denied: View Reports permission required");

        // 1. Sales last 30 days (grouped by day)
        const salesData = await pool.query(`
            SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, SUM(total_amount) as total
            FROM orders
            WHERE status = 'paid'
            GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
            ORDER BY date ASC
            LIMIT 30
        `);

        // 2. Top 5 Selling Products
        const topProducts = await pool.query(`
            SELECT p.name, SUM(oi.quantity) as sold
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            GROUP BY p.product_id, p.name
            ORDER BY sold DESC
            LIMIT 5
        `);

        res.json({ sales: salesData.rows, topProducts: topProducts.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// GET Store Settings
router.get('/settings', authorization, adminAuthorization, async (req, res) => {
    try {
        const settings = await pool.query("SELECT * FROM store_settings WHERE id = 1");
        if (settings.rows.length === 0) {
             // Initialize if missing (fallback)
             const newSettings = await pool.query("INSERT INTO store_settings (id) VALUES (1) RETURNING *");
             return res.json(newSettings.rows[0]);
        }
        res.json(settings.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// UPDATE Store Settings
router.put('/settings', authorization, adminAuthorization, async (req, res) => {
    try {
        const { store_name, contact_email, currency, tax_rate, shipping_fee, tiktok_url, instagram_url, twitter_url } = req.body;
        
        // Try to update existing settings
        let result = await pool.query(
            "UPDATE store_settings SET store_name = $1, currency = $2, tax_rate = $3, shipping_fee = $4, contact_email = $5, tiktok_url = $6, instagram_url = $7, twitter_url = $8 WHERE id = 1 RETURNING *",
            [store_name, currency, tax_rate, shipping_fee, contact_email, tiktok_url, instagram_url, twitter_url]
        );

        // If no row existed to update, insert a new one
        if (result.rows.length === 0) {
            result = await pool.query("INSERT INTO store_settings (id, store_name, currency, tax_rate, shipping_fee, contact_email, tiktok_url, instagram_url, twitter_url) VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8) RETURNING *", [store_name, currency, tax_rate, shipping_fee, contact_email, tiktok_url, instagram_url, twitter_url]);
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

export default router;
