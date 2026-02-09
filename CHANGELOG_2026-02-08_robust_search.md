# Changelog - 2026-02-08

## Bug Fixes

### 1. Robust Service Search Implementation
- **Issue:** The service search was throwing 500 errors, likely due to SQL type mismatches or issues in the `UNION ALL` query when accessing certain tables.
- **Fix:** Refactored `searchServices` in `backend/controllers/billingSetupController.js` to use **sequential queries** (try-catch blocks for each source) instead of a single brittle `UNION ALL` query.
    - **Medical Services:** Fetched independently.
    - **General Services:** Fetched independently.
    - **Billing Setup:** Fetched independently.
    - **Validation:** Individual query failures are now logged to the console but do not crash the entire request, ensuring the user always gets partial results rather than an error page.
- **File Modified:** `backend/controllers/billingSetupController.js`
