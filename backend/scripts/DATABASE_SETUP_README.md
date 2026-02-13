# Database Table Setup Guide

This guide explains how to create the `patients` and `opd_entries` tables in your PostgreSQL database.

## 📋 Tables Included

### 1. **Patients Table**
Stores patient demographic and medical information including:
- Personal details (name, DOB, gender, contact)
- Address information
- Emergency contacts
- Medical history (allergies, chronic conditions, medications)
- Insurance details
- ID proof information

### 2. **OPD Entries Table**
Stores outpatient department visit records including:
- Visit details (date, time, type)
- Patient complaints and symptoms
- Vital signs (stored as JSON)
- Diagnosis and treatment plan
- Prescriptions and lab tests (stored as JSON)
- Payment and billing information
- Follow-up instructions

## 🚀 Setup Methods

### Method 1: Using Node.js Script (Recommended)

**Run this command:**
```bash
cd backend
node scripts/setup_database.js
```

**What it does:**
- Executes the SQL script automatically
- Verifies tables were created
- Shows column counts and current data
- Provides detailed error messages if something fails

### Method 2: Using pgAdmin or psql

**Option A: Run the combined script**
1. Open pgAdmin or psql
2. Connect to your database
3. Open and execute: `backend/scripts/setup_database_tables.sql`

**Option B: Run individual scripts**
1. First run: `backend/scripts/create_patients_table.sql`
2. Then run: `backend/scripts/create_opd_entries_table.sql`

## 📁 Available Scripts

| Script | Purpose |
|--------|---------|
| `setup_database_tables.sql` | Creates both tables in one go (RECOMMENDED) |
| `create_patients_table.sql` | Creates only the patients table |
| `create_opd_entries_table.sql` | Creates only the opd_entries table |
| `setup_database.js` | Node.js script to run the setup automatically |

## ✨ Features Included

### Auto-Generated Fields
- **MRN Number**: Automatically generated for patients (if using backend models)
- **OPD Number**: Auto-generated in format `OPD-YYYYMMDD-XXXX`
- **Timestamps**: `created_at` and `updated_at` automatically managed

### Triggers
- **Auto-update timestamps**: `updated_at` automatically updates on record modification
- **OPD number generation**: Automatically generates sequential OPD numbers per day

### Indexes
- Optimized indexes on frequently queried fields
- Improves search and filter performance

### Constraints
- Foreign key relationships between tables
- Check constraints for valid enum values
- Unique constraints on key fields

## 🔍 Verification

After running the setup, verify the tables exist:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('patients', 'opd_entries');

-- Check column count
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'patients';

SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'opd_entries';
```

## 📊 Table Structure

### Patients Table (38 columns)
- **Primary Key**: `patient_id` (auto-increment)
- **Unique Key**: `mrn_number`
- **Status Values**: Active, Inactive, Deceased
- **Gender Values**: Male, Female, Other
- **Marital Status**: Single, Married, Divorced, Widowed, Other

### OPD Entries Table (41 columns)
- **Primary Key**: `opd_id` (auto-increment)
- **Unique Key**: `opd_number`
- **Foreign Keys**: 
  - `patient_id` → patients table
  - `previous_opd_id` → opd_entries table (for follow-ups)
- **Visit Types**: Walk-in, Appointment, Emergency, Follow-up, Referral
- **Status Values**: Registered, Waiting, In-Consultation, Completed, Cancelled
- **Payment Status**: Pending, Paid, Partially Paid, Waived
- **Priority**: Normal, Urgent, Emergency

## ⚠️ Important Notes

1. **Existing Data**: If tables already exist, the script uses `CREATE TABLE IF NOT EXISTS`, so it won't overwrite existing data.

2. **Foreign Keys**: The `opd_entries` table has a foreign key to `patients`, so patients table must exist first.

3. **Branches and Doctors**: The OPD table references `branch_id` and `doctor_id`, but doesn't enforce foreign keys for these (you may want to add them based on your schema).

4. **JSON Fields**: Some fields use JSONB for flexible data storage:
   - `vital_signs`
   - `prescriptions`
   - `lab_tests_ordered`
   - `imaging_ordered`

5. **Backup First**: If you have existing data, **backup your database** before running these scripts!

## 🛠️ Troubleshooting

### Error: "relation already exists"
- Tables already exist. Use `DROP TABLE` if you want to recreate them (⚠️ WARNING: This deletes all data!)

### Error: "permission denied"
- Ensure your database user has CREATE TABLE permissions

### Error: "database connection failed"
- Check your database credentials in `backend/config/db.js`
- Ensure PostgreSQL is running

### Error: "foreign key constraint fails"
- Ensure patients table is created before opd_entries table
- Use the combined script to avoid this issue

## 📝 Next Steps

After creating the tables:
1. ✅ Verify tables exist
2. ✅ Test creating a patient record
3. ✅ Test creating an OPD entry
4. ✅ Check that triggers work (OPD number generation, timestamps)
5. ✅ Verify foreign key constraints

## 🔗 Related Files

- Backend Models: `backend/models/Patient.js`, `backend/models/OpdEntry.js`
- Controllers: `backend/controllers/patientController.js`, `backend/controllers/opdController.js`
- Routes: `backend/routes/patientRoutes.js`, `backend/routes/opdRoutes.js`

---

**Created**: 2026-02-11  
**Author**: Antigravity AI  
**Status**: Ready to use
