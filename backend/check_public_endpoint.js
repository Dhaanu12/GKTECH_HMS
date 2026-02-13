const axios = require('axios');

async function checkPublicEndpoint() {
    try {
        console.log('Hitting /api/billing-setup/search-services (Public)...');
        const url = 'http://localhost:5000/api/billing-setup/search-services?term=gbrs&category=lab_test&branchId=1';
        const res = await axios.get(url);
        console.log('Status:', res.status);
        console.log('Results count:', Array.isArray(res.data) ? res.data.length : 'Not an array');
        if (Array.isArray(res.data) && res.data.length > 0) {
            console.log('First match:', res.data[0].service_name);
        } else {
            console.log('Data:', JSON.stringify(res.data, null, 2));
        }
    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
            console.error('Response status:', err.response.status);
        }
    }
}

checkPublicEndpoint();
