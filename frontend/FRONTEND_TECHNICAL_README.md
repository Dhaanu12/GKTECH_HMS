# CareNex AI - Frontend Technical Reference

## Project Overview

CareNex AI is a comprehensive Hospital Management System (HMS) frontend application built with **Next.js 16** and **React 19**. The application provides role-based dashboards for managing hospital operations including patient records, appointments, prescriptions, insurance claims, referral management, and financial reporting.

The frontend serves as the presentation layer that communicates with a Node.js/Express backend via RESTful APIs, implementing a modern glassmorphism design system with responsive layouts and real-time data visualization capabilities.

---

## Quick Facts

| Attribute | Details |
|-----------|---------|
| **Project Type** | Web Application (SPA with SSR capabilities) |
| **Primary Language** | TypeScript 5.x |
| **Framework** | Next.js 16.0.7 |
| **UI Library** | React 19.2.0 |
| **Styling** | Tailwind CSS 4.x + Custom CSS (Aurora Glassmorphism Theme) |
| **Animation** | Framer Motion 12.23.25 |
| **HTTP Client** | Axios 1.13.2 |
| **Charts** | Recharts 3.5.1 |
| **PDF Generation** | jsPDF 3.0.4 + jspdf-autotable 5.0.2 |
| **Icons** | Lucide React 0.555.0 |
| **Deployment** | Development on localhost:3000 (proxies to backend at localhost:5000) |
| **Status** | Development/Production Ready |

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Modules & Components](#core-modules--components)
5. [Role-Based Modules](#role-based-modules)
6. [API Services Layer](#api-services-layer)
7. [Authentication & Authorization](#authentication--authorization)
8. [Design System](#design-system)
9. [Data Visualization](#data-visualization)
10. [Configuration & Environment](#configuration--environment)
11. [Dependencies](#dependencies)
12. [Development Setup](#development-setup)

---

## Architecture Overview

### System Architecture

The frontend follows a **modular, role-based architecture** pattern built on Next.js App Router:

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Next.js App Router                     │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │            Role-Based Route Groups                   │ │  │
│  │  │  /admin  /doctor  /nurse  /receptionist             │ │  │
│  │  │  /accountant  /accounts  /client  /marketing        │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │              Shared Components                       │ │  │
│  │  │  Charts | UI Components | Layouts | Forms           │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     STATE LAYER                          │  │
│  │  AuthContext (React Context) + localStorage              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   API SERVICE LAYER                       │  │
│  │  Axios Instance + JWT Interceptors + API Modules         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND API (localhost:5000)                │
│                  Node.js + Express + PostgreSQL                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **App Router over Pages Router**: Leverages Next.js 16's App Router for improved routing, layouts, and server components support.

2. **Role-Based Route Grouping**: Each user role has a dedicated route directory with its own layout, enabling isolated navigation and access control.

3. **Client-Side Rendering**: All interactive pages use `'use client'` directive for dynamic state management and API interactions.

4. **Centralized API Layer**: All HTTP requests flow through a configured Axios instance with automatic JWT token injection.

5. **Context-Based Auth**: React Context provides global authentication state without external state management libraries.

---

## Technology Stack

### Frontend/UI Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.7 | Full-stack React framework with App Router |
| **React** | 19.2.0 | UI component library |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **Framer Motion** | 12.23.25 | Animation library for React |
| **Lucide React** | 0.555.0 | Icon library |

### Data & Visualization Layer

| Technology | Version | Purpose |
|------------|---------|---------|
| **Axios** | 1.13.2 | HTTP client for API requests |
| **Recharts** | 3.5.1 | React charting library |
| **jsPDF** | 3.0.4 | PDF document generation |
| **jspdf-autotable** | 5.0.2 | Table rendering for jsPDF |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | 9.x | Code linting |
| **eslint-config-next** | 16.0.7 | Next.js ESLint configuration |
| **PostCSS** | - | CSS processing |
| **@tailwindcss/postcss** | 4.x | Tailwind CSS integration |

### Typography & Fonts

- **Primary Font**: Inter (weights: 300, 400, 500, 600) - Body text
- **Heading Font**: Outfit (weights: 300, 400, 500, 600, 700) - Headings
- **Source**: Google Fonts

---

## Project Structure

### Directory Layout

```
frontend/
├── app/                          # Next.js App Router directory
│   ├── (auth)/                   # Auth route group (login)
│   │   └── login/
│   │       └── page.tsx          # Login page with role-based redirects
│   ├── admin/                    # Super Admin module (11 sub-routes)
│   │   ├── layout.tsx            # Admin sidebar layout
│   │   ├── dashboard/            # Admin dashboard
│   │   ├── hospitals/            # Hospital management
│   │   ├── branches/             # Branch management
│   │   ├── users/                # User management
│   │   ├── leads/                # Lead management
│   │   ├── doctors/              # Doctor management
│   │   ├── nurses/               # Nurse management
│   │   ├── receptionists/        # Receptionist management
│   │   ├── accountants/          # Accountant management
│   │   ├── client-admins/        # Client admin management
│   │   └── marketing-users/      # Marketing user management
│   ├── doctor/                   # Doctor module (6 sub-routes)
│   │   ├── layout.tsx            # Doctor sidebar layout
│   │   ├── dashboard/            # Doctor dashboard
│   │   ├── appointments/         # Appointment management
│   │   │   ├── page.tsx          # Appointments list
│   │   │   └── [id]/             # Appointment detail (dynamic route)
│   │   ├── patients/             # Patient records
│   │   │   ├── page.tsx          # Patients list
│   │   │   └── [id]/             # Patient detail (dynamic route)
│   │   ├── prescriptions/        # Prescription management
│   │   ├── profile/              # Doctor profile
│   │   └── reports/              # Doctor reports
│   ├── nurse/                    # Nurse module (2 sub-routes)
│   │   ├── layout.tsx            # Nurse sidebar layout
│   │   ├── dashboard/            # Nurse dashboard
│   │   └── patients/             # Patient records
│   │       ├── page.tsx          # Patients list
│   │       └── [id]/             # Patient detail
│   ├── receptionist/             # Receptionist module (5 sub-routes)
│   │   ├── layout.tsx            # Receptionist sidebar layout
│   │   ├── dashboard/            # Receptionist dashboard
│   │   ├── appointments/         # Appointment scheduling
│   │   ├── patients/             # Patient registration
│   │   │   ├── page.tsx          # Patients list
│   │   │   └── [id]/             # Patient detail
│   │   ├── opd/                  # OPD management
│   │   └── reports/              # Reports
│   ├── accountant/               # Accountant module (6 sub-routes)
│   │   ├── layout.tsx            # Accountant sidebar layout (13KB - complex navigation)
│   │   ├── dashboard/            # Accountant dashboard with claims overview
│   │   ├── insurance-claims/     # Insurance claims management
│   │   ├── referral-payment/     # Referral payment management
│   │   │   ├── reports/          # Referral payment reports
│   │   │   └── upload/           # Payment data upload
│   │   ├── update-payment/       # Payment status updates
│   │   ├── upload/               # Document upload
│   │   └── reports/              # Financial reports
│   ├── accounts/                 # Accounts/Marketing Lead module (3 sub-routes)
│   │   ├── layout.tsx            # Accounts sidebar layout (13KB - complex navigation)
│   │   ├── dashboard/            # Accounts dashboard
│   │   ├── bulk-setup/           # Bulk service percentage setup
│   │   └── referrals/            # Referral management
│   ├── client/                   # Client Admin module (12 sub-routes)
│   │   ├── layout.tsx            # Client sidebar layout
│   │   ├── dashboard/            # Client dashboard
│   │   ├── branches/             # Branch management
│   │   ├── doctors/              # Doctor management
│   │   ├── nurses/               # Nurse management
│   │   ├── receptionists/        # Receptionist management
│   │   ├── accountants/          # Accountant management
│   │   ├── client-admins/        # Client admin management
│   │   ├── marketing-users/      # Marketing user management
│   │   ├── users/                # User management
│   │   ├── referrals/            # Referral management
│   │   ├── profile/              # Client profile
│   │   └── reports/              # Client reports
│   ├── marketing/                # Marketing module (4 sub-routes)
│   │   ├── layout.tsx            # Marketing sidebar layout
│   │   ├── dashboard/            # Marketing dashboard
│   │   ├── doctors/              # Referral doctor management
│   │   │   └── add/              # Add referral doctor form
│   │   ├── patients/             # Patient referral tracking
│   │   │   └── add/              # Add patient form
│   │   └── referral-payment/     # Referral payment reports
│   │       └── reports/          # Payment reports
│   ├── components/               # Route-specific components
│   │   └── ReportsPage.tsx       # Shared reports page component
│   ├── globals.css               # Global styles + Aurora theme
│   ├── layout.tsx                # Root layout with AuthProvider
│   ├── page.tsx                  # Landing page (22KB)
│   └── page.module.css           # Landing page styles
│
├── components/                   # Shared React components
│   ├── HeroSlideshow.tsx         # Landing page hero slideshow
│   ├── LeadFormModal.tsx         # Lead capture modal form (13KB)
│   ├── charts/                   # Data visualization components
│   │   ├── BranchInsurerChart.tsx       # Branch-insurer comparison (12KB)
│   │   ├── HospitalBranchChart.tsx      # Hospital-branch visualization (6KB)
│   │   └── InsurerComparisonChart.tsx   # Insurer comparison charts (9KB)
│   ├── landing/                  # Landing page components
│   ├── layouts/                  # Layout wrapper components
│   ├── marketing/                # Marketing-specific components
│   ├── modules/                  # Module-specific reusable components
│   └── ui/                       # Generic UI components
│       └── SearchableSelect.tsx  # Searchable dropdown (7KB)
│
├── lib/                          # Utility libraries and services
│   ├── AuthContext.tsx           # React Context for authentication (2.6KB)
│   ├── axios.ts                  # Axios instance configuration (609B)
│   └── api/                      # API service modules
│       ├── accounts.ts           # Accounts API (3.6KB) - GST, referrals
│       ├── branches.ts           # Branches API (562B)
│       ├── clientAdmins.ts       # Client admins API (215B)
│       ├── hospitals.ts          # Hospitals API (249B)
│       ├── marketing.ts          # Marketing API (1.5KB) - referral doctors
│       ├── modules.ts            # Modules API (1.6KB) - client modules
│       └── users.ts              # Users API (655B)
│
├── types/                        # TypeScript type definitions
│   ├── accounts.ts               # Account-related types (571B)
│   └── marketing.ts              # Marketing-related types (828B)
│
├── public/                       # Static assets
│   ├── assets/                   # Additional static assets
│   ├── logo.png                  # Application logo
│   ├── favicon.ico               # Browser favicon
│   ├── sample_claims.xlsx        # Sample insurance claims template
│   └── *.svg                     # Various SVG icons
│
├── .next/                        # Next.js build output (generated)
├── node_modules/                 # Dependencies (generated)
├── .env.local                    # Environment variables
├── next.config.ts                # Next.js configuration
├── package.json                  # Project dependencies
├── tsconfig.json                 # TypeScript configuration
├── postcss.config.mjs            # PostCSS configuration
└── eslint.config.mjs             # ESLint configuration
```

### Key Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout - wraps entire app with `AuthProvider`, sets metadata, loads Inter font |
| `app/globals.css` | Global styles including Aurora glassmorphism theme, animations, scrollbar styles |
| `app/page.tsx` | Landing page with hero section, features, benefits, lead capture modal (22KB) |
| `lib/AuthContext.tsx` | React Context providing auth state, user data, `hasAccess()` method |
| `lib/axios.ts` | Configured Axios instance with JWT token injection interceptor |
| `next.config.ts` | API proxy rewrites to backend at localhost:5000 |

---

## Core Modules & Components

### Module: Authentication Context

**Purpose**: Provides global authentication state and role-based access control across the application.

**Location**: `lib/AuthContext.tsx`

**Key Interfaces**:

```typescript
interface User {
    user_id: number;
    username: string;
    email: string;
    role_code: string;
    hospital_id?: number;
    branch_id?: number;
    activeModules?: string[];
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => void;
    setUser: (user: User | null) => void;
    isAuthenticated: boolean;
    hasAccess: (moduleCode: string) => boolean;
}
```

**Key Functions**:

- `useAuth()`: Custom hook to access auth context
- `hasAccess(moduleCode)`: Checks if user has access to a specific module
- `logout()`: Clears localStorage and redirects to home

**Implementation Details**:

- Uses localStorage for token and user persistence
- Parses stored user on mount
- `SUPER_ADMIN` role bypasses all module access checks
- Provides `activeModules` array for granular permission control

---

### Module: API Client (Axios)

**Purpose**: Centralized HTTP client with automatic JWT token injection for all API requests.

**Location**: `lib/axios.ts`

**Configuration**:

```typescript
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor adds Authorization header
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});
```

**Key Features**:

- Base URL proxied to backend via Next.js rewrites
- Automatic Bearer token injection from localStorage
- Client-side check prevents SSR issues

---

### Module: Landing Page

**Purpose**: Public-facing landing page with modern glassmorphism design, feature showcase, and lead capture.

**Location**: `app/page.tsx`

**Key Components**:

| Component | Purpose |
|-----------|---------|
| `GlassCard` | Reusable glassmorphism card wrapper |
| `MagneticButton` | Interactive button with magnetic cursor effect |
| `LandingPage` | Main landing page component |
| `FeatureCard` | Feature showcase cards |
| `BenefitRow` | Benefits list items |

**Features**:

1. **Hero Section**: Animated gradient background, floating orbs, call-to-action buttons
2. **Navigation**: Responsive navbar with mobile hamburger menu
3. **Features Grid**: 6 feature cards highlighting key HMS capabilities
4. **Benefits Section**: Detailed benefits for hospitals
5. **Lead Capture Modal**: Form for potential client contact info

**Animation Techniques**:

- Framer Motion for scroll-based animations (`useScroll`, `useTransform`)
- CSS animations for floating elements (`animate-float`)
- Magnetic button effect using `useMotionValue`

---

### Module: Login Page

**Purpose**: User authentication with role-based dashboard redirection.

**Location**: `app/(auth)/login/page.tsx`

**Authentication Flow**:

```
1. User enters email/password
2. POST to http://localhost:5000/api/auth/login
3. On success: Store accessToken and user in localStorage
4. Redirect based on role_code:
   - SUPER_ADMIN → /admin/dashboard
   - CLIENT_ADMIN → /client/dashboard
   - DOCTOR → /doctor/dashboard
   - NURSE → /nurse/dashboard
   - RECEPTIONIST → /receptionist/dashboard
   - ACCOUNTANT/ACCOUNTANT_MANAGER → /accountant/dashboard
   - MRKT_EXEC/MRKT_MNGR → /marketing/dashboard
```

**Supported Roles**:

| Role Code | Dashboard Path |
|-----------|----------------|
| `SUPER_ADMIN` | `/admin/dashboard` |
| `CLIENT_ADMIN` | `/client/dashboard` |
| `DOCTOR` | `/doctor/dashboard` |
| `NURSE` | `/nurse/dashboard` |
| `RECEPTIONIST` | `/receptionist/dashboard` |
| `ACCOUNTANT` | `/accountant/dashboard` |
| `ACCOUNTANT_MANAGER` | `/accountant/dashboard` |
| `MRKT_EXEC` | `/marketing/dashboard` |
| `MRKT_MNGR` | `/marketing/dashboard` |

**UI Features**:

- Split-screen design (brand vision + login form)
- Animated gradient background with floating orbs
- Glass-morphism form styling
- Loading spinner during authentication
- Error toast for failed login attempts
- Demo credentials displayed

---

### Module: Lead Form Modal

**Purpose**: Capture potential client information from landing page for sales follow-up.

**Location**: `components/LeadFormModal.tsx`

**Form Fields**:

- Hospital/Clinic Name
- Contact Person Name
- Email Address
- Phone Number
- Location/City
- Current Software (optional)
- Requirements/Message (optional textarea)

**Features**:

- Animated modal with Framer Motion `AnimatePresence`
- Form validation
- Loading state during submission
- Success/Error feedback states
- POST to `/api/leads` endpoint

---

## Role-Based Modules

### Admin Module (Super Admin)

**Path**: `/admin/*`

**Layout**: `app/admin/layout.tsx` (7.4KB)

**Navigation Items**:

| Page | Path | Icon | Purpose |
|------|------|------|---------|
| Dashboard | `/admin/dashboard` | `LayoutDashboard` | System overview stats |
| Hospitals | `/admin/hospitals` | `Building2` | Hospital management |
| Branches | `/admin/branches` | `Building2` | Branch management |
| User Management | `/admin/users` | `Users` | All user management |
| Leads | `/admin/leads` | `Users` | Sales lead tracking |

**Additional Admin-Only Pages** (accessed via User Management):

- `/admin/doctors` - Doctor user management
- `/admin/nurses` - Nurse user management
- `/admin/receptionists` - Receptionist management
- `/admin/accountants` - Accountant management
- `/admin/client-admins` - Client admin management
- `/admin/marketing-users` - Marketing user management

**Dashboard Features**:

- Total hospitals count
- Total branches count
- Total users by role
- Quick action links

---

### Doctor Module

**Path**: `/doctor/*`

**Layout**: `app/doctor/layout.tsx` (9KB)

**Navigation Items**:

| Page | Path | Icon | Purpose |
|------|------|------|---------|
| Dashboard | `/doctor/dashboard` | `LayoutDashboard` | Overview & quick actions |
| Appointments | `/doctor/appointments` | `Calendar` | Appointment management |
| Patients | `/doctor/patients` | `Users` | Patient records |
| Prescriptions | `/doctor/prescriptions` | `FileText` | Prescription management |
| Reports | `/doctor/reports` | `BarChart3` | Statistical reports |
| Profile | `/doctor/profile` | `Stethoscope` | Doctor profile |

**Dynamic Routes**:

- `/doctor/appointments/[id]` - Individual appointment details
- `/doctor/patients/[id]` - Individual patient records

**Dashboard Features**:

- Today's appointments count
- Total patients count
- Pending prescriptions
- Quick action cards
- Recent activity feed

---

### Nurse Module

**Path**: `/nurse/*`

**Layout**: `app/nurse/layout.tsx` (5.7KB)

**Navigation Items**:

| Page | Path | Icon | Purpose |
|------|------|------|---------|
| Dashboard | `/nurse/dashboard` | `LayoutDashboard` | Overview |
| Patients | `/nurse/patients` | `Users` | Patient care records |

**Dynamic Routes**:

- `/nurse/patients/[id]` - Patient detail view

---

### Receptionist Module

**Path**: `/receptionist/*`

**Layout**: `app/receptionist/layout.tsx` (9.2KB)

**Navigation Items**:

| Page | Path | Icon | Purpose |
|------|------|------|---------|
| Dashboard | `/receptionist/dashboard` | `LayoutDashboard` | Overview |
| Appointments | `/receptionist/appointments` | `Calendar` | Appointment scheduling |
| Patients | `/receptionist/patients` | `Users` | Patient registration |
| OPD | `/receptionist/opd` | `ClipboardPlus` | OPD registration |
| Reports | `/receptionist/reports` | `FileText` | Reception reports |

**Dynamic Routes**:

- `/receptionist/patients/[id]` - Patient detail view

---

### Accountant Module

**Path**: `/accountant/*`

**Layout**: `app/accountant/layout.tsx` (13KB - complex with nested menus)

**Navigation Structure**:

```
├── Dashboard
├── Upload Claims
├── Insurance Claims
├── Referral Payment ▼
│   ├── Reports
│   └── Upload
├── Update Payment
└── Reports
```

**Navigation Items**:

| Page | Path | Icon | Purpose |
|------|------|------|---------|
| Dashboard | `/accountant/dashboard` | `LayoutDashboard` | Claims overview with charts |
| Upload Claims | `/accountant/upload` | `Upload` | Bulk claims upload |
| Insurance Claims | `/accountant/insurance-claims` | `FileText` | Claims management |
| Referral Reports | `/accountant/referral-payment/reports` | `IndianRupee` | Referral payment reports |
| Referral Upload | `/accountant/referral-payment/upload` | `Upload` | Referral payment data upload |
| Update Payment | `/accountant/update-payment` | `CreditCard` | Payment status updates |
| Reports | `/accountant/reports` | `BarChart3` | Financial reports |

**Dashboard Features** (32KB - most complex page):

- Branch-wise insurance claims summary
- Grouped by insurance company
- Expandable claim details
- PDF download per insurer
- Total pending amount calculation
- Currency formatting (₹)

---

### Accounts Module (Marketing Lead)

**Path**: `/accounts/*`

**Layout**: `app/accounts/layout.tsx` (13KB - complex with nested menus)

**Navigation Structure**:

```
├── Dashboard
├── Bulk Setup
└── Referrals ▼
    ├── Reports
    └── Setup
```

**Navigation Items**:

| Page | Path | Purpose |
|------|------|---------|
| Dashboard | `/accounts/dashboard` | Referral doctor overview with service percentages |
| Bulk Setup | `/accounts/bulk-setup` | Bulk service percentage configuration |
| Referrals | `/accounts/referrals` | Referral doctor management |

**Dashboard Features**:

- Referral doctors list with service percentages
- GST calculation
- Bulk operations (copy percentages, CSV import/export)
- Service type configuration

---

### Client Module (Hospital Admin)

**Path**: `/client/*`

**Layout**: `app/client/layout.tsx` (9.2KB)

**Navigation Items**:

| Page | Path | Purpose |
|------|------|---------|
| Dashboard | `/client/dashboard` | Hospital overview |
| Branches | `/client/branches` | Branch management |
| Doctors | `/client/doctors` | Doctor staff management |
| Nurses | `/client/nurses` | Nurse staff management |
| Receptionists | `/client/receptionists` | Receptionist management |
| Accountants | `/client/accountants` | Accountant management |
| Client Admins | `/client/client-admins` | Sub-admin management |
| Marketing Users | `/client/marketing-users` | Marketing staff |
| Users | `/client/users` | All user management |
| Referrals | `/client/referrals` | Referral source management |
| Profile | `/client/profile` | Hospital profile |
| Reports | `/client/reports` | Hospital reports |

---

### Marketing Module

**Path**: `/marketing/*`

**Layout**: `app/marketing/layout.tsx` (minimal)

**Navigation Items**:

| Page | Path | Purpose |
|------|------|---------|
| Dashboard | `/marketing/dashboard` | Marketing overview |
| Add Doctor | `/marketing/doctors/add` | Register referral doctor |
| Add Patient | `/marketing/patients/add` | Register patient via referral |
| Payment Reports | `/marketing/referral-payment/reports` | View payment reports |

---

## API Services Layer

### Service: Accounts API

**Location**: `lib/api/accounts.ts`

**Endpoints Called**:

| Function | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| `getReferralDoctorsWithPercentages` | GET | `/marketing/referral-doctors-with-percentages` | Get doctors with service percentages |
| `getHospitalServices` | GET | `/marketing/hospital-services` | Get available hospital services |
| `calculateGST` | POST | `/marketing/calculate-gst` | Calculate GST for a service |
| `updateServiceGSTRate` | PUT | `/marketing/service-gst/{id}` | Update GST rate for service |
| `getReferralSummary` | GET | `/marketing/referral-summary` | Get referral payment summary |
| `upsertServicePercentage` | POST | `/marketing/referral-doctors/percentages` | Create/update service percentage |
| `bulkInsertServicePercentages` | POST | `/marketing/bulk-service-percentages` | Bulk insert for multiple doctors |
| `copyServicePercentages` | POST | `/marketing/copy-service-percentages` | Copy percentages between doctors |
| `getDoctorsWithoutPercentages` | GET | `/marketing/doctors-without-percentages` | Get unconfigured doctors |
| `exportCSVTemplate` | GET | `/marketing/export-csv-template` | Download CSV template (blob) |
| `importCSV` | POST | `/marketing/import-csv` | Import CSV data |

---

### Service: Modules API

**Location**: `lib/api/modules.ts`

**Endpoints Called**:

| Function | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| `getModules` | GET | `/modules` | Get all available modules |
| `createModule` | POST | `/modules` | Create new module |
| `updateModule` | PUT | `/modules/{id}` | Update module |
| `assignModuleToClient` | POST | `/modules/assign` | Assign module to client |
| `getClientModules` | GET | `/modules/client/{clientId}` | Get client's assigned modules |
| `updateClientModule` | PUT | `/modules/client-modules/{id}` | Update client module assignment |

---

### Service: Marketing API

**Location**: `lib/api/marketing.ts`

**Endpoints Called**:

| Function | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| `getReferralDoctors` | GET | `/marketing/referral-doctors` | Get referral doctors list |
| `createReferralDoctor` | POST | `/marketing/referral-doctors` | Create referral doctor (FormData) |
| `updateReferralDoctor` | PUT | `/marketing/referral-doctors/{id}` | Update referral doctor (FormData) |
| `getDoctorPercentages` | GET | `/marketing/referral-doctors/{id}/percentages` | Get doctor's service percentages |
| `upsertDoctorPercentage` | POST | `/marketing/referral-doctors/percentages` | Create/update percentage |

**Note**: `createReferralDoctor` and `updateReferralDoctor` use `multipart/form-data` for file uploads (photos, documents).

---

### Service: Users API

**Location**: `lib/api/users.ts`

**Endpoints Called**:

| Function | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| `createUser` | POST | `/users` | Create new user |
| `getUsers` | GET | `/users` | Get users with filters (branch_id, role_code, hospital_id) |

---

### Service: Branches API

**Location**: `lib/api/branches.ts`

**Endpoints Called**:

| Function | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| `getBranches` | GET | `/branches` or `/branches/hospital/{hospitalId}` | Get branches (optionally filtered by hospital) |

---

### Service: Hospitals API

**Location**: `lib/api/hospitals.ts`

**Endpoints Called**:

| Function | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| `getHospitals` | GET | `/hospitals` | Get all hospitals |

---

### Service: Client Admins API

**Location**: `lib/api/clientAdmins.ts`

**Endpoints Called**:

| Function | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| `getClientAdmins` | GET | `/clientadmins` | Get all client admins |

---

## Authentication & Authorization

### Authentication Method

- **Type**: JWT (JSON Web Token) Bearer Token
- **Storage**: localStorage (`token` and `user` keys)
- **Injection**: Automatic via Axios request interceptor
- **Header Format**: `Authorization: Bearer <token>`

### Session Management

- Token stored in localStorage on successful login
- User object stored as JSON string in localStorage
- Token automatically attached to all API requests
- Logout clears both token and user from localStorage

### Role-Based Access Control

**Role Codes** (from backend):

| Role Code | Access Level | Accessible Modules |
|-----------|--------------|-------------------|
| `SUPER_ADMIN` | Full system access | All modules |
| `CLIENT_ADMIN` | Hospital-level access | Client portal, staff management |
| `DOCTOR` | Clinical access | Patients, appointments, prescriptions |
| `NURSE` | Limited clinical access | Patient records |
| `RECEPTIONIST` | Front desk access | Appointments, registration, OPD |
| `ACCOUNTANT` | Financial access | Claims, payments, reports |
| `ACCOUNTANT_MANAGER` | Extended financial access | Same as accountant + approvals |
| `MRKT_EXEC` | Marketing access | Referral doctors, patients |
| `MRKT_MNGR` | Marketing management | Extended marketing features |

### Route Protection Pattern

Each layout component implements route protection:

```typescript
export default function ModuleLayout({ children }) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, loading, router]);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
        return null;
    }

    return <LayoutContent>{children}</LayoutContent>;
}
```

---

## Design System

### Color Palette (Aurora Theme)

**CSS Variables** (`globals.css`):

```css
:root {
  /* Aurora Theme Colors */
  --aurora-bg: #f8fafc;      /* Light gray background */
  --aurora-1: #3b82f6;       /* Blue (primary) */
  --aurora-2: #8b5cf6;       /* Violet (accent) */
  --aurora-3: #10b981;       /* Emerald (success) */
  
  /* Glass Effects */
  --glass-border: rgba(255, 255, 255, 0.5);
  --glass-surface: rgba(255, 255, 255, 0.7);
  --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
}
```

### Glassmorphism Utilities

| Class | Purpose |
|-------|---------|
| `.glass-panel` | Primary glass container with blur and shadow |
| `.glass-card` | Interactive card with hover effects |
| `.glass-button` | Glass-styled button |
| `.glass-input` | Glass-styled form input |

### Typography Scale

- **Headings**: Outfit font family
- **Body**: Inter font family
- **Gradient Text**: `.text-gradient` utility class

### Animations

| Animation | Class | Duration | Description |
|-----------|-------|----------|-------------|
| Float | `.animate-float` | 6s | Gentle vertical floating |
| Gradient X | `.animate-gradient-x` | 15s | Horizontal gradient animation |

### Responsive Breakpoints

Standard Tailwind CSS breakpoints:

- `sm`: 640px
- `md`: 768px (sidebar visibility toggle)
- `lg`: 1024px (full sidebar always visible)
- `xl`: 1280px
- `2xl`: 1536px

### Sidebar Pattern

All role layouts follow this responsive pattern:

- **Mobile** (< lg): Hidden by default, toggle via hamburger menu
- **Desktop** (≥ lg): Always visible, fixed position
- **Width**: 256px (w-64)
- **Background**: Dark blue (`bg-blue-950`) with semi-transparent items

---

## Data Visualization

### Chart Components

**Location**: `components/charts/`

#### BranchInsurerChart.tsx (12KB)

**Purpose**: Visualizes insurance claims distribution across hospital branches and insurers.

**Data Structure**:

```typescript
interface BranchData {
    branchName: string;
    insurers: {
        insurerName: string;
        totalClaims: number;
        totalAmount: number;
    }[];
}
```

**Features**:

- Grouped bar chart by branch
- Multiple insurers per branch
- Interactive tooltips
- Responsive sizing

#### HospitalBranchChart.tsx (6KB)

**Purpose**: Displays hospital-branch hierarchical data.

**Features**:

- Tree-like visualization
- Branch count per hospital
- Color-coded by hospital

#### InsurerComparisonChart.tsx (9KB)

**Purpose**: Compares insurance claim statistics across different insurers.

**Visualization Types**:

- Bar charts for claim counts
- Line charts for trend analysis
- Pie charts for distribution

### Charting Library: Recharts

**Usage Pattern**:

```typescript
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

<ResponsiveContainer width="100%" height={400}>
    <BarChart data={chartData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#3b82f6" />
    </BarChart>
</ResponsiveContainer>
```

---

## Configuration & Environment

### Environment Variables

**File**: `.env.local`

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000` |

**Note**: Additional environment variables may be required based on deployment environment.

### Next.js Configuration

**File**: `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*', // Proxy to Backend
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5000/uploads/:path*', // Proxy to Uploads
      },
    ];
  },
};
```

**Key Configuration**:

- **API Proxy**: All `/api/*` requests proxied to backend on port 5000
- **Uploads Proxy**: Static file uploads served from backend
- **Purpose**: Avoids CORS issues during development

### TypeScript Configuration

**File**: `tsconfig.json`

Key settings:

- Strict mode enabled
- Path aliases configured (`@/*` → `src/*` equivalent)
- JSX preserve mode for Next.js

### PostCSS Configuration

**File**: `postcss.config.mjs`

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

---

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.0.7 | React framework with SSR/SSG |
| `react` | 19.2.0 | UI component library |
| `react-dom` | 19.2.0 | React DOM renderer |
| `axios` | 1.13.2 | HTTP client for API requests |
| `framer-motion` | 12.23.25 | Animation library |
| `lucide-react` | 0.555.0 | Icon library (500+ icons) |
| `recharts` | 3.5.1 | React charting library |
| `jspdf` | 3.0.4 | PDF document generation |
| `jspdf-autotable` | 5.0.2 | Table plugin for jsPDF |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | 5.x | TypeScript language support |
| `@types/node` | 20.x | Node.js type definitions |
| `@types/react` | 19.x | React type definitions |
| `@types/react-dom` | 19.x | React DOM type definitions |
| `tailwindcss` | 4.x | Utility-first CSS framework |
| `@tailwindcss/postcss` | 4.x | Tailwind PostCSS plugin |
| `eslint` | 9.x | JavaScript/TypeScript linter |
| `eslint-config-next` | 16.0.7 | Next.js ESLint configuration |

---

## Type Definitions

### Marketing Types

**File**: `types/marketing.ts`

```typescript
export interface ReferralDoctor {
    id: number;
    doctor_name: string;
    clinic_name?: string;
    mobile_number: string;
    speciality_type?: string;
    department_id?: number;
    address?: string;
    medical_council_membership_number?: string;
    council?: string;
    pan_card_number?: string;
    aadhar_card_number?: string;
    bank_name?: string;
    bank_branch?: string;
    bank_address?: string;
    bank_account_number?: string;
    bank_ifsc_code?: string;
    referral_pay?: number;
    geo_latitude?: string;
    geo_longitude?: string;
    geo_accuracy?: string;
    photo_upload_path?: string;
    pan_upload_path?: string;
    aadhar_upload_path?: string;
    clinic_photo_path?: string;
    kyc_upload_path?: string;
    created_at?: string;
    updated_at?: string;
}
```

### Account Types

**File**: `types/accounts.ts`

```typescript
export interface ServicePercentage {
    referral_doctor_id?: number;
    service_type: string;
    cash_percentage: number;
    inpatient_percentage: number;
    referral_pay: string;
    status?: string;
}

export interface ReferralDoctor {
    id: number;
    doctor_name: string;
    speciality_type: string;
    mobile_number: string;
    status?: string;
    medical_council_membership_number?: string;
    clinic_name?: string;
    percentages: ServicePercentage[] | string;
}

export interface HospitalService {
    service_name: string;
}
```

---

## Development Setup

### Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher (or yarn/pnpm)
- **Backend**: Node.js backend running on `localhost:5000`
- **Database**: PostgreSQL (managed by backend)

### Installation Steps

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Create environment file (if needed)
cp .env.example .env.local

# 4. Start development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

### Development URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api (proxied via `/api`)
- **Login**: http://localhost:3000/login

### Demo Credentials

```
Email: admin@phchms.com
Password: Admin123!
```

---

## Codebase Statistics

| Metric | Count |
|--------|-------|
| **Total Pages** | 59 page.tsx files |
| **Route Modules** | 8 role-based modules |
| **Shared Components** | 12 files across 6 directories |
| **API Service Files** | 7 files |
| **Type Definition Files** | 2 files |
| **Total Frontend Size** | ~109 files (excluding node_modules) |

### Lines of Code Estimates

- **Layout Files**: ~1,500 lines (8 layouts, avg. 187 lines each)
- **Page Components**: ~8,000 lines (59 pages, avg. 135 lines each)
- **Shared Components**: ~1,200 lines
- **API Services**: ~500 lines
- **Global Styles**: ~132 lines

---

## Known Limitations & Constraints

### Technical Limitations

1. **Client-Side Rendering**: All interactive pages require JavaScript; no SSR fallback for authenticated content.

2. **localStorage Dependency**: Authentication relies on localStorage, which doesn't work in incognito mode on some browsers.

3. **Single Backend Assumption**: Hardcoded proxy to `localhost:5000`; production requires environment-based configuration.

4. **No Global Error Boundary**: Individual pages handle errors; no app-wide error recovery mechanism.

### Browser Compatibility

- **Supported**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Glassmorphism**: Requires `backdrop-filter` support
- **Framer Motion**: Requires modern JavaScript engine

---

## Future Enhancements (Technical Debt)

### Planned Improvements

1. **State Management**: Consider Zustand or Redux for complex state
2. **API Caching**: Implement TanStack Query for request caching
3. **Form Handling**: Migrate to React Hook Form for complex forms
4. **Testing**: Add Jest + React Testing Library test suite
5. **PWA Support**: Add service worker for offline capability
6. **Internationalization**: Add i18n support for multi-language

### Performance Optimizations Needed

1. **Code Splitting**: Implement dynamic imports for large modules
2. **Image Optimization**: Use Next.js Image component consistently
3. **Bundle Analysis**: Analyze and reduce JavaScript bundle size

---

## Appendix

### Glossary

| Term | Definition |
|------|------------|
| **HMS** | Hospital Management System |
| **OPD** | Outpatient Department |
| **GST** | Goods and Services Tax (Indian tax system) |
| **KYC** | Know Your Customer (identity verification) |
| **Referral Doctor** | External doctor who refers patients to the hospital |
| **Client Admin** | Hospital administrator with system access |
| **Module** | Hospital-subscribed feature/functionality |

### API Response Format

Standard backend response structure:

```json
{
    "status": "success",
    "data": {
        // Resource-specific data
    },
    "message": "Optional message"
}
```

Error response:

```json
{
    "status": "error",
    "message": "Error description"
}
```

---

*Document Generated: January 2026*
*CareNex AI - Hospital Management System Frontend v0.1.0*
