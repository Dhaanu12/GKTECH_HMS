const LeadData = require('../models/LeadData');
const { AppError } = require('../middleware/errorHandler');

class LeadDataController {
    /**
     * Get All Lead Data
     */
    static async getAllLeadData(req, res, next) {
        try {
            const { search, startDate, endDate } = req.query;
            const leads = await LeadData.getLeads({ search, startDate, endDate });

            res.status(200).json({
                status: 'success',
                results: leads.length,
                data: { leads }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get Lead Data by ID
     */
    static async getLeadDataById(req, res, next) {
        try {
            const { id } = req.params;
            const lead = await LeadData.findById(id);

            if (!lead) {
                return next(new AppError('Lead data not found', 404));
            }

            res.status(200).json({
                status: 'success',
                data: { lead }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }
}

module.exports = LeadDataController;
