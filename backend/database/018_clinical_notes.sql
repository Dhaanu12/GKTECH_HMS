-- Clinical Notes Table for Time-Series Tracking
-- Stores individual clinical notes with full attribution and categorization

CREATE TABLE IF NOT EXISTS clinical_notes (
    note_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    opd_id INT,  -- Optional link to OPD visit
    branch_id INT NOT NULL,
    
    -- Note Content
    note_type VARCHAR(50) NOT NULL DEFAULT 'General',  -- SOAP, Progress, Assessment, Plan, Procedure, Discharge, etc.
    title VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Clinical Context
    diagnosis_codes TEXT[],  -- ICD codes if applicable
    is_confidential BOOLEAN DEFAULT FALSE,  -- For sensitive notes
    is_pinned BOOLEAN DEFAULT FALSE,  -- Important notes to highlight
    
    -- Metadata
    created_by INT NOT NULL,  -- user_id of creator
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    updated_at TIMESTAMP,
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by INT,
    
    -- Foreign Keys
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (opd_id) REFERENCES opd_entries(opd_id) ON DELETE SET NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient ON clinical_notes(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_opd ON clinical_notes(opd_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_branch ON clinical_notes(branch_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_type ON clinical_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_created ON clinical_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_pinned ON clinical_notes(patient_id, is_pinned) WHERE is_pinned = true;

-- Note types enum-like constraint
ALTER TABLE clinical_notes 
ADD CONSTRAINT check_note_type 
CHECK (note_type IN (
    'General',
    'SOAP',           -- Subjective, Objective, Assessment, Plan
    'Progress',       -- Progress notes
    'Assessment',     -- Clinical assessment
    'Plan',           -- Treatment plan
    'Procedure',      -- Procedure notes
    'Consultation',   -- Consultation notes
    'Discharge',      -- Discharge summary
    'Follow-up',      -- Follow-up notes
    'Nursing',        -- Nursing notes
    'Lab',            -- Lab-related notes
    'Imaging',        -- Radiology notes
    'Medication',     -- Medication-related notes
    'Allergy',        -- Allergy documentation
    'History'         -- Medical history notes
));

-- Comments
COMMENT ON TABLE clinical_notes IS 'Time-series storage of clinical notes for comprehensive patient history';
COMMENT ON COLUMN clinical_notes.note_type IS 'Category of clinical note (SOAP, Progress, Assessment, etc.)';
COMMENT ON COLUMN clinical_notes.is_confidential IS 'Marks sensitive notes that require special access';
COMMENT ON COLUMN clinical_notes.is_pinned IS 'Important notes to always show at the top';
