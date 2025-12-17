-- Migration to update lead_status ENUM and constraints
-- Run this in your Supabase SQL Editor

-- 1. Add new intermediate statuses
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'Site Visit Scheduled';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'Site Visit Done';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'Lost';

-- 2. Add 'Converted' status
-- We use ADD instead of RENAME because 'Closed' was not found in your database.
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'Converted';

-- 3. Remove constraint preventing same-status updates
-- This allows adding follow-up notes without forcibly changing the lead status.
ALTER TABLE lead_followups DROP CONSTRAINT IF EXISTS status_change;
