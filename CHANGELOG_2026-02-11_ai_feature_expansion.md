# AI Feature Expansion for Nurse & Receptionist Modules — 2026-02-11

## Change Summary

Expanded the CareNex AI assistant from 10 database tools to 38, added write actions with a user confirmation flow, wired AI context into all receptionist pages, and added inline AI features across both nurse and receptionist modules.

---

## Backend Changes

### 1. 28 New AI Agent Tool Definitions

**File:** `backend/services/ai/tools/toolDefinitions.js`

Added 19 read-only tools and 9 write tools. Total tool count: 10 → 38.

**New read-only tools:**

| Tool | Endpoint | Purpose |
|------|----------|---------|
| `getFollowUps` | `GET /follow-ups/due` | Overdue, due today, and upcoming follow-ups |
| `getPatientFollowUp` | `GET /follow-ups/patient/:id` | Follow-up status for a specific patient |
| `getPendingBills` | `GET /billing/pending-clearances` | All pending payment items |
| `getBillDetails` | `GET /billing/:id` | Single bill breakdown |
| `getPendingBillItems` | `GET /billing/pending/:opdId` | Pending items for an OPD visit |
| `getDoctorAvailability` | `GET /doctor-schedules/available` | Doctors available on a date |
| `getDoctorSchedule` | `GET /doctor-schedules/doctor/:id/:branch` | Specific doctor's timetable |
| `getBranchDoctors` | `GET /doctors/my-branch` | All doctors at the branch |
| `getDepartments` | `GET /departments/hospital` | Department list |
| `getLatestVitals` | `GET /vitals/patient/:id/latest` | Most recent vital signs only |
| `getVitalsStats` | `GET /vitals/patient/:id/stats` | Vitals trends and statistics |
| `searchNotes` | `GET /clinical-notes/patient/:id/search` | Keyword search within notes |
| `getAllLabOrders` | `GET /lab-orders` | Branch-wide lab orders with filters |
| `getLabOrderDetail` | `GET /lab-orders/:id` | Single lab order with results |
| `searchServices` | `GET /services/search` | Hospital services and pricing |
| `getPatientDocuments` | `GET /patient-documents/patient/:id` | Uploaded documents list |
| `getMlcDetails` | `GET /mlc/opd/:opdId` | Medico-legal case info |
| `checkDuplicateOPD` | `GET /opd/check-duplicate` | Prevent duplicate OPD entries |
| `checkDuplicateAppointment` | `GET /appointments/check-duplicate` | Prevent double-booking |

**New write tools (require user confirmation):**

| Tool | Endpoint | Purpose |
|------|----------|---------|
| `createAppointment` | `POST /appointments` | Book a new appointment |
| `updateAppointmentStatus` | `PATCH /appointments/:id/status` | Confirm, cancel, mark no-show |
| `rescheduleAppointment` | `PATCH /appointments/:id/reschedule` | Change date/time |
| `createClinicalNote` | `POST /clinical-notes` | Add a clinical note |
| `pinNote` | `PATCH /clinical-notes/:id/pin` | Toggle pin on a note |
| `updateLabOrderStatus` | `PATCH /lab-orders/:id/status` | Mark in-progress/completed |
| `assignLabOrder` | `PATCH /lab-orders/:id/assign` | Assign nurse to a lab order |
| `updateOpdPayment` | `PATCH /opd/:id/payment` | Mark payment received |
| `updateOpdStatus` | `PATCH /opd/:id/status` | Update OPD visit status |

### 2. Tool Executor Implementations

**File:** `backend/services/ai/tools/toolExecutor.js`

- Added 19 executor functions for the new read-only tools, each calling the appropriate internal API with the user's auth token and formatting the response with IST timestamps.
- Added a `createWriteProposal()` function that returns `{ requiresConfirmation: true, action, label, params, summary }` instead of executing write operations directly. This is the backend half of the confirmation flow.

### 3. Confirmation Flow in Agent Chat

**File:** `backend/services/aiService.js`

- Modified `agentChat()` to detect when a tool result contains `requiresConfirmation: true`.
- When detected, the AI generates a description of the proposed action and appends a `[CONFIRM_ACTION]...[/CONFIRM_ACTION]` payload to the response message.
- The tool execution loop breaks after a confirmation proposal so no further tools run until the user decides.

**Changes to `summarizePatient()`:**
- Rewrote the prompt to send compact text (`BP 122/80, HR 75, Temp 99°F`) instead of raw JSON dumps.
- Prompt now explicitly requests 3-4 lines max to reduce token usage.

**Changes to `suggestNotes()`:**
- Added `generate` action that instructs the AI to create a note from patient context rather than improving existing text.
- Both `generate` and `improve` actions now receive full patient context (vitals, labs, notes, chief complaint).

### 4. Execute Action Endpoint

**File:** `backend/routes/aiRoutes.js`

Added `POST /api/ai/execute-action` — receives a confirmed action type and parameters, validates permissions, calls the real API endpoint, and returns success/failure. Handles all 9 write tool types.

### 5. System Prompt Rewrite

**File:** `backend/services/ai/systemPrompts.js`

Rewrote the general system prompt to:
- List all 38 tools by category (patient, scheduling, OPD/billing, lab, MLC).
- Explain the write tool confirmation flow.
- Enforce role awareness (nurse vs. receptionist workflows).
- Enforce clinical safety (never diagnose, never recommend medications).
- Require IST timestamps and concise responses.

---

## Frontend Changes

### 6. Markdown Rendering Fix

**File:** `frontend/components/ai/FloatingAIAssistant.tsx`

Replaced CSS-dependent `.ai-markdown` rendering with explicit `ReactMarkdown` component overrides. Added styled components for `p`, `strong`, `em`, `ul`, `ol`, `li`, `h1`-`h4`, `code`, `pre`, `blockquote`, `a`, `hr`, `table`, `th`, `td` — each with inline Tailwind classes so rendering works regardless of plugin availability.

### 7. Confirmation Flow UI

**File:** `frontend/components/ai/AIContextProvider.tsx`

- Added `PendingAction` interface and `pendingAction` state.
- Added `confirmAction()` — calls `POST /api/ai/execute-action` and shows success/failure.
- Added `cancelAction()` — clears the pending action and notifies the user.
- Updated `sendMessageStreaming()` to detect `[CONFIRM_ACTION]...[/CONFIRM_ACTION]` payloads in streamed responses and extract them into `pendingAction` state.

**File:** `frontend/components/ai/FloatingAIAssistant.tsx`

- Added a confirmation card (amber background, action summary, Cancel/Confirm buttons) that renders when `pendingAction` is set.

**File:** `frontend/components/ai/index.ts`

- Exported `PendingAction` type.

### 8. Receptionist Page Context (6 pages)

Added `useAI()` and `setPageContext()` calls to every receptionist page so the floating assistant knows what the user is looking at:

| Page | Context includes |
|------|-----------------|
| `receptionist/dashboard/page.tsx` | Queue count, visits, payments, follow-ups |
| `receptionist/opd/page.tsx` | Visit stats, OPD entries, date range |
| `receptionist/billing/page.tsx` | Pending/paid/cancelled counts, totals |
| `receptionist/patients/page.tsx` | Patient count, search filter |
| `receptionist/patients/[id]/page.tsx` | Demographics, vitals, OPD history, labs, notes |
| `receptionist/appointments/page.tsx` | Counts by status, doctors, departments |

### 9. Receptionist Quick Actions

**File:** `frontend/components/ai/FloatingAIAssistant.tsx`

Added page-specific quick action buttons:
- **Billing:** "Pending summary", "Overdue bills"
- **OPD:** "Patient lookup", "Today's OPD"
- **Appointments:** "Doctor availability" (added alongside existing "Schedule optimization")

### 10. Receptionist Dashboard — AI Insights Card

**File:** `frontend/app/receptionist/dashboard/page.tsx`

- Auto-calls `getDashboardInsights()` after stats load with queue count, visits, payments, follow-ups, appointments, and OPD counts.
- Displays result in an `AIInsightCard` at the top of the dashboard. Dismissable.

### 11. OPD — AI Chief Complaint Suggestions

**File:** `frontend/app/receptionist/opd/page.tsx`

- When a patient is selected for OPD registration, sends a focused AI prompt with the patient's ID to suggest 3-5 relevant chief complaints based on their history.
- Renders AI suggestions as purple-tinted chips above the existing static suggestions.
- Falls back to static suggestions if AI is unavailable.

### 12. Appointments — AI Scheduling on New Bookings

**File:** `frontend/app/receptionist/appointments/page.tsx`

- Added a "Suggest best slot" button in the new appointment modal (step 2, above the time grid).
- Calls `optimizeSchedule()` with the selected doctor, date, patient name, and available slots.
- Displays the AI suggestion in a purple card above the time slot grid.

### 13. Billing — Pending Payment Summary

**File:** `frontend/app/receptionist/billing/page.tsx`

- Added a summary banner on the pending tab showing total pending count, total amount, and count of bills overdue by 3+ days.
- Computed client-side from already-loaded data (no AI API call needed).

### 14. Nurse Dashboard — Shift Summary

**File:** `frontend/app/nurse/dashboard/page.tsx`

- Auto-calls `getDashboardInsights()` with shift, task counts, urgent orders, and OPD count.
- Displays an `AIInsightCard` with warning type if urgent orders exist.
- Dismissable.

### 15. Nurse Patient Detail — Auto-Generated Patient Summary

**File:** `frontend/app/nurse/patients/[id]/page.tsx`

- Summary auto-generates on page load after patient data finishes loading.
- Cached in `sessionStorage` keyed by patient ID with a fingerprint built from data counts and timestamps.
- Only regenerates when data actually changes (new vital, note, lab order, etc.).
- Backend prompt sends compact text instead of JSON, requests 3-4 lines max.
- Manual "Refresh Summary" button clears cache and forces regeneration.
- Fixed MRN field (`patient.mrn` → `patient.mrn_number || patient.mrn`).

**Summary card redesign:**
- Replaced plain `AIInsightCard` with a structured card showing patient name and MRN in the header.
- Each line of the AI response is parsed and color-coded: amber for warnings/concerns, blue for action items, green for normal values, bold for headers.

### 16. Nurse Clinical Notes — AI Suggest with Patient Context

**File:** `frontend/app/nurse/patients/[id]/page.tsx`

- The `AddNoteModal` now receives `patientContext` prop containing age, gender, blood group, latest vitals, recent lab orders (top 3), recent clinical notes (top 3), and chief complaint.
- The "AI Suggest" button builds a rich prompt from this data:
  - **Generate mode** (empty textarea): creates a note from patient context.
  - **Improve mode** (has content): refines the nurse's draft using patient context.
- Backend `suggestNotes()` updated with a dedicated `generate` action prompt.

---

## Summary of Scope

- **Backend files modified:** 5
- **Frontend files modified:** 12
- **New components:** Confirmation card (inline in FloatingAIAssistant)
- **New backend routes:** 1 (`POST /api/ai/execute-action`)
- **New tool definitions:** 28 (19 read + 9 write)
- **Tool count:** 10 → 38
