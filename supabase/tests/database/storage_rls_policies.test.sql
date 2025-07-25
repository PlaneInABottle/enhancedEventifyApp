-- Test Storage RLS (Row Level Security) policies
-- Testing access control policies for storage.objects table (avatars bucket)

BEGIN;

-- Load the TAP functions
SELECT plan(12);

-- Test 1: Verify storage.objects table has RLS enabled
SELECT ok(
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'objects' AND schemaname = 'storage'),
    'storage.objects table should have RLS enabled'
);

-- Test 2: Check that storage.objects table has policies
SELECT ok(
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'),
    'storage.objects table should have at least one policy'
);

-- Test 3: Verify storage.objects has multiple policies for avatars bucket
SELECT ok(
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') >= 4,
    'storage.objects should have multiple policies for CRUD operations'
);

-- Test 4: Verify avatars bucket has SELECT (public read) policy
SELECT ok(
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND cmd = 'SELECT' AND policyname LIKE '%avatar%'),
    'avatars bucket should have SELECT policy for public read access'
);

-- Test 5: Verify avatars bucket has INSERT (upload) policy
SELECT ok(
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND cmd = 'INSERT' AND policyname LIKE '%avatar%'),
    'avatars bucket should have INSERT policy for user uploads'
);

-- Test 6: Verify avatars bucket has UPDATE policy
SELECT ok(
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND cmd = 'UPDATE' AND policyname LIKE '%avatar%'),
    'avatars bucket should have UPDATE policy for user updates'
);

-- Test 7: Verify avatars bucket has DELETE policy
SELECT ok(
    EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND cmd = 'DELETE' AND policyname LIKE '%avatar%'),
    'avatars bucket should have DELETE policy for user deletions'
);

-- Test 8: Verify INSERT policy restricts to user's own folder
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND cmd = 'INSERT' 
        AND policyname LIKE '%avatar%'
        AND with_check::text LIKE '%auth.uid()%'
    ),
    'Avatar INSERT policy should restrict uploads to user own folder'
);

-- Test 9: Verify UPDATE policy restricts to user's own files
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND cmd = 'UPDATE' 
        AND policyname LIKE '%avatar%'
        AND qual::text LIKE '%auth.uid()%'
    ),
    'Avatar UPDATE policy should restrict updates to user own files'
);

-- Test 10: Verify DELETE policy restricts to user's own files
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND cmd = 'DELETE' 
        AND policyname LIKE '%avatar%'
        AND qual::text LIKE '%auth.uid()%'
    ),
    'Avatar DELETE policy should restrict deletions to user own files'
);

-- Test 11: Verify public read policy uses bucket_id filter
SELECT ok(
    EXISTS(
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND cmd = 'SELECT' 
        AND policyname LIKE '%avatar%'
        AND qual::text LIKE '%bucket_id%avatars%'
    ),
    'Avatar SELECT policy should filter by bucket_id'
);

-- Test 12: Verify complete CRUD policy set for avatars
SELECT ok(
    (SELECT COUNT(DISTINCT cmd) FROM pg_policies 
     WHERE tablename = 'objects' 
     AND schemaname = 'storage' 
     AND policyname LIKE '%avatar%') = 4,
    'Avatars bucket should have complete CRUD policy set (SELECT, INSERT, UPDATE, DELETE)'
);

SELECT finish();

ROLLBACK;