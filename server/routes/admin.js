import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import authorization from '../middleware/authorization.js';
import adminAuthorization from '../middleware/adminAuthorization.js';
import { sendEmail } from '../utils/emailService.js';

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
        const totalSales = await pool.query("SELECT SUM(total_amount) FROM orders WHERE status NOT IN ('cancelled', 'returned', 'pending')");

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

        // Check for notifications if stock > 0
        if (updatedProduct.rows.length > 0 && updatedProduct.rows[0].stock_quantity > 0) {
            const productId = updatedProduct.rows[0].product_id;
            const productName = updatedProduct.rows[0].name;
            
            const notifications = await pool.query("SELECT email FROM product_notifications WHERE product_id = $1", [productId]);
            
            if (notifications.rows.length > 0) {
                const subject = `Back in Stock: ${productName}`;
                const message = `Great news! The item "${productName}" is back in stock at 4th-street.\n\nVisit our store to purchase it now before it runs out again!`;
                
                notifications.rows.forEach(sub => {
                    sendEmail(sub.email, subject, message).catch(e => console.error(`Failed to notify ${sub.email}:`, e.message));
                });

                await pool.query("DELETE FROM product_notifications WHERE product_id = $1", [productId]);
            }
        }

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
            "SELECT o.order_id, o.total_amount, o.status, o.points_redeemed, o.created_at, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.user_id ORDER BY o.created_at DESC"
        );
        res.json(orders.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// UPDATE an order status
router.put('/orders/:id/status', authorization, adminAuthorization, async (req, res) => {
    try {
        if (!await hasPermission(req.user.id, 'processOrders')) {
            return res.status(403).json("Access Denied: Process Orders permission required");
        }

        const { id } = req.params;
        const { status } = req.body;

        const updatedOrder = await pool.query(
            "UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *",
            [status, id]
        );

        if (updatedOrder.rows.length === 0) {
            return res.status(404).json("Order not found");
        }

        // Send email notification about status change
        const userData = await pool.query("SELECT email, name FROM users WHERE user_id = $1", [updatedOrder.rows[0].user_id]);
        if (userData.rows.length > 0) {
            const { email, name } = userData.rows[0];
            const subject = `Your Order #${id} has been ${status}!`;
            const message = `Hello ${name},\n\nGreat news! Your order #${id} has been updated to: ${status.toUpperCase()}.\n\n` +
                          (status === 'shipped' ? 'You can track your package soon. We will send another notification with tracking details.\n\n' : '') +
                          `Thank you for shopping with us!\n\n- The 4th-street Team`;
            await sendEmail(email, subject, message);
        }

        res.json(updatedOrder.rows[0]);
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

        const { startDate, endDate } = req.query;

        // 1. Sales last 30 days (grouped by day)
        const salesData = await pool.query(`
            WITH date_series AS (
              SELECT generate_series($1::date, $2::date, '1 day'::interval)::date as date
            )
            SELECT 
                TO_CHAR(ds.date, 'YYYY-MM-DD') as date,
                COALESCE(SUM(o.total_amount), 0) as total
            FROM 
                date_series ds
            LEFT JOIN 
                orders o ON ds.date = o.created_at::date AND o.status NOT IN ('cancelled', 'returned', 'pending')
            GROUP BY 
                ds.date
            ORDER BY 
                ds.date ASC
        `, [startDate, endDate]);

        // 2. Top 5 Selling Products
        const topProducts = await pool.query(`
            SELECT p.product_id, p.name, p.image_url, p.price, p.sale_price, SUM(oi.quantity) as sold
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            GROUP BY p.product_id, p.name, p.image_url, p.price, p.sale_price
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

// GET ALL RETURNS
router.get('/returns', authorization, adminAuthorization, async (req, res) => {
    try {
        if (!await hasPermission(req.user.id, 'processOrders')) return res.status(403).json("Access Denied: Process Orders permission required");
        
        const returns = await pool.query(`
            SELECT r.*, o.total_amount, u.name as user_name, u.email as user_email 
            FROM returns r 
            JOIN orders o ON r.order_id = o.order_id 
            JOIN users u ON r.user_id = u.user_id 
            ORDER BY r.created_at DESC
        `);
        res.json(returns.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// UPDATE RETURN STATUS
router.put('/returns/:id', authorization, adminAuthorization, async (req, res) => {
    try {
        if (!await hasPermission(req.user.id, 'processOrders')) return res.status(403).json("Access Denied: Process Orders permission required");

        const { id } = req.params; // return_id
        const { status } = req.body; // approved, rejected, completed

        await pool.query('BEGIN');

        const updatedReturn = await pool.query(
            "UPDATE returns SET status = $1 WHERE return_id = $2 RETURNING *",
            [status, id]
        );

        if (updatedReturn.rows.length === 0) {
             await pool.query('ROLLBACK');
             return res.status(404).json("Return not found");
        }

        const orderId = updatedReturn.rows[0].order_id;

        // If return is completed, adjust loyalty points
        if (status === 'completed') {
            const orderRes = await pool.query("SELECT user_id, points_redeemed, points_earned FROM orders WHERE order_id = $1", [orderId]);
            if (orderRes.rows.length > 0) {
                const { user_id, points_redeemed, points_earned } = orderRes.rows[0];
                let pointsAdjustment = 0;

                // Give back points they spent
                if (points_redeemed > 0) {
                    pointsAdjustment += points_redeemed;
                }
                // Take back points they earned
                if (points_earned > 0) {
                    pointsAdjustment -= points_earned;
                }

                if (pointsAdjustment !== 0) {
                    await pool.query("UPDATE users SET loyalty_points = GREATEST(0, COALESCE(loyalty_points, 0) + $1) WHERE user_id = $2", [pointsAdjustment, user_id]);
                }
            }
        }

        // Sync order status based on return status
        let orderStatus = 'return_requested';
        if (status === 'approved') orderStatus = 'return_approved';
        if (status === 'rejected') orderStatus = 'delivered'; 
        if (status === 'completed') orderStatus = 'returned';

        await pool.query("UPDATE orders SET status = $1 WHERE order_id = $2", [orderStatus, orderId]);

        // Send Email Notification
        const returnData = await pool.query(`
            SELECT u.email, u.name 
            FROM returns r 
            JOIN users u ON r.user_id = u.user_id 
            WHERE r.return_id = $1
        `, [id]);

        if (returnData.rows.length > 0) {
            const { email, name } = returnData.rows[0];
            const subject = `Return Request Update (Order #${orderId})`;
            let message = `Hello ${name},\n\nYour return request for Order #${orderId} has been updated to: ${status.toUpperCase()}.`;

            if (status === 'approved') {
                message += `\n\nNEXT STEPS:\nPlease pack your items securely and ship them to:\n\n4th-street Returns Dept.\n123 Fashion Ave\nNew York, NY 10012\n\nPlease include your Return ID #${id} inside the package.`;
            } else if (status === 'completed') {
                message += `\n\nWe have received your return. Your refund/exchange has been processed.`;
            }
            await sendEmail(email, subject, message);
        }

        await pool.query('COMMIT');
        res.json("Return status updated");
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

// RESTOCK RETURNED ITEMS
router.post('/returns/:id/restock', authorization, adminAuthorization, async (req, res) => {
    try {
        // Check permission (using manageProducts as it affects inventory)
        if (!await hasPermission(req.user.id, 'manageProducts')) return res.status(403).json("Access Denied: Manage Products permission required");

        const { id } = req.params; // return_id

        await pool.query('BEGIN');

        // Get order_id from return
        const returnRecord = await pool.query("SELECT order_id FROM returns WHERE return_id = $1", [id]);
        if (returnRecord.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json("Return not found");
        }
        const orderId = returnRecord.rows[0].order_id;

        // Get items to restock
        const orderItems = await pool.query("SELECT product_id, quantity, size FROM order_items WHERE order_id = $1", [orderId]);

        for (const item of orderItems.rows) {
            // 1. Update total stock quantity
            await pool.query(
                "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE product_id = $2",
                [item.quantity, item.product_id]
            );

            // 2. Update specific size stock if applicable
            if (item.size) {
                const productRes = await pool.query("SELECT sizes FROM products WHERE product_id = $1", [item.product_id]);
                if (productRes.rows.length > 0) {
                    let sizes = productRes.rows[0].sizes;
                    // Ensure sizes is an array (handle potential string/json differences)
                    if (typeof sizes === 'string') sizes = JSON.parse(sizes);
                    if (!Array.isArray(sizes)) sizes = [];

                    const sizeIndex = sizes.findIndex(s => s.size === item.size);
                    if (sizeIndex > -1) {
                        sizes[sizeIndex].stock = parseInt(sizes[sizeIndex].stock || 0) + item.quantity;
                        
                        await pool.query(
                            "UPDATE products SET sizes = $1 WHERE product_id = $2",
                            [JSON.stringify(sizes), item.product_id]
                        );
                    }
                }
            }

            // Check notifications for this product
            const productInfo = await pool.query("SELECT name FROM products WHERE product_id = $1", [item.product_id]);
            const productName = productInfo.rows[0]?.name || "Item";

            const notifications = await pool.query("SELECT email FROM product_notifications WHERE product_id = $1", [item.product_id]);
            
            if (notifications.rows.length > 0) {
                const subject = `Back in Stock: ${productName}`;
                const message = `Great news! The item "${productName}" is back in stock at 4th-street.\n\nVisit our store to purchase it now before it runs out again!`;
                
                notifications.rows.forEach(sub => {
                    sendEmail(sub.email, subject, message).catch(e => console.error(`Failed to notify ${sub.email}:`, e.message));
                });

                await pool.query("DELETE FROM product_notifications WHERE product_id = $1", [item.product_id]);
            }
        }

        await pool.query('COMMIT');
        res.json("Items restocked successfully");
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json("Server Error: " + err.message);
    }
});

export default router;