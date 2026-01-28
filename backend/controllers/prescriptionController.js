const Prescription = require('../models/Prescription');
const Doctor = require('../models/Doctor');
const { AppError } = require('../middleware/errorHandler');

class PrescriptionController {
    static async createPrescription(req, res, next) {
        try {
            const { patient_id, medications, notes, diagnosis } = req.body;
            const userId = req.user.user_id;

            // Get doctor_id from user_id
            const doctor = await Doctor.findOne({ user_id: userId });
            if (!doctor) {
                return next(new AppError('Doctor profile not found', 404));
            }

            // Get doctor's primary branch or use the one from request if provided (for multi-branch doctors)
            // For now, let's fetch the first branch associated with the doctor
            const branches = await Doctor.getBranches(doctor.doctor_id);
            const branch_id = branches.length > 0 ? branches[0].branch_id : null;

            const prescription = await Prescription.create({
                doctor_id: doctor.doctor_id,
                patient_id,
                branch_id,
                medications, // JSON or Text
                notes,
                diagnosis,
                status: 'Active'
            });

            res.status(201).json({
                status: 'success',
                message: 'Prescription created successfully',
                data: { prescription }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    static async getMyPrescriptions(req, res, next) {
        try {
            const userId = req.user.user_id;
            const { search } = req.query;

            // Get doctor_id
            const doctor = await Doctor.findOne({ user_id: userId });
            if (!doctor) {
                return next(new AppError('Doctor profile not found', 404));
            }

            let prescriptions = await Prescription.findByDoctor(doctor.doctor_id);

            if (search) {
                const searchLower = search.toLowerCase();
                prescriptions = prescriptions.filter(p =>
                    p.patient_first_name.toLowerCase().includes(searchLower) ||
                    p.patient_last_name.toLowerCase().includes(searchLower) ||
                    p.mrn_number.toLowerCase().includes(searchLower)
                );
            }

            res.status(200).json({
                status: 'success',
                results: prescriptions.length,
                data: { prescriptions }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }
}

module.exports = PrescriptionController;
