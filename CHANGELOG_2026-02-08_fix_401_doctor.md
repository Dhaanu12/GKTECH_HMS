# Changelog - 2026-02-08

## Bug Fixes

### 1. Patient Profile - 401 Unauthorized Error Handling
- **Issue:** The `app/doctor/patients/[id]/page.tsx` component was logging `console.error` for `401 Unauthorized` responses before attempting to redirect, causing Next.js to display a development error overlay for session expiry.
- **Fix:** 
    - Moved the `401` error check to the beginning of the `catch` block.
    - If a `401` error is detected:
        - Cleared `token` and `user` from `localStorage`.
        - Redirected to `/login`.
        - Suppressed the `console.error` by returning early.
- **Files Modified:** 
    - `frontend/app/doctor/patients/[id]/page.tsx`
