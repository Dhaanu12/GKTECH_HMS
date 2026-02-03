
-- Ensure function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 25. DOCTOR_WEEKLY_SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS doctor_weekly_schedules (
    schedule_id SERIAL PRIMARY KEY,
    doctor_id INT NOT NULL,
    branch_id INT NOT NULL,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    avg_consultation_time INT DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    UNIQUE (doctor_id, branch_id, day_of_week, start_time)
);

DROP TRIGGER IF EXISTS update_doctor_weekly_schedules_updated_at ON doctor_weekly_schedules;

CREATE TRIGGER update_doctor_weekly_schedules_updated_at BEFORE UPDATE ON doctor_weekly_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
