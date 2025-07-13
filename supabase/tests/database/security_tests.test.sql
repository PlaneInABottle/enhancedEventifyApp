-- Security & Penetration Tests for RBAC System
-- Testing SQL injection prevention, JWT manipulation, and privilege escalation
-- FOCUSED: Essential security tests without overengineering

BEGIN;

-- Load the TAP functions
SELECT plan(14);

-- ========== SQL INJECTION PREVENTION TESTS ==========

-- Test 1: Authorize function with SQL injection attempt
SELECT ok(
    authorize($$events.view'; DROP TABLE events; --$$) = false,
    'authorize should prevent SQL injection in permission parameter'
);

-- Test 2: Authorize function with malicious permission string
SELECT ok(
    authorize('events.view UNION SELECT * FROM user_roles') = false,
    'authorize should reject UNION injection attempts'
);

-- Test 3: Has_role function with SQL injection attempt
SELECT ok(
    has_role($$user'; DELETE FROM role_permissions; --$$) = false,
    'has_role should prevent SQL injection in role parameter'
);

-- Test 4: Get_user_role handles NULL input safely  
SELECT ok(
    get_user_role(NULL)::text = 'user',
    'get_user_role should handle NULL input gracefully'
);

-- ========== JWT MANIPULATION TESTS ==========

-- Test 5: Auth hook with malicious claims injection
SELECT ok(
    (custom_access_token_hook(jsonb_build_object(
        'user_id', '11111111-1111-1111-1111-111111111111',
        'claims', jsonb_build_object(
            'sub', '11111111-1111-1111-1111-111111111111',
            'user_role', 'admin',
            'permissions', '["admin.delete_all"]'
        )
    )) -> 'claims' ->> 'user_role') != 'admin',
    'Auth hook should not accept pre-injected user_role claims'
);

-- Test 6: Auth hook with malicious permission injection
SELECT ok(
    NOT ((custom_access_token_hook(jsonb_build_object(
        'user_id', '11111111-1111-1111-1111-111111111111',
        'claims', jsonb_build_object(
            'sub', '11111111-1111-1111-1111-111111111111',
            'permissions', '["admin.delete_all", "super.access"]'
        )
    )) -> 'claims' -> 'permissions') @> '["admin.delete_all"]'::jsonb),
    'Auth hook should not accept pre-injected permissions array'
);

-- ========== PRIVILEGE ESCALATION PREVENTION ==========

-- Test 7: Verify user cannot authorize admin permissions
SELECT ok(
    authorize('admin.delete_users') = false,
    'Regular user should not have admin permissions'
);

-- Test 8: Verify user cannot authorize business-only permissions  
SELECT ok(
    authorize('business.manage_events') = false,
    'Regular user should not have business permissions'
);

-- Test 9: Verify unauthorized role checking fails
SELECT ok(
    has_role('super_admin') = false,
    'User should not have super_admin role'
);

-- ========== BUSINESS LOGIC SECURITY TESTS ==========

-- Test 10: Promote function executes and returns boolean
SELECT ok(
    promote_to_business_role('11111111-1111-1111-1111-111111111111'::uuid) = false,
    'promote_to_business_role should execute and return false for test user'
);

-- Test 11: Verify promoted user gets business role, not admin
SELECT ok(
    get_user_role('11111111-1111-1111-1111-111111111111'::uuid)::text IN ('user', 'business'),
    'Promoted user should have business role or remain user, not become admin'
);

-- ========== INPUT VALIDATION TESTS ==========

-- Test 12: Authorize with extremely long permission string
SELECT ok(
    authorize(repeat('events.view.', 1000)) = false,
    'authorize should reject extremely long permission strings'
);

-- Test 13: Has_role with Unicode/special characters
SELECT ok(
    has_role($$user' OR 1=1 /*$$) = false,
    'has_role should handle special characters safely'
);

-- Test 14: Business owner check with NULL UUID should not crash
SELECT ok(
    is_business_owner(NULL) = false,
    'is_business_owner should handle NULL input gracefully'
);

SELECT finish();

ROLLBACK;
