/**
 * PatientContextService
 * 
 * Aggregates complete patient context for intelligent prescription decisions:
 * - Bio data (age, gender, blood group)
 * - Allergies (parsed from free text)
 * - Current medications
 * - Live vitals from current OPD visit
 * - Past OPD visits and diagnoses
 * - Past prescriptions from consultations
 */

const { query } = require('../config/db');

class PatientContextService {
    /**
     * Get complete patient context for prescription template decisions
     * @param {number} patientId - Patient ID
     * @param {number} opdId - Current OPD entry ID (for live vitals)
     * @returns {Object} Complete patient context
     */
    static async getPatientContext(patientId, opdId = null) {
        try {
            // 1. Get patient bio data
            const patientResult = await query(`
                SELECT 
                    patient_id,
                    first_name,
                    last_name,
                    age,
                    gender,
                    blood_group,
                    allergies,
                    current_medications,
                    medical_history,
                    contact_number
                FROM patients
                WHERE patient_id = $1
            `, [patientId]);

            if (patientResult.rows.length === 0) {
                return null;
            }

            const patient = patientResult.rows[0];

            // 2. Get live vitals from current OPD visit
            let liveVitals = null;
            if (opdId) {
                const vitalsResult = await query(`
                    SELECT 
                        vital_signs,
                        chief_complaint,
                        symptoms
                    FROM opd_entries
                    WHERE opd_id = $1 AND patient_id = $2
                `, [opdId, patientId]);

                if (vitalsResult.rows.length > 0) {
                    liveVitals = vitalsResult.rows[0].vital_signs;
                }
            }

            // 3. Get past OPD visits (last 5)
            const pastVisitsResult = await query(`
                SELECT 
                    opd_id,
                    visit_date,
                    visit_type,
                    chief_complaint,
                    diagnosis,
                    prescription,
                    doctor_id,
                    d.first_name || ' ' || d.last_name as doctor_name,
                    visit_status
                FROM opd_entries o
                LEFT JOIN doctors d ON o.doctor_id = d.doctor_id
                WHERE o.patient_id = $1 
                  AND o.visit_status = 'Completed'
                ORDER BY o.visit_date DESC
                LIMIT 5
            `, [patientId]);

            // 4. Get past consultations with prescriptions (last 5)
            const pastConsultationsResult = await query(`
                SELECT 
                    c.outcome_id,
                    c.opd_id,
                    c.diagnosis,
                    c.medications,
                    c.notes,
                    c.created_at,
                    d.first_name || ' ' || d.last_name as doctor_name,
                    d.specialization
                FROM consultation_outcomes c
                LEFT JOIN doctors d ON c.doctor_id = d.doctor_id
                WHERE c.patient_id = $1 
                  AND c.consultation_status = 'Completed'
                ORDER BY c.created_at DESC
                LIMIT 5
            `, [patientId]);

            // 5. Extract recent diagnoses for pattern analysis
            const recentDiagnoses = [];
            pastConsultationsResult.rows.forEach(consultation => {
                if (consultation.diagnosis) {
                    recentDiagnoses.push(consultation.diagnosis);
                }
            });
            pastVisitsResult.rows.forEach(visit => {
                if (visit.diagnosis && !recentDiagnoses.includes(visit.diagnosis)) {
                    recentDiagnoses.push(visit.diagnosis);
                }
            });

            // 6. Parse allergies from free text
            const allergies = this.parseAllergies(patient.allergies);

            // 7. Parse current medications from free text
            const currentMedications = this.parseCurrentMedications(patient.current_medications);

            // 8. Determine age-based category for dosing
            const ageCategory = this.getAgeCategory(patient.age);

            return {
                patientId: patient.patient_id,
                name: `${patient.first_name} ${patient.last_name}`,

                // Bio data
                bioData: {
                    age: patient.age,
                    gender: patient.gender,
                    bloodGroup: patient.blood_group,
                    ageCategory: ageCategory
                },

                // Safety critical data
                allergies: allergies,
                allergyRaw: patient.allergies,
                currentMedications: currentMedications,
                currentMedicationsRaw: patient.current_medications,
                medicalHistory: patient.medical_history,

                // Live vitals from current visit
                liveVitals: liveVitals,

                // Historical data
                pastVisits: pastVisitsResult.rows,
                pastConsultations: pastConsultationsResult.rows,
                recentDiagnoses: recentDiagnoses.slice(0, 5),

                // Extracted patterns
                visitCount: pastVisitsResult.rows.length,
                lastVisitDate: pastVisitsResult.rows[0]?.visit_date || null,

                // Placeholder for future nurse reports
                nurseReports: []
            };
        } catch (error) {
            console.error('Error getting patient context:', error);
            throw error;
        }
    }

    /**
     * Parse allergies from free-text field
     * @param {string} allergyText - Raw allergy text from patient record
     * @returns {string[]} Array of normalized allergy keywords
     */
    static parseAllergies(allergyText) {
        if (!allergyText || allergyText.trim() === '') {
            return [];
        }

        // Common delimiters: comma, semicolon, "and", newlines
        const delimiters = /[,;]\s*|\s+and\s+|\n/gi;
        const allergies = allergyText
            .toLowerCase()
            .split(delimiters)
            .map(a => a.trim())
            .filter(a => a.length > 0);

        // Normalize common allergy terms
        const normalized = allergies.map(a => {
            // Remove common suffixes like "allergy", "allergic to"
            return a
                .replace(/\s*allergy$/i, '')
                .replace(/^allergic\s+to\s+/i, '')
                .replace(/\s*sensitivity$/i, '')
                .trim();
        });

        return [...new Set(normalized)]; // Remove duplicates
    }

    /**
     * Parse current medications from free-text field
     * @param {string} medsText - Raw medication text from patient record
     * @returns {string[]} Array of medication names
     */
    static parseCurrentMedications(medsText) {
        if (!medsText || medsText.trim() === '') {
            return [];
        }

        // Common delimiters
        const delimiters = /[,;]\s*|\n/gi;
        const meds = medsText
            .toLowerCase()
            .split(delimiters)
            .map(m => m.trim())
            .filter(m => m.length > 0);

        // Extract just the drug name (before dosage)
        const drugNames = meds.map(m => {
            // Remove common dosage patterns: "500mg", "10 mg", "1-0-1"
            return m
                .replace(/\s*\d+\s*(mg|ml|mcg|g|iu|units?)/gi, '')
                .replace(/\s*\d+-\d+-\d+/g, '')
                .replace(/\s*\(.*\)/g, '')
                .trim();
        });

        return [...new Set(drugNames.filter(d => d.length > 0))];
    }

    /**
     * Determine age category for appropriate dosing
     * @param {number} age - Patient age
     * @returns {string} Age category
     */
    static getAgeCategory(age) {
        if (!age) return 'adult';
        if (age < 2) return 'infant';
        if (age < 12) return 'pediatric';
        if (age < 18) return 'adolescent';
        if (age < 65) return 'adult';
        return 'geriatric';
    }

    /**
     * Check if a medication conflicts with patient allergies
     * @param {string} drugName - Drug name to check
     * @param {string[]} allergies - Patient's allergies
     * @returns {Object} {hasConflict: boolean, matchedAllergy: string|null}
     */
    static checkAllergyConflict(drugName, allergies) {
        if (!allergies || allergies.length === 0) {
            return { hasConflict: false, matchedAllergy: null };
        }

        const drugLower = drugName.toLowerCase();

        // Drug class mappings for common allergy groups
        const allergyDrugMappings = {
            'aspirin': ['aspirin', 'acetylsalicylic', 'asa'],
            'nsaid': ['ibuprofen', 'naproxen', 'diclofenac', 'indomethacin', 'piroxicam', 'meloxicam', 'celecoxib'],
            'penicillin': ['penicillin', 'amoxicillin', 'ampicillin', 'piperacillin', 'flucloxacillin', 'augmentin'],
            'sulfa': ['sulfamethoxazole', 'sulfasalazine', 'sulfonamide', 'bactrim', 'cotrimoxazole'],
            'cephalosporin': ['cephalexin', 'ceftriaxone', 'cefixime', 'cefuroxime', 'cefpodoxime'],
            'macrolide': ['azithromycin', 'erythromycin', 'clarithromycin'],
            'fluoroquinolone': ['ciprofloxacin', 'levofloxacin', 'ofloxacin', 'norfloxacin']
        };

        for (const allergy of allergies) {
            // Direct match
            if (drugLower.includes(allergy) || allergy.includes(drugLower)) {
                return { hasConflict: true, matchedAllergy: allergy };
            }

            // Check drug class mappings
            for (const [allergyClass, drugs] of Object.entries(allergyDrugMappings)) {
                if (allergy.includes(allergyClass)) {
                    for (const drug of drugs) {
                        if (drugLower.includes(drug)) {
                            return { hasConflict: true, matchedAllergy: `${allergy} (${allergyClass} class)` };
                        }
                    }
                }
            }
        }

        return { hasConflict: false, matchedAllergy: null };
    }

    /**
     * Get safety analysis for a list of medications
     * @param {Array} medications - Array of medication objects
     * @param {Object} patientContext - Patient context from getPatientContext()
     * @returns {Object} Safety analysis results
     */
    static analyzeMedicationSafety(medications, patientContext) {
        const warnings = [];
        const excluded = [];
        const safe = [];

        for (const med of medications) {
            const allergyCheck = this.checkAllergyConflict(
                med.drug_name,
                patientContext.allergies
            );

            if (allergyCheck.hasConflict) {
                excluded.push({
                    ...med,
                    reason: `Patient allergy: ${allergyCheck.matchedAllergy}`,
                    severity: 'high'
                });
            } else {
                // Check age appropriateness
                if (med.age_min && patientContext.bioData.age < med.age_min) {
                    warnings.push({
                        drug: med.drug_name,
                        warning: `Minimum age ${med.age_min}, patient is ${patientContext.bioData.age}`,
                        severity: 'medium'
                    });
                }
                if (med.age_max && patientContext.bioData.age > med.age_max) {
                    warnings.push({
                        drug: med.drug_name,
                        warning: `Maximum age ${med.age_max}, patient is ${patientContext.bioData.age}`,
                        severity: 'medium'
                    });
                }

                safe.push(med);
            }
        }

        return {
            safe: safe,
            excluded: excluded,
            warnings: warnings,
            isSafeOverall: excluded.length === 0
        };
    }
}

module.exports = PatientContextService;
