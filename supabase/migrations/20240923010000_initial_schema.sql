-- Organizations table
create table public.organizations (
    id uuid default gen_random_uuid() primary key,
    name varchar(255) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    settings jsonb default '{}'::jsonb
);

-- Locations table (restaurants/bars within an organization)
create table public.locations (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid references public.organizations(id) on delete cascade,
    name varchar(255) not null,
    address text not null,
    phone varchar(20),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    settings jsonb default '{}'::jsonb
);

-- Users table (extends auth.users)
create table public.users (
    id uuid references auth.users(id) on delete cascade primary key,
    organization_id uuid references public.organizations(id) on delete cascade,
    location_id uuid references public.locations(id) on delete set null,
    email varchar(255) not null unique,
    first_name varchar(100) not null,
    last_name varchar(100) not null,
    role varchar(20) check (role in ('admin', 'manager', 'waiter', 'kitchen', 'cashier')) not null,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories table
create table public.categories (
    id uuid default gen_random_uuid() primary key,
    location_id uuid references public.locations(id) on delete cascade,
    name varchar(255) not null,
    description text,
    sort_order integer default 0,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products table (menu items)
create table public.products (
    id uuid default gen_random_uuid() primary key,
    location_id uuid references public.locations(id) on delete cascade,
    category_id uuid references public.categories(id) on delete set null,
    name varchar(255) not null,
    description text,
    price decimal(10,2) not null,
    cost decimal(10,2) default 0,
    sku varchar(100),
    barcode varchar(100),
    image_url text,
    is_active boolean default true,
    track_inventory boolean default false,
    sort_order integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Modifiers table (add-ons, variations)
create table public.modifiers (
    id uuid default gen_random_uuid() primary key,
    location_id uuid references public.locations(id) on delete cascade,
    name varchar(255) not null,
    type varchar(20) check (type in ('single', 'multiple')) default 'single',
    required boolean default false,
    min_selections integer default 0,
    max_selections integer,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Modifier options
create table public.modifier_options (
    id uuid default gen_random_uuid() primary key,
    modifier_id uuid references public.modifiers(id) on delete cascade,
    name varchar(255) not null,
    price_adjustment decimal(10,2) default 0,
    sort_order integer default 0,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Product modifiers (many-to-many)
create table public.product_modifiers (
    id uuid default gen_random_uuid() primary key,
    product_id uuid references public.products(id) on delete cascade,
    modifier_id uuid references public.modifiers(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(product_id, modifier_id)
);

-- Tables table (for restaurant table management)
create table public.tables (
    id uuid default gen_random_uuid() primary key,
    location_id uuid references public.locations(id) on delete cascade,
    name varchar(100) not null,
    capacity integer default 4,
    section varchar(100),
    status varchar(20) check (status in ('available', 'occupied', 'cleaning', 'reserved')) default 'available',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders table
create table public.orders (
    id uuid default gen_random_uuid() primary key,
    location_id uuid references public.locations(id) on delete cascade,
    table_id uuid references public.tables(id) on delete set null,
    user_id uuid references public.users(id) on delete set null,
    order_number varchar(50) not null unique,
    status varchar(20) check (status in ('draft', 'submitted', 'preparing', 'ready', 'served', 'paid', 'cancelled')) default 'draft',
    order_type varchar(20) check (order_type in ('dine_in', 'takeout', 'delivery')) default 'dine_in',
    customer_name varchar(255),
    customer_phone varchar(20),
    subtotal decimal(10,2) default 0,
    tax_amount decimal(10,2) default 0,
    tip_amount decimal(10,2) default 0,
    total_amount decimal(10,2) default 0,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Order items table
create table public.order_items (
    id uuid default gen_random_uuid() primary key,
    order_id uuid references public.orders(id) on delete cascade,
    product_id uuid references public.products(id) on delete restrict,
    quantity integer not null default 1,
    unit_price decimal(10,2) not null,
    total_price decimal(10,2) not null,
    notes text,
    status varchar(20) check (status in ('pending', 'preparing', 'ready', 'served', 'cancelled')) default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Order item modifiers
create table public.order_item_modifiers (
    id uuid default gen_random_uuid() primary key,
    order_item_id uuid references public.order_items(id) on delete cascade,
    modifier_option_id uuid references public.modifier_options(id) on delete restrict,
    price_adjustment decimal(10,2) default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Payments table
create table public.payments (
    id uuid default gen_random_uuid() primary key,
    order_id uuid references public.orders(id) on delete cascade,
    amount decimal(10,2) not null,
    method varchar(20) check (method in ('cash', 'card', 'mtn_momo', 'airtel_pay', 'pesapal')) not null,
    status varchar(20) check (status in ('pending', 'processing', 'completed', 'failed', 'refunded')) default 'pending',
    transaction_id varchar(255),
    pesapal_tracking_id varchar(255),
    reference_number varchar(255),
    metadata jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Inventory ingredients
create table public.ingredients (
    id uuid default gen_random_uuid() primary key,
    location_id uuid references public.locations(id) on delete cascade,
    name varchar(255) not null,
    unit varchar(50) not null, -- kg, liters, pieces, etc.
    current_stock decimal(10,3) default 0,
    min_stock decimal(10,3) default 0,
    max_stock decimal(10,3),
    cost_per_unit decimal(10,2) default 0,
    supplier varchar(255),
    expiry_date date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Product ingredients (recipes)
create table public.product_ingredients (
    id uuid default gen_random_uuid() primary key,
    product_id uuid references public.products(id) on delete cascade,
    ingredient_id uuid references public.ingredients(id) on delete cascade,
    quantity_required decimal(10,3) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(product_id, ingredient_id)
);

-- Inventory transactions
create table public.inventory_transactions (
    id uuid default gen_random_uuid() primary key,
    ingredient_id uuid references public.ingredients(id) on delete cascade,
    transaction_type varchar(20) check (transaction_type in ('purchase', 'usage', 'waste', 'adjustment')) not null,
    quantity decimal(10,3) not null,
    cost decimal(10,2),
    reference_id uuid, -- Could reference order_id, purchase_order_id, etc.
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for performance
create index idx_users_organization_id on public.users(organization_id);
create index idx_users_location_id on public.users(location_id);
create index idx_locations_organization_id on public.locations(organization_id);
create index idx_products_location_id on public.products(location_id);
create index idx_products_category_id on public.products(category_id);
create index idx_orders_location_id on public.orders(location_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_created_at on public.orders(created_at);
create index idx_order_items_order_id on public.order_items(order_id);
create index idx_payments_order_id on public.payments(order_id);

-- Enable real-time subscriptions
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.tables;
alter publication supabase_realtime add table public.payments;
