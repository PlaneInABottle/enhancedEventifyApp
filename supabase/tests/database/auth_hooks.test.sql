-- Test auth hooks functionality
-- Testing Custom Access Token Auth Hook for RBAC JWT claims injection
-- CRITICAL: Added functional testing per Gemini security review
-- Note: In Supabase, auth hook functions are stored in public schema
-- but configured as hooks through the Dashboard

BEGIN;

-- Load the TAP functions
SELECT plan(20);

-- ========== BASIC FUNCTION TESTS ==========

-- Test 1: Verify custom_access_token_hook function exists in public schema
SELECT has_function(
    'public',
    'custom_access_token_hook',
    ARRAY['jsonb'],
    'custom_access_token_hook function should exist in public schema'
);

-- Test 2: Verify function returns jsonb
SELECT function_returns(
    'public',
    'custom_access_token_hook',
    ARRAY['jsonb'],
    'jsonb',
    'custom_access_token_hook should return jsonb'
);

-- Test 3: Test hook function executes without error
SELECT lives_ok(
    'SELECT custom_access_token_hook(''{}''::jsonb)',
    'custom_access_token_hook should execute without error'
);

-- ========== FUNCTIONAL JWT CLAIM TESTS ==========

-- Test 4: Test hook with proper event structure and claims injection
SELECT ok(
    (custom_access_token_hook(jsonb_build_object(
        'user_id', '11111111-1111-1111-1111-111111111111',
        'claims', jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111', 'aud', 'authenticated', 'role', 'authenticated')
    )) -> 'claims' ? 'user_role'),
    'Hook should inject user_role claim into JWT'
);

-- Test 5: Test hook injects permissions array
SELECT ok(
    (custom_access_token_hook(jsonb_build_object(
        'user_id', '11111111-1111-1111-1111-111111111111',
        'claims', jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111')
    )) -> 'claims' -> 'permissions') IS NOT NULL,
    'Hook should inject permissions array into JWT'
);

-- Test 6: Test hook injects is_business_user flag
SELECT ok(
    (custom_access_token_hook(jsonb_build_object(
        'user_id', '11111111-1111-1111-1111-111111111111',
        'claims', jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111')
    )) -> 'claims' ? 'is_business_user'),
    'Hook should inject is_business_user flag into JWT'
);

-- Test 7: Test hook injects business_status claim
SELECT ok(
    (custom_access_token_hook(jsonb_build_object(
        'user_id', '11111111-1111-1111-1111-111111111111',
        'claims', jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111')
    )) -> 'claims' ? 'business_status'),
    'Hook should inject business_status claim into JWT'
);

-- Test 8: Test hook preserves original claims
SELECT ok(
    (custom_access_token_hook(jsonb_build_object(
        'user_id', '11111111-1111-1111-1111-111111111111',
        'claims', jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111', 'aud', 'authenticated', 'role', 'authenticated')
    )) -> 'claims' ->> 'aud') = 'authenticated',
    'Hook should preserve original JWT claims like aud'
);

-- Test 9: Test with a user that exists in database (we know defaults to 'user' role)
SELECT is(
    (custom_access_token_hook(jsonb_build_object(
        'user_id', '11111111-1111-1111-1111-111111111111',
        'claims', jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111')
    )) -> 'claims' ->> 'user_role'),
    'user',
    'Existing users should get appropriate role in JWT (defaults to user)'
);

-- Test 10: Test permissions array contains expected permissions for user role
SELECT ok(
    (custom_access_token_hook(jsonb_build_object(
        'user_id', '11111111-1111-1111-1111-111111111111',
        'claims', jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111')
    )) -> 'claims' -> 'permissions') @> '["events.view"]'::jsonb,
    'User role should have events.view permission in JWT'
);

-- Test 11: Test is_business_user flag for regular user
SELECT is(
    (custom_access_token_hook(jsonb_build_object(
        'user_id', '11111111-1111-1111-1111-111111111111',
        'claims', jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111')
    )) -> 'claims' ->> 'is_business_user')::boolean,
    false,
    'Regular user should have is_business_user = false in JWT claims'
);

-- Test 12: Test business_status for regular user
SELECT is(
    (custom_access_token_hook(jsonb_build_object(
        'user_id', '11111111-1111-1111-1111-111111111111',
        'claims', jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111')
    )) -> 'claims' ->> 'business_status'),
    'none',
    'Regular user should have business_status = none in JWT claims'
);

-- Test 13: Test permissions array structure is valid
SELECT ok(
    jsonb_typeof((custom_access_token_hook(jsonb_build_object(
        'user_id', '11111111-1111-1111-1111-111111111111',
        'claims', jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111')
    )) -> 'claims' -> 'permissions')) = 'array',
    'Permissions should be injected as an array type'
);

-- Test 14: Test user role permissions include basic access
SELECT ok(
    (custom_access_token_hook(jsonb_build_object(
        'user_id', '11111111-1111-1111-1111-111111111111',
        'claims', jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111')
    )) -> 'claims' -> 'permissions') @> '["users.view"]'::jsonb,
    'User role should have users.view permission in JWT'
);

-- Test 15: Test user role permissions include profile update
SELECT ok(
    (custom_access_token_hook(jsonb_build_object(
        'user_id', '11111111-1111-1111-1111-111111111111',
        'claims', jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111')
    )) -> 'claims' -> 'permissions') @> '["users.update"]'::jsonb,
    'User role should have users.update permission in JWT'
);

-- Test 16: Hook handles non-existent user gracefully
SELECT is(
    (custom_access_token_hook(jsonb_build_object(
        'user_id', '99999999-9999-9999-9999-999999999999',
        'claims', jsonb_build_object('sub', '99999999-9999-9999-9999-999999999999')
    )) -> 'claims' ->> 'user_role'),
    'user',
    'Hook should default to user role for non-existent users'
);

-- Test 17: Hook handles malformed input gracefully
SELECT lives_ok(
    'SELECT custom_access_token_hook(''{"invalid": "structure"}'');',
    'Hook should handle malformed input without throwing error'
);

-- Test 18: Hook returns proper event structure
SELECT ok(
    jsonb_typeof(custom_access_token_hook(jsonb_build_object(
        'user_id', '11111111-1111-1111-1111-111111111111',
        'claims', jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111')
    ))) = 'object',
    'Hook should return proper event object structure'
);

-- Test 19: Hook maintains user_id in response
SELECT is(
    (custom_access_token_hook(jsonb_build_object(
        'user_id', '11111111-1111-1111-1111-111111111111',
        'claims', jsonb_build_object('sub', '11111111-1111-1111-1111-111111111111')
    )) ->> 'user_id'),
    '11111111-1111-1111-1111-111111111111',
    'Hook should maintain user_id in response event'
);

-- Test 20: Hook handles empty claims object gracefully
SELECT lives_ok(
    'SELECT custom_access_token_hook(jsonb_build_object(''user_id'', ''11111111-1111-1111-1111-111111111111'', ''claims'', ''{}''::jsonb));',
    'Hook should handle empty claims object without error'
);

SELECT finish();

ROLLBACK;