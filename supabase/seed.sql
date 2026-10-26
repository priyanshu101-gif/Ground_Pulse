-- ====================================================================
-- GroundPulse Seed Data (Sample Fictional Campus Grounds & Reports)
-- NOTE: All locations and facilities below are FICTIONAL campus grounds
-- created for demo, testing, and initial setup purposes.
-- ====================================================================

-- Clear existing demo data if re-seeding
TRUNCATE TABLE public.ground_reports, public.grounds CASCADE;

-- Insert Fictional Campus Grounds
INSERT INTO public.grounds (id, name, location_description, latitude, longitude, supported_sports)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'North Oval Turf Field',
        'North Campus Athletic Sector, opposite Residence Hall C. Floodlit regulation artificial turf.',
        37.4290000,
        -122.1685000,
        ARRAY['Soccer', 'Rugby', 'Ultimate Frisbee', 'Flag Football']
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'East Quad Basketball & Pickleball Courts',
        'Adjacent to Student Union East Plaza. Dual hard courts with double-rim hoops and evening lighting.',
        37.4278000,
        -122.1645000,
        ARRAY['Basketball', 'Pickleball']
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'Varsity Fieldhouse & 400m Track',
        'West Recreation District, Gate 4 entrance. All-weather 8-lane running track enclosing natural grass infield.',
        37.4262000,
        -122.1730000,
        ARRAY['Track & Field', 'Cricket', 'Soccer']
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'West Campus Tennis Center',
        'Near Physical Sciences building, 6 lighted hard-surface courts with windscreens and hitting wall.',
        37.4250000,
        -122.1760000,
        ARRAY['Tennis', 'Pickleball']
    ),
    (
        '55555555-5555-5555-5555-555555555555',
        'South Pavilion Sand Volleyball Courts',
        'South Campus Commons next to the Recreation Pool. Two outdoor deep-sand volleyball courts.',
        37.4235000,
        -122.1670000,
        ARRAY['Volleyball', 'Beach Volleyball']
    ),
    (
        '66666666-6666-6666-6666-666666666666',
        'Engineering Green Open Lawn',
        'Courtyard between Engineering Hall 2 and Computer Science wing. Open natural lawn area. (Non-GPS listed ground)',
        NULL,
        NULL,
        ARRAY['Spikeball', 'Frisbee', 'Yoga', 'Cricket']
    );

-- Insert Sample Staggered Reports to Demonstrate Freshness Rules:
-- 1. North Oval: Fresh report (Occupied, Soccer, submitted 6 mins ago)
INSERT INTO public.ground_reports (ground_id, status, sport_in_progress, note, submitted_at, reporter_id)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Occupied',
    'Soccer',
    'Campus club team playing a scrimmage on full pitch. Expected to wrap up around 6:30 PM.',
    now() - INTERVAL '6 minutes',
    'demo_student_1'
);

-- Older historical report for North Oval (submitted 70 mins ago)
INSERT INTO public.ground_reports (ground_id, status, sport_in_progress, note, submitted_at, reporter_id)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Available',
    NULL,
    'Field was completely clear right after rain stopped.',
    now() - INTERVAL '70 minutes',
    'demo_student_2'
);

-- 2. East Quad Courts: Aging report (Available, submitted 28 mins ago)
INSERT INTO public.ground_reports (ground_id, status, sport_in_progress, note, submitted_at, reporter_id)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Available',
    NULL,
    'Both courts open, hoops in good shape with fresh chain nets.',
    now() - INTERVAL '28 minutes',
    'demo_student_3'
);

-- 3. West Campus Tennis: Fresh report (Occupied, Tennis, submitted 11 mins ago)
INSERT INTO public.ground_reports (ground_id, status, sport_in_progress, note, submitted_at, reporter_id)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    'Occupied',
    'Tennis',
    'Courts 1-4 full with intramural doubles matches; 5 and 6 waiting for equipment bag.',
    now() - INTERVAL '11 minutes',
    'demo_student_4'
);

-- 4. South Pavilion Sand Volleyball: Stale report (Occupied, submitted 95 mins ago -> Stale)
INSERT INTO public.ground_reports (ground_id, status, sport_in_progress, note, submitted_at, reporter_id)
VALUES (
    '55555555-5555-5555-5555-555555555555',
    'Occupied',
    'Volleyball',
    '4v4 game underway on court A.',
    now() - INTERVAL '95 minutes',
    'demo_student_5'
);

-- 5. Varsity Fieldhouse: Aging report (Available, submitted 42 mins ago)
INSERT INTO public.ground_reports (ground_id, status, sport_in_progress, note, submitted_at, reporter_id)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Available',
    NULL,
    'Track open for jogging lanes 1-4. Infield grass is resting.',
    now() - INTERVAL '42 minutes',
    'demo_student_6'
);

-- 6. Engineering Green Open Lawn: No reports submitted -> Unknown state by default.
