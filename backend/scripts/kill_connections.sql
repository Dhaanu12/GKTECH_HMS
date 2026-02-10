-- Run this SQL directly in pgAdmin or psql to kill idle connections
-- This will free up connection slots

-- First, see all connections
SELECT pid, usename, application_name, state, state_change 
FROM pg_stat_activity 
WHERE datname = current_database()
ORDER BY state_change DESC;

-- Kill all idle connections (except your current session)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = current_database()
    AND pid <> pg_backend_pid()
    AND state = 'idle';

-- Verify connections are freed
SELECT count(*) as remaining_connections 
FROM pg_stat_activity 
WHERE datname = current_database();
