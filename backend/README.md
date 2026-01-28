# Hospital Management System - Backend API

A comprehensive backend API for Hospital Management System built with Node.js, Express.js, and PostgreSQL.

## 🚀 Features

- **RESTful API** architecture
- **PostgreSQL** database with 24 interconnected tables
- **Secure** with Helmet and CORS
- **Error Handling** with centralized middleware
- **Connection Pooling** for optimal database performance
- **Environment-based** configuration
- **Auto-update timestamps** using PostgreSQL triggers

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v12 or higher)
- npm (comes with Node.js)

## 🛠️ Installation

### 1. Clone the repository and navigate to backend

```bash
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file and update it with your configuration:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hms_database
DB_USER=postgres
DB_PASSWORD=root

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 4. Set up the database

#### Option 1: Using psql command line

```bash
# Create database
psql -U postgres -c "CREATE DATABASE hms_database;"

# Run schema
psql -U postgres -d hms_database -f database/schema.sql
```

#### Option 2: Using PostgreSQL GUI (pgAdmin, DBeaver, etc.)

1. Open your PostgreSQL GUI tool
2. Create a new database named `hms_database`
3. Open and execute the `database/schema.sql` file

#### Option 3: Manual steps

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hms_database;

# Connect to the database
\c hms_database

# Exit psql
\q

# Run the schema file
psql -U postgres -d hms_database -f database/schema.sql
```

## 🚀 Running the Application

### Development mode (with auto-reload)

```bash
npm run dev
```

### Production mode

```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## 📡 API Endpoints

Once the server is running, you can access:

- **API Root**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/api/health`

### Available Endpoints (to be implemented)

- `/api/roles` - Role management
- `/api/hospitals` - Hospital management
- `/api/users` - User management
- `/api/branches` - Branch management
- `/api/departments` - Department management
- `/api/doctors` - Doctor management
- `/api/nurses` - Nurse management
- `/api/staff` - Staff management
- `/api/patients` - Patient management
- `/api/appointments` - Appointment management
- `/api/opd` - OPD entries management
- `/api/billings` - Billing management

## 🗄️ Database Schema

The database consists of 24 tables:

### Core Tables
1. **roles** - User roles and permissions
2. **hospitals** - Hospital information
3. **users** - System users
4. **branches** - Hospital branches
5. **departments** - Medical departments

### Personnel Tables
6. **staff** - General staff
7. **doctors** - Medical doctors
8. **nurses** - Nursing staff

### Mapping Tables
9. **branch_departments** - Branch-Department mapping
10. **staff_branches** - Staff-Branch assignments
11. **doctor_branches** - Doctor-Branch assignments
12. **doctor_departments** - Doctor-Department assignments
13. **doctor_branch_departments** - Doctor-Branch-Department mapping
14. **nurse_branches** - Nurse-Branch assignments

### Shift Management
15. **shifts** - Shift definitions
16. **shift_branches** - Shift-Branch mapping
17. **nurse_shifts** - Nurse shift assignments
18. **doctor_shifts** - Doctor shift assignments

### Patient Management
19. **patients** - Patient records
20. **appointments** - Appointment scheduling
21. **opd_entries** - Outpatient department entries

### Billing
22. **services** - Medical services catalog
23. **billings** - Billing records
24. **billing_items** - Individual billing items

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js              # Database connection configuration
├── database/
│   └── schema.sql         # PostgreSQL database schema
├── middleware/
│   └── errorHandler.js    # Error handling middleware
├── routes/
│   └── index.js           # Main route aggregator
├── .env                   # Environment variables (not in git)
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules
├── package.json           # Project dependencies
├── server.js              # Main application entry point
└── README.md              # This file
```

## 🔧 Configuration

### Database Connection Pool

The application uses PostgreSQL connection pooling with the following configuration:

- **Max clients**: 20
- **Idle timeout**: 30 seconds
- **Connection timeout**: 2 seconds

You can modify these settings in `config/db.js`.

### Security

The application includes:

- **Helmet.js** - Secures Express apps by setting various HTTP headers
- **CORS** - Cross-Origin Resource Sharing configured
- **Environment-based configuration** - Sensitive data in environment variables

## 🧪 Testing the API

You can test the API using:

- **cURL**
  ```bash
  curl http://localhost:5000/api/health
  ```

- **Postman** or **Insomnia**
- **Browser** for GET requests

## 🐛 Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running:
   ```bash
   # Windows (if installed as service)
   services.msc
   # Look for postgresql service
   ```

2. Verify database credentials in `.env` file

3. Check if the database exists:
   ```bash
   psql -U postgres -l
   ```

### Port Already in Use

If port 5000 is already in use, change the `PORT` variable in `.env` file.

### Module Not Found

Run `npm install` to ensure all dependencies are installed.

## 📝 Development Notes

- The `updated_at` columns are automatically updated via PostgreSQL triggers
- All ENUM types from MySQL have been converted to CHECK constraints in PostgreSQL
- JSON fields use JSONB type for better performance
- Indexes are created for frequently queried columns

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

ISC

## 👥 Support

For support, please contact the development team or open an issue in the repository.

---

**Built with ❤️ for better healthcare management**
