import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tenants: defineTable({
    name: v.string(),
    slug: v.string(),
    settings: v.any(), // TenantSettings
    subscription_status: v.string(),
    plan_tier: v.string(),
    billing_cycle: v.optional(v.string()),
    subscription_id: v.optional(v.string()),
    razorpay_customer_id: v.optional(v.string()),
    next_billing_date: v.optional(v.string()),
    trial_ends_at: v.optional(v.string()),
    is_active: v.boolean(),
    leads_count: v.optional(v.number()),
  }).index("by_slug", ["slug"]),

  profiles: defineTable({
    userId: v.string(), // Link to Clerk/Convex Auth ID
    employee_id: v.string(),
    full_name: v.string(),
    email: v.string(),
    phone: v.union(v.string(), v.null()),
    role: v.string(), // UserRole enum
    department_id: v.optional(v.id("departments")),
    reporting_manager_id: v.optional(v.id("profiles")),
    image_url: v.optional(v.string()),
    dob: v.optional(v.string()),
    marriage_anniversary: v.optional(v.string()),
    joining_date: v.optional(v.string()),
    tenant_id: v.optional(v.id("tenants")),
    is_active: v.boolean(),
    force_password_change: v.boolean(),
    role_id: v.optional(v.id("tenant_roles")),
    password: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_tenant", ["tenant_id"])
    .index("by_email", ["email"]),

  departments: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    is_active: v.boolean(),
    tenant_id: v.id("tenants"),
  }).index("by_tenant", ["tenant_id"]),

  tenant_roles: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.any(), // RolePermissions
    is_system: v.boolean(),
    tenant_id: v.id("tenants"),
  }).index("by_tenant", ["tenant_id"]),

  projects: defineTable({
    name: v.string(),
    address: v.optional(v.string()),
    location_lat: v.optional(v.number()),
    location_lng: v.optional(v.number()),
    google_maps_url: v.optional(v.string()),
    site_photos: v.array(v.string()),
    metadata: v.any(),
    is_active: v.boolean(),
    project_type: v.optional(v.string()),
    image_url: v.optional(v.string()),
    status: v.optional(v.string()),
    tenant_id: v.id("tenants"),
  }).index("by_tenant", ["tenant_id"]),

  leads: defineTable({
    tenant_id: v.id("tenants"),
    lead_id: v.string(), // Custom formatted ID
    lead_source: v.string(), // LeadSource enum
    project_id: v.optional(v.id("projects")),
    sales_executive_id: v.optional(v.id("profiles")),
    customer_name: v.string(),
    mobile: v.string(),
    email: v.optional(v.string()),
    city: v.optional(v.string()),
    budget_range: v.optional(v.string()),
    purpose: v.optional(v.string()),
    preferred_locations: v.optional(v.array(v.string())),
    lead_status: v.string(), // LeadStatus enum
    lead_score: v.string(), // LeadScore enum
    internal_notes: v.optional(v.string()),
    lead_date: v.string(),
    created_by: v.optional(v.id("profiles")),
    updated_by: v.optional(v.id("profiles")),
    updated_at: v.optional(v.string()),
    // Denormalized fields for scalability
    latest_followup_date: v.optional(v.string()),
    latest_followup_status: v.optional(v.string()),
    next_followup_date: v.optional(v.string()),
    followup_count: v.optional(v.number()),
    metadata: v.any(),
  })
    .index("by_tenant", ["tenant_id"])
    .index("by_lead_id", ["lead_id"])
    .index("by_mobile", ["mobile"])
    .index("by_status", ["lead_status"])
    .index("by_executive", ["sales_executive_id"])
    .index("by_tenant_mobile", ["tenant_id", "mobile"])
    .index("by_tenant_status", ["tenant_id", "lead_status"])
    .index("by_tenant_executive", ["tenant_id", "sales_executive_id"])
    .index("by_tenant_date", ["tenant_id", "lead_date"]),

  lead_followups: defineTable({
    tenant_id: v.id("tenants"),
    lead_id: v.id("leads"),
    followup_type: v.string(),
    followup_date: v.string(),
    discussion_summary: v.string(),
    customer_response: v.optional(v.string()),
    call_status: v.optional(v.string()),
    previous_status: v.optional(v.string()),
    new_status: v.string(),
    next_followup_date: v.optional(v.string()),
    created_by: v.optional(v.id("profiles")),
    is_editable: v.boolean(),
    metadata: v.any(),
  })
    .index("by_lead", ["lead_id"])
    .index("by_tenant", ["tenant_id"]),

  lead_transfers: defineTable({
    tenant_id: v.id("tenants"),
    lead_id: v.id("leads"),
    from_executive_id: v.optional(v.id("profiles")),
    to_executive_id: v.id("profiles"),
    requested_by: v.id("profiles"),
    approved_by: v.optional(v.id("profiles")),
    transfer_status: v.string(), // Pending, Approved, Rejected
    approval_notes: v.optional(v.string()),
    requested_at: v.string(),
    approved_at: v.optional(v.string()),
    metadata: v.any(),
  }).index("by_lead", ["lead_id"]),

  sales_targets: defineTable({
    tenant_id: v.id("tenants"),
    user_id: v.id("profiles"),
    period_type: v.string(), // monthly
    target_sqft: v.number(),
    target_amount: v.number(),
    target_units: v.number(),
    start_date: v.string(),
    end_date: v.string(),
    created_by: v.optional(v.id("profiles")),
  })
    .index("by_tenant_user_date", ["tenant_id", "user_id", "start_date"])
    .index("by_user", ["user_id"]),

  payments: defineTable({
    tenant_id: v.id("tenants"),
    sale_id: v.string(), // We'll need a sales table too if we want full parity
    payment_date: v.string(),
    amount: v.number(),
    payment_type: v.string(),
    payment_mode: v.string(),
    transaction_reference: v.optional(v.string()),
    remarks: v.optional(v.string()),
    recorded_by: v.optional(v.id("profiles")),
  }).index("by_tenant", ["tenant_id"])
    .index("by_tenant_date", ["tenant_id", "payment_date"])
    .index("by_sale", ["sale_id"]),

  notifications: defineTable({
    user_id: v.id("profiles"),
    tenant_id: v.id("tenants"),
    title: v.string(),
    message: v.string(),
    type: v.string(), // info, success, warning, error
    related_entity_type: v.optional(v.string()),
    related_entity_id: v.optional(v.string()),
    is_read: v.boolean(),
  })
    .index("by_user_unread", ["user_id", "is_read"])
    .index("by_tenant", ["tenant_id"]),

  site_visits: defineTable({
    tenant_id: v.id("tenants"),
    requested_by: v.id("profiles"),
    lead_id: v.optional(v.id("leads")), // Link to CRM lead
    customer_name: v.string(),
    mobile: v.string(),
    visit_date: v.string(),
    visit_time: v.string(),
    pickup_location: v.string(),
    notes: v.optional(v.string()),
    status: v.string(), // pending, approved, declined, trip_started, completed, etc.
    driver_id: v.optional(v.id("profiles")),
    rejection_reason: v.optional(v.string()),
    clarification_note: v.optional(v.string()),
    start_odometer: v.optional(v.string()),
    end_odometer: v.optional(v.string()),
    trip_start_time: v.optional(v.string()),
    trip_end_time: v.optional(v.string()),
    metadata: v.any(),
  }).index("by_tenant", ["tenant_id"])
    .index("by_status", ["status"])
    .index("by_driver", ["driver_id"])
    .index("by_requester", ["requested_by"])
    .index("by_lead", ["lead_id"])
    .index("by_tenant_status", ["tenant_id", "status"]),

  sales: defineTable({
    tenant_id: v.id("tenants"),
    customer_id: v.id("leads"), // Linking to leads table
    project_id: v.id("projects"),
    sales_executive_id: v.id("profiles"),
    team_leader_id: v.optional(v.id("profiles")),
    sale_date: v.string(),
    property_type: v.optional(v.string()),
    unit_number: v.optional(v.string()),
    area_sqft: v.number(),
    rate_per_sqft: v.optional(v.number()),
    base_price: v.optional(v.number()),
    total_revenue: v.number(),
    booking_amount: v.number(),
    is_agreement_done: v.boolean(),
    agreement_date: v.optional(v.string()),
    is_registry_done: v.boolean(),
    registry_date: v.optional(v.string()),
    status: v.string(), // booked, completed, cancelled
    metadata: v.any(),
    // Customer Info (Primary Applicant)
    father_husband_name: v.optional(v.string()),
    dob: v.optional(v.string()),
    gender: v.optional(v.string()),
    alternate_mobile: v.optional(v.string()),
    pan_number: v.optional(v.string()),
    aadhaar_number: v.optional(v.string()),
    occupation: v.optional(v.string()),
    company_name: v.optional(v.string()),
    annual_income: v.optional(v.string()),
    marital_status: v.optional(v.string()),
    nationality: v.optional(v.string()),
    passport: v.optional(v.string()),
    // Current Address
    address_house_no: v.optional(v.string()),
    address_street: v.optional(v.string()),
    address_city: v.optional(v.string()),
    address_state: v.optional(v.string()),
    address_pin_code: v.optional(v.string()),
    // Permanent Address
    address_same_as_current: v.optional(v.boolean()),
    perm_address_house_no: v.optional(v.string()),
    perm_address_street: v.optional(v.string()),
    perm_address_city: v.optional(v.string()),
    perm_address_state: v.optional(v.string()),
    perm_address_pin_code: v.optional(v.string()),
    // Co-Applicant Details
    co_applicant_name: v.optional(v.string()),
    co_applicant_relation: v.optional(v.string()),
    co_applicant_mobile: v.optional(v.string()),
    co_applicant_aadhaar: v.optional(v.string()),
  }).index("by_tenant", ["tenant_id"])
    .index("by_executive", ["sales_executive_id"])
    .index("by_project", ["project_id"])
    .index("by_customer", ["customer_id"])
    .index("by_tenant_date", ["tenant_id", "sale_date"]),

  announcements: defineTable({
    tenant_id: v.id("tenants"),
    title: v.string(),
    content: v.string(),
    is_important: v.boolean(),
    is_published: v.boolean(),
    created_at: v.string(),
    created_by: v.id("profiles"),
  }).index("by_tenant", ["tenant_id"]),

  activity_logs: defineTable({
    tenant_id: v.id("tenants"),
    user_id: v.id("profiles"),
    action: v.string(),
    entity_type: v.string(),
    entity_id: v.optional(v.string()),
    details: v.any(),
    created_at: v.string(),
  })
    .index("by_tenant", ["tenant_id"])
    .index("by_user", ["user_id"]),

  incentives: defineTable({
    tenant_id: v.id("tenants"),
    sales_executive_id: v.id("profiles"),
    calculation_month: v.string(),
    calculation_year: v.number(),
    total_incentive_amount: v.number(),
    status: v.string(), // pending, paid
    details: v.any(),
  })
    .index("by_tenant", ["tenant_id"])
    .index("by_executive", ["sales_executive_id", "calculation_year"]),

  referral_campaigns: defineTable({
    tenant_id: v.optional(v.id("tenants")),
    code: v.string(),
    name: v.string(),
    referrer_email: v.optional(v.string()),
    referrer_commission_percent: v.number(),
    referee_discount_percent: v.number(),
    is_active: v.boolean(),
    created_by: v.optional(v.id("profiles")),
    created_by_userId: v.optional(v.string()), // To support lookup by external auth ID
  })
    .index("by_tenant", ["tenant_id"])
    .index("by_code", ["code"])
    .index("by_creator", ["created_by_userId"]),

  user_referrals: defineTable({
    tenant_id: v.id("tenants"),
    campaign_id: v.id("referral_campaigns"),
    referred_tenant_id: v.optional(v.id("tenants")),
    referrer_id: v.optional(v.id("profiles")),
    status: v.string(), // pending, converted, cancelled
    metadata: v.any(),
  })
    .index("by_tenant", ["tenant_id"])
    .index("by_campaign", ["campaign_id"]),

  commissions: defineTable({
    tenant_id: v.id("tenants"),
    referral_id: v.id("user_referrals"),
    amount: v.number(),
    status: v.string(), // pending, paid
    paid_at: v.optional(v.string()),
    remarks: v.optional(v.string()),
  })
    .index("by_tenant", ["tenant_id"])
    .index("by_referral", ["referral_id"]),

  billing_history: defineTable({
    tenant_id: v.id("tenants"),
    amount: v.number(), // in paise
    status: v.string(), // created, authorized, captured, refunded, failed
    razorpay_payment_id: v.string(),
    description: v.string(),
    created_at: v.string(),
  }).index("by_tenant", ["tenant_id"]),

  subscriptions: defineTable({
    tenant_id: v.id("tenants"),
    razorpay_subscription_id: v.string(),
    plan_id: v.string(),
    status: v.string(), // created, active, paused, cancelled, etc.
    current_start: v.optional(v.string()),
    current_end: v.optional(v.string()),
    ended_at: v.optional(v.string()),
    metadata: v.optional(v.any()),
  }).index("by_tenant", ["tenant_id"])
    .index("by_razorpay_id", ["razorpay_subscription_id"]),

  support_tickets: defineTable({
    tenant_id: v.id("tenants"),
    ticket_number: v.number(),
    subject: v.string(),
    description: v.string(),
    status: v.string(), // open, in_progress, resolved, closed
    priority: v.string(), // low, medium, high, critical
    created_by: v.id("profiles"),
    resolution_notes: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_tenant", ["tenant_id"])
    .index("by_status", ["status"])
    .index("by_creator", ["created_by"]),

  project_units: defineTable({
    tenant_id: v.id("tenants"),
    project_id: v.id("projects"),
    unit_number: v.string(), // E.g., "Flat-101", "Plot-45"
    status: v.string(), // "Available", "Hold", "Booked", "Sold"
    custom_values: v.any(), // Record<field_id, value>
    created_at: v.optional(v.string()),
    updated_at: v.optional(v.string()),
  })
    .index("by_tenant", ["tenant_id"])
    .index("by_project", ["project_id"])
    .index("by_tenant_project", ["tenant_id", "project_id"]),

  ai_chat_limits: defineTable({
    tenant_id: v.id("tenants"),
    date: v.string(), // Format: "YYYY-MM-DD"
    count: v.number(),
  })
    .index("by_tenant_date", ["tenant_id", "date"]),
});
