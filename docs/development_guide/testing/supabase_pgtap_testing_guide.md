# Supabase Database Testing with pgTAP

This guide summarizes key practices for database testing in Supabase projects using `pgTAP`, based on the insights from Basejump's article "A Guide to testing on Supabase using pgTAP".

## 1. Introduction to pgTAP for Supabase Testing

`pgTAP` is a PostgreSQL extension that provides a simple, familiar `TAP` (Test Anything Protocol) interface for writing database tests directly in SQL. It's ideal for testing:
*   Database functions and stored procedures.
*   Row Level Security (RLS) policies.
*   Triggers and other database logic.
*   Data integrity constraints.

## 2. Setting Up and Running Tests

Supabase projects typically include a `supabase/tests` directory. SQL files within this directory are executed as tests.

**Key Considerations:**
*   **Test Helpers:** Supabase provides test helpers (e.g., for authentication, RLS verification) that can be used within your SQL tests to simulate different user contexts.
*   **Test Environment:** Tests should be run against a dedicated test database to ensure isolation and prevent interference with development or production data.

## 3. Writing Tests for Supabase

Tests are written as SQL scripts using `pgTAP` functions.

### Authenticated vs. Anonymous Requests

It's crucial to test database behavior under different authentication contexts:
*   **Anonymous:** Simulate requests from unauthenticated users.
*   **Authenticated:** Simulate requests from logged-in users, often with specific roles (e.g., `user`, `business`, `admin`).

Supabase test helpers allow you to set the `request.jwt.claims` for authenticated tests, enabling you to verify RLS and permission-based logic.

### Example (Conceptual)

```sql
-- Test for an authenticated user
SELECT plan(1); -- Declare 1 test

-- Simulate a user session
SELECT set_config('request.jwt.claims', '{"sub":"user_id_123", "role":"authenticated", "user_role":"user"}', TRUE);

-- Test that a user can select their own data
SELECT lives_ok(
    'SELECT * FROM profiles WHERE id = ''user_id_123''',
    'Authenticated user can select their own profile'
);

SELECT * FROM finish();
```

## 4. Ensuring Row Level Security (RLS)

RLS is a critical security feature in Supabase. All tables containing sensitive data should have RLS enabled.

### Testing RLS Policies

Tests should cover all CRUD (Create, Read, Update, Delete) operations for each relevant role:

*   **`SELECT` policies:** Verify users can only read data they are authorized to see.
*   **`INSERT` policies:** Verify users can only insert data they are authorized to create.
*   **`UPDATE` policies:** Verify users can only modify data they are authorized to change.
*   **`DELETE` policies:** Verify users can only delete data they are authorized to remove.

**Example (Conceptual RLS Test):**

```sql
-- Test RLS for SELECT on 'events' table
SELECT plan(2);

-- As anonymous user, should not see any events
SELECT set_config('request.jwt.claims', '{}', TRUE);
SELECT is_empty(
    'SELECT * FROM events',
    'Anonymous user should see no events'
);

-- As authenticated user, should only see public events or their own events
SELECT set_config('request.jwt.claims', '{"sub":"user_id_456", "role":"authenticated", "user_role":"user"}', TRUE);
SELECT results_eq(
    'SELECT COUNT(*) FROM events',
    ARRAY[1]::bigint[], -- Assuming 1 event is visible to this user
    'Authenticated user sees only authorized events'
);

SELECT * FROM finish();
```

## 5. Automating Tests with GitHub Actions

Integrate your `pgTAP` tests into your CI/CD pipeline using GitHub Actions. This ensures that database changes are automatically validated with every push or pull request.

A typical workflow would involve:
1.  Setting up a Supabase test environment.
2.  Running migrations to bring the test database up to date.
3.  Executing the `pgTAP` tests.
4.  Reporting test results.

This guide provides a foundation for robust database testing in your Supabase project, complementing your application-level tests.
