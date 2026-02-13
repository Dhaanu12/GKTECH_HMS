const BillingSetupController = require('./controllers/BillingSetupController');
const db = require('./config/db');

async function test() {
    console.log('--- RE-TESTING searchServices WITH NEW SOURCE NAME ---');
    const req = {
        query: {
            term: 'gbrs',
            category: 'lab_test',
            branchId: '45'
        }
    };
    const res = {
        json: (data) => {
            console.log('RE-TEST SUCCESS JSON:', JSON.stringify(data, null, 2));
        },
        status: (code) => ({
            json: (data) => console.log(`ERROR ${code}:`, data)
        })
    };

    try {
        await BillingSetupController.searchServices(req, res);
    } catch (err) {
        console.error('FATAL:', err);
    } finally {
        await db.pool.end();
    }
}
test();
