# 🏥 Global Healthcare — Hospital Management System

> A full-featured, multi-branch **Hospital Management System** with an integrated AI assistant, role-based portals, OPD workflow, billing, lab management, referrals, and marketing — built on **Next.js 16** + **Node.js / Express** + **PostgreSQL**.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [User Roles & Portals](#user-roles--portals)
- [Core Modules](#core-modules)
- [AI Assistant](#ai-assistant)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Database](#database)

---

## Overview

**Global Healthcare HMS** is a comprehensive, multi-tenant hospital management platform designed for hospitals with multiple branches. Each staff role gets a dedicated, purpose-built portal — from patient registration and OPD management to lab orders, consultations, billing, marketing campaigns, and AI-powered clinical assistance.

**Key highlights:**
- 🏢 **Multi-branch support** — hospitals with multiple branches, each with its own staff, schedules, and patient queues
- 🤖 **AI Assistant** — role-aware conversational AI with live database access (read & write with confirmation)
- 👥 **7 distinct user roles** — each with scoped access and a tailored UI portal
- 📊 **Rich analytics & reports** — per-branch and hospital-wide dashboards for client admins
- 📄 **Document management** — upload and view patient documents (PDFs, scans, reports)
- 📬 **Marketing & CRM** — lead tracking, campaigns, modules, and referral management

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16 | React framework (App Router) |
| **React** | 19 | UI library |
| **TypeScript** | 5 | Type safety |
| **Tailwind CSS** | 4 | Utility-first styling |
| **Framer Motion** | 12 | Animations & transitions |
| **Recharts** | 3 | Charts & analytics dashboards |
| **Lucide React** | Latest | Icon library |
| **jsPDF** | 4 | PDF generation (bills, reports) |
| **date-fns** | 4 | Date formatting and calculations |
| **react-markdown** | 10 | Render AI responses as markdown |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js / Express** | 4.x | REST API server |
| **PostgreSQL** | Latest | Primary database |
| **pg** | 8 | PostgreSQL client |
| **JWT (jsonwebtoken)** | 9 | Authentication tokens |
| **bcryptjs** | 2 | Password hashing |
| **Multer** | 2 | File uploads |
| **ExcelJS** | 4 | Excel report generation |
| **OpenAI SDK** | 6 | GPT-based AI assistant |
| **@google/generative-ai** | 0.24 | Gemini-based AI assistant |
| **Helmet** | 7 | Security headers |
| **Morgan** | 1 | HTTP request logging |

---

## System Architecture

```
GKTECH_HMS/
├── frontend/                  # Next.js 16 App
│   ├── app/
│   │   ├── (auth)/           # Login page
│   │   ├── admin/            # Super Admin portal
│   │   ├── client/           # Client Admin portal
│   │   ├── doctor/           # Doctor portal
│   │   ├── nurse/            # Nurse portal
│   │   ├── receptionist/     # Receptionist portal
│   │   ├── accountant/       # Accountant / Billing portal
│   │   ├── accounts/         # Accounts management
│   │   ├── marketing/        # Marketing portal
│   │   └── page.tsx          # Landing / Login page
│   ├── components/           # Shared UI components
│   ├── lib/                  # Auth context, API helpers
│   └── types/                # TypeScript types
│
└── backend/                  # Node.js Express API
    ├── controllers/          # Business logic (35+ controllers)
    ├── routes/               # API route definitions (38 route files)
    ├── models/               # Database query models
    ├── services/
    │   ├── aiService.js      # AI orchestration layer
    │   └── ai/
    │       ├── tools/        # AI tool definitions & executors
    │       ├── providers/    # OpenAI & Gemini adapters
    │       └── systemPrompts.js
    ├── middleware/           # Auth, error handling
    ├── config/               # DB config
    └── server.js             # Entry point (port 5000)
```

---

## User Roles & Portals

The system uses **JWT-based role authentication**. Each role gets a separate Next.js portal located at `/app/<role>/`.

### 👑 Super Admin (`SUPER_ADMIN`) — `/admin`
- Manages the entire platform
- Creates hospitals, client admins, and system-level configurations
- Full access to all data across all hospitals

### 🏢 Client Admin (`CLIENT_ADMIN`) — `/client`
- Manages one hospital (potentially multiple branches)
- **Dashboards:** Hospital-wide KPIs, branch performance comparison, revenue analytics
- **Staff Management:** Doctors, nurses, receptionists, accountants, marketing users
- **Branch Management:** Branch creation, clinic hours, and configurations
- **Doctor Scheduling:** Weekly availability scheduling per branch
- **Reports:** Staff performance, OPD analytics, financial summaries (Excel export)
- **Billing Setup:** Service catalog, pricing, packages, and billing templates
- **Modules & Access:** Enable/disable feature modules per branch
- **Referral Management:** Track patient referrals to/from other hospitals/doctors
- **Clinic Setup:** Configure clinic operating hours per day/shift

### 🩺 Doctor (`DOCTOR`) — `/doctor`
- **OPD Consultation:** View assigned patient queue, conduct consultations
- **Patient Records:** Full patient history, vitals, previous visits
- **Prescriptions:** Create and manage prescriptions with drug database
- **Lab Orders:** Order lab tests and view results
- **Clinical Notes:** Write SOAP notes, progress notes, nursing assessments
- **Appointments:** View upcoming appointments
- **Follow-ups:** Schedule and track follow-up consultations
- **Consultation Outcomes:** Document diagnosis, procedures, and next steps
- **MLC Cases:** Register and manage Medico-Legal Cases

### 👩‍⚕️ Nurse (`NURSE`) — `/nurse`
- **Patient Vitals:** Record BP, pulse, temperature, SpO2, weight, height, blood glucose
- **Lab Schedule:** Track lab orders, assign nurses, update test statuses
- **Patient Records:** View patient list (branch-scoped)
- **Clinical Notes:** Write nursing notes and assessments
- **AI Assistant:** Ask about patient vitals, lab orders, and notes

### 🗂️ Receptionist (`RECEPTIONIST`) — `/receptionist`
- **OPD Registration:** Register patients for outpatient visits (with duplicate check)
- **Appointment Booking:** Schedule and manage appointments
- **Patient Search & Registration:** Register new patients, search by name/MRN/phone
- **Billing:** Generate and manage patient bills, mark payments
- **OPD Dashboard:** Real-time OPD queue stats (branch-scoped unique patient counts)
- **Follow-ups:** Track overdue and upcoming follow-up calls
- **Patient Feedback:** Record and view patient satisfaction feedback
- **Doctor Schedule:** View which doctors are available on a given day
- **AI Assistant:** Book appointments, look up billing details, manage OPD queue via chat

### 💰 Accountant (`ACCOUNTANT`) — `/accountant`
- **Billing & Invoicing:** Generate bills, process payments, issue refunds
- **Financial Reports:** Daily revenue, payment method breakdowns, outstanding bills
- **Service Management:** Manage chargeable services and pricing
- **Insurance Claims:** Log and track insurance claim submissions
- **Expense Tracking:** Record and categorize hospital expenses
- **Excel Exports:** Download billing summaries and financial reports

### 📣 Marketing (`MARKETING`) — `/marketing`
- **Lead Management:** Capture and track potential patient leads
- **Campaigns:** Create and monitor marketing campaigns
- **Modules Management:** Track marketing module performance
- **Referral Tracking:** Manage patient referrals and referral commissions
- **Analytics:** Campaign ROI and conversion tracking

---

## Core Modules

### 🏥 OPD (Outpatient Department)
- Patient registration with auto-generated OPD number
- Real-time queue management (Registered → Waiting → In Consultation → Completed)
- Branch-wise patient tracking and statistics
- Consultation fee management and payment tracking
- MLC (Medico-Legal Case) registration within OPD workflow

### 📅 Appointments
- Book, reschedule, cancel appointments
- Doctor availability lookup by date and branch
- Automated no-show and cancellation tracking
- Appointment-to-OPD conversion workflow

### 🔬 Lab Orders
- Order lab tests from doctor's console or nurse dashboard
- Branch-scoped lab queue with priority levels (STAT / Urgent / Routine)
- Assign nurses to specific tests
- Status tracking: Ordered → In-Progress → Completed
- Results entry and viewing (internal + external lab orders)

### 💊 Prescriptions
- Structured prescription entry with drug database
- Generic and brand name drug lookup
- Dosage, frequency, duration, and instructions
- Printable prescription templates

### 📝 Clinical Notes
- SOAP notes, nursing notes, progress notes, assessment notes
- Pin important notes for quick reference
- Full note history per patient per OPD visit

### 📋 Patient Records
- Unified patient profile: demographics, contact, blood group, allergies
- MRN (Medical Record Number) auto-generation
- Complete visit history across all branches
- Document uploads (reports, prescriptions, scans, KYC)
- Vitals history with trend tracking

### 💳 Billing & Payments
- Itemized bill generation per OPD visit
- Service catalog with configurable pricing per branch
- Payment methods: Cash, Card, UPI, Insurance
- Refund processing and tracking
- Pending bills tracking and follow-up

### 🔗 Referrals
- Internal referrals (doctor-to-doctor within hospital)
- External referrals to diagnostic centers or other hospitals
- Referral payment tracking for referring agents/doctors
- KYC document collection for referral agents

### 📢 Marketing & Leads
- Multi-step lead capture from various sources
- Campaign creation with targeting and budget tracking
- Marketing module management
- Conversion funnel analytics

### 📊 Reports & Analytics
- Doctor performance: consultation counts, revenue generated, visit types
- Nurse reports: vitals recorded, lab tests managed
- Receptionist reports: patients registered, appointments managed
- Financial reports: daily/weekly/monthly revenue, top services
- Branch comparison charts for client admins

---

## AI Assistant

The AI assistant is a core feature, available to **Nurses, Receptionists, and Client Admins**. It is role-aware and connects directly to live hospital data.

### 🤖 Capabilities

#### Read Tools (instant answers)
| Category | Tools |
|---|---|
| **Patient** | `searchPatients`, `getPatientDetails`, `getPatientVitals`, `getLatestVitals`, `getVitalsStats`, `getPatientLabOrders`, `getPatientNotes`, `searchNotes`, `getPatientConsultations`, `getPatientDocuments`, `getPatientFeedback`, `getPatientFollowUp` |
| **Scheduling** | `getAppointments`, `getDoctorAvailability`, `getDoctorSchedule`, `getBranchDoctors`, `getDepartments`, `checkDuplicateAppointment` |
| **OPD & Billing** | `getOpdEntries`, `getDashboardStats`, `getPendingBills`, `getBillDetails`, `getPendingBillItems`, `checkDuplicateOPD`, `getFollowUps`, `getBills` |
| **Lab** | `getAllLabOrders`, `getLabOrderDetail`, `searchServices` |
| **Client Admin** | `getClientAdminDashboardStats`, `getBranchPerformance`, `getOverallRevenue`, `getHospitalActivity` |
| **Medical** | `getMlcDetails` |

#### Write Tools (require user confirmation)
| Tool | What it does |
|---|---|
| `createAppointment` | Books a new appointment |
| `updateAppointmentStatus` | Marks appointment as Confirmed / Cancelled / No Show |
| `rescheduleAppointment` | Moves appointment to a new date/time |
| `createClinicalNote` | Writes a new clinical note for a patient |
| `pinNote` | Pins/unpins a clinical note |
| `updateLabOrderStatus` | Updates lab test status (In-Progress / Completed) |
| `assignLabOrder` | Assigns a nurse to a lab order |
| `updateOpdPayment` | Marks OPD bill as paid |
| `updateOpdStatus` | Updates the OPD visit status |

### 🔌 AI Providers
The system supports two interchangeable AI backends:
- **OpenAI GPT** (via `openai` SDK)
- **Google Gemini** (via `@google/generative-ai`)

Configure the active provider via environment variables. The tool definitions are automatically translated to each provider's format.

### 🛡️ Safety Rules
- Strictly role-scoped — nurses see nursing tools, receptionists see booking tools
- **Never diagnoses or recommends medication** — clinical safety guardrails are built in
- Only returns real data from the database — no hallucinations
- Write actions always present a confirmation card before executing

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn
- OpenAI API key or Google Gemini API key (for AI features)

### 1. Clone the repository
```bash
git clone <repository-url>
cd GKTECH_HMS
```

### 2. Set up the Database
```bash
cd backend
psql -U postgres -f HMS_DB.sql
```

### 3. Configure Environment Variables

Create `backend/.env` (see [Environment Variables](#environment-variables) section below).

### 4. Start the Backend

```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

### 5. Start the Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### 6. Seed Initial Admin (optional)
```bash
cd backend
node create_admin.js
```

---

## Environment Variables

Create `backend/.env` with the following variables:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hms_db
DB_USER=postgres
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# AI Providers (at least one required for AI features)
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
AI_PROVIDER=openai        # or 'gemini'

# File Uploads
UPLOAD_DIR=uploads
```

---

## API Overview

The backend exposes a REST API on **port 5000** under the `/api` prefix. All protected routes require a `Bearer <token>` header.

| Route Prefix | Description |
|---|---|
| `/api/auth` | Login, logout, token refresh |
| `/api/patients` | Patient CRUD, search |
| `/api/opd` | OPD entries, queue, stats |
| `/api/appointments` | Appointment booking and management |
| `/api/consultations` | Doctor consultations, prescriptions |
| `/api/vitals` | Patient vitals recording and history |
| `/api/lab-orders` | Lab orders, assignment, results |
| `/api/prescriptions` | Prescription management |
| `/api/clinical-notes` | Clinical notes (SOAP, nursing, etc.) |
| `/api/billing` | Bill generation, payments, refunds |
| `/api/billing-setup` | Service catalog, pricing setup |
| `/api/doctors` | Doctor management |
| `/api/nurses` | Nurse management |
| `/api/receptionists` | Receptionist management |
| `/api/accountants` | Accountant management |
| `/api/doctor-schedules` | Weekly schedule management |
| `/api/shifts` | Doctor shift tracking |
| `/api/branches` | Branch management |
| `/api/hospitals` | Hospital management |
| `/api/departments` | Department management |
| `/api/referrals` | Patient referral tracking |
| `/api/feedback` | Patient feedback collection |
| `/api/follow-ups` | Follow-up management |
| `/api/medical-services` | Hospital service catalog |
| `/api/medications` | Drug/medication database |
| `/api/templates` | Clinical note templates |
| `/api/patient-documents` | File upload and document management |
| `/api/mlc` | Medico-Legal Case management |
| `/api/marketing` | Leads, campaigns, marketing modules |
| `/api/modules` | Feature module management |
| `/api/client-admin` | Client admin dashboard and reports |
| `/api/ai` | AI assistant (chat endpoint) |
| `/api/users` | User account management |

---

## Database

The system uses **PostgreSQL** with a rich relational schema including:

- `hospitals`, `branches` — multi-tenant structure
- `users`, `roles`, `staff`, `doctors`, `nurses` — role-based user management
- `patients` — central patient registry with MRN
- `opd_entries` — outpatient visit records
- `appointments` — scheduling
- `prescriptions`, `prescription_items` — medications
- `lab_orders`, `lab_order_items` — laboratory tests
- `patient_vitals` — vital sign history
- `clinical_notes` — medical documentation
- `billing_master`, `billing_details` — financial records
- `medical_services`, `hospital_services` — service catalog
- `doctor_weekly_schedules`, `doctor_shifts` — availability management
- `referrals`, `referral_agents` — referral tracking
- `consultation_outcomes` — post-consultation documentation
- `patient_documents` — file attachments
- `mlc_cases` — medico-legal cases
- `marketing_leads`, `campaigns` — CRM and marketing

The full schema SQL file is at `backend/HMS_DB.sql`.

---

## 📁 Project Scripts

| Script | Location | Purpose |
|---|---|---|
| `npm run dev` | `frontend/` | Start Next.js dev server (port 3000) |
| `npm run dev` | `backend/` | Start Express API with nodemon (port 5000) |
| `npm run build` | `frontend/` | Production build |
| `node create_admin.js` | `backend/` | Create initial super admin |
| `node fix_sequences_all.js` | `backend/` | Fix PostgreSQL sequences after data import |
| `restart_backend.bat` | Root | Restart backend server (Windows) |

---

## 🔒 Security Features

- JWT authentication with configurable expiry
- Role-based access control (RBAC) per route
- Branch-scoped data access — staff can only see their branch's data
- Password hashing with bcrypt
- HTTP security headers via Helmet
- File upload validation via Multer
- AI write actions always require explicit user confirmation

---

*Built for multi-branch healthcare institutions by GKTECH.*
