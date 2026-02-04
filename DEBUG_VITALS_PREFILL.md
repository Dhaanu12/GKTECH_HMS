# DEBUG GUIDE - Vitals Not Pre-filling

## How to Debug:

### Step 1: Open Browser Console
1. Open the vitals page for the patient (Thara)
2. Press **F12** to open Developer Tools
3. Click on the **Console** tab

### Step 2: Look for These Logs:

You should see logs like this:

```
Fetching patient data for ID: [patient_id]
Fetching OPD data for ID: [opd_id]
Patient response: {...}
OPD response: {...}
Full OPD response structure: {...}
OPD data extracted: {...}
OPD data type: object
OPD keys: [...]
Individual vitals check:
  grbs: [value or undefined]
  spo2: [value or undefined]
  pulse: [value or undefined]
  temperature: [value or undefined]
  bp_systolic: [value or undefined]
  bp_diastolic: [value or undefined]
  height: [value or undefined]
  weight: [value or undefined]
Existing vitals found: true/false
Pre-filling vitals: {...}
```

### Step 3: Check These Specific Things:

#### A. **OPD Response Structure**
Look at the "Full OPD response structure" log.
- Does it have `data.opdVisit`?
- Does it have `data.opd`?
- Does it have `data` directly?
- Where are the vitals fields located?

#### B. **Individual Vitals Check**
Look at each vital field:
- Are they showing values (e.g., `grbs: "45"`)?
- Are they showing `undefined`?
- Are they showing `null`?

#### C. **Existing Vitals Found**
- Does it say `true` or `false`?
- If `false`, that's why the button says "Save Vitals"
- If `true`, the button should say "Update Vitals"

### Step 4: Common Issues and Solutions:

#### Issue 1: Vitals are in a different location
**Symptom**: All vitals show `undefined`
**Solution**: The API response structure is different than expected

#### Issue 2: Vitals are null instead of values
**Symptom**: Vitals show `null` instead of actual values
**Solution**: Database has null values, not the actual vitals

#### Issue 3: Wrong OPD record being fetched
**Symptom**: OPD data shows but vitals are empty
**Solution**: Might be fetching a different OPD visit than the one with vitals

### Step 5: What to Share:

Please share a screenshot showing:
1. The "Full OPD response structure" log (expand it to see the full JSON)
2. The "Individual vitals check" section
3. The "Existing vitals found" value
4. The "Pre-filling vitals" object

This will help me identify exactly why the vitals aren't pre-filling!

---

## Expected Data Structure:

Based on the patient details page, the OPD response should look like:

```json
{
  "data": {
    "opdVisit": {
      "opd_id": 123,
      "patient_id": 456,
      "grbs": "45",
      "spo2": "33",
      "pulse": "20",
      "height": "157",
      "weight": "60",
      "bp_systolic": "30",
      "bp_diastolic": "40",
      "temperature": "99",
      // ... other fields
    }
  }
}
```

Or possibly:

```json
{
  "data": {
    "opd_id": 123,
    "patient_id": 456,
    "grbs": "45",
    "spo2": "33",
    // ... vitals directly in data
  }
}
```

---

## Quick Fix if Vitals are in Different Location:

If the console shows vitals are in a different location (e.g., `opdRes.data.opdVisit` instead of `opdRes.data.data.opdVisit`), I can quickly update the code to look in the correct location.

Just share the console output and I'll fix it immediately!
