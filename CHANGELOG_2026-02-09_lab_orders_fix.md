# Changelog - 2026-02-09 - Lab Orders & Search Fixes

## 1. Lab Orders Search (Backend)
### Issues Addressed
- **"No results found" for common tests:** Searches for terms like "cbc" were failing due to a SQL parameter binding error (mismatch between provided parameters and query placeholders).
- **In-House items (e.g., "Full Body Checkup") not showing:** Doctors logged into subsidiary branches (e.g., Branch 55) could not see packages or services created in the Head Office (Branch 1).
- **Cluttered Results:** Administrative "General Services" were appearing in the medical prescription/lab order search, which was unnecessary.

### Fixes Implemented
- **Fixed SQL Parameter Binding:** Updated `billingSetupController.js` to use dynamic parameter indices for the `LIMIT` clause.
- **Cross-Branch Visibility:** Updated the "Billing Setup" search query to include items from **Branch 1 (Head Office)** in addition to the current branch. This ensures global packages are visible to all doctors.
- **Removed General Services:** The search now strictly fetches from:
    - **External:** Global `medical_services` table.
    - **In-House:** `billing_setup_master` table.

## 2. Lab Orders UI (Frontend)
### Issues Addressed
- **Search Context Failure:** If a patient's active OPD record was missing branch information (e.g., incomplete registration), the search context would be undefined, leading to missing "In-House" results.

### Fixes Implemented
- **Robust Branch Fallback:** Updated `frontend/app/doctor/patients/[id]/page.tsx` to fallback to the **logged-in doctor's branch ID** if the patient's visit record is missing branch data.

## Files Modified
- `backend/controllers/billingSetupController.js`
- `frontend/app/doctor/patients/[id]/page.tsx`

## 3. Database & Code Cleanup (Billing)
### Changes
- **Removed Obsolete Tables:** Dropped `billings` and `billing_items` tables from the database as they are replaced by the new `billing_setup_master` system.
- **Removed Obsolete Models:** Deleted `backend/models/Billing.js` and `backend/models/BillingItem.js` files.
- **Updated Model Index:** Removed exports for deleted models from `backend/models/index.js` to prevent application errors.

## 4. Consultation & Billing Automation
### Changes
- **Automated Lab Orders:** When a doctor completes a consultation, the system now automatically creates records in the `lab_orders` table for all prescribed tests.
- **Automated Billing:**
    - Generates a **Billing Invoice** (`billing_master`) linked to the patient and OPD visit.
    - Creates **Bill Line Items** (`bill_details`) for each prescribed lab test/service.
    - Calculates totals based on service prices.
- **Database Integration:** Updated `consultationController.js` to perform these actions transactionally, ensuring data integrity (all or nothing).

## 5. UI Improvements (Frontend)
### Issues Addressed
- **Medication "Morning" Checkbox Bug:** Selecting the "Mor" checkbox for a medication was saving the property as `mor: true` instead of `morning: true`. This caused the morning dose to be ignored when displaying the medication in the list (e.g., showing only "Noon - Night").

### Fixes Implemented
- **Correct Property Mapping:** Updated the medication checkbox mapping logic in `frontend/app/doctor/patients/[id]/page.tsx` to explicitly map the "Mor" checkbox label to the `morning` state property.
- **Visual Consistency:** The UI now correctly reflects "Morning - Noon - Night" selections in the medication list.
- **External Lab Referral:** The "Pathology/Lab (Diagnostic Center)" input field now automatically appears when an **External** lab test is added to the list, ensuring doctors can specify the referral location.

## 6. Bug Fixes (Backend)
### Issues Addressed
- **500 Internal Server Error on Consultation Completion:** Users reported a crash when completing a consultation. This was traced to potential `undefined` values being passed to SQL queries (specifically `branch_id`, `user_id`, or `opdData` properties) which causes the PostgreSQL driver to throw an error.

### Fixes Implemented
- **Robust Null Handling:** Implemented a `safeInt` helper in `consultationController.js` to convert `undefined` values to `null` before passing them to SQL queries.
- **Data Validation:** Added strict checks to ensure `opdData`, `branch_id`, and `doctor_id` exist before attempting to process the consultation. Added meaningful error messages for these critical failures.
- **Secure User ID Extraction:** Updated the logic to robustly extract `user_id` from the request session, with a fallback error if missing, preventing silent failures or null constraints in audit logs.
- **Default Values:** Added fallback values (e.g., 'UNKNOWN') for critical text fields like `opd_number` and `mrn_number` to prevent crashes if source data is missing.

## 7. Database Structure Updates
### Changes
- **New Column:** Added `diagnostic_center` (VARCHAR 255) to the `consultation_outcomes` table.
- **Purpose:** To store the name of the external diagnostic center/lab when a doctor prescribes external tests.
- **Backend Logic:** Updated `completeConsultation` controller to capture the `pathology_lab` field from the frontend request and save it into the new `diagnostic_center` column.

## 8. Billing Logic Refinement
### Changes
- **Conditional Billing:** Modified `consultationController.js` to ensure that billing records (invoice & line items) are created **ONLY** for "In-House" lab tests (where `source === 'billing_master'`).
- **External Lab Handling:** "External" lab tests are now saved to the `lab_orders` table but kept **off the bill**, as the patient will pay the external provider directly.

## 9. Database Constraint Compliance Fix
### Issues Addressed
- **500 Error on Lab Order Creation:** The system was failing with error `lab_orders_test_category_check` constraint violation when inserting lab orders. The database only accepts specific category values: `Lab`, `Imaging`, `Procedure`, `Examination`, or `Other`.
- **Category Mismatch:** Frontend was sending categories like `lab_test`, `Laboratory`, etc., which didn't match the database constraint.

### Fixes Implemented
- **Category Normalization:** Added intelligent category mapping in `consultationController.js` that converts incoming category values to valid database enum values:
  - `laboratory`, `lab_test`, or any string containing "lab" → `Lab`
  - Strings containing "imag", "radio", or "x-ray" → `Imaging`
  - Strings containing "proc" → `Procedure`
  - Strings containing "exam" → `Examination`
  - All other values → `Other` (safe fallback)
- **Robust Error Prevention:** This ensures all lab orders are successfully created regardless of how the category is labeled in the source system.
- **Debug Logging:** Added console logging to track category transformations: `Category mapping: "original" -> "normalized"` for troubleshooting.
- **Case-Insensitive Matching:** The normalization function handles both uppercase and lowercase category values from any source.
- **Explicit Helper Function:** Replaced IIFE with a dedicated `normalizeCategory()` helper function for better reliability and debugging.

## 10. Complete Consultation Flow Documentation
### Overview
When a doctor clicks "Complete Consultation", the system now follows this exact flow:

### Always Created (Regardless of Test Type):
1. **`consultation_outcomes` table** - Stores:
   - Diagnosis, notes, next visit details
   - Labs array (JSON) with all prescribed tests
   - `diagnostic_center` field (for external lab referrals)
   - Referral information

2. **`prescriptions` table** - Stores:
   - Medications array (JSON)
   - Labs array (JSON) with all prescribed tests
   - Diagnosis and notes

### For In-House Tests (source: 'billing_master'):
3. **`lab_orders` table** - Stores:
   - Test name, normalized category, order number
   - Patient, doctor, branch, OPD references
   - Status: 'Ordered'

4. **`billing_master` table** - Creates invoice with:
   - Bill number, invoice number
   - Patient and OPD details
   - Total amount (sum of in-house test prices)

5. **`bill_details` table** - Line items for each in-house test:
   - Service name, category, price
   - Quantity, subtotal, final price

### For External Tests (source: 'medical_service' or other):
3. **`lab_orders` table** - Stores:
   - Test name, normalized category, order number
   - Patient, doctor, branch, OPD references
   - Status: 'Ordered'
   - **NOT billed** - No entries in `billing_master` or `bill_details`

### Key Differences:
- **In-House**: Patient pays the hospital → Creates billing records
- **External**: Patient pays the external lab directly → No billing records, only lab order for tracking

## 11. Database Sequence Fix
### Issues Addressed
- **Duplicate Key Error:** `consultation_outcomes_pkey` constraint violation with error "Key (outcome_id)=(1) already exists"
- **Root Cause:** The auto-increment sequence for `outcome_id` was out of sync with the actual data in the table, likely due to manual data insertion or database restoration.

### Fixes Implemented
- **Sequence Reset:** Created `fix_consultation_outcomes_sequence.js` script that:
  - Finds the maximum `outcome_id` currently in the table
  - Resets the sequence to start from the next available ID
  - Prevents future duplicate key errors
- **Automatic Recovery:** The sequence is now synchronized with the actual data, ensuring new records get unique IDs.

## 12. Bill Details Department ID Fix
### Issues Addressed
- **NOT NULL Constraint Violation:** `bill_details` table requires `department_id` but the INSERT query was not providing it
- **Error:** "null value in column 'department_id' of relation 'bill_details' violates not-null constraint"

### Fixes Implemented
- **Added department_id:** Updated the `bill_details` INSERT query to include `department_id` with a default value of `1` (Lab/Diagnostic department)
- **Rationale:** Lab orders don't have department context in the consultation flow, so we use a default department ID for billing purposes
- **Impact:** All in-house lab test billing now includes proper department tracking

## 13. Bill Details Service Type Fix
### Issues Addressed
- **CHECK Constraint Violation:** `bill_details_service_type_check` constraint was failing
- **Error:** "new row for relation 'bill_details' violates check constraint 'bill_details_service_type_check'"
- **Root Cause:** Using `'Lab'` as service_type, but database only accepts: `consultation`, `lab_order`, `procedure`, `pharmacy`, `scan`, `surgery`, `bed_charge`, `other`

### Fixes Implemented
- **Corrected service_type:** Changed from `'Lab'` to `'lab_order'` to match database constraint
- **Validation:** Ensured all billing items for lab tests use the correct enum value
- **Impact:** Lab test billing records now comply with database constraints

## 14. Bill Details Description Field - Source Tracking
### Purpose
Track whether a billable service is from in-house (billing_master) or external (medical_services) sources

### Changes Made
- **Added description field:** Updated `bill_details` INSERT query to include `description` column
- **Values:**
  - `'In House'` - Services from `billing_master` table (performed at hospital)
  - `'External'` - Services from `medical_services` table (external diagnostic centers)
- **Default:** `'In House'` if not specified

### Code Changes
**File:** `backend/controllers/consultationController.js`

```javascript
// When creating billing items
billingItems.push({
    service_name: lab.test_name || lab.service_name,
    service_type: 'lab_order',
    service_category: lab.category || 'Laboratory',
    quantity: 1,
    unit_price: price,
    subtotal: price,
    final_price: price,
    description: 'In House' // Indicates source
});

// When inserting into bill_details
INSERT INTO bill_details (
    ..., description, ...
) VALUES (..., $10, ...)
```

### Impact
- ✅ Bill details now show service source (In House / External)
- ✅ Better tracking of where services are performed
- ✅ Helps in financial reporting and reconciliation
- ✅ Clear distinction between hospital services and external referrals

## 15. Bill Details Status Fix
### Issues Addressed
- **CHECK Constraint Violation:** `bill_details_status_check` constraint was failing
- **Error:** "new row for relation 'bill_details' violates check constraint 'bill_details_status_check'"
- **Root Cause:** Using `'Active'` as status, but database only accepts: `Pending`, `Billed`, `Paid`, `Cancelled`

### Fixes Implemented
- **Corrected status:** Changed from `'Active'` to `'Pending'` to match database constraint
- **Semantic Accuracy:** `Pending` is the correct status for newly created bill items that haven't been paid yet
- **Impact:** All bill_details records now use valid status values

## Summary of All Database Constraint Fixes
The following constraints were identified and fixed for the `bill_details` table:
1. ✅ **department_id** - Added with default value `1`
2. ✅ **service_type** - Changed to `'lab_order'` (from `'Lab'`)
3. ✅ **status** - Changed to `'Pending'` (from `'Active'`)
4. ✅ **item_discount_type** - Uses `'none'` (already correct in billingItems)

## 15. Final Flow Verification & Confirmation

### Complete Consultation Submission Flow (As Implemented)

When a doctor clicks **"Complete Consultation"**, the system executes the following:

#### ALWAYS CREATED (Regardless of Test Type):
1. ✅ **`prescriptions` table** - Stores medications and labs (JSON arrays)
2. ✅ **`consultation_outcomes` table** - Stores diagnosis, notes, labs, diagnostic_center, referral info

#### FOR IN-HOUSE TESTS (source: 'billing_master'):
When doctor recommends 2 in-house tests, the system stores in:

1. ✅ **`consultation_outcomes` table** - Labs array includes both tests
2. ✅ **`prescriptions` table** - Labs array includes both tests
3. ✅ **`billing_master` table** (Parent) - Creates invoice with total of both test prices
4. ✅ **`bill_details` table** (Child) - Creates 2 line items (one for each test) with:
   - `department_id` = 1
   - `service_type` = 'lab_order'
   - `status` = 'Pending'
5. ✅ **`lab_orders` table** - Creates 2 lab order records (one for each test)

#### FOR EXTERNAL TESTS:
When doctor recommends 2 external tests, the system stores in:

1. ✅ **`consultation_outcomes` table** - Labs array includes both tests + diagnostic_center name
2. ✅ **`prescriptions` table** - Labs array includes both tests
3. ✅ **`lab_orders` table** - Creates 2 lab order records (one for each test)
4. ❌ **NO `billing_master`** - External tests are not billed
5. ❌ **NO `bill_details`** - External tests are not billed

### Key Implementation Details:
- **Billing Logic:** Only tests with `source === 'billing_master'` create billing records
- **Category Normalization:** All lab categories are normalized to valid DB values (Lab, Imaging, Procedure, Examination, Other)
- **Constraint Compliance:** All database constraints are satisfied:
  - `lab_orders.test_category` - Normalized values
  - `bill_details.department_id` - Default value 1
  - `bill_details.service_type` - 'lab_order'
  - `bill_details.status` - 'Pending'
- **Diagnostic Center:** Captured in `consultation_outcomes.diagnostic_center` for external referrals

### Transaction Safety:
All operations are wrapped in a database transaction, ensuring atomicity (all-or-nothing execution).
