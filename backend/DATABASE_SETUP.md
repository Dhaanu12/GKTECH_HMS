# Database Setup Instructions for PHC HMS

## Method 1: Using pgAdmin (Recommended)

1. **Open pgAdmin** and connect to your PostgreSQL server

2. **Create Database:**
   - Right-click on "Databases"
   - Select "Create" → "Database"
   - Database name: `hms_database`
   - Click "Save"

3. **Run SQL Files in Order:**
   
   Open the Query Tool for `hms_database` and execute these files in order:

   **Step 1: Core Schema**
   - File: `backend/database/schema.sql`
   - This creates all tables (hospitals, branches, doctors, nurses, patients, etc.)

   **Step 2: Authentication Tables**
   - File: `backend/database/auth_tables.sql`
   - This creates user_sessions and password_reset_tokens tables

   **Step 3: Seed Roles**
   - File: `backend/database/seed_data.sql`
   - This inserts default roles (SUPER_ADMIN, CLIENT_ADMIN, DOCTOR, NURSE, RECEPTIONIST, etc.)

   **Step 4: Create Super Admin**
   - File: `backend/database/create_super_admin.sql`
   - This creates the super admin user with credentials:
     - **Email:** admin@phchms.com
     - **Password:** Admin123!

4. **Verify Setup:**
   ```sql
   -- Check if tables exist
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';

   -- Check roles
   SELECT * FROM roles;

   -- Check super admin user
   SELECT u.username, u.email, r.role_name 
   FROM users u 
   JOIN roles r ON u.role_id = r.role_id;
   ```

## Method 2: Command Line (if psql is in PATH)

```bash
cd backend
psql -U postgres -c "CREATE DATABASE hms_database;"
psql -U postgres -d hms_database -f database/schema.sql
psql -U postgres -d hms_database -f database/auth_tables.sql
psql -U postgres -d hms_database -f database/seed_data.sql
psql -U postgres -d hms_database -f database/create_super_admin.sql
```

## Troubleshooting

### Tables not showing in pgAdmin?
1. **Refresh the database** - Right-click on `hms_database` → Refresh
2. **Expand Tables** - Navigate to: Databases → hms_database → Schemas → public → Tables
3. **Check for errors** - Review the query output for any error messages

### Common Issues:

**Issue: "relation already exists"**
- Solution: Database was partially created. You can either:
  - Drop and recreate: `DROP DATABASE hms_database;` then start over
  - Or skip existing tables and continue

**Issue: "role not found"**
- Solution: Make sure `seed_data.sql` ran successfully before `create_super_admin.sql`

**Issue: Backend won't start**
- Solution: Check `.env` file has correct database credentials:
  ```
  DB_HOST=localhost
  DB_PORT=5432
  DB_USER=postgres
  DB_PASSWORD=your_password
  DB_NAME=hms_database
  ```

## Default Credentials

After successful setup, use these credentials to login:

- **Super Admin:**
  - Email: `admin@phchms.com`
  - Password: `Admin123!`

## Starting the Backend

```bash
cd backend
npm run dev
```

Server should start on: `http://localhost:5000`

## Testing the Setup

1. **Check database connection:**
   - Visit: `http://localhost:5000/api/health`
   - Should return: `{"status":"success","message":"API is running"}`

2. **Test login:**
   - POST to `http://localhost:5000/api/auth/login`
   - Body: `{"email":"admin@phchms.com","password":"Admin123!"}`
   - Should return a JWT token

3. **Or use the frontend:**
   - Visit: `http://localhost:3000/login`
   - Login with super admin credentials
