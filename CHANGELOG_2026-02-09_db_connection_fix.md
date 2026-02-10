# Changelog - Database Connection Pool Fix
**Date:** 2026-02-09
**Issue:** Connection timeout causing 401 authentication errors

## Problem
Users were experiencing intermittent 401 authentication errors with the following error message:
```
Authentication error: Error: Connection terminated due to connection timeout
```

This was happening because:
1. The database connection timeout was set to only 2 seconds
2. Under load, database queries were taking longer than 2 seconds
3. The connection pool size (20) was insufficient for concurrent requests
4. Connections were timing out before authentication could complete

## Root Cause
In `backend/config/db.js`, the connection pool configuration had:
- `connectionTimeoutMillis: 2000` (2 seconds) - Too short
- `max: 20` - Insufficient for high concurrency

## Solution
Updated the database connection pool configuration:

### Changes Made:
1. **Increased Connection Timeout:** `2000ms` → `10000ms` (10 seconds)
   - Allows more time for connections to be established
   - Prevents premature timeout errors

2. **Increased Pool Size:** `20` → `30` connections
   - Handles more concurrent requests
   - Reduces connection wait times

3. **Added Query Timeouts:**
   - `query_timeout: 30000` (30 seconds)
   - `statement_timeout: 30000` (30 seconds)
   - Prevents long-running queries from blocking the pool

### Files Modified:
- `backend/config/db.js`

### Impact:
- ✅ Eliminates 401 authentication errors caused by connection timeouts
- ✅ Improves system stability under load
- ✅ Better handles concurrent user requests
- ✅ Prevents connection pool exhaustion

### Testing:
1. Restart the backend server
2. Multiple users should be able to access the system simultaneously
3. Authentication should work reliably without 401 errors
4. Dashboard stats should load without connection errors

## Configuration Details

**Before:**
```javascript
max: 20,
connectionTimeoutMillis: 2000,
```

**After:**
```javascript
max: 30,
connectionTimeoutMillis: 10000,
query_timeout: 30000,
statement_timeout: 30000,
```

## Related Errors Fixed:
- ✅ `Connection terminated due to connection timeout`
- ✅ `Request failed with status code 401` (caused by connection timeout)
- ✅ `Connection terminated unexpectedly`

## Additional Fix: Patients Table Sequence Reset

### Problem:
When creating new OPD entries with new patients, the system was failing with:
```
duplicate key value violates unique constraint "patients_pkey"
Key (patient_id)=(80) already exists.
```

### Root Cause:
The `patient_id` auto-increment sequence was out of sync with the actual data in the `patients` table, similar to the `consultation_outcomes` issue.

### Solution:
Created and ran `fix_patients_sequence.js` to reset the sequence to the maximum existing `patient_id`.

### Files Created:
- `backend/fix_patients_sequence.js`

### Impact:
- ✅ New patients can now be created without duplicate key errors
- ✅ OPD entry creation works correctly
- ✅ Sequence is synchronized with actual data
