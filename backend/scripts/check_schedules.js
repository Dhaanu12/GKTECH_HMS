const db = require('../config/db');

async function checkAndFixSchedules() {
    try {
        console.log('Checking clinic schedules...\n');

        // Get all branches with clinic_schedule
        const result = await db.query('SELECT branch_id, clinic_schedule FROM branches WHERE clinic_schedule IS NOT NULL');

        console.log(`Found ${result.rows.length} branches\n`);

        for (const branch of result.rows) {
            console.log(`\n=== Branch ${branch.branch_id} ===`);
            console.log('Current schedule:', JSON.stringify(branch.clinic_schedule, null, 2));

            const schedule = branch.clinic_schedule;
            const fixedSchedule = {};
            let hasIssues = false;

            for (const day in schedule) {
                const dayData = schedule[day];

                // Check for malformed times
                const times = [dayData.start1, dayData.end1, dayData.start2, dayData.end2];
                times.forEach((time, idx) => {
                    const fieldNames = ['start1', 'end1', 'start2', 'end2'];
                    if (time && (time.includes('AM') || time.includes('PM') || time.includes('am') || time.includes('pm'))) {
                        console.log(`  ${day}.${fieldNames[idx]}: "${time}" <-- HAS AM/PM`);
                        hasIssues = true;
                    }
                });

                fixedSchedule[day] = dayData;
            }

            if (hasIssues) {
                console.log('\n⚠️  This branch has time format issues!');
            } else {
                console.log('\n✓ This branch looks OK');
            }
        }

        console.log('\n\nDone!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAndFixSchedules();
