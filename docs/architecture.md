# SalesPro Architecture

## Overview

SalesPro is a SaaS Sales Management Platform built with React, Vite, and Supabase.

## Directory Structure

### `/src`

Source code for the frontend application.

- **`components`**: Reusable UI components.
- **`pages`**: Route components.
- **`lib`**: Library code (Supabase client).
- **`types`**: TypeScript definitions.
- **`utils`**: Helper functions.
- **`hooks`**: Custom React hooks.
- **`contexts`**: React Context providers.

### `/sql`

Database management protocols.

- **`migrations`**: Schema evolution scripts.
- **`scripts`**: Utility scripts (e.g., admin assignment).

### `/config`

Configuration files for build tools and environment settings.

- `vite.config.ts`
- `tailwind.config.js`
- `postcss.config.js`

### `/tests`

Test files.

### `/docs`

Project documentation.

## Key Technologies

- **Frontend**: React, Tailwind CSS, Lucide Icons.
- **Backend / Database**: Supabase (PostgreSQL, Auth, Storage, Realtime).
- **Testing**: Vitest.
