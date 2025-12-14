# Deployment Guide for Netlify

## 1. Prerequisites
- A GitHub repository with this code (already pushed).
- A Netlify account (https://www.netlify.com).

## 2. Steps to Deploy
1. **Login to Netlify** and click **"Add new site"** -> **"Import from an existing project"**.
2. Select **GitHub** and authorize Netlify.
3. Choose your repository: `wishpro`.
4. **Build Settings** (should be auto-detected thanks to `netlify.toml`):
   - **Build Command:** `npm run build`
   - **Publish directory:** `dist`
5. **Environment Variables** (CRITICAL):
   - Click on **"Site settings"** -> **"Environment variables"**.
   - Add the following variables (copy values from your local `.env` file):
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
6. Click **"Deploy"**.

## 3. Post-Deployment
- Your site will be live at `https://your-site-name.netlify.app`.
- Ensure you add this URL to your **Supabase Authentication -> URL Configuration** as a valid redirect URL if using OAuth or Magic Links.
