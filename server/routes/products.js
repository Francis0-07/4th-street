import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET all products (Supports filtering by category and sorting)
// Example: /products?category=Suits&sort=price_asc
router.get('/', async (req, res) => {
  try {
    const { category, sort, search, limit, exclude } = req.query;
    
    let queryText = 'SELECT * FROM products';
    const queryParams = [];
    let whereClause = [];

    // 1. Filter by Category
    if (category) {
      if (category === 'Clothing') {
        whereClause.push(`(category = $${queryParams.length + 1} OR category = 'Suits' OR category = 'Shirts' OR category = 'Pants' OR category = 'Jackets')`);
        queryParams.push(category);
      } else {
        whereClause.push(`category = $${queryParams.length + 1}`);
        queryParams.push(category);
      }
    }

    // 2. Filter by Search (Name or Description)
    if (search) {
      whereClause.push(`(name ILIKE $${queryParams.length + 1} OR description ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${search}%`);
    }

    // 3. Exclude products
    if (exclude) {
      const excludeIds = exclude.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (excludeIds.length > 0) {
        const placeholders = excludeIds.map((_, i) => `$${queryParams.length + i + 1}`).join(',');
        whereClause.push(`product_id NOT IN (${placeholders})`);
        queryParams.push(...excludeIds);
      }
    }

    if (whereClause.length > 0) {
      queryText += ' WHERE ' + whereClause.join(' AND ');
    }

    // 2. Sort Results
    if (sort === 'price_asc') {
      queryText += ' ORDER BY price ASC';
    } else if (sort === 'price_desc') {
      queryText += ' ORDER BY price DESC';
    } else if (sort === 'newest') {
      queryText += ' ORDER BY created_at DESC';
    } else {
      queryText += ' ORDER BY product_id ASC'; // Default sort
    }

    // 4. Limit results
    if (limit) {
      queryText += ` LIMIT $${queryParams.length + 1}`;
      queryParams.push(parseInt(limit));
    }

    const products = await pool.query(queryText, queryParams);
    res.json(products.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await pool.query('SELECT * FROM products WHERE product_id = $1', [id]);

    if (product.rows.length === 0) {
      return res.status(404).json('Product not found');
    }

    res.json(product.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
