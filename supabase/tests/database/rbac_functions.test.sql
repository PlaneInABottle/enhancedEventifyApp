-- Test RBAC functions functionality
-- Testing RBAC authorization logic and permission validation
-- CRITICAL: Added functional testing per Gemini security review

BEGIN;

-- Load the TAP functions
SELECT plan(35);

-- ========== BASIC FUNCTION TESTS ==========

-- Test 1: Verify authorize function exists with correct signature
SELECT has_function(
    'public',
    'authorize',
    ARRAY['text'],
    'authorize function should exist with text parameter'
);

-- Test 2: Verify get_user_role function exists
SELECT has_function(
    'public',
    'get_user_role',
    ARRAY['uuid'],
    'get_user_role function should exist'
);

-- Test 3: Verify has_role function exists
SELECT has_function(
    'public',
    'has_role',
    ARRAY['text'],
    'has_role function should exist'
);

-- Test 4: Verify is_business_owner function exists
SELECT has_function(
    'public',
    'is_business_owner',
    ARRAY['uuid'],
    'is_business_owner function should exist'
);

-- Test 5: Verify promote_to_business_role function exists
SELECT has_function(
    'public',
    'promote_to_business_role',
    ARRAY['uuid'],
    'promote_to_business_role function should exist'
);

-- Test 6: Test authorize function returns boolean
SELECT is(
    pg_typeof(authorize('events.read'))::text,
    'boolean',
    'authorize should return boolean'
);

-- Test 7: Test has_role function returns boolean
SELECT is(
    pg_typeof(has_role('user'))::text,
    'boolean',
    'has_role should return boolean'
);

-- Test 8: Test is_business_owner function returns boolean
SELECT is(
    pg_typeof(is_business_owner(NULL))::text,
    'boolean',
    'is_business_owner should return boolean'
);

-- ========== FUNCTIONAL AUTHORIZATION TESTS ==========

-- Test 9: Test authorize with valid permission that user role should have
SELECT ok(
    authorize('events.view') = true,
    'User role should be authorized for events.view permission'
);

-- Test 10: Test authorize with valid permission for user profile
SELECT ok(
    authorize('users.view') = true,
    'User role should be authorized for users.view permission'
);

-- Test 11: Test authorize with basic update permission
SELECT ok(
    authorize('users.update') = true,
    'User role should be authorized for users.update permission'
);

-- Test 12: Test authorize with invalid/non-existent permission
SELECT ok(
    authorize('invalid.permission') = false,
    'authorize should return false for non-existent permissions'
);

-- Test 13: Test authorize with empty permission string
SELECT ok(
    authorize('') = false,
    'authorize should return false for empty permission string'
);

-- Test 14: Test authorize with null permission
SELECT ok(
    authorize(NULL) = false,
    'authorize should return false for null permission'
);

-- ========== ROLE VALIDATION TESTS ==========

-- Test 15: Test has_role with valid 'user' role (default role)
SELECT ok(
    has_role('user') = true,
    'has_role should return true for user role (default role)'
);

-- Test 16: Test has_role with invalid role
SELECT ok(
    has_role('invalid_role') = false,
    'has_role should return false for non-existent role'
);

-- Test 17: Test has_role with empty role string
SELECT ok(
    has_role('') = false,
    'has_role should return false for empty role string'
);

-- Test 18: Test has_role with null role
SELECT ok(
    has_role(NULL) IS NULL,
    'has_role should return null for null role'
);

-- Test 19: Test has_role with admin role (should be false for regular users)
SELECT ok(
    has_role('admin') = false,
    'has_role should return false for admin role for regular users'
);

-- Test 20: Test has_role with business role (should be false for regular users)
SELECT ok(
    has_role('business') = false,
    'has_role should return false for business role for regular users'
);

-- ========== USER ROLE RETRIEVAL TESTS ==========

-- Test 21: Test get_user_role with existing user
SELECT is(
    get_user_role('11111111-1111-1111-1111-111111111111'::uuid)::text,
    'user',
    'get_user_role should return user role for existing user'
);

-- Test 22: Test get_user_role with non-existent user
SELECT is(
    get_user_role('99999999-9999-9999-9999-999999999999'::uuid)::text,
    'user',
    'get_user_role should default to user role for non-existent user'
);

-- Test 23: Test get_user_role with null user
SELECT is(
    get_user_role(NULL)::text,
    'user',
    'get_user_role should default to user role for null user'
);

-- ========== BUSINESS OWNERSHIP TESTS ==========

-- Test 24: Test is_business_owner with non-business user
SELECT ok(
    is_business_owner('11111111-1111-1111-1111-111111111111'::uuid) = false,
    'is_business_owner should return false for regular user'
);

-- Test 25: Test is_business_owner with null user
SELECT ok(
    is_business_owner(NULL) = false,
    'is_business_owner should return false for null user'
);

-- Test 26: Test is_business_owner with non-existent user
SELECT ok(
    is_business_owner('99999999-9999-9999-9999-999999999999'::uuid) = false,
    'is_business_owner should return false for non-existent user'
);

-- ========== BUSINESS ROLE PROMOTION TESTS ==========

-- Test 27: Test promote_to_business_role with valid user
SELECT ok(
    promote_to_business_role('11111111-1111-1111-1111-111111111111'::uuid) IS NOT NULL,
    'promote_to_business_role should execute without error for valid user'
);

-- Test 28: Test promote_to_business_role with non-existent user
SELECT ok(
    promote_to_business_role('99999999-9999-9999-9999-999999999999'::uuid) IS NOT NULL,
    'promote_to_business_role should handle non-existent user gracefully'
);

-- Test 29: Test promote_to_business_role with null user
SELECT ok(
    promote_to_business_role(NULL) IS NOT NULL,
    'promote_to_business_role should handle null user gracefully'
);

-- ========== PERMISSION-SPECIFIC AUTHORIZATION TESTS ==========

-- Test 30: Test multiple event permissions
SELECT ok(
    authorize('events.view') IS NOT NULL AND
    authorize('events.create') IS NOT NULL AND
    authorize('events.update') IS NOT NULL,
    'authorize should handle multiple event permission types'
);

-- Test 31: Test user profile permissions
SELECT ok(
    authorize('users.view') IS NOT NULL AND
    authorize('users.update') IS NOT NULL,
    'authorize should handle user profile permissions'
);

-- Test 32: Test venue permissions
SELECT ok(
    authorize('venues.view') IS NOT NULL,
    'authorize should handle venue permissions'
);

-- ========== EDGE CASE AND ERROR HANDLING TESTS ==========

-- Test 33: Test authorize with malformed permission format
SELECT ok(
    authorize('malformed permission string') = false,
    'authorize should return false for malformed permission strings'
);

-- Test 34: Test has_role with case-sensitive role name
SELECT ok(
    has_role('USER') = false,
    'has_role should be case-sensitive and return false for uppercase role'
);

-- Test 35: Test permission validation with special characters
SELECT ok(
    authorize('events.view@special!') = false,
    'authorize should return false for permissions with special characters'
);

SELECT finish();

ROLLBACK;