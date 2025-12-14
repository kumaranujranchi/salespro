export type UserRole = 'super_admin' | 'admin' | 'director' | 'team_leader' | 'sales_executive' | 'crm_staff' | 'accountant' | 'driver' | 'receptionist';

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
  is_active: boolean;
  force_password_change: boolean;
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
