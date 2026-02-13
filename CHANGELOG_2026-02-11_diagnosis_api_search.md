# Doctor Consultation - Diagnosis & Labs Search Upgrade - 2026-02-11

## Features Added

### 1. Diagnosis Search via API (Union of Scans)
**Requirement**: Diagnosis search list should come from the union of `billing_setup_master` (where type='scan') and `medical_services` (where category='scan').

**Changes**:
- Replaced the local `COMMON_DIAGNOSES` filter with a dynamic API call.
- Endpoint: `/api/billing-setup/search-services?term=...&category=scan`
- **UI**: Added "In-House" vs "External" badges to the dropdown items to indicate source (`billing_master` vs `medical_service`).
- Added loading state (`Searching...`) and "No results found" state.

### 2. Labs Search Filtering
**Requirement**: Labs search list should come from the union of `billing_setup_master` (where type='lab_test') and `medical_services` (where category='lab_test').

**Changes**:
- Updated `handleLabSearch` to explicitly pass `category=lab_test` query parameter.
- Ensures the search results are strictly filtered to Lab Tests, excluding other service types.

### Code Modifications
**File**: `frontend/app/doctor/patients/[id]/page.tsx`

- **Updated `handleDiagnosisSearch`**:
  - Implemented async API call logic.
  - Updates `diagnosisSearchResults` with full service objects.
  
- **Updated `addDiagnosis`**:
  - Now handles selecting a service object (extracts `service_name`).

- **Updated `handleLabSearch`**:
  - Added `&category=lab_test` to the API endpoint URL.

- **Updated JSX**:
  - Refactored Diagnosis Dropdown to render service details (name, category) and source badges (Blue for In-House, Green for External).

### Verification
1.  **Diagnosis Search**:
    - Go to Doctor -> Patient -> Consultation.
    - Type in Diagnosis field (e.g. "MRI" or "Scan").
    - Verify results show "In-House" or "External" badges.
    - Verify results are actually Scans.

2.  **Labs Search**:
    - Type in Labs search field.
    - Verify results are restricted to Lab Tests.
    - Verify badges are present.

### Notes
- The backend `BillingSetupController` was already capable of this union logic, the frontend just needed to request the correct `category`.
