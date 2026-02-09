# Changelog - 2026-02-08

## Billing System Enhancements

### 1. Unified Service Search (Backend)
- **Feature:** Updated the `searchServices` endpoint in `BillingSetupController` to return a unified list of services from multiple sources:
    1.  **Medical Services:** Standard medical services assigned to the branch (`branch_medical_services`).
    2.  **General Services:** General services assigned to the branch (`branch_services`).
    3.  **In-House Billing Setup:** Custom services, packages, or pricing setups defined directly in `billing_setup_master`.
- **Implementation:**
    - Modified the SQL query to use `UNION ALL` to combine results from `medical_services`, `services`, and `billing_setup_master`.
    - Added a `source` column to distinguish where each result comes from (`'medical_service'`, `'service'`, or `'billing_master'`).
    - Added a `price` column (populated for `billing_master` items) to provide immediate pricing info where available.
- **File Modified:** `backend/controllers/billingSetupController.js`
