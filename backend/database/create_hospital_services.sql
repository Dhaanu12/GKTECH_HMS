-- Create Hospital Services Table
CREATE TABLE IF NOT EXISTS hospital_services (
    hosp_service_id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid(),
    hospital_id INT NOT NULL,
    branch_id INT NOT NULL,
    service_code VARCHAR(50) NOT NULL,
    service_name VARCHAR(200) NOT NULL,
    service_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    UNIQUE (hospital_id, branch_id, service_code)
);

-- Add Trigger for updated_at
DROP TRIGGER IF EXISTS update_hospital_services_updated_at ON hospital_services;
CREATE TRIGGER update_hospital_services_updated_at BEFORE UPDATE ON hospital_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Dummy Data
INSERT INTO hospital_services (hospital_id, branch_id, service_code, service_name, service_description, created_by)
SELECT 
    h.hospital_id,
    b.branch_id,
    'OPD-GEN',
    'General OPD Consultation',
    'General Outpatient Department Consultation Service',
    u.user_id
FROM hospitals h
JOIN branches b ON b.hospital_id = h.hospital_id
JOIN users u ON u.email = 'admin@phchms.com'
LIMIT 1;

INSERT INTO hospital_services (hospital_id, branch_id, service_code, service_name, service_description, created_by)
SELECT 
    h.hospital_id,
    b.branch_id,
    'LAB-BLOOD',
    'Blood Test Full Panel',
    'Complete Blood Count and analysis',
    u.user_id
FROM hospitals h
JOIN branches b ON b.hospital_id = h.hospital_id
JOIN users u ON u.email = 'admin@phchms.com'
LIMIT 1;
