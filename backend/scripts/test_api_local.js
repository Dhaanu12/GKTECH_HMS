
require('dotenv').config({ path: 'backend/.env' });
const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testApi() {
    try {
        console.log('--- Testing API Local ---');

        const SECRET = process.env.JWT_SECRET;
        if (!SECRET) {
            console.error('JWT_SECRET not found in .env');
            return;
        }

        // Generate Token for Geetha (User ID 180)
        // Payload must match what middleware expects. 
        // Middleware verifies token, then fetches user from DB.
        // auth.js: const decoded = JWTUtils.verifyAccessToken(token); ... const user = await User.findById(decoded.userId);
        const payload = { userId: 180 };
        const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });

        console.log('Generated Token for User 180');

        const url = 'http://localhost:5000/api/patients/search';
        // Note: frontend calls /search, which calls getAllPatients if q is empty.

        console.log(`GET ${url}`);

        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Status:', response.status);
        console.log('Data count:', response.data.data.patients.length);
        if (response.data.data.patients.length > 0) {
            console.log('First Patient:', response.data.data.patients[0].first_name);
        } else {
            console.log('No patients returned from API.');
        }

    } catch (error) {
        if (error.response) {
            console.error('API Error Status:', error.response.status);
            console.error('API Error Data:', error.response.data);
        } else {
            console.error('Request failed:', error.message);
        }
    }
}

testApi();
