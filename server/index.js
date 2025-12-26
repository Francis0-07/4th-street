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
