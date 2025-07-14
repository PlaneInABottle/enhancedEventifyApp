-- Test user signup functionality
-- Testing handle_new_user_signup function and trigger
-- Tests profile creation and role assignment based on user_type

BEGIN;

-- Load the TAP functions
SELECT plan(10);

-- ========== BASIC FUNCTION TESTS ==========

-- Test 1: Verify handle_new_user_signup function exists
SELECT has_function(
    'public',
    'handle_new_user_signup',
    'handle_new_user_signup function should exist in public schema'
);

-- Test 2: Verify trigger exists on auth.users table
SELECT has_trigger(
    'auth',
    'users',
    'on_auth_user_created',
    'on_auth_user_created trigger should exist on auth.users table'
);

-- Test 3: Test function returns trigger type
SELECT ok(
    (SELECT prorettype::regtype::text FROM pg_proc WHERE proname = 'handle_new_user_signup') = 'trigger',
    'handle_new_user_signup should return trigger type'
);

-- ========== FUNCTIONAL TESTS ==========

-- Test 4: Test that inserting a user with user_type creates appropriate profile
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'testuser@example.com',
    '{"user_type": "user"}',
    NOW(),
    NOW()
);

SELECT ok(
    EXISTS(SELECT 1 FROM public.user_profiles WHERE id = '22222222-2222-2222-2222-222222222222'),
    'User profile should be created when user_type is user'
);

-- Clean up test data
DELETE FROM public.user_profiles WHERE id = '22222222-2222-2222-2222-222222222222';
DELETE FROM public.user_roles WHERE user_id = '22222222-2222-2222-2222-222222222222';
DELETE FROM auth.users WHERE id = '22222222-2222-2222-2222-222222222222';

-- Test 5: Test that inserting a user with business user_type creates business profile
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'testbusiness@example.com',
    '{"user_type": "business"}',
    NOW(),
    NOW()
);

SELECT ok(
    EXISTS(SELECT 1 FROM public.business_profiles WHERE id = '33333333-3333-3333-3333-333333333333'),
    'Business profile should be created when user_type is business'
);

-- Clean up test data
DELETE FROM public.business_profiles WHERE id = '33333333-3333-3333-3333-333333333333';
DELETE FROM public.user_roles WHERE user_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM auth.users WHERE id = '33333333-3333-3333-3333-333333333333';

-- Test 6: Test default behavior when user_type is missing
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    'testdefault@example.com',
    '{}',
    NOW(),
    NOW()
);

SELECT ok(
    EXISTS(SELECT 1 FROM public.user_profiles WHERE id = '44444444-4444-4444-4444-444444444444'),
    'User profile should be created by default when user_type is missing'
);

-- Clean up test data
DELETE FROM public.user_profiles WHERE id = '44444444-4444-4444-4444-444444444444';
DELETE FROM public.user_roles WHERE user_id = '44444444-4444-4444-4444-444444444444';
DELETE FROM auth.users WHERE id = '44444444-4444-4444-4444-444444444444';

-- Test 7: Test user role assignment for user type
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
VALUES (
    '55555555-5555-5555-5555-555555555555',
    'testrole@example.com',
    '{"user_type": "user"}',
    NOW(),
    NOW()
);

SELECT ok(
    EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = '55555555-5555-5555-5555-555555555555' AND role = 'user' AND is_active = TRUE),
    'User role should be assigned for user type'
);

-- Clean up test data
DELETE FROM public.user_profiles WHERE id = '55555555-5555-5555-5555-555555555555';
DELETE FROM public.user_roles WHERE user_id = '55555555-5555-5555-5555-555555555555';
DELETE FROM auth.users WHERE id = '55555555-5555-5555-5555-555555555555';

-- Test 8: Test business role assignment for business type
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
VALUES (
    '66666666-6666-6666-6666-666666666666',
    'testbusinessrole@example.com',
    '{"user_type": "business"}',
    NOW(),
    NOW()
);

SELECT ok(
    EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = '66666666-6666-6666-6666-666666666666' AND role = 'business' AND is_active = TRUE),
    'Business role should be assigned for business type'
);

-- Clean up test data
DELETE FROM public.business_profiles WHERE id = '66666666-6666-6666-6666-666666666666';
DELETE FROM public.user_roles WHERE user_id = '66666666-6666-6666-6666-666666666666';
DELETE FROM auth.users WHERE id = '66666666-6666-6666-6666-666666666666';

-- Test 9: Test business signup doesn't create user profile
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
VALUES (
    '77777777-7777-7777-7777-777777777777',
    'testnocontamination@example.com',
    '{"user_type": "business"}',
    NOW(),
    NOW()
);

SELECT ok(
    NOT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = '77777777-7777-7777-7777-777777777777'),
    'Business signup should not create user profile'
);

-- Clean up test data
DELETE FROM public.business_profiles WHERE id = '77777777-7777-7777-7777-777777777777';
DELETE FROM public.user_roles WHERE user_id = '77777777-7777-7777-7777-777777777777';
DELETE FROM auth.users WHERE id = '77777777-7777-7777-7777-777777777777';

-- Test 10: Test user signup doesn't create business profile
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
VALUES (
    '88888888-8888-8888-8888-888888888888',
    'testusernobusiness@example.com',
    '{"user_type": "user"}',
    NOW(),
    NOW()
);

SELECT ok(
    NOT EXISTS(SELECT 1 FROM public.business_profiles WHERE id = '88888888-8888-8888-8888-888888888888'),
    'User signup should not create business profile'
);

-- Clean up test data
DELETE FROM public.user_profiles WHERE id = '88888888-8888-8888-8888-888888888888';
DELETE FROM public.user_roles WHERE user_id = '88888888-8888-8888-8888-888888888888';
DELETE FROM auth.users WHERE id = '88888888-8888-8888-8888-888888888888';

SELECT finish();

ROLLBACK;