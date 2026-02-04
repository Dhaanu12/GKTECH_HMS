-- Feedback System Improvements
-- Adds branch filtering, follow-up tracking, and improved audit trail

-- Add branch_id for filtering feedback by branch
ALTER TABLE patient_feedback 
ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(branch_id);

-- Add follow-up tracking columns
ALTER TABLE patient_feedback 
ADD COLUMN IF NOT EXISTS is_addressed BOOLEAN DEFAULT FALSE;

ALTER TABLE patient_feedback 
ADD COLUMN IF NOT EXISTS addressed_at TIMESTAMP;

ALTER TABLE patient_feedback 
ADD COLUMN IF NOT EXISTS addressed_by INT REFERENCES users(user_id);

ALTER TABLE patient_feedback 
ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;

-- Add OPD link for context
ALTER TABLE patient_feedback 
ADD COLUMN IF NOT EXISTS opd_id INT REFERENCES opd_entries(opd_id);

-- Add updated_at for tracking edits
ALTER TABLE patient_feedback 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_branch ON patient_feedback(branch_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON patient_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON patient_feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_addressed ON patient_feedback(is_addressed);

-- Update existing feedback to have branch from nurse's branch (if possible)
UPDATE patient_feedback pf
SET branch_id = (
    SELECT n.branch_id 
    FROM nurses n 
    JOIN users u ON n.user_id = u.user_id 
    WHERE u.user_id = pf.nurse_id
    LIMIT 1
)
WHERE pf.branch_id IS NULL AND pf.nurse_id IS NOT NULL;

COMMENT ON COLUMN patient_feedback.is_addressed IS 'Whether follow-up action has been taken on this feedback';
COMMENT ON COLUMN patient_feedback.follow_up_notes IS 'Internal notes about actions taken in response to feedback';
