# Changelog - 2026-02-08

## Bug Fixes

### 1. Patient Profile - 401 Unauthorized Error Handling
- **Issue:** The `PatientProfile` component was crashing or failing silently when the authentication token was missing or expired, causing a `401 Unauthorized` error during the initial data fetch (`fetchPatientDetails`).
- **Fix:** 
    - Added a check for the existence of the `token` in `localStorage` before making API calls. If missing, the user is redirected to `/login`.
    - Added specific error handling for `401 Unauthorized` responses in the `catch` block. If a 401 error is detected, the `token` and `user` data are cleared from `localStorage`, and the user is redirected to `/login`.
- **File Modified:** `frontend/components/patient/PatientProfile.tsx`
