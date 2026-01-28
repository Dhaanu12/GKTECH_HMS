-- Add branch_id to referral_doctor
ALTER TABLE referral_doctor
ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(branch_id) ON DELETE SET NULL;

-- Backfill branch_id based on created_by user's current branch
-- Casting s.user_id to TEXT to match potentially VARCHAR created_by column
UPDATE referral_doctor rd
SET branch_id = sb.branch_id
FROM staff s
JOIN staff_branches sb ON s.staff_id = sb.staff_id
WHERE rd.created_by = s.user_id::TEXT;
