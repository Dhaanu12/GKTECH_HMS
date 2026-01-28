# Authentication System Documentation

## Overview

Complete JWT-based authentication system with:
- User registration and login
- Password hashing with bcrypt
- JWT access and refresh tokens
- Session management in database
- Role-based authorization
- Password reset functionality
- Multi-device session tracking

---

## Database Tables

### 1. user_sessions
Tracks active user sessions with JWT tokens.

**Columns:**
- `session_id` - Primary key
- `user_id` - Foreign key to users table
- `token_hash` - Hashed access token (SHA-256)
- `refresh_token_hash` - Hashed refresh token
- `device_info` - Device information
- `ip_address` - User's IP address
- `user_agent` - Browser user agent
- `is_active` - Session active status
- `expires_at` - Access token expiration
- `refresh_expires_at` - Refresh token expiration
- `last_activity` - Last activity timestamp

### 2. password_reset_tokens
Stores password reset tokens.

**Columns:**
- `reset_id` - Primary key
- `user_id` - Foreign key to users table
- `token_hash` - Hashed reset token
- `expires_at` - Token expiration (24 hours)
- `used` - Whether token has been used
- `used_at` - When token was used

---

## API Endpoints

### Public Endpoints (No Authentication)

#### Register User
```http
POST /api/auth/register

Request Body:
{
  "username": "johndoe",
  "email": "john@example.com",
  "phone_number": "9876543210",
  "password": "SecurePass123!",
  "role_id": 2
}

Response (201):
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "user_id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "role_id": 2,
      "is_active": true
    }
  }
}
```

#### Login
```http
POST /api/auth/login

Request Body:
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "deviceInfo": "Chrome on Windows" // optional
}

Response (200):
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "role_id": 2,
      "role_name": "Doctor",
      "role_code": "DOCTOR"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2024-12-10T10:00:00.000Z"
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh

Request Body:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response (200):
{
  "status": "success",
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2024-12-10T10:00:00.000Z"
  }
}
```

### Protected Endpoints (Authentication Required)

**Include in header:**
```
Authorization: Bearer <accessToken>
```

#### Get Current User
```http
GET /api/auth/me

Response (200):
{
  "status": "success",
  "data": {
    "user": {
      "user_id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "role_name": "Doctor",
      "role_code": "DOCTOR"
    }
  }
}
```

#### Logout
```http
POST /api/auth/logout

Response (200):
{
  "status": "success",
  "message": "Logged out successfully"
}
```

#### Logout from All Devices
```http
POST /api/auth/logout-all

Response (200):
{
  "status": "success",
  "message": "Logged out from 3 device(s) successfully"
}
```

#### Change Password
```http
POST /api/auth/change-password

Request Body:
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!"
}

Response (200):
{
  "status": "success",
  "message": "Password changed successfully. Please login again with your new password."
}
```

#### Get Active Sessions
```http
GET /api/auth/sessions

Response (200):
{
  "status": "success",
  "data": {
    "sessions": [
      {
        "session_id": 1,
        "device_info": "Chrome on Windows",
        "ip_address": "192.168.1.1",
        "last_activity": "2024-12-03T10:30:00.000Z",
        "created_at": "2024-12-03T10:00:00.000Z"
      }
    ]
  }
}
```

---

## Password Requirements

Passwords must meet the following criteria:
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (!@#$%^&*(),.?":{}|<>)

---

## Security Features

### 1. Password Hashing
- Uses bcrypt with salt rounds = 10
- Passwords never stored in plain text

### 2. Account Locking
- After 5 failed login attempts
- Account locked for 30 minutes
- Automatic unlock after timeout

### 3. Token Security
- JWT tokens signed with secret key
- Access tokens: 7 days expiration (configurable)
- Refresh tokens: 30 days expiration
- Tokens hashed (SHA-256) before storing in database

### 4. Session Management
- Each login creates a new session
- Sessions tracked per device
- Ability to logout from all devices
- Expired sessions automatically cleaned up

### 5. Session Validation
- Every request validates:
  - JWT token signature
  - Token expiration
  - Session exists in database
  - Session is active
  - User account is active
  - Account is not locked

---

## Using Authentication Middleware

### Protect Routes

```javascript
const { authenticate, authorize } = require('../middleware/auth');

// Require authentication
router.get('/protected', authenticate, (req, res) => {
  // req.user is available
  // req.userId is available
  // req.session is available
});

// Require specific role
router.get('/admin-only', 
  authenticate, 
  authorize('ADMIN', 'SUPER_ADMIN'),
  (req, res) => {
    // Only users with ADMIN or SUPER_ADMIN role can access
  }
);

// Optional authentication
const { optionalAuth } = require('../middleware/auth');
router.get('/public-or-private', optionalAuth, (req, res) => {
  if (req.user) {
    // User is logged in
  } else {
    // User is not logged in
  }
});
```

---

## Environment Variables

Add to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your_very_secure_secret_key_minimum_32_characters
JWT_REFRESH_SECRET=your_refresh_secret_key_different_from_main
JWT_EXPIRE=7d
```

**IMPORTANT:** Change these secrets in production!

---

## Testing with Postman/cURL

### 1. Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!@#",
    "role_id": 1
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### 3. Access Protected Route
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Database Setup

Run the authentication tables SQL:

```bash
psql -U postgres -d hms_database -f database/auth_tables.sql
```

Or manually in pgAdmin:
1. Open Query Tool
2. Load `database/auth_tables.sql`
3. Execute

---

## Common Issues & Solutions

### "Invalid or expired token"
- Token has expired (check JWT_EXPIRE)
- Token was invalidated (logout)
- Wrong JWT_SECRET in .env

### "Session has expired"
- Session was manually invalidated
- Session expired naturally
- User logged out from another device

### "Account is locked"
- Too many failed login attempts
- Wait 30 minutes or reset via database

### "Password does not meet requirements"
- Check password validation rules
- Must include uppercase, lowercase, number, special char
- Minimum 8 characters

---

## Code Examples

### Registration Flow
```javascript
const response = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    email: 'john@example.com',
    password: 'SecurePass123!',
    role_id: 2
  })
});

const data = await response.json();
console.log(data.data.user);
```

### Login & Store Token
```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123!'
  })
});

const data = await response.json();

// Store tokens (use httpOnly cookies in production)
localStorage.setItem('accessToken', data.data.accessToken);
localStorage.setItem('refreshToken', data.data.refreshToken);
```

### Making Authenticated Requests
```javascript
const token = localStorage.getItem('accessToken');

const response = await fetch('http://localhost:5000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.data.user);
```

### Token Refresh
```javascript
const refreshToken = localStorage.getItem('refreshToken');

const response = await fetch('http://localhost:5000/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});

const data = await response.json();
localStorage.setItem('accessToken', data.data.accessToken);
```

---

## Security Best Practices

1. **Never expose JWT secrets** - Use environment variables
2. **Use HTTPS in production** - Prevent token interception
3. **Implement rate limiting** - Prevent brute force attacks
4. **Regular session cleanup** - Remove expired sessions
5. **Monitor failed login attempts** - Detect suspicious activity
6. **Use refresh tokens** - Limit access token lifetime
7. **Secure password reset** - Time-limited tokens, email verification
8. **Audit logging** - Track authentication events

---

## Next Steps

1. ✅ Authentication system complete
2. 🔲 Implement email verification
3. 🔲 Add password reset via email
4. 🔲 Implement 2FA (Two-Factor Authentication)
5. 🔲 Add rate limiting
6. 🔲 Add audit logging
7. 🔲 Implement OAuth (Google, Facebook)
