# Backend Restart Required

## Issue
The backend server is still running the old code that references the `source` column in `lab_orders` table, which has been renamed to `is_external`.

## Error
```
Complete consultation error: error: column "source" of relation "lab_orders" does not exist
```

## Solution
**RESTART THE BACKEND SERVER** to load the updated code.

### Steps:

1. **Stop the backend server**:
   - Press `Ctrl+C` in the terminal running the backend
   - Or close the terminal window

2. **Start the backend server again**:
   ```bash
   cd backend
   npm start
   ```
   Or if using nodemon:
   ```bash
   npm run dev
   ```

3. **Verify the server started successfully**:
   - Look for "Server running on port 5000" message
   - Check for any startup errors

## What Was Changed
The `consultationController.js` file was updated to use `is_external` (boolean) instead of `source` (string):

**Before**:
```javascript
INSERT INTO lab_orders (..., source)
VALUES (..., $11)
```

**After**:
```javascript
INSERT INTO lab_orders (..., is_external)
VALUES (..., $11)
```

## Verification
After restarting, try completing a consultation with lab orders. The error should be resolved.

---
**Note**: If using nodemon, it should auto-restart, but sometimes it doesn't pick up changes. Manual restart is recommended.
