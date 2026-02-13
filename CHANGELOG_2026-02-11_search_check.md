# Search Logic Verification & Data Fix - 2026-02-11

## Issue Identified
User reported search results were mixing Lab Tests into the Diagnosis (Scan) search.
- **Example**: "Bacterial culture" (a Lab Test) was appearing in Diagnosis search labeled as "scan".
- **Root Cause**: Several Lab Tests in the `medical_services` table were incorrectly categorized as `'scan'` in the database.

## Validation of Search Logic
The implemented search logic is correct and adheres to the requirements:
1.  **Labs Search**: Queries with `category='lab_test'`.
2.  **Diagnosis Search**: Queries with `category='scan'`.
3.  **Result**: The logic correctly filters by the *database category*. If the database category is wrong, the search result appears wrong.

## Actions Taken
1.  **Data Correction**: Ran a migration script to correct misclassified services in `medical_services` table.
    - Updated items like "Bacterial culture", "Brucella serology", "Anti measles titre" from `'scan'` to `'lab_test'`.
    - Generic updates for `%titre%` and `%serology%` where category was `'scan'`.
2.  **Verified Logic**: Confirmed frontend passes correct `category` parameter to backend API.

## Outcome
- **Diagnosis Search**: Will now correctly exclude these Lab Tests.
- **Labs Search**: Will now correctly include these Lab Tests.
- **Source Badges**: "In-House" (Blue) and "External" (Green) badges remain functional.

## Technical Details
- **Frontend File**: `frontend/app/doctor/patients/[id]/page.tsx`
- **Backend File**: `backend/controllers/BillingSetupController.js`
- **DB Updates**:
  ```sql
  UPDATE medical_services SET category = 'lab_test' WHERE service_name ILIKE '%Bacterial culture%';
  UPDATE medical_services SET category = 'lab_test' WHERE service_name ILIKE '%Brucella%';
  -- etc.
  ```
