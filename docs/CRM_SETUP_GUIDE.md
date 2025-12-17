# CRM Module - Quick Setup Guide

## Prerequisites
- Supabase project configured
- Node.js and npm installed
- SalesPro application running

## Setup Steps

### 1. Database Setup

Run the CRM schema creation script in your Supabase SQL editor:

```bash
# Copy the SQL file content from: sql/create_crm_module.sql
# Paste and execute in Supabase SQL Editor
```

Or use psql:
```bash
psql -h your-supabase-host -U postgres -d postgres -f sql/create_crm_module.sql
```

### 2. Verify Database

Check that the following tables were created:
- ✅ `public.leads`
- ✅ `public.lead_followups`
- ✅ `public.lead_transfers`

Check that RLS policies are enabled on all three tables.

### 3. Install Dependencies (if needed)

```bash
npm install
```

### 4. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
```

### 5. Access the CRM Module

1. Login to the application
2. Navigate to `/leads`
3. Enable the CRM module using the toggle switch
4. Start creating leads!

## First Lead Creation

1. Click "Create Lead" button
2. Fill in the required fields:
   - Lead Source (select one)
   - Customer Name *
   - Mobile (10-digit) *
   - Sales Executive *
3. Optional fields:
   - Email
   - City
   - Project
   - Budget Range
   - Purpose
   - Preferred Locations
   - Internal Notes
4. Click "Create Lead"

Your lead ID will be auto-generated in format: `L-20251217-0001`

## Adding First Follow-up

1. Open any lead by clicking "View"
2. Click "Add Follow-up" button
3. Fill in:
   - Follow-up Type (Call, WhatsApp, Visit, Email)
   - Discussion Summary (min 20 characters) *
   - Customer Response *
   - New Status (must be different from current) *
   - Next Follow-up Date (if not closing the lead)
4. Click "Save Follow-up"

## Troubleshooting

### Issue: CRM Module Not Appearing
**Solution:** Ensure `/leads` route is accessible to your user role

### Issue: Cannot Create Leads
**Solution:** Check that RLS policies are properly set up and user has required permissions

### Issue: Lead ID Not Generating
**Solution:** Verify that the `generate_lead_id()` function exists in the database

### Issue: Follow-up Creation Fails
**Solution:** 
- Ensure status is different from previous
- Check that discussion summary is at least 20 characters
- Verify next follow-up date is set (unless closing the lead)

### Issue: Duplicate Lead Error
**Solution:** Check if mobile number or email already exists for this tenant

## Testing Checklist

- [ ] Create a lead with all fields
- [ ] Create a lead with minimal fields
- [ ] Add a follow-up
- [ ] Verify follow-up appears in timeline
- [ ] Check lead score visual indicators
- [ ] Test search functionality
- [ ] Test status filter
- [ ] Test score filter
- [ ] Verify overdue follow-up highlighting
- [ ] Test mobile responsiveness
- [ ] Verify call/email/WhatsApp quick actions work

## Default Data

No default data is created. You'll start with:
- 0 leads
- 0 follow-ups
- Clean slate

## Roles and Permissions

**Super Admin / Admin:**
- Full access to all leads
- Can assign leads to any sales executive
- Can view all statistics

**Team Leader:**
- View all team leads
- Assign leads
- Full lead management

**Sales Executive:**
- View only assigned leads
- Create new leads
- Manage own lead follow-ups

**Director:**
- Read-only access to all leads
- Cannot create or modify

## Quick Actions

| Action | Shortcut | Location |
|--------|----------|----------|
| Create Lead | FAB (mobile) / Button (desktop) | Top right |
| Search Leads | Type in search box | Filters section |
| Filter by Status | Dropdown | Filters section |
| Filter by Score | Dropdown | Filters section |
| View Lead | "View" button | Table row |
| Add Follow-up | "Add Follow-up" button | Lead detail page |

## Dashboard Statistics

The CRM dashboard shows:
- **Total Leads**: All leads in the system
- **New Leads**: Leads with "New" status
- **Qualified**: Leads with "Qualified" status
- **Hot Leads**: Leads with "Hot" score
- **Overdue**: Leads with past due follow-ups

## Best Practices

1. **Always set next follow-up date** unless closing the lead
2. **Write detailed discussion summaries** (minimum 20 characters)
3. **Update lead score** based on customer responses
4. **Use appropriate follow-up types** (Call for urgent, Email for documentation)
5. **Keep mobile numbers accurate** for duplicate detection
6. **Add preferred locations** to help with project matching

## Support

For issues or questions:
1. Check the full documentation: `docs/CRM_MODULE_DOCUMENTATION.md`
2. Review the database schema: `sql/create_crm_module.sql`
3. Inspect browser console for errors
4. Check Supabase logs for database errors

## What's Next?

After basic setup:
- [ ] Customize lead sources for your business
- [ ] Set up automated reminders (future enhancement)
- [ ] Configure email notifications (future enhancement)
- [ ] Add custom fields via metadata (extensible)
- [ ] Integrate with WhatsApp API (future enhancement)
- [ ] Set up reporting dashboard (future enhancement)

---

**Setup Complete!** 🎉

Your CRM module is ready to use. Start by creating your first lead!
