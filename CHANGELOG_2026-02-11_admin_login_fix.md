# Admin User Management - 2026-02-11

## Issue Fixed
**Error**: `Invalid email or password` (401 Unauthorized)

### Problem
After reinitializing the database with schema.sql, the admin user's password was not matching the login credentials.

### Solution
Created scripts to manage admin user credentials and reset the password.

## ✅ Admin Password Reset Complete

### Current Login Credentials:
```
Email:    admin@phchms.com
Password: Admin123!
Username: superadmin
```

### Account Status:
- ✅ Account is **active**
- ✅ Account is **unlocked**
- ✅ Login attempts **reset to 0**
- ✅ Email is **verified**

## Scripts Created

### 1. Create Admin User
**File**: `backend/scripts/create_admin_user.js`

**Purpose**: Creates a new admin user if one doesn't exist

**Usage**:
```bash
cd backend
node scripts/create_admin_user.js
```

**What it does**:
- Creates ADMIN role if it doesn't exist
- Creates admin user with email `admin@phchms.com`
- Sets password to `Admin123!`
- Activates and verifies the account

### 2. Reset Admin Password
**File**: `backend/scripts/reset_admin_password.js`

**Purpose**: Resets admin password and unlocks account

**Usage**:
```bash
cd backend
node scripts/reset_admin_password.js
```

**What it does**:
- Resets password to `Admin123!`
- Unlocks the account (clears `locked_until`)
- Resets login attempts to 0
- Activates the account

## Testing Login

### Method 1: Using Frontend
1. Open your frontend application
2. Navigate to login page
3. Enter credentials:
   - Email: `admin@phchms.com`
   - Password: `Admin123!`
4. Click Login

### Method 2: Using API Directly
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@phchms.com",
    "password": "Admin123!"
  }'
```

### Expected Response:
```json
{
  "status": "success",
  "data": {
    "user": {
      "user_id": 1,
      "username": "superadmin",
      "email": "admin@phchms.com",
      "role_code": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Security Notes

### ⚠️ Important Security Recommendations:

1. **Change Default Password**:
   - Login with `Admin123!`
   - Immediately change to a strong, unique password
   - Use password manager to store it securely

2. **Password Requirements**:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

3. **Account Lockout**:
   - Account locks after 5 failed login attempts
   - Locked for 30 minutes
   - Use reset script to unlock if needed

## Troubleshooting

### Issue: "Invalid email or password"
**Solution**: Run the reset password script
```bash
node scripts/reset_admin_password.js
```

### Issue: "Account is locked"
**Solution**: The reset script also unlocks the account
```bash
node scripts/reset_admin_password.js
```

### Issue: "Account has been deactivated"
**Solution**: The reset script activates the account
```bash
node scripts/reset_admin_password.js
```

### Issue: User doesn't exist
**Solution**: Create the admin user first
```bash
node scripts/create_admin_user.js
```

## Database Queries

### Check if admin user exists:
```sql
SELECT user_id, username, email, is_active, login_attempts, locked_until
FROM users 
WHERE email = 'admin@phchms.com';
```

### Check admin role:
```sql
SELECT r.role_name, r.role_code, u.email
FROM users u
JOIN roles r ON u.role_id = r.role_id
WHERE u.email = 'admin@phchms.com';
```

### Manually unlock account:
```sql
UPDATE users 
SET 
    login_attempts = 0,
    locked_until = NULL,
    is_active = true
WHERE email = 'admin@phchms.com';
```

## Next Steps

After successful login:
1. ✅ Change the default password
2. ✅ Create additional admin users if needed
3. ✅ Set up other roles (DOCTOR, NURSE, etc.)
4. ✅ Configure user permissions

---

**Date**: 2026-02-11  
**Status**: ✅ Fixed and Tested  
**Priority**: Critical (Login blocker)
