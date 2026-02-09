# Changelog - February 6, 2026

## Overview
Documentation of changes and improvements made to the HMS system on February 6, 2026.

---

## Issues Log

| Issue ID | Description | Status | Files Modified |
|----------|-------------|--------|----------------|
| 22       | Unified Patient Profile & Doctor Tabs | Completed | `components/patient/PatientProfile.tsx`, `doctor/.../page.tsx`, `nurse/.../page.tsx` |
| 23       | Medication Input Layout Fix | Completed | `doctor/patients/[id]/page.tsx` |

### Issue 22: Unified Patient Profile & Doctor Tabs
- **Objective**: Create a consistent Patient Profile view for both Doctors and Nurses, and add a tabbed interface for Doctors.
- **Changes**:
  - Extracted Nurse's Patient Details logic into a reusable `PatientProfile` component (`frontend/components/patient/PatientProfile.tsx`).
  - Implemented "Current Consultation" and "Patient Profile & History" tabs in the Doctor's module.
  - Integrated the shared `PatientProfile` component into the Doctor's "Patient Profile" tab.
  - Refactored `frontend/app/nurse/patients/[id]/page.tsx` to use the shared component, ensuring zero code duplication.

### Issue 23: Medication Input Layout Fix
- **Objective**: Fix UI overlap in the Medication Input row (Doctor Consultation), ensuring compatibility with all screen sizes and zoom levels.
- **Changes**:
  - Refactored `frontend/app/doctor/patients/[id]/page.tsx` "Prescription Pad" input to use a robust **2-row layout**.
  - Row 1: Medicine Name (66%) and Dose (33%).
  - Row 2: Frequency checkboxes and Food Timing controls (Flexbox with wrapping support).
  - This structure prevents overlap even on narrow screens or high zoom settings.

### Issue 25: Searchable Diagnosis
- **Objective**: Make Diagnosis field searchable like Lab Orders.
- **Changes**:
  - Implemented a "Search & Add" interface above the text area in `frontend/app/doctor/patients/[id]/page.tsx`.
  - Added a predefined list of **50+ common diagnoses** (e.g., Viral Fever, Diabetes, Hypertension) for autocomplete.
  - Selecting a diagnosis automatically appends it to the detailed diagnosis text area, preserving free-text capabilities.

### Issue 26: Diagnosis UI Refactor (Lab Orders Style)
- **Objective**: Replace Diagnosis Textarea with a "List View" interface identical to Lab Orders.
- **Changes**:
  - Removed "Enter Diagnosis" textarea.
  - Implemented Chip-based list view for diagnoses.
  - Users can search/type and add diagnoses using the input bar and (+) button.
  - Multiple diagnoses are displayed as a list and stored as a comma-separated string.

### Issue 27: Conditional Pathology Field
- **Objective**: Capture Diagnostic Center info only when a Diagnosis is provided.
- **Changes**:
  - Added a "Pathology/Lab (Diagnostic center)" input field to the Diagnosis section.
  - This field is **conditionally rendered**, appearing only after a diagnosis is added to the list.
  - UI only implementation (frontend state) as requested.

### Issue 28: Revert Diagnosis UI (Simple Textare)
- **Objective**: Revert Diagnosis input to a simple Textarea (as per user request and screenshot).
- **Changes**:
  - Removed "Lab Orders Style" list view and search bar.
  - Restored original Textarea with Sparkles icon.
  - Retained the conditional "Pathology/Lab" field below the textarea.

### Issue 29: Nurse MLC View & Print
- **Objective**: Allow Nurses to view and print MLC forms (but not edit) and highlight MLC cases in the header.
- **Changes**:
  - **Status Badge**: Added "MLC CASE" badge to `PatientProfile` header (visible to both Doctor/Nurse).
  - **View Access**: Added "MLC Form" button for both roles. Opens a **read-only** modal with "Print" option.
  - **Backend**: Updated `mlcRoutes.js` to authorize `NURSE` role for `GET /mlc/opd/:id`.
  - **Print Format**: Implemented a printable HTML template for the MLC form.

### Issue 30: UI Polish - Doctor Header & MLC Visibility
- **Objective**: Fix incorrect header title and cleanup UI for Doctors.
- **Changes**:
  - **Doctor Header**: Changed "Dashboard" to "Patients" in the top bar when viewing Patient Details.
  - **Patient Profile**: Hid the "MLC Form" button for Doctors (since they have the edit form in Consultation tab). It remains visible for Nurses.

### Issue 31: MLC Robustness & Fixes
- **Objective**: Resolve access and visibility issues for Nurse MLC view.
- **Changes**:
  - **Backend Query**: Updated `getMlcDetails` to use `LEFT JOIN` for linked tables (doctors, patients), ensuring MLC forms are retrievable even if linked records are incomplete.
  - **Frontend Handling**: Enhanced `handleViewMlc` in `PatientProfile` to correctly unwrap the nested data structure from the API.
  - **Cache Control**: Implemented cache-busting and `no-cache` headers to prevent stale 403/Empty responses.
  - **Debugging**: Added specific alerts for missing data or permission errors.
