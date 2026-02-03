-- Update GST rates for hospital services

-- Set all services to 0% GST (Medical services are typically GST exempt in India)
UPDATE hospital_services 
SET gst_rate = 0, 
    updated_at = CURRENT_TIMESTAMP
WHERE gst_rate IS NULL OR gst_rate = 0;

-- Optional: Set specific services to 18% GST (if they are taxable)
-- Uncomment and modify service codes as needed

-- Example: Lab tests might have GST
-- UPDATE hospital_services 
-- SET gst_rate = 18, 
--     updated_at = CURRENT_TIMESTAMP
-- WHERE service_code IN ('LAB-BLOOD', 'LAB-URINE', 'LAB-SUGAR');

-- Example: Diagnostic services might have GST
-- UPDATE hospital_services 
-- SET gst_rate = 18, 
--     updated_at = CURRENT_TIMESTAMP
-- WHERE service_code LIKE 'XRAY%' OR service_code LIKE 'CT%' OR service_code LIKE 'MRI%';

-- Example: Cosmetic procedures have 18% GST
-- UPDATE hospital_services 
-- SET gst_rate = 18, 
--     updated_at = CURRENT_TIMESTAMP
-- WHERE service_code LIKE 'COSMETIC%';

-- View updated GST rates
SELECT 
    service_code,
    service_name,
    gst_rate,
    CASE 
        WHEN gst_rate = 0 THEN 'GST Exempt'
        WHEN gst_rate = 5 THEN '5% GST'
        WHEN gst_rate = 12 THEN '12% GST'
        WHEN gst_rate = 18 THEN '18% GST'
        WHEN gst_rate = 28 THEN '28% GST'
        ELSE 'Custom GST'
    END as gst_category
FROM hospital_services
ORDER BY gst_rate DESC, service_name;
