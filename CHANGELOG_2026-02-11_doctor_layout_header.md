# Changelog - 2026-02-11

## Doctor Portal UI Refinement

### Frontend Improvements
- **Modified Doctor Layout Header (`frontend/app/doctor/layout.tsx`):**
    - Implemented conditional logic to detect if the user is on a patient-specific page (detail or consultation).
    - Replaced the default hospital logo/stethoscope icon and "Dashboard" text with a "Back to Patient List" arrow icon and "Patient List" title on these pages.
    - Wrapped the back arrow in a `Link` component for easy navigation back to the patient list.
    - Added `ArrowLeft` icon from `lucide-react`.

---
*Refined by Antigravity AI*
