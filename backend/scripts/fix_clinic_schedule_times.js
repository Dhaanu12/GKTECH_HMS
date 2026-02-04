const db = require('../config/db');

// Function to normalize time from various formats to HH:MM 24-hour format
function normalizeTime(timeStr) {
    if (!timeStr || timeStr === '') return '';

    const cleaned = timeStr.trim();

    // If already in HH:MM format (no AM/PM), just return first 5 chars
    if (!cleaned.includes('AM') && !cleaned.includes('PM') && !cleaned.includes('am') && !cleaned.includes('pm')) {
        return cleaned.slice(0, 5);
    }

    // Handle malformed data like "01:00 05:00 PM" - extract the last time with AM/PM
    const timeWithPeriodMatch = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
    if (timeWithPeriodMatch) {
        let hours = parseInt(timeWithPeriodMatch[1]);
        const minutes = timeWithPeriodMatch[2];
        const period = timeWithPeriodMatch[3].toUpperCase();

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    // Fallback: try to extract any valid time pattern
    const anyTimeMatch = cleaned.match(/(\d{1,2}):(\d{2})/);
    if (anyTimeMatch) {
        return `${anyTimeMatch[1].padStart(2, '0')}:${anyTimeMatch[2]}`;
    }

    console.warn('Could not normalize time:', timeStr);
    return '';
}

async function fixClinicScheduleTimes() {
    try {
        console.log('Starting clinic schedule time fix...');

        // Get all branches with clinic_schedule
        const result = await db.query('SELECT branch_id, clinic_schedule FROM branches WHERE clinic_schedule IS NOT NULL');

        console.log(`Found ${result.rows.length} branches with clinic schedules`);

        for (const branch of result.rows) {
            const schedule = branch.clinic_schedule;
            let needsUpdate = false;
            const fixedSchedule = {};

            // Check each day
            for (const day in schedule) {
                const daySchedule = schedule[day];
                const fixedDay = {
                    isOpen: daySchedule.isOpen,
                    start1: normalizeTime(daySchedule.start1 || ''),
                    end1: normalizeTime(daySchedule.end1 || ''),
                    start2: normalizeTime(daySchedule.start2 || ''),
                    end2: normalizeTime(daySchedule.end2 || '')
                };

                // Check if any time was changed
                if (fixedDay.start1 !== daySchedule.start1 ||
                    fixedDay.end1 !== daySchedule.end1 ||
                    fixedDay.start2 !== daySchedule.start2 ||
                    fixedDay.end2 !== daySchedule.end2) {
                    needsUpdate = true;
                    console.log(`Branch ${branch.branch_id}, ${day}:`);
                    if (fixedDay.start1 !== daySchedule.start1) console.log(`  start1: "${daySchedule.start1}" -> "${fixedDay.start1}"`);
                    if (fixedDay.end1 !== daySchedule.end1) console.log(`  end1: "${daySchedule.end1}" -> "${fixedDay.end1}"`);
                    if (fixedDay.start2 !== daySchedule.start2) console.log(`  start2: "${daySchedule.start2}" -> "${fixedDay.start2}"`);
                    if (fixedDay.end2 !== daySchedule.end2) console.log(`  end2: "${daySchedule.end2}" -> "${fixedDay.end2}"`);
                }

                fixedSchedule[day] = fixedDay;
            }

            // Update the database if needed
            if (needsUpdate) {
                await db.query(
                    'UPDATE branches SET clinic_schedule = $1 WHERE branch_id = $2',
                    [JSON.stringify(fixedSchedule), branch.branch_id]
                );
                console.log(`✅ Updated branch ${branch.branch_id}`);
            } else {
                console.log(`✓ Branch ${branch.branch_id} already has correct format`);
            }
        }

        console.log('\n✅ Clinic schedule time fix completed!');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing clinic schedule times:', error);
        process.exit(1);
    }
}

fixClinicScheduleTimes();
