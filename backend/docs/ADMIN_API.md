# Admin API Documentation

## 1. Hospital Management (Super Admin Only)

### Create Hospital & Client Admin
**POST** `/api/hospitals`
**Auth:** `SUPER_ADMIN`

Creates a new hospital, a main branch, and a client admin user in one transaction.

**Request:**
```json
{
  "hospital_name": "City General Hospital",
  "hospital_code": "CGH",
  "hospital_type": "General",
  "address": "123 Health St",
  "city": "Metropolis",
  "state": "NY",
  "zip_code": "10001",
  "contact_number": "555-0100",
  
  "admin_username": "cgh_admin",
  "admin_email": "admin@cgh.com",
  "admin_phone": "555-0199",
  "admin_password": "SecurePass123!",
  "admin_name": "John Admin"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "hospital": { ... },
    "main_branch": { ... },
    "admin": { ... }
  }
}
```

### Update Hospital
**PUT** `/api/hospitals/:id`
**Auth:** `SUPER_ADMIN`, `CLIENT_ADMIN`

```json
{
  "contact_number": "555-0200"
}
```

### Get All Hospitals
**GET** `/api/hospitals`
**Auth:** `SUPER_ADMIN`

### Get Hospital by ID
**GET** `/api/hospitals/:id`
**Auth:** `SUPER_ADMIN`

---

## 2. Branch Management

### Create Branch
**POST** `/api/branches`
**Auth:** `SUPER_ADMIN`, `CLIENT_ADMIN`

```json
{
  "hospital_id": 1,
  "branch_name": "North Wing",
  "branch_code": "CGH-N",
  "address": "456 North Ave",
  "city": "Metropolis",
  "state": "NY",
  "zip_code": "10002",
  "contact_number": "555-0300",
  "has_emergency": true
}
```

### Update Branch
**PUT** `/api/branches/:id`
**Auth:** `SUPER_ADMIN`, `CLIENT_ADMIN`

### Get Branches by Hospital
**GET** `/api/branches/hospital/:hospitalId`
**Auth:** `SUPER_ADMIN`, `CLIENT_ADMIN`

---

## 3. Staff Management (Branch-Centric)

### Create Doctor
**POST** `/api/doctors`
**Auth:** `SUPER_ADMIN`, `CLIENT_ADMIN`

Creates a User account and Doctor profile, linked to specific branches.

```json
{
  "username": "dr.smith",
  "email": "smith@cgh.com",
  "password": "DoctorPass123!",
  "phone_number": "555-1000",
  
  "first_name": "Jane",
  "last_name": "Smith",
  "specialization": "Cardiology",
  "license_number": "LIC-12345",
  "qualification": "MD, PhD",
  "experience_years": 10,
  "consultation_fee": 150.00,
  
  "branch_ids": [1, 2]  // REQUIRED: Link to branches
}
```

### Create Nurse
**POST** `/api/nurses`
**Auth:** `SUPER_ADMIN`, `CLIENT_ADMIN`

```json
{
  "username": "nurse.jones",
  "email": "jones@cgh.com",
  "password": "NursePass123!",
  "phone_number": "555-2000",
  
  "first_name": "Bob",
  "last_name": "Jones",
  "qualification": "BSN",
  "experience_years": 5,
  
  "branch_ids": [1] // REQUIRED: Link to branches
}
```

---

## 4. Advanced Read APIs (Branch-Centric Filtering)

### Get Doctors
**GET** `/api/doctors`
**Auth:** `SUPER_ADMIN`, `CLIENT_ADMIN`

**Query Parameters:**
- `branch_id`: **Primary Filter** - Get doctors for a specific branch
- `department_id`: Filter by department
- `code`: Fetch specific doctor by code
- `registration_number`: Fetch by license number

**Examples:**
- Doctors in Branch 1: `GET /api/doctors?branch_id=1`
- Doctors in Branch 1, Dept 2: `GET /api/doctors?branch_id=1&department_id=2`

### Get Nurses
**GET** `/api/nurses`
**Auth:** `SUPER_ADMIN`, `CLIENT_ADMIN`

**Query Parameters:**
- `branch_id`: **Primary Filter**
- `department_id`
- `code`

**Examples:**
- Nurses in Branch 5: `GET /api/nurses?branch_id=5`

### Get Patients
**GET** `/api/patients`
**Auth:** Authenticated Users

**Query Parameters:**
- `mrn`: Fetch by MRN Number
- `code`: Fetch by Patient Code
- `phone`: Fetch by Contact Number
- `name`: Search by name (partial match)

---

## 5. Department Assignment

### Assign Doctor to Department
**POST** `/api/doctors/:id/departments`
**Auth:** `SUPER_ADMIN`, `CLIENT_ADMIN`

```json
{
  "department_id": 2,
  "is_primary": true
}
```

### Assign Nurse to Department
**POST** `/api/nurses/:id/departments`
**Auth:** `SUPER_ADMIN`, `CLIENT_ADMIN`

Updates the nurse's assignment within a specific branch.

```json
{
  "branch_id": 1,
  "department_id": 2
}
```

---

## 6. Shift Management (Branch-Mapped)

### Create Shift (and Map to Branch)
**POST** `/api/shifts`
**Auth:** `SUPER_ADMIN`, `CLIENT_ADMIN`

Creates a shift and immediately maps it to the specified branch.

```json
{
  "shift_name": "Morning Shift A",
  "shift_code": "MS-A",
  "start_time": "08:00:00",
  "end_time": "16:00:00",
  "shift_type": "Morning",
  "description": "Standard morning shift",
  "branch_id": 1  // REQUIRED: Map to this branch
}
```

### Get Shifts by Branch
**GET** `/api/shifts/branch/:branchId`
**Auth:** `SUPER_ADMIN`, `CLIENT_ADMIN`

---

## 7. Rostering (Shift Assignment)

### Assign Doctor to Shift
**POST** `/api/shifts/assign/doctor`
**Auth:** `SUPER_ADMIN`, `CLIENT_ADMIN`

Assigns a doctor to a specific shift on a specific date.

```json
{
  "doctor_id": 1,
  "branch_id": 1,
  "shift_id": 5,
  "department_id": 2,
  "shift_date": "2024-12-05"
}
```

### Assign Nurse to Shift
**POST** `/api/shifts/assign/nurse`
**Auth:** `SUPER_ADMIN`, `CLIENT_ADMIN`

```json
{
  "nurse_id": 3,
  "branch_id": 1,
  "shift_id": 5,
  "department_id": 2,
  "shift_date": "2024-12-05"
}
```
