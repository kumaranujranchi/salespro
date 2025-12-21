-- Add 'In Progress' to lead_status ENUM
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'In Progress';
