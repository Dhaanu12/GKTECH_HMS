const XLSX = require('xlsx');

/**
 * Excel Service for Medical Services Import/Export
 * Handles generation and parsing of Excel files for bulk medical service management
 */
class ExcelService {
    /**
     * Generate an Excel file from medical services data
     * @param {Array} allServices - All available medical services
     * @param {Array} enabledServiceIds - IDs of currently enabled services
     * @returns {Buffer} Excel file buffer
     */
    generateServicesExcel(allServices, enabledServiceIds) {
        const enabledSet = new Set(enabledServiceIds);

        // Prepare data for Excel
        const data = allServices.map(service => ({
            'Service ID': service.service_id,
            'Service Name': service.service_name,
            'Category': service.category,
            'Service Code': service.service_code,
            'Enabled': enabledSet.has(service.service_id) ? 'Yes' : 'No'
        }));

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Set column widths for better readability
        worksheet['!cols'] = [
            { wch: 12 },  // Service ID
            { wch: 50 },  // Service Name
            { wch: 20 },  // Category
            { wch: 15 },  // Service Code
            { wch: 10 }   // Enabled
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Medical Services');

        // Generate buffer
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return excelBuffer;
    }

    /**
     * Parse uploaded Excel file and extract enabled service IDs and details
     * @param {Buffer} fileBuffer - Uploaded Excel file buffer
     * @returns {Object} { serviceIds: Array<number>, serviceDetails: Array<Object>, errors: Array<string> }
     */
    parseServicesExcel(fileBuffer) {
        try {
            // Read the workbook
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

            // Get first sheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON
            const data = XLSX.utils.sheet_to_json(worksheet);

            if (data.length === 0) {
                return {
                    serviceIds: [],
                    serviceDetails: [],
                    errors: ['Excel file is empty or has no data']
                };
            }

            const serviceIds = [];
            const serviceDetails = [];
            const errors = [];

            // Validate and extract enabled services
            data.forEach((row, index) => {
                const rowNum = index + 2; // Excel row number (1-indexed + header)

                // Check required columns - only Service Name and Enabled are mandatory
                if (!row.hasOwnProperty('Service Name') || !row['Service Name']) {
                    errors.push(`Row ${rowNum}: Missing 'Service Name'`);
                    return;
                }

                if (!row.hasOwnProperty('Enabled')) {
                    errors.push(`Row ${rowNum}: Missing 'Enabled' column`);
                    return;
                }

                const serviceId = row['Service ID'];
                const serviceName = row['Service Name'];
                const category = row['Category'] || 'General'; // Default to General if not specified
                const enabled = String(row['Enabled']).trim().toLowerCase();

                // Check if enabled
                if (enabled === 'yes' || enabled === 'y' || enabled === '1' || enabled === 'true') {
                    // If Service ID is valid number, add to serviceIds
                    if (serviceId && !isNaN(serviceId) && parseInt(serviceId) > 0) {
                        serviceIds.push(parseInt(serviceId));
                    }

                    // Always capture full service details for potential new services
                    serviceDetails.push({
                        service_id: (serviceId && !isNaN(serviceId) && parseInt(serviceId) > 0) ? parseInt(serviceId) : null,
                        service_name: String(serviceName).trim(),
                        category: String(category).trim()
                    });
                }
            });

            return {
                serviceIds,
                serviceDetails,
                errors
            };
        } catch (error) {
            return {
                serviceIds: [],
                serviceDetails: [],
                errors: [`Failed to parse Excel file: ${error.message}`]
            };
        }
    }

    /**
     * Validate service IDs against database
     * @param {Array} serviceIds - Service IDs to validate
     * @param {Array} validServices - Valid services from database
     * @returns {Object} { valid: boolean, invalidIds: Array<number> }
     */
    validateServiceIds(serviceIds, validServices) {
        const validServiceIds = new Set(validServices.map(s => s.service_id));
        const invalidIds = serviceIds.filter(id => !validServiceIds.has(id));

        return {
            valid: invalidIds.length === 0,
            invalidIds
        };
    }

    /**
     * Generate an Excel file from billing setup data (services and packages)
     * @param {Array} services - All services with pricing
     * @param {Array} packages - All packages with pricing
     * @returns {Buffer} Excel file buffer
     */
    generateBillingExcel(services, packages) {
        // Prepare services data
        const servicesData = services.map(service => ({
            'Service ID': service.service_id || '',
            'Service Name': service.service_name || '',
            'Category': service.category || service.type_of_service || '',
            'Patient Charge': parseFloat(service.patient_charge || 0).toFixed(2),
            'B2B Charge': parseFloat(service.b2b_charge || 0).toFixed(2),
            'Special Charge': parseFloat(service.special_charge || 0).toFixed(2)
        }));

        // Prepare packages data
        const packagesData = packages.map(pkg => ({
            'Package UUID': pkg.uuid || '',
            'Package Name': pkg.service_name || '',
            'Patient Charge': parseFloat(pkg.patient_charge || 0).toFixed(2),
            'B2B Charge': parseFloat(pkg.b2b_charge || 0).toFixed(2),
            'Special Charge': parseFloat(pkg.special_charge || 0).toFixed(2)
        }));

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Add Services sheet
        const servicesWorksheet = XLSX.utils.json_to_sheet(servicesData);
        servicesWorksheet['!cols'] = [
            { wch: 12 },  // Service ID
            { wch: 50 },  // Service Name
            { wch: 20 },  // Category
            { wch: 15 },  // Patient Charge
            { wch: 15 },  // B2B Charge
            { wch: 15 }   // Special Charge
        ];
        XLSX.utils.book_append_sheet(workbook, servicesWorksheet, 'Services');

        // Add Packages sheet
        const packagesWorksheet = XLSX.utils.json_to_sheet(packagesData);
        packagesWorksheet['!cols'] = [
            { wch: 40 },  // Package UUID
            { wch: 50 },  // Package Name
            { wch: 15 },  // Patient Charge
            { wch: 15 },  // B2B Charge
            { wch: 15 }   // Special Charge
        ];
        XLSX.utils.book_append_sheet(workbook, packagesWorksheet, 'Packages');

        // Generate buffer
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return excelBuffer;
    }

    /**
     * Parse uploaded billing Excel file and extract services and packages
     * @param {Buffer} fileBuffer - Uploaded Excel file buffer
     * @returns {Object} { services: Array, packages: Array, errors: Array<string> }
     */
    parseBillingExcel(fileBuffer) {
        try {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const errors = [];
            const services = [];
            const packages = [];

            // Parse Services sheet
            if (workbook.SheetNames.includes('Services')) {
                const servicesSheet = workbook.Sheets['Services'];
                const servicesData = XLSX.utils.sheet_to_json(servicesSheet);

                servicesData.forEach((row, index) => {
                    const rowNum = index + 2;

                    // Validate required columns - Service ID is optional for new services
                    if (!row.hasOwnProperty('Service Name') || !row['Service Name']) {
                        errors.push(`Services Row ${rowNum}: Missing required column 'Service Name'`);
                        return;
                    }

                    const serviceId = row['Service ID'];
                    const serviceName = row['Service Name'];
                    const category = row['Category'] || '';
                    const patientCharge = row['Patient Charge'];
                    const b2bCharge = row['B2B Charge'];
                    const specialCharge = row['Special Charge'];

                    // Validate pricing values
                    if (patientCharge !== undefined && (isNaN(patientCharge) || parseFloat(patientCharge) < 0)) {
                        errors.push(`Services Row ${rowNum}: Invalid Patient Charge '${patientCharge}'`);
                        return;
                    }
                    if (b2bCharge !== undefined && (isNaN(b2bCharge) || parseFloat(b2bCharge) < 0)) {
                        errors.push(`Services Row ${rowNum}: Invalid B2B Charge '${b2bCharge}'`);
                        return;
                    }
                    if (specialCharge !== undefined && (isNaN(specialCharge) || parseFloat(specialCharge) < 0)) {
                        errors.push(`Services Row ${rowNum}: Invalid Special Charge '${specialCharge}'`);
                        return;
                    }

                    services.push({
                        service_id: (serviceId && !isNaN(serviceId)) ? parseInt(serviceId) : null,
                        service_name: String(serviceName).trim(),
                        category: String(category).trim(),
                        patient_charge: patientCharge !== undefined ? parseFloat(patientCharge).toFixed(2) : '0.00',
                        b2b_charge: b2bCharge !== undefined ? parseFloat(b2bCharge).toFixed(2) : '0.00',
                        special_charge: specialCharge !== undefined ? parseFloat(specialCharge).toFixed(2) : '0.00'
                    });
                });
            }

            // Parse Packages sheet
            if (workbook.SheetNames.includes('Packages')) {
                const packagesSheet = workbook.Sheets['Packages'];
                const packagesData = XLSX.utils.sheet_to_json(packagesSheet);

                packagesData.forEach((row, index) => {
                    const rowNum = index + 2;

                    // Validate required columns
                    if (!row.hasOwnProperty('Package UUID') || !row.hasOwnProperty('Package Name')) {
                        errors.push(`Packages Row ${rowNum}: Missing required columns`);
                        return;
                    }

                    const uuid = row['Package UUID'];
                    const packageName = row['Package Name'];
                    const patientCharge = row['Patient Charge'];
                    const b2bCharge = row['B2B Charge'];
                    const specialCharge = row['Special Charge'];

                    // Validate pricing values
                    if (patientCharge !== undefined && (isNaN(patientCharge) || parseFloat(patientCharge) < 0)) {
                        errors.push(`Packages Row ${rowNum}: Invalid Patient Charge '${patientCharge}'`);
                        return;
                    }
                    if (b2bCharge !== undefined && (isNaN(b2bCharge) || parseFloat(b2bCharge) < 0)) {
                        errors.push(`Packages Row ${rowNum}: Invalid B2B Charge '${b2bCharge}'`);
                        return;
                    }
                    if (specialCharge !== undefined && (isNaN(specialCharge) || parseFloat(specialCharge) < 0)) {
                        errors.push(`Packages Row ${rowNum}: Invalid Special Charge '${specialCharge}'`);
                        return;
                    }

                    packages.push({
                        uuid: String(uuid).trim(),
                        service_name: String(packageName).trim(),
                        patient_charge: patientCharge !== undefined ? parseFloat(patientCharge).toFixed(2) : '0.00',
                        b2b_charge: b2bCharge !== undefined ? parseFloat(b2bCharge).toFixed(2) : '0.00',
                        special_charge: specialCharge !== undefined ? parseFloat(specialCharge).toFixed(2) : '0.00'
                    });
                });
            }

            return {
                services,
                packages,
                errors
            };
        } catch (error) {
            return {
                services: [],
                packages: [],
                errors: [`Failed to parse Excel file: ${error.message}`]
            };
        }
    }
}

module.exports = new ExcelService();
