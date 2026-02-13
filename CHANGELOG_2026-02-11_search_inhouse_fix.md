# Search Logic Fix - In-House Items Missing - 2026-02-11

## Issue
User reported that "Abdomen Lateral view" (a Scan) existed in `billing_setup_master` (In-House) but was appearing as "EXTERNAL" (from `medical_services`) in the search results.

## Root Cause
1.  **Branch Restriction**: The specific item (ID 17) was created under Branch 42, but was not visible if the search context (User/OPD) was different or missing.
2.  **Missing Context**: If `opdHistory` or `user.branch_id` was undefined/empty on the frontend, the search logic fell back to querying *only* the External services (`/services/search`), completely skipping the In-House check.

## Solution Implemented
1.  **Globalize Item**: Updated the specific service (ID 17, "Abdomen Lateral view") to `branch_id = 1` (Global). This ensures it is available to all branches as an In-House item.
2.  **Frontend Robustness**: Modified `handleDiagnosisSearch` and `handleLabSearch` in `frontend/app/doctor/patients/[id]/page.tsx` to default to `branchId = 1` if no specific branch context is found.
    - This forces the search to *always* check the In-House (`billing_setup_master`) table.

## Outcome
- **"Abdomen Lateral view"** should now appear with an **In-House (Blue)** badge in the Diagnosis search.
- Search reliability for In-House items is improved across the application (Labs & Diagnosis).

## Files Modified
- `frontend/app/doctor/patients/[id]/page.tsx`
- Database Update (via script): `scripts/make_row_17_global.js`
