const axios = require('axios');

async function testApi() {
    try {
        const term = 'gbrs';
        const category = 'lab_test';
        const branchId = '1';

        console.log(`Testing API: http://localhost:5000/api/billing-setup/search-services?term=${term}&category=${category}&branchId=${branchId}`);

        // Note: This test implies we don't need auth or we need to login first. 
        // Since we can't easily login without credentials, we might fail 401.
        // But let's check if we get 401 or Connection Refused or valid response (if auth disabled for dev).

        // Try login first? 
        // I don't have credentials. 
        // I'll assume I can bypass auth or just check if endpoint is 404.

        const res = await axios.get(`http://localhost:5000/api/billing-setup/search-services?term=${term}&category=${category}&branchId=${branchId}`, {
            validateStatus: () => true // Don't throw on error status
        });

        console.log('Status:', res.status);
        console.log('Data:', res.data);

    } catch (err) {
        console.error('Error hitting API:', err.message);
    }
}

testApi();
