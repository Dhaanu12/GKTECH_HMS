-- Fix appointment_status constraint to include 'No-show' and preserve 'In OPD'

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_appointment_status_check;

ALTER TABLE appointments ADD CONSTRAINT appointments_appointment_status_check 
CHECK (appointment_status IN ('Scheduled', 'Confirmed', 'Checked-in', 'In OPD', 'Completed', 'Cancelled', 'No-show'));
