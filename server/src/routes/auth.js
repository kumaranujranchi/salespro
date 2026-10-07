import { Router } from 'express';
import { query } from '../db/index.js';
import bcrypt from 'bcryptjs';

const router = Router();

// 1. Sign In / Authentication
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await query(
      `SELECT p.*, t.name as tenant_name, t.slug as tenant_slug, t.settings as tenant_settings, t.subscription_status
       FROM profiles p
       LEFT JOIN tenants t ON p.tenant_id = t.id
       WHERE LOWER(p.email) = LOWER($1) AND p.is_active = true
       LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password if set
    if (password) {
      if (user.password_hash) {
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match && user.password_hash !== password && user.password !== password) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }
      } else if (user.password && user.password !== password) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    }

    // Auto promote designated admin
    if (user.email === 'admin@realsalepro.com' && user.role !== 'platform_admin') {
      await query(`UPDATE profiles SET role = 'platform_admin' WHERE id = $1`, [user.id]);
      user.role = 'platform_admin';
    }

    // Map fields for client compatibility
    const profile = {
      ...user,
      _id: user.id,
      userId: user.user_id || user.email,
      password: user.password,
    };

    return res.json({ profile });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Get Profile by userId or email
router.get('/profile', async (req, res) => {
  try {
    const { userId, email } = req.query;
    if (!userId && !email) {
      return res.status(400).json({ error: 'userId or email is required' });
    }

    let result;
    if (userId) {
      result = await query(
        `SELECT p.*, t.name as tenant_name, t.slug as tenant_slug, t.settings as tenant_settings, t.subscription_status
         FROM profiles p
         LEFT JOIN tenants t ON p.tenant_id = t.id
         WHERE (p.user_id = $1 OR LOWER(p.email) = LOWER($1))
         LIMIT 1`,
        [userId]
      );
    } else {
      result = await query(
        `SELECT p.*, t.name as tenant_name, t.slug as tenant_slug, t.settings as tenant_settings, t.subscription_status
         FROM profiles p
         LEFT JOIN tenants t ON p.tenant_id = t.id
         WHERE LOWER(p.email) = LOWER($1)
         LIMIT 1`,
        [email]
      );
    }

    if (result.rows.length === 0) {
      return res.json(null);
    }

    const user = result.rows[0];
    return res.json({
      ...user,
      _id: user.id,
      userId: user.user_id || user.email,
      password: user.password,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// 3. Promote to Platform Admin
router.post('/promote', async (req, res) => {
  try {
    const { email } = req.body;
    await query(`UPDATE profiles SET role = 'platform_admin' WHERE LOWER(email) = LOWER($1)`, [email]);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to promote user' });
  }
});

export default router;
