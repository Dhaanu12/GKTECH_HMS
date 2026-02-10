const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../../frontend/app/doctor/patients/[id]/page.tsx');

console.log(`Processing file: ${targetPath}`);

try {
    if (fs.existsSync(targetPath)) {
        let content = fs.readFileSync(targetPath, 'utf8');

        // Define the regex to match 'showCustomAlert' calls specifically for 'Session Error'
        // Pattern matches: showCustomAlert('error', 'Session Error', 
        // We replace it with: alert('Session Error\n' + 
        // This converts the 3-arg call into a 1-arg call (concatenated string) which is valid for alert().

        const regex = /showCustomAlert\s*\(\s*'error'\s*,\s*'Session Error'\s*,\s*/g;

        if (regex.test(content)) {
            const newContent = content.replace(regex, "alert('Session Error\\n' + ");
            fs.writeFileSync(targetPath, newContent, 'utf8');
            console.log('Successfully replaced showCustomAlert with native alert for safety.');
        } else {
            console.log('No showCustomAlert calls found (or pattern did not match). File might already be using alert.');
        }
    } else {
        console.error('Target file not found!');
    }
} catch (err) {
    console.error('Error processing file:', err);
}
