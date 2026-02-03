-- 25. DOCTOR_WEEKLY_SCHEDULES TABLE
-- Defines the recurring weekly schedule for doctors
CREATE TABLE IF NOT EXISTS doctor_weekly_schedules (
    schedule_id SERIAL PRIMARY KEY,
    doctor_id INT NOT NULL,
    branch_id INT NOT NULL,
    day_of_week VARCHAR(10) CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    avg_consultation_time INT DEFAULT 15, -- in minutes
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    UNIQUE (doctor_id, branch_id, day_of_week, start_time)
);

-- Index for fast lookup by day
CREATE INDEX IF NOT EXISTS idx_dr_schedule_day ON doctor_weekly_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_dr_schedule_branch ON doctor_weekly_schedules(branch_id);

-- Trigger for updating timestamp
CREATE TRIGGER update_doctor_weekly_schedules_updated_at BEFORE UPDATE ON doctor_weekly_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
