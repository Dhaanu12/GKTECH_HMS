# Changelog - 2026-02-08

## Bug Fixes

### 1. Unified Search Endpoint Error Fix
- **Issue:** The `searchServices` endpoint was returning a 500 Internal Server Error, likely due to a type mismatch in the `UNION ALL` SQL query (specifically `NULL` values interacting with typed columns like `price` or `id`).
- **Fix:** Added explicit type casting (`::integer`, `::text`, `::numeric`) to all columns in the `UNION ALL` query within `backend/controllers/billingSetupController.js`. This ensures that all combined result sets have compatible data types, preventing database errors.
- **File Modified:** `backend/controllers/billingSetupController.js`
