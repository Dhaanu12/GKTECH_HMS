# Complete Consultation Flow - Visual Guide

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│          DOCTOR CLICKS "COMPLETE CONSULTATION"              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  ALWAYS CREATED (100%)                      │
├─────────────────────────────────────────────────────────────┤
│  1. prescriptions table                                     │
│     - medications (JSON)                                    │
│     - labs (JSON)                                           │
│     - diagnosis, notes                                      │
│                                                             │
│  2. consultation_outcomes table                             │
│     - diagnosis, notes                                      │
│     - labs (JSON)                                           │
│     - diagnostic_center (for external labs)                 │
│     - referral info                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
    ┌──────────────────┐        ┌──────────────────┐
    │   IN-HOUSE TEST  │        │  EXTERNAL TEST   │
    │ (billing_master) │        │ (medical_service)│
    └──────────────────┘        └──────────────────┘
              │                           │
              ▼                           ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│  TABLES CREATED:         │    │  TABLES CREATED:         │
│                          │    │                          │
│  1. ✅ lab_orders        │    │  1. ✅ lab_orders        │
│     - test_name          │    │     - test_name          │
│     - test_category      │    │     - test_category      │
│     - status: Ordered    │    │     - status: Ordered    │
│                          │    │                          │
│  2. ✅ billing_master    │    │  2. ❌ NO BILLING        │
│     (PARENT)             │    │                          │
│     - bill_number        │    │  Reason: Patient pays    │
│     - invoice_number     │    │  external lab directly   │
│     - total_amount       │    │                          │
│     - status: Pending    │    │                          │
│                          │    │                          │
│  3. ✅ bill_details      │    │                          │
│     (CHILD)              │    │                          │
│     - service_name       │    │                          │
│     - service_type:      │    │                          │
│       'lab_order'        │    │                          │
│     - department_id: 1   │    │                          │
│     - status: 'Pending'  │    │                          │
│     - unit_price         │    │                          │
│     - subtotal           │    │                          │
└──────────────────────────┘    └──────────────────────────┘
```

## Example Scenarios

### Scenario 1: 2 In-House Tests
**Doctor prescribes:**
- CBC (In-House, ₹500)
- Full Body Checkup (In-House, ₹2000)

**Database Records Created:**

| Table | Records | Details |
|-------|---------|---------|
| `prescriptions` | 1 | labs: [CBC, Full Body Checkup] |
| `consultation_outcomes` | 1 | labs: [CBC, Full Body Checkup] |
| `lab_orders` | 2 | One for CBC, one for Full Body Checkup |
| `billing_master` | 1 | Total: ₹2500 |
| `bill_details` | 2 | Line 1: CBC ₹500, Line 2: Full Body ₹2000 |

**Patient Bill:** ₹2500 (to be paid at hospital)

---

### Scenario 2: 2 External Tests
**Doctor prescribes:**
- Complete Haemogram (External)
- ESR Test (External)
- Diagnostic Center: "Jansons Diagnostic Center"

**Database Records Created:**

| Table | Records | Details |
|-------|---------|---------|
| `prescriptions` | 1 | labs: [Complete Haemogram, ESR Test] |
| `consultation_outcomes` | 1 | labs: [Complete Haemogram, ESR Test]<br>diagnostic_center: "Jansons Diagnostic Center" |
| `lab_orders` | 2 | One for Complete Haemogram, one for ESR Test |
| `billing_master` | 0 | ❌ NOT CREATED |
| `bill_details` | 0 | ❌ NOT CREATED |

**Patient Bill:** ₹0 (patient pays Jansons directly)

---

### Scenario 3: Mixed (1 In-House + 1 External)
**Doctor prescribes:**
- CBC (In-House, ₹500)
- Complete Haemogram (External)
- Diagnostic Center: "Jansons Diagnostic Center"

**Database Records Created:**

| Table | Records | Details |
|-------|---------|---------|
| `prescriptions` | 1 | labs: [CBC, Complete Haemogram] |
| `consultation_outcomes` | 1 | labs: [CBC, Complete Haemogram]<br>diagnostic_center: "Jansons Diagnostic Center" |
| `lab_orders` | 2 | One for CBC, one for Complete Haemogram |
| `billing_master` | 1 | Total: ₹500 (only CBC) |
| `bill_details` | 1 | Line 1: CBC ₹500 |

**Patient Bill:** ₹500 (for in-house CBC only)

---

## Database Constraints (All Satisfied)

### lab_orders table:
- ✅ `test_category` must be: Lab, Imaging, Procedure, Examination, Other
- ✅ Normalized by `normalizeCategory()` function

### bill_details table:
- ✅ `department_id` must be NOT NULL → Set to 1 (Lab/Diagnostic)
- ✅ `service_type` must be: consultation, lab_order, procedure, pharmacy, scan, surgery, bed_charge, other → Set to 'lab_order'
- ✅ `status` must be: Pending, Billed, Paid, Cancelled → Set to 'Pending'
- ✅ `item_discount_type` must be: percentage, fixed, none → Set to 'none'

---

## Code Flow Summary

```javascript
// 1. ALWAYS: Create prescription
INSERT INTO prescriptions (medications, labs, ...)

// 2. ALWAYS: Process each lab test
for (const lab of labs) {
    // Create lab order (for ALL tests)
    INSERT INTO lab_orders (test_name, test_category, ...)
    
    // Check if in-house
    if (lab.source === 'billing_master' && lab.price > 0) {
        // Add to billing items
        billingItems.push({...})
    }
}

// 3. CONDITIONAL: Create billing (only if billingItems exist)
if (billingItems.length > 0) {
    // Create parent invoice
    INSERT INTO billing_master (bill_number, total_amount, ...)
    
    // Create child line items
    for (const item of billingItems) {
        INSERT INTO bill_details (
            department_id: 1,
            service_type: 'lab_order',
            status: 'Pending',
            ...
        )
    }
}

// 4. ALWAYS: Create consultation outcome
INSERT INTO consultation_outcomes (
    diagnosis,
    labs,
    diagnostic_center,  // For external labs
    ...
)
```

---

## All Issues Fixed ✅

1. ✅ Category normalization (lab_test → Lab)
2. ✅ Billing separation (in-house vs external)
3. ✅ Diagnostic center storage
4. ✅ Sequence reset (outcome_id)
5. ✅ Department ID (default 1)
6. ✅ Service type ('lab_order')
7. ✅ Status ('Pending')

**Total Sections in Changelog:** 15

**Status:** READY FOR PRODUCTION ✅
