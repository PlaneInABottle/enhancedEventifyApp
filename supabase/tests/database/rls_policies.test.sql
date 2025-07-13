-- Test RLS (Row Level Security) policies
-- Testing access control policies for events, user_profiles, venues, and business_profiles tables

BEGIN;

-- Load the TAP functions
SELECT plan(24);

-- Test 1: Verify events table has RLS enabled
SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'events' AND schemaname = 'public'),
    'events table should have RLS enabled'
);

-- Test 2: Verify user_profiles table has RLS enabled
SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'user_profiles' AND schemaname = 'public'),
    'user_profiles table should have RLS enabled'
);

-- Test 3: Verify venues table has RLS enabled
SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'venues' AND schemaname = 'public'),
    'venues table should have RLS enabled'
);

-- Test 4: Verify business_profiles table has RLS enabled
SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'business_profiles' AND schemaname = 'public'),
    'business_profiles table should have RLS enabled'
);

-- Test 5: Verify user_roles table has RLS enabled
SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'user_roles' AND schemaname = 'public'),
    'user_roles table should have RLS enabled'
);

-- Test 6: Verify role_permissions table has RLS enabled
SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'role_permissions' AND schemaname = 'public'),
    'role_permissions table should have RLS enabled'
);

-- Test 7: Check that events table has policies
SELECT ok(
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'events' AND schemaname = 'public'),
    'events table should have at least one policy'
);

-- Test 8: Check that user_profiles table has policies
SELECT ok(
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND schemaname = 'public'),
    'user_profiles table should have at least one policy'
);

-- Test 9: Check that venues table has policies
SELECT ok(
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'venues' AND schemaname = 'public'),
    'venues table should have at least one policy'
);

-- Test 10: Check that business_profiles table has policies
SELECT ok(
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'business_profiles' AND schemaname = 'public'),
    'business_profiles table should have at least one policy'
);

-- Test 11: Check that user_roles table has policies
SELECT ok(
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND schemaname = 'public'),
    'user_roles table should have at least one policy'
);

-- Test 12: Check that role_permissions table has policies
SELECT ok(
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'role_permissions' AND schemaname = 'public'),
    'role_permissions table should have at least one policy'
);

-- Test 13: Verify events table has multiple policies (should have CRUD policies)
SELECT ok(
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'events' AND schemaname = 'public') >= 4,
    'events table should have multiple policies for CRUD operations'
);

-- Test 14: Verify venues table has multiple policies
SELECT ok(
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'venues' AND schemaname = 'public') >= 4,
    'venues table should have multiple policies for CRUD operations'
);

-- Test 15: Verify user_profiles table has multiple policies
SELECT ok(
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_profiles' AND schemaname = 'public') >= 2,
    'user_profiles table should have multiple policies'
);

-- Test 16: Verify business_profiles table has multiple policies
SELECT ok(
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'business_profiles' AND schemaname = 'public') >= 2,
    'business_profiles table should have multiple policies'
);

-- ========== ENHANCED RLS POLICY VALIDATION ==========
-- Testing policy completeness and security patterns

-- Test 17: Verify events table has SELECT policies
SELECT ok(
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'events' AND cmd = 'SELECT'),
    'events table should have SELECT policies for read access control'
);

-- Test 18: Verify events table has INSERT policies  
SELECT ok(
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'events' AND cmd = 'INSERT'),
    'events table should have INSERT policies for write access control'
);

-- Test 19: Verify user_profiles table has user-specific policies
SELECT ok(
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND (policyname LIKE '%own%' OR policyname LIKE '%user%')),
    'user_profiles should have user-specific access policies'
);

-- Test 20: Verify business_profiles table has business role policies
SELECT ok(
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'business_profiles' AND (policyname LIKE '%business%' OR policyname LIKE '%Business%')),
    'business_profiles should have business role-based policies'
);

-- Test 21: Verify venues table has appropriate CRUD policies
SELECT ok(
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'venues' AND cmd IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')) >= 4,
    'venues table should have complete CRUD policy set'
);

-- Test 22: Verify user_roles table has restrictive policies
SELECT ok(
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND qual IS NOT NULL),
    'user_roles table should have restrictive access policies'
);

-- Test 23: Verify role_permissions table has read-only policies
SELECT ok(
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'role_permissions' AND cmd = 'SELECT'),
    'role_permissions should have SELECT policies for read access'
);

-- Test 24: Verify all tables have policies preventing unauthorized access
SELECT ok(
    NOT EXISTS(
        SELECT 1 FROM pg_tables t 
        WHERE t.schemaname = 'public' 
        AND t.tablename IN ('events', 'user_profiles', 'venues', 'business_profiles', 'user_roles', 'role_permissions')
        AND t.rowsecurity = true
        AND NOT EXISTS(SELECT 1 FROM pg_policies p WHERE p.tablename = t.tablename AND p.schemaname = t.schemaname)
    ),
    'All RLS-enabled tables should have at least one security policy'
);

SELECT finish();

ROLLBACK;