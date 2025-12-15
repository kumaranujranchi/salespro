# SalesSphere

A corporate-grade Sales Management Web Application built with React, TypeScript, Supabase, and Tailwind CSS.

## Overview

SalesSphere is a comprehensive sales management platform designed for sales teams, admins, team leaders, CRM staff, and accountants to manage the entire sales lifecycle — from targets to site visits to revenue tracking.

## Features

### Core Modules

1. **User Management** (Super Admin + Admin)
   - Create and manage user accounts
   - Role-based access control (6 roles: super_admin, admin, team_leader, sales_executive, crm_staff, accountant)
   - Employee profiles with reporting hierarchy

2. **Department Management**
   - CRUD operations for departments
   - Department assignment for users

3. **Project Management**
   - Property/project listings
   - Location tracking with Google Maps integration
   - Site photos and metadata management

4. **Announcement System**
   - Company-wide announcements
   - Important announcements flagging
   - Publish/unpublish control

5. **Target Management**
   - Assign sales targets to executives
   - Monthly, quarterly, and yearly targets
   - Auto-aggregation to team leader targets
   - Performance tracking and reporting

6. **Site Visit Management**
   - Customer visit request creation
   - Public calendar to prevent double-booking
   - Admin approval workflow
   - Vehicle assignment

7. **Sales Management**
   - Complete sales transaction records
   - Customer information management
   - Payment tracking with multiple installments
   - Payment history and ledger
   - Revenue calculations

8. **Incentive System**
   - Automated incentive calculations
   - Four-installment payout structure
   - Monthly locking mechanism

9. **Reports Management**
   - Role-based report access
   - Download permissions

10. **Role-Based Dashboards**
    - **Admin Dashboard**: Organization-wide KPIs and analytics
    - **Sales Executive Dashboard**: Personal performance metrics
    - **Team Leader Dashboard**: Team performance oversight

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Routing**: React Router v6
- **Icons**: Lucide React

## Design System

### Color Palette
- **Primary**: Deep Navy (#0A1C37) - Authority and calm
- **Accent**: Electric Blue (#1673FF) - Confident emphasis
- **Background**: Soft Grey (#F4F6F8) - Enterprise clarity
- **Success**: Muted Green (#2BA67A)
- **Warning**: Amber (#D58A00)
- **Error**: Corporate Red (#C62828)

### Typography
- Clean sans-serif fonts with strong hierarchy
- Consistent spacing using 8pt grid system
- High contrast for readability

## Database Schema

The application uses a comprehensive PostgreSQL database with:
- 12 main tables with full relationships
- Row Level Security (RLS) enabled on all tables
- Role-based access policies
- Automatic timestamp tracking
- Performance-optimized indexes

## Security

- Role-based access control (RBAC) at database and application level
- Row Level Security policies for data isolation
- Secure authentication with Supabase Auth
- Protected routes with role validation

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (already set in `.env`)

4. Create a Super Admin account:
   - Go to Supabase Dashboard > Authentication > Users
   - Create a user with email: `admin@salessphere.com`
   - After creating, run this SQL in Supabase SQL Editor:
   ```sql
   -- Get the user ID
   SELECT id FROM auth.users WHERE email = 'admin@salessphere.com';

   -- Insert profile (replace YOUR_USER_ID)
   INSERT INTO profiles (id, employee_id, full_name, email, role, is_active)
   VALUES ('YOUR_USER_ID', 'EMP001', 'Super Admin', 'admin@salessphere.com', 'super_admin', true);
   ```

5. Run the application:
   ```bash
   npm run dev
   ```

6. Login with:
   - Email: `admin@salessphere.com`
   - Password: (the password you set)

### Building for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── dashboards/          # Role-specific dashboard components
│   ├── layout/              # Layout components (DashboardLayout)
│   ├── ui/                  # Reusable UI components
│   └── ProtectedRoute.tsx   # Route protection
├── contexts/
│   └── AuthContext.tsx      # Authentication context
├── lib/
│   └── supabase.ts          # Supabase client
├── pages/                   # Page components
├── types/
│   └── database.ts          # TypeScript types
└── App.tsx                  # Main app with routing
```

## User Roles

1. **Super Admin**: Complete system access, user management
2. **Admin**: Administrative tasks, user management, system configuration
3. **Team Leader**: Team oversight, target management, approvals
4. **Sales Executive**: Sales operations, site visits, personal targets
5. **CRM Staff**: Customer relationship management
6. **Accountant**: Financial operations, payment management

## Key Features

### KPI Tracking
- Real-time dashboard analytics
- Month-over-month comparisons
- Visual progress indicators

### Target Management
- Hierarchical target setting
- Auto-aggregation from team members to leaders
- Achievement percentage tracking

### Payment Tracking
- Multiple payment types and modes
- Payment history and ledgers
- Pending payment calculations

### Site Visit Coordination
- Public calendar visibility
- Approval workflow
- Vehicle assignment

## Sample Data

The database includes:
- 6 departments (Sales, Marketing, Accounts, HR, Customer Service, Operation)
- 4 sample projects
- 3 sample announcements

## Future Enhancements

Potential areas for expansion:
- Advanced analytics and reporting
- Export functionality (CSV/Excel)
- Email notifications
- Document management
- Mobile responsive optimizations
- Real-time notifications
- Advanced search and filtering
- Bulk operations

## License

All rights reserved.

## Support

For support and queries, contact your system administrator.
