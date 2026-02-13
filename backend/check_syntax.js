try {
    const controller = require('./controllers/BillingSetupController');
    console.log('BillingSetupController syntax is valid.');
} catch (e) {
    console.error('Syntax Error in BillingSetupController:', e);
}
