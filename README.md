# Yaya Xtra Residence POS

A world-class, market-ready Point of Sale (POS) system for bars and restaurants, powered by Supabase and modeled after industry leaders like Toast, Square, and Lightspeed. Perfect for hospitality businesses managing **Restaurant**, **Bar**, and **Fumes** (hookah lounge) operations.

## 🚀 Features

### 🎯 Department-Based Operations
- **Restaurant**: Full dining experience with appetizers, mains, desserts
- **Bar**: Complete bar service with beers, spirits, wines, cocktails
- **Fumes**: Hookah lounge with shisha flavors and smoking accessories

### 🎯 Role-Based Dashboards
- **Waiter Dashboard**: Touch-optimized order entry, table management, real-time order status
- **Kitchen Display System (KDS)**: Color-coded orders, timers, order bumping functionality
- **Admin Dashboard**: Sales analytics, inventory management, staff performance, reporting

### 💳 Payment Integration
- **Cash Management**: Local cash handling and reconciliation
- **Digital Payments**: Pesapal integration for MTN Momo, AirtelPay, and Visa cards
- **Real-time Status**: Transaction tracking with comprehensive error handling

### 📊 Advanced Features
- **Real-time Updates**: Live order synchronization across all dashboards
- **Inventory Management**: Ingredient-level tracking with low-stock alerts
- **Touch-Optimized UI**: Large tap targets, mobile-first design
- **Role-Based Access**: Granular permissions and secure authentication
- **Multi-location Support**: Scalable for restaurant chains

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time + Auth)
- **State Management**: Zustand with React Query for server state
- **Payments**: Pesapal Gateway integration
- **UI Components**: Headless UI with custom POS-optimized variants
- **Hardware**: WebUSB/WebSerial support for printers and scanners

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Pesapal merchant account (for payments)

### Setup Steps

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd yaya-pos-system
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   PESAPAL_CONSUMER_KEY=your_pesapal_consumer_key
   PESAPAL_CONSUMER_SECRET=your_pesapal_consumer_secret
   PESAPAL_API_URL=https://pay.pesapal.com/v3
   
   NODE_ENV=development
   ```

3. **Database Setup**
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
   - Run the departments setup from `scripts/setup-departments.sql` (update location ID)
   - Enable Row Level Security and Real-time subscriptions

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎨 Dashboard Routes

- **`/`** - Landing page with role-based redirects
- **`/pos`** - Waiter/Cashier dashboard (order entry)
- **`/kitchen`** - Kitchen Display System
- **`/admin`** - Admin dashboard (coming soon)
- **`/login`** - Authentication page (to be built)

## 🔐 User Roles

- **Admin**: Full system access, analytics, user management
- **Manager**: Location management, reporting, staff oversight  
- **Waiter**: Order entry, table management, payment processing
- **Kitchen**: Order preparation, status updates, kitchen display
- **Cashier**: Payment processing, order completion

## 🏪 Database Schema

The system uses a comprehensive PostgreSQL schema with:

- **Organizations & Locations**: Multi-tenant support
- **Users & Roles**: Role-based access control
- **Products & Categories**: Menu management with modifiers
- **Orders & Items**: Complete order lifecycle tracking
- **Payments**: Multi-method payment processing
- **Tables**: Restaurant table management
- **Inventory**: Ingredient-level stock tracking

## 💡 Key Workflows

### Order Processing Flow
1. Waiter creates order via POS dashboard
2. Order appears in Kitchen Display System
3. Kitchen staff update preparation status
4. Order completion triggers payment flow
5. Real-time updates across all interfaces

### Payment Processing
1. Support for cash, card, and mobile money
2. Pesapal integration for digital payments
3. Real-time transaction status tracking
4. Automated reconciliation and reporting

## 🛠️ Development

### Project Structure
```
src/
├── app/                    # Next.js app router
│   ├── (dashboards)/      # Protected dashboard routes
│   ├── api/               # API endpoints
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── auth/             # Authentication components
│   └── ui/               # Base UI components
├── lib/                  # Utility libraries
│   ├── payments/         # Payment service integration
│   ├── supabase.ts       # Database client
│   └── utils.ts          # Helper functions
└── stores/               # Zustand state management
    ├── auth.ts           # Authentication state
    ├── pos.ts            # POS functionality
    └── kitchen.ts        # Kitchen operations
```

### Key Design Patterns
- **Modular Architecture**: Clear separation of concerns
- **Real-time State**: Supabase subscriptions for live updates
- **Touch-First UI**: Optimized for tablet and touchscreen use
- **Error Boundaries**: Robust error handling and recovery
- **TypeScript**: Full type safety throughout the application

## 🚀 Deployment

### Production Checklist
- [ ] Configure production Supabase project
- [ ] Set up Pesapal production credentials
- [ ] Configure domain and SSL certificates
- [ ] Set up monitoring and logging
- [ ] Configure backups and disaster recovery

### Deployment Options
- **Vercel**: Recommended for Next.js applications (zero-config deployment)
- **Cloud Providers**: AWS, Google Cloud, or Azure with Next.js support

## 📱 Hardware Integration

The system supports integration with:
- **Thermal Printers**: ESC/POS command support via WebSerial
- **Barcode Scanners**: USB and Bluetooth scanner support
- **Cash Drawers**: Automated opening via printer connection
- **Customer Displays**: Secondary screen support for order totals

## 🔧 Configuration

### Customization Options
- **Themes**: Light/dark mode support with custom branding
- **Languages**: i18n ready for multiple language support
- **Tax Rates**: Configurable tax calculations per location
- **Payment Methods**: Enable/disable payment options per location
- **Menu Categories**: Flexible category and modifier systems

## 📈 Analytics & Reporting

- **Real-time Sales**: Live dashboard with current metrics
- **Historical Reports**: Daily, weekly, monthly sales analysis
- **Inventory Reports**: Stock levels, usage patterns, waste tracking
- **Staff Performance**: Order processing times, sales per employee
- **Customer Analytics**: Order patterns, popular items, peak hours

---

**Ready to revolutionize your restaurant operations!** 🍽️💫
## 🔄 Auto-Deploy Test - Wed Sep 24 00:42:22 EAT 2025


## 👩‍💻 Developer Guide
For a deeper technical walkthrough of the codebase (architecture, directories, key modules, data flow, state, and extension points), see CODE_OVERVIEW.md.
