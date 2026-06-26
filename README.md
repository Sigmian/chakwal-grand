# 🏨 Chakwal Guest House — Multi-Branch Hospitality Management Platform

> Production-ready guest house management system built for scale.
> One codebase. Unlimited branches. Full business operating system.

---

## 🏗️ Architecture Overview

```
chakwal-grand/
│
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Public auth pages (no layout)
│   │   ├── login/page.tsx        # Premium login page
│   │   └── forgot-password/      # Password reset
│   │
│   ├── (dashboard)/              # Protected admin shell
│   │   ├── layout.tsx            # Sidebar + header wrapper
│   │   ├── dashboard/            # Main overview page
│   │   ├── branches/             # Branch management (Super Admin)
│   │   ├── rooms/                # Room CRUD + images + 360°
│   │   ├── bookings/             # Booking list + detail + new
│   │   ├── housekeeping/         # Room status board
│   │   ├── customers/            # Guest profiles + history
│   │   ├── inventory/            # Stock management + POS
│   │   ├── finance/              # Revenue, expenses, reports
│   │   ├── staff/                # Team management
│   │   ├── reviews/              # Review moderation
│   │   └── settings/             # Company + branch settings
│   │
│   ├── (public)/                 # Public booking website
│   │   ├── [branch]/             # Branch landing page
│   │   └── book/                 # Public booking flow
│   │
│   └── api/                      # REST API endpoints
│       ├── auth/[...nextauth]/   # NextAuth handler
│       ├── branches/             # Branch API
│       ├── rooms/                # Rooms API
│       ├── bookings/             # Bookings API
│       └── ...                   # Other endpoints
│
├── features/                     # Feature modules (co-located)
│   ├── auth/                     # Login, permissions
│   ├── branches/                 # Branch components + services
│   ├── rooms/                    # Room cards, forms, calendar
│   ├── bookings/                 # Booking table, wizard, detail
│   ├── customers/                # Customer profiles, loyalty
│   ├── inventory/                # POS terminal, stock table
│   ├── finance/                  # P&L, expense forms, reports
│   ├── staff/                    # Staff cards, activity logs
│   ├── housekeeping/             # Room status board
│   └── analytics/                # Charts, KPI cards
│
├── components/                   # Shared UI components
│   ├── layout/                   # Sidebar, Header
│   ├── charts/                   # Recharts wrappers
│   ├── shared/                   # StatCard, Badge, Skeleton, etc.
│   ├── forms/                    # Reusable form fields
│   ├── tables/                   # DataTable wrapper
│   └── modals/                   # Confirmation dialogs
│
├── server/                       # Server-only code
│   ├── actions/                  # Server Actions (bookings, rooms, etc.)
│   └── middleware/               # Request middleware
│
├── lib/                          # Core library modules
│   ├── auth/                     # NextAuth config + permissions + session
│   ├── db/                       # Prisma singleton
│   ├── validation/               # Zod schemas
│   ├── email/                    # Email templates
│   └── storage/                  # S3 upload utilities
│
├── database/
│   ├── schema.prisma             # Complete DB schema
│   ├── migrations/               # Prisma migrations
│   └── seeds/index.ts            # Demo data seed
│
├── types/index.ts                # TypeScript type definitions
├── utils/index.ts                # Utility functions
└── config/                       # App config, navigation
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or use [Neon.tech](https://neon.tech) free tier)
- npm or pnpm

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 3. Set up database
```bash
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database
npm run db:seed         # Seed with demo data
```

### 4. Run development server
```bash
npm run dev
# Open http://localhost:3000
```

### 5. Login with demo credentials
| Role           | Email                         | Password     |
|----------------|-------------------------------|--------------|
| Super Admin    | owner@chakwalgrand.pk         | Admin@1234   |
| Branch Manager | manager@chakwalgrand.pk       | Admin@1234   |
| Receptionist   | reception@chakwalgrand.pk     | Admin@1234   |
| Housekeeping   | cleaning@chakwalgrand.pk      | Admin@1234   |

---

## 🔐 Authentication & Permissions

```
SUPER_ADMIN       → Full access to everything (company-wide)
BRANCH_MANAGER    → Full access to their branch only
RECEPTIONIST      → Bookings, check-in/out, POS sales
HOUSEKEEPING      → Room status updates only
INVENTORY_STAFF   → Inventory & POS management
```

Role checks happen at **3 levels**:
1. Route level (`requirePermission()` in Server Components)
2. Action level (Server Actions validate user role before DB writes)
3. UI level (nav items and buttons hidden based on role)

---

## 🗄️ Database Models

| Model                    | Purpose                                    |
|--------------------------|--------------------------------------------|
| Company                  | Top-level business entity                  |
| Branch                   | Individual locations (Chakwal, KK, etc.)   |
| User + StaffMember       | Authentication + staff profiles            |
| Room + RoomImage         | Room catalog with media                    |
| Booking + Payment        | Reservation lifecycle + financial records  |
| Customer                 | Guest profiles + loyalty system            |
| Product + InventoryItem  | Mini-bar stock per branch                  |
| Sale + SaleLineItem      | POS transactions                           |
| StockMovement            | Complete stock audit trail                 |
| StockTransfer            | Inter-branch inventory transfers           |
| Expense                  | Operational cost tracking                  |
| Offer                    | Dynamic discount/promo system              |
| Review                   | Guest reviews with moderation              |
| ActivityLog              | Full staff accountability audit trail      |
| BranchAnalyticsSnapshot  | Pre-computed daily metrics                 |

---

## 📡 API Architecture

All business logic lives in **Server Actions** (`server/actions/`).
REST API routes in `app/api/` expose the same logic for external consumers
(future mobile apps, integrations).

```
Server Component → Server Action → Prisma → PostgreSQL
Client Component → Server Action (via "use server") → Same path
Mobile App (future) → REST API Route → Same Server Action
```

---

## 🎨 Design System

- **Colors**: Deep gold (#C9A84C) primary, dark surfaces (#0A0A0F base)
- **Typography**: Geist Sans (UI) + Playfair Display (headings)
- **Components**: Radix UI primitives + custom luxury styling
- **Animations**: Framer Motion for page transitions + micro-interactions
- **Charts**: Recharts with custom dark theme

---

## 📦 Module Status

| Module           | Status      | Description                              |
|------------------|-------------|------------------------------------------|
| Auth             | ✅ Complete  | Login, JWT, role-based permissions       |
| Dashboard        | ✅ Complete  | KPIs, charts, activity feed              |
| Bookings         | ✅ Complete  | Full CRUD, check-in/out, payments        |
| Rooms            | ✅ Complete  | CRUD, images, calendar, status           |
| Housekeeping     | ✅ Complete  | Visual board, status updates             |
| Inventory/POS    | ✅ Complete  | Stock, sales, transfers, alerts          |
| Finance          | ✅ Complete  | Revenue, expenses, P&L reports           |
| Customers        | ✅ Complete  | Profiles, loyalty tiers, history         |
| Branches         | ✅ Complete  | Multi-branch creation, comparison        |
| Analytics        | ✅ Complete  | Charts, KPIs, branch performance         |
| Reviews          | ✅ Complete  | Moderation, featured reviews             |
| Staff            | ✅ Complete  | Team management, activity logs           |
| Public Website   | 🔄 Phase 2  | Booking website, room showcase           |
| Email            | 🔄 Phase 2  | Booking confirmations, reminders         |
| AI Chatbot       | 🔄 Phase 3  | Room availability, booking suggestions   |
| Mobile App API   | 🔄 Phase 3  | REST endpoints for iOS/Android           |
| Online Payments  | 🔄 Phase 3  | EasyPaisa, JazzCash, card integration    |

---

## 🚢 Production Deployment

### Recommended Stack
- **Hosting**: Vercel (zero-config Next.js) or Railway
- **Database**: Neon.tech (serverless PostgreSQL) or Supabase
- **Media**: AWS S3 + CloudFront CDN
- **Email**: Resend or SendGrid

### Deploy to Vercel
```bash
vercel --prod
# Set environment variables in Vercel dashboard
npm run db:migrate:prod  # Run migrations in production
```

---

## 🔮 Future Roadmap

**Phase 2** (Next 3 months)
- Public booking website with SEO optimization
- Email notification system
- Online payment gateway (EasyPaisa, JazzCash)
- PDF invoice generation
- Google Maps integration

**Phase 3** (6 months)
- AI-powered chatbot for customer queries
- Native mobile apps (React Native)
- WhatsApp Business API automation
- Dynamic pricing engine
- Franchise management system

**Phase 4** (12 months)
- Multi-currency support
- Channel manager (Booking.com, Airbnb sync)
- Revenue management AI
- Guest-facing mobile app with room key

---

*Built with ❤️ for the most professional guest house platform in Punjab.*
