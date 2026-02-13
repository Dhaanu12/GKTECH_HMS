# Database Schema Function Fix - 2026-02-11

## Issue Fixed
**Error**: `function update_updated_at_column() does not exist`

### Problem
Multiple triggers throughout the schema were trying to use the function `update_updated_at_column()`, but this function was never defined in the schema file.

### Root Cause
The schema.sql file had triggers like:
```sql
CREATE TRIGGER update_billing_master_timestamp
    BEFORE UPDATE ON billing_master
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

But the function `update_updated_at_column()` was missing from the schema entirely.

### Solution
**Added the missing function definition** at line 531, right after the indexes section and before any tables/triggers that use it.

### Changes Made

**File**: `backend/database/schema.sql`

**Added** (Line 531):
```sql
-- =============================================
-- FUNCTION: Auto-update updated_at timestamp
-- =============================================
-- This function is used by triggers to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Function Purpose
This function is a PostgreSQL trigger function that:
1. Automatically updates the `updated_at` column
2. Sets it to `CURRENT_TIMESTAMP` whenever a row is updated
3. Is used by multiple triggers across different tables

### Tables Using This Function
The following tables have triggers that use this function:
- `roles`
- `hospitals`
- `users`
- `branches`
- `departments`
- `branch_departments`
- `staff`
- `doctors`
- `nurses`
- `staff_branches`
- `doctor_branches`
- `nurse_branches`
- `shifts`
- `nurse_shifts`
- `doctor_shifts`
- `patients`
- `appointments`
- `opd_entries`
- `services`
- `billings`
- `billing_master`

### Schema Structure Now
```
1. Table Definitions (lines 1-504)
2. Indexes (lines 505-530)
3. Function Definition (line 531) ← ADDED HERE
4. billing_master table (line 545)
5. refund_transactions table (line 650)
6. More indexes (lines 660-680)
7. Triggers (lines 690+)
```

### Verification
To verify the fix works, restart the backend:
```bash
cd backend
npm start
```

The database should initialize successfully without function errors.

### Testing
```sql
-- Verify function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'update_updated_at_column';

-- Test the function works
UPDATE billing_master 
SET remarks = 'test' 
WHERE bill_master_id = 1;

-- Check updated_at was automatically updated
SELECT bill_master_id, updated_at 
FROM billing_master 
WHERE bill_master_id = 1;
```

---

**Date**: 2026-02-11  
**Status**: ✅ Fixed  
**Priority**: Critical (Database initialization blocker)  
**Related**: CHANGELOG_2026-02-11_schema_fix.md
