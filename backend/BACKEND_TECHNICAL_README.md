# HMS Backend - Technical Reference Documentation

## Project Overview

The HMS (Hospital Management System) Backend is a comprehensive RESTful API server built to manage multi-branch hospital operations. It handles patient management, doctor scheduling, OPD (Outpatient Department) workflows, billing, insurance claims processing, referral networks, and marketing analytics. The system is designed for scalability with a multi-tenant architecture supporting multiple hospitals and branches.

**Core Problem Solved**: Centralized management of hospital operations across multiple branches with role-based access control, real-time patient tracking, and comprehensive financial reporting.

**Target Users**: Hospital administrators, doctors, nurses, receptionists, accountants, and marketing teams.

**Unique Value Proposition**: Multi-branch support with unified data management, comprehensive referral tracking, and integrated insurance claims processing with Excel import capabilities.

---

## Quick Facts

| Attribute | Value |
|-----------|-------|
| **Project Type** | RESTful API Backend |
| **Primary Language** | JavaScript (Node.js) |
| **Runtime** | Node.js |
| **Framework** | Express.js v4.18.2 |
| **Database** | PostgreSQL v18 |
| **Authentication** | JWT (JSON Web Tokens) |
| **API Style** | REST |
| **Default Port** | 5000 |
| **Status** | Development/Production Ready |

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Modules & Components](#core-modules--components)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Authentication & Authorization](#authentication--authorization)
8. [Security Implementation](#security-implementation)
9. [Error Handling](#error-handling)
10. [Configuration & Environment](#configuration--environment)
11. [Dependencies](#dependencies)
12. [Development Setup](#development-setup)

---

## Architecture Overview

### System Architecture

The backend follows a **Layered Architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Routes)                       │
│    Handles HTTP requests, routing, and request validation    │
├─────────────────────────────────────────────────────────────┤
│                   Controller Layer                           │
│    Business logic, request processing, response formatting   │
├─────────────────────────────────────────────────────────────┤
│                     Model Layer                              │
│    Data access, ORM-like patterns, database queries          │
├─────────────────────────────────────────────────────────────┤
│                    Database Layer                            │
│    PostgreSQL with connection pooling (pg)                   │
└─────────────────────────────────────────────────────────────┘
```

### Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Express.js** | Lightweight, unopinionated, excellent middleware ecosystem |
| **PostgreSQL** | ACID compliance, JSON support (JSONB), robust for healthcare data |
| **Connection Pooling** | Max 20 connections, optimized for concurrent requests |
| **JWT Authentication** | Stateless auth, suitable for distributed systems |
| **Class-based Models** | BaseModel pattern for consistent CRUD operations |

---

## Technology Stack

### Backend/Application Layer

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Runtime | Node.js | - | JavaScript runtime |
| Framework | Express.js | 4.18.2 | HTTP server and routing |
| Authentication | jsonwebtoken | 9.0.2 | JWT token generation/validation |
| Password Hashing | bcryptjs | 2.4.3 | Secure password storage |
| Validation | express-validator | 7.0.1 | Request input validation |
| Security | helmet | 7.1.0 | HTTP security headers |
| CORS | cors | 2.8.5 | Cross-origin resource sharing |
| Logging | morgan | 1.10.0 | HTTP request logging |
| File Upload | multer | 2.0.2 | Multipart form data handling |
| Excel Parsing | xlsx | 0.18.5 | Insurance claims Excel import |
| HTTP Client | axios | 1.13.2 | External API calls |
| Environment | dotenv | 16.3.1 | Environment variable management |

### Data Layer

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Database | PostgreSQL | 18.x | Primary data store |
| Node.js Driver | pg | 8.11.3 | Database connectivity |
| Connection Pool | pg.Pool | - | Connection management (max: 20) |

### Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| nodemon | 3.0.2 | Auto-restart during development |

---

## Project Structure

### Directory Layout

```
backend/
├── config/                    # Configuration files
│   ├── db.js                  # PostgreSQL connection pool setup
│   └── initDb.js              # Database initialization and seeding
│
├── controllers/               # Business logic layer
│   ├── accountantController.js    # Insurance claims, reporting, analytics
│   ├── adminController.js         # Admin operations
│   ├── appointmentController.js   # Appointment scheduling
│   ├── authController.js          # Authentication (login, register, JWT)
│   ├── branchController.js        # Branch CRUD operations
│   ├── clientAdminController.js   # Client admin management
│   ├── consultationController.js  # Consultation outcomes
│   ├── departmentController.js    # Department management
│   ├── doctorController.js        # Doctor CRUD, scheduling, analytics
│   ├── hospitalController.js      # Hospital CRUD operations
│   ├── leadController.js          # Lead management
│   ├── leadDataController.js      # Lead data processing
│   ├── mlcController.js           # Medico-Legal Case management
│   ├── nurseController.js         # Nurse management
│   ├── opdController.js           # OPD entries, payments, statistics
│   ├── patientController.js       # Patient CRUD, search
│   ├── prescriptionController.js  # Prescription management
│   ├── receptionistController.js  # Receptionist operations
│   ├── referralController.js      # Referral hospitals/doctors
│   ├── serviceController.js       # Hospital services
│   ├── shiftController.js         # Shift management
│   ├── marketing/                 # Marketing sub-module
│   │   ├── accountsController.js      # Marketing accounts
│   │   ├── bulkAccountsController.js  # Bulk operations
│   │   ├── referralDoctorController.js
│   │   └── referralPatientController.js
│   └── referralPayment/           # Referral payment sub-module
│       └── referralPaymentController.js
│
├── database/                  # Database scripts and migrations
│   ├── schema.sql             # Main database schema (24+ tables)
│   ├── seed_data.sql          # Initial seed data
│   ├── 001_add_modules_and_marketing.sql  # Migration: Modules
│   ├── 002_update_schema_audit_and_timezone.sql
│   ├── 003_add_uuid_fields.sql
│   ├── 004_add_branch_modules_and_users.sql
│   ├── 005_fix_duplicated_roles.sql
│   ├── 006_add_referral_doctor_fields.sql
│   ├── 007_add_gst_rate_to_services.sql
│   ├── 008_create_referral_payments_table.sql
│   └── [... additional migrations]
│
├── middleware/                # Express middleware
│   ├── auth.js                # JWT authentication & authorization
│   ├── errorHandler.js        # Centralized error handling
│   └── uploadMiddleware.js    # File upload configuration
│
├── models/                    # Data access layer
│   ├── BaseModel.js           # Abstract base with CRUD operations
│   ├── User.js                # User model with role resolution
│   ├── Doctor.js              # Doctor model with complex queries
│   ├── Nurse.js               # Nurse model
│   ├── Patient.js             # Patient model
│   ├── Appointment.js         # Appointment model
│   ├── OPDEntry.js            # OPD entry model
│   ├── Billing.js             # Billing model
│   ├── BillingItem.js         # Billing items model
│   ├── InsuranceClaim.js      # Insurance claims model
│   ├── Branch.js              # Branch model
│   ├── Hospital.js            # Hospital model
│   ├── Department.js          # Department model
│   ├── Service.js             # Service model
│   ├── Shift.js               # Shift model
│   ├── Role.js                # Role model
│   ├── UserSession.js         # Session management
│   ├── PasswordResetToken.js  # Password reset tokens
│   └── [... mapping models]   # Doctor-Branch, Nurse-Branch, etc.
│
├── routes/                    # API route definitions
│   ├── index.js               # Main router aggregator
│   ├── authRoutes.js          # /api/auth/*
│   ├── hospitalRoutes.js      # /api/hospitals/*
│   ├── branchRoutes.js        # /api/branches/*
│   ├── doctorRoutes.js        # /api/doctors/*
│   ├── patientRoutes.js       # /api/patients/*
│   ├── opdRoutes.js           # /api/opd/*
│   ├── accountantRoutes.js    # /api/accountant/*
│   ├── referralRoutes.js      # /api/referrals/*
│   ├── marketingRoutes.js     # /api/marketing/*
│   └── [... additional routes]
│
├── utils/                     # Utility functions
│   ├── authUtils.js           # JWT and password utilities
│   ├── encryption.js          # Encryption helpers
│   └── generateHash.js        # Hash generation utility
│
├── uploads/                   # Uploaded files directory
│   ├── claims/                # Insurance claim Excel files
│   ├── kyc/                   # KYC documents
│   └── profiles/              # Profile photos
│
├── scripts/                   # Utility scripts
│   └── [... various DB/admin scripts]
│
├── server.js                  # Application entry point
├── package.json               # NPM dependencies
└── .env                       # Environment variables
```

### Key Files

| File | Purpose |
|------|---------|
| `server.js` | Express app initialization, middleware setup, route mounting |
| `config/db.js` | PostgreSQL connection pool with 20 max connections |
| `config/initDb.js` | Database schema and seed data initialization |
| `middleware/auth.js` | JWT authentication and role-based authorization |
| `middleware/errorHandler.js` | Centralized error handling with AppError class |
| `models/BaseModel.js` | Abstract CRUD operations for all models |
| `routes/index.js` | Central router that mounts all API routes |

---

## Core Modules & Components

### Module: Authentication (`authController.js`)

**Purpose**: Handles user authentication, session management, and password operations.

**Location**: `controllers/authController.js`

**Key Functions**:

| Function | HTTP Method | Route | Description |
|----------|-------------|-------|-------------|
| `register` | POST | `/api/auth/register` | Register new user |
| `login` | POST | `/api/auth/login` | User login with JWT generation |
| `logout` | POST | `/api/auth/logout` | Logout (invalidate session) |
| `logoutAll` | POST | `/api/auth/logout-all` | Logout from all devices |
| `refresh` | POST | `/api/auth/refresh` | Refresh access token |
| `getCurrentUser` | GET | `/api/auth/me` | Get current user profile |
| `changePassword` | POST | `/api/auth/change-password` | Change user password |
| `getSessions` | GET | `/api/auth/sessions` | Get active sessions |

**Implementation Details**:
- JWT access tokens with configurable expiration (default: 7 days)
- Password hashing with bcryptjs (10 salt rounds)
- Login attempt tracking with account lockout (30 minutes after 5 failures)
- Role-based token payload with user, branch, and hospital context

---

### Module: Doctor Management (`doctorController.js`)

**Purpose**: Manages doctor CRUD operations, scheduling, and analytics.

**Location**: `controllers/doctorController.js`

**Key Functions**:

| Function | HTTP Method | Route | Description |
|----------|-------------|-------|-------------|
| `createDoctor` | POST | `/api/doctors` | Create new doctor with user account |
| `getAllDoctors` | GET | `/api/doctors` | Get all doctors (with filters) |
| `getDoctorById` | GET | `/api/doctors/:id` | Get single doctor |
| `updateDoctor` | PATCH | `/api/doctors/:id` | Update doctor details |
| `getMyBranchDoctors` | GET | `/api/doctors/my-branch` | Doctors for current branch |
| `getDoctorSchedule` | GET | `/api/doctors/schedule` | Today's schedule (OPD queue + appointments) |
| `getAnalytics` | GET | `/api/doctors/analytics` | Doctor-specific analytics |
| `getDashboardStats` | GET | `/api/doctors/dashboard-stats` | Dashboard statistics |
| `assignDepartment` | POST | `/api/doctors/:id/departments` | Assign to department |

**Filters Supported**:
- `?hospital_id=1` - Filter by hospital
- `?branch_id=3` - Filter by branch
- `?department_id=2` - Filter by department
- `?code=DOC123` - Filter by doctor code

**Database Tables Used**: `doctors`, `users`, `doctor_branches`, `doctor_departments`, `doctor_branch_departments`

---

### Module: OPD Management (`opdController.js`)

**Purpose**: Handles outpatient department workflows, patient check-in, and visit tracking.

**Location**: `controllers/opdController.js`

**Key Functions**:

| Function | HTTP Method | Route | Description |
|----------|-------------|-------|-------------|
| `createOpdEntry` | POST | `/api/opd` | Create OPD entry (with optional patient creation) |
| `getOpdEntries` | GET | `/api/opd` | Get OPD entries for branch |
| `getOpdEntryById` | GET | `/api/opd/:id` | Get single OPD entry |
| `updateOpdEntry` | PATCH | `/api/opd/:id` | Update OPD entry |
| `updatePaymentStatus` | PATCH | `/api/opd/:id/payment` | Update payment status |
| `getDashboardStats` | GET | `/api/opd/stats` | Dashboard statistics |
| `getAnalytics` | GET | `/api/opd/stats/analytics` | Detailed analytics |
| `getOpdHistoryByPatient` | GET | `/api/opd/patient/:patientId` | Patient OPD history |

**Visit Types**: `Walk-in`, `Follow-up`, `Emergency`, `Referral`

**Visit Statuses**: `Registered`, `In-consultation`, `Completed`, `Cancelled`

**Payment Statuses**: `Paid`, `Pending`, `Partial`, `Waived`

**Database Tables Used**: `opd_entries`, `patients`, `doctors`, `branches`, `departments`

---

### Module: Accountant & Insurance (`accountantController.js`)

**Purpose**: Manages insurance claims processing, Excel uploads, financial reporting, and analytics.

**Location**: `controllers/accountantController.js`

**Key Functions**:

| Function | HTTP Method | Route | Description |
|----------|-------------|-------|-------------|
| `uploadClaims` | POST | `/api/accountant/claims/upload` | Upload claims via Excel |
| `getClaims` | GET | `/api/accountant/claims` | Get claims with filters |
| `getClaimByApprovalNo` | GET | `/api/accountant/claims/:approvalNo` | Get claim by approval number |
| `updateClaimPayment` | PATCH | `/api/accountant/claims/:approvalNo/payment` | Update claim payment |
| `getReports` | GET | `/api/accountant/reports` | Generate financial reports |
| `getInsuranceCompanies` | GET | `/api/accountant/insurance-companies` | List insurance companies |
| `getAssignedBranches` | GET | `/api/accountant/branches` | Get accountant's assigned branches |
| `getHospitalBranchAnalytics` | GET | `/api/accountant/analytics/hospital-branch` | Hospital/branch analytics |
| `getInsurerAnalytics` | GET | `/api/accountant/analytics/insurer` | Insurer-based analytics |
| `getBranchInsurerAnalytics` | GET | `/api/accountant/analytics/branch-insurer` | Branch-insurer analytics |
| `getDashboardStats` | GET | `/api/accountant/dashboard` | Dashboard statistics |
| `createAccountant` | POST | `/api/accountant/manage` | Create accountant (Admin) |
| `getAllAccountants` | GET | `/api/accountant/manage` | List all accountants |

**Excel Upload Features**:
- Parses Excel files using `xlsx` library
- Supports multiple date formats (Excel dates, string dates)
- Handles numeric values with currency symbols and commas
- Automatic column name normalization

**Database Tables Used**: `insurance_claims`, `staff`, `staff_branches`, `users`

---

### Module: Patient Management (`patientController.js`)

**Purpose**: Handles patient registration, search, and record management.

**Location**: `controllers/patientController.js`

**Key Functions**:

| Function | HTTP Method | Route | Description |
|----------|-------------|-------|-------------|
| `createPatient` | POST | `/api/patients` | Register new patient |
| `getAllPatients` | GET | `/api/patients` | Get patients (limited to recent) |
| `searchPatients` | GET | `/api/patients/search` | Search by phone/MRN/code |
| `getPatientById` | GET | `/api/patients/:id` | Get patient details |
| `updatePatient` | PATCH | `/api/patients/:id` | Update patient info |
| `getMyPatients` | GET | `/api/patients/my-patients` | Doctor's patients |

**Search Types**: `phone`, `mrn`, `code`

**Database Tables Used**: `patients`, `opd_entries`

---

### Module: Referral System (`referralController.js`)

**Purpose**: Manages referral hospitals, referral doctors, and hospital mappings.

**Location**: `controllers/referralController.js`

**Key Functions**:

| Function | HTTP Method | Route | Description |
|----------|-------------|-------|-------------|
| `createReferralHospital` | POST | `/api/referrals/hospitals` | Create referral hospital |
| `getReferralHospitals` | GET | `/api/referrals/hospitals` | List referral hospitals |
| `updateReferralHospital` | PATCH | `/api/referrals/hospitals/:id` | Update referral hospital |
| `deleteReferralHospital` | DELETE | `/api/referrals/hospitals/:id` | Deactivate referral hospital |
| `createReferralDoctor` | POST | `/api/referrals/doctors` | Create referral doctor |
| `getReferralDoctors` | GET | `/api/referrals/doctors` | List referral doctors |
| `updateReferralDoctor` | PATCH | `/api/referrals/doctors/:id` | Update referral doctor |
| `deleteReferralDoctor` | DELETE | `/api/referrals/doctors/:id` | Deactivate referral doctor |
| `createMapping` | POST | `/api/referrals/mappings` | Create hospital mapping |
| `deleteMapping` | DELETE | `/api/referrals/mappings/:id` | Delete hospital mapping |

**Database Tables Used**: `referral_hospitals`, `referral_doctors`, `hospital_referral_mappings`

---

### Module: Marketing (`controllers/marketing/`)

**Purpose**: Marketing analytics, account management, and bulk operations.

**Location**: `controllers/marketing/`

**Sub-Controllers**:
- `accountsController.js` - Marketing account management
- `bulkAccountsController.js` - Bulk operations for accounts
- `referralDoctorController.js` - Referral doctor analytics
- `referralPatientController.js` - Referral patient tracking

---

### Module: BaseModel (`models/BaseModel.js`)

**Purpose**: Provides abstract CRUD operations inherited by all models.

**Methods**:

| Method | Description |
|--------|-------------|
| `findAll(filters, options)` | Find all records with optional filters, ordering, pagination |
| `findById(id)` | Find single record by primary key |
| `findOne(filters)` | Find first matching record |
| `create(data, client)` | Insert new record (supports transactions) |
| `update(id, data, client)` | Update record by ID (supports transactions) |
| `delete(id, client)` | Delete record by ID (supports transactions) |
| `executeQuery(query, values, client)` | Execute custom SQL query |

**Options for findAll**:
- `orderBy: 'column ASC/DESC'`
- `limit: number`
- `offset: number`

---

## Database Schema

### Overview

- **Database**: PostgreSQL 18.x
- **Schema Design**: 3NF (Third Normal Form) with strategic denormalization for performance
- **Total Tables**: 24+ core tables
- **Key Features**: UUID support, JSONB columns, generated columns, database triggers

### Core Tables

#### Table: `roles`

**Purpose**: System roles for RBAC (Role-Based Access Control)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| role_id | SERIAL | PRIMARY KEY | Unique identifier |
| role_name | VARCHAR(100) | NOT NULL | Display name |
| role_code | VARCHAR(50) | UNIQUE, NOT NULL | Code for authorization checks |
| description | TEXT | - | Role description |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Standard Roles**: SUPER_ADMIN, CLIENT_ADMIN, DOCTOR, NURSE, RECEPTIONIST, ACCOUNTANT, PHARMACIST, MARKETING

---

#### Table: `hospitals`

**Purpose**: Hospital master data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| hospital_id | SERIAL | PRIMARY KEY | Unique identifier |
| hospital_name | VARCHAR(200) | NOT NULL | Hospital name |
| hospital_code | VARCHAR(50) | UNIQUE, NOT NULL | Unique code |
| headquarters_address | TEXT | - | HQ address |
| contact_number | VARCHAR(20) | - | Phone number |
| email | VARCHAR(100) | - | Email address |
| hospital_type | VARCHAR(20) | CHECK | Government/Private/Trust/Corporate |
| logo | VARCHAR(255) | - | Logo URL |
| enabled_modules | JSONB | - | Enabled feature modules |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |

---

#### Table: `branches`

**Purpose**: Hospital branch information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| branch_id | SERIAL | PRIMARY KEY | Unique identifier |
| hospital_id | INT | FK → hospitals | Parent hospital |
| branch_name | VARCHAR(200) | NOT NULL | Branch name |
| branch_code | VARCHAR(50) | NOT NULL | Unique within hospital |
| address_line1 | VARCHAR(255) | - | Address |
| city | VARCHAR(100) | - | City |
| state | VARCHAR(100) | - | State |
| pincode | VARCHAR(10) | - | Postal code |
| latitude | DECIMAL(10,8) | - | GPS latitude |
| longitude | DECIMAL(11,8) | - | GPS longitude |
| total_beds | INT | - | Total beds |
| emergency_available | BOOLEAN | DEFAULT FALSE | Has emergency |
| icu_beds | INT | DEFAULT 0 | ICU bed count |
| mlc_fee | DECIMAL(10,2) | DEFAULT 0 | MLC fee |
| enabled_modules | JSONB | - | Branch-specific modules |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |

---

#### Table: `users`

**Purpose**: User accounts for authentication

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | SERIAL | PRIMARY KEY | Unique identifier |
| username | VARCHAR(100) | UNIQUE, NOT NULL | Login username |
| email | VARCHAR(100) | UNIQUE, NOT NULL | Email address |
| phone_number | VARCHAR(20) | - | Phone number |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hash |
| role_id | INT | FK → roles, NOT NULL | User role |
| is_active | BOOLEAN | DEFAULT TRUE | Account active |
| is_email_verified | BOOLEAN | DEFAULT FALSE | Email verified |
| last_login | TIMESTAMP | - | Last login time |
| login_attempts | INT | DEFAULT 0 | Failed login count |
| locked_until | TIMESTAMP | - | Account lock expiry |
| must_change_password | BOOLEAN | DEFAULT FALSE | Force password change |

---

#### Table: `doctors`

**Purpose**: Doctor profiles and credentials

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| doctor_id | SERIAL | PRIMARY KEY | Unique identifier |
| user_id | INT | FK → users, NOT NULL | Linked user account |
| first_name | VARCHAR(100) | NOT NULL | First name |
| last_name | VARCHAR(100) | NOT NULL | Last name |
| doctor_code | VARCHAR(50) | UNIQUE, NOT NULL | Doctor code |
| gender | VARCHAR(10) | CHECK | Male/Female/Other |
| qualification | VARCHAR(255) | - | Medical qualification |
| specialization | VARCHAR(255) | - | Specialization |
| experience_years | INT | - | Years of experience |
| registration_number | VARCHAR(100) | UNIQUE, NOT NULL | Medical registration |
| registration_council | VARCHAR(100) | - | Council name |
| consultation_fee | DECIMAL(10,2) | - | Default consultation fee |
| doctor_type | VARCHAR(50) | CHECK | In-house/Visiting |
| signature_url | VARCHAR(255) | - | Digital signature |
| profile_photo | VARCHAR(255) | - | Profile photo URL |
| bank_name | VARCHAR(255) | - | Bank name |
| account_number | VARCHAR(50) | - | Bank account |
| ifsc_code | VARCHAR(20) | - | IFSC code |

---

#### Table: `patients`

**Purpose**: Patient demographic and medical information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| patient_id | SERIAL | PRIMARY KEY | Unique identifier |
| mrn_number | VARCHAR(50) | UNIQUE, NOT NULL | Medical Record Number |
| first_name | VARCHAR(100) | NOT NULL | First name |
| last_name | VARCHAR(100) | NOT NULL | Last name |
| patient_code | VARCHAR(50) | UNIQUE, NOT NULL | Patient code |
| gender | VARCHAR(10) | CHECK | Male/Female/Other/Pediatric |
| date_of_birth | DATE | - | DOB |
| age | INT | - | Age |
| blood_group | VARCHAR(5) | CHECK | A+/A-/B+/B-/AB+/AB-/O+/O- |
| contact_number | VARCHAR(20) | - | Phone |
| aadhar_number | VARCHAR(12) | - | Aadhaar ID |
| insurance_provider | VARCHAR(100) | - | Insurance company |
| insurance_policy_number | VARCHAR(100) | - | Policy number |
| medical_history | TEXT | - | Medical history |
| allergies | TEXT | - | Known allergies |
| current_medications | TEXT | - | Current medications |

---

#### Table: `opd_entries`

**Purpose**: Outpatient department visit records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| opd_id | SERIAL | PRIMARY KEY | Unique identifier |
| opd_number | VARCHAR(50) | UNIQUE, NOT NULL | OPD number |
| patient_id | INT | FK → patients, NOT NULL | Patient |
| branch_id | INT | FK → branches, NOT NULL | Branch |
| doctor_id | INT | FK → doctors, NOT NULL | Attending doctor |
| department_id | INT | FK → departments | Department |
| appointment_id | INT | FK → appointments | Linked appointment |
| visit_type | VARCHAR(20) | CHECK | Walk-in/Follow-up/Emergency/Referral |
| visit_date | DATE | NOT NULL | Visit date |
| visit_time | TIME | - | Visit time |
| token_number | VARCHAR(20) | - | Queue token |
| symptoms | TEXT | - | Reported symptoms |
| vital_signs | JSONB | - | Vitals (BP, temp, etc.) |
| diagnosis | TEXT | - | Diagnosis |
| prescription | TEXT | - | Prescription text |
| consultation_fee | DECIMAL(10,2) | - | Fee amount |
| payment_status | VARCHAR(20) | CHECK | Paid/Pending/Partial/Waived |
| visit_status | VARCHAR(20) | CHECK | Registered/In-consultation/Completed/Cancelled |
| consultation_start_time | TIMESTAMP | - | Consultation start |
| consultation_end_time | TIMESTAMP | - | Consultation end |

---

#### Table: `insurance_claims`

**Purpose**: Insurance claim records for accountant module

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| claim_id | SERIAL | PRIMARY KEY | Unique identifier |
| approval_number | VARCHAR(100) | UNIQUE, NOT NULL | Approval/claim number |
| patient_name | VARCHAR(200) | - | Patient name |
| hospital_id | INT | FK → hospitals | Hospital |
| branch_id | INT | FK → branches | Branch |
| insurer_name | VARCHAR(200) | - | Insurance company |
| claim_amount | DECIMAL(12,2) | - | Claimed amount |
| approved_amount | DECIMAL(12,2) | - | Approved amount |
| paid_amount | DECIMAL(12,2) | - | Paid amount |
| tds_amount | DECIMAL(12,2) | - | TDS deducted |
| disallowance_amount | DECIMAL(12,2) | - | Disallowance |
| outstanding_amount | DECIMAL(12,2) | - | Outstanding balance |
| claim_status | VARCHAR(50) | - | Claim status |
| payment_date | DATE | - | Payment date |
| admission_date | DATE | - | Admission date |
| discharge_date | DATE | - | Discharge date |
| uploaded_by | INT | FK → users | Uploader |
| uploaded_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Upload time |

---

### Mapping Tables

| Table | Purpose |
|-------|---------|
| `branch_departments` | Links departments to branches |
| `doctor_branches` | Assigns doctors to branches |
| `doctor_departments` | Assigns doctors to departments |
| `doctor_branch_departments` | Three-way mapping for doctors |
| `nurse_branches` | Assigns nurses to branches |
| `staff_branches` | Assigns staff to branches |
| `shift_branches` | Assigns shifts to branches |
| `doctor_shifts` | Doctor shift attendance |
| `nurse_shifts` | Nurse shift attendance |
| `branch_services` | Services available at branches |

---

### Database Triggers

All tables with `updated_at` column have automatic update triggers:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### Performance Indexes

| Table | Index | Columns |
|-------|-------|---------|
| users | idx_users_email | email |
| users | idx_users_phone | phone_number |
| users | idx_users_role | role_id |
| patients | idx_patients_mrn | mrn_number |
| patients | idx_patients_contact | contact_number |
| appointments | idx_appointments_date | appointment_date |
| appointments | idx_appointments_doctor | doctor_id |
| appointments | idx_appointments_status | appointment_status |
| opd_entries | idx_opd_date | visit_date |
| opd_entries | idx_opd_patient | patient_id |
| opd_entries | idx_opd_doctor | doctor_id |
| billings | idx_billings_date | bill_date |
| billings | idx_billings_status | bill_status |

---

## API Documentation

### Base URL

```
http://localhost:5000/api
```

### Health Check

```http
GET /api/health
```

**Response**:
```json
{
  "status": "success",
  "message": "HMS API is running",
  "timestamp": "2026-01-23T00:00:00.000Z"
}
```

---

### Authentication Endpoints

#### Login

```http
POST /api/auth/login
```

**Request Body**:
```json
{
  "username": "doctor123",
  "password": "password123"
}
```

**Success Response (200)**:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": 1,
      "username": "doctor123",
      "role_code": "DOCTOR",
      "branch_id": 1,
      "hospital_id": 1,
      "doctor_id": 1
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### Doctor Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/doctors` | Required (CLIENT_ADMIN) | Create doctor |
| GET | `/api/doctors` | Required | List all doctors |
| GET | `/api/doctors/:id` | Required | Get doctor by ID |
| PATCH | `/api/doctors/:id` | Required (CLIENT_ADMIN) | Update doctor |
| GET | `/api/doctors/my-branch` | Required (RECEPTIONIST) | Branch doctors |
| GET | `/api/doctors/schedule` | Required (DOCTOR) | Today's schedule |
| GET | `/api/doctors/analytics` | Required (DOCTOR) | Doctor analytics |
| GET | `/api/doctors/dashboard-stats` | Required (DOCTOR) | Dashboard stats |

---

### Patient Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/patients` | Required | Create patient |
| GET | `/api/patients` | Required | List patients |
| GET | `/api/patients/search?q=&type=` | Required | Search patients |
| GET | `/api/patients/:id` | Required | Get patient |
| PATCH | `/api/patients/:id` | Required | Update patient |
| GET | `/api/patients/my-patients` | Required (DOCTOR) | Doctor's patients |

---

### OPD Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/opd` | Required | Create OPD entry |
| GET | `/api/opd` | Required | List OPD entries |
| GET | `/api/opd/:id` | Required | Get OPD entry |
| PATCH | `/api/opd/:id` | Required | Update OPD entry |
| PATCH | `/api/opd/:id/payment` | Required | Update payment |
| GET | `/api/opd/stats` | Required | Dashboard stats |
| GET | `/api/opd/stats/analytics` | Required | Analytics |
| GET | `/api/opd/patient/:patientId` | Required | Patient OPD history |

---

### Accountant Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/accountant/claims/upload` | Required (ACCOUNTANT) | Upload Excel |
| GET | `/api/accountant/claims` | Required (ACCOUNTANT) | List claims |
| GET | `/api/accountant/claims/:approvalNo` | Required (ACCOUNTANT) | Get claim |
| PATCH | `/api/accountant/claims/:approvalNo/payment` | Required (ACCOUNTANT) | Update payment |
| GET | `/api/accountant/reports` | Required (ACCOUNTANT) | Reports |
| GET | `/api/accountant/insurance-companies` | Required (ACCOUNTANT) | Insurers list |
| GET | `/api/accountant/branches` | Required (ACCOUNTANT) | Assigned branches |
| GET | `/api/accountant/analytics/*` | Required (ACCOUNTANT) | Analytics |
| GET | `/api/accountant/dashboard` | Required (ACCOUNTANT) | Dashboard |

---

## Authentication & Authorization

### JWT Token Structure

**Access Token Payload**:
```json
{
  "userId": 1,
  "user_id": 1,
  "username": "doctor123",
  "role": "DOCTOR",
  "role_id": 3,
  "branch_id": 1,
  "hospital_id": 1,
  "doctor_id": 1,
  "iat": 1706000000,
  "exp": 1706604800
}
```

### Role Hierarchy

| Role Code | Access Level | Typical Permissions |
|-----------|--------------|---------------------|
| SUPER_ADMIN | System-wide | All operations |
| CLIENT_ADMIN | Hospital-wide | Manage hospital, branches, staff |
| DOCTOR | Branch + Own patients | Consultations, prescriptions |
| NURSE | Branch | Patient vitals, assistance |
| RECEPTIONIST | Branch | Patient registration, OPD |
| ACCOUNTANT | Assigned branches | Claims, billing, reports |
| PHARMACIST | Branch | Prescriptions, inventory |
| MARKETING | Hospital | Leads, referrals, analytics |

### Authorization Middleware

```javascript
// Protect route with role check
router.get('/admin-only', 
  authenticate, 
  authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), 
  controller.handler
);
```

---

## Security Implementation

### Password Security

- **Algorithm**: bcryptjs with 10 salt rounds
- **Storage**: Only password hash stored
- **Validation**: Minimum length enforced at controller level

### Account Protection

- **Login Attempts**: Tracked per user
- **Account Lockout**: 30-minute lockout after 5 failed attempts
- **Locked Until**: Stored in `users.locked_until` column

### HTTP Security Headers (Helmet)

```javascript
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
```

### CORS Configuration

```javascript
app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
}));
```

### Input Validation

- **Framework**: express-validator
- **Location**: Controller level
- **SQL Injection Prevention**: Parameterized queries via pg library

---

## Error Handling

### AppError Class

```javascript
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
    }
}
```

### Error Response Format

**Development**:
```json
{
  "status": "fail",
  "error": { ... },
  "message": "Error description",
  "stack": "Stack trace..."
}
```

**Production**:
```json
{
  "status": "fail",
  "message": "Error description"
}
```

### Standard HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (auth required) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Configuration & Environment

### Environment Variables

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `PORT` | Server port | 5000 | No |
| `NODE_ENV` | Environment mode | development | No |
| `DB_HOST` | PostgreSQL host | localhost | Yes |
| `DB_PORT` | PostgreSQL port | 5432 | No |
| `DB_NAME` | Database name | hms_database | Yes |
| `DB_USER` | Database user | postgres | Yes |
| `DB_PASSWORD` | Database password | root | Yes |
| `JWT_SECRET` | Access token secret | - | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret | - | Yes |
| `JWT_EXPIRE` | Token expiration | 7d | No |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 | No |

### Sample `.env` File

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hms_db_13
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here_change_in_production
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

---

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | 4.18.2 | Web framework |
| pg | 8.11.3 | PostgreSQL client |
| jsonwebtoken | 9.0.2 | JWT handling |
| bcryptjs | 2.4.3 | Password hashing |
| dotenv | 16.3.1 | Environment variables |
| cors | 2.8.5 | CORS middleware |
| helmet | 7.1.0 | Security headers |
| morgan | 1.10.0 | HTTP logging |
| express-validator | 7.0.1 | Input validation |
| multer | 2.0.2 | File uploads |
| xlsx | 0.18.5 | Excel parsing |
| axios | 1.13.2 | HTTP client |
| form-data | 4.0.5 | Form data handling |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| nodemon | 3.0.2 | Auto-restart on changes |

---

## Development Setup

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL 18.x
- npm or yarn

### Installation Steps

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your database credentials
# (Update DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET)

# Initialize database (run SQL schema)
# Using psql:
psql -U postgres -d hms_db_13 -f database/schema.sql

# Or use the setup script:
npm run db:setup

# Start development server
npm run dev

# Start production server
npm start
```

### Running the Application

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### Common Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm run db:setup` | Run database schema setup |

---

## Project Metrics

| Metric | Value |
|--------|-------|
| **Total Lines of Code** | ~15,000+ |
| **Controllers** | 21+ |
| **Models** | 35 |
| **Route Files** | 25 |
| **Database Tables** | 24+ |
| **API Endpoints** | 80+ |
| **Migrations** | 14+ |

---

## Known Limitations

1. **Session Validation**: Currently disabled (commented out) in auth middleware
2. **Email Verification**: Implemented in schema but not in business logic
3. **SMS Integration**: Not implemented
4. **Rate Limiting**: Not implemented (recommended for production)
5. **API Documentation**: No Swagger/OpenAPI specification

---

## Future Enhancements

1. **Enable Session Validation**: Re-enable UserSession validation in auth middleware
2. **Add Rate Limiting**: Implement express-rate-limit for API protection
3. **Swagger Documentation**: Generate OpenAPI specification
4. **Unit Tests**: Add Jest/Mocha test suite
5. **Redis Caching**: Cache frequently accessed data
6. **Audit Logging**: Comprehensive audit trail for sensitive operations
7. **Email/SMS Notifications**: Patient reminders, appointment confirmations
8. **Report Generation**: PDF export for reports

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Current | Initial release with core HMS functionality |

---

*This document serves as the authoritative technical reference for the HMS Backend. For frontend documentation, see the frontend README.*
