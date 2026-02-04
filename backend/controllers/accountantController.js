const InsuranceClaim = require('../models/InsuranceClaim');
const xlsx = require('xlsx');
const fs = require('fs');
const { pool } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const User = require('../models/User');
const Role = require('../models/Role');
const Staff = require('../models/Staff');
const { PasswordUtils } = require('../utils/authUtils');

exports.uploadClaims = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please upload a file'
            });
        }

        const { branch_id, hospital_id } = req.body;

        console.log('uploadClaims - User:', {
            userId: req.user.user_id,
            role_code: req.user.role_code,
            branch_id,
            hospital_id
        });

        // For accountants, validate they have access to the specified branch
        if (['ACCOUNTANT', 'ACCOUNTANT_MANAGER'].includes(req.user.role_code)) {
            console.log('ACCOUNTANT detected - checking access');
            const db = require('../config/db');
            const client = await db.getClient();

            try {
                const accessQuery = `
                    SELECT DISTINCT b.hospital_id, b.branch_id
                    FROM users u
                    JOIN staff s ON u.user_id = s.user_id
                    JOIN staff_branches sb ON s.staff_id = sb.staff_id
                    JOIN branches b ON sb.branch_id = b.branch_id
                    WHERE u.user_id = $1 AND sb.is_active = true
                `;
                const accessResult = await client.query(accessQuery, [req.user.user_id]);

                console.log('Access query result:', accessResult.rows);

                if (accessResult.rows.length === 0) {
                    console.log('NO STAFF/BRANCH ASSIGNMENTS FOUND');
                    return res.status(403).json({
                        status: 'fail',
                        message: 'Access denied: You do not have permission to upload claims'
                    });
                }

                const allowedHospitalIds = accessResult.rows.map(row => row.hospital_id);

                // Validate hospital_id is in allowed hospitals
                if (!allowedHospitalIds.includes(parseInt(hospital_id))) {
                    return res.status(403).json({
                        status: 'fail',
                        message: 'Access denied: You can only upload claims for your assigned hospital'
                    });
                }
            } finally {
                client.release();
            }
        }

        const filePath = req.file.path;
        let claims = [];

        // Parse file based on extension
        if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || req.file.mimetype === 'application/vnd.ms-excel') {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            claims = xlsx.utils.sheet_to_json(sheet);
        } else if (req.file.mimetype === 'text/csv' || req.file.mimetype === 'application/vnd.ms-excel') {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            claims = xlsx.utils.sheet_to_json(sheet);
        } else {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            claims = xlsx.utils.sheet_to_json(sheet);
        }

        const normalizeKey = (key) => key.trim().toLowerCase().replace(/[\s\-\.]+/g, '_');

        const formattedClaims = claims.map(row => {
            const newRow = {};
            for (const key in row) {
                const normalized = normalizeKey(key);
                if (normalized === 's_no') newRow.s_no = row[key];
                if (normalized === 'ip_no') newRow.ip_no = row[key];
                if (normalized === 'patient_name') newRow.patient_name = row[key];
                if (normalized === 'dr_name') newRow.doctor_name = row[key];
                if (normalized === 'approval_no') newRow.approval_no = row[key];
                if (normalized === 'from_date_admission') newRow.admission_date = parseDate(row[key]);
                if (normalized === 'to_date_discharge') newRow.discharge_date = parseDate(row[key]);
                if (normalized === 'dept') newRow.department = row[key];
                if (normalized === 'insurance_name') newRow.insurance_name = row[key];
                if (normalized === 'bill_amount') newRow.bill_amount = parseNumeric(row[key]);
                if (normalized === 'advance_amount') newRow.advance_amount = parseNumeric(row[key]);
                if (normalized === 'co_pay') newRow.co_pay = parseNumeric(row[key]);
                if (normalized === 'discount') newRow.discount = parseNumeric(row[key]);
                if (normalized === 'approval_amount') newRow.approval_amount = parseNumeric(row[key]);
                if (normalized === 'amount_receviced') newRow.amount_received = parseNumeric(row[key]);
                if (normalized === 'amount_received') newRow.amount_received = parseNumeric(row[key]);
                if (normalized === 'pending_amount') newRow.pending_amount = parseNumeric(row[key]);
                if (normalized === 'tds') newRow.tds = parseNumeric(row[key]);
                if (normalized === 'bank_name') newRow.bank_name = row[key];
                if (normalized === 'date') newRow.transaction_date = parseDate(row[key]);
                if (normalized === 'utr_no') newRow.utr_no = row[key];
                if (normalized === 'remakrs') newRow.remarks = row[key];
                if (normalized === 'remarks') newRow.remarks = row[key];
            }
            return newRow;
        });

        const result = await InsuranceClaim.createBulk(formattedClaims, branch_id, hospital_id);

        // Clean up file
        fs.unlinkSync(filePath);

        res.status(200).json({
            status: 'success',
            count: result.length,
            message: 'Claims uploaded successfully',
            data: result
        });

    } catch (err) {
        if (req.file) fs.unlinkSync(req.file.path);
        next(err);
    }
};

exports.getClaims = async (req, res, next) => {
    try {
        const { branch_id, month, year } = req.query;

        const db = require('../config/db');
        const client = await db.getClient();

        try {
            let whereClause = 'WHERE 1=1';
            const values = [];
            let paramIndex = 1;

            // DEBUG: Log user object
            console.log('getClaims - User object:', {
                userId: req.user.user_id,
                role_code: req.user.role_code,
                userRole: req.userRole,
                fullUser: req.user
            });

            // For accountants, automatically filter by their assigned hospital
            if (['ACCOUNTANT', 'ACCOUNTANT_MANAGER'].includes(req.user.role_code)) {
                console.log('ACCOUNTANT role detected - adding hospital filter');
                const userHospitalQuery = `
                    SELECT DISTINCT b.hospital_id
                    FROM users u
                    JOIN staff s ON u.user_id = s.user_id
                    JOIN staff_branches sb ON s.staff_id = sb.staff_id
                    JOIN branches b ON sb.branch_id = b.branch_id
                    WHERE u.user_id = $1 AND sb.is_active = true
                `;
                const userHospitals = await client.query(userHospitalQuery, [req.user.user_id]);

                console.log('User hospitals:', userHospitals.rows);

                if (userHospitals.rows.length === 0) {
                    return res.status(200).json({
                        status: 'success',
                        count: 0,
                        data: []
                    });
                }

                const hospitalIds = userHospitals.rows.map(row => row.hospital_id);
                whereClause += ` AND hospital_id = ANY($${paramIndex})`;
                values.push(hospitalIds);
                paramIndex++;
                console.log('Hospital filter applied:', hospitalIds);
            } else {
                console.log('NOT ACCOUNTANT - role_code:', req.user.role_code);
            }

            if (branch_id) {
                whereClause += ` AND branch_id = $${paramIndex}`;
                values.push(branch_id);
                paramIndex++;
            }

            if (month && year && month !== 'ALL' && year !== 'ALL') {
                const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
                const endDate = new Date(year, month, 0).toISOString().split('T')[0];

                whereClause += ` AND admission_date >= $${paramIndex}`;
                values.push(startDate);
                paramIndex++;

                whereClause += ` AND admission_date <= $${paramIndex}`;
                values.push(endDate);
                paramIndex++;
            } else if (year && year !== 'ALL') {
                const startDate = `${year}-01-01`;
                const endDate = `${year}-12-31`;
                whereClause += ` AND admission_date >= $${paramIndex} AND admission_date <= $${paramIndex + 1}`;
                values.push(startDate, endDate);
                paramIndex += 2;
            }

            const query = `SELECT * FROM insurance_claims ${whereClause} ORDER BY claim_id DESC`;
            const result = await client.query(query, values);

            res.status(200).json({
                status: 'success',
                count: result.rows.length,
                data: result.rows
            });
        } finally {
            client.release();
        }
    } catch (err) {
        next(err);
    }
};

exports.getReports = async (req, res, next) => {
    try {
        const { startDate, endDate, insuranceName, statusFilter, paymentFilter, page = 1, limit = 10, download, branch_id } = req.query;

        let shouldDownload = download === 'true';
        const offset = (page - 1) * limit;

        const db = require('../config/db');
        const client = await db.getClient();

        try {
            let whereClause = 'WHERE 1=1';
            const values = [];
            let paramIndex = 1;

            // For accountants, automatically filter by their assigned hospital
            if (['ACCOUNTANT', 'ACCOUNTANT_MANAGER'].includes(req.user.role_code)) {
                const userHospitalQuery = `
                    SELECT DISTINCT b.hospital_id
                    FROM users u
                    JOIN staff s ON u.user_id = s.user_id
                    JOIN staff_branches sb ON s.staff_id = sb.staff_id
                    JOIN branches b ON sb.branch_id = b.branch_id
                    WHERE u.user_id = $1 AND sb.is_active = true
                `;
                const userHospitals = await client.query(userHospitalQuery, [req.user.user_id]);

                if (userHospitals.rows.length === 0) {
                    return res.status(200).json({
                        status: 'success',
                        count: 0,
                        total: 0,
                        data: []
                    });
                }

                const hospitalIds = userHospitals.rows.map(row => row.hospital_id);
                whereClause += ` AND hospital_id = ANY($${paramIndex})`;
                values.push(hospitalIds);
                paramIndex++;
            }

            // Date Filter
            if (startDate) {
                whereClause += ` AND admission_date >= $${paramIndex}`;
                values.push(startDate);
                paramIndex++;
            }
            if (endDate) {
                whereClause += ` AND admission_date <= $${paramIndex}`;
                values.push(endDate);
                paramIndex++;
            }

            if (branch_id) {
                whereClause += ` AND branch_id = $${paramIndex}`;
                values.push(branch_id);
                paramIndex++;
            }

            // Insurance Company Filter
            if (insuranceName && insuranceName !== 'ALL') {
                whereClause += ` AND insurance_name = $${paramIndex}`;
                values.push(insuranceName);
                paramIndex++;
            }

            // Payment Status Filter
            if (paymentFilter === 'RECEIVED') {
                whereClause += ` AND pending_amount <= 0 AND approval_amount > 0`;
            } else if (paymentFilter === 'NOT_RECEIVED') {
                whereClause += ` AND amount_received = 0 AND approval_amount > 0`;
            } else if (paymentFilter === 'PENDING') {
                whereClause += ` AND pending_amount > 0 AND approval_amount > 0`;
            }

            // Risk Logic / Condition Filters
            if (statusFilter === 'LOW_APPROVAL') {
                whereClause += ` AND bill_amount > 0 AND approval_amount < (bill_amount * 0.6)`;
            } else if (statusFilter === 'LOW_RECEIVED') {
                whereClause += ` AND approval_amount > 0 AND amount_received < (approval_amount * 0.8)`;
            }

            if (req.query.fetchAll === 'true') {
                // Fetch ALL matching records for client-side processing
                const query = `SELECT * FROM insurance_claims ${whereClause} ORDER BY admission_date DESC`;
                const dbRes = await client.query(query, values);
                return res.status(200).json({
                    status: 'success',
                    data: dbRes.rows
                });
            }

            if (shouldDownload) {
                // Fetch ALL matching records for download
                const query = `SELECT * FROM insurance_claims ${whereClause} ORDER BY admission_date DESC`;
                const dbRes = await client.query(query, values);
                const rows = dbRes.rows;

                // Generate Excel
                const workbook = xlsx.utils.book_new();
                const worksheet = xlsx.utils.json_to_sheet(rows);
                xlsx.utils.book_append_sheet(workbook, worksheet, 'Reports');

                const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

                res.setHeader('Content-Disposition', 'attachment; filename="Claims_Report.xlsx"');
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                return res.send(buffer);

            } else {
                // Pagination Logic
                // 1. Get Total Count
                const countQuery = `SELECT COUNT(*) FROM insurance_claims ${whereClause}`;
                const countRes = await client.query(countQuery, values);
                const totalCount = parseInt(countRes.rows[0].count);

                // 2. Get Paginated Data
                const query = `SELECT * FROM insurance_claims ${whereClause} ORDER BY admission_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
                const paginatedValues = [...values, limit, offset];

                const dbRes = await client.query(query, paginatedValues);

                res.status(200).json({
                    status: 'success',
                    count: dbRes.rows.length,
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    currentPage: parseInt(page),
                    data: dbRes.rows
                });
            }

        } finally {
            client.release();
        }

    } catch (err) {
        next(err);
    }
};

exports.getClaimByApprovalNo = async (req, res, next) => {
    try {
        console.log('[DEBUG] Searching for Approval No:', req.params.approvalNo);
        const { approvalNo } = req.params;
        const db = require('../config/db');
        const client = await db.getClient();

        try {
            // Check access rights
            let hospitalFilter = '';
            const queryParams = [approvalNo];

            if (['ACCOUNTANT', 'ACCOUNTANT_MANAGER'].includes(req.user.role_code)) {
                // Get allowed hospitals
                const userHospitalQuery = `
                    SELECT DISTINCT b.hospital_id
                    FROM users u
                    JOIN staff s ON u.user_id = s.user_id
                    JOIN staff_branches sb ON s.staff_id = sb.staff_id
                    JOIN branches b ON sb.branch_id = b.branch_id
                    WHERE u.user_id = $1 AND sb.is_active = true
                `;
                const userHospitals = await client.query(userHospitalQuery, [req.user.user_id]);
                const hospitalIds = userHospitals.rows.map(row => row.hospital_id);

                if (hospitalIds.length > 0) {
                    hospitalFilter = ` AND hospital_id = ANY($2)`;
                    queryParams.push(hospitalIds);
                } else {
                    return res.status(404).json({
                        status: 'fail',
                        message: 'Claim not found or access denied'
                    });
                }
            }

            const query = `
                SELECT * FROM insurance_claims 
                WHERE approval_no = $1 ${hospitalFilter}
            `;

            const result = await client.query(query, queryParams);
            console.log('[DEBUG] Query Result Length:', result.rows.length);
            console.log('[DEBUG] Query executed:', query);
            console.log('[DEBUG] Query Params:', queryParams);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Claim not found with this approval number'
                });
            }

            res.status(200).json({
                status: 'success',
                data: result.rows[0]
            });

        } finally {
            client.release();
        }
    } catch (err) {
        next(err);
    }
};

exports.updateClaimPayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const db = require('../config/db');
        const client = await db.getClient();

        try {
            // 1. Verify existence and access
            let hospitalFilter = '';
            const checkParams = [id];

            if (['ACCOUNTANT', 'ACCOUNTANT_MANAGER'].includes(req.user.role_code)) {
                const userHospitalQuery = `
                    SELECT DISTINCT b.hospital_id
                    FROM users u
                    JOIN staff s ON u.user_id = s.user_id
                    JOIN staff_branches sb ON s.staff_id = sb.staff_id
                    JOIN branches b ON sb.branch_id = b.branch_id
                    WHERE u.user_id = $1 AND sb.is_active = true
                `;
                const userHospitals = await client.query(userHospitalQuery, [req.user.user_id]);
                const hospitalIds = userHospitals.rows.map(row => row.hospital_id);

                if (hospitalIds.length > 0) {
                    hospitalFilter = ` AND hospital_id = ANY($2)`;
                    checkParams.push(hospitalIds);
                } else {
                    return res.status(403).json({
                        status: 'fail',
                        message: 'Access denied'
                    });
                }
            }

            const checkQuery = `SELECT * FROM insurance_claims WHERE claim_id = $1 ${hospitalFilter}`;
            const checkResult = await client.query(checkQuery, checkParams);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Claim not found or access denied'
                });
            }

            const currentClaim = checkResult.rows[0];

            // Check if already updated - One-time update policy
            if (currentClaim.is_updated === 1) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'This claim has already been updated once and cannot be modified again.'
                });
            }

            // 2. Prepare Update
            // Allow updating: amount_received, tds, transaction_date, bank_name, utr_no, remarks, co_pay, discount
            // Also update pending_amount automatically

            // Disable auto calculation for pending_amount as per request
            // const amountReceivedVal = updateData.amount_received; ...

            const fields = [];
            const values = [];
            let paramIndex = 1;

            const fieldsToUpdate = ['amount_received', 'tds', 'transaction_date', 'bank_name', 'utr_no', 'remarks', 'co_pay', 'discount', 'advance_amount', 'moc_discount', 'number_field_1', 'system_notes', 'pending_amount'];
            const numericFields = ['amount_received', 'tds', 'co_pay', 'discount', 'advance_amount', 'moc_discount', 'number_field_1', 'pending_amount'];

            fieldsToUpdate.forEach(field => {
                if (updateData[field] !== undefined) {
                    let value = updateData[field];

                    // Handle empty dates
                    if (field === 'transaction_date' && value === '') {
                        value = null;
                    }

                    // Handle empty/invalid numeric fields
                    if (numericFields.includes(field)) {
                        if (value === '' || value === null) {
                            value = 0;
                        } else {
                            // Ensure it's a number (optional, but good for safety) or keep string if DB handles coercion (Postgres does if it looks like number)
                            // But empty string "" causes error so we handled it above.
                        }
                    }

                    fields.push(`${field} = $${paramIndex}`);
                    values.push(value);
                    paramIndex++;
                }
            });

            // Set is_updated = 1
            fields.push(`is_updated = $${paramIndex}`);
            values.push(1);
            paramIndex++;

            values.push(id); // For WHERE clause

            const updateQuery = `
                UPDATE insurance_claims
                SET ${fields.join(', ')}
                WHERE claim_id = $${paramIndex}
                RETURNING *
            `;

            const updateResult = await client.query(updateQuery, values);

            res.status(200).json({
                status: 'success',
                message: 'Payment details updated successfully',
                data: updateResult.rows[0]
            });

        } finally {
            client.release();
        }
    } catch (err) {
        next(err);
    }
};

exports.getInsuranceCompanies = async (req, res, next) => {
    try {
        const { branch_id } = req.query;
        let query = `SELECT DISTINCT insurance_name FROM insurance_claims WHERE insurance_name IS NOT NULL AND insurance_name != ''`;
        const values = [];

        if (branch_id) {
            query += ` AND branch_id = $1`;
            values.push(branch_id);
        }

        query += ` ORDER BY insurance_name ASC`;

        const db = require('../config/db');
        const client = await db.getClient();
        try {
            const result = await client.query(query, values);
            const companies = result.rows.map(r => r.insurance_name);

            res.status(200).json({
                status: 'success',
                data: companies
            });
        } finally {
            client.release();
        }
    } catch (err) {
        next(err);
    }
};


// --- Get Accountant's Assigned Branches ---
exports.getAssignedBranches = async (req, res, next) => {
    try {
        const db = require('../config/db');
        const client = await db.getClient();

        try {
            // First, get the hospital(s) the accountant is assigned to
            const hospitalQuery = `
                SELECT DISTINCT b.hospital_id
                FROM users u
                JOIN staff s ON u.user_id = s.user_id
                JOIN staff_branches sb ON s.staff_id = sb.staff_id
                JOIN branches b ON sb.branch_id = b.branch_id
                WHERE u.user_id = $1 AND sb.is_active = true
            `;

            const hospitalResult = await client.query(hospitalQuery, [req.user.user_id]);

            if (hospitalResult.rows.length === 0) {
                return res.status(200).json({
                    status: 'success',
                    data: { branches: [] }
                });
            }

            // Get all branches from those hospital(s)
            const hospitalIds = hospitalResult.rows.map(row => row.hospital_id);

            const branchesQuery = `
                SELECT DISTINCT 
                    b.branch_id,
                    b.branch_name,
                    b.branch_code,
                    b.hospital_id,
                    h.hospital_name
                FROM branches b
                JOIN hospitals h ON b.hospital_id = h.hospital_id
                WHERE b.hospital_id = ANY($1) AND b.is_active = true
                ORDER BY b.branch_name
            `;

            const result = await client.query(branchesQuery, [hospitalIds]);

            res.status(200).json({
                status: 'success',
                data: {
                    branches: result.rows
                }
            });
        } finally {
            client.release();
        }
    } catch (err) {
        next(err);
    }
};


// --- Analytics Endpoints ---

exports.getHospitalBranchAnalytics = async (req, res, next) => {
    try {
        const db = require('../config/db');
        const client = await db.getClient();

        try {
            // Get the hospital(s) the accountant is assigned to
            const userHospitalQuery = `
                SELECT DISTINCT b.hospital_id
                FROM users u
                JOIN staff s ON u.user_id = s.user_id
                JOIN staff_branches sb ON s.staff_id = sb.staff_id
                JOIN branches b ON sb.branch_id = b.branch_id
                WHERE u.user_id = $1 AND sb.is_active = true
            `;
            const userHospitals = await client.query(userHospitalQuery, [req.user.user_id]);

            if (userHospitals.rows.length === 0) {
                return res.status(200).json({
                    status: 'success',
                    data: []
                });
            }

            const hospitalIds = userHospitals.rows.map(row => row.hospital_id);

            let query = `
                SELECT 
                    h.hospital_id,
                    h.hospital_name,
                    b.branch_id,
                    b.branch_name,
                    COUNT(ic.claim_id) as total_claims,
                    COALESCE(SUM(ic.bill_amount), 0) as total_bill_amount,
                    COALESCE(SUM(ic.approval_amount), 0) as total_approval_amount,
                    COALESCE(SUM(ic.amount_received), 0) as total_amount_received,
                    COALESCE(SUM(ic.pending_amount), 0) as total_pending_amount
                FROM hospitals h
                LEFT JOIN branches b ON h.hospital_id = b.hospital_id
                LEFT JOIN insurance_claims ic ON b.branch_id = ic.branch_id
                WHERE h.is_active = true 
                  AND h.hospital_id = ANY($1)
                GROUP BY h.hospital_id, h.hospital_name, b.branch_id, b.branch_name
                ORDER BY h.hospital_name, b.branch_name
            `;

            console.log('Hospital-Branch Query - Hospital IDs:', hospitalIds);
            const result = await client.query(query, [hospitalIds]);
            console.log('Hospital-Branch Query - Rows returned:', result.rows.length);
            console.log('Hospital-Branch Query - Sample rows:', JSON.stringify(result.rows, null, 2));

            // Group by hospital
            const hospitalsMap = {};
            result.rows.forEach(row => {
                if (!hospitalsMap[row.hospital_id]) {
                    hospitalsMap[row.hospital_id] = {
                        hospital_id: row.hospital_id,
                        hospital_name: row.hospital_name,
                        branches: [],
                        hospital_totals: {
                            total_claims: 0,
                            total_bill_amount: 0,
                            total_approval_amount: 0,
                            total_amount_received: 0,
                            total_pending_amount: 0
                        }
                    };
                }

                if (row.branch_id) {
                    const branchData = {
                        branch_id: row.branch_id,
                        branch_name: row.branch_name,
                        total_claims: parseInt(row.total_claims) || 0,
                        total_bill_amount: parseFloat(row.total_bill_amount) || 0,
                        total_approval_amount: parseFloat(row.total_approval_amount) || 0,
                        total_amount_received: parseFloat(row.total_amount_received) || 0,
                        total_pending_amount: parseFloat(row.total_pending_amount) || 0
                    };

                    hospitalsMap[row.hospital_id].branches.push(branchData);

                    // Aggregate hospital totals
                    hospitalsMap[row.hospital_id].hospital_totals.total_claims += branchData.total_claims;
                    hospitalsMap[row.hospital_id].hospital_totals.total_bill_amount += branchData.total_bill_amount;
                    hospitalsMap[row.hospital_id].hospital_totals.total_approval_amount += branchData.total_approval_amount;
                    hospitalsMap[row.hospital_id].hospital_totals.total_amount_received += branchData.total_amount_received;
                    hospitalsMap[row.hospital_id].hospital_totals.total_pending_amount += branchData.total_pending_amount;
                }
            });

            res.status(200).json({
                status: 'success',
                data: Object.values(hospitalsMap)
            });
        } finally {
            client.release();
        }
    } catch (err) {
        next(err);
    }
};

exports.getInsurerAnalytics = async (req, res, next) => {
    try {
        const db = require('../config/db');
        const client = await db.getClient();

        try {
            // Get the hospital(s) the accountant is assigned to
            const userHospitalQuery = `
                SELECT DISTINCT b.hospital_id
                FROM users u
                JOIN staff s ON u.user_id = s.user_id
                JOIN staff_branches sb ON s.staff_id = sb.staff_id
                JOIN branches b ON sb.branch_id = b.branch_id
                WHERE u.user_id = $1 AND sb.is_active = true
            `;
            const userHospitals = await client.query(userHospitalQuery, [req.user.user_id]);

            if (userHospitals.rows.length === 0) {
                return res.status(200).json({
                    status: 'success',
                    data: { insurers: [], summary: { total_insurers: 0, total_claims: 0, total_bill_amount: 0 } }
                });
            }

            const hospitalIds = userHospitals.rows.map(row => row.hospital_id);

            let query = `
                SELECT 
                    ic.insurance_name,
                    COUNT(ic.claim_id) as total_claims,
                    COALESCE(SUM(ic.bill_amount), 0) as total_bill_amount,
                    COALESCE(SUM(ic.approval_amount), 0) as total_approval_amount,
                    COALESCE(SUM(ic.amount_received), 0) as total_amount_received,
                    COALESCE(SUM(ic.pending_amount), 0) as total_pending_amount,
                    COALESCE(AVG(ic.bill_amount), 0) as avg_bill_amount,
                    COALESCE(AVG(ic.approval_amount), 0) as avg_approval_amount
                FROM insurance_claims ic
                WHERE ic.insurance_name IS NOT NULL 
                  AND ic.insurance_name != ''
                  AND ic.hospital_id = ANY($1)
                GROUP BY ic.insurance_name
                ORDER BY total_claims DESC, total_bill_amount DESC
            `;

            const result = await client.query(query, [hospitalIds]);

            // Calculate percentages
            const totalClaims = result.rows.reduce((sum, row) => sum + parseInt(row.total_claims), 0);
            const totalBillAmount = result.rows.reduce((sum, row) => sum + parseFloat(row.total_bill_amount), 0);

            const insurers = result.rows.map(row => ({
                insurance_name: row.insurance_name,
                total_claims: parseInt(row.total_claims) || 0,
                claims_percentage: totalClaims > 0 ? ((parseInt(row.total_claims) / totalClaims) * 100).toFixed(2) : 0,
                total_bill_amount: parseFloat(row.total_bill_amount) || 0,
                bill_percentage: totalBillAmount > 0 ? ((parseFloat(row.total_bill_amount) / totalBillAmount) * 100).toFixed(2) : 0,
                total_approval_amount: parseFloat(row.total_approval_amount) || 0,
                total_amount_received: parseFloat(row.total_amount_received) || 0,
                total_pending_amount: parseFloat(row.total_pending_amount) || 0,
                avg_bill_amount: parseFloat(row.avg_bill_amount) || 0,
                avg_approval_amount: parseFloat(row.avg_approval_amount) || 0
            }));

            res.status(200).json({
                status: 'success',
                data: {
                    insurers,
                    summary: {
                        total_insurers: insurers.length,
                        total_claims: totalClaims,
                        total_bill_amount: totalBillAmount
                    }
                }
            });
        } finally {
            client.release();
        }
    } catch (err) {
        next(err);
    }
};

exports.getBranchInsurerAnalytics = async (req, res, next) => {
    try {
        const { branch_id } = req.params;

        if (!branch_id) {
            return res.status(400).json({
                status: 'fail',
                message: 'branch_id is required'
            });
        }

        const db = require('../config/db');
        const client = await db.getClient();

        try {
            // Get the hospital(s) the accountant is assigned to
            const userHospitalQuery = `
                SELECT DISTINCT b.hospital_id
                FROM users u
                JOIN staff s ON u.user_id = s.user_id
                JOIN staff_branches sb ON s.staff_id = sb.staff_id
                JOIN branches b ON sb.branch_id = b.branch_id
                WHERE u.user_id = $1 AND sb.is_active = true
            `;
            const userHospitals = await client.query(userHospitalQuery, [req.user.user_id]);

            if (userHospitals.rows.length === 0) {
                return res.status(403).json({
                    status: 'fail',
                    message: 'Access denied: You do not have permission to view analytics'
                });
            }

            const hospitalIds = userHospitals.rows.map(row => row.hospital_id);

            // Get branch info and verify it's in the accountant's hospital
            const branchQuery = `
                SELECT branch_name, hospital_id 
                FROM branches 
                WHERE branch_id = $1 AND hospital_id = ANY($2)
            `;
            const branchResult = await client.query(branchQuery, [branch_id, hospitalIds]);

            if (branchResult.rows.length === 0) {
                return res.status(403).json({
                    status: 'fail',
                    message: 'Access denied: You do not have permission to view this branch'
                });
            }

            const branchInfo = branchResult.rows[0];

            // Get insurer analytics for this branch
            const query = `
                SELECT 
                    ic.insurance_name,
                    COUNT(ic.claim_id) as total_claims,
                    COALESCE(SUM(ic.bill_amount), 0) as total_bill_amount,
                    COALESCE(SUM(ic.approval_amount), 0) as total_approval_amount,
                    COALESCE(SUM(ic.amount_received), 0) as total_amount_received,
                    COALESCE(SUM(ic.pending_amount), 0) as total_pending_amount,
                    COALESCE(AVG(ic.bill_amount), 0) as avg_bill_amount,
                    COALESCE(AVG(ic.approval_amount), 0) as avg_approval_amount,
                    COALESCE(AVG(ic.amount_received), 0) as avg_amount_received
                FROM insurance_claims ic
                WHERE ic.branch_id = $1 
                  AND ic.insurance_name IS NOT NULL 
                  AND ic.insurance_name != ''
                GROUP BY ic.insurance_name
                ORDER BY total_claims DESC, total_bill_amount DESC
            `;

            const result = await client.query(query, [branch_id]);

            // Calculate percentages
            const totalClaims = result.rows.reduce((sum, row) => sum + parseInt(row.total_claims), 0);
            const totalBillAmount = result.rows.reduce((sum, row) => sum + parseFloat(row.total_bill_amount), 0);

            const insurers = result.rows.map(row => ({
                insurance_name: row.insurance_name,
                total_claims: parseInt(row.total_claims) || 0,
                claims_percentage: totalClaims > 0 ? ((parseInt(row.total_claims) / totalClaims) * 100).toFixed(2) : 0,
                total_bill_amount: parseFloat(row.total_bill_amount) || 0,
                bill_percentage: totalBillAmount > 0 ? ((parseFloat(row.total_bill_amount) / totalBillAmount) * 100).toFixed(2) : 0,
                total_approval_amount: parseFloat(row.total_approval_amount) || 0,
                total_amount_received: parseFloat(row.total_amount_received) || 0,
                total_pending_amount: parseFloat(row.total_pending_amount) || 0,
                avg_bill_amount: parseFloat(row.avg_bill_amount) || 0,
                avg_approval_amount: parseFloat(row.avg_approval_amount) || 0,
                avg_amount_received: parseFloat(row.avg_amount_received) || 0
            }));

            res.status(200).json({
                status: 'success',
                data: {
                    branch: {
                        branch_id: parseInt(branch_id),
                        branch_name: branchInfo.branch_name,
                        hospital_id: branchInfo.hospital_id
                    },
                    insurers,
                    summary: {
                        total_insurers: insurers.length,
                        total_claims: totalClaims,
                        total_bill_amount: totalBillAmount
                    }
                }
            });
        } finally {
            client.release();
        }
    } catch (err) {
        next(err);
    }
};


// --- Accountant Management (Admin Only) ---

exports.createAccountant = async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const {
            username, email, password, phone_number,
            first_name, last_name,
            branch_ids,
            role_code = 'ACCOUNTANT' // Default to ACCOUNTANT if not provided
        } = req.body;

        // 1. Get Role ID
        const roleResult = await client.query("SELECT role_id FROM roles WHERE role_code = $1", [role_code]);
        const roleId = roleResult.rows[0]?.role_id;
        if (!roleId) throw new AppError('Role not found', 500);

        // 2. Create User
        const passwordHash = await PasswordUtils.hashPassword(password);
        const userQuery = `
            INSERT INTO users (username, email, phone_number, password_hash, role_id, is_active, is_email_verified)
            VALUES ($1, $2, $3, $4, $5, true, true)
            RETURNING user_id
        `;
        const userResult = await client.query(userQuery, [username, email, phone_number, passwordHash, roleId]);
        const userId = userResult.rows[0].user_id;

        // 3. Create Staff
        const staffCode = (role_code === 'ACCOUNTANT_MANAGER' ? 'AM' : 'ACC') + Date.now().toString().slice(-6);
        const staffType = role_code === 'ACCOUNTANT_MANAGER' ? 'Accountant Manager' : 'Accountant';
        const staffQuery = `
            INSERT INTO staff (user_id, first_name, last_name, staff_code, staff_type, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            RETURNING *
        `;
        const staffResult = await client.query(staffQuery, [userId, first_name, last_name, staffCode, staffType]);
        const newStaff = staffResult.rows[0];

        // 4. Link Branches
        if (branch_ids && branch_ids.length > 0) {
            for (const branchId of branch_ids) {
                await client.query(
                    "INSERT INTO staff_branches (staff_id, branch_id, employment_type, is_active) VALUES ($1, $2, 'Permanent', true)",
                    [newStaff.staff_id, branchId]
                );
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            status: 'success',
            message: 'Accountant created successfully',
            data: { accountant: newStaff }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        next(new AppError(error.message, 500));
    } finally {
        client.release();
    }
};

exports.getAllAccountants = async (req, res, next) => {
    try {
        const { hospital_id, search } = req.query;
        let query = `
            SELECT s.*, u.username, u.email, u.phone_number, r.role_code,
                   h.hospital_name,
                   string_agg(DISTINCT b.branch_name, ', ') as branches
            FROM staff s
            JOIN users u ON s.user_id = u.user_id
            JOIN roles r ON u.role_id = r.role_id
            LEFT JOIN staff_branches sb ON s.staff_id = sb.staff_id
            LEFT JOIN branches b ON sb.branch_id = b.branch_id
            LEFT JOIN hospitals h ON b.hospital_id = h.hospital_id
            WHERE r.role_code IN ('ACCOUNTANT', 'ACCOUNTANT_MANAGER') AND s.is_active = true
        `;

        const params = [];
        let paramIndex = 1;

        if (hospital_id) {
            query += ` AND b.hospital_id = $${paramIndex}`;
            params.push(hospital_id);
            paramIndex++;
        }

        if (search) {
            query += ` AND (
                s.first_name ILIKE $${paramIndex} OR
                s.last_name ILIKE $${paramIndex} OR
                s.staff_code ILIKE $${paramIndex} OR
                u.email ILIKE $${paramIndex} OR
                u.phone_number ILIKE $${paramIndex} OR
                u.username ILIKE $${paramIndex} OR
                h.hospital_name ILIKE $${paramIndex}
            )`;
            params.push(`%${search}%`);
        }

        query += ` GROUP BY s.staff_id, u.user_id, r.role_code, h.hospital_name`;

        const result = await pool.query(query, params);

        res.status(200).json({
            status: 'success',
            results: result.rows.length,
            data: { accountants: result.rows }
        });
    } catch (error) {
        next(new AppError(error.message, 500));
    }
};

exports.getAccountantById = async (req, res, next) => {
    try {
        const { id } = req.params;
        // First find the staff record
        const staffResult = await pool.query(`
            SELECT s.*, u.username, u.email, u.phone_number
            FROM staff s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.staff_id = $1
        `, [id]);

        if (staffResult.rows.length === 0) {
            return next(new AppError('Accountant not found', 404));
        }

        // Get branches
        const branchesResult = await pool.query(`
            SELECT branch_id FROM staff_branches WHERE staff_id = $1 AND is_active = true
        `, [id]);

        const accountant = staffResult.rows[0];
        accountant.branch_ids = branchesResult.rows.map(b => b.branch_id);

        res.status(200).json({ status: 'success', data: { accountant } });
    } catch (error) {
        next(new AppError(error.message, 500));
    }
};

exports.updateAccountant = async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { first_name, last_name, email, phone_number, branch_ids } = req.body;

        // 1. Update Staff details
        const staffResult = await client.query(
            `UPDATE staff SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name)
             WHERE staff_id = $3 RETURNING user_id`,
            [first_name, last_name, id]
        );

        if (staffResult.rows.length === 0) {
            throw new AppError('Accountant not found', 404);
        }

        const userId = staffResult.rows[0].user_id;

        // 2. Update User details
        if (email || phone_number) {
            await client.query(
                `UPDATE users SET email = COALESCE($1, email), phone_number = COALESCE($2, phone_number)
                 WHERE user_id = $3`,
                [email, phone_number, userId]
            );
        }

        // 3. Update Branches (Simple replace strategy)
        if (branch_ids) {
            await client.query('DELETE FROM staff_branches WHERE staff_id = $1', [id]);
            for (const branchId of branch_ids) {
                await client.query(
                    "INSERT INTO staff_branches (staff_id, branch_id, employment_type, is_active) VALUES ($1, $2, 'Permanent', true)",
                    [id, branchId]
                );
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ status: 'success', message: 'Accountant updated successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        next(new AppError(error.message, 500));
    } finally {
        client.release();
    }
};

// Helper to parse numeric values (handles strings with currency symbols, commas, or typos like 'O' instead of '0')
function parseNumeric(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;

    // Convert to string and clean up
    let str = String(value).trim();

    // Handle common typo: 'O' or 'o' instead of '0'
    // This is aggressive but addresses the user's specific error "92OO" -> 9200
    str = str.replace(/[Oo]/g, '0');

    // Remove currency symbols and commas
    str = str.replace(/[^0-9.-]/g, '');

    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

// Helper to parse dates (Excel dates or string dates)
function parseDate(value) {
    if (!value) return null;
    if (typeof value === 'number') {
        // Excel serial date
        return new Date(Math.round((value - 25569) * 86400 * 1000));
    }
    // String date - attempt parse
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d;
}



// --- Dashboard Stats ---
exports.getDashboardStats = async (req, res, next) => {
    try {
        const db = require('../config/db');
        const client = await db.getClient();

        try {
            // Get user's hospitals
            const userHospitalQuery = `
                SELECT DISTINCT b.hospital_id
                FROM users u
                JOIN staff s ON u.user_id = s.user_id
                JOIN staff_branches sb ON s.staff_id = sb.staff_id
                JOIN branches b ON sb.branch_id = b.branch_id
                WHERE u.user_id = $1 AND sb.is_active = true
            `;
            const userHospitals = await client.query(userHospitalQuery, [req.user.user_id]);

            if (userHospitals.rows.length === 0) {
                return res.status(200).json({
                    status: 'success',
                    data: {
                        total_branches: 0,
                        total_insurers: 0,
                        total_claims: 0,
                        total_pending_amount: 0,
                        total_bill_amount: 0,
                        hospital_name: '',
                        referral_doctors: 0,
                        referral_payouts: 0,
                        top_insurers: [],
                        recent_referral_payouts: []
                    }
                });
            }

            const hospitalIds = userHospitals.rows.map(row => row.hospital_id);

            // 1. Total Branches
            const branchQuery = `
                SELECT COUNT(*) as count 
                FROM branches 
                WHERE hospital_id = ANY($1) AND is_active = true
            `;
            const branchRes = await client.query(branchQuery, [hospitalIds]);

            // 2. Total Insurance Companies (distinct names from claims)
            const insurerQuery = `
                SELECT COUNT(DISTINCT insurance_name) as count 
                FROM insurance_claims 
                WHERE hospital_id = ANY($1) AND insurance_name IS NOT NULL AND insurance_name != ''
            `;
            const insurerRes = await client.query(insurerQuery, [hospitalIds]);

            // 3. Claims Stats (Total count, Pending Amount, Bill Amount)
            const claimsQuery = `
                SELECT 
                    COUNT(*) as total_count,
                    COALESCE(SUM(pending_amount), 0) as total_pending,
                    COALESCE(SUM(bill_amount), 0) as total_bill
                FROM insurance_claims
                WHERE hospital_id = ANY($1)
            `;
            const claimsRes = await client.query(claimsQuery, [hospitalIds]);

            // 4. Top 5 Insurance Companies with pending amounts
            const topInsurersQuery = `
                SELECT 
                    insurance_name,
                    COUNT(*) as claim_count,
                    COALESCE(SUM(pending_amount), 0) as pending_amount,
                    COALESCE(SUM(bill_amount), 0) as bill_amount
                FROM insurance_claims
                WHERE hospital_id = ANY($1) 
                  AND insurance_name IS NOT NULL 
                  AND insurance_name != ''
                GROUP BY insurance_name
                ORDER BY pending_amount DESC
                LIMIT 5
            `;
            const topInsurersRes = await client.query(topInsurersQuery, [hospitalIds]);

            // 5. Referral Doctor Count
            let referralDoctorCount = 0;
            let referralPayoutTotal = 0;
            let recentReferralPayouts = [];

            try {
                // Get all relevant hospital IDs (from assigned branches + user's primary hospital)
                const allHospitalIds = [...new Set([...hospitalIds, req.user.hospital_id].filter(id => id != null))];

                const referralDoctorQuery = `
                    SELECT COUNT(*) as count 
                    FROM referral_doctor_module 
                    WHERE tenant_id = ANY($1)
                `;
                const referralDoctorRes = await client.query(referralDoctorQuery, [allHospitalIds]);
                referralDoctorCount = parseInt(referralDoctorRes.rows[0]?.count || 0);

                // 6. Referral Payouts (current month for these hospitals)
                const referralPayoutQuery = `
                    SELECT COALESCE(SUM(rd.referral_amount), 0) as total_payout
                    FROM referral_data rd
                    JOIN referral_header rh ON rd.header_id = rh.header_id
                    JOIN referral_doctor_module rdm ON rd.referral_doctor_id = rdm.id
                    WHERE DATE_TRUNC('month', rh.upload_date) = DATE_TRUNC('month', CURRENT_DATE)
                      AND rdm.tenant_id = ANY($1)
                `;
                const referralPayoutRes = await client.query(referralPayoutQuery, [allHospitalIds]);
                referralPayoutTotal = parseFloat(referralPayoutRes.rows[0]?.total_payout || 0);

                // 7. Recent Referral Payouts (last 30 days)
                const recentPayoutsQuery = `
                    SELECT 
                        rdm.doctor_name,
                        COALESCE(SUM(rd.referral_amount), 0) as total_amount
                    FROM referral_data rd
                    JOIN referral_header rh ON rd.header_id = rh.header_id
                    JOIN referral_doctor_module rdm ON rd.referral_doctor_id = rdm.id
                    WHERE rh.upload_date >= CURRENT_DATE - INTERVAL '30 days'
                      AND rdm.tenant_id = ANY($1)
                    GROUP BY rdm.doctor_name
                    ORDER BY total_amount DESC
                    LIMIT 5
                `;
                const recentPayoutsRes = await client.query(recentPayoutsQuery, [allHospitalIds]);
                recentReferralPayouts = recentPayoutsRes.rows.map(row => ({
                    doctor_name: row.doctor_name,
                    amount: parseFloat(row.total_amount)
                }));
            } catch (err) {
                // Referral tables might not exist, continue with defaults
                console.log('Referral tables not found, using defaults');
            }

            // Get Hospital Name
            const hospitalNameQuery = `SELECT hospital_name FROM hospitals WHERE hospital_id = $1`;
            const hospitalNameRes = await client.query(hospitalNameQuery, [hospitalIds[0]]);

            res.status(200).json({
                status: 'success',
                data: {
                    total_branches: parseInt(branchRes.rows[0].count),
                    total_insurers: parseInt(insurerRes.rows[0].count),
                    total_claims: parseInt(claimsRes.rows[0].total_count),
                    total_pending_amount: parseFloat(claimsRes.rows[0].total_pending),
                    total_bill_amount: parseFloat(claimsRes.rows[0].total_bill),
                    hospital_name: hospitalNameRes.rows[0]?.hospital_name || 'Hospital',
                    referral_doctors: referralDoctorCount,
                    referral_payouts: referralPayoutTotal,
                    top_insurers: topInsurersRes.rows.map(row => ({
                        name: row.insurance_name,
                        claims: parseInt(row.claim_count),
                        pending: parseFloat(row.pending_amount),
                        bill: parseFloat(row.bill_amount)
                    })),
                    recent_referral_payouts: recentReferralPayouts
                }
            });

        } finally {
            client.release();
        }
    } catch (err) {
        next(err);
    }
};

