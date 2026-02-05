# Nurse Module Database Migration

This document explains how to apply the nurse module database changes to your existing database.

## Quick Start

```bash
# Navigate to the database folder
cd backend/database

# Apply schema changes (safe to run multiple times)
psql -d your_database_name -f nurse_module_migration.sql
```

## What's Included

### New Tables
| Table | Description |
|-------|-------------|
| `lab_orders` | Tracks tests/examinations ordered by doctors |
| `lab_order_status_history` | Audit trail for lab order status changes |
| `patient_documents` | Stores encrypted file uploads |
| `document_access_log` | Audit trail for document access |
| `patient_vitals` | Time-series vital signs tracking |
| `clinical_notes` | Time-series clinical notes |

### Modified Tables
| Table | Changes |
|-------|---------|
| `patient_feedback` | Added: `branch_id`, `is_addressed`, `addressed_at`, `addressed_by`, `follow_up_notes`, `opd_id`, `updated_at` |

## Migration Files

1. **nurse_module_migration.sql** - Main migration file (schema only)
   - Safe to run on existing databases
   - Uses `CREATE TABLE IF NOT EXISTS`
   - Uses `ADD COLUMN IF NOT EXISTS`

2. **Seed Data Files** (optional, for testing):
   - `seed_lab_orders.sql` - Sample lab orders
   - `seed_vitals.sql` - Sample vital records
   - `seed_feedback.sql` - Sample feedback
   - `seed_clinical_notes.sql` - Sample clinical notes

## Applying Seed Data

**Note:** Seed data is configured for branch_id = 55 (Care 24 Medical Centre). Modify if your branch_id differs.

```bash
# Optional: Apply seed data for testing
psql -d your_database_name -f seed_lab_orders.sql
psql -d your_database_name -f seed_vitals.sql
psql -d your_database_name -f seed_feedback.sql
psql -d your_database_name -f seed_clinical_notes.sql
```

## Backend Configuration

Add this to your `.env` file:

```env
# File Encryption (32-byte hex key for AES-256-GCM)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
FILE_ENCRYPTION_KEY=your_32_byte_hex_key_here
```

## New API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lab-orders` | List lab orders |
| POST | `/api/lab-orders` | Create lab order |
| PATCH | `/api/lab-orders/:id/status` | Update status |
| POST | `/api/lab-orders/:id/results` | Upload results |
| GET | `/api/patient-documents/:patientId` | Get patient documents |
| GET | `/api/patient-documents/:id/download` | Download document |
| GET | `/api/vitals/patient/:patientId` | Get patient vitals history |
| POST | `/api/vitals` | Record new vitals |
| GET | `/api/clinical-notes/patient/:patientId` | Get patient notes |
| POST | `/api/clinical-notes` | Create clinical note |
| GET | `/api/feedback` | List feedback with filters |
| PATCH | `/api/feedback/:id` | Update feedback |
| GET | `/api/consultations/patient/:patientId` | Get patient consultation history |

## OPD Session Filtering

Vitals and clinical notes can be linked to specific OPD sessions and filtered by:

### Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `opdId` | Filter by specific OPD session | `?opdId=123` |
| `startDate` | Filter records from this date | `?startDate=2025-01-01` |
| `endDate` | Filter records until this date | `?endDate=2025-12-31` |

### Example Requests

```bash
# Get vitals for a specific OPD session
GET /api/vitals/patient/5?opdId=42

# Get clinical notes within a date range
GET /api/clinical-notes/patient/5?startDate=2025-01-01&endDate=2025-06-30

# Combine filters
GET /api/vitals/patient/5?opdId=42&startDate=2025-01-01&endDate=2025-03-31
```

### Response Data

Vitals and notes responses now include OPD session details when linked:

```json
{
  "vital_id": 1,
  "patient_id": 5,
  "opd_id": 42,
  "opd_number": "OPD-2025-001234",
  "opd_visit_date": "2025-01-15T10:00:00Z",
  "opd_visit_type": "Follow-up",
  "opd_doctor_name": "Dr. Sarah Johnson",
  ...
}
```

## Troubleshooting

### "relation does not exist" error
Run the migration file first before running seed data.

### Foreign key constraint errors
Ensure referenced tables (`patients`, `doctors`, `nurses`, `branches`, `users`, `opd_entries`, `prescriptions`) exist with data.

### Duplicate key errors in seed data
The seed data uses fixed order numbers. If re-running, the inserts may conflict. Either:
- Delete existing test data first
- Or modify the order numbers in the seed files
