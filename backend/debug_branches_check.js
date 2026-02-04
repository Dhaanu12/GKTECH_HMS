const axios = require('axios');

async function checkBranches() {
    try {
        console.log('Fetching branches...');
        // First login to get token (using demo credentials from login page)
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@carenex.com', // Trying legacy email
            password: 'Admin123!',
            role: 'SUPER_ADMIN' // Assuming super admin can see all
        });

        const token = loginRes.data.token;
        console.log('Got token');

        const res = await axios.get('http://localhost:5000/api/branches', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const branches = res.data.data.branches;
        console.log(`Found ${branches.length} branches.`);

        branches.forEach(b => {
            console.log(`Branch ID: ${b.branch_id}, Name: ${b.branch_name}`);
            console.log(`  City: "${b.city}" (Type: ${typeof b.city})`);
            console.log(`  State: "${b.state}" (Type: ${typeof b.state})`);
            console.log('---');
        });

    } catch (e) {
        console.error('Error:', e.response ? e.response.data : e.message);
    }
}

checkBranches();
