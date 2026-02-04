# HMS Project - Edit Log

This document tracks all changes made to the system for audit and reference purposes.

---

## Edit Log Table

| Date | Component | File Name | Edit Name | Overview | Reason |
|------|-----------|-----------|-----------|----------|--------|
| 2026-01-23 | Frontend | `frontend/app/receptionist/opd/page.tsx` | Add Adhaar Number Field | Added a new input field for Adhaar Number in the OPD entry form's Patient Details section. The field accepts 12-digit numeric input and is required for non-MLC cases when creating a new patient. | Backend validation requires Adhaar Number for non-MLC new patient entries, but the frontend form was missing this field, causing 400 errors on OPD creation. |
| 2026-01-23 | Frontend | `frontend/app/receptionist/opd/page.tsx` | Add Form Validation | Added comprehensive frontend validation in `handleSubmit` function to check: full name, age, gender, doctor selection, and Adhaar number (for non-MLC) before API call. | Users were getting generic "basic patient info required" errors from the backend. Frontend validation provides clearer, specific error messages and prevents unnecessary API calls. |
| 2026-01-23 | Backend | `backend/controllers/opdController.js` | Make Last Name Optional | Removed `last_name` from required fields in patient validation. Now only `first_name`, `age`, and `gender` are required. | Some patients have single names without a last name. Strict validation was blocking legitimate patient registrations. |
| 2026-01-23 | Frontend | `frontend/app/receptionist/opd/page.tsx` | Update Name Validation | Updated frontend validation to only require first_name, not last_name. Changed error message accordingly. | Aligned with backend change to allow single-name patients. |
| 2026-01-27 | Backend | `backend/controllers/patientController.js` | Smart Patient Search Enhancement | Enhanced `searchPatients()` to return last visit info (date, doctor, visit_type) via LEFT JOIN LATERAL. Added `days_since_last_visit` and `is_follow_up_candidate` fields. | UX Solution 1: Enable frontend to show patient context and Quick Follow-Up button. |
| 2026-01-27 | Frontend | `frontend/app/receptionist/opd/page.tsx` | Modal Search State | Added `modalSearchQuery`, `modalSearchResults`, `isSearching` state variables for type-ahead patient search. | UX Solution 1: Track search state for debounced patient lookup in modal. |
| 2026-01-27 | Frontend | `frontend/app/receptionist/opd/page.tsx` | Debounced Search Effect | Added `useEffect` hook with 300ms debounce to search patients on keystroke after 3+ characters. | UX Solution 1: Responsive search without overwhelming API. |
| 2026-01-27 | Frontend | `frontend/app/receptionist/opd/page.tsx` | Quick Follow-Up Handler | Added `handleQuickFollowUp()` function to pre-fill form with Follow-up visit type, same doctor, and appropriate consultation fee. | UX Solution 1: One-click follow-up registration for returning patients. |
| 2026-01-27 | Frontend | `frontend/app/receptionist/opd/page.tsx` | Smart Search UI | Added search input with dropdown in OPD modal showing patient info, last visit details, Quick Follow-Up button, and "Register as New Patient" option. | UX Solution 1: Smart Patient Search interface with rich patient context. |
| 2026-01-27 | Frontend | `frontend/app/receptionist/opd/page.tsx` | Quick Follow-Up Handler from Entry | Added `handleQuickFollowUpFromEntry()` function to create follow-up OPD from existing queue entries. Pre-fills patient, doctor, visit type, and consultation fee. | UX Solution 2: Enable one-click follow-up from OPD queue. |
| 2026-01-27 | Frontend | `frontend/app/receptionist/opd/page.tsx` | Quick Follow-Up Button in OPD List | Added 🔄 Quick Follow-Up button to each OPD entry row. Only visible for Completed visits within 30 days. | UX Solution 2: One-click follow-up action in the OPD queue list. |
| 2026-01-27 | Backend | `backend/controllers/opdController.js` | OPD API Patient Fields | Added `p.age`, `p.gender`, `p.blood_group` to `getOpdEntries()` SELECT query. | Fix: Follow-Up form now pre-fills all patient fields correctly. |
| 2026-01-27 | Frontend | `frontend/app/receptionist/opd/page.tsx` | Button Visibility Fix | Made Quick Follow-Up button more visible with amber background, white text, and "Follow-Up" label. Fixed table column widths to total 100%. | User feedback: Button was too small and table alignment was off. |

---

## How to Use This Log

When making changes to the HMS system, add a new row to the table above with:
- **Date**: Date of the change (YYYY-MM-DD format)
- **Component**: `Frontend` or `Backend`
- **File Name**: Relative path to the modified file
- **Edit Name**: Short descriptive name for the change
- **Overview**: Brief description of what was changed
- **Reason**: Why this change was necessary

---

*Last Updated: 2026-01-23*
