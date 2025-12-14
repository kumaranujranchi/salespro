# Environment Setup Guide

## Quick Setup for New Devices

When you clone this repository on a new device, follow these steps to set up your environment:

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
```bash
# Copy the example file to create your .env
cp .env.example .env
```

### 3. Add Your Supabase Credentials

Open the `.env` file and replace the placeholder values with your actual Supabase credentials:

```env
VITE_SUPABASE_URL=https://sgpfmuluwppywwfffajs.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

**Where to find these values:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon/Public Key** → `VITE_SUPABASE_ANON_KEY`

### 4. Run the Application
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Security Note

⚠️ **NEVER commit your `.env` file to Git!** 

The `.env` file is already in `.gitignore` to prevent accidental commits. Always use `.env.example` as a template and keep your actual credentials local.

## Troubleshooting

If you see a white screen:
- Verify your `.env` file exists and has the correct values
- Restart the development server after changing `.env`
- Check the browser console for errors
