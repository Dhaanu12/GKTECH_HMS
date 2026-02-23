const ExcelJS = require('exceljs');

/**
 * Excel Service for Medical Services Import/Export
 * Handles generation and parsing of Excel files for bulk medical service management
 */
class ExcelService {
    /**
     * Generate an Excel file from medical services data
     * @param {Array} allServices - All available medical services
     * @param {Array} enabledServiceIds - IDs of currently enabled services
     * @returns {Promise<Buffer>} Excel file buffer
     */
    async generateServicesExcel(allServices, enabledServiceIds) {
        const enabledSet = new Set(enabledServiceIds);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Medical Services');

        // Define columns
        worksheet.columns = [
            { header: 'Service ID', key: 'service_id', width: 14 },
            { header: 'Service Name', key: 'service_name', width: 52 },
            { header: 'Category', key: 'category', width: 22 },
            { header: 'Service Code', key: 'service_code', width: 17 },
            { header: 'Enabled', key: 'enabled', width: 12 },
        ];

        // Add rows
        allServices.forEach(service => {
            worksheet.addRow({
                service_id: service.service_id,
                service_name: service.service_name,
                category: service.category,
                service_code: service.service_code,
                enabled: enabledSet.has(service.service_id) ? 'Yes' : 'No',
            });
        });

        return workbook.xlsx.writeBuffer();
    }

    /**
     * Parse uploaded Excel file and extract enabled service IDs and details
     * @param {Buffer} fileBuffer - Uploaded Excel file buffer
     * @returns {Promise<Object>} { serviceIds, serviceDetails, errors }
     */
    async parseServicesExcel(fileBuffer) {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(fileBuffer);

            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                return { serviceIds: [], serviceDetails: [], errors: ['Excel file is empty or has no sheets'] };
            }

            const serviceIds = [];
            const serviceDetails = [];
            const errors = [];

            // Build header map from first row
            const headerRow = worksheet.getRow(1);
            const headers = {};
            headerRow.eachCell((cell, colNumber) => {
                headers[String(cell.value).trim()] = colNumber;
            });

            const serviceIdCol = headers['Service ID'];
            const serviceNameCol = headers['Service Name'];
            const categoryCol = headers['Category'];
            const enabledCol = headers['Enabled'];

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // skip header

                const serviceName = row.getCell(serviceNameCol)?.value;
                const enabled = row.getCell(enabledCol)?.value;
                const serviceId = row.getCell(serviceIdCol)?.value;
                const category = row.getCell(categoryCol)?.value || 'General';

                if (!serviceName) {
                    errors.push(`Row ${rowNumber}: Missing 'Service Name'`);
                    return;
                }
                if (enabled === undefined || enabled === null) {
                    errors.push(`Row ${rowNumber}: Missing 'Enabled' column`);
                    return;
                }

                const enabledStr = String(enabled).trim().toLowerCase();
                if (enabledStr === 'yes' || enabledStr === 'y' || enabledStr === '1' || enabledStr === 'true') {
                    const idNum = serviceId && !isNaN(serviceId) && parseInt(serviceId) > 0 ? parseInt(serviceId) : null;
                    if (idNum) serviceIds.push(idNum);
                    serviceDetails.push({
                        service_id: idNum,
                        service_name: String(serviceName).trim(),
                        category: String(category).trim(),
                    });
                }
            });

            return { serviceIds, serviceDetails, errors };
        } catch (error) {
            return { serviceIds: [], serviceDetails: [], errors: [`Failed to parse Excel file: ${error.message}`] };
        }
    }

    /**
     * Validate service IDs against database
     */
    validateServiceIds(serviceIds, validServices) {
        const validServiceIds = new Set(validServices.map(s => s.service_id));
        const invalidIds = serviceIds.filter(id => !validServiceIds.has(id));
        return { valid: invalidIds.length === 0, invalidIds };
    }

    /**
     * Generate an Excel file from billing setup data (services and packages)
     * @param {Array} services - All services with pricing
     * @param {Array} packages - All packages with pricing
     * @returns {Promise<Buffer>} Excel file buffer
     */
    async generateBillingExcel(services, packages) {
        const workbook = new ExcelJS.Workbook();

        // --- Services sheet ---
        const servicesSheet = workbook.addWorksheet('Services');
        servicesSheet.columns = [
            { header: 'Service ID', key: 'service_id', width: 14 },
            { header: 'Service Name', key: 'service_name', width: 52 },
            { header: 'Category', key: 'category', width: 22 },
            { header: 'Patient Charge', key: 'patient_charge', width: 17 },
            { header: 'B2B Charge', key: 'b2b_charge', width: 17 },
            { header: 'Special Charge', key: 'special_charge', width: 17 },
        ];
        services.forEach(service => {
            servicesSheet.addRow({
                service_id: service.service_id || '',
                service_name: service.service_name || '',
                category: service.category || service.type_of_service || '',
                patient_charge: parseFloat(service.patient_charge || 0).toFixed(2),
                b2b_charge: parseFloat(service.b2b_charge || 0).toFixed(2),
                special_charge: parseFloat(service.special_charge || 0).toFixed(2),
            });
        });

        // --- Packages sheet ---
        const packagesSheet = workbook.addWorksheet('Packages');
        packagesSheet.columns = [
            { header: 'Package UUID', key: 'uuid', width: 42 },
            { header: 'Package Name', key: 'service_name', width: 52 },
            { header: 'Patient Charge', key: 'patient_charge', width: 17 },
            { header: 'B2B Charge', key: 'b2b_charge', width: 17 },
            { header: 'Special Charge', key: 'special_charge', width: 17 },
        ];
        packages.forEach(pkg => {
            packagesSheet.addRow({
                uuid: pkg.uuid || '',
                service_name: pkg.service_name || '',
                patient_charge: parseFloat(pkg.patient_charge || 0).toFixed(2),
                b2b_charge: parseFloat(pkg.b2b_charge || 0).toFixed(2),
                special_charge: parseFloat(pkg.special_charge || 0).toFixed(2),
            });
        });

        return workbook.xlsx.writeBuffer();
    }

    /**
     * Parse uploaded billing Excel file and extract services and packages
     * @param {Buffer} fileBuffer - Uploaded Excel file buffer
     * @returns {Promise<Object>} { services, packages, errors }
     */
    async parseBillingExcel(fileBuffer) {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(fileBuffer);

            const errors = [];
            const services = [];
            const packages = [];

            // Helper to build a header->colNumber map from a worksheet's first row
            const buildHeaderMap = (ws) => {
                const map = {};
                const headerRow = ws.getRow(1);
                headerRow.eachCell((cell, col) => { map[String(cell.value).trim()] = col; });
                return map;
            };

            // --- Services sheet ---
            const servicesSheet = workbook.getWorksheet('Services');
            if (servicesSheet) {
                const h = buildHeaderMap(servicesSheet);
                servicesSheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return;
                    const serviceName = row.getCell(h['Service Name'])?.value;
                    if (!serviceName) {
                        errors.push(`Services Row ${rowNumber}: Missing required column 'Service Name'`);
                        return;
                    }
                    const serviceId = row.getCell(h['Service ID'])?.value;
                    const category = row.getCell(h['Category'])?.value || '';
                    const patientCharge = row.getCell(h['Patient Charge'])?.value;
                    const b2bCharge = row.getCell(h['B2B Charge'])?.value;
                    const specialCharge = row.getCell(h['Special Charge'])?.value;

                    if (patientCharge !== undefined && patientCharge !== null && (isNaN(patientCharge) || parseFloat(patientCharge) < 0)) {
                        errors.push(`Services Row ${rowNumber}: Invalid Patient Charge '${patientCharge}'`); return;
                    }
                    if (b2bCharge !== undefined && b2bCharge !== null && (isNaN(b2bCharge) || parseFloat(b2bCharge) < 0)) {
                        errors.push(`Services Row ${rowNumber}: Invalid B2B Charge '${b2bCharge}'`); return;
                    }
                    if (specialCharge !== undefined && specialCharge !== null && (isNaN(specialCharge) || parseFloat(specialCharge) < 0)) {
                        errors.push(`Services Row ${rowNumber}: Invalid Special Charge '${specialCharge}'`); return;
                    }

                    services.push({
                        service_id: (serviceId && !isNaN(serviceId)) ? parseInt(serviceId) : null,
                        service_name: String(serviceName).trim(),
                        category: String(category).trim(),
                        patient_charge: patientCharge != null ? parseFloat(patientCharge).toFixed(2) : '0.00',
                        b2b_charge: b2bCharge != null ? parseFloat(b2bCharge).toFixed(2) : '0.00',
                        special_charge: specialCharge != null ? parseFloat(specialCharge).toFixed(2) : '0.00',
                    });
                });
            }

            // --- Packages sheet ---
            const packagesSheet = workbook.getWorksheet('Packages');
            if (packagesSheet) {
                const h = buildHeaderMap(packagesSheet);
                packagesSheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return;
                    const uuid = row.getCell(h['Package UUID'])?.value;
                    const packageName = row.getCell(h['Package Name'])?.value;
                    if (!uuid || !packageName) {
                        errors.push(`Packages Row ${rowNumber}: Missing required columns`); return;
                    }
                    const patientCharge = row.getCell(h['Patient Charge'])?.value;
                    const b2bCharge = row.getCell(h['B2B Charge'])?.value;
                    const specialCharge = row.getCell(h['Special Charge'])?.value;

                    if (patientCharge !== undefined && patientCharge !== null && (isNaN(patientCharge) || parseFloat(patientCharge) < 0)) {
                        errors.push(`Packages Row ${rowNumber}: Invalid Patient Charge '${patientCharge}'`); return;
                    }
                    if (b2bCharge !== undefined && b2bCharge !== null && (isNaN(b2bCharge) || parseFloat(b2bCharge) < 0)) {
                        errors.push(`Packages Row ${rowNumber}: Invalid B2B Charge '${b2bCharge}'`); return;
                    }
                    if (specialCharge !== undefined && specialCharge !== null && (isNaN(specialCharge) || parseFloat(specialCharge) < 0)) {
                        errors.push(`Packages Row ${rowNumber}: Invalid Special Charge '${specialCharge}'`); return;
                    }

                    packages.push({
                        uuid: String(uuid).trim(),
                        service_name: String(packageName).trim(),
                        patient_charge: patientCharge != null ? parseFloat(patientCharge).toFixed(2) : '0.00',
                        b2b_charge: b2bCharge != null ? parseFloat(b2bCharge).toFixed(2) : '0.00',
                        special_charge: specialCharge != null ? parseFloat(specialCharge).toFixed(2) : '0.00',
                    });
                });
            }

            return { services, packages, errors };
        } catch (error) {
            return { services: [], packages: [], errors: [`Failed to parse Excel file: ${error.message}`] };
        }
    }
}

module.exports = new ExcelService();
