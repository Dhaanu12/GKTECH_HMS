const fs = require('fs');
const path = require('path');

console.log('\n=== VERIFICATION: Checking if normalizeCategory function exists ===\n');

const filePath = path.join(__dirname, 'controllers', 'consultationController.js');
const content = fs.readFileSync(filePath, 'utf8');

if (content.includes('const normalizeCategory = (category)')) {
    console.log('✅ SUCCESS: normalizeCategory function found!');
    console.log('✅ The backend code has been updated correctly.');
    console.log('\n📋 Next steps:');
    console.log('   1. Restart the backend server (Ctrl+C and npm run dev)');
    console.log('   2. Try completing a consultation');
    console.log('   3. Watch for console logs: [LAB ORDER] Category: "..." -> "..."');
} else {
    console.log('❌ ERROR: normalizeCategory function NOT found!');
    console.log('❌ The file may not have been saved properly.');
    console.log('\n📋 Action required:');
    console.log('   1. Check if consultationController.js was modified');
    console.log('   2. Restart your code editor');
    console.log('   3. Re-apply the changes');
}

console.log('\n');
