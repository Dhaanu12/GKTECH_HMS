# CareNex AI - Project Workflows

> **Comprehensive Role-Based Workflow Documentation**
> 
> This document captures the complete functional workflows for each user role in the CareNex AI Hospital Management System. Each section includes UI screenshots, detailed element analysis, and step-by-step flow explanations.

---

## Table of Contents

1. [Role 1: Receptionist](#role-1-receptionist)
   - [1.1 Dashboard Overview](#11-dashboard-overview)
   - [1.2 OPD Entry Management](#12-opd-entry-management)
   - [1.3 New OPD Registration Flow](#13-new-opd-registration-flow)
   - [1.4 Patient Records Management](#14-patient-records-management)
   - [1.5 Patient Profile View](#15-patient-profile-view)
   - [1.6 Appointments Management](#16-appointments-management)
   - [1.7 New Appointment Scheduling](#17-new-appointment-scheduling)
   - [1.8 Analytics & Reports](#18-analytics--reports)

---

# Role 1: Receptionist

## Role Overview

| Attribute | Description |
|-----------|-------------|
| **Role Code** | `RECEPTIONIST` |
| **Primary Function** | Front desk operations, patient registration, OPD management, appointment scheduling |
| **Access Level** | Branch-level access to patient and appointment data |
| **Key Responsibilities** | Register new OPD visits, manage patient records, search patient history, view/schedule appointments |

### Role Intent & Outcomes

**Intent**: The Receptionist serves as the first point of contact for patients visiting the hospital. They handle all front-desk operations including registering walk-in patients, scheduling appointments, and maintaining accurate patient records.

**Expected Outcomes**:
- Efficient patient check-in and registration
- Accurate OPD token generation and queue management
- Quick patient lookup and record retrieval
- Seamless appointment scheduling with doctors

---

## 1.1 Dashboard Overview

### Screenshot

![Receptionist Dashboard](C:/Users/Punith/.gemini/antigravity/brain/d867fceb-746d-451a-9b84-f39a5e658418/uploaded_image_0_1769133297499.png)

### Screen Purpose
The Dashboard provides the receptionist with an at-a-glance view of daily operations, quick access to common tasks, and system health status.

### UI Element Analysis

#### Header Section

| Element | Type | Description | Function |
|---------|------|-------------|----------|
| CareNex AI Logo | Image + Text | Brand identity with "RECEPTION" label | Navigation to home |
| "P" Badge | Avatar | User role indicator (Purple circle) | Visual role identification |
| "Dashboard" | Page Title | Current page indicator | - |
| Hospital Name | Text | "Care 24 Medical Centre & Hospital" | Context - current facility |
| User Avatar | Circle + Name | "Geetha" with "G" avatar | User identification |
| Logout Button | Icon + Text | Arrow icon with "Logout" | Session termination |

#### Sidebar Navigation

| Menu Item | Icon | Route | Status |
|-----------|------|-------|--------|
| Dashboard | Grid icon | `/receptionist/dashboard` | **Active** (highlighted blue) |
| OPD Entry | Document icon | `/receptionist/opd` | Available |
| Patients | Users icon | `/receptionist/patients` | Available |
| Appointments | Calendar icon | `/receptionist/appointments` | Available |
| Reports | Chart icon | `/receptionist/reports` | Available |

#### Welcome Section

| Element | Content | Purpose |
|---------|---------|---------|
| Greeting | "Welcome back, geetha" | Personalized user experience |
| Live Update Badge | "Live Update: **0 Registrations** processed today" | Real-time activity indicator with green dot |
| Date Display | "Friday, January 23, 2026" | Current date context |

#### Statistics Cards (4 Cards)

| Card | Value | Label | Badge | Color Accent |
|------|-------|-------|-------|--------------|
| Card 1 | **0** | "Today's OPD Visits" | "Today" | Pink/Red icon |
| Card 2 | **0** | "New Patients" | "Today" | Yellow icon |
| Card 3 | **0** | "Today's Appointments" | "Today" | Green icon |
| Card 4 | **0** | "Pending Visits" | "Today" | Orange icon |

**Technical Mapping**: These cards fetch data from `/api/receptionist/stats` endpoint, displaying counts for the current day filtered by `branch_id`.

#### Quick Actions Section

| Action Card | Icon | Title | Subtitle | Navigation Target |
|-------------|------|-------|----------|-------------------|
| New OPD Entry | Document (pink bg) | "New OPD Entry" | "Register patient visit" | Opens OPD registration modal |
| Patient Records | Users (purple bg) | "Patient Records" | "Manage details" | `/receptionist/patients` |
| Appointments | Calendar (pink bg) | "Appointments" | "Schedule doctors" | `/receptionist/appointments` |

#### System Status Panel

| Element | Content | Visual |
|---------|---------|--------|
| Status Icon | Heartbeat/Activity icon | Pink circular icon |
| Title | "System Status" | Bold heading |
| Message | "All systems are running smoothly. No critical alerts at this time." | Status text |
| Server Load Indicator | "SERVER LOAD" with "OPTIMAL" label | Green progress bar |

### Workflow Correlation

```
Dashboard Load Flow:
1. User authenticates → redirected to /receptionist/dashboard
2. useEffect fetches stats from API
3. Stats cards populated with today's counts
4. Quick Actions enable navigation to work areas
5. System Status shows backend health
```

---

## 1.2 OPD Entry Management

### Screenshot

![OPD Entry Panel](C:/Users/Punith/.gemini/antigravity/brain/d867fceb-746d-451a-9b84-f39a5e658418/uploaded_image_1_1769133297499.png)

### Screen Purpose
The OPD Entry panel is the primary workspace for managing outpatient department registrations. It displays all OPD visits with their current status, allows searching, and enables new registrations.

### UI Element Analysis

#### Page Header

| Element | Content | Purpose |
|---------|---------|---------|
| Page Title | "OPD Entry" | Current section identifier |
| Welcome Message | "Welcome back, Reception! 👋" | Friendly greeting with wave emoji |
| New Entry Button | "+ New Entry" (Blue button) | **Primary Action** - Opens registration modal |

#### Statistics Dashboard (5 Cards)

| Card | Value | Label | Icon | Color |
|------|-------|-------|------|-------|
| Total Visits | **4** | "TOTAL VISITS" | Person icon | Gray |
| Waiting | **2** | "WAITING" | Clock icon | Yellow/Orange |
| Completed | **2** | "COMPLETED" | Checkmark icon | Green |
| Active Doctors | **1** | "ACTIVE DOCTORS" | Doctor icon | Blue |

**Note**: Card 5 appears to show Active Doctors count, indicating how many doctors are currently seeing patients.

#### Search Bar

| Element | Type | Placeholder | Additional |
|---------|------|-------------|------------|
| Search Input | Text field | "Search by Patient, Doctor, Token, MRN, or OPD Number..." | Full-width |
| Search Button | Button | "Search" (Blue) | Triggers search |

**Search Capabilities**:
- Patient name lookup
- Doctor name filter
- Token number search (e.g., "T-2")
- MRN (Medical Record Number) search
- OPD number search

#### OPD Queue Table

**Table Headers**:

| Column | Description | Sortable |
|--------|-------------|----------|
| TOKEN | Unique OPD token identifier | Yes |
| PATIENT DETAILS | Name with avatar | Yes |
| ASSIGNED DOCTOR | Doctor name with specialty | Yes |
| TIMINGS | Appointment/visit time | Yes |
| STATUS | Visit status badges | Yes |
| PAYMENT | Amount and payment status | Yes |

**Sample Data Rows**:

| Token | Patient | Doctor | Time | Status | Payment |
|-------|---------|--------|------|--------|---------|
| **T-2** (OPD: 20260122-0214) | **Meera K** (M avatar) | Dr. Anju S - DERMATOLOGIST | 12:45, Jan 22 | `Appointment` + `Completed` | ₹100.00 **PENDING** (red) |
| **T-1** (OPD: 20260122-28PN) | **Punith S** (P avatar) | Dr. Anju S - DERMATOLOGIST | 12:23, Jan 22 | `Appointment` + `Completed` | ₹400.00 **PENDING** (red) |
| **T-345** (OPD: 20260118-2106) | **Gopika S** (G avatar) | Dr. Anju S - DERMATOLOGIST | 13:07, Jan 20 | `Follow-up` + `Registered` | ₹100.00 **PAID** (green) |
| **T-205** | **Deepika S** (D avatar) | Dr. Anju S | 12:58 | - | ₹400.00 |

#### Token Format Analysis

```
Token Structure: T-{sequence_number}
OPD Number Format: {YYYYMMDD}-{4-char-alphanumeric}

Example:
- Token: T-2
- OPD: 20260122-0214 (January 22, 2026, sequence 0214)
```

#### Status Badges

| Badge | Color | Meaning |
|-------|-------|---------|
| `Appointment` | Blue outline | Visit was scheduled as appointment |
| `Follow-up` | Yellow/amber | Return visit for same condition |
| `Completed` | Green filled | Consultation finished |
| `Registered` | Gray/neutral | Checked in, waiting for consultation |

#### Payment Status

| Status | Color | Meaning |
|--------|-------|---------|
| **PENDING** | Red text | Payment not yet received |
| **PAID** | Green text | Payment completed |

### Workflow: Viewing OPD Queue

```
User Action → System Response → Outcome
─────────────────────────────────────────
1. Navigate to OPD Entry → Fetch /api/opd/visits → Display table
2. View statistics → Aggregate data → Show counts
3. Search patient → Filter query → Update table
4. Click row → Navigate → Patient details
```

---

## 1.3 New OPD Registration Flow

### Screenshot

![New OPD Entry Form](C:/Users/Punith/.gemini/antigravity/brain/d867fceb-746d-451a-9b84-f39a5e658418/uploaded_image_2_1769133297499.png)

### Screen Purpose
Modal form for registering a new OPD visit. Captures patient demographics, visit details, and payment information in a single form.

### UI Element Analysis

#### Modal Structure

| Element | Type | Description |
|---------|------|-------------|
| Title | Header | "+ New OPD Entry" with blue plus icon |
| Close Button | Icon | "×" to dismiss modal |
| Form Container | Card | White glassmorphic modal with shadow |

#### Section 1: PATIENT DETAILS

| Field | Type | Required | Placeholder/Default | Validation |
|-------|------|----------|---------------------|------------|
| Name | Text Input | ✅ Yes* | "e.g. John Doe" | Non-empty string |
| Age | Number Input | ✅ Yes* | Empty | Positive integer |
| Gender | Dropdown | ✅ Yes* | "Select" | Must select option |
| Phone Number | Text Input | ✅ Yes* | "10-digit number" | 10-digit validation |
| Blood Group | Dropdown | No | "Unknown" | Optional selection |

**Gender Options**: Male, Female, Other
**Blood Group Options**: A+, A-, B+, B-, AB+, AB-, O+, O-, Unknown

#### Section 2: VISIT INFORMATION

| Field | Type | Required | Default Value | Notes |
|-------|------|----------|---------------|-------|
| Mark as Medical Legal Case (MLC) | Checkbox | No | Unchecked | **Highlighted in pink/red background** - Legal cases requiring special documentation |
| Visit Type | Dropdown | No | "Walk-in" | Options: Walk-in, Appointment, Follow-up, Emergency |
| Date | Date Picker | No | Current date (23-01-2026) | Calendar icon |
| Time | Time Picker | No | Current time (07:21) | Clock icon |
| Assign Doctor | Dropdown | ✅ Yes* | "Select Doctor" | Populated from available doctors |

**MLC (Medical Legal Case) Flag**: When checked, this marks the visit as a legal case, which may require additional documentation and has special reporting requirements.

#### Section 3: PAYMENT DETAILS

| Field | Type | Default | Options |
|-------|------|---------|---------|
| Status | Dropdown | "Pending" | Pending, Paid |
| Method | Dropdown | "Cash" | Cash, Card, UPI, Insurance |
| TOTAL FEE | Display | ₹0 | Auto-calculated based on doctor/service |

#### Action Buttons

| Button | Type | Style | Action |
|--------|------|-------|--------|
| Cancel | Secondary | Gray outline | Close modal without saving |
| Register Visit | Primary | Blue filled | Submit form, create OPD entry |

### Data Flow: OPD Registration

```
Form Submission Flow:
━━━━━━━━━━━━━━━━━━━━━
┌─────────────────┐
│ Fill Patient    │
│ Details         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Add Visit       │
│ Information     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Set Payment     │
│ Details         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Click "Register │────▶│ POST /api/opd   │
│ Visit"          │     │ /register       │
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │ Response:       │
                        │ - Token Number  │
                        │ - Patient ID    │
                        │ - MRN           │
                        └─────────────────┘
```

### API Endpoint Mapping

| Action | Method | Endpoint | Payload |
|--------|--------|----------|---------|
| Register OPD | POST | `/api/opd/register` | `{ patient_name, age, gender, phone, blood_group, visit_type, date, time, doctor_id, is_mlc, payment_status, payment_method }` |

### Outcome
Upon successful submission:
1. New patient record created (if new patient) or existing patient linked
2. OPD visit entry created with unique token
3. Patient assigned to doctor's queue
4. Modal closes, OPD list refreshes
5. Token displayed for patient reference

---

## 1.4 Patient Records Management

### Screenshot

![Patients Panel](C:/Users/Punith/.gemini/antigravity/brain/d867fceb-746d-451a-9b84-f39a5e658418/uploaded_image_3_1769133297499.png)

### Screen Purpose
Central repository for viewing and managing all registered patient records. Enables quick search, status tracking, and profile access.

### UI Element Analysis

#### Page Header

| Element | Content | Purpose |
|---------|---------|---------|
| Page Title | "Patient Records" | Section identifier |
| Subtitle | "Detailed history and management of all registered patients." | Context description |

#### Search & Filter Bar

| Element | Type | Function |
|---------|------|----------|
| Search Input | Text field | "Search by Name, Contact, or MRN..." |
| Search Button | Primary button | Execute search query |
| Filter Icon | Icon button | Funnel icon for advanced filters |

**Search Capabilities**:
- Patient name (partial match)
- Phone number
- MRN (Medical Record Number)

#### Patient Records Table

**Table Headers**:

| Column | Description | Width |
|--------|-------------|-------|
| PATIENT DETAILS | Name, gender, age with avatar | 25% |
| CONTACT | Phone number and N/A for email | 15% |
| IDENTIFIERS | MRN and PAT ID codes | 25% |
| LATEST STATUS | Current patient status badge | 15% |
| ACTIONS | View profile link | 10% |

**Sample Patient Records**:

| Avatar | Name | Demographics | Phone | MRN | Patient ID | Status | Action |
|--------|------|--------------|-------|-----|------------|--------|--------|
| M (blue) | **Meera K** | Female, 25 yrs | 6483683468 | MRN-20260122-0002 | PAT-79841 | `Completed` (green) | View Profile → |
| P (purple) | **Punith S** | Male, 25 yrs | 4828468642 | MRN-20260122-0001 | PAT-42175 | `Completed` (green) | View Profile → |
| G (green) | **Gopika S** | Female, 21 yrs | 9638326362 | MRN-20260118-0121 | PAT-63788 | `Registered` (gray) | View Profile → |
| D (orange) | **Deepika S** | Female, 24 yrs | 4060234046 | MRN-20260126-7400 | PAT-77400 | `In-consultation` (yellow) | View Profile → |

#### Identifier Format Analysis

```
MRN (Medical Record Number):
Format: MRN-{YYYYMMDD}-{4-digit-sequence}
Example: MRN-20260122-0002

Patient ID (Internal):
Format: PAT-{5-digit-number}
Example: PAT-79841
```

#### Status Badges

| Status | Color | Meaning |
|--------|-------|---------|
| `Completed` | Green | All visits completed, no pending actions |
| `Registered` | Gray | Patient registered, no active consultation |
| `In-consultation` | Yellow/Amber | Currently being seen by doctor |

#### Actions Column

| Action | Icon | Function |
|--------|------|----------|
| View Profile | Arrow (→) | Navigate to detailed patient profile page |

### Workflow: Patient Lookup

```
Search Flow:
1. Enter search term (name/phone/MRN)
2. Click "Search" or press Enter
3. API call: GET /api/patients?search={term}&branch_id={id}
4. Table updates with filtered results
5. Click "View Profile" to see full details
```

---

## 1.5 Patient Profile View

### Screenshot

![Patient Profile Screen](C:/Users/Punith/.gemini/antigravity/brain/d867fceb-746d-451a-9b84-f39a5e658418/uploaded_image_4_1769133297499.png)

### Screen Purpose
Comprehensive view of individual patient information including demographics, OPD visit history, and consultation records.

### UI Element Analysis

#### Patient Header Card

| Element | Value | Display |
|---------|-------|---------|
| Avatar | "M" | Blue circular avatar |
| Patient Name | **Meera K** | Large bold text |
| Age/Gender | "25 Yrs / Female" | Below name with person icon |
| MRN | "MRN-20260122-0002" | ID badge icon |
| Contact | 6483683468 | Phone icon |
| Address | "," (empty) | Location icon |
| Blood Group | N/A | Medical icon |

**Header Layout**:
```
┌────────────────────────────────────────────────────────┐
│  [M]  Meera K                                          │
│       ⚲ 25 Yrs / Female  ⊡ MRN-20260122-0002          │
├────────────────────────────────────────────────────────┤
│  📞 CONTACT          📍 ADDRESS       🩸 BLOOD GROUP   │
│  6483683468          ,                N/A              │
└────────────────────────────────────────────────────────┘
```

#### OPD Visit History Section

| Element | Type | Content |
|---------|------|---------|
| Section Icon | Medical/Activity | Pink activity icon |
| Section Title | Header | "OPD Visit History" |

**Visit Entry Details**:

| Field | Value | Position |
|-------|-------|----------|
| Date | 1/22/2026 | Calendar icon |
| Time | 12:45:00 | Clock icon |
| Visit Type | `Appointment` | Blue tag (top right) |
| Status | `Completed` | Green tag (top right) |
| Reason & Symptoms | (empty) | Left section |
| Diagnosis & Vitals | "No diagnosis recorded" | Right section |
| Vitals Fields | spo2:, pulse:, height:, weight:, bp_systolic:, temperature:, bp_diastolic: | Monospace display |
| Attending Doctor | Dr. Anju S (Dermatologist) | Bottom left |
| Location | Care 24 Medical Centre & Hospital - Care 24 Medical Centre & Hospital Main Branch | Bottom right |

**Vitals Data Structure**:
```
spo2: [value]
pulse: [value]
height: [value]
weight: [value]
bp_systolic: [value]
temperature: [value]
bp_diastolic: [value]
```

#### Consultation History Section

| Element | Type | Content |
|---------|------|---------|
| Section Icon | Document | Blue document icon |
| Section Title | Header | "Consultation History" |

**Consultation Entry**:

| Field | Value |
|-------|-------|
| Date | 1/22/2026 |
| Status | `Completed` (green badge) |
| Doctor | Dr. Anju S (Dermatologist) |
| Diagnosis | (empty) |
| Clinical Notes | (empty) |
| Prescription | "No medications prescribed" |
| Next Visit | "Follow-up Required" |

### Data Structure: Patient Profile

```typescript
interface PatientProfile {
  // Demographics
  patient_id: string;        // PAT-79841
  mrn: string;               // MRN-20260122-0002
  name: string;              // Meera K
  age: number;               // 25
  gender: string;            // Female
  contact: string;           // 6483683468
  address: string;           // (optional)
  blood_group: string;       // N/A
  
  // Related Records
  opd_visits: OPDVisit[];
  consultations: Consultation[];
}

interface OPDVisit {
  visit_date: Date;
  visit_time: Time;
  visit_type: 'Appointment' | 'Walk-in' | 'Follow-up';
  status: 'Completed' | 'In-progress' | 'Cancelled';
  reason_symptoms: string;
  diagnosis: string;
  vitals: VitalsRecord;
  doctor: Doctor;
  branch: Branch;
}

interface Consultation {
  date: Date;
  status: string;
  doctor: Doctor;
  diagnosis: string;
  clinical_notes: string;
  prescription: string;
  next_visit: string;
}
```

### Workflow: Viewing Patient Profile

```
Navigation Flow:
1. From Patients list → Click "View Profile"
2. Route: /receptionist/patients/{patient_id}
3. API: GET /api/patients/{patient_id}
4. API: GET /api/patients/{patient_id}/visits
5. API: GET /api/patients/{patient_id}/consultations
6. Render complete profile with all sections
```

---

## 1.6 Appointments Management

### Screenshot

![Appointments Panel](C:/Users/Punith/.gemini/antigravity/brain/d867fceb-746d-451a-9b84-f39a5e658418/uploaded_image_0_1769133763059.png)

### Screen Purpose
The Appointments panel allows the receptionist to view, manage, and schedule patient appointments with doctors. It provides an overview of all scheduled appointments with their current status and available actions.

### UI Element Analysis

#### Page Header

| Element | Content | Purpose |
|---------|---------|----------|
| Page Title | "Appointments" | Section identifier |
| Subtitle | "Schedule and manage patient appointments" | Context description |
| New Appointment Button | "+ New Appointment" (Blue) | **Primary Action** - Opens appointment scheduling modal |

#### Appointments Table

**Table Headers**:

| Column | Description | Width |
|--------|-------------|-------|
| Appointment # | Unique appointment identifier with date | 15% |
| Patient | Patient name with phone number | 15% |
| Doctor | Doctor name with specialty | 15% |
| Date & Time | Scheduled date and time | 15% |
| Reason | Visit reason/symptoms | 15% |
| Status | Appointment status badge | 10% |
| Actions | Available action buttons | 15% |

**Sample Appointment Records**:

| Appointment # | Patient | Doctor | Date & Time | Reason | Status | Actions |
|---------------|---------|--------|-------------|--------|--------|----------|
| **APT-20260122-9395** (1/22/2026) | **Keerthi** (3886236883) | Dr. Anju S (Dermatologist) | 1/22/2026, 12:45:00 | - | `Scheduled` (yellow) | → Convert to OPD, ✕ Cancel |
| **APT-20260122-6252** (1/22/2026) | **Punith** (4828468642) | Dr. Anju S (Dermatologist) | 1/22/2026, 12:30:00 | Skin concerns | `Completed` (green) | - |
| **APT-20260120-3611** (1/20/2026) | **Meera** (6483683468) | Dr. Anju S (Dermatologist) | 1/20/2026, 18:33:00 | Allergic Issues | `In OPD` (blue) | - |

#### Appointment ID Format

```
Appointment ID Format: APT-{YYYYMMDD}-{4-digit-sequence}

Examples:
- APT-20260122-9395 (January 22, 2026, sequence 9395)
- APT-20260122-6252 (January 22, 2026, sequence 6252)
- APT-20260120-3611 (January 20, 2026, sequence 3611)
```

#### Status Badges

| Status | Color | Meaning |
|--------|-------|---------|
| `Scheduled` | Yellow/Amber | Appointment confirmed, patient not yet arrived |
| `Completed` | Green | Consultation completed |
| `In OPD` | Blue | Patient converted to OPD, currently being seen |

#### Actions Column

| Action | Icon/Button | Visibility | Function |
|--------|-------------|------------|----------|
| Convert to OPD | "→ Convert to OPD" (blue text) | Only for `Scheduled` status | Converts appointment to OPD entry, assigns token |
| Cancel | "✕ Cancel" (red text) | Only for `Scheduled` status | Cancels the appointment |

**Note**: Completed and In OPD appointments show "-" in actions as no further actions are available.

### Workflow: Converting Appointment to OPD

```
Conversion Flow:
1. Patient arrives for scheduled appointment
2. Receptionist clicks "Convert to OPD"
3. System creates OPD entry with:
   - Pre-filled patient details from appointment
   - Assigned doctor from appointment
   - Visit type: "Appointment"
4. Token generated automatically
5. Appointment status changes to "In OPD"
6. Patient appears in doctor's queue
```

---

## 1.7 New Appointment Scheduling

### Screenshot

![New Appointment Form](C:/Users/Punith/.gemini/antigravity/brain/d867fceb-746d-451a-9b84-f39a5e658418/uploaded_image_1_1769133763059.png)

### Screen Purpose
Modal form for scheduling a new appointment. Captures patient information and appointment details for future visits.

### UI Element Analysis

#### Modal Structure

| Element | Type | Description |
|---------|------|-------------|
| Title | Header | "New Appointment" with **purple gradient header** |
| Close Button | Icon | "×" (white) to dismiss modal |
| Form Container | Card | White modal with purple header accent |

#### Section 1: Patient Information

| Field | Type | Required | Placeholder/Default | Notes |
|-------|------|----------|---------------------|-------|
| Patient Name | Text Input | ✅ Yes* | Empty | Full name |
| Phone Number | Text Input | ✅ Yes* | "10-digit number" | Indian mobile format |
| Email | Text Input | No | Empty | Optional contact |
| Age | Number Input | No | Empty | Patient age |
| Gender | Dropdown | No | "Select" | Male/Female/Other |

#### Section 2: Appointment Details

| Field | Type | Required | Default Value | Notes |
|-------|------|----------|---------------|-------|
| Doctor | Dropdown | ✅ Yes* | "Select Doctor" | Populated from available doctors |
| Date | Date Picker | ✅ Yes* | Current date (23-01-2026) | Calendar icon, future dates only |
| Time | Time Picker | ✅ Yes* | "--:--" | Clock icon, based on doctor availability |
| Reason for Visit | Text Input | No | "e.g., Routine checkup" | Brief description |
| Notes | Textarea | No | "Any additional notes..." | Extended notes for doctor |

#### Action Buttons

| Button | Type | Style | Action |
|--------|------|-------|--------|
| Cancel | Secondary | Gray outline | Close modal without saving |
| Create Appointment | Primary | **Purple filled** with calendar icon | Submit form, create appointment |

### Color Scheme Difference

**Note**: Unlike the OPD Entry form (blue theme), the Appointment form uses a **purple/violet color scheme**, visually distinguishing the two actions:
- **Blue**: Immediate OPD registration (walk-in)
- **Purple**: Future appointment scheduling

### Data Flow: Appointment Creation

```
Appointment Scheduling Flow:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────────────┐
│ Enter Patient   │
│ Information     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Select Doctor   │
│ & Date/Time     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Add Reason      │
│ & Notes         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Click "Create   │────▶│ POST /api/      │
│ Appointment"    │     │ appointments    │
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │ Response:       │
                        │ - Appointment # │
                        │ - Confirmation  │
                        └─────────────────┘
```

### Outcome
Upon successful submission:
1. Appointment record created with unique APT-{date}-{seq} ID
2. Patient record created (if new) or linked (if existing)
3. Appointment appears in Appointments list with `Scheduled` status
4. Slot blocked on doctor's calendar
5. Modal closes, list refreshes

---

## 1.8 Analytics & Reports

### Screenshot

![Reports Panel](C:/Users/Punith/.gemini/antigravity/brain/d867fceb-746d-451a-9b84-f39a5e658418/uploaded_image_2_1769133763059.png)

### Screen Purpose
The Reports section provides real-time analytics and performance insights for the receptionist's practice area, including OPD visits, revenue, and departmental distribution.

### UI Element Analysis

#### Page Header

| Element | Content | Purpose |
|---------|---------|----------|
| Page Title | "Analytics & Reports" | Section identifier (green gradient text) |
| Subtitle | "Real-time insights on your practice performance." | Context description |

#### Date Range Filter

| Element | Type | Default | Position |
|---------|------|---------|----------|
| "RANGE" Label | Text | - | Top right |
| Start Date | Date Picker | 23-01-2026 | With calendar icon |
| End Date | Date Picker | 23-01-2026 | With calendar icon |
| Filter Button | Icon | Funnel icon | Apply filters |

**Purpose**: Allows filtering all analytics data for a specific date range.

#### Statistics Cards (4 Cards)

| Card | Value | Label | Badge/Indicator | Icon Color |
|------|-------|-------|-----------------|------------|
| Card 1 | **0** | "Total OPD Visits" | "+0% vs last week" (gray) | Pink/Gray person icon |
| Card 2 | **₹0** | "Revenue Generated" | "On Track" (green badge) | Yellow rupee icon |
| Card 3 | **0** | "MLC Cases" | "Requires Legal Review" (red subtext) | Red document icon |
| Card 4 | **0** | "Unique Patients" | "High Retention" (blue text) | Blue users icon |

**Card Details**:

1. **Total OPD Visits**: Count of all OPD registrations in date range
   - Comparison badge shows week-over-week change

2. **Revenue Generated**: Total fee collection (in ₹)
   - "On Track" indicates meeting revenue targets

3. **MLC Cases**: Medical Legal Case count
   - Red "Requires Legal Review" subtitle for attention

4. **Unique Patients**: Distinct patient count
   - "High Retention" indicates returning patients

#### Chart Sections

| Chart | Title | Type | Description | Actions |
|-------|-------|------|-------------|----------|
| Visit Trends | "Visit Trends" | Line/Area Chart | Shows OPD visit patterns over time | "Details" link (blue) |
| Department Share | "Department Share" | Pie/Donut Chart | Distribution of visits by department | Download icon |

**Chart Placeholders**: Both charts show empty states as current data is 0.

#### Performance Overview Section

| Element | Content | Purpose |
|---------|---------|----------|
| Section Title | "Performance Overview" | Summary section header |
| Content Area | (Empty/Loading) | Detailed performance metrics |

### Report Metrics Tracked

| Metric | Calculation | Purpose |
|--------|-------------|----------|
| Total OPD Visits | COUNT(opd_visits) WHERE date BETWEEN range | Volume tracking |
| Revenue Generated | SUM(total_fee) WHERE status = 'PAID' | Financial tracking |
| MLC Cases | COUNT(opd_visits) WHERE is_mlc = true | Legal compliance |
| Unique Patients | COUNT(DISTINCT patient_id) | Patient base growth |
| Visit Trends | GROUP BY date | Pattern analysis |
| Department Share | GROUP BY department | Resource allocation |

### Workflow: Generating Reports

```
Report Generation Flow:
1. Navigate to Reports section
2. Select date range (default: today)
3. Click filter button
4. API fetches aggregated data
5. Stats cards update with values
6. Charts render with data
7. Optional: Click "Details" for drill-down
8. Optional: Download chart data
```

---

## Flow Summary: Receptionist Role

### Complete Workflow Diagram

```
                    ┌─────────────────────┐
                    │      LOGIN          │
                    │  (Role: RECEPTIONIST)│
                    └──────────┬──────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                        DASHBOARD                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │OPD Visits│  │New Pts  │  │Appts    │  │Pending  │         │
│  │   0     │  │   0     │  │   0     │  │   0     │         │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │
│                                                               │
│  Quick Actions: [New OPD] [Patient Records] [Appointments]   │
└──────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   OPD ENTRY     │  │    PATIENTS     │  │  APPOINTMENTS   │
│                 │  │                 │  │                 │
│ • View Queue    │  │ • Search        │  │ • View Schedule │
│ • New Entry     │  │ • View Records  │  │ • Create Appt   │
│ • Track Status  │  │ • View Profile  │  │ • Reschedule    │
└────────┬────────┘  └────────┬────────┘  └─────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│  NEW OPD FORM   │  │ PATIENT PROFILE │
│                 │  │                 │
│ • Patient Info  │  │ • Demographics  │
│ • Visit Details │  │ • OPD History   │
│ • Payment       │  │ • Consultations │
│ • Assign Doctor │  │ • Prescriptions │
└─────────────────┘  └─────────────────┘
```

### Key API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/receptionist/stats` | GET | Dashboard statistics |
| `/api/opd/visits` | GET | OPD queue list |
| `/api/opd/register` | POST | New OPD registration |
| `/api/patients` | GET | Patient list with search |
| `/api/patients/{id}` | GET | Patient profile |
| `/api/patients/{id}/visits` | GET | Patient OPD history |
| `/api/doctors` | GET | Available doctors dropdown |

---

*Document Version: 1.0*
*Last Updated: January 23, 2026*
*Role Documented: Receptionist*

---

<!-- Additional roles will be added below as documentation continues -->

---

# Role 2: Doctor

## Role Overview

| Attribute | Description |
|-----------|-------------|
| **Role Code** | `DOCTOR` |
| **Primary Function** | Clinical consultations, patient care, prescription management, medical documentation |
| **Access Level** | Access to assigned patients, own appointments, and clinical records |
| **Key Responsibilities** | View appointments, consult patients, create prescriptions, document diagnoses, manage patient records |

### Role Intent & Outcomes

**Intent**: The Doctor is the primary clinical user responsible for patient consultations, medical diagnosis, and treatment. They manage their daily schedule, review patient histories, and create prescriptions with optional AI assistance.

**Expected Outcomes**:
- Efficient patient consultation workflow
- Accurate prescription creation and documentation
- AI-assisted clinical note taking (via AI Scribe)
- Printable prescriptions for patients

---

## 2.1 Dashboard Overview

### Screenshot

![Doctor Dashboard](C:/Users/Punith/.gemini/antigravity/brain/d867fceb-746d-451a-9b84-f39a5e658418/uploaded_image_0_1769134704463.png)

### Screen Purpose
The Doctor Dashboard provides an overview of daily clinical activities, quick access to core functions, and AI assistance status.

### UI Element Analysis

#### Header Section

| Element | Type | Description | Function |
|---------|------|-------------|----------|
| CareNex AI Logo | Image + Text | Brand identity with "DOCTOR PORTAL" label | Navigation to home |
| Stethoscope Icon | Avatar | Doctor role indicator | Visual role identification |
| "Dashboard" | Page Title | Current page indicator | - |
| Hospital Name | Text | "Care 24 Medical Centre & Hospital" | Context - current facility |
| Doctor Info | Text + Avatar | "Dr. Anju" with specialty "Dermatologist" and "D" avatar | User identification |
| Logout Button | Icon | Arrow icon | Session termination |

#### Sidebar Navigation

| Menu Item | Icon | Route | Status |
|-----------|------|-------|--------|
| Dashboard | Grid icon | `/doctor/dashboard` | **Active** (highlighted blue) |
| My Appointments | Calendar icon | `/doctor/appointments` | Available |
| Patients | Users icon | `/doctor/patients` | Available |
| Reports | Chart icon | `/doctor/reports` | Available |

#### AI Insight Banner

| Element | Content | Purpose |
|---------|---------|---------|
| AI Insight Badge | "AI Insight: You have **0 appointments** today. 2 slot gaps available in the afternoon." | Intelligent scheduling suggestion |
| Date Display | "Friday, January 23, 2026" | Current date context |

#### Statistics Cards (4 Cards)

| Card | Value | Label | Badge | Icon Color |
|------|-------|-------|-------|------------|
| Card 1 | **0** | "Today's Appointments" | "Stats" | Blue calendar icon |
| Card 2 | **0** | "OPD Consultations" | "Stats" | Orange stethoscope icon |
| Card 3 | **4** | "Total Patients" | "Stats" | Pink users icon |
| Card 4 | **4** | "Total OPD Visits" | "Stats" | Green document icon |

#### Quick Actions Section

| Action Card | Icon | Title | Subtitle | Navigation Target |
|-------------|------|-------|----------|-------------------|
| Prescriptions | Document (blue bg) | "Prescriptions" | "Create & manage Rx" | Opens Prescriptions panel |
| Appointments | Calendar (yellow bg) | "Appointments" | "View Schedule" | `/doctor/appointments` |
| My Patients | Users (pink bg) | "My Patients" | "Medical Records" | `/doctor/patients` |

#### AI Assistance Panel

| Element | Content | Visual |
|---------|---------|--------|
| Status Icon | Activity/Pulse icon | Pink circular icon |
| Title | "AI Assistance" | Bold heading |
| Message | "Your AI Clinical Scribe is active and ready to assist with today's consultations." | Status text |
| Action Button | "View Settings" | Blue button |

**Note**: AI Assistance panel is currently a placeholder/dummy feature as mentioned.

---

## 2.2 Prescriptions Management

### Screenshot

![Prescriptions Panel](C:/Users/Punith/.gemini/antigravity/brain/d867fceb-746d-451a-9b84-f39a5e658418/uploaded_image_1_1769134704463.png)

### Screen Purpose
The Prescriptions panel allows doctors to view, search, and manage all prescriptions they have issued. It provides quick access to prescription details and print functionality.

### UI Element Analysis

#### Page Header

| Element | Content | Purpose |
|---------|---------|---------|
| Page Title | "Prescriptions" | Section identifier |
| Subtitle | "Manage and issue patient prescriptions with AI assistance." | Context description |
| New Prescription Button | "+ New Prescription" (Blue) | **Primary Action** - Opens prescription creation modal |

#### Search Bar

| Element | Type | Placeholder | Additional |
|---------|------|-------------|------------|
| Search Input | Text field | "Search prescriptions by patient name..." | Full-width |
| Filter Icon | Icon button | Funnel icon | Advanced filters |

#### Prescription Cards (Grid Layout)

**Card Structure**:

| Element | Description | Position |
|---------|-------------|----------|
| Patient Avatar | Initials in blue circle (e.g., "DS") | Top left |
| Patient Name | Bold name (e.g., "Deepika S") | Next to avatar |
| Date | Prescription date (e.g., "1/22/2026") | Below name |
| Status Badge | "Active" (green) | Top right corner |
| Medications Section | "MEDICATIONS" label with pill tags | Below patient info |
| Medication Tags | Pill-shaped tags (e.g., "testing", "biotin tab", "Iron tab") | Under medications label |
| Rx ID | Prescription ID (e.g., "Rx ID: #22") | Bottom left |
| Print Button | "Print" with printer icon | Bottom right |

**Sample Prescription Cards**:

| Patient | Date | Status | Medications | Rx ID |
|---------|------|--------|-------------|-------|
| **Deepika S** | 1/22/2026 | `Active` (green) | testing | Rx ID: #22 |
| **Deepika S** | 1/20/2026 | `Active` (green) | biotin tab | Rx ID: #21 |
| **Deepika S** | 1/20/2026 | `Active` (green) | biotin tablet, Iron tab | Rx ID: #20 |

#### Prescription ID Format

```
Prescription ID Format: Rx ID: #{sequence_number}

Examples:
- Rx ID: #22
- Rx ID: #21
- Rx ID: #20
```

---

## 2.3 New Prescription Creation

### Screenshot

![New Prescription Form](C:/Users/Punith/.gemini/antigravity/brain/d867fceb-746d-451a-9b84-f39a5e658418/uploaded_image_2_1769134704463.png)

### Screen Purpose
Modal form for creating a new prescription. Includes patient lookup, diagnosis entry, AI-assisted clinical notes, and medication list.

### UI Element Analysis

#### Modal Structure

| Element | Type | Description |
|---------|------|-------------|
| Title Icon | Document icon | Blue prescription icon |
| Title | Header | "New Prescription" |
| Subtitle | Text | "Fill in patient details and medications" |
| Close Button | Icon | "×" to dismiss modal |

#### Section 1: PATIENT DETAILS

| Field | Type | Placeholder | Function |
|-------|------|-------------|----------|
| Patient Search | Text Input | "Search patient by name, phone, or MRN..." | Searchable patient lookup |
| Search Button | Button | "Search" (Blue) | Execute patient search |

**Search Capabilities**:
- Patient name
- Phone number
- MRN (Medical Record Number)

#### Section 2: Diagnosis & Clinical Notes

| Field | Type | Placeholder | AI Feature |
|-------|------|-------------|------------|
| Diagnosis | Textarea | "Enter clinical diagnosis..." | Manual entry |
| Clinical Notes | Textarea | "Type or use AI Scribe to dictate notes..." | **AI Scribe** (TTS) |
| AI Scribe Button | Button | "🎤 AI Scribe" (Purple) | **Speech-to-Text feature** |

**AI Scribe Feature**:
- **Type**: Text-to-Speech (TTS) / Speech-to-Text
- **Function**: Allows doctor to dictate clinical notes verbally
- **Button Style**: Purple with microphone icon
- **Status**: Basic TTS implementation

#### Section 3: PRESCRIBED MEDICATIONS

| Element | Description |
|---------|-------------|
| Section Title | "PRESCRIBED MEDICATIONS" |
| Add Drug Button | "+ Add Drug" (Blue text link) |

**Medication Entry Row**:

| Field | Type | Placeholder | Purpose |
|-------|------|-------------|---------|
| Drug Name | Text Input | "Drug Name" | Medication name |
| Dose | Text Input | "Dose (500mg)" | Dosage amount |
| Freq | Text Input | "Freq (1-0-1)" | Frequency pattern (morning-afternoon-night) |
| Dur | Text Input | "Dur (5 days)" | Duration of treatment |
| Remarks | Text Input | "Remarks" | Additional instructions |

**Frequency Format**:
```
Format: X-Y-Z (Morning-Afternoon-Night)

Examples:
- 1-0-1 = Once in morning, skip afternoon, once at night
- 1-1-1 = Three times daily
- 0-0-1 = Once at night only
```

#### Action Buttons

| Button | Type | Style | Action |
|--------|------|-------|--------|
| Cancel | Secondary | Gray outline | Close modal without saving |
| Issue Prescription | Primary | Blue filled | Submit form, create prescription |

---

## 2.4 Prescription Preview & Print

### Screenshot

![Prescription Preview](C:/Users/Punith/.gemini/antigravity/brain/d867fceb-746d-451a-9b84-f39a5e658418/uploaded_image_3_1769134704463.png)

### Screen Purpose
Printable prescription document preview. Displays formatted prescription for printing or PDF generation.

### UI Element Analysis

#### Modal Header

| Element | Content | Style |
|---------|---------|-------|
| Title | "Prescription Preview" | Left-aligned |
| Print Button | "🖨 Print" | Blue filled button |
| Close Button | "×" | Icon button |

#### Hospital Header Section

| Element | Content | Position |
|---------|---------|----------|
| Hospital Name | "Care 24 Medical Centre & Hospital" | Left (large, blue text) |
| Hospital Tagline | "Excellence in Healthcare" | Below hospital name |
| Doctor Name | "DR. ANJU S" | Right (bold) |
| Specialty | "Dermatologist" | Below doctor name |
| Registration | "Reg No: TN79490" | Below specialty |

#### Patient Information Card

| Field | Value | Position |
|-------|-------|----------|
| Patient | "DEEPIKA S" | Left section |
| Age/Sex | "24Y / Female" | Left section |
| Mobile | "4060234046" | Left section |
| Date | "1/22/2026" | Right section |
| Rx ID | "#22" | Right section |

#### Medications Table (Rx Section)

| Column | Description | Example |
|--------|-------------|---------|
| # | Row number | 1 |
| Medicine Name | Drug name | "testing" |
| Dosage | Dose amount | "500 m" |
| Frequency | Dose pattern | "1-0-1" |
| Duration | Treatment period | "5 days" |
| Remarks | Instructions | "After food" |

**Table Header**: "℞ Medications" (with Rx symbol)

#### Footer Section

| Element | Content | Position |
|---------|---------|----------|
| Generated Timestamp | "Generated on: 1/23/2026, 7:47:20 AM" | Bottom left |
| Disclaimer | "This is a computer generated prescription." | Below timestamp |
| Doctor Signature | "DR. ANJU S" | Bottom right |
| Signature Label | "Signature" | Below doctor name |

### Print Layout

The prescription preview is formatted for A4/Letter printing with:
- Hospital branding header
- Clear patient identification
- Structured medication table
- Doctor signature placeholder
- Timestamp and disclaimer

---

## 2.5 Clinical Cockpit (Appointments)

### Screenshot

![Clinical Cockpit](C:/Users/Punith/.gemini/antigravity/brain/d867fceb-746d-451a-9b84-f39a5e658418/uploaded_image_0_1769136049823.png)

### Screen Purpose
The Clinical Cockpit is the doctor's command center for managing patient flow. It shows live OPD patients currently scheduled, upcoming appointments, and completed consultations for the day.

### UI Element Analysis

#### Page Header

| Element | Content | Purpose |
|---------|---------|---------|
| Page Title | "Clinical Cockpit" | Section identifier |
| Subtitle | "Manage your patient flow and schedule." | Context description |
| Schedule For | "SCHEDULE FOR: 23-01-2026" with date picker | Date selector |

#### AI Assistant Insight Banner

| Element | Content |
|---------|---------|
| Label | "AI ASSISTANT INSIGHT" |
| Message | "Smooth flow detected. You're on track to finish the morning OPD by 1:00 PM." |

#### Live Patient Stream (OPD)

| Element | Value | Action |
|---------|-------|--------|
| Section Title | "Live Patient Stream (OPD)" | Real-time queue |
| Waiting Badge | "1 Waiting" (green) | Queue count |
| Token | "T-1" | OPD token |
| Patient | "Punith" (24 / Male, Walk-in) | Patient info |
| Badge | "NEXT" (green) | Next in queue |
| Start Button | "Start →" (Blue) | Begin consultation |

**Note**: Only patients with OPD scheduled for the current moment appear here.

#### Upcoming Schedule

| Time | Patient | Status |
|------|---------|--------|
| 08:10 AM | Punith | Current |

#### Completed Today

| Metric | Value |
|--------|-------|
| Total Patients Seen | **0** |

---

## 2.6 My Patients

### Screenshot

![My Patients Panel](C:/Users/Punith/.gemini/antigravity/brain/d867fceb-746d-451a-9b84-f39a5e658418/uploaded_image_1_1769136049823.png)

### Screen Purpose
Doctor's patient records with filtering and historical data.

### UI Element Analysis

#### Statistics Cards (4 Cards)

| Card | Value | Label |
|------|-------|-------|
| Card 1 | **5** | "TOTAL PATIENTS" |
| Card 2 | **1** | "ACTIVE VISITS" |
| Card 3 | **5** | "RECENT (7D)" |
| Card 4 | **0** | "CRITICAL ATTENTION" |

#### Tab Navigation

| Tab | Function |
|-----|----------|
| All Patients | **Active** - View all |
| Recently Viewed | Quick access |
| Critical Attention | Priority patients |

#### Patients Table

| Name | MRN | Age | Gender | Last Visit | Contact | Action |
|------|-----|-----|--------|------------|---------|--------|
| Punith | MRN-20260122-0001 | 24 yrs | Male | 9/3/2026 | 1321231313 | View Record |
| Punith S | MRN-20260112-0001 | 25 yrs | Male | 9/6/2026 | 4628408642 | View Record |
| Meera K | MRN-20260112-0002 | 25 yrs | Female | 1/22/2026 | 6483683468 | View Record |
| Deepika S | MRN-20260120-7400 | 24 yrs | Female | 1/20/2026 | 4060234046 | View Record |
| Gopika S | MRN-20260118-4415 | 21 yrs | Female | 1/20/2026 | 9638326362 | View Record |

---

## 2.7 Patient Profile View

### Screenshot

![Patient Profile](C:/Users/Punith/.gemini/antigravity/brain/d867fceb-746d-451a-9b84-f39a5e658418/uploaded_image_2_1769136049823.png)

### Screen Purpose
Comprehensive patient view with vitals, history, and consultation entry point.

### UI Element Analysis

#### Patient Header

| Element | Value |
|---------|-------|
| Name | **Punith** |
| Demographics | 24 Yrs • Male |
| MRN | MRN-20260123-0001 |
| Contact | 1321231313 |
| Action | "Start Consultation" (Blue button) |

#### Live Vitals Section

| Badge | "CURRENT VISIT" (green) |
|-------|-------------------------|
| Chief Complaint | Text input |
| Vitals Grid | GRBS, SPO2, PULSE, HEIGHT, WEIGHT, BP SYSTOLIC, TEMPERATURE, BP DIASTOLIC |

#### Recent History

| Date | Diagnosis |
|------|-----------|
| 1/23/2026 | No Diagnosis |

#### Ready for Consultation Panel

| Message | "Please select 'Start Consultation' from the header to begin the session. The AI Scribe will be ready to assist you." |

#### History Sections

| Section | Records |
|---------|---------|
| OPD Visits | "0 Records" - No past OPD visits found |
| Consultations | "0 Records" - No consultation records |

---

## 2.8 Consultation View (Active Session)

### Screenshot

![Consultation View](C:/Users/Punith/.gemini/antigravity/brain/d867fceb-746d-451a-9b84-f39a5e658418/uploaded_image_3_1769136049823.png)

### Screen Purpose
Active consultation interface with AI Clinical Scribe for documentation, diagnosis entry, lab orders, and prescription creation.

### UI Element Analysis

#### AI Clinical Scribe Panel

| Element | Content |
|---------|---------|
| Icon | Microphone (purple) |
| Title | "AI Clinical Scribe" |
| Status | "Ready to listen" |
| Action | "▷ Start" button |

**Feature**: Speech-to-Text for clinical note dictation.

#### Clinical Notes & Observations

| Placeholder | "Start typing or speak to describe symptoms..." |

#### Diagnosis Section

| Field | Placeholder | Feature |
|-------|-------------|---------|
| Diagnosis | "Enter Diagnosis..." | AI suggestion icon |

#### Lab Orders Section

| Field | Placeholder | Action |
|-------|-------------|--------|
| Test Name | "Test Name" | "+" to add |
| Status | "No labs added" | - |

#### Rx Prescription Section

| Element | Description |
|---------|-------------|
| Title | "Rx Prescription" |
| Favorites | "View Favorites" link |
| Medicine Name | Text input |
| Dose | "Dose (500mg)" |
| Frequency | ☐ Mor ☐ Noon ☐ Night (checkboxes) |
| Add Button | "+" (blue circle) |

#### Next Visit Section

| Field | Format |
|-------|--------|
| Date | dd-mm-yyyy picker |
| Type | "Follow-up Required" dropdown |

#### Action Buttons

| Button | Function |
|--------|----------|
| Save Draft | Save and continue later |
| Complete Consultation | Finalize session |

---

## 2.9 Analytics & Reports

### Screenshot

![Doctor Reports](C:/Users/Punith/.gemini/antigravity/brain/d867fceb-746d-451a-9b84-f39a5e658418/uploaded_image_1769136442282.png)

### Screen Purpose
The Analytics & Reports section provides doctors with real-time insights on their practice performance, including visit trends, revenue generated, and departmental distribution.

### UI Element Analysis

#### Page Header

| Element | Content | Purpose |
|---------|---------|---------|
| Page Title | "Analytics & Reports" | Section identifier (green gradient text) |
| Subtitle | "Real-time insights on your practice performance." | Context description |

#### Date Range Filter

| Element | Type | Default |
|---------|------|---------|
| "RANGE" Label | Text | - |
| Start Date | Date Picker | 23-01-2026 |
| End Date | Date Picker | 23-01-2026 |
| Filter Button | Icon | Funnel icon |

#### Statistics Cards (4 Cards)

| Card | Value | Label | Badge/Indicator |
|------|-------|-------|-----------------|
| Card 1 | **1** | "Total OPD Visits" | "+12% vs last week" (green) |
| Card 2 | **₹400** | "Revenue Generated" | "On Track" (green badge) |
| Card 3 | **0** | "MLC Cases" | "Requires Legal Review" (red) |
| Card 4 | **1** | "Unique Patients" | "High Retention" (blue) |

#### Visit Trends Chart

| Element | Description |
|---------|-------------|
| Chart Type | Line/Area chart |
| X-Axis | Date (2026-01-23) |
| Y-Axis | Visit count (0, 0.25, 0.5, 0.75, 1) |
| Data Point | "2026-01-23: Visits: 1" |
| Details Link | "Details" (blue text) |

#### Department Share Chart

| Element | Description |
|---------|-------------|
| Chart Type | Pie/Donut chart (placeholder) |
| Download Icon | Export option |

#### Performance Overview Section

| Element | Description |
|---------|-------------|
| Section Title | "Performance Overview" |
| Visual | Bar chart with colored bars (green/blue) |

### Metrics Tracked

| Metric | Description |
|--------|-------------|
| Total OPD Visits | Count of consultations completed |
| Revenue Generated | Total fees collected (₹) |
| MLC Cases | Medical Legal Cases count |
| Unique Patients | Distinct patient count |
| Visit Trends | Pattern over time |
| Department Share | Distribution by specialty |

---

## Flow Summary: Doctor Role

### Complete Workflow Diagram

```
                    ┌─────────────────────┐
                    │      LOGIN          │
                    │   (Role: DOCTOR)    │
                    └──────────┬──────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                        DASHBOARD                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │Today Apt│  │OPD Cons │  │Tot Pts  │  │OPD Visits│        │
│  │   0     │  │   0     │  │   4     │  │   4     │         │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │
│                                                               │
│  Quick Actions: [Prescriptions] [Appointments] [My Patients] │
│                                                               │
│  AI Assistance: Clinical Scribe Active                       │
└──────────────────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ PRESCRIPTIONS│ │ APPOINTMENTS │ │  MY PATIENTS │
│              │ │              │ │              │
│• View List   │ │• View Today  │ │• View Records│
│• Search      │ │• Check Queue │ │• History     │
│• New Rx      │ │              │ │              │
│• Print       │ │              │ │              │
       │
       ▼
┌──────────────┐         ┌──────────────┐
│ NEW RX FORM  │         │  RX PREVIEW  │
│              │────────▶│              │
│• Patient     │         │• Hospital Hdr│
│• Diagnosis   │         │• Patient Info│
│• AI Scribe   │         │• Medications │
│• Medications │         │• Doctor Sign │
│              │         │• Print Button│
└──────────────┘         └──────────────┘
```

### Key Features

| Feature | Description |
|---------|-------------|
| **AI Scribe** | Speech-to-text for clinical notes (basic TTS) |
| **Prescription Cards** | Visual card layout with medication tags |
| **Print Preview** | Formatted prescription for printing |
| **Patient Search** | Search by name, phone, or MRN |

### Key API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/doctor/stats` | GET | Dashboard statistics |
| `/api/doctor/appointments` | GET | Doctor's appointments |
| `/api/doctor/patients` | GET | Doctor's patient list |
| `/api/prescriptions` | GET | Prescriptions list |
| `/api/prescriptions` | POST | Create new prescription |
| `/api/prescriptions/{id}` | GET | Prescription details |
| `/api/prescriptions/{id}/print` | GET | Print-ready prescription |
| `/api/patients/search` | GET | Patient search |

---

*Document Version: 1.1*
*Last Updated: January 23, 2026*
*Roles Documented: Receptionist, Doctor*

---

<!-- Additional roles will be added below as documentation continues -->

