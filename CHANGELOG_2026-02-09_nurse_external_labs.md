# Changelog - Hide External Lab Tests from Nurse Assignment
**Date:** 2026-02-09
**Feature:** Nurse Flow - External Lab Test Handling

## Problem
In the nurse dashboard, the "Assign to me" button was showing for ALL lab tests, including external tests that are sent to external diagnostic centers (from `medical_services` table). Nurses should only be able to assign themselves to in-house tests that are performed at the hospital.

## Solution
Added a `source` field to the `lab_orders` table to distinguish between:
- **In-House Tests** (`billing_master`) - Tests performed at the hospital
- **External Tests** (`medical_service`) - Tests sent to external diagnostic centers

The nurse dashboard now hides the "Assign to me" button for external tests.

## Changes Made

### 1. Database Schema Update
**File:** `backend/add_source_to_lab_orders.js`
- Added `source` column to `lab_orders` table
- Default value: `billing_master` (in-house)
- Type: VARCHAR(50)

### 2. Backend - Consultation Controller
**File:** `backend/controllers/consultationController.js`
- Updated lab order creation to include `source` field
- Logic: Uses `lab.source` from the frontend payload
- Default: `medical_service` if not specified (safer default)

**Code Changes:**
```javascript
// Determine source: billing_master (in-house) or medical_service (external)
const labSource = lab.source || 'medical_service';

INSERT INTO lab_orders (..., source)
VALUES (..., $11)
```

### 3. Frontend - TypeScript Interface
**File:** `frontend/lib/api/nurse.ts`
- Added `source` field to `LabOrder` interface
- Type: `string`
- Values: `'billing_master'` or `'medical_service'`

### 4. Frontend - Nurse Dashboard
**File:** `frontend/app/nurse/dashboard/page.tsx`
- Updated `LabOrderCard` component logic
- Added `isInHouse` check: `order.source === 'billing_master'`
- Modified `canAssign` logic to include `isInHouse` condition

**Code Changes:**
```typescript
// Only show assign button for in-house tests (billing_master)
// External tests (medical_service) should not be assigned to nurses
const isInHouse = order.source === 'billing_master';
const canAssign = !order.assigned_nurse_id && nurseId && isInHouse;
```

## Impact

### Before:
- ✗ Nurses could see "Assign to me" for external lab tests
- ✗ Confusion about which tests nurses should handle
- ✗ No way to distinguish in-house vs external tests in the database

### After:
- ✅ "Assign to me" button only shows for in-house tests
- ✅ External tests are clearly marked in the database
- ✅ Nurses only handle tests performed at the hospital
- ✅ External tests remain visible for tracking but cannot be assigned

## Data Flow

### When Doctor Completes Consultation:

**In-House Test (source: 'billing_master'):**
1. Creates lab_order with `source = 'billing_master'`
2. Creates billing records (billing_master + bill_details)
3. Nurse can see and assign themselves to this test
4. Nurse performs the test at the hospital

**External Test (source: 'medical_service'):**
1. Creates lab_order with `source = 'medical_service'`
2. NO billing records created
3. Nurse can see the test but CANNOT assign themselves
4. Test is performed at external diagnostic center

## Testing

### Test Scenario 1: In-House Test
1. Doctor prescribes CBC (from billing_master)
2. Nurse dashboard shows the test
3. "Assign to me" button is visible
4. Nurse can assign and complete the test

### Test Scenario 2: External Test
1. Doctor prescribes Complete Haemogram (from medical_services)
2. Nurse dashboard shows the test
3. "Assign to me" button is HIDDEN
4. Test is for reference only (patient goes to external lab)

## Files Modified:
- ✅ `backend/add_source_to_lab_orders.js` (created)
- ✅ `backend/controllers/consultationController.js`
- ✅ `frontend/lib/api/nurse.ts`
- ✅ `frontend/app/nurse/dashboard/page.tsx`

## Database Migration:
```sql
ALTER TABLE lab_orders 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'billing_master';
```

## Notes:
- Existing lab orders will have `source = 'billing_master'` (default)
- This is safe as existing tests were likely in-house
- Future tests will be correctly categorized based on doctor's selection
