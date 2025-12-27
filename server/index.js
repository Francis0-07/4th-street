import express from 'express';
import cors from 'cors';
import pool from './db.js';
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import cartRouter from './routes/cart.js';
import ordersRouter from './routes/orders.js';
import adminRouter from './routes/admin.js';
import userRouter from './routes/user.js';
import wishlistRouter from './routes/wishlist.js';
import addressesRouter from './routes/addresses.js';
import rolesRouter from './routes/roles.js';
import settingsRouter from './routes/settings.js';
import contactRouter from './routes/contact.js';
import webhookRouter from './routes/webhook.js';
import notificationsRouter from './routes/notifications.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ 
  limit: '200mb',
  verify: (req, res, buf) => { req.rawBody = buf } 
}));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Routes
app.use('/auth', authRouter);
app.use('/products', productsRouter);
app.use('/cart', cartRouter);
app.use('/orders', ordersRouter);
app.use('/admin', adminRouter);
app.use('/user', userRouter);
app.use('/wishlist', wishlistRouter);
app.use('/addresses', addressesRouter);
app.use('/roles', rolesRouter);
app.use('/settings', settingsRouter);
app.use('/contact', contactRouter);
app.use('/webhook', webhookRouter);
app.use('/notifications', notificationsRouter);

// Test Route
app.get('/', (req, res) => {
  res.send('4th-street API is running');
});

// Safe Environment Check (Returns true/false, not the actual secrets)
app.get('/env-check', (req, res) => {
  res.json({
    status: 'active',
    has_database_url: !!process.env.DATABASE_URL,
    has_jwt_secret: !!process.env.JWT_SECRET,
    has_paystack_key: !!process.env.PAYSTACK_SECRET_KEY,
    has_email_user: !!process.env.EMAIL_USER
  });
});

// Database Setup Route (Run this once to create tables)
app.get('/setup-db', async (req, res) => {
  try {
    const sqlPath = path.join(__dirname, 'database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    res.send("Database setup completed successfully! Tables created. You can now register and add products.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error setting up database: " + err.message);
  }
});

// Make User Admin Route
app.get('/make-admin', async (req, res) => {
  const email = req.query.email || 'Akposace65@gmail.com';

  try {
    const result = await pool.query(
      "UPDATE users SET is_admin = TRUE, is_super_admin = TRUE WHERE email = $1 RETURNING *",
      [email]
    );
    if (result.rows.length > 0) {
      res.send(`Success! User ${email} is now a Super Admin. Please log out and log back in to see admin features.`);
    } else {
      res.status(404).send(`User with email '${email}' not found. Please ensure you have registered with this email first.`);
    }
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});

// Fix Database Schema Route (Run this to add missing columns)
app.get('/fix-db-schema', async (req, res) => {
  try {
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10, 2);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]';
      
      CREATE TABLE IF NOT EXISTS product_notifications (
        notification_id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email, product_id)
      );
    `);
    res.send("Database schema fixed! Missing columns (sale_price, stock_quantity, etc.) have been added.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fixing schema: " + err.message);
  }
});

// Database Connection Test
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Database Connected!', time: result.rows[0].now });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
