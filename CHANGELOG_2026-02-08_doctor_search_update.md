# Changelog - 2026-02-08

## Doctor Portal Enhancements

### 1. Unified Lab & Service Search
- **Feature:** Updated the Lab/Procedure search in the Doctor's consultation view (`frontend/app/doctor/patients/[id]/page.tsx`) to search across both **In-House Billing Setups** and **External Medical Services**.
- **Implementation:**
    - Modified `handleLabSearch` to dynamically select the search endpoint:
        - If an active OPD visit with a `branchId` is found, it queries the new unified endpoint: `/api/billing-setup/search-services`.
        - Falls back to the standard global service search if no branch context is available.
    - Updated the search dropdown UI to display a badge indicating the source of each service:
        - **In-House:** Services defined in `billing_setup_master` (Blue Badge).
        - **External:** Standard medical services from the catalog (Emerald Badge).
    - Added display of service category (e.g., Lab, Scan, Procedure) below the service name for better clarity.
- **Files Modified:** `frontend/app/doctor/patients/[id]/page.tsx`
