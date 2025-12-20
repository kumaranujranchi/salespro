export type UserRole = 'super_admin' | 'admin' | 'director' | 'team_leader' | 'sales_executive' | 'crm_staff' | 'accountant' | 'driver' | 'receptionist' | 'platform_admin';

export interface TenantSettings {
  features: {
    crm: boolean;
    inventory: boolean;
    reports: boolean;
    site_visits: boolean;
    incentives: boolean;
  };
  appearance: {
    primary_color: string;
    logo_url: string | null;
  };
  incentive_plan: {
    type: string;
    rules: Record<string, any>;
  };
}

export interface RolePermissions {
  menu: Record<string, 'none' | 'read' | 'edit'>;
  dashboard: {
    kpi_cards?: boolean;
    project_performance?: boolean;
    leaderboard?: boolean;
    upcoming_events?: boolean;
    recent_activity?: boolean;
    sales_view: 'none' | 'self' | 'team' | 'overall';
    [key: string]: string | boolean | undefined;
  };
}

export interface TenantRole {
  id: string;
  name: string;
  description: string | null;
  permissions: RolePermissions;
  is_system: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: TenantSettings;
  subscription_status: string;
  plan_tier: string;
  billing_cycle?: string;
  subscription_id?: string;
  razorpay_customer_id?: string;
  next_billing_date?: string;
  trial_ends_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  razorpay_subscription_id: string;
  razorpay_plan_id: string;
  status: 'created' | 'authenticated' | 'active' | 'paused' | 'halted' | 'cancelled' | 'completed' | 'expired';
  current_start?: string;
  current_end?: string;
  ended_at?: string;
  charge_at?: string;
  start_at?: string;
  end_at?: string;
  auth_attempts: number;
  total_count?: number;
  paid_count: number;
  remaining_count?: number;
  short_url?: string;
  customer_notify: boolean;
  quantity: number;
  notes?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BillingHistory {
  id: string;
  tenant_id: string;
  subscription_id?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_invoice_id?: string;
  amount: number; // in paise
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  method?: string; // card, netbanking, wallet, upi
  description?: string;
  email?: string;
  contact?: string;
  fee?: number; // Razorpay fee in paise
  tax?: number; // Tax in paise
  error_code?: string;
  error_description?: string;
  notes?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ReferralCampaign {
  id: string;
  created_at: string;
  code: string;
  name: string;
  created_by: string;
  referrer_commission_percent: number;
  referee_discount_percent: number;
  is_active: boolean;
  channel?: string;
}

export interface Profile {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  department_id: string | null;
  reporting_manager_id: string | null;
  image_url: string | null;
  dob: string | null;
  marriage_anniversary: string | null;
  joining_date: string | null;
  tenant_id: string; // Added for SaaS
  is_active: boolean;
  force_password_change: boolean;
  role_details?: {
    id: string;
    name: string;
    permissions: RolePermissions;
  };
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  google_maps_url: string | null;
  site_photos: string[];
  metadata: Record<string, any>;
  is_active: boolean;
  project_type?: 'Flat/Apartment' | 'Residential Land (Plotting)' | 'Serviced Apartments' | 'Residential Land' | '1 RK/ Studio Apartment' | 'Independent House/Villa' | 'Farm House' | 'Duplex' | 'Other';
  image_url?: string | null;
  status?: 'Running' | 'Closed' | 'Hold';
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  is_important: boolean;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Target {
  id: string;
  user_id: string;
  period_type: 'monthly';
  target_sqft: number;
  // target_amount and target_units kept for legacy/compatibility if needed, but logic moves to sqft
  target_amount: number;
  target_units: number;
  start_date: string;
  end_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  alternate_phone: string | null;
  address: string | null;
  metadata: Record<string, any>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteVisit {
  id: string;
  requested_by: string;
  customer_name: string;
  customer_phone: string;
  pickup_location: string | null;
  project_ids: string[];
  visit_date: string;
  visit_time: string;
  status: 'pending' | 'approved' | 'declined' | 'pending_clarification' | 'trip_started' | 'completed' | 'cancelled';
  assigned_vehicle: string | null;
  driver_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  is_public: boolean;
  notes: string | null;
  rejection_reason: string | null;
  clarification_note: string | null;
  start_odometer: number | null;
  end_odometer: number | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Sale {
  id: string;
  sale_number: string;
  customer_id: string;
  project_id: string;
  sales_executive_id: string;
  team_leader_id: string | null;
  sale_date: string;
  property_type: string | null;
  unit_number: string | null;
  area_sqft: number | null;
  rate_per_sqft: number | null;
  base_price: number | null;
  additional_charges: number;
  discount: number;
  plc: number;
  dev_charges: number;
  is_agreement_done: boolean;
  agreement_date: string | null;
  is_registry_done: boolean;
  registry_date: string | null;
  total_revenue: number;
  booking_amount: number;
  registry_status: string | null; // Detailed status text
  possession_date: string | null;
  legal_status: string | null;
  payment_plan: string | null;
  notes: string | null;
  metadata: {
    booking_status?: 'booked' | 'cancelled';
    cancellation_reason?: string | null;
    cancelled_at?: string | null;
    cancelled_by?: string | null;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  sale_id: string;
  payment_date: string;
  amount: number;
  payment_type: 'booking' | 'installment' | 'final' | 'other';
  payment_mode: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card';
  transaction_reference: string | null;
  remarks: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Incentive {
  id: string;
  sale_id: string;
  sales_executive_id: string;
  calculation_month: string;
  calculation_year: number;
  total_incentive_amount: number;
  installment_1_amount: number;
  installment_1_paid: boolean;
  installment_1_date: string | null;
  installment_2_amount: number;
  installment_2_paid: boolean;
  installment_2_date: string | null;
  installment_3_amount: number;
  installment_3_paid: boolean;
  installment_3_date: string | null;
  installment_4_amount: number;
  installment_4_paid: boolean;
  installment_4_date: string | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  report_name: string;
  report_type: string;
  description: string | null;
  allowed_roles: UserRole[];
  is_downloadable: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, any>;
  created_at: string;
}

// =====================================================
// CRM MODULE TYPES
// =====================================================

export type LeadSource = 'Ads' | 'Walk-in' | 'Reference' | 'Channel Partner';
export type LeadStatus = 'New' | 'Contacted' | 'In Progress' | 'Qualified' | 'Site Visit Scheduled' | 'Site Visit Done' | 'Lost' | 'Disqualified' | 'Converted';
export type BudgetRange = '<50L' | '50L-1Cr' | '1Cr-2Cr' | '>2Cr';
export type PurposeType = 'Investment' | 'End Use';
export type LeadScore = 'Hot' | 'Warm' | 'Cold';
export type FollowupType = 'Call' | 'WhatsApp' | 'Visit' | 'Email';
export type CustomerResponse = 'Positive' | 'Neutral' | 'Negative';
export type CallStatus = 'Connected' | 'Ringing' | 'Disconnected' | 'Busy' | 'Not Responding' | 'Asked to call later';

export interface Lead {
  id: string;
  tenant_id: string;
  lead_id: string; // Auto-generated: L-YYYYMMDD-XXXX

  // Lead Source & Assignment
  lead_source: LeadSource;
  project_id: string | null;
  sales_executive_id: string | null;

  // Customer Details
  customer_name: string;
  mobile: string;
  email: string | null;
  city: string | null;

  // Requirement Details
  budget_range: BudgetRange | null;
  purpose: PurposeType | null;
  preferred_locations: string[] | null; // Array of location names

  // Lead Management
  lead_status: LeadStatus;
  lead_score: LeadScore;
  internal_notes: string | null;

  // Timestamps
  lead_date: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;

  // Metadata
  metadata: Record<string, any>;
}

export interface LeadFollowup {
  id: string;
  tenant_id: string;
  lead_id: string;

  // Follow-up Details
  followup_type: FollowupType;
  followup_date: string;

  // Discussion & Response
  discussion_summary: string;
  customer_response: CustomerResponse | null;
  call_status?: CallStatus;

  // Status Management
  previous_status: LeadStatus | null;
  new_status: LeadStatus;

  // Next Action
  next_followup_date: string | null;

  // Audit Trail
  created_at: string;
  created_by: string | null;
  is_editable: boolean;

  // Metadata
  metadata: Record<string, any>;
}

export interface LeadTransfer {
  id: string;
  tenant_id: string;
  lead_id: string;

  // Transfer Details
  from_executive_id: string | null;
  to_executive_id: string;

  // Approval Workflow
  requested_by: string;
  approved_by: string | null;
  transfer_status: 'Pending' | 'Approved' | 'Rejected';
  approval_notes: string | null;

  // Timestamps
  requested_at: string;
  approved_at: string | null;

  // Metadata
  metadata: Record<string, any>;
}

// Extended interfaces with relation data
export interface LeadWithRelations extends Lead {
  project?: Project;
  sales_executive?: Profile;
  followups?: LeadFollowup[];
  latest_followup?: LeadFollowup;
  followup_count?: number;
  overdue_followup?: boolean;
}
