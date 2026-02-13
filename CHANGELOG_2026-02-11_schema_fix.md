# Database Schema Fix - 2026-02-11

## Issue Fixed
**Error**: `relation "billing_master" does not exist`

### Problem
The `refund_transactions` table was being created **before** the `billing_master` table in the schema.sql file, but it had a foreign key constraint referencing `billing_master`. This caused the database initialization to fail.

### Root Cause
Table creation order issue in `backend/database/schema.sql`:
- Line 536: `refund_transactions` table created (references `billing_master`)
- Line 660: `billing_master` table created (too late!)

### Solution
**Reordered table creation** in the schema file:

1. **Moved `billing_master` table creation** to line 531 (before `refund_transactions`)
2. **Removed duplicate `billing_master` definition** that was at line 747
3. **Commented out problematic index** on non-existent `payment_transactions` table

### Changes Made

**File**: `backend/database/schema.sql`

**Changes**:
1. ✅ Moved `billing_master` table creation to line 531
2. ✅ Removed duplicate `billing_master` definition (lines 747-839)
3. ✅ Commented out: `idx_payment_transactions_status` index (line 530)
4. ✅ Commented out: `original_payment_id` column in `refund_transactions` (line 544)

### Table Creation Order (Fixed)

```
1. roles
2. hospitals
3. users
4. branches
5. departments
... (other tables)
23. billings
24. billing_items
25. billing_master ← MOVED HERE (line 531)
26. refund_transactions ← Now can reference billing_master
... (remaining tables)
```

### Foreign Key Dependencies

**`refund_transactions` table** now correctly references:
- `billing_master(bill_master_id)` ✅ (table exists before reference)

### Verification

To verify the fix works, run:
```bash
cd backend
npm start
```

The database should initialize without errors.

### Testing

```sql
-- Verify billing_master exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'billing_master';

-- Verify refund_transactions exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'refund_transactions';

-- Verify foreign key constraint
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'refund_transactions'
AND tc.constraint_type = 'FOREIGN KEY';
```

### Additional Fixes

Also commented out references to non-existent tables:
- `payment_transactions` table doesn't exist in schema
- Removed index creation for it

---

**Date**: 2026-02-11  
**Status**: ✅ Fixed  
**Priority**: Critical (Database initialization blocker)
