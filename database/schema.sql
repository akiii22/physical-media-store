-- ============================================
-- PHYSICAL MEDIA STORE
-- Database Schema
-- PostgreSQL / Supabase
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- USERS
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL 
        CHECK(role IN ('admin', 'user'))
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);


-- ============================================
-- CATEGORIES
-- ============================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
);


-- ============================================
-- PRODUCTS
-- ============================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    description TEXT,

    media_type TEXT NOT NULL
        CHECK (
            media_type IN (
                'CD',
                'CASSETTE',
                'VINYL',
                'VCD',
                'DVD',
                'OTHER'
            )
        ),

    condition TEXT NOT NULL
        CHECK (
            condition IN (
                'NEW',
                'USED'
            )
        ),

    price NUMERIC(10,2) NOT NULL
        CHECK (price >= 0),

    stock INTEGER NOT NULL DEFAULT 0
        CHECK (stock >= 0),

    category_id UUID NOT NULL,

    image_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT
);

-- ============================================
-- ADDRESSES
-- ============================================

CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    recipient_name TEXT NOT NULL,

    phone TEXT NOT NULL,

    province TEXT NOT NULL,

    city TEXT NOT NULL,

    barangay TEXT NOT NULL,

    street_address TEXT NOT NULL,

    postal_code TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_addresses_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================
-- ORDERS
-- ============================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    status TEXT NOT NULL
        CHECK (
            status IN (
                'PENDING_PAYMENT',
                'PAYMENT_FAILED',
                'PAID',
                'PROCESSING',
                'READY_TO_SHIP',
                'SHIPPED',
                'DELIVERED',
                'READY_FOR_PICKUP',
                'PICKED_UP',
                'CANCELLED'
            )
        ),

    total_amount NUMERIC(10,2) NOT NULL
        CHECK (total_amount >= 0),

    delivery_method TEXT NOT NULL
        CHECK (
            delivery_method IN (
                'DELIVERY',
                'STORE_PICKUP'
            )
        ),

    -- Historical address snapshot
    recipient_name TEXT,
    phone TEXT,
    province TEXT,
    city TEXT,
    barangay TEXT,
    street_address TEXT,
    postal_code TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    delivered_at TIMESTAMPTZ,

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);


-- ============================================
-- ORDER ITEMS
-- ============================================

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL,

    product_id UUID NOT NULL,

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    unit_price NUMERIC(10,2) NOT NULL
        CHECK (unit_price >= 0),

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT unique_order_product
        UNIQUE (order_id, product_id)
);


-- ============================================
-- PAYMENTS
-- ============================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL,

    method TEXT NOT NULL
        CHECK (
            method IN (
                'GCASH',
                'MAYA',
                'CARD'
            )
        ),

    amount NUMERIC(10,2) NOT NULL
        CHECK (amount >= 0),

    status TEXT NOT NULL
        CHECK (
            status IN (
                'PENDING',
                'PAID',
                'FAILED',
                'CANCELLED'
            )
        ),

    provider_reference TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE RESTRICT
);

-- ============================================
-- SHIPMENTS
-- ============================================

CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL,

    courier TEXT,

    tracking_number TEXT,

    status TEXT NOT NULL
        CHECK (
            status IN (
                'PENDING',
                'READY_TO_SHIP',
                'SHIPPED',
                'DELIVERED'
            )
        ),

    tracking_url TEXT,

    shipped_at TIMESTAMPTZ,

    delivered_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_shipments_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE RESTRICT
);
