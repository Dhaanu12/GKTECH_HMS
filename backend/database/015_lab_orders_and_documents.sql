-- =============================================
-- LAB ORDERS AND PATIENT DOCUMENTS MIGRATION
-- =============================================

-- 1. LAB ORDERS TABLE
-- Tracks tests/examinations ordered by doctors
CREATE TABLE IF NOT EXISTS lab_orders (
    order_id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    branch_id INT NOT NULL,
    opd_id INT,
    prescription_id INT,
    test_name VARCHAR(200) NOT NULL,
    test_code VARCHAR(50),
    test_category VARCHAR(50) NOT NULL CHECK (test_category IN ('Lab', 'Imaging', 'Procedure', 'Examination', 'Other')),
    priority VARCHAR(20) NOT NULL DEFAULT 'Routine' CHECK (priority IN ('Routine', 'Urgent', 'STAT')),
    status VARCHAR(30) NOT NULL DEFAULT 'Ordered' CHECK (status IN ('Ordered', 'In-Progress', 'Completed', 'Cancelled')),
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP,
    completed_at TIMESTAMP,
    instructions TEXT,
    notes TEXT,
    result_summary TEXT,
    assigned_nurse_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE RESTRICT,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE RESTRICT,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE RESTRICT,
    FOREIGN KEY (opd_id) REFERENCES opd_entries(opd_id) ON DELETE SET NULL,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_nurse_id) REFERENCES nurses(nurse_id) ON DELETE SET NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_branch ON lab_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_priority ON lab_orders(priority);
CREATE INDEX IF NOT EXISTS idx_lab_orders_scheduled ON lab_orders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_lab_orders_ordered_at ON lab_orders(ordered_at);

-- 2. PATIENT DOCUMENTS TABLE
-- Stores uploaded files as encrypted binary data
CREATE TABLE IF NOT EXISTS patient_documents (
    document_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    lab_order_id INT,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('Lab Result', 'Imaging', 'Report', 'Prescription', 'Consent', 'ID Proof', 'Insurance', 'Other')),
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_mime_type VARCHAR(100) NOT NULL,
    file_size INT NOT NULL,
    file_data BYTEA NOT NULL,
    encryption_iv BYTEA NOT NULL,
    file_checksum VARCHAR(64) NOT NULL,
    description TEXT,
    uploaded_by INT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE RESTRICT,
    FOREIGN KEY (lab_order_id) REFERENCES lab_orders(order_id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_lab_order ON patient_documents(lab_order_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_type ON patient_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_patient_documents_deleted ON patient_documents(is_deleted);

-- 3. DOCUMENT ACCESS LOG TABLE
-- Full audit trail for document access
CREATE TABLE IF NOT EXISTS document_access_log (
    log_id SERIAL PRIMARY KEY,
    document_id INT NOT NULL,
    user_id INT NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('UPLOAD', 'VIEW', 'DOWNLOAD', 'DELETE', 'HARD_DELETE', 'RESTORE')),
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES patient_documents(document_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_document_access_log_document ON document_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_user ON document_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_action ON document_access_log(action);
CREATE INDEX IF NOT EXISTS idx_document_access_log_accessed_at ON document_access_log(accessed_at);

-- 4. LAB ORDER STATUS HISTORY TABLE
-- Track status changes for lab orders
CREATE TABLE IF NOT EXISTS lab_order_status_history (
    history_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by INT NOT NULL,
    notes TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES lab_orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_lab_order_status_history_order ON lab_order_status_history(order_id);

-- 5. Trigger to auto-update updated_at on lab_orders
CREATE OR REPLACE FUNCTION update_lab_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lab_orders_updated_at ON lab_orders;
CREATE TRIGGER trigger_lab_orders_updated_at
    BEFORE UPDATE ON lab_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_lab_orders_updated_at();

-- 6. Function to generate order number
CREATE OR REPLACE FUNCTION generate_lab_order_number()
RETURNS TRIGGER AS $$
DECLARE
    seq_num INT;
    date_part VARCHAR(8);
BEGIN
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 10) AS INT)), 0) + 1
    INTO seq_num
    FROM lab_orders
    WHERE order_number LIKE 'LO' || date_part || '%';
    
    NEW.order_number := 'LO' || date_part || LPAD(seq_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_lab_order_number ON lab_orders;
CREATE TRIGGER trigger_generate_lab_order_number
    BEFORE INSERT ON lab_orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_lab_order_number();
