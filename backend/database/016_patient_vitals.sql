-- Patient Vitals Table for Time-Series Tracking
-- This allows multiple vital readings per patient over time

CREATE TABLE IF NOT EXISTS patient_vitals (
    vital_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    opd_id INT,  -- Optional link to OPD visit
    branch_id INT NOT NULL,
    
    -- Vital Signs
    blood_pressure_systolic INT,  -- mmHg
    blood_pressure_diastolic INT, -- mmHg
    pulse_rate INT,               -- bpm
    temperature DECIMAL(4,1),     -- °F (e.g., 98.6)
    spo2 INT,                     -- %
    respiratory_rate INT,         -- breaths/min
    weight DECIMAL(5,2),          -- kg
    height DECIMAL(5,2),          -- cm
    
    -- Additional vitals
    blood_glucose INT,            -- mg/dL
    pain_level INT CHECK (pain_level >= 0 AND pain_level <= 10),  -- 0-10 scale
    
    -- Metadata
    notes TEXT,
    recorded_by INT NOT NULL,     -- user_id of recorder
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (opd_id) REFERENCES opd_entries(opd_id) ON DELETE SET NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE RESTRICT,
    FOREIGN KEY (recorded_by) REFERENCES users(user_id) ON DELETE RESTRICT
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_patient_vitals_patient_id ON patient_vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_vitals_recorded_at ON patient_vitals(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_vitals_patient_date ON patient_vitals(patient_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_vitals_branch ON patient_vitals(branch_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_vitals_opd ON patient_vitals(opd_id);

-- Comment on table
COMMENT ON TABLE patient_vitals IS 'Time-series storage of patient vital signs for tracking changes over time';
