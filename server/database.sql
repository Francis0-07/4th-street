-- 1. Create the Database (Run this line first separately if needed)
-- CREATE DATABASE fourth_street_db;

-- Drop tables if they exist to prevent "relation already exists" errors on re-run
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS store_settings CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- 1. Roles Table (Moved up to be referenced by Users)
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table (Supports Auth and Admin roles)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    admin_notes TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_super_admin BOOLEAN DEFAULT FALSE,
    loyalty_points INTEGER DEFAULT 0,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    role_id INTEGER REFERENCES roles(role_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products Table (Supports your Grid Layout & Details)
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    category VARCHAR(100),
    image_url TEXT, -- URL to the image
    images JSONB DEFAULT '[]', -- Array of additional image URLs
    sizes JSONB DEFAULT '[]', -- Array of { size: "S", stock: 10 }
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Cart Items (Temporary storage before order)
CREATE TABLE cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    size VARCHAR(50),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Promotions Table
CREATE TABLE promotions (
    promotion_id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
    value DECIMAL(10, 2) NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 6. Store Settings (Global Config)
CREATE TABLE store_settings (
    id SERIAL PRIMARY KEY,
    store_name VARCHAR(255) DEFAULT '4th-street',
    contact_email VARCHAR(255),
    currency VARCHAR(10) DEFAULT 'NGN',
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    shipping_fee DECIMAL(10, 2) DEFAULT 0.00,
    tiktok_url VARCHAR(255),
    instagram_url VARCHAR(255),
    twitter_url VARCHAR(255)
);

-- 7. Orders Table (Supports Order History & Admin Management)
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, shipped, delivered, cancelled
    shipping_address JSONB, -- Stores address snapshot
    points_redeemed INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    payment_reference VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Order Items (Links Products to Orders)
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    product_id INTEGER REFERENCES products(product_id),
    quantity INTEGER NOT NULL,
    size VARCHAR(50),
    price_at_purchase DECIMAL(10, 2) NOT NULL
);

-- 9. Reviews (Supports Product Detail Page reviews)
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Wishlist Table
CREATE TABLE wishlist (
    wishlist_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- 11. Addresses Table
CREATE TABLE addresses (
    address_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    full_name VARCHAR(100),
    address_line1 VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Returns Table
CREATE TABLE returns (
    return_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    user_id INTEGER REFERENCES users(user_id),
    reason VARCHAR(50),
    comments TEXT,
    resolution VARCHAR(50), -- 'refund' or 'exchange'
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Product Notifications (Back in Stock Alerts)
CREATE TABLE product_notifications (
    notification_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email, product_id)
);
