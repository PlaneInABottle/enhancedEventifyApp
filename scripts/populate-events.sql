-- Event Population Script for Enhanced Eventify App
-- This script creates realistic event data using the existing "Huuj" business profile

-- Constants
SET session_replication_role = replica; -- Disable triggers for bulk insert

-- Get the existing business ID (Huuj)
-- Business ID: 09fc5b44-d067-4086-a73f-2f21f92bc094

-- Create addresses for venues in Istanbul
INSERT INTO addresses (id, full_address, city, country, postal_code, coordinates) VALUES
('a1111111-1111-1111-1111-111111111111', 'Galata Kulesi Mah., Galip Dede Cd. No:15, Beyoğlu', 'İstanbul', 'Turkey', '34420', ST_GeogFromText('POINT(28.9744 41.0258)')),
('a2222222-2222-2222-2222-222222222222', 'Arnavutköy Mah., Bebek Sahili Sk. No:8, Beşiktaş', 'İstanbul', 'Turkey', '34345', ST_GeogFromText('POINT(29.0416 41.0831)')),
('a3333333-3333-3333-3333-333333333333', 'Caferağa Mah., Moda Cd. No:32, Kadıköy', 'İstanbul', 'Turkey', '34710', ST_GeogFromText('POINT(29.0238 40.9876)')),
('a4444444-4444-4444-4444-444444444444', 'Tomtom Mah., İstiklal Cd. No:125, Beyoğlu', 'İstanbul', 'Turkey', '34433', ST_GeogFromText('POINT(28.9784 41.0369)')),
('a5555555-5555-5555-5555-555555555555', 'Kuruçeşme Mah., Muallim Naci Cd. No:54, Beşiktaş', 'İstanbul', 'Turkey', '34345', ST_GeogFromText('POINT(29.0472 41.0731)'));

-- Create venues for the business
INSERT INTO venues (id, business_id, address_id, name, description, capacity) VALUES
('v1111111-1111-1111-1111-111111111111', '09fc5b44-d067-4086-a73f-2f21f92bc094', 'a1111111-1111-1111-1111-111111111111', 'Huuj Galata', 'Rooftop bar with stunning Bosphorus views and craft cocktails', 120),
('v2222222-2222-2222-2222-222222222222', '09fc5b44-d067-4086-a73f-2f21f92bc094', 'a2222222-2222-2222-2222-222222222222', 'Huuj Bebek', 'Waterfront cafe perfect for jazz nights and intimate gatherings', 80),
('v3333333-3333-3333-3333-333333333333', '09fc5b44-d067-4086-a73f-2f21f92bc094', 'a3333333-3333-3333-3333-333333333333', 'Huuj Moda', 'Trendy event space in the heart of Moda with artistic ambiance', 150),
('v4444444-4444-4444-4444-444444444444', '09fc5b44-d067-4086-a73f-2f21f92bc094', 'a4444444-4444-4444-4444-444444444444', 'Huuj İstiklal', 'Multi-level venue on İstiklal Street for concerts and parties', 200),
('v5555555-5555-5555-5555-555555555555', '09fc5b44-d067-4086-a73f-2f21f92bc094', 'a5555555-5555-5555-5555-555555555555', 'Huuj Kuruçeşme', 'Elegant waterside location for premium events and dining', 100);

-- Create events
INSERT INTO events (id, business_id, title, description) VALUES
('e1111111-1111-1111-1111-111111111111', '09fc5b44-d067-4086-a73f-2f21f92bc094', 'Jazz Night at the Bosphorus', 'An evening of smooth jazz with local and international artists, featuring stunning Bosphorus views'),
('e2222222-2222-2222-2222-222222222222', '09fc5b44-d067-4086-a73f-2f21f92bc094', 'Sunset Photography Workshop', 'Learn advanced photography techniques during golden hour with professional photographers'),
('e3333333-3333-3333-3333-333333333333', '09fc5b44-d067-4086-a73f-2f21f92bc094', 'Turkish Wine Tasting Experience', 'Discover the finest Turkish wines paired with traditional mezze in an intimate setting'),
('e4444444-4444-4444-4444-444444444444', '09fc5b44-d067-4086-a73f-2f21f92bc094', 'Electronic Music Festival', 'Underground electronic music festival featuring top DJs and emerging artists'),
('e5555555-5555-5555-5555-555555555555', '09fc5b44-d067-4086-a73f-2f21f92bc094', 'Art & Coffee Morning', 'Creative morning session combining art workshops with specialty coffee tasting'),
('e6666666-6666-6666-6666-666666666666', '09fc5b44-d067-4086-a73f-2f21f92bc094', 'Rooftop Yoga at Sunrise', 'Start your day with energizing yoga session overlooking the city skyline'),
('e7777777-7777-7777-7777-777777777777', '09fc5b44-d067-4086-a73f-2f21f92bc094', 'Turkish Cuisine Masterclass', 'Hands-on cooking class featuring traditional Turkish dishes and modern techniques'),
('e8888888-8888-8888-8888-888888888888', '09fc5b44-d067-4086-a73f-2f21f92bc094', 'Live Acoustic Sessions', 'Intimate acoustic performances by singer-songwriters in a cozy atmosphere');

-- Create event instances (scheduled across next 2 weeks)
INSERT INTO event_instances (id, event_id, venue_id, start_datetime, end_datetime, max_attendees) VALUES
-- This week events
('i1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'v1111111-1111-1111-1111-111111111111', '2025-01-28 20:00:00+03', '2025-01-28 23:00:00+03', 100),
('i2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'v2222222-2222-2222-2222-222222222222', '2025-01-29 17:00:00+03', '2025-01-29 19:30:00+03', 25),
('i3333333-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333', 'v5555555-5555-5555-5555-555555555555', '2025-01-30 19:00:00+03', '2025-01-30 22:00:00+03', 40),
('i4444444-4444-4444-4444-444444444444', 'e5555555-5555-5555-5555-555555555555', 'v3333333-3333-3333-3333-333333333333', '2025-01-31 09:00:00+03', '2025-01-31 12:00:00+03', 30),
('i5555555-5555-5555-5555-555555555555', 'e6666666-6666-6666-6666-666666666666', 'v1111111-1111-1111-1111-111111111111', '2025-02-01 07:00:00+03', '2025-02-01 08:30:00+03', 20),

-- Next week events
('i6666666-6666-6666-6666-666666666666', 'e4444444-4444-4444-4444-444444444444', 'v4444444-4444-4444-4444-444444444444', '2025-02-01 22:00:00+03', '2025-02-02 04:00:00+03', 180),
('i7777777-7777-7777-7777-777777777777', 'e7777777-7777-7777-7777-777777777777', 'v2222222-2222-2222-2222-222222222222', '2025-02-02 14:00:00+03', '2025-02-02 17:00:00+03', 16),
('i8888888-8888-8888-8888-888888888888', 'e8888888-8888-8888-8888-888888888888', 'v3333333-3333-3333-3333-333333333333', '2025-02-03 20:00:00+03', '2025-02-03 22:30:00+03', 60),
('i9999999-9999-9999-9999-999999999999', 'e1111111-1111-1111-1111-111111111111', 'v1111111-1111-1111-1111-111111111111', '2025-02-04 20:00:00+03', '2025-02-04 23:00:00+03', 100),
('i0000000-0000-0000-0000-000000000000', 'e3333333-3333-3333-3333-333333333333', 'v5555555-5555-5555-5555-555555555555', '2025-02-05 19:30:00+03', '2025-02-05 22:30:00+03', 35),

-- Weekend events
('iaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e2222222-2222-2222-2222-222222222222', 'v2222222-2222-2222-2222-222222222222', '2025-02-08 16:00:00+03', '2025-02-08 18:30:00+03', 25),
('ibbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'e5555555-5555-5555-5555-555555555555', 'v3333333-3333-3333-3333-333333333333', '2025-02-09 10:00:00+03', '2025-02-09 13:00:00+03', 30);

-- Reset session replication role
SET session_replication_role = DEFAULT;

-- Verify the data was inserted
SELECT 
    'Addresses created: ' || COUNT(*) as result 
FROM addresses 
WHERE id LIKE 'a%-%-%-%-%'
UNION ALL
SELECT 
    'Venues created: ' || COUNT(*) as result 
FROM venues 
WHERE business_id = '09fc5b44-d067-4086-a73f-2f21f92bc094'
UNION ALL
SELECT 
    'Events created: ' || COUNT(*) as result 
FROM events 
WHERE business_id = '09fc5b44-d067-4086-a73f-2f21f92bc094'
UNION ALL
SELECT 
    'Event instances created: ' || COUNT(*) as result 
FROM event_instances 
WHERE event_id IN (
    SELECT id FROM events 
    WHERE business_id = '09fc5b44-d067-4086-a73f-2f21f92bc094'
);