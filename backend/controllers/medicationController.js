const MedicationMaster = require('../models/MedicationMaster');
const MedicationManufacturer = require('../models/MedicationManufacturer');
const BranchMedication = require('../models/BranchMedication');
const ExcelJS = require('exceljs');

exports.getAllMedications = async (req, res) => {
    try {
        const { hospital_id } = req.user;
        const { branch_id, search, page, limit, filter } = req.query;

        if (!branch_id) {
            return res.status(400).json({ message: 'Branch ID is required' });
        }

        const result = await MedicationMaster.findByHospital(hospital_id, {
            branchId: branch_id,
            search,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            onlySelected: filter === 'my_branch'
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching medications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.toggleBranchMedication = async (req, res) => {
    try {
        const { branch_id, medication_id, is_active } = req.body;

        if (!branch_id || !medication_id) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        await BranchMedication.toggleMedication(branch_id, medication_id, is_active);
        res.json({ message: 'Medication status updated successfully' });
    } catch (error) {
        console.error('Error toggling medication:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createCustomMedication = async (req, res) => {
    try {
        const { hospital_id } = req.user;
        const {
            branch_id,
            medicine_name,
            generic_name,
            manufacturer_name,
            category,
            strength,
            dosage_form,
            drug_class,
            schedule_type,
            prescription_required,
            default_adult_dose,
            default_pediatric_dose,
            route_of_administration,
            frequency,
            duration,
            instructions,
            max_dose_limit
        } = req.body;

        // 1. Get or Create Manufacturer
        let manufacturer_id = null;
        if (manufacturer_name) {
            let manufacturer = await MedicationManufacturer.findByName(manufacturer_name);
            if (!manufacturer) {
                manufacturer = await MedicationManufacturer.create({ name: manufacturer_name });
            }
            manufacturer_id = manufacturer.id;
        }

        // 2. Check for duplicate custom/global medication
        const existing = await MedicationMaster.findByNameAndStrength(medicine_name, strength, hospital_id);
        if (existing) {
            return res.status(409).json({ message: 'Medication already exists', existingMedication: existing });
        }

        // 3. Create Medication in Master
        const newMedication = await MedicationMaster.create({
            medicine_name,
            generic_name,
            manufacturer_id,
            category,
            strength,
            dosage_form,
            drug_class,
            schedule_type,
            prescription_required,
            default_adult_dose,
            default_pediatric_dose,
            route_of_administration,
            frequency,
            duration,
            instructions,
            max_dose_limit,
            is_global: false,
            hospital_id
        });

        // 4. Add to Branch(es)
        const { add_to_all_branches } = req.body;
        const { pool } = require('../config/db');

        if (add_to_all_branches) {
            // Fetch all active branches for the hospital
            const Branch = require('../models/Branch');
            const branches = await Branch.findActiveByHospital(hospital_id);

            for (const branch of branches) {
                await BranchMedication.toggleMedication(branch.branch_id, newMedication.id, true);
            }
        } else if (branch_id) {
            await BranchMedication.create({
                branch_id,
                medication_id: newMedication.id,
                is_active: true
            });
        }

        res.status(201).json(newMedication);
    } catch (error) {
        console.error('Error creating medication:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.uploadMedicationExcel = async (req, res) => {
    try {
        const { hospital_id } = req.user;
        const { branch_id } = req.body;

        if (!req.file || !branch_id) {
            return res.status(400).json({ message: 'File and Branch ID are required' });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.worksheets[0];
        const data = [];

        if (worksheet) {
            const headers = [];
            worksheet.getRow(1).eachCell((cell) => {
                headers.push(cell.value);
            });

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
                const rowData = {};
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const header = headers[colNumber - 1];
                    if (header) {
                        rowData[header] = cell.value;
                    }
                });
                data.push(rowData);
            });
        }

        let addedCount = 0;
        let skippedCount = 0;

        for (const row of data) {
            // Mapping keys - adjust based on actual excel headers
            const medicine_name = row['Medicine Name'] || row['Name'];
            const generic_name = row['Generic Name'];
            const strength = row['Strength'];
            const manufacturer_name = row['Manufacturer'] || row['Company'];

            if (!medicine_name) continue;

            // 1. Get or Create Manufacturer
            let manufacturer_id = null;
            if (manufacturer_name) {
                let manufacturer = await MedicationManufacturer.findByName(manufacturer_name);
                if (!manufacturer) {
                    manufacturer = await MedicationManufacturer.create({ name: manufacturer_name });
                }
                manufacturer_id = manufacturer.id;
            }

            // 2. Check existence
            const existing = await MedicationMaster.findByNameAndStrength(medicine_name, strength, hospital_id);

            let medicationId;
            if (existing) {
                medicationId = existing.id;
                skippedCount++;
            } else {
                // Create new custom medication
                const newMed = await MedicationMaster.create({
                    medicine_name,
                    generic_name,
                    manufacturer_id,
                    strength,
                    // Map other fields as available/needed from Excel
                    dosage_form: row['Dosage Form'] || row['Form'],
                    drug_class: row['Drug Class'],
                    is_global: false,
                    hospital_id
                });
                medicationId = newMed.id;
                addedCount++;
            }

            // 3. Add to Branch if not already there
            await BranchMedication.toggleMedication(branch_id, medicationId, true);
        }

        res.json({
            message: 'Import processed successfully',
            stats: { added: addedCount, skipped: skippedCount, total: data.length }
        });

    } catch (error) {
        console.error('Error processing upload:', error);
        res.status(500).json({ message: 'Server error parsing Excel file' });
    }
};
