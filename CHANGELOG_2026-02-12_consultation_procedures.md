# Changelog: Consultation Procedures Implementation

## Date: 2026-02-12

### Backend Changes (`backend/`)
- **Database Schema**:
    - Added `procedures` column (TEXT) to `consultation_outcomes` and `prescriptions` tables via SQL migration script (`backend/database/alter_consultation_procedures.sql`).
- **Consultation Controller (`backend/controllers/consultationController.js`)**:
    - Updated `saveDraft` function:
        - Destructured `procedures` from request body.
        - Included `procedures` in the SQL `UPDATE` and `INSERT` queries for `consultation_outcomes`.
    - Updated `completeConsultation` function:
        - Destructured `procedures` from request body.
        - Included `procedures` in the SQL `INSERT` query for `prescriptions`.
        - Included `procedures` in the SQL `INSERT` query for `consultation_outcomes`.
    - Fixed linting errors related to duplicate variable declarations (`referral_doctor_id`, `referral_notes`).

### Frontend Changes (`frontend/app/doctor/patients/[id]/page.tsx`)
- **State Management**:
    - Added `procedures` field to `consultationData` state.
    - Added `procedureSearchQuery` state for procedure input.
    - Implemented `addProcedure` and `removeProcedure` helper functions.
- **UI Redesign**:
    - Restructured the "Clinical Scribe" section into a responsive 2-column layout (Left: Notes, Right: Diagnosis + Procedures + Labs).
    - **Left Column**: 
        - Dedicated full-height section for "Clinical Notes & Observations".
    - **Right Column**:
        - Stacked layout containing:
            1. **Diagnosis**: Search and list view (preserved existing functionality).
            2. **Procedures**: New section for adding/removing procedures (similar to Diagnosis UI).
            3. **Labs**: Search and list view for lab orders (preserved existing functionality).
    - Added "Procedures" section with input field, add button, and list display with remove functionality.
    - Ensured consistent styling with existing improved UI card designs.
