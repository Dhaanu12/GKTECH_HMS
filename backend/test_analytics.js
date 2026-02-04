const axios = require('axios');

// Get a valid token first - you'll need to replace this with actual token
const token = process.env.TEST_TOKEN || 'YOUR_TOKEN_HERE';

const API_URL = 'http://localhost:5000/api';

(async () => {
    try {
        console.log('Testing analytics endpoints...\n');

        // Test 1: Hospital/Branch Analytics
        console.log('1. Testing /accountant/analytics/hospital-branch');
        const r1 = await axios.get(`${API_URL}/accountant/analytics/hospital-branch`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Response:', JSON.stringify(r1.data, null, 2));

        // Test 2: Insurer Analytics
        console.log('\n2. Testing /accountant/analytics/insurers');
        const r2 = await axios.get(`${API_URL}/accountant/analytics/insurers`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Response:', JSON.stringify(r2.data, null, 2));

        // Test 3: Regular claims
        console.log('\n3. Testing /accountant/claims');
        const r3 = await axios.get(`${API_URL}/accountant/claims`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Response - Count:', r3.data.count);

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
})();
