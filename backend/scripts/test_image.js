const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/uploads/logo-1765347892588-941941737.jpg',
    method: 'GET'
};

const req = http.request(options, res => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
});

req.on('error', error => {
    console.error(error);
});

req.end();
