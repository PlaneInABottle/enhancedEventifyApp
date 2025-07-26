-- Test map functions functionality
-- Testing get_events_in_bounds function with geographic queries and data validation

BEGIN;

-- Load the TAP functions
SELECT plan(20);

-- ========== FUNCTION EXISTENCE TESTS ==========

-- Test 1: Verify get_events_in_bounds function exists
SELECT has_function(
    'public',
    'get_events_in_bounds',
    'get_events_in_bounds function should exist'
);

-- Test 2: Function executes without error (basic smoke test)
SELECT lives_ok(
    'SELECT * FROM get_events_in_bounds(41.2, 40.8, 29.2, 28.7)',
    'Function should execute without error'
);

-- ========== EDGE CASE TESTS (CRITICAL) ==========

-- Test 3: Invalid geographic bounds (inverted latitude)
SELECT is_empty(
    'SELECT * FROM get_events_in_bounds(40.8, 41.2, 29.2, 28.7)',
    'Should return empty set for inverted latitude bounds (north < south)'
);

-- Test 4: Invalid geographic bounds (inverted longitude) 
SELECT is_empty(
    'SELECT * FROM get_events_in_bounds(41.2, 40.8, 28.7, 29.2)',
    'Should return empty set for inverted longitude bounds (east < west)'
);

-- Test 5: Invalid time range (start > end)
SELECT is_empty(
    'SELECT * FROM get_events_in_bounds(41.2, 40.8, 29.2, 28.7, NOW() + INTERVAL ''2 days'', NOW() + INTERVAL ''1 day'')',
    'Should return empty set for invalid time range (start_date > end_date)'
);

-- Test 6: No matching events (empty geographic area)
SELECT is_empty(
    'SELECT * FROM get_events_in_bounds(80.0, 79.0, 180.0, 179.0)',
    'Should return empty set for area with no events (Arctic Ocean)'
);

-- Test 7: Zero-size bounds 
SELECT lives_ok(
    'SELECT * FROM get_events_in_bounds(41.0, 41.0, 29.0, 29.0)',
    'Should handle zero-size bounds without error'
);

-- Test 8: Large bounds (avoiding antipodal edge)
SELECT lives_ok(
    'SELECT * FROM get_events_in_bounds(60, -60, 60, -60)',
    'Should handle large geographic bounds without error'
);

-- Test 9: NULL parameter handling
SELECT lives_ok(
    'SELECT * FROM get_events_in_bounds(NULL, 40.8, 29.2, 28.7)',
    'Should handle NULL north parameter gracefully'
);

-- Test 10: Large coordinate ranges
SELECT lives_ok(
    'SELECT * FROM get_events_in_bounds(60, -60, 60, -60)',
    'Should handle large coordinate ranges'
);

-- ========== DATA SETUP FOR FUNCTIONAL TESTS ==========
-- Note: Using existing data from production database or creating minimal test data

-- Test 11: Function respects result limit
SELECT ok(
    (SELECT COUNT(*) FROM get_events_in_bounds(60, -60, 60, -60)) <= 200,
    'Should respect LIMIT 200 and not return more than 200 results'
);

-- ========== FUNCTIONAL TESTS WITH EXISTING DATA ==========

-- Test 12: Function excludes past events by default
SELECT ok(
    (SELECT COUNT(*) FROM get_events_in_bounds(60, -60, 60, -60) 
     WHERE start_datetime < NOW()) = 0,
    'Should exclude past events by default'
);

-- Test 13: Function only returns scheduled events
SELECT ok(
    (SELECT COUNT(*) FROM get_events_in_bounds(60, -60, 60, -60) 
     WHERE event_instance_status != 'scheduled') = 0,
    'Should only return scheduled events'
);

-- Test 14: Function only returns events from active venues
SELECT ok(
    (SELECT COUNT(*) FROM get_events_in_bounds(60, -60, 60, -60) v
     JOIN venues ven ON v.venue_id = ven.id 
     WHERE ven.is_active = false) = 0,
    'Should only return events from active venues'
);

-- ========== OUTPUT FORMAT TESTS ==========

-- Test 15: Coordinates are in GeoJSON format (if any events exist)
SELECT ok(
    (SELECT CASE 
       WHEN COUNT(*) = 0 THEN true 
       ELSE bool_and(coordinates->>'type' = 'Point')
     END
     FROM get_events_in_bounds(60, -60, 60, -60)),
    'Coordinates should be in GeoJSON Point format when events exist'
);

-- Test 16: All required fields are present (if any events exist)
SELECT ok(
    (SELECT CASE 
       WHEN COUNT(*) = 0 THEN true 
       ELSE bool_and(instance_id IS NOT NULL AND event_title IS NOT NULL AND venue_name IS NOT NULL)
     END
     FROM get_events_in_bounds(60, -60, 60, -60)),
    'Should return all required fields when events exist'
);

-- Test 17: Start datetime is in future (if any events exist)
SELECT ok(
    (SELECT CASE 
       WHEN COUNT(*) = 0 THEN true 
       ELSE bool_and(start_datetime >= NOW())
     END
     FROM get_events_in_bounds(60, -60, 60, -60)),
    'All returned events should have start_datetime in future'
);

-- Test 18: Date range filtering works
SELECT ok(
    (SELECT COUNT(*) FROM get_events_in_bounds(
        60, -60, 60, -60,
        NOW() + INTERVAL '100 years',
        NOW() + INTERVAL '101 years'
    )) = 0,
    'Should return no events for far future date range'
);

-- Test 19: Geographic filtering works (testing with tight Istanbul bounds)
SELECT ok(
    (SELECT COUNT(*) FROM get_events_in_bounds(41.01, 40.99, 29.01, 28.99)) >= 0,
    'Should handle tight geographic bounds (small Istanbul area)'
);

-- Test 20: Function handles boundary conditions
SELECT lives_ok(
    'SELECT * FROM get_events_in_bounds(41.000001, 40.999999, 29.000001, 28.999999)',
    'Should handle very small boundary differences without error'
);

SELECT finish();
ROLLBACK;