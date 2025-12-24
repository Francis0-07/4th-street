import express from 'express';
import pool from '../db.js';
import authorization from '../middleware/authorization.js';
import adminAuthorization from '../middleware/adminAuthorization.js';

const router = express.Router();

// GET all roles
router.get('/', authorization, adminAuthorization, async (req, res) => {
  try {
    const roles = await pool.query("SELECT * FROM roles ORDER BY role_id ASC");
    res.json(roles.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error: " + err.message);
  }
});

// CREATE a new role
router.post('/', authorization, adminAuthorization, async (req, res) => {
  try {
    // Check Super Admin
    const userCheck = await pool.query("SELECT is_super_admin FROM users WHERE user_id = $1", [req.user.id]);
    if (!userCheck.rows[0].is_super_admin) {
        return res.status(403).json("Access Denied: Only Super Admins can create roles.");
    }

    const { name, description, permissions } = req.body;
    const newRole = await pool.query(
      "INSERT INTO roles (name, description, permissions) VALUES ($1, $2, $3) RETURNING *",
      [name, description, permissions]
    );
    res.json(newRole.rows[0]);
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') {
        return res.status(400).json(`Role name "${req.body.name}" already exists`);
    }
    res.status(500).json("Server Error: " + err.message);
  }
});

// UPDATE a role (Permissions, Name, Description)
router.put('/:id', authorization, adminAuthorization, async (req, res) => {
  try {
    // Check Super Admin
    const userCheck = await pool.query("SELECT is_super_admin FROM users WHERE user_id = $1", [req.user.id]);
    if (!userCheck.rows[0].is_super_admin) {
        return res.status(403).json("Access Denied: Only Super Admins can update roles.");
    }

    const { id } = req.params;
    const { name, description, permissions } = req.body;
    
    const updatedRole = await pool.query(
      "UPDATE roles SET name = $1, description = $2, permissions = $3 WHERE role_id = $4 RETURNING *",
      [name, description, permissions, id]
    );
    
    if (updatedRole.rows.length === 0) {
      return res.status(404).json("Role not found");
    }

    res.json(updatedRole.rows[0]);
  } catch (err) {
    console.error(err.message);
    if (err.code === '23505') {
        return res.status(400).json(`Role name "${req.body.name}" already exists`);
    }
    res.status(500).json("Server Error: " + err.message);
  }
});

// DELETE a role
router.delete('/:id', authorization, adminAuthorization, async (req, res) => {
  try {
    // Check Super Admin
    const userCheck = await pool.query("SELECT is_super_admin FROM users WHERE user_id = $1", [req.user.id]);
    if (!userCheck.rows[0].is_super_admin) {
        return res.status(403).json("Access Denied: Only Super Admins can delete roles.");
    }

    const { id } = req.params;
    
    // Unassign users from this role first to avoid foreign key constraint violation
    await pool.query(
      "UPDATE users SET role_id = NULL, is_admin = CASE WHEN is_super_admin THEN TRUE ELSE FALSE END WHERE role_id = $1", 
      [id]
    );

    await pool.query("DELETE FROM roles WHERE role_id = $1", [id]);
    res.json("Role deleted");
  } catch (err) {
    console.error(err.message);
    res.status(500).json("Server Error: " + err.message);
  }
});

export default router;