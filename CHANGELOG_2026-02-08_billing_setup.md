# Changelog - 2026-02-08

## Billing System Setup (Backend)

### 1. Database Schema Changes
- Created new migration file: `backend/migrations/017_create_billing_master_and_details.js`
- **Tables Created:**
  - `billing_master`: Stores the main bill information (bill number, total, status, payment details, etc.).
  - `bill_details`: Stores line items for each bill (linked to `billing_master` via `bill_number`), including service details and costs.

  **Table Schema - `billing_master`:**
  - `bill_master_id` (Primary Key)
  - `bill_number` (Unique)
  - `invoice_id`
  - `description`
  - `branch_id` (Foreign Key -> branches)
  - `mrn_number`
  - `bill_total`
  - `status` (Default: 'Pending')
  - `discounts`
  - `discount_id`
  - `inv_amount`
  - `payment_mode`
  - `transaction_number`
  - `created_at`, `updated_at`

  **Table Schema - `bill_details`:**
  - `bill_detail_id` (Primary Key)
  - `bill_number` (Foreign Key -> billing_master)
  - `invoice_id`
  - `contact_number`
  - `opd_number`
  - `branch_id` (Foreign Key -> branches)
  - `type_of_service`
  - `uuid`
  - `service_id` (Foreign Key -> medical_services)
  - `status` (Default: 'Pending')
  - `requested_by`
  - `cost`
  - `description`
  - `final_price`
  - `created_at`, `updated_at`

### 2. Backend Models Created
- **`backend/models/BillingMaster.js`**:
  - Model class for `billing_master` table.
  - Includes methods: `findByBillNumber`, `findByMRN`, `findByBranch`.
- **`backend/models/BillDetails.js`**:
  - Model class for `bill_details` table.
  - Includes methods: `findByBillNumber`, `findByInvoice`, `findByUUID`.

### 3. Model Registration
- Updated `backend/models/index.js` to export the new `BillingMaster` and `BillDetails` models.

## Service Search Enhancements

### 1. Unified Service Search (Backend)
- **Feature:** Updated `searchServices` in `backend/controllers/billingSetupController.js` to search across:
    - **Medical Services** (Ex: Lab tests from catalog)
    - **General Services** (Ex: Consultations)
    - **Billing Setup Master** (Ex: In-House Custom Packages)
- **Robustness Fix:** Refactored the search query from a single `UNION ALL` (which was causing 500 errors due to type mismatches) to **sequential independent queries**.
    - If one source fails (e.g. SQL error), others still return results.
    - Explicitly handled `NULL` values and ensuring consistent data structure (`id`, `service_name`, `category`, `source`, `price`) for frontend consumption.

### 2. Doctor Portal UI Updates (Frontend)
- **File:** `frontend/app/doctor/patients/[id]/page.tsx`
- **Context-Aware Search:** The search now automatically detects the active OPD visit's branch to filter relevant internal services.
- **Visual Badges:** Added distinct visual indicators in the search dropdown to differentiate service sources:
    - **IN-HOUSE:** Blue pill badge (`#eff6ff`, border, uppercase) for internal billing items.
    - **EXTERNAL:** Emerald pill badge (`#ecfdf5`, border, uppercase) for standard medical catalog items.
- **Styling:** Updated badge styling to match the existing "MLC CASE" tag design (pill-shaped, bordered, tracking-wider).

### 3. Search Bug Fix (Backend)
- **Issue:** Users reported "No results found" for common lab tests (e.g., 'cbc') when searching in the Doctor module.
- **Cause:** The search was strictly filtering `medical_services` by `branch_medical_services` mapping. If a branch hadn't explicitly mapped all common tests, they wouldn't appear.
- **Fix:** Modified `billingSetupController.js` to search the **global** `medical_services` table for the "Medical Services" (External) category.
    - **Result:** Common tests now appear as "External" services even if not explicitly mapped to the branch, while "In-House" billing setups remain branch-specific.
- **Cleanup:** Removed "General Services" (administrative items) from the search results to strictly show only Lab/Medical items (External) and Custom Billing Setups (In-House) as requested.
- **Robustness:** Added a fallback mechanism for the doctor's search. If the current patient visit record is missing branch information, the system now defaults to the logged-in doctor's branch ID. This ensures "In-House" items (like packages) remain searchable even for new or incomplete patient records.
- **Cross-Branch Visibility:** Updated the backend search (Query 3) to include items from **Branch 1 (Head Office)** in addition to the user's current branch. This resolves the issue where doctors logged into subsidiary branches (e.g., Branch 55) could not find global packages like "Full Body Checkup" created in the main branch.
