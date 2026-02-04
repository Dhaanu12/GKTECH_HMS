const db = require('../config/db');
const BillingSetupMaster = require('../models/BillingSetupMaster');
const BillingSetupPackageDetail = require('../models/BillingSetupPackageDetail');

async function testBillingSetup() {
    console.log('Starting Billing Setup Verification...');

    try {
        // 1. Create a Service
        console.log('Creating Service...');
        const serviceData = {
            type_of_service: 'service',
            service_name: 'Consultation - General',
            patient_charge: 500,
            b2b_charge: 400,
            special_charge: 450,
            branch_id: 1, // Assuming branch 1 exists
            is_active: true,
            created_by: 1, // Assuming user 1 exists
            updated_by: 1
        };
        const createdService = await BillingSetupMaster.create(serviceData);
        console.log('Service Created:', createdService.service_name, createdService.uuid);

        // 2. Create a Package
        console.log('Creating Package...');
        const packageData = {
            type_of_service: 'package',
            service_name: 'Full Body Checkup',
            patient_charge: 2000,
            b2b_charge: 1500,
            special_charge: 1800,
            branch_id: 1,
            is_active: true,
            created_by: 1,
            updated_by: 1
        };
        const createdPackage = await BillingSetupMaster.create(packageData);
        console.log('Package Created:', createdPackage.service_name, createdPackage.uuid);

        // 3. Create Package Details
        console.log('Adding Package Details...');
        const packageDetail1 = {
            package_uuid: createdPackage.uuid,
            service_name: 'Blood Test',
            patient_charge: 500,
            b2b_charge: 400,
            special_charge: 450,
            is_active: true,
            created_by: 1,
            updated_by: 1
        };
        const createdDetail1 = await BillingSetupPackageDetail.create(packageDetail1);
        console.log('Detail 1 Created:', createdDetail1.service_name);

        const packageDetail2 = {
            package_uuid: createdPackage.uuid,
            service_name: 'X-Ray',
            patient_charge: 1000,
            b2b_charge: 800,
            special_charge: 900,
            is_active: true,
            created_by: 1,
            updated_by: 1
        };
        const createdDetail2 = await BillingSetupPackageDetail.create(packageDetail2);
        console.log('Detail 2 Created:', createdDetail2.service_name);

        // 4. Verify Data Retrieval
        console.log('Verifying Data Retrieval...');

        // Fetch Service by UUID
        const fetchedService = await BillingSetupMaster.findByUuid(createdService.uuid);
        if (fetchedService && fetchedService.service_name === serviceData.service_name) {
            console.log('PASS: Service retrieval verified.');
        } else {
            console.error('FAIL: Service retrieval failed.');
        }

        // Fetch Package details
        const details = await BillingSetupPackageDetail.findByPackageUuid(createdPackage.uuid);
        if (details.length === 2) {
            console.log('PASS: Package details retrieval verified (Count: 2).');
        } else {
            console.error(`FAIL: Package details count mismatch. Expected 2, got ${details.length}`);
        }

        console.log('Verification Completed Successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    }
}

testBillingSetup();
