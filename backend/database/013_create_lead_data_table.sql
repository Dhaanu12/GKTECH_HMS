CREATE TABLE IF NOT EXISTS lead_data (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(10) NOT NULL,
    hospital_name VARCHAR(255),
    address TEXT,
    email VARCHAR(255),
    description TEXT,
    demo_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
