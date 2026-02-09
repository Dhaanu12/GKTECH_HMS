// Central export file for all models

module.exports = {
    // Core Models
    Role: require('./Role'),
    Hospital: require('./Hospital'),
    User: require('./User'),
    Branch: require('./Branch'),
    Department: require('./Department'),

    // Mapping Models
    BranchDepartment: require('./BranchDepartment'),

    // Personnel Models
    Doctor: require('./Doctor'),
    Nurse: require('./Nurse'),
    Staff: require('./Staff'),

    // Personnel Assignment Models
    DoctorBranch: require('./DoctorBranch'),
    DoctorDepartment: require('./DoctorDepartment'),
    DoctorBranchDepartment: require('./DoctorBranchDepartment'),
    NurseBranch: require('./NurseBranch'),
    StaffBranch: require('./StaffBranch'),

    // Shift Models
    Shift: require('./Shift'),
    ShiftBranch: require('./ShiftBranch'),
    DoctorShift: require('./DoctorShift'),
    NurseShift: require('./NurseShift'),

    // Patient & Appointment Models
    Patient: require('./Patient'),
    Appointment: require('./Appointment'),
    OPDEntry: require('./OPDEntry'),

    // Billing Models
    Service: require('./Service'),
    Billing: require('./Billing'),
    BillingItem: require('./BillingItem'),

    // New Billing Models
    BillingMaster: require('./BillingMaster'),
    BillDetails: require('./BillDetails'),

    // Utility Models
    MLCCaseType: require('./MLCCaseType'),
};
