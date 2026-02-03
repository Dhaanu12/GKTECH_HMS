# Authentication System - Quick Start Guide

## Setup Instructions

### 1. Update Environment Variables

Make sure your `.env` file has these JWT secrets (they should already be there):

```env
JWT_SECRET=hms_secret_key_2024_change_this_in_production
JWT_REFRESH_SECRET=hms_refresh_secret_2024_change_this_in_production
JWT_EXPIRE=7d
```

### 2. Run Authentication Tables SQL

You need to add the session tables to your database:

**Option A: Using pgAdmin**
1. Open pgAdmin
2. Connect to `hms_database`
3. Open Query Tool
4. Load file: `backend/database/auth_tables.sql`
5. Execute (F5)

**Option B: Using psql**
```bash
psql -U postgres -d hms_database -f database/auth_tables.sql
```

This creates:
- `user_sessions` table
- `password_reset_tokens` table
- Indexes and triggers

### 3. Start the Server

```bash
cd backend
npm run dev
```

Server should show:
```
🚀 Server running in development mode on port 5000
📍 API available at http://localhost:5000/api
✅ Database connection verified
```

---

## Testing Authentication

### Step 1: Register a New User

**Request:**
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "testdoctor",
  "email": "doctor@hms.com",
  "phone_number": "9876543210",
  "password": "Doctor123!@#",
  "role_id": 1
}
```

**Expected Response (201):**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "user_id": 1,
      "username": "testdoctor",
      "email": "doctor@hms.com",
      "phone_number": "9876543210",
      "role_id": 1,
      "is_active": true,
      "is_email_verified": false
    }
  }
}
```

### Step 2: Login

**Request:**
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "doctor@hms.com",
  "password": "Doctor123!@#"
}
```

**Expected Response (200):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": 1,
      "username": "testdoctor",
      "email": "doctor@hms.com",
      "role_id": 1,
      "role_name": "...",
      "role_code": "..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2024-12-10T10:00:00.000Z"
  }
}
```

**Copy the accessToken for next steps!**

### Step 3: Get Current User Info

**Request:**
```http
GET http://localhost:5000/api/auth/me
Authorization: Bearer <YOUR_ACCESS_TOKEN>
```

**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "user_id": 1,
      "username": "testdoctor",
      "email": "doctor@hms.com",
      "role_name": "...",
      "role_code": "..."
    }
  }
}
```

### Step 4: Get Active Sessions

**Request:**
```http
GET http://localhost:5000/api/auth/sessions
Authorization: Bearer <YOUR_ACCESS_TOKEN>
```

**Expected Response (200):**
```json
{
  "status": "success",
  "data": {
    "sessions": [
      {
        "session_id": 1,
        "device_info": "...",
        "ip_address": "::1",
        "last_activity": "2024-12-03T...",
        "created_at": "2024-12-03T..."
      }
    ]
  }
}
```

### Step 5: Logout

**Request:**
```http
POST http://localhost:5000/api/auth/logout
Authorization: Bearer <YOUR_ACCESS_TOKEN>
```

**Expected Response (200):**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

## Using Postman

### Import Collection

Create a Postman collection with these requests:

**1. Register**
- Method: POST
- URL: `http://localhost:5000/api/auth/register`
- Body (raw JSON):
```json
{
  "username": "testuser",
  "email": "test@hms.com",
  "password": "Test123!@#",
  "role_id": 1
}
```

**2. Login**
- Method: POST
- URL: `http://localhost:5000/api/auth/login`
- Body (raw JSON):
```json
{
  "email": "test@hms.com",
  "password": "Test123!@#"
}
```

**3. Get Current User**
- Method: GET
- URL: `http://localhost:5000/api/auth/me`
- Headers: `Authorization: Bearer {{accessToken}}`

**Tip:** Save the accessToken from login response to a Postman variable.

---

## Available Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login user |
| POST | `/api/auth/refresh` | ❌ | Refresh access token |
| GET | `/api/auth/me` | ✅ | Get current user |
| POST | `/api/auth/logout` | ✅ | Logout current session |
| POST | `/api/auth/logout-all` | ✅ | Logout all sessions |
| POST | `/api/auth/change-password` | ✅ | Change password |
| GET | `/api/auth/sessions` | ✅ | Get active sessions |

---

## Testing Scenarios

### ✅ Valid Registration
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "MySecure123!",
  "role_id": 1
}
```

### ❌ Weak Password
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "weak",  // Too short, no special chars
  "role_id": 1
}
```
**Error:** "Password must be at least 8 characters long, ..."

### ❌ Duplicate Email
Register same email twice
**Error:** "User with this email already exists"

### ❌ Wrong Password on Login
```json
{
  "email": "john@example.com",
  "password": "WrongPassword"
}
```
**Error:** "Invalid email or password"

### ✅ Token Refresh
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## Troubleshooting

### Server won't start
- Check if PostgreSQL is running
- Verify database `hms_database` exists
- Check `.env` file has correct credentials

### "Database connection failed"
- Run schema files:
  1. `database/schema.sql` (main tables)
  2. `database/auth_tables.sql` (session tables)

### "Invalid or expired token"
- Token expired (check JWT_EXPIRE in .env)
- Wrong JWT_SECRET
- Session was logged out

### "User with this email already exists"
- Email must be unique
- Use different email or delete existing user

---

## What's Implemented

✅ User Registration with validation
✅ Password hashing (bcrypt)
✅ User Login with JWT tokens
✅ Access & Refresh tokens
✅ Session management in database
✅ Protected routes with middleware
✅ Role-based authorization
✅ Password change
✅ Logout from one or all devices
✅ Active session tracking
✅ Account locking after failed attempts
✅ Password strength validation

---

## Next Steps

After testing authentication:
1. Create role management endpoints
2. Build patient management APIs
3. Implement doctor/nurse management
4. Create appointment system
5. Build billing system

---

## Files Created

```
backend/
├── database/
│   └── auth_tables.sql          # Session & reset token tables
├── utils/
│   └── authUtils.js             # Password & JWT utilities
├── models/
│   ├── UserSession.js           # Session model
│   └── PasswordResetToken.js    # Reset token model
├── middleware/
│   └── auth.js                  # Auth & authorization middleware
├── controllers/
│   └── authController.js        # Auth endpoints logic
├── routes/
│   └── authRoutes.js            # Auth routes
└── docs/
    └── AUTHENTICATION.md        # Full documentation
```

Ready to build the rest of the HMS application! 🚀
