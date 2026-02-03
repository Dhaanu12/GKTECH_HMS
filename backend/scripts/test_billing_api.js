const BillingSetupController = require('../controllers/BillingSetupController');
const Service = require('../models/Service');
const BillingSetupMaster = require('../models/BillingSetupMaster');
const BillingSetupPackageDetail = require('../models/BillingSetupPackageDetail');

// Mock Request and Response
const mockReq = (body = {}, query = {}, params = {}, user = { id: 1 }) => ({
    body,
    query,
    params,
    user
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

async function testBillingSetupAPI() {
    console.log('Starting Billing Setup API Verification...');

    try {
        // 1. Test Search Services (Mocking Service Search)
        console.log('Testing Search Services...');
        // We will mock the Service.searchByName temporarily for this test if database isn't populated with 'Blood'
        // But let's assume valid DB connection exists from previous steps

        const reqSearch = mockReq({}, { term: 'General' });
        const resSearch = mockRes();
        await BillingSetupController.searchServices(reqSearch, resSearch);
        console.log('Search Result Status:', resSearch.statusCode || 200); // Default to 200 if status not called
        console.log('Search Result Data Length:', resSearch.data ? resSearch.data.length : 0);


        // 2. Test Create Service Setup
        console.log('Testing Create Service Setup...');
        const serviceData = {
            type_of_service: 'service',
            service_name: 'API Test Service',
            patient_charge: 100,
            b2b_charge: 80,
            special_charge: 90,
            branch_id: 1
        };
        const reqCreateService = mockReq(serviceData);
        const resCreateService = mockRes();
        await BillingSetupController.createBillingSetup(reqCreateService, resCreateService);
        console.log('Create Service Status:', resCreateService.statusCode);
        if (resCreateService.statusCode === 201) {
            console.log('PASS: Service Created:', resCreateService.data.service_name);
        } else {
            console.error('FAIL: Create Service Failed', resCreateService.data);
        }

        // 3. Test Create Package Setup
        console.log('Testing Create Package Setup...');
        const packageData = {
            type_of_service: 'package',
            service_name: 'API Test Package',
            patient_charge: 500,
            b2b_charge: 400,
            special_charge: 450,
            branch_id: 1,
            package_details: [
                { service_name: 'Comp 1', patient_charge: 100 },
                { service_name: 'Comp 2', patient_charge: 100 }
            ]
        };
        const reqCreatePackage = mockReq(packageData);
        const resCreatePackage = mockRes();
        await BillingSetupController.createBillingSetup(reqCreatePackage, resCreatePackage);
        console.log('Create Package Status:', resCreatePackage.statusCode);
        if (resCreatePackage.statusCode === 201) {
            console.log('PASS: Package Created:', resCreatePackage.data.service_name);
            console.log('PASS: Package Details Count:', resCreatePackage.data.package_details.length);
        } else {
            console.error('FAIL: Create Package Failed', resCreatePackage.data);
        }

        // 4. Test Get Branch Setups
        console.log('Testing Get Branch Setups...');
        const reqGet = mockReq({}, {}, { branchId: 1 });
        const resGet = mockRes();
        await BillingSetupController.getBranchBillingSetups(reqGet, resGet);
        console.log('Get Branch Setups Status:', resGet.statusCode || 200);
        console.log('Branch Setups Count:', resGet.data ? resGet.data.length : 0);

        console.log('API Verification Completed.');
        process.exit(0);

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    }
}

testBillingSetupAPI();
