-- Fix Duplicated Roles
-- The user reported existing roles with specific IDs and Codes.
-- My previous migration (004) inserted duplicate roles because of mismatched codes.
-- This script will:
-- 1. Migrate any users assigned to the "Bad" roles to the "Good" roles.
-- 2. Delete the "Bad" roles.

DO $$
DECLARE
    -- Mismatches identified:
    -- User: ACCNT (12) vs Mine: ACCOUNTANT
    -- User: MRKT_EXEC (8) vs Mine: MARKETING_EXECUTIVE
    
    bad_accountant_id INT;
    bad_marketing_id INT;
BEGIN
    -- 1. Fix Accountant
    SELECT role_id INTO bad_accountant_id FROM roles WHERE role_code = 'ACCOUNTANT';
    IF bad_accountant_id IS NOT NULL THEN
        -- Update users to point to ID 12 (ACCNT)
        UPDATE users SET role_id = 12 WHERE role_id = bad_accountant_id;
        -- Delete the bad role
        DELETE FROM roles WHERE role_id = bad_accountant_id;
    END IF;

    -- 2. Fix Marketing Executive
    SELECT role_id INTO bad_marketing_id FROM roles WHERE role_code = 'MARKETING_EXECUTIVE';
    IF bad_marketing_id IS NOT NULL THEN
        -- Update users to point to ID 8 (MRKT_EXEC)
        UPDATE users SET role_id = 8 WHERE role_id = bad_marketing_id;
        -- Delete the bad role
        DELETE FROM roles WHERE role_id = bad_marketing_id;
    END IF;

    -- 3. Ensure "Good" roles exist (just in case) - ID 1-12 should be there as per user.
    -- If text descriptions need update we could do it here, but let's respect user's data.

END $$;
