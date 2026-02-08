const Service = require('../models/Service');
const MedicalService = require('../models/MedicalService');
const { AppError } = require('../middleware/errorHandler');

class ServiceController {
    /**
     * Search Lab Services (Medical Services - lab_test)
     */
    static async searchHospitalServices(req, res, next) {
        try {
            const { query } = req.query;
            console.log(`[ServiceController] Search Labs Query: '${query}'`); // DEBUG LOG


            if (!query) {
                return res.status(200).json({
                    status: 'success',
                    results: 0,
                    data: { services: [] }
                });
            }

            const services = await MedicalService.searchLabs(query);

            res.status(200).json({
                status: 'success',
                results: services.length,
                data: { services }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get All Services
     */
    static async getAllServices(req, res, next) {
        try {
            const services = await Service.findAll({}, { orderBy: 'service_name ASC' }); // Assuming findAll supports options or just returns all
            res.status(200).json({
                status: 'success',
                results: services.length,
                data: { services }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }
}

module.exports = ServiceController;
