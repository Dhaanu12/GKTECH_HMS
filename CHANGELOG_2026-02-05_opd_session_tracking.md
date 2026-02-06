# Changelog - February 5, 2026

## OPD Session Tracking for Vitals, Clinical Notes, Lab Orders & Documents

### Summary
Enhanced the nurse module to support linking vitals and clinical notes to specific OPD sessions, with filtering capabilities across all patient data tabs. Added consultation history view with prescription details and download functionality.

---

## Backend Changes

### Models Updated

#### `backend/models/PatientVitals.js`
- Added `LEFT JOIN` with `opd_entries` and `doctors` tables
- `getPatientVitals()` now returns OPD session details:
  - `opd_number`
  - `opd_visit_date`
  - `opd_visit_type`
  - `opd_doctor_name`
- Added `opdId` filter parameter for filtering vitals by specific OPD session
- `getLatestVitals()` also returns OPD session details

#### `backend/models/ClinicalNotes.js`
- Added `LEFT JOIN` with `opd_entries` and `doctors` tables
- `getPatientNotes()` now returns OPD session details
- Added filter parameters:
  - `opdId` - filter by specific OPD session
  - `startDate` - filter records from this date
  - `endDate` - filter records until this date
- `getNoteById()` also returns OPD session details

### Controllers Updated

#### `backend/controllers/vitalsController.js`
- `getPatientVitals()` now accepts `opdId` query parameter
- Passes filter to model for server-side filtering

#### `backend/controllers/clinicalNotesController.js`
- `getPatientNotes()` now accepts query parameters:
  - `opdId`
  - `startDate`
  - `endDate`
- Passes filters to model for server-side filtering

### Routes Updated

#### `backend/routes/consultationRoutes.js`
- Added `NURSE` role to `GET /api/consultations/patient/:patientId` endpoint
- Nurses can now view patient consultation history

---

## Frontend Changes

### Patient Profile Page (`frontend/app/nurse/patients/[id]/page.tsx`)

#### New State Variables
- `selectedOpdId` - tracks selected OPD session for filtering
- `filterStartDate` - tracks start date filter
- `filterEndDate` - tracks end date filter
- `consultationHistory` - stores patient consultation records

#### New Features

1. **Consultations Tab**
   - New tab displaying patient consultation history
   - Shows doctor name, specialization, visit date
   - Displays chief complaint, diagnosis, notes
   - Shows medications and labs ordered
   - Highlights follow-up dates
   - Visual status indicators (Completed, In-Progress)

2. **Filter Controls (Vitals & Notes Tabs)**
   - OPD session dropdown (filtered to patient, ordered most recent first)
   - Start date picker
   - End date picker
   - "Clear Filters" button

3. **OPD Session Badges**
   - Vitals records now display OPD number badge when linked
   - Clinical notes display OPD number badge when linked

4. **Record Vitals Modal**
   - New "Link to OPD Session" dropdown
   - Defaults to most recent OPD session
   - Can select "No OPD Session (General)" for unlinked vitals

5. **Add Note Modal**
   - New "Link to OPD Session" dropdown
   - Same behavior as vitals modal

---

## Documentation Updated

### `backend/database/NURSE_MODULE_README.md`
- Added section on OPD Session Filtering
- Documented query parameters (`opdId`, `startDate`, `endDate`)
- Added example API requests
- Documented response data structure with OPD details

---

## API Query Parameters

### GET `/api/vitals/patient/:patientId`
| Parameter | Type | Description |
|-----------|------|-------------|
| `opdId` | integer | Filter by specific OPD session |
| `startDate` | date | Filter records from this date |
| `endDate` | date | Filter records until this date |

### GET `/api/clinical-notes/patient/:patientId`
| Parameter | Type | Description |
|-----------|------|-------------|
| `opdId` | integer | Filter by specific OPD session |
| `startDate` | date | Filter records from this date |
| `endDate` | date | Filter records until this date |
| `noteType` | string | Filter by note type |

---

## Example Usage

### Filter vitals by OPD session
```
GET /api/vitals/patient/5?opdId=42
```

### Filter notes by date range
```
GET /api/clinical-notes/patient/5?startDate=2025-01-01&endDate=2025-06-30
```

### Combined filters
```
GET /api/vitals/patient/5?opdId=42&startDate=2025-01-01&endDate=2025-03-31
```

---

## Additional Changes (Lab Orders, Documents, Consultations)

### Lab Orders Model (`backend/models/LabOrder.js`)
- Added `LEFT JOIN` with `opd_entries` to include `opd_number` and `opd_visit_date`
- Added `opdId` filter parameter in `findByPatient()` method

### Lab Orders Controller (`backend/controllers/labOrderController.js`)
- `getOrdersByPatient()` now accepts `opdId` query parameter

### Patient Documents Model (`backend/models/PatientDocument.js`)
- Added `LEFT JOIN` with `opd_entries` through `lab_orders` to include OPD details
- Added `opdId` filter parameter in `findByPatient()` method

### Patient Documents Controller (`backend/controllers/patientDocumentController.js`)
- `getPatientDocuments()` now accepts `opdId` query parameter

### Frontend Enhancements

#### Consultation History Display
- Properly displays `prescription_medications` from the prescription table
- Shows individual medication details (name, dosage, frequency, duration)
- **Print-to-PDF functionality** for consultations (matches doctor view format)
  - Opens styled HTML popup with hospital header, doctor info, patient info
  - Includes vitals, clinical notes, diagnosis, lab orders, prescription medications
  - Shows follow-up date and doctor signature area
  - Uses browser's `window.print()` for PDF generation
  - Professional formatting with proper sections and tables
- Button tooltip changed from "Download Consultation" to "Print Consultation"

#### Lab Orders Tab
- Added OPD session filter dropdown
- Shows OPD number badge on each lab order
- Dynamic "no results" message based on filter state

#### Documents Tab  
- Added OPD session filter dropdown
- Shows OPD number badge on each document (when linked via lab order)
- Dynamic "no results" message based on filter state

---

## Lab Order Status History UI

### New Feature: View History Modal (`frontend/app/nurse/lab-schedule/page.tsx`)

Added a new "View History" button and modal to display the complete status history timeline for lab orders.

#### Features:
- **History button** (clock icon) on every lab order card
- **Timeline modal** showing all status changes:
  - Visual timeline with colored status dots
  - Previous → New status transitions
  - Timestamp (date and time)
  - Who made the change (username)
  - Optional notes for each change
- **Status-specific icons and colors**:
  - Ordered: Blue (Clock icon)
  - In-Progress: Amber (Play icon)
  - Completed: Green (Checkmark icon)
  - Cancelled: Gray (X icon)

#### Implementation:
- Added `StatusHistoryEntry` interface
- Added `showHistoryModal` state
- Created `ViewHistoryModal` component that fetches from `GET /api/lab-orders/:id`
- Added `History` icon to imports

---

## Files Changed

| File | Change Type |
|------|-------------|
| `backend/models/PatientVitals.js` | Modified |
| `backend/models/ClinicalNotes.js` | Modified |
| `backend/models/LabOrder.js` | Modified |
| `backend/models/PatientDocument.js` | Modified |
| `backend/controllers/vitalsController.js` | Modified |
| `backend/controllers/clinicalNotesController.js` | Modified |
| `backend/controllers/labOrderController.js` | Modified |
| `backend/controllers/patientDocumentController.js` | Modified |
| `backend/routes/consultationRoutes.js` | Modified |
| `frontend/app/nurse/patients/[id]/page.tsx` | Modified |
| `frontend/app/nurse/lab-schedule/page.tsx` | Modified |
| `backend/database/NURSE_MODULE_README.md` | Modified |
