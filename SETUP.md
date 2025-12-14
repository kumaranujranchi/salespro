# SalesSphere Setup Guide

## Initial Setup

### 1. Create Super Admin Account

To access the application, you need to create a super admin account in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to Authentication > Users
3. Click "Add User"
4. Create a user with:
   - Email: `admin@salessphere.com`
   - Password: `Admin@123`
   - Confirm the email automatically

5. After creating the user, go to SQL Editor and run:

```sql
-- Get the user ID from auth.users
SELECT id FROM auth.users WHERE email = 'admin@salessphere.com';

-- Insert the profile with that ID (replace YOUR_USER_ID with the actual ID)
INSERT INTO profiles (id, employee_id, full_name, email, role, is_active, department_id)
VALUES
  ('YOUR_USER_ID', 'EMP001', 'Super Admin', 'admin@salessphere.com', 'super_admin', true, 'd1111111-1111-1111-1111-111111111111');
```

### 2. Login

Use these credentials to login:
- Email: `admin@salessphere.com`
- Password: `Admin@123`

### 3. Create Additional Users

Once logged in as super admin, you can create additional users through the Users page in the application.

## Database Schema

The application includes:
- User management with role-based access control
- Department management
- Project management
- Sales tracking with payment management
- Target management with auto-aggregation
- Site visit management with approval workflow
- Incentive calculation system
- Announcement system
- Activity logging

## Default Roles

- `super_admin` - Full system access
- `admin` - Administrative access
- `team_leader` - Team management and oversight
- `sales_executive` - Sales operations
- `crm_staff` - CRM operations
- `accountant` - Financial operations

## Sample Data

The database has been seeded with:
- 6 departments (Sales, Marketing, Accounts, HR, Customer Service, Operation)
- 4 sample projects
- 3 sample announcements
