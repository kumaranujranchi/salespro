-- CHECK DATABASE HEALTH (VISUAL VERSION)
-- This script returns a real TABLE of results so you can see it in the "Results" tab.

SELECT 
  t.table_name,
  CASE 
    WHEN exists_in_db THEN '✅ OK'
    ELSE '❌ MISSING'
  END as status
FROM (
  SELECT 'tenants' as table_name, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') as exists_in_db
  UNION ALL
  SELECT 'profiles', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')
  UNION ALL
  SELECT 'departments', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'departments')
  UNION ALL
  SELECT 'projects', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'projects')
  UNION ALL
  SELECT 'customers', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'customers')
  UNION ALL
  SELECT 'sales', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'sales')
  UNION ALL
  SELECT 'incentives', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'incentives')
  UNION ALL
  SELECT 'payments', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'payments')
  UNION ALL
  SELECT 'site_visits', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'site_visits')
  UNION ALL
  SELECT 'targets', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'targets')
  UNION ALL
  SELECT 'announcements', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements')
  UNION ALL
  SELECT 'notifications', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')
  UNION ALL
  -- Check for either plural or singular activity logs
  SELECT 'activity_log', (EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_log') OR EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs'))
) t;
