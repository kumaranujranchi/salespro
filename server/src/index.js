import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import tenantRoutes from './routes/tenants.js';
import profileRoutes from './routes/profiles.js';
import leadRoutes from './routes/leads.js';
import saleRoutes from './routes/sales.js';
import projectRoutes from './routes/projects.js';
import siteVisitRoutes from './routes/site_visits.js';
import targetRoutes from './routes/targets.js';
import miscRoutes from './routes/misc.js';
import subscriptionRoutes from './routes/subscriptions.js';
import { pool } from './db/index.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors({
  origin: '*', // Allow frontend domain (CloudFront / S3 / localhost)
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check endpoint (Crucial for AWS ALB / App Runner / ECS health monitoring)
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'healthy', database: 'connected', timestamp: new Date() });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: err.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/site-visits', siteVisitRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/misc', miscRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 RealSalePro API Server running on port ${PORT}`);
  console.log(`📡 Health check available at http://localhost:${PORT}/health`);
});
