# Backend Scripts

This folder contains utility scripts for database maintenance and fixes.

## Available Scripts

### 1. `fix_all_sequences.js` - Database Sequence Repair
**Purpose**: Fix auto-increment sequences after database restores or imports

**When to use:**
- After restoring database backups
- After importing SQL dumps
- When you see "duplicate key" errors
- After migrating data between environments

**How to run:**
```bash
cd backend
node scripts/fix_all_sequences.js
```

**What it does:**
- Automatically detects all tables with serial/auto-increment columns
- Checks if sequences are in sync with actual data
- Resets sequences to `max_id + 1` where needed
- Reports detailed status for each table

**Example output:**
```
Found 64 tables with sequences

✅ prescriptions.prescription_id: max=42, sequence 2 → 43
✅ appointments.appointment_id: max=38, sequence 5 → 39
✓  user_sessions.session_id: OK (max=697, seq=698)
✓  users.user_id: OK (max=186, seq=191)

✅ All sequences checked and fixed!
```

## Common Issues Solved

### Issue: "duplicate key value violates unique constraint"
**Solution**: Run `fix_all_sequences.js`

This error occurs when the database sequence is out of sync with the actual data, typically after a restore.

### Issue: "Session expired" or login errors
**Solution**: Check if `user_sessions` sequence needs fixing

### Issue: Can't create new records (appointments, prescriptions, etc.)
**Solution**: Run `fix_all_sequences.js` to fix all table sequences

## Best Practices

1. **Always backup** before running any database scripts
2. **Run sequence fix** immediately after any database restore
3. **Check the output** to see which sequences were fixed
4. **Test the application** after running fixes

## Script Safety

All scripts in this folder:
- ✅ Are read-mostly operations (only update sequences, not data)
- ✅ Use transactions where applicable
- ✅ Provide detailed logging
- ✅ Handle errors gracefully
- ✅ Auto-close database connections

## Need Help?

If you encounter issues:
1. Check the script output for error messages
2. Verify database connection settings in `.env`
3. Ensure PostgreSQL is running
4. Check database user permissions

---
**Last Updated**: 2026-02-10
