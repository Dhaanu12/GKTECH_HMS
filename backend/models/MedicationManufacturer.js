const BaseModel = require('./BaseModel');

class MedicationManufacturer extends BaseModel {
    constructor() {
        super('medication_manufacturers', 'id');
    }

    async findByName(name) {
        return await this.findOne({ name });
    }
}

module.exports = new MedicationManufacturer();
