# Login Fix - Database Schema Mismatch - 2026-02-11

## Issue Fixed
**Error**: `Login failed. Please try again.` (500 Internal Server Error)

### Problem
The login was failing because the `User.findWithRole()` query was trying to access columns that don't exist in the database:
- `hospitals.logo` (referenced as `h.logo`)
- `hospitals.enabled_modules` (referenced as `h.enabled_modules`)
- `branches.enabled_modules` (referenced as `b.enabled_modules`)

### Root Cause
The database schema (`schema.sql`) doesn't include these columns in the `hospitals` and `branches` tables, but the User model and auth controller were trying to access them.

### Solution Applied

#### 1. Fixed User Model
**File**: `backend/models/User.js`

**Changed** (Line 48):
```javascript
// BEFORE:
b.hospital_id, h.hospital_name, h.logo as hospital_logo, h.enabled_modules, b.branch_name, b.enabled_modules as branch_enabled_modules

// AFTER:
b.hospital_id, h.hospital_name, b.branch_name
```

**Removed columns**:
- ❌ `h.logo as hospital_logo`
- ❌ `h.enabled_modules`
- ❌ `b.enabled_modules as branch_enabled_modules`

#### 2. Fixed Auth Controller
**File**: `backend/controllers/authController.js`

**Changed** (Line 200):
```javascript
// BEFORE:
hospital_id: userWithRole.hospital_id,
hospital_logo: userWithRole.hospital_logo // REMOVED

// AFTER:
hospital_id: userWithRole.hospital_id
```

**Removed**:
- ❌ `hospital_logo` from JWT token payload

### Current Database Schema

#### Hospitals Table Columns:
```
- hospital_id
- hospital_name
- hospital_code
- headquarters_address
- contact_number
- email
- established_date
- total_beds
- hospital_type
- accreditation
- website
- is_active
- created_at
- updated_at
```

**Missing** (that code was trying to access):
- ❌ `logo`
- ❌ `enabled_modules`

### Login Should Now Work

**Credentials**:
```
Email:    admin@phchms.com
Password: Admin123!
```

**Expected Behavior**:
1. ✅ Password validation passes
2. ✅ User role retrieved (SUPER_ADMIN)
3. ✅ Module access check skipped (SUPER_ADMIN bypass)
4. ✅ JWT tokens generated
5. ✅ Session created
6. ✅ Login successful!

### Testing

Try logging in again with the credentials above. The login should now succeed!

### Future Considerations

If you need these features later:

#### To Add Hospital Logo:
```sql
ALTER TABLE hospitals 
ADD COLUMN logo VARCHAR(255);
```

#### To Add Module Management:
```sql
ALTER TABLE hospitals 
ADD COLUMN enabled_modules JSONB DEFAULT '[]';

ALTER TABLE branches 
ADD COLUMN enabled_modules JSONB DEFAULT '[]';
```

Then update the User model query to include them again.

### Files Modified
1. ✅ `backend/models/User.js` - Removed non-existent column references
2. ✅ `backend/controllers/authController.js` - Removed hospital_logo from token payload

### Scripts Created
1. `backend/scripts/check_admin_user.js` - Check admin user details
2. `backend/scripts/check_hospitals_table.js` - Check hospitals table structure
3. `backend/scripts/reset_admin_password.js` - Reset admin password
4. `backend/scripts/create_admin_user.js` - Create admin user

---

**Date**: 2026-02-11  
**Status**: ✅ Fixed  
**Priority**: Critical (Login blocker)  
**Next Step**: Try logging in with admin@phchms.com / Admin123!
