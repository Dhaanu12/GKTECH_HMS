const Service = require('../models/Service');
const { AppError } = require('../middleware/errorHandler');

class ServiceController {
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
