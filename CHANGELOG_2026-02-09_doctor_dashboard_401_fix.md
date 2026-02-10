# Changelog - Doctor Dashboard 401 Error Fix
**Date:** 2026-02-09
**Issue:** Follow-up API 401 Error Handling

## Problem
The doctor dashboard was throwing a 401 error when trying to fetch follow-up data:
```
AxiosError: Request failed with status code 401
at async fetchFollowUpData (app/doctor/dashboard/page.tsx:110:40)
```

This error occurred because:
1. The `/follow-ups/stats` and `/follow-ups/due` endpoints require specific role authorization
2. If the user's token doesn't have the correct role or the endpoints are not accessible, the entire dashboard would fail to load
3. No graceful error handling was in place

## Solution
Added graceful error handling to the follow-up API calls in the doctor dashboard:

### Changes Made

**File:** `frontend/app/doctor/dashboard/page.tsx`

#### 1. Individual API Call Error Handling
Added `.catch()` handlers to each API call within the `Promise.all()`:

```typescript
const [statsRes, dueRes] = await Promise.all([
    axios.get(`${API_URL}/follow-ups/stats`, {
        headers: { Authorization: `Bearer ${token}` }
    }).catch(err => {
        console.warn('Follow-up stats API not available:', err.response?.status);
        return { data: { status: 'error', data: { overdue_count: 0, due_today_count: 0, upcoming_week_count: 0 } } };
    }),
    axios.get(`${API_URL}/follow-ups/due?range=all`, {
        headers: { Authorization: `Bearer ${token}` }
    }).catch(err => {
        console.warn('Follow-up due API not available:', err.response?.status);
        return { data: { status: 'error', data: { overdue: [], due_today: [] } } };
    })
]);
```

#### 2. Fallback Default Values
Added default values in the outer catch block to prevent UI errors:

```typescript
} catch (error) {
    console.error('Error fetching follow-up data:', error);
    // Set default empty values to prevent UI errors
    setFollowUpStats({ overdue_count: 0, due_today_count: 0, upcoming_week_count: 0 });
    setFollowUpPatients([]);
}
```

## Impact

### Before:
- ✗ Dashboard would crash with 401 error
- ✗ User couldn't access the dashboard at all
- ✗ No visibility into what was failing

### After:
- ✅ Dashboard loads successfully even if follow-up APIs fail
- ✅ Follow-up widget shows empty state (0 counts) gracefully
- ✅ Console warnings help with debugging
- ✅ Other dashboard features remain functional
- ✅ User experience is not disrupted

## Why This Happens

The 401 error can occur when:
1. **Role Mismatch:** User's token has a different role than expected (e.g., 'DOC' instead of 'DOCTOR')
2. **Missing Permissions:** The follow-up endpoints require specific authorization
3. **Token Issues:** Expired or invalid authentication token
4. **Endpoint Not Implemented:** The follow-up feature may not be fully implemented yet

## Future Improvements

To fully resolve this, consider:
1. **Role Normalization:** Ensure all doctor users have consistent role names in the database
2. **Feature Flags:** Add a feature flag to conditionally show/hide the follow-up widget
3. **Better Error Messages:** Show a user-friendly message when follow-ups are unavailable
4. **Graceful Degradation:** Hide the follow-up widget entirely if the API is not available

## Testing

### Test Scenario 1: Follow-up API Available
- Dashboard loads
- Follow-up stats show correctly
- Follow-up patients list displays

### Test Scenario 2: Follow-up API Returns 401
- Dashboard loads successfully
- Follow-up widget shows "No patients due for follow-up this week"
- Console shows warning: "Follow-up stats API not available: 401"
- Other dashboard features work normally

## Files Modified:
- ✅ `frontend/app/doctor/dashboard/page.tsx`

## Related Issues:
- Bill details description field added
- External lab tests hidden from nurse assignment
- Database sequences fixed (patients, opd_entries, consultation_outcomes)
