-- ============================================
-- PHYSICAL MEDIA STORE
-- Seed / Demo Data
-- ============================================

-- ============================================
-- CATEGORIES
-- ============================================

INSERT INTO categories (id, name)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Music'),
    ('22222222-2222-2222-2222-222222222222', 'Movies'),
    ('33333333-3333-3333-3333-333333333333', 'Filipino'),
    ('44444444-4444-4444-4444-444444444444', 'International'),
    ('55555555-5555-5555-5555-555555555555', 'Other');


-- ============================================
-- USERS
-- ============================================

INSERT INTO users (id, email, role)
VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'customer@example.com',
        'CUSTOMER'
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'admin@physicalmedia.com',
        'ADMIN'
    );


-- ============================================
-- PRODUCTS
-- ============================================

INSERT INTO products (
    id,
    name,
    description,
    media_type,
    condition,
    price,
    stock,
    category_id,
    image_url
)
VALUES

(
    '10000000-0000-0000-0000-000000000001',
    'Michael Jackson - Thriller',
    'Classic Michael Jackson album.',
    'CD',
    'USED',
    350.00,
    3,
    '11111111-1111-1111-1111-111111111111',
    NULL
),

(
    '10000000-0000-0000-0000-000000000002',
    'The Beatles - Abbey Road',
    'Classic Beatles album.',
    'VINYL',
    'USED',
    1200.00,
    2,
    '11111111-1111-1111-1111-111111111111',
    NULL
),

(
    '10000000-0000-0000-0000-000000000003',
    'Queen - Greatest Hits',
    'Collection of Queen classics.',
    'CD',
    'USED',
    450.00,
    5,
    '11111111-1111-1111-1111-111111111111',
    NULL
),

(
    '10000000-0000-0000-0000-000000000004',
    'Backstreet Boys - Millennium',
    'Pop album from the late 1990s.',
    'CASSETTE',
    'USED',
    250.00,
    4,
    '44444444-4444-4444-4444-444444444444',
    NULL
),

(
    '10000000-0000-0000-0000-000000000005',
    'Spider-Man',
    'Spider-Man movie on DVD.',
    'DVD',
    'USED',
    300.00,
    3,
    '22222222-2222-2222-2222-222222222222',
    NULL
),

(
    '10000000-0000-0000-0000-000000000006',
    'Titanic',
    'Classic romantic drama movie.',
    'VCD',
    'USED',
    200.00,
    2,
    '22222222-2222-2222-2222-222222222222',
    NULL
),

(
    '10000000-0000-0000-0000-000000000007',
    'Eraserheads - Ultraelectromagneticpop!',
    'Classic Filipino rock album.',
    'CD',
    'USED',
    500.00,
    6,
    '33333333-3333-3333-3333-333333333333',
    NULL
),

(
    '10000000-0000-0000-0000-000000000008',
    'Jose Mari Chan Collection',
    'Collection of Filipino music.',
    'CASSETTE',
    'USED',
    180.00,
    1,
    '33333333-3333-3333-3333-333333333333',
    NULL
);


-- ============================================
-- ADDRESSES
-- ============================================

INSERT INTO addresses (
    id,
    user_id,
    recipient_name,
    phone,
    province,
    city,
    barangay,
    street_address,
    postal_code
)
VALUES
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Juan Dela Cruz',
    '09171234567',
    'Cavite',
    'Dasmarinas',
    'Barangay San Agustin',
    '123 Main Street',
    '4114'
);


-- ============================================
-- ORDERS
-- ============================================

INSERT INTO orders (
    id,
    user_id,
    status,
    total_amount,
    delivery_method,
    recipient_name,
    phone,
    province,
    city,
    barangay,
    street_address,
    postal_code
)
VALUES
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'PAID',
    800.00,
    'DELIVERY',
    'Juan Dela Cruz',
    '09171234567',
    'Cavite',
    'Dasmarinas',
    'Barangay San Agustin',
    '123 Main Street',
    '4114'
);


-- ============================================
-- ORDER ITEMS
-- ============================================

INSERT INTO order_items (
    id,
    order_id,
    product_id,
    quantity,
    unit_price
)
VALUES

(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '10000000-0000-0000-0000-000000000001',
    1,
    350.00
),

(
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '10000000-0000-0000-0000-000000000003',
    1,
    450.00
);


-- ============================================
-- PAYMENTS
-- ============================================

INSERT INTO payments (
    id,
    order_id,
    method,
    amount,
    status,
    provider_reference
)
VALUES
(
    '99999999-9999-9999-9999-999999999999',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'GCASH',
    800.00,
    'PAID',
    'DEMO-GCASH-001'
);


-- ============================================
-- SHIPMENTS
-- ============================================

INSERT INTO shipments (
    id,
    order_id,
    courier,
    tracking_number,
    status,
    tracking_url
)
VALUES
(
    '88888888-8888-8888-8888-888888888888',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'J&T Express',
    'DEMO123456789',
    'SHIPPED',
    'https://example.com/tracking/DEMO123456789'
);