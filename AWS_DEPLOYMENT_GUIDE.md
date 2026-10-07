# 🚀 RealSalePro - AWS Production Deployment Guide (Node.js + PostgreSQL)

This architecture is optimized for **1,000 to 2,000+ active customers** with **zero per-IO fees**, fixed low monthly costs, and enterprise PostgreSQL database performance.

---

## 🏗️ Architecture Overview

```
[Users / Customers]
       │
       ▼
[AWS CloudFront CDN + S3 / Amplify] ──► (Instant Static Frontend Delivery, Zero Server Load)
       │
       ▼ (API Calls: /api/*)
[Node.js + Express REST API]         ──► (AWS App Runner / EC2 / Lightsail: Fixed $5-15/mo)
       │
       ▼ (Connection Pooling)
[PostgreSQL Database]               ──► (AWS RDS / Lightsail / Neon: Fixed $15-25/mo, Unlimited Queries)
```

- **Frontend:** React + Vite SPA (Hosted on AWS CloudFront + S3 or AWS Amplify).
- **Backend API:** Node.js + Express (`server/` directory, Port 5001).
- **Database:** PostgreSQL with full relational schema (`server/schema.sql`).
- **Cost:** Fixed **$20 – $35 / month** (₹2,000 – ₹3,000/mo), regardless of whether you have 100 or 2,000 customers!

---

## 🗄️ Step 1: PostgreSQL Database Setup

### Option A: AWS RDS PostgreSQL or AWS Lightsail Database
1. Open the **AWS RDS Console** (or **AWS Lightsail Databases** for flat $15/mo).
2. Create a PostgreSQL instance (PostgreSQL 16, db.t4g.micro or db.t4g.small).
3. Database Name: `salespro`, Master Username: `postgres`, Password: `your-password`.
4. Copy the connection endpoint:
   ```
   DATABASE_URL=postgresql://postgres:your-password@your-rds-endpoint.amazonaws.com:5432/salespro?sslmode=require
   ```

### Option B: Free Cloud PostgreSQL (Neon / Supabase / Aiven)
1. Create a free PostgreSQL database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
2. Copy the `DATABASE_URL` connection string.

### Run Database Migration & Initial Seed:
Once you have your `DATABASE_URL`:
```bash
# Set your DATABASE_URL in server/.env, then run:
npm run server:migrate
```
This automatically executes [`server/schema.sql`](file:///Users/anujkumarsingh/Downloads/salespro/server/schema.sql) and [`server/seed.sql`](file:///Users/anujkumarsingh/Downloads/salespro/server/seed.sql), creating all tables, indexes, default tenant (`SalesPro Core`), and Super Admin (`admin@realsalepro.com`).

---

## 🖥️ Step 2: Deploy Backend API on AWS

You can deploy the Node.js Express server using either **AWS App Runner** (automatic scaling & SSL) or **AWS Lightsail / EC2** (cheapest flat rate).

### Option A: AWS App Runner (Fastest & Fully Managed)
1. Open [AWS App Runner Console](https://console.aws.amazon.com/apprunner/).
2. Select **Source code repository** > Connect your GitHub repo (`salespro`).
3. Set **Build command**: `cd server && npm install`
4. Set **Start command**: `cd server && node src/index.js`
5. Set **Port**: `5001`
6. Add Environment Variables:
   - `DATABASE_URL`: (Your PostgreSQL URL)
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `your-secure-jwt-secret-key`
7. Click **Deploy**. App Runner will provide your API endpoint:
   `https://api-xyz.ap-south-1.awsapprunner.com`

### Option B: AWS Lightsail / EC2 ($5 - $10/mo Flat)
1. Launch an Ubuntu 24.04 instance.
2. Install Node.js 20 & Git:
   ```bash
   sudo apt update && sudo apt install -y nodejs npm git
   ```
3. Clone your repository:
   ```bash
   git clone https://github.com/kumaranujranchi/salespro.git
   cd salespro/server
   npm install
   ```
4. Setup PM2 for zero-downtime process management:
   ```bash
   sudo npm install -g pm2
   pm2 start src/index.js --name "salespro-api"
   pm2 startup && pm2 save
   ```

---

## 🌐 Step 3: Deploy Frontend on AWS

### Option A: AWS Amplify (Recommended - 1-Click)
1. Open [AWS Amplify Console](https://console.aws.amazon.com/amplify/).
2. Click **Host web app** > Select GitHub repo `salespro`.
3. Add Environment Variable:
   - `VITE_API_URL`: `https://YOUR_BACKEND_API_URL/api`
4. Under **Rewrites and redirects**, add SPA rule:
   - Source: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|webmanifest)$)([^.]+$)/>`
   - Target: `/index.html`
   - Type: `200 (Rewrite)`
5. Click **Save and Deploy**.

### Option B: AWS S3 + CloudFront (1-Click CloudFormation)
1. Open AWS CloudFormation Console.
2. Create stack using [`aws-cloudformation.yml`](file:///Users/anujkumarsingh/Downloads/salespro/aws-cloudformation.yml).
3. Build and upload:
   ```bash
   VITE_API_URL=https://YOUR_BACKEND_API_URL/api npm run build
   aws s3 sync dist/ s3://YOUR_S3_BUCKET_NAME --delete
   aws cloudfront create-invalidation --distribution-id YOUR_CF_ID --paths "/*"
   ```

---

## 🧪 Local Testing

You can run both Frontend and Backend locally:

1. **Start Backend API:**
   ```bash
   npm run server
   # Runs on http://localhost:5001
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   # Runs on http://localhost:5173
   ```

3. **Or run everything with Docker:**
   ```bash
   docker compose up
   ```
