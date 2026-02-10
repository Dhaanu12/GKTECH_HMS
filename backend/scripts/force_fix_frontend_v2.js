const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../../frontend/app/doctor/patients/[id]/page.tsx');

console.log(`Processing file: ${targetPath}`);

try {
    let content = fs.readFileSync(targetPath, 'utf8');

    // Target the specific console.error line in Block 1
    // We use a substring that is highly unique.
    const uniqueStr = 'console.error(`Session Expired/Invalid (401) accessing: ${failedUrl}`);';

    // We also target the alert line to be sure we are replacing the right block.
    // Note: The alert has \n\n. In the file content read as utf8, this might be resolved or escaped.
    // We'll search for the console.error, then look ahead for router.push.

    const idx = content.indexOf(uniqueStr);

    if (idx !== -1) {
        console.log(`Found Block 1 anchor at index ${idx}`);

        // Define the start of the block body (after 'const failedUrl = ...;')
        // matching the console.error line

        // We want to replace everything from 'console.error' down to 'return;' inclusive.
        // We will search for 'return;' after the anchor.

        const returnIdx = content.indexOf('return;', idx);
        if (returnIdx !== -1) {
            const startReplaceIdx = idx;
            const endReplaceIdx = returnIdx + 'return;'.length;

            // Check if 'router.push' is within this range to be safe
            const chunk = content.substring(startReplaceIdx, endReplaceIdx);
            if (chunk.includes("router.push('/login')")) {
                console.log('Verified chunk contains router.push. Proceeding with replacement.');

                const newBlockBody = `const pageUrl = typeof window !== 'undefined' ? window.location.href : 'unknown';
                console.error(\`[SESSION ERROR] 401 accessing: \${failedUrl} from page: \${pageUrl}\`);
                showCustomAlert('error', 'Session Error', \`Your session may have expired. Please log in again.\\nFailed URL: \${failedUrl}\`);
                return;`;

                const newContent = content.substring(0, startReplaceIdx) + newBlockBody + content.substring(endReplaceIdx);
                fs.writeFileSync(targetPath, newContent, 'utf8');
                console.log('Successfully replaced Block 1 content.');
            } else {
                console.warn('Chunk did not contain router.push. Aborting to prevent bad edit.');
                console.log('Chunk:', chunk);
            }
        } else {
            console.warn('Could not find closing "return;" for Block 1.');
        }

    } else {
        console.warn('Block 1 anchor string NOT found. It might be already fixed or slightly different.');
        // Debug: Print context if fuzzy match found?
        // Let's print the line 265 area if we can guess it.
        // Or finding 'Session Expired/Invalid' loosely.
        const looseIdx = content.indexOf('Session Expired/Invalid');
        if (looseIdx !== -1) {
            console.log('Found loose match for "Session Expired/Invalid" at', looseIdx);
            console.log('Context:', content.substring(looseIdx - 50, looseIdx + 100));
        }
    }

} catch (err) {
    console.error('Error:', err);
}
