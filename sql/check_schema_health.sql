-- CHECK DATABASE HEALTH
-- This script checks if all strict required tables exist in your schema.
-- Run this to verify your database structure.

DO $$
DECLARE
  required_tables text[] := ARRAY[
    'tenants', 
    'profiles', 
    'departments', 
    'projects', 
    'customers', 
    'sales', 
    'incentives', 
    'payments', 
    'site_visits', 
    'targets', 
    'announcements', 
    'notifications', 
    'activity_log'  -- Check for singular
  ];
  
  t_name text;
  missing_tables text[] := ARRAY[]::text[];
  found_count integer := 0;
BEGIN
  RAISE NOTICE '--------------------------------------------';
  RAISE NOTICE '       DATABASE STRUCTURE CHECK REPORT      ';
  RAISE NOTICE '--------------------------------------------';

  FOREACH t_name IN ARRAY required_tables
  LOOP
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t_name) THEN
      RAISE NOTICE '[OK] Table found: %', t_name;
      found_count := found_count + 1;
    ELSE
      -- Check for plural variation for activity_log
      IF t_name = 'activity_log' AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_logs') THEN
        RAISE NOTICE '[OK] Table found: activity_logs (Plural variation)';
        found_count := found_count + 1;
      ELSE
        RAISE NOTICE '[MISSING] CRITICAL TABLE MISSING: %', t_name;
        missing_tables := array_append(missing_tables, t_name);
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE '--------------------------------------------';
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE NOTICE 'WARNING: The following tables are MISSING: %', missing_tables;
    RAISE NOTICE 'Some features will NOT work until you create them.';
  ELSE
    RAISE NOTICE 'SUCCESS: All core tables are present.';
  END IF;
  RAISE NOTICE '--------------------------------------------';
END;
$$;
