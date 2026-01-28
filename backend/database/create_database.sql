-- =============================================
-- DATABASE CREATION SCRIPT
-- =============================================
-- Run this script first to create the database
-- Then run schema.sql to create tables

CREATE DATABASE hms_database
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'English_United States.1252'
    LC_CTYPE = 'English_United States.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE hms_database
    IS 'Hospital Management System Database';
