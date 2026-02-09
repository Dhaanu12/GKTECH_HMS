-- Migration: Update OPD Visit Status Constraint to include 'Rescheduled'
-- Date: 2026-02-06
-- Description: The original constraint did not support rescheduling workflows.

-- 1. Drop the existing constraint
ALTER TABLE opd_entries DROP CONSTRAINT IF EXISTS opd_entries_visit_status_check;

-- 2. add the new constraint with 'Rescheduled' included
ALTER TABLE opd_entries ADD CONSTRAINT opd_entries_visit_status_check
CHECK (visit_status IN ('Registered', 'In-consultation', 'Completed', 'Cancelled', 'Rescheduled'));
