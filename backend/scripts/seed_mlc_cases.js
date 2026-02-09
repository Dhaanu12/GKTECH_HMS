const MLCCase = require('../models/MLCCase');
const db = require('../config/db');

const mlcCasesData = [
    { case_name: 'Injury due to Accident', category: 'Injury & Violence' },
    { case_name: 'Injury due to Assault', category: 'Injury & Violence' },
    { case_name: 'Injury with likelihood of death', category: 'Injury & Violence' },
    { case_name: 'Burns', category: 'Injury & Violence' },
    { case_name: 'Firearm Injury', category: 'Injury & Violence' },
    { case_name: 'Hanging / Strangulation', category: 'Injury & Violence' },
    { case_name: 'Domestic Violence', category: 'Injury & Violence' },
    { case_name: 'Child Abuse', category: 'Injury & Violence' },
    { case_name: 'Poisoning (suspected / confirmed)', category: 'Toxicology & Substance' },
    { case_name: 'Drunkenness / Substance Abuse', category: 'Toxicology & Substance' },
    { case_name: 'Brought Dead', category: 'Death Related' },
    { case_name: 'Sudden Death (OT / post-procedure / drug reaction)', category: 'Death Related' },
    { case_name: 'Suspicious Death', category: 'Death Related' },
    { case_name: 'Death due to Natural Disaster', category: 'Death Related' },
    { case_name: 'Sexual Offence – Victim', category: 'Sexual & Reproductive' },
    { case_name: 'Sexual Offence – Accused', category: 'Sexual & Reproductive' },
    { case_name: 'Criminal Abortion', category: 'Sexual & Reproductive' },
    { case_name: 'Person under Police Custody', category: 'Custody & Legal' },
    { case_name: 'Person under Judicial Custody', category: 'Custody & Legal' },
    { case_name: 'Unconscious (cause unknown)', category: 'Special Circumstances' },
    { case_name: 'Suspicious circumstances / improper history', category: 'Special Circumstances' },
    { case_name: 'Any case requiring police investigation', category: 'Special Circumstances' }
];

async function seedMLCCases() {
    try {
        console.log('🌱 Starting MLC Cases seeding...');

        for (const data of mlcCasesData) {
            const existing = await MLCCase.findOne({ case_name: data.case_name });
            if (!existing) {
                await MLCCase.create(data);
                console.log(`✅ Created: ${data.case_name}`);
            } else {
                console.log(`⚠️ Skipped (Already exists): ${data.case_name}`);
            }
        }

        console.log('✨ MLC Cases seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding MLC Cases:', error);
        process.exit(1);
    }
}

seedMLCCases();
