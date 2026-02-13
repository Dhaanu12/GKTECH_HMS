# Search Logic Implementation Log - 2026-02-11

## Lab Search Logic
**Requirement**:
- Source 1: `billing_setup_master` (In-House) where `type_of_service` is 'lab_test'.
- Source 2: `medical_services` (External) where `category` is 'lab_test'.
- Display: Highlight source as "In-House" or "External".

**Implementation Status**: ✅ Implemented
- **Frontend**: Updated `handleLabSearch` in `frontend/app/doctor/patients/[id]/page.tsx` to call API with `category=lab_test`.
- **Backend Query**:
  - `billing_setup_master`: Filters by `tpye_of_service ILIKE '%lab_test%'`.
  - `medical_services`: Filters by `category ILIKE '%lab_test%'`.
- **Display**: Badge logic uses `source` field from API response.

## Diagnosis Search Logic
**Requirement**:
- Source 1: `billing_setup_master` (In-House) where `type_of_service` is 'scan'.
- Source 2: `medical_services` (External) where `category` is 'scan'.
- Display: Highlight source as "In-House" or "External".

**Implementation Status**: ✅ Implemented
- **Frontend**: Updated `handleDiagnosisSearch` in `frontend/app/doctor/patients/[id]/page.tsx` to call API with `category=scan`.
- **Backend Query**:
  - `billing_setup_master`: Filters by `type_of_service ILIKE '%scan%'`.
  - `medical_services`: Filters by `category ILIKE '%scan%'`.
- **Display**: Added similar Badge logic to Diagnosis Dropdown.

## Data Source Mapping
| Table | Condition | Source Label in UI | Color |
| :--- | :--- | :--- | :--- |
| `billing_setup_master` | `branch_id = {current_branch}` | **In-House** | Blue |
| `medical_services` | (Global Table) | **External** | Green |

## Files Modified
1. `frontend/app/doctor/patients/[id]/page.tsx`
   - Modified `handleLabSearch` function.
   - Replaced `handleDiagnosisSearch` function.
   - Updated Diagnosis Dropdown JSX.

## API Endpoint Used
`GET /api/billing-setup/search-services`
- Parameters: `term`, `branchId`, `category`
