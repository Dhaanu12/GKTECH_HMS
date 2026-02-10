const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../../frontend/app/doctor/patients/[id]/page.tsx');

console.log(`Processing file: ${targetPath}`);

try {
    let content = fs.readFileSync(targetPath, 'utf8');

    // Regex to match the catch block containing alert and redirect for 401
    // Matches: if (axios.isAxiosError(error) && error.response?.status === 401) { ... }
    const regex1 = /if\s*\(\s*axios\.isAxiosError\(error\)\s*&&\s*error\.response\?\.status\s*===\s*401\s*\)\s*\{[\s\S]{1,1000}return;\s*\}/g;

    // This regex is tricky. It might match other blocks if greedy.
    // Let's use a simpler approach: Match specific alert string call and surrounding block.
    // Or replace by string literal match but handle whitespace flexibly.

    // Approach 2: Find all 'if (axios ... 401) { ... }' blocks and replace content.
    // The blocks are slightly different.

    // Block 1 (fetchPatientDetails): Contains 'alert' and 'localStorage.removeItem'
    // Matches: if (...) { ... alert(...) ... router.push('/login') ... }

    const block1Regex = /if\s*\(\s*axios\.isAxiosError\(error\)\s*&&\s*error\.response\?\.status\s*===\s*401\s*\)\s*\{\s*const\s*failedUrl\s*=\s*error\.config\?\.url;\s*console\.error\(`Session\s*Expired\/Invalid\s*\(401\)\s*accessing:\s*\$\{failedUrl\}`\);\s*alert\(`Session\s*expired\.\s*Please\s*log\in\s*again\.\\n\\nFailed\s*to\s*access:\s*\$\{failedUrl\}`\);\s*localStorage\.removeItem\('token'\);\s*localStorage\.removeItem\('user'\);\s*router\.push\('\/login'\);\s*return;\s*\}/g;

    const block1Replace = `if (axios.isAxiosError(error) && error.response?.status === 401) {
                const failedUrl = error.config?.url;
                const pageUrl = typeof window !== 'undefined' ? window.location.href : 'unknown';
                console.error(\`[SESSION ERROR] 401 accessing: \${failedUrl} from page: \${pageUrl}\`);
                showCustomAlert('error', 'Session Error', \`Your session may have expired. Please log in again.\\nFailed URL: \${failedUrl}\`);
                return;
            }`;

    let newContent = content.replace(block1Regex, block1Replace);

    if (newContent !== content) {
        console.log('Replaced block 1 (fetchPatientDetails)');
        content = newContent;
    } else {
        console.log('Block 1 not found (check regex/whitespace)');
        // Fallback: try finding just the alert line? No, risky.
        // Try strict string replace (ignoring whitespace normalizing).
        const strTarget = `            if (axios.isAxiosError(error) && error.response?.status === 401) {
                const failedUrl = error.config?.url;
                console.error(\`Session Expired/Invalid (401) accessing: \${failedUrl}\`);
                alert(\`Session expired. Please log in again.\\n\\nFailed to access: \${failedUrl}\`);

                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/login');
                return;
            }`;
        if (content.indexOf(strTarget) !== -1) {
            content = content.replace(strTarget, block1Replace);
            console.log('Replaced block 1 using string match');
        }
    }

    // Block 2 (fetchReferralData): Contains 'localStorage' and 'router.push', NO alert
    const block2Regex = /if\s*\(\s*axios\.isAxiosError\(error\)\s*&&\s*error\.response\?\.status\s*===\s*401\s*\)\s*\{\s*localStorage\.removeItem\('token'\);\s*localStorage\.removeItem\('user'\);\s*router\.push\('\/login'\);\s*return;\s*\}/g;

    const block2Replace = `if (axios.isAxiosError(error) && error.response?.status === 401) {
                const failedUrl = error.config?.url;
                const pageUrl = typeof window !== 'undefined' ? window.location.href : 'unknown';
                console.error(\`[SESSION ERROR] 401 accessing: \${failedUrl} from page: \${pageUrl} (Referral Data)\`);
                showCustomAlert('error', 'Session Error', \`Your session may have expired (Referral Data). Please log in again.\`);
                return;
            }`;

    newContent = content.replace(block2Regex, block2Replace);
    if (newContent !== content) {
        console.log('Replaced block 2 (fetchReferralData)');
        content = newContent;
    } else {
        // String fallback
        const strTarget2 = `            if (axios.isAxiosError(error) && error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/login');
                return;
            }`;
        if (content.indexOf(strTarget2) !== -1) {
            content = content.replace(strTarget2, block2Replace);
            console.log('Replaced block 2 using string match');
        }
    }

    // Block 3 (loadDraft): Just router.push
    const block3Regex = /if\s*\(\s*axios\.isAxiosError\(error\)\s*&&\s*error\.response\?\.status\s*===\s*401\s*\)\s*\{\s*router\.push\('\/login'\);\s*\}/g;

    const block3Replace = `if (axios.isAxiosError(error) && error.response?.status === 401) {
                console.error('[SESSION ERROR] 401 in loadDraft');
                showCustomAlert('error', 'Session Error', 'Failed to load draft due to session expiry.');
            }`;

    newContent = content.replace(block3Regex, block3Replace);
    if (newContent !== content) {
        console.log('Replaced block 3 (loadDraft)');
        content = newContent;
    } else {
        const strTarget3 = `            if (axios.isAxiosError(error) && error.response?.status === 401) {
                router.push('/login');
            }`;
        if (content.indexOf(strTarget3) !== -1) {
            content = content.replace(strTarget3, block3Replace);
            console.log('Replaced block 3 using string match');
        }
    }

    fs.writeFileSync(targetPath, content, 'utf8');
    console.log('File write complete.');

} catch (err) {
    console.error('Error:', err);
}
