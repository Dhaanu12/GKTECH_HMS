const controller = require('./controllers/BillingSetupController');

async function testController() {
    const req = {
        query: {
            term: 'gbrs',
            category: 'lab_test',
            branchId: '1'
        }
    };

    const res = {
        status: (code) => ({
            json: (data) => console.log(`[Response ${code}]`, JSON.stringify(data, null, 2))
        }),
        json: (data) => console.log('[Response 200]', JSON.stringify(data, null, 2))
    };

    try {
        console.log('Testing searchServices directly...');
        await controller.searchServices(req, res);
    } catch (err) {
        console.error('Controller crashed:', err);
    }
}

testController();
