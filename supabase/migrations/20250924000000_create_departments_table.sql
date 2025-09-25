-- Create departments table (Restaurant, Bar, Fumes)
create table if not exists public.departments (
    id uuid default gen_random_uuid() primary key,
    location_id uuid references public.locations(id) on delete cascade,
    name varchar(100) not null check (name in ('Restaurant', 'Bar', 'Fumes')),
    description text,
    color varchar(7) default '#2563eb',
    icon varchar(50),
    is_active boolean default true,
    sort_order integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(location_id, name)
);

-- Create index for performance
create index if not exists idx_departments_location_id on public.departments(location_id);

-- Enable RLS
alter table public.departments enable row level security;

-- Create RLS policies
create policy "Users can view departments in their location" on public.departments
    for select using (
        location_id in (
            select location_id from public.users where id = auth.uid()
        )
    );

create policy "Admins can manage departments" on public.departments
    for all using (
        exists (
            select 1 from public.users 
            where id = auth.uid() 
            and role in ('admin', 'manager')
            and location_id = departments.location_id
        )
    );