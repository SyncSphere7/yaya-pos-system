-- Fix departments RLS policy for setup process
-- Drop existing policies
drop policy if exists "Users can view departments in their location" on public.departments;
drop policy if exists "Admins can manage departments" on public.departments;

-- Create new policies that work during setup
create policy "Users can view departments in their location" on public.departments
    for select using (
        location_id in (
            select location_id from public.users where id = auth.uid()
        )
    );

-- Allow insert during setup process (when user exists in users table)
create policy "Allow department creation during setup" on public.departments
    for insert with check (
        exists (
            select 1 from public.users 
            where location_id = departments.location_id
            and role in ('admin', 'manager')
        )
    );

-- Allow admins to update/delete departments
create policy "Admins can manage departments" on public.departments
    for all using (
        exists (
            select 1 from public.users 
            where id = auth.uid() 
            and role in ('admin', 'manager')
            and location_id = departments.location_id
        )
    );