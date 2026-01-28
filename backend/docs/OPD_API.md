# OPD & Appointment API Documentation

## 1. OPD Management

### Get OPD Entries (Enhanced)
**GET** `/api/opd`
**Auth:** `RECEPTIONIST`, `DOCTOR`, `NURSE`, `ADMIN`

**Default Behavior:** Returns **TODAY's** entries if no date is specified.

**Query Parameters:**
- `branch_id`: **Required** for Receptionists to see their branch queue.
- `date`: Specific date (YYYY-MM-DD).
- `from_date` & `to_date`: Date range.
- `doctor_id`: Filter by doctor.

**Examples:**
- **Today's Queue (Branch 1):** `GET /api/opd?branch_id=1`
- **Specific Date:** `GET /api/opd?branch_id=1&date=2024-12-01`
- **Date Range:** `GET /api/opd?branch_id=1&from_date=2024-12-01&to_date=2024-12-07`

---

## 2. Appointment Management

### Create Appointment
**POST** `/api/appointments`
**Auth:** `RECEPTIONIST`, `CLIENT_ADMIN`

Creates an appointment. If the patient doesn't exist (checked by `contact_number`), a new patient record is created automatically.

**Request:**
```json
{
  "branch_id": 1,
  "doctor_id": 5,
  "department_id": 2,
  "appointment_date": "2024-12-10",
  "start_time": "10:00:00",
  "end_time": "10:30:00",
  "reason": "Routine Checkup",
  
  // Patient Details (Required if new)
  "first_name": "Bob",
  "last_name": "Builder",
  "contact_number": "9988776655",
  "gender": "Male",
  "date_of_birth": "1985-08-20"
}
```

### Get Appointments
**GET** `/api/appointments`
**Auth:** `RECEPTIONIST`, `DOCTOR`, `ADMIN`

**Default Behavior:** Returns **TODAY's** appointments if no date is specified.

**Query Parameters:**
- `branch_id`: Filter by branch.
- `date`: Specific date.
- `from_date` & `to_date`: Date range.
- `status`: Filter by status (e.g., 'Scheduled', 'Completed').

**Examples:**
- **Today's Appointments:** `GET /api/appointments?branch_id=1`
- **Next Week's Schedule:** `GET /api/appointments?branch_id=1&from_date=2024-12-05&to_date=2024-12-12`
