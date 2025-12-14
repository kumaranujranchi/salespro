/*
  # Seed Sample Data for SalesSphere (v2)

  ## Overview
  This migration seeds the database with sample data for testing and demonstration purposes.

  ## Data Seeded
  1. Departments (HR, Sales, Marketing, Accounts, Customer Service, Operation)
  2. Sample projects
  3. Sample announcements

  Note: User accounts will be created in Supabase Auth separately.
*/

-- Insert Departments (using gen_random_uuid())
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Sales') THEN
    INSERT INTO departments (name, description, is_active) VALUES
      ('Sales', 'Sales and business development team', true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Marketing') THEN
    INSERT INTO departments (name, description, is_active) VALUES
      ('Marketing', 'Marketing and brand management', true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Accounts') THEN
    INSERT INTO departments (name, description, is_active) VALUES
      ('Accounts', 'Finance and accounting department', true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM departments WHERE name = 'HR') THEN
    INSERT INTO departments (name, description, is_active) VALUES
      ('HR', 'Human resources and recruitment', true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Customer Service') THEN
    INSERT INTO departments (name, description, is_active) VALUES
      ('Customer Service', 'Customer support and service', true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Operation') THEN
    INSERT INTO departments (name, description, is_active) VALUES
      ('Operation', 'Operations and logistics', true);
  END IF;
END $$;

-- Insert Projects
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Skyline Heights') THEN
    INSERT INTO projects (name, address, location_lat, location_lng, is_active) VALUES
      ('Skyline Heights', '123 MG Road, Bangalore, Karnataka 560001', 12.9716, 77.5946, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Green Valley Apartments') THEN
    INSERT INTO projects (name, address, location_lat, location_lng, is_active) VALUES
      ('Green Valley Apartments', '456 Whitefield, Bangalore, Karnataka 560066', 12.9698, 77.7500, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Sunset Villas') THEN
    INSERT INTO projects (name, address, location_lat, location_lng, is_active) VALUES
      ('Sunset Villas', '789 Electronic City, Bangalore, Karnataka 560100', 12.8458, 77.6603, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Oceanic Residency') THEN
    INSERT INTO projects (name, address, location_lat, location_lng, is_active) VALUES
      ('Oceanic Residency', '321 Koramangala, Bangalore, Karnataka 560034', 12.9352, 77.6245, true);
  END IF;
END $$;

-- Insert Sample Announcements
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM announcements WHERE title = 'Welcome to SalesSphere') THEN
    INSERT INTO announcements (title, content, is_important, is_published) VALUES
      ('Welcome to SalesSphere', 'Welcome to our new Sales Management System! This platform will help us streamline our sales processes and improve team collaboration.', true, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM announcements WHERE title = 'Q4 Targets Released') THEN
    INSERT INTO announcements (title, content, is_important, is_published) VALUES
      ('Q4 Targets Released', 'Q4 sales targets have been assigned. Please check your targets page and reach out to your team leader if you have any questions.', true, true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM announcements WHERE title = 'Holiday Schedule') THEN
    INSERT INTO announcements (title, content, is_important, is_published) VALUES
      ('Holiday Schedule', 'Please note the upcoming holiday schedule for the next month. The office will be closed on the following dates...', false, true);
  END IF;
END $$;
