# HMS Database Models

This directory contains all database model classes for the Hospital Management System.

## Architecture

### BaseModel
All models extend from `BaseModel.js` which provides common CRUD operations:
- `findAll(filters, options)` - Find multiple records
- `findById(id)` - Find by primary key
- `findOne(filters)` - Find single record
- `create(data)` - Create new record
- `update(id, data)` - Update existing record
- `delete(id)` - Delete record
- `count(filters)` - Count records
- `executeQuery(query, values)` - Execute custom SQL

## Models Overview

### Core Models

#### Role (`Role.js`)
- Manages user roles and permissions
- Methods: `findByCode()`, `findActive()`

#### Hospital (`Hospital.js`)
- Hospital information management
- Methods: `findByCode()`, `findActive()`, `findByType()`

#### User (`User.js`)
- System user accounts with authentication
- Methods: `findByUsername()`, `findByEmail()`, `findByPhone()`, `findWithRole()`, `updateLastLogin()`, `incrementLoginAttempts()`, `lockAccount()`

#### Branch (`Branch.js`)
- Hospital branch locations
- Methods: `findByHospital()`, `findActiveByHospital()`, `findByCode()`, `findByCity()`, `findWithEmergency()`

#### Department (`Department.js`)
- Medical departments
- Methods: `findByCode()`, `findActive()`

### Personnel Models

#### Doctor (`Doctor.js`)
- Doctor information
- Methods: `findByCode()`, `findByRegistration()`, `findWithUser()`, `findBySpecialization()`, `searchByName()`

#### Nurse (`Nurse.js`)
- Nurse information
- Methods: `findByCode()`, `findByRegistration()`, `findWithUser()`, `searchByName()`

#### Staff (`Staff.js`)
- General staff information
- Methods: `findByCode()`, `findWithUser()`, `findByType()`, `searchByName()`

### Assignment/Mapping Models

#### BranchDepartment (`BranchDepartment.js`)
- Maps departments to branches
- Methods: `findByBranch()`, `findByDepartment()`, `findOperational()`

#### DoctorBranch (`DoctorBranch.js`)
- Doctor-branch assignments
- Methods: `findByDoctor()`, `findByBranch()`

#### DoctorDepartment (`DoctorDepartment.js`)
- Doctor-department assignments
- Methods: `findByDoctor()`, `findByDepartment()`, `findPrimaryByDoctor()`

#### DoctorBranchDepartment (`DoctorBranchDepartment.js`)
- Complex doctor-branch-department assignments
- Methods: `findByDoctorAndBranch()`, `findByBranchAndDepartment()`

#### NurseBranch (`NurseBranch.js`)
- Nurse-branch assignments
- Methods: `findByNurse()`, `findByBranch()`, `findByBranchAndDepartment()`

#### StaffBranch (`StaffBranch.js`)
- Staff-branch assignments
- Methods: `findByStaff()`, `findByBranch()`

### Shift Management Models

#### Shift (`Shift.js`)
- Shift definitions
- Methods: `findByCode()`, `findActive()`, `findByType()`

#### ShiftBranch (`ShiftBranch.js`)
- Shift-branch mapping
- Methods: `findByShift()`, `findByBranch()`

#### DoctorShift (`DoctorShift.js`)
- Doctor shift assignments and attendance
- Methods: `findByDoctorAndDate()`, `findTodayByDoctor()`, `findByShiftAndDate()`

#### NurseShift (`NurseShift.js`)
- Nurse shift assignments and attendance
- Methods: `findByNurseAndDate()`, `findTodayByNurse()`, `findByShiftAndDate()`

### Patient & Clinical Models

#### Patient (`Patient.js`)
- Patient records
- Methods: `findByMRN()`, `findByCode()`, `findByContact()`, `findByEmail()`, `searchByName()`, `findRecent()`

#### Appointment (`Appointment.js`)
- Appointment scheduling
- Methods: `findByNumber()`, `findByPatient()`, `findByDoctor()`, `findByBranch()`, `findByStatus()`, `findTodayByDoctor()`, `findWithDetails()`

#### OPDEntry (`OPDEntry.js`)
- Outpatient department visits
- Methods: `findByNumber()`, `findByPatient()`, `findByDoctor()`, `findByBranch()`, `findTodayByDoctor()`, `findWithDetails()`, `getPatientHistory()`

### Billing Models

#### Service (`Service.js`)
- Medical services catalog
- Methods: `findByCode()`, `findActive()`, `findByCategory()`, `searchByName()`, `getCategories()`

#### Billing (`Billing.js`)
- Billing records
- Methods: `findByNumber()`, `findByPatient()`, `findByBranch()`, `findByStatus()`, `findWithItems()`, `findPending()`, `getRevenueSummary()`

#### BillingItem (`BillingItem.js`)
- Individual billing items
- Methods: `findByBill()`, `createMultiple()`

## Usage Examples

### Basic CRUD Operations

```javascript
const { Patient, Doctor, Appointment } = require('./models');

// Create a new patient
const newPatient = await Patient.create({
  mrn_number: 'MRN001',
  first_name: 'John',
  last_name: 'Doe',
  patient_code: 'PAT001',
  gender: 'Male',
  date_of_birth: '1990-01-15',
  contact_number: '9876543210',
  // ... other fields
});

// Find patient by MRN
const patient = await Patient.findByMRN('MRN001');

// Search patients by name
const patients = await Patient.searchByName('John');

// Update patient
await Patient.update(patient.patient_id, {
  contact_number: '9999999999'
});
```

### Complex Queries

```javascript
// Get today's appointments for a doctor
const appointments = await Appointment.findTodayByDoctor(doctorId);

// Get patient's complete medical history
const history = await OPDEntry.getPatientHistory(patientId);

// Get appointment with all details
const appointmentDetails = await Appointment.findWithDetails(appointmentId);

// Get revenue summary for a branch
const revenue = await Billing.getRevenueSummary(branchId, '2024-01-01', '2024-01-31');
```

### Using Filters and Options

```javascript
// Find all active doctors
const activeDoctors = await Doctor.findActive();

// Find doctors by specialization
const cardiologists = await Doctor.findBySpecialization('Cardiology');

// Get recent patients with limit
const recentPatients = await Patient.findAll(
  { is_active: true },
  { orderBy: 'created_at DESC', limit: 10 }
);
```

## Import Pattern

All models can be imported from the index file:

```javascript
// Import specific models
const { Patient, Doctor, Appointment } = require('./models');

// Or import all models
const models = require('./models');
const patient = await models.Patient.findById(1);
```

## Model Features

✅ **Automatic Timestamps** - `created_at` and `updated_at` via PostgreSQL triggers
✅ **Parameterized Queries** - Protection against SQL injection
✅ **Relationship Queries** - JOIN operations for related data
✅ **Search Functions** - Full-text search capabilities
✅ **Aggregation** - Count, sum, and grouping operations
✅ **Transaction Support** - Via `executeQuery()` method

## Best Practices

1. **Always use parameterized queries** - Models handle this automatically
2. **Use specific methods** - Prefer `findByMRN()` over `findOne({ mrn_number: ... })`
3. **Handle errors** - Wrap database calls in try-catch blocks
4. **Validate data** - Before passing to create/update methods
5. **Use transactions** - For operations affecting multiple tables

## Database Connection

All models use the database connection pool from `config/db.js`. No need to manage connections manually.
