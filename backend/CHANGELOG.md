# Changelog

## [Unreleased]

### Added
- **Database Tables**:
    - `billing_setup_master`: To store billing services and packages configuration with audit fields.
    - `billing_setup_package_details`: To store detailed components of billing packages with audit fields.
- **Backend Models**:
    - `BillingSetupMaster.js`: Model for interacting with the main billing setup table.
    - `BillingSetupPackageDetail.js`: Model for interacting with package details.
- **API Endpoints**:
    - `GET /api/billing-setup/search-services`: Search for medical services.
    - `POST /api/billing-setup/create`: Create a new billing setup (Service or Package).
    - `GET /api/billing-setup/branch/:branchId`: List billing setups for a specific branch.
