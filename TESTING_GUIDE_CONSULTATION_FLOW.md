# Consultation Completion Flow - Testing Guide

## What Was Fixed

### 1. Database Constraint Error
**Problem:** `lab_orders_test_category_check` constraint violation
- Database only accepts: `Lab`, `Imaging`, `Procedure`, `Examination`, `Other`
- Frontend was sending: `lab_test`, `procedure` (lowercase), `Laboratory`, etc.

**Solution:** Created `normalizeCategory()` helper function that:
- Converts any category variation to valid DB enum values
- Handles case-insensitive matching
- Logs transformations for debugging: `[LAB ORDER] Category: "lab_test" -> "Lab"`

### 2. Billing Logic Separation
**Problem:** All lab tests were being billed, even external referrals

**Solution:** 
- In-House tests (source: `billing_master`) → Create billing records
- External tests → Skip billing, only create lab order for tracking

### 3. Diagnostic Center Storage
**Problem:** No place to store external lab/diagnostic center name

**Solution:** 
- Added `diagnostic_center` column to `consultation_outcomes` table
- Frontend captures this when external tests are selected

### 4. Database Sequence Error
**Problem:** Duplicate key error - `consultation_outcomes_pkey` constraint violation

**Solution:**
- Reset the `outcome_id` sequence to sync with actual data
- Ran `fix_consultation_outcomes_sequence.js` to fix the auto-increment

## Complete Data Flow

### When Doctor Completes Consultation:

#### ALWAYS CREATED:
1. ✅ `consultation_outcomes` - Full consultation record
2. ✅ `prescriptions` - Medications + Labs

#### FOR IN-HOUSE TESTS:
3. ✅ `lab_orders` - Order tracking
4. ✅ `billing_master` - Invoice header
5. ✅ `bill_details` - Invoice line items

#### FOR EXTERNAL TESTS:
3. ✅ `lab_orders` - Order tracking only
4. ❌ NO billing records

## How to Test

### Test Case 1: In-House Test Only
1. Select a test marked "IN-HOUSE" (e.g., "Full Body Checkup")
2. Complete consultation
3. **Expected Results:**
   - ✅ Lab order created
   - ✅ Bill created with test price
   - ✅ Prescription includes test
   - ✅ Consultation outcome saved

### Test Case 2: External Test Only
1. Select a test marked "EXTERNAL" (e.g., "Complete Haemogram/CBC")
2. Enter diagnostic center name (e.g., "Jansons Diagnostic Center")
3. Complete consultation
4. **Expected Results:**
   - ✅ Lab order created
   - ❌ NO bill created (subtotal = 0)
   - ✅ Prescription includes test
   - ✅ Consultation outcome saved with diagnostic_center
   - ✅ Diagnostic center field appears in UI

### Test Case 3: Mixed (In-House + External)
1. Select one "IN-HOUSE" test (e.g., "Full Body Checkup" - ₹2000)
2. Select one "EXTERNAL" test (e.g., "CBC" - no price)
3. Enter diagnostic center name
4. Complete consultation
5. **Expected Results:**
   - ✅ 2 lab orders created
   - ✅ Bill created with ONLY in-house test price (₹2000)
   - ✅ Prescription includes both tests
   - ✅ Consultation outcome saved

## Console Logs to Watch

When you complete consultation, you should see:
```
[LAB ORDER] Category: "lab_test" -> "Lab"
[LAB ORDER] Category: "package" -> "Other"
[LAB ORDER] Category: "procedure" -> "Procedure"
```

## Important Notes

1. **Restart Backend Required:** The fix won't work until you restart the backend server
2. **Category Normalization:** All category variations are now handled automatically
3. **Billing Separation:** External tests are tracked but not billed
4. **Diagnostic Center:** Only appears when external test is selected

## Files Modified

1. `backend/controllers/consultationController.js`
   - Added `normalizeCategory()` helper
   - Added billing logic separation (isInternal check)
   - Added diagnostic_center field handling

2. `backend/add_diagnostic_center_column.js`
   - Database migration script

3. `frontend/app/doctor/patients/[id]/page.tsx`
   - Conditional diagnostic center field display
   - Enhanced lab object with source, price, category

4. `CHANGELOG_2026-02-09_lab_orders_fix.md`
   - Complete documentation of all changes
