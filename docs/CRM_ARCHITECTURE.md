# CRM Module Architecture & Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SalePro CRM Module                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐         ┌─────────────────┐                │
│  │  LeadsPage.tsx  │◄────────│ ToggleSwitch    │                │
│  │  (Main View)    │         │ (Enable/Disable)│                │
│  └────────┬────────┘         └─────────────────┘                │
│           │                                                       │
│           ├──► Statistics Dashboard                              │
│           ├──► Search & Filters                                  │
│           └──► Leads Table                                       │
│                                                                   │
│  ┌─────────────────────────────────────────────────┐            │
│  │              Lead Management Flow                 │            │
│  │                                                   │            │
│  │  Create Lead ──► LeadFormModal.tsx               │            │
│  │       │                                           │            │
│  │       ▼                                           │            │
│  │  Validate Fields                                  │            │
│  │       │                                           │            │
│  │       ▼                                           │            │
│  │  Check Duplicates (Mobile/Email)                 │            │
│  │       │                                           │            │
│  │       ▼                                           │            │
│  │  Generate Lead ID (L-YYYYMMDD-XXXX)              │            │
│  │       │                                           │            │
│  │       ▼                                           │            │
│  │  Insert into Database                             │            │
│  │       │                                           │            │
│  │       ▼                                           │            │
│  │  Assign to Sales Executive                        │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                   │
│  ┌─────────────────────────────────────────────────┐            │
│  │            Lead Detail & Follow-up Flow           │            │
│  │                                                   │            │
│  │  View Lead ──► LeadDetailModal.tsx               │            │
│  │       │                                           │            │
│  │       ├──► Summary Header (Sticky)                │            │
│  │       │    ├─ Customer Info                       │            │
│  │       │    ├─ Lead Metadata                       │            │
│  │       │    └─ Quick Actions (Call/Email/WhatsApp) │            │
│  │       │                                           │            │
│  │       ├──► Requirements Section                   │            │
│  │       ├──► Internal Notes                         │            │
│  │       │                                           │            │
│  │       └──► Follow-up Timeline                     │            │
│  │            ├─ Reverse Chronological Order         │            │
│  │            ├─ Immutable After 24hrs               │            │
│  │            └─ Next Follow-up Tracking             │            │
│  │                                                   │            │
│  │  Add Follow-up ──► Follow-up Form                │            │
│  │       │                                           │            │
│  │       ├──► Validate Discussion (min 20 chars)    │            │
│  │       ├──► Verify Status Change                   │            │
│  │       ├──► Check Daily Limit (max 3/day)          │            │
│  │       │                                           │            │
│  │       ▼                                           │            │
│  │  Insert Follow-up                                 │            │
│  │       │                                           │            │
│  │       ▼                                           │            │
│  │  Update Lead Status                               │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌──────────────────────────────────────────────────────────┐
│                    LEADS TABLE                            │
├──────────────────────────────────────────────────────────┤
│ • id (UUID, PK)                                          │
│ • tenant_id (UUID, FK → tenants)                         │
│ • lead_id (VARCHAR, UNIQUE) ← Auto-generated             │
│ • lead_source (ENUM)                                     │
│ • project_id (UUID, FK → projects)                       │
│ • sales_executive_id (UUID, FK → profiles)               │
│ • customer_name (VARCHAR)                                 │
│ • mobile (VARCHAR(15), UNIQUE per tenant)                │
│ • email (VARCHAR, UNIQUE per tenant)                     │
│ • city (VARCHAR)                                         │
│ • budget_range (ENUM)                                    │
│ • purpose (ENUM)                                         │
│ • preferred_locations (TEXT[])                           │
│ • lead_status (ENUM)                                     │
│ • lead_score (ENUM)                                      │
│ • internal_notes (TEXT)                                  │
│ • lead_date (TIMESTAMPTZ)                                │
│ • created_at, updated_at (TIMESTAMPTZ)                   │
│ • created_by, updated_by (UUID)                          │
│ • metadata (JSONB)                                       │
└──────────────────────────────────────────────────────────┘
                           │
                           │ 1:N
                           ▼
┌──────────────────────────────────────────────────────────┐
│                LEAD_FOLLOWUPS TABLE                       │
├──────────────────────────────────────────────────────────┤
│ • id (UUID, PK)                                          │
│ • tenant_id (UUID, FK)                                   │
│ • lead_id (UUID, FK → leads)                             │
│ • followup_type (ENUM)                                   │
│ • followup_date (TIMESTAMPTZ)                            │
│ • discussion_summary (TEXT, min 20 chars)                │
│ • customer_response (ENUM)                               │
│ • previous_status (ENUM)                                 │
│ • new_status (ENUM) ← Must differ                        │
│ • next_followup_date (DATE)                              │
│ • created_at (TIMESTAMPTZ)                               │
│ • created_by (UUID)                                      │
│ • is_editable (BOOLEAN) ← Auto false after 24hrs         │
│ • metadata (JSONB)                                       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│               LEAD_TRANSFERS TABLE                        │
├──────────────────────────────────────────────────────────┤
│ • id (UUID, PK)                                          │
│ • tenant_id (UUID, FK)                                   │
│ • lead_id (UUID, FK → leads)                             │
│ • from_executive_id (UUID, FK → profiles)                │
│ • to_executive_id (UUID, FK → profiles)                  │
│ • requested_by (UUID, FK → profiles)                     │
│ • approved_by (UUID, FK → profiles)                      │
│ • transfer_status (VARCHAR) ← Pending/Approved/Rejected  │
│ • approval_notes (TEXT)                                  │
│ • requested_at, approved_at (TIMESTAMPTZ)                │
│ • metadata (JSONB)                                       │
└──────────────────────────────────────────────────────────┘
```

## User Flow Diagram

```
┌─────────────┐
│   LOGIN     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Navigate to     │
│   /leads        │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐     ┌──────────────────┐
│ CRM Module      │────►│  Module Disabled │
│ Toggle Check    │     │  Show Enable UI  │
└──────┬──────────┘     └──────────────────┘
       │ Enabled
       ▼
┌─────────────────────────────────────────┐
│         CRM Dashboard View               │
├─────────────────────────────────────────┤
│ • Statistics (Total, New, Hot, etc.)    │
│ • Search Bar                             │
│ • Status & Score Filters                 │
│ • Leads Table                            │
│ • Create Lead Button (FAB on mobile)    │
└──────┬──────────────────────────────────┘
       │
       ├──► CREATE LEAD ──────────┐
       │                           │
       └──► VIEW LEAD ─────────┐  │
                                │  │
       ┌────────────────────────┘  │
       │                           │
       ▼                           ▼
┌────────────────┐        ┌──────────────────┐
│ Lead Detail    │        │  Lead Form       │
│ Modal          │        │  Modal           │
├────────────────┤        ├──────────────────┤
│ • Summary      │        │ • Customer Info  │
│ • Requirements │        │ • Requirements   │
│ • Notes        │        │ • Assignment     │
│ • Timeline     │        │ • Validation     │
│ • Quick Actions│        │ • Submit         │
└────┬───────────┘        └──────────────────┘
     │
     ├──► CALL
     ├──► EMAIL  
     ├──► WHATSAPP
     └──► ADD FOLLOW-UP ──┐
                          │
          ┌───────────────┘
          │
          ▼
    ┌──────────────────┐
    │ Follow-up Form   │
    ├──────────────────┤
    │ • Type           │
    │ • Date/Time      │
    │ • Discussion     │
    │ • Response       │
    │ • New Status     │
    │ • Next Date      │
    └──────┬───────────┘
           │
           ▼
    ┌──────────────────┐
    │   Validation     │
    ├──────────────────┤
    │ ✓ Min 20 chars   │
    │ ✓ Status changed │
    │ ✓ Max 3/day      │
    │ ✓ Next date set  │
    └──────┬───────────┘
           │
           ▼
    ┌──────────────────┐
    │ Save to Database │
    │ Update Lead      │
    │ Refresh Timeline │
    └──────────────────┘
```

## Access Control Matrix

```
┌──────────────────┬──────────┬──────────┬─────────┬──────────┐
│   Permission     │  Sales   │  Team    │  Admin  │ Director │
│                  │   Exec   │  Leader  │         │          │
├──────────────────┼──────────┼──────────┼─────────┼──────────┤
│ View Own Leads   │    ✅    │    ✅    │   ✅    │    ✅    │
├──────────────────┼──────────┼──────────┼─────────┼──────────┤
│ View All Leads   │    ❌    │    ✅    │   ✅    │    ✅    │
├──────────────────┼──────────┼──────────┼─────────┼──────────┤
│ Create Lead      │    ✅    │    ✅    │   ✅    │    ❌    │
├──────────────────┼──────────┼──────────┼─────────┼──────────┤
│ Edit Own Lead    │    ✅    │    ✅    │   ✅    │    ❌    │
├──────────────────┼──────────┼──────────┼─────────┼──────────┤
│ Edit All Leads   │    ❌    │    ✅    │   ✅    │    ❌    │
├──────────────────┼──────────┼──────────┼─────────┼──────────┤
│ Add Follow-up    │    ✅    │    ✅    │   ✅    │    ❌    │
├──────────────────┼──────────┼──────────┼─────────┼──────────┤
│ Assign Leads     │    ❌    │    ✅    │   ✅    │    ❌    │
├──────────────────┼──────────┼──────────┼─────────┼──────────┤
│ Transfer Leads   │    ❌    │    ✅    │   ✅    │    ❌    │
├──────────────────┼──────────┼──────────┼─────────┼──────────┤
│ View Statistics  │    ✅    │    ✅    │   ✅    │    ✅    │
└──────────────────┴──────────┴──────────┴─────────┴──────────┘
```

## State Management

```
┌──────────────────────────────────────┐
│         Global State (Zustand)        │
├──────────────────────────────────────┤
│ • isCRMActive: boolean               │
│ • selectedLead: Lead | null          │
│ • leads: Lead[]                      │
│ • loading: boolean                   │
│ • filters: FilterState               │
└──────────────────────────────────────┘
                 ▲
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐   ┌─────▼────────┐
│  LeadsPage   │   │  LeadDetail  │
│  State       │   │  State       │
├──────────────┤   ├──────────────┤
│ • searchTerm │   │ • followups  │
│ • statusFilter│  │ • showForm   │
│ • scoreFilter│   │ • formData   │
│ • showModal  │   └──────────────┘
└──────────────┘
```

## Validation Flow

```
┌──────────────────┐
│  Form Submission │
└────────┬─────────┘
         │
         ▼
┌────────────────────┐
│ Client Validation  │
├────────────────────┤
│ • Required fields  │
│ • Format checks    │
│ • Length limits    │
└────────┬───────────┘
         │ Pass
         ▼
┌────────────────────┐
│  Duplicate Check   │
├────────────────────┤
│ • Mobile unique    │
│ • Email unique     │
└────────┬───────────┘
         │ Pass
         ▼
┌────────────────────┐
│ Database Insert    │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│ Trigger Validation │
├────────────────────┤
│ • Status transition│
│ • Daily limit      │
│ • Date constraints │
└────────┬───────────┘
         │ Pass
         ▼
┌────────────────────┐
│   Success ✅       │
└────────────────────┘
```

## Lead Lifecycle

```
┌────────┐
│  NEW   │ ← Lead Created
└───┬────┘
    │
    ▼
┌─────────────┐
│  CONTACTED  │ ← First Follow-up
└───┬─────────┘
    │
    ├──► ┌──────────────┐
    │    │  QUALIFIED   │ ← Positive Response
    │    └──────┬───────┘
    │           │
    │           ▼
    │    ┌──────────────┐
    │    │   CLOSED     │ ← Deal Won
    │    └──────────────┘
    │
    └──► ┌──────────────┐
         │ DISQUALIFIED │ ← Not Interested
         └──────────────┘
```

---

This architecture supports:
- ✅ Multi-tenant isolation
- ✅ Role-based access control
- ✅ Real-time updates
- ✅ Scalability
- ✅ Data integrity
- ✅ Audit trail
- ✅ Mobile responsiveness
