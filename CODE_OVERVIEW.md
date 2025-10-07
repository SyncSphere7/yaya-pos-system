# Yaya POS System — Code Overview

This document explains how the codebase is organized and how the main parts of the system work together. It’s designed to help new contributors quickly understand where things live and how to extend the app safely.

## High-Level Architecture
- Frontend: Next.js 14 (App Router) + TypeScript + Material UI/Tailwind CSS
- Backend: Supabase (PostgreSQL, Auth, Realtime)
- State: Zustand for client state, React Query patterns for server state (where applicable)
- Payments: Pesapal integration (see src/lib/payments/pesapal.ts)
- Realtime UX: Supabase channels/subscriptions for orders and kitchen updates

## Directory Layout (practical map)
- src/
  - app/
    - (dashboards)/
      - admin/ — Admin dashboards (analytics, management)
      - kitchen/ — Kitchen Display System (KDS)
      - pos/ — POS screen for waiters/cashiers
    - login/ — Auth entry points for admin/staff
    - setup/ — First-time setup wizard for organization/location
    - page.tsx — Landing with smart routing based on state/role
    - layout.tsx — App-wide layout and metadata
    - globals.css — Global styles
  - components/
    - auth/ — Auth provider, guards (PermissionGuard/RoleGuard), PIN login
    - pos/ — POS-specific UI blocks (e.g., receipt generator, selectors)
    - admin/ — Admin widgets (user/staff management)
    - ui/ — Base UI components (common reusable)
  - lib/
    - supabase.ts — Supabase client setup and exported types
    - payments/
      - pesapal.ts — Pesapal integration (auth, create orders, status polling)
    - logger.ts — App logger helpers (persist logs to localStorage)
    - theme.ts — Material UI theme overrides
  - stores/
    - auth.ts — Auth state (role, user, session) and helpers
    - pos.ts — POS state (cart/order, departments, tables)
    - kitchen.ts — Kitchen state (incoming orders, status, bumping)

- scripts/
  - reset-database.sql — Helper to wipe data in Supabase and restart sequences

- supabase/
  - migrations/ — SQL migrations applied to the Supabase database

Other root files:
- README.md — Product-level README (features, routes, setup)
- CODE_OVERVIEW.md — This document
- supabase-schema.sql / permissions-schema.sql — DB schema and RLS/permissions

## Routing and Guards
- Public entry points: /, /login, /login/admin, /login/staff, /setup
- Protected dashboards: /(dashboards)/pos, /kitchen, /admin
- Guards:
  - components/auth/auth-provider.tsx — Provides auth context from Zustand
  - components/auth/permission-guard.tsx and role-guard.tsx — Protect views based on role/permissions

Typical routing flow:
1. User lands on /.
2. App checks auth state (stores/auth.ts) and setup state.
3. User is redirected to the correct dashboard based on role or to /setup if first-time.

## State Management
- Zustand stores in src/stores/* are the single source for client state per domain.
- Common pattern: derive UI state from store + subscribe to changes via hooks like useAuthStore, usePOSStore, useKitchenStore.
- Server data (orders, products) is fetched via Supabase and merged into store state; realtime updates are pushed via Supabase channels.

Key stores:
- auth.ts: tracks session/user, role, and setup completion status.
- pos.ts: currently selected department, table, active order/cart, items, totals.
- kitchen.ts: queue of incoming orders, their statuses, and bump/complete actions.

## Supabase Integration
- src/lib/supabase.ts initializes client using NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
- Database schema is managed by supabase-schema.sql and migrations in supabase/migrations.
- RLS and permissions are configured in permissions-schema.sql.
- reset-database.sql provides a clean wipe (data delete + sequence reset) for dev.

## Payments (Pesapal)
- src/lib/payments/pesapal.ts encapsulates all interactions:
  - getAccessToken(): fetches OAuth token
  - createOrder(): creates payment order
  - getPaymentStatus(): polls payment status
  - Webhook handling would live in app/api if added (currently client-initiated polling)
- Environment variables (see README): PESAPAL_CONSUMER_KEY, PESAPAL_CONSUMER_SECRET, PESAPAL_API_URL.

## UI/Theme
- Material UI components customized via src/lib/theme.ts.
- Global CSS in src/app/globals.css. Tailwind classes can coexist for utility styling.

## How the Dashboards Work
- POS (/pos):
  - Reads departments, categories, and products (via Supabase) and displays a touch-first grid.
  - Users add items to cart; totals are computed in the store; checkout triggers payment flow.
  - On submit, an order is written to the DB; KDS receives realtime update.

- Kitchen (/kitchen):
  - Subscribes to new orders and displays them in columns by status.
  - Allows bumping/marking orders done; updates reflect back to POS.

- Admin (/admin):
  - Management tools: users/staff, inventory, analytics (incrementally built).

## Authentication & Roles
- Supabase Auth manages sessions. The auth store maps the Supabase user to a role (Admin, Manager, Waiter, Kitchen, Cashier).
- Role-based guards gate dashboard routes; unauthorized users are redirected to appropriate login.
- Setup flow (/setup) ensures an organization, location, and at least one admin user exist.

## Local Development Tips
- Environment: copy .env.example to .env.local and fill Supabase + Pesapal keys.
- Database:
  - Run supabase-schema.sql in Supabase SQL Editor to provision objects.
  - Optionally run scripts/reset-database.sql to clear dev data.
- Routing: start at /; it will redirect based on auth/setup status.
- Debugging:
  - src/lib/logger.ts stores logs in localStorage (useful on devices/kiosks).
  - /debug-env page can be used to inspect environment in dev.

## Extending the System
- Add a new dashboard: create a new route under src/app/(dashboards)/<your-dashboard>/page.tsx, protect with a guard, and add a Zustand store if needed.
- Add a new payment method: add a new module under src/lib/payments, expose a consistent interface (createPayment, getStatus), and wire it into checkout UI.
- Add a new entity (e.g., modifiers): update DB schema (SQL), generate types (see package.json supabase:types), create lib helpers and store slices.

## Notable Files To Read First
- src/app/page.tsx — Landing logic and navigation
- src/stores/auth.ts — Auth/role state and setup checks
- src/app/(dashboards)/pos/page.tsx — Main POS screen
- src/app/(dashboards)/kitchen/page.tsx — KDS
- src/lib/payments/pesapal.ts — Payments integration
- src/lib/supabase.ts — Database client

If you need deeper guidance on any specific module, open an issue or leave a comment and we’ll expand this overview.
