--
-- PostgreSQL database dump
--

\restrict wffeIPacr9lNqofiGe8M1aTIj19giFHCPG52bImVPnYcVzL1bXtw3XpcD29evec

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: cleanup_expired_sessions(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_expired_sessions() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions
    WHERE expires_at < CURRENT_TIMESTAMP
    OR (is_active = FALSE AND last_activity < CURRENT_TIMESTAMP - INTERVAL '30 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION public.cleanup_expired_sessions() OWNER TO postgres;

--
-- Name: update_session_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_session_activity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.last_activity = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_session_activity() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
-- Name: update_updated_at_column_ist(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column_ist() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column_ist() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    appointment_id integer NOT NULL,
    appointment_number character varying(50) NOT NULL,
    patient_name character varying(200),
    phone_number character varying(20),
    email character varying(100),
    age integer,
    gender character varying(10),
    patient_id integer,
    doctor_id integer NOT NULL,
    branch_id integer NOT NULL,
    department_id integer,
    appointment_date date NOT NULL,
    appointment_time time without time zone NOT NULL,
    reason_for_visit text,
    appointment_status character varying(20) DEFAULT 'Scheduled'::character varying,
    booking_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    confirmed_by integer,
    cancelled_by integer,
    cancellation_reason text,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT appointments_appointment_status_check CHECK (((appointment_status)::text = ANY ((ARRAY['Scheduled'::character varying, 'Confirmed'::character varying, 'Checked-in'::character varying, 'Completed'::character varying, 'Cancelled'::character varying, 'No-show'::character varying])::text[]))),
    CONSTRAINT appointments_gender_check CHECK (((gender)::text = ANY ((ARRAY['Male'::character varying, 'Female'::character varying, 'Other'::character varying])::text[])))
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- Name: appointments_appointment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.appointments_appointment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointments_appointment_id_seq OWNER TO postgres;

--
-- Name: appointments_appointment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointments_appointment_id_seq OWNED BY public.appointments.appointment_id;


--
-- Name: billing_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.billing_items (
    bill_item_id integer NOT NULL,
    bill_id integer NOT NULL,
    service_id integer,
    item_code character varying(50),
    quantity integer DEFAULT 1,
    unit_price numeric(10,2) NOT NULL,
    item_total numeric(12,2) GENERATED ALWAYS AS (((quantity)::numeric * unit_price)) STORED,
    doctor_id integer,
    department_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.billing_items OWNER TO postgres;

--
-- Name: billing_items_bill_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.billing_items_bill_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.billing_items_bill_item_id_seq OWNER TO postgres;

--
-- Name: billing_items_bill_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.billing_items_bill_item_id_seq OWNED BY public.billing_items.bill_item_id;


--
-- Name: billings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.billings (
    bill_id integer NOT NULL,
    bill_number character varying(50) NOT NULL,
    patient_id integer NOT NULL,
    branch_id integer NOT NULL,
    opd_id integer,
    admission_id integer,
    bill_date date NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    net_payable numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT 0,
    bill_status character varying(20) DEFAULT 'Draft'::character varying,
    payment_method character varying(20),
    insurance_claim_id character varying(100),
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT billings_bill_status_check CHECK (((bill_status)::text = ANY ((ARRAY['Draft'::character varying, 'Generated'::character varying, 'Paid'::character varying, 'Partial'::character varying, 'Cancelled'::character varying])::text[]))),
    CONSTRAINT billings_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['Cash'::character varying, 'Card'::character varying, 'UPI'::character varying, 'Net-banking'::character varying, 'Insurance'::character varying, 'Cheque'::character varying, 'Other'::character varying])::text[])))
);


ALTER TABLE public.billings OWNER TO postgres;

--
-- Name: billings_bill_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.billings_bill_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.billings_bill_id_seq OWNER TO postgres;

--
-- Name: billings_bill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.billings_bill_id_seq OWNED BY public.billings.bill_id;


--
-- Name: branch_departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branch_departments (
    hospital_dept_id integer NOT NULL,
    branch_id integer NOT NULL,
    department_id integer NOT NULL,
    floor_number character varying(10),
    room_numbers character varying(255),
    head_of_department character varying(100),
    is_operational boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.branch_departments OWNER TO postgres;

--
-- Name: branch_departments_hospital_dept_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.branch_departments_hospital_dept_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.branch_departments_hospital_dept_id_seq OWNER TO postgres;

--
-- Name: branch_departments_hospital_dept_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branch_departments_hospital_dept_id_seq OWNED BY public.branch_departments.hospital_dept_id;


--
-- Name: branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branches (
    branch_id integer NOT NULL,
    hospital_id integer NOT NULL,
    branch_name character varying(200) NOT NULL,
    branch_code character varying(50) NOT NULL,
    address_line1 character varying(255),
    address_line2 character varying(255),
    city character varying(100),
    state character varying(100),
    pincode character varying(10),
    country character varying(100) DEFAULT 'India'::character varying,
    latitude numeric(10,8),
    longitude numeric(11,8),
    contact_number character varying(20),
    email character varying(100),
    branch_manager character varying(100),
    total_beds integer,
    emergency_available boolean DEFAULT false,
    icu_beds integer DEFAULT 0,
    general_beds integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.branches OWNER TO postgres;

--
-- Name: branches_branch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.branches_branch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.branches_branch_id_seq OWNER TO postgres;

--
-- Name: branches_branch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branches_branch_id_seq OWNED BY public.branches.branch_id;


--
-- Name: client_modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.client_modules (
    client_module_id integer NOT NULL,
    client_id integer NOT NULL,
    module_id integer NOT NULL,
    registered_date date DEFAULT CURRENT_DATE,
    marketing_id integer,
    status character varying(20) DEFAULT 'Active'::character varying,
    created_by character varying(100),
    updated_by character varying(100),
    created_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'::text),
    updated_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'::text),
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    branch_id integer
);


ALTER TABLE public.client_modules OWNER TO postgres;

--
-- Name: client_modules_client_module_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.client_modules_client_module_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_modules_client_module_id_seq OWNER TO postgres;

--
-- Name: client_modules_client_module_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.client_modules_client_module_id_seq OWNED BY public.client_modules.client_module_id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    department_id integer NOT NULL,
    department_name character varying(100) NOT NULL,
    department_code character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_department_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_department_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_department_id_seq OWNER TO postgres;

--
-- Name: departments_department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_department_id_seq OWNED BY public.departments.department_id;


--
-- Name: doctor_branch_departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_branch_departments (
    doc_hosp_dept_id integer NOT NULL,
    doctor_id integer NOT NULL,
    branch_id integer NOT NULL,
    department_id integer NOT NULL,
    is_primary boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.doctor_branch_departments OWNER TO postgres;

--
-- Name: doctor_branch_departments_doc_hosp_dept_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctor_branch_departments_doc_hosp_dept_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_branch_departments_doc_hosp_dept_id_seq OWNER TO postgres;

--
-- Name: doctor_branch_departments_doc_hosp_dept_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_branch_departments_doc_hosp_dept_id_seq OWNED BY public.doctor_branch_departments.doc_hosp_dept_id;


--
-- Name: doctor_branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_branches (
    doc_hospital_id integer NOT NULL,
    doctor_id integer NOT NULL,
    branch_id integer NOT NULL,
    joining_date date,
    employment_type character varying(20) DEFAULT 'Permanent'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT doctor_branches_employment_type_check CHECK (((employment_type)::text = ANY ((ARRAY['Permanent'::character varying, 'Visiting'::character varying, 'Consultant'::character varying, 'Contract'::character varying])::text[])))
);


ALTER TABLE public.doctor_branches OWNER TO postgres;

--
-- Name: doctor_branches_doc_hospital_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctor_branches_doc_hospital_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_branches_doc_hospital_id_seq OWNER TO postgres;

--
-- Name: doctor_branches_doc_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_branches_doc_hospital_id_seq OWNED BY public.doctor_branches.doc_hospital_id;


--
-- Name: doctor_departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_departments (
    doc_dept_id integer NOT NULL,
    doctor_id integer NOT NULL,
    department_id integer NOT NULL,
    is_primary_department boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.doctor_departments OWNER TO postgres;

--
-- Name: doctor_departments_doc_dept_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctor_departments_doc_dept_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_departments_doc_dept_id_seq OWNER TO postgres;

--
-- Name: doctor_departments_doc_dept_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_departments_doc_dept_id_seq OWNED BY public.doctor_departments.doc_dept_id;


--
-- Name: doctor_shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_shifts (
    doctor_shift_id integer NOT NULL,
    doctor_id integer NOT NULL,
    branch_id integer NOT NULL,
    shift_id integer NOT NULL,
    department_id integer,
    shift_date date NOT NULL,
    attendance_status character varying(20) DEFAULT 'Present'::character varying,
    check_in_time timestamp without time zone,
    check_out_time timestamp without time zone,
    patients_attended integer DEFAULT 0,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT doctor_shifts_attendance_status_check CHECK (((attendance_status)::text = ANY ((ARRAY['Present'::character varying, 'Absent'::character varying, 'Late'::character varying, 'Half-day'::character varying, 'On-leave'::character varying])::text[])))
);


ALTER TABLE public.doctor_shifts OWNER TO postgres;

--
-- Name: doctor_shifts_doctor_shift_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctor_shifts_doctor_shift_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_shifts_doctor_shift_id_seq OWNER TO postgres;

--
-- Name: doctor_shifts_doctor_shift_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_shifts_doctor_shift_id_seq OWNED BY public.doctor_shifts.doctor_shift_id;


--
-- Name: doctors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctors (
    doctor_id integer NOT NULL,
    user_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    doctor_code character varying(50) NOT NULL,
    gender character varying(10),
    date_of_birth date,
    contact_number character varying(20),
    email character varying(100),
    qualification character varying(255),
    specialization character varying(255),
    experience_years integer,
    registration_number character varying(100) NOT NULL,
    registration_council character varying(100),
    address text,
    emergency_contact character varying(100),
    consultation_fee numeric(10,2),
    is_active boolean DEFAULT true,
    profile_photo character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT doctors_gender_check CHECK (((gender)::text = ANY ((ARRAY['Male'::character varying, 'Female'::character varying, 'Other'::character varying])::text[])))
);


ALTER TABLE public.doctors OWNER TO postgres;

--
-- Name: doctors_doctor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctors_doctor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctors_doctor_id_seq OWNER TO postgres;

--
-- Name: doctors_doctor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctors_doctor_id_seq OWNED BY public.doctors.doctor_id;


--
-- Name: hospitals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hospitals (
    hospital_id integer NOT NULL,
    hospital_name character varying(200) NOT NULL,
    hospital_code character varying(50) NOT NULL,
    headquarters_address text,
    contact_number character varying(20),
    email character varying(100),
    established_date date,
    total_beds integer,
    hospital_type character varying(20) DEFAULT 'Private'::character varying,
    accreditation character varying(100),
    website character varying(200),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hospitals_hospital_type_check CHECK (((hospital_type)::text = ANY ((ARRAY['Government'::character varying, 'Private'::character varying, 'Trust'::character varying, 'Corporate'::character varying])::text[])))
);


ALTER TABLE public.hospitals OWNER TO postgres;

--
-- Name: hospitals_hospital_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hospitals_hospital_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hospitals_hospital_id_seq OWNER TO postgres;

--
-- Name: hospitals_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hospitals_hospital_id_seq OWNED BY public.hospitals.hospital_id;


--
-- Name: modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modules (
    module_id integer NOT NULL,
    module_code character varying(50) NOT NULL,
    module_name character varying(100) NOT NULL,
    field1 character varying(255),
    field2 character varying(255),
    status character varying(20) DEFAULT 'Active'::character varying,
    created_by character varying(100),
    updated_by character varying(100),
    created_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'::text),
    updated_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'::text),
    uuid uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE public.modules OWNER TO postgres;

--
-- Name: modules_module_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.modules_module_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.modules_module_id_seq OWNER TO postgres;

--
-- Name: modules_module_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.modules_module_id_seq OWNED BY public.modules.module_id;


--
-- Name: nurse_branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nurse_branches (
    nurse_hospital_id integer NOT NULL,
    nurse_id integer NOT NULL,
    branch_id integer NOT NULL,
    department_id integer,
    joining_date date,
    employment_type character varying(20) DEFAULT 'Permanent'::character varying,
    "position" character varying(100),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT nurse_branches_employment_type_check CHECK (((employment_type)::text = ANY ((ARRAY['Permanent'::character varying, 'Contract'::character varying, 'Temporary'::character varying])::text[])))
);


ALTER TABLE public.nurse_branches OWNER TO postgres;

--
-- Name: nurse_branches_nurse_hospital_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nurse_branches_nurse_hospital_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nurse_branches_nurse_hospital_id_seq OWNER TO postgres;

--
-- Name: nurse_branches_nurse_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nurse_branches_nurse_hospital_id_seq OWNED BY public.nurse_branches.nurse_hospital_id;


--
-- Name: nurse_shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nurse_shifts (
    nurse_shift_id integer NOT NULL,
    nurse_id integer NOT NULL,
    branch_id integer NOT NULL,
    shift_id integer NOT NULL,
    department_id integer,
    shift_date date NOT NULL,
    attendance_status character varying(20) DEFAULT 'Present'::character varying,
    check_in_time timestamp without time zone,
    check_out_time timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT nurse_shifts_attendance_status_check CHECK (((attendance_status)::text = ANY ((ARRAY['Present'::character varying, 'Absent'::character varying, 'Late'::character varying, 'Half-day'::character varying, 'On-leave'::character varying])::text[])))
);


ALTER TABLE public.nurse_shifts OWNER TO postgres;

--
-- Name: nurse_shifts_nurse_shift_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nurse_shifts_nurse_shift_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nurse_shifts_nurse_shift_id_seq OWNER TO postgres;

--
-- Name: nurse_shifts_nurse_shift_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nurse_shifts_nurse_shift_id_seq OWNED BY public.nurse_shifts.nurse_shift_id;


--
-- Name: nurses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nurses (
    nurse_id integer NOT NULL,
    user_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    nurse_code character varying(50) NOT NULL,
    gender character varying(10),
    date_of_birth date,
    contact_number character varying(20),
    email character varying(100),
    qualification character varying(255),
    specialization character varying(255),
    experience_years integer,
    registration_number character varying(100) NOT NULL,
    registration_council character varying(100),
    address text,
    emergency_contact character varying(100),
    is_active boolean DEFAULT true,
    profile_photo character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT nurses_gender_check CHECK (((gender)::text = ANY ((ARRAY['Male'::character varying, 'Female'::character varying, 'Other'::character varying])::text[])))
);


ALTER TABLE public.nurses OWNER TO postgres;

--
-- Name: nurses_nurse_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nurses_nurse_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nurses_nurse_id_seq OWNER TO postgres;

--
-- Name: nurses_nurse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nurses_nurse_id_seq OWNED BY public.nurses.nurse_id;


--
-- Name: opd_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.opd_entries (
    opd_id integer NOT NULL,
    opd_number character varying(50) NOT NULL,
    patient_id integer NOT NULL,
    branch_id integer NOT NULL,
    department_id integer,
    doctor_id integer NOT NULL,
    appointment_id integer,
    visit_type character varying(20) DEFAULT 'Walk-in'::character varying,
    visit_date date NOT NULL,
    visit_time time without time zone,
    token_number character varying(20),
    reason_for_visit text,
    symptoms text,
    vital_signs jsonb,
    chief_complaint text,
    diagnosis text,
    prescription text,
    lab_tests_ordered text,
    follow_up_required boolean DEFAULT false,
    follow_up_date date,
    consultation_fee numeric(10,2),
    payment_status character varying(20) DEFAULT 'Pending'::character varying,
    visit_status character varying(20) DEFAULT 'Registered'::character varying,
    checked_in_time timestamp without time zone,
    consultation_start_time timestamp without time zone,
    consultation_end_time timestamp without time zone,
    checked_in_by integer,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT opd_entries_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['Paid'::character varying, 'Pending'::character varying, 'Partial'::character varying, 'Waived'::character varying])::text[]))),
    CONSTRAINT opd_entries_visit_status_check CHECK (((visit_status)::text = ANY ((ARRAY['Registered'::character varying, 'In-consultation'::character varying, 'Completed'::character varying, 'Cancelled'::character varying])::text[]))),
    CONSTRAINT opd_entries_visit_type_check CHECK (((visit_type)::text = ANY ((ARRAY['Walk-in'::character varying, 'Follow-up'::character varying, 'Emergency'::character varying, 'Referral'::character varying])::text[])))
);


ALTER TABLE public.opd_entries OWNER TO postgres;

--
-- Name: opd_entries_opd_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.opd_entries_opd_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.opd_entries_opd_id_seq OWNER TO postgres;

--
-- Name: opd_entries_opd_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.opd_entries_opd_id_seq OWNED BY public.opd_entries.opd_id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    reset_id integer NOT NULL,
    user_id integer NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: password_reset_tokens_reset_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_reset_tokens_reset_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_tokens_reset_id_seq OWNER TO postgres;

--
-- Name: password_reset_tokens_reset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_reset_tokens_reset_id_seq OWNED BY public.password_reset_tokens.reset_id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patients (
    patient_id integer NOT NULL,
    mrn_number character varying(50) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    patient_code character varying(50) NOT NULL,
    gender character varying(10),
    date_of_birth date,
    age integer,
    blood_group character varying(5),
    contact_number character varying(20),
    email character varying(100),
    address text,
    city character varying(100),
    state character varying(100),
    pincode character varying(10),
    emergency_contact_name character varying(100),
    emergency_contact_number character varying(20),
    emergency_contact_relation character varying(50),
    aadhar_number character varying(12),
    insurance_provider character varying(100),
    insurance_policy_number character varying(100),
    medical_history text,
    allergies text,
    current_medications text,
    is_active boolean DEFAULT true,
    registration_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT patients_blood_group_check CHECK (((blood_group)::text = ANY ((ARRAY['A+'::character varying, 'A-'::character varying, 'B+'::character varying, 'B-'::character varying, 'AB+'::character varying, 'AB-'::character varying, 'O+'::character varying, 'O-'::character varying])::text[]))),
    CONSTRAINT patients_gender_check CHECK (((gender)::text = ANY ((ARRAY['Male'::character varying, 'Female'::character varying, 'Other'::character varying])::text[])))
);


ALTER TABLE public.patients OWNER TO postgres;

--
-- Name: patients_patient_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.patients_patient_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patients_patient_id_seq OWNER TO postgres;

--
-- Name: patients_patient_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.patients_patient_id_seq OWNED BY public.patients.patient_id;


--
-- Name: referral_doctor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referral_doctor (
    id integer NOT NULL,
    department_id integer,
    doctor_name character varying(100) NOT NULL,
    mobile_number character varying(20),
    speciality_type character varying(100),
    medical_council_membership_number character varying(100),
    council character varying(100),
    pan_card_number character varying(255),
    aadhar_card_number character varying(255),
    bank_name character varying(100),
    bank_branch character varying(100),
    bank_address text,
    bank_account_number character varying(50),
    bank_ifsc_code character varying(20),
    photo_upload_path character varying(255),
    pan_upload_path character varying(255),
    aadhar_upload_path character varying(255),
    referral_pay character(1) DEFAULT 'N'::bpchar,
    tenant_id integer,
    marketing_spoc character varying(100),
    introduced_by character varying(100),
    status character varying(20) DEFAULT 'Pending'::character varying,
    created_by character varying(100),
    updated_by character varying(100),
    created_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'::text),
    updated_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'::text),
    geo_latitude numeric(10,8),
    geo_longitude numeric(11,8),
    geo_accuracy numeric(10,2),
    geo_altitude numeric(10,2),
    geo_altitude_accuracy numeric(10,2),
    geo_heading numeric(10,2),
    geo_speed numeric(10,2),
    geo_timestamp timestamp without time zone,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    address text,
    clinic_photo_path character varying(255)
);


ALTER TABLE public.referral_doctor OWNER TO postgres;

--
-- Name: referral_doctor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.referral_doctor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.referral_doctor_id_seq OWNER TO postgres;

--
-- Name: referral_doctor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_doctor_id_seq OWNED BY public.referral_doctor.id;


--
-- Name: referral_doctor_service_percentage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referral_doctor_service_percentage (
    percentage_id integer NOT NULL,
    referral_doctor_id integer NOT NULL,
    service_type character varying(100),
    referral_pay character(1) DEFAULT 'N'::bpchar,
    cash_percentage numeric(5,2) DEFAULT 0,
    inpatient_percentage numeric(5,2) DEFAULT 0,
    status character varying(20) DEFAULT 'Active'::character varying,
    created_by character varying(100),
    updated_by character varying(100),
    created_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'::text),
    updated_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'::text),
    uuid uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE public.referral_doctor_service_percentage OWNER TO postgres;

--
-- Name: referral_doctor_service_percentage_percentage_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.referral_doctor_service_percentage_percentage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.referral_doctor_service_percentage_percentage_id_seq OWNER TO postgres;

--
-- Name: referral_doctor_service_percentage_percentage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_doctor_service_percentage_percentage_id_seq OWNED BY public.referral_doctor_service_percentage.percentage_id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name character varying(100) NOT NULL,
    role_code character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_role_id_seq OWNER TO postgres;

--
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    service_id integer NOT NULL,
    service_code character varying(50) NOT NULL,
    service_name character varying(200) NOT NULL,
    description text,
    service_category character varying(100),
    default_unit_price numeric(10,2),
    hsn_code character varying(20),
    is_taxable boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: services_service_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.services_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_service_id_seq OWNER TO postgres;

--
-- Name: services_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_service_id_seq OWNED BY public.services.service_id;


--
-- Name: shift_branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shift_branches (
    shift_hospital_id integer NOT NULL,
    shift_id integer NOT NULL,
    branch_id integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shift_branches OWNER TO postgres;

--
-- Name: shift_branches_shift_hospital_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shift_branches_shift_hospital_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shift_branches_shift_hospital_id_seq OWNER TO postgres;

--
-- Name: shift_branches_shift_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shift_branches_shift_hospital_id_seq OWNED BY public.shift_branches.shift_hospital_id;


--
-- Name: shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shifts (
    shift_id integer NOT NULL,
    shift_name character varying(100) NOT NULL,
    shift_code character varying(50) NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    duration_hours numeric(4,2),
    shift_type character varying(20) DEFAULT 'General'::character varying,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT shifts_shift_type_check CHECK (((shift_type)::text = ANY ((ARRAY['Morning'::character varying, 'Evening'::character varying, 'Night'::character varying, 'General'::character varying])::text[])))
);


ALTER TABLE public.shifts OWNER TO postgres;

--
-- Name: shifts_shift_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shifts_shift_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shifts_shift_id_seq OWNER TO postgres;

--
-- Name: shifts_shift_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shifts_shift_id_seq OWNED BY public.shifts.shift_id;


--
-- Name: staff; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff (
    staff_id integer NOT NULL,
    user_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    staff_code character varying(50) NOT NULL,
    gender character varying(10),
    date_of_birth date,
    contact_number character varying(20),
    email character varying(100),
    address text,
    city character varying(100),
    state character varying(100),
    pincode character varying(10),
    qualification character varying(255),
    staff_type character varying(100),
    emergency_contact_name character varying(100),
    emergency_contact_number character varying(20),
    aadhar_number character varying(12),
    profile_photo character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT staff_gender_check CHECK (((gender)::text = ANY ((ARRAY['Male'::character varying, 'Female'::character varying, 'Other'::character varying])::text[])))
);


ALTER TABLE public.staff OWNER TO postgres;

--
-- Name: staff_branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_branches (
    staff_hospital_id integer NOT NULL,
    staff_id integer NOT NULL,
    branch_id integer NOT NULL,
    department_id integer,
    joining_date date,
    employment_type character varying(20) DEFAULT 'Permanent'::character varying,
    "position" character varying(100),
    salary numeric(12,2),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT staff_branches_employment_type_check CHECK (((employment_type)::text = ANY ((ARRAY['Permanent'::character varying, 'Contract'::character varying, 'Temporary'::character varying, 'Consultant'::character varying])::text[])))
);


ALTER TABLE public.staff_branches OWNER TO postgres;

--
-- Name: staff_branches_staff_hospital_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.staff_branches_staff_hospital_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_branches_staff_hospital_id_seq OWNER TO postgres;

--
-- Name: staff_branches_staff_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.staff_branches_staff_hospital_id_seq OWNED BY public.staff_branches.staff_hospital_id;


--
-- Name: staff_staff_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.staff_staff_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_staff_id_seq OWNER TO postgres;

--
-- Name: staff_staff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.staff_staff_id_seq OWNED BY public.staff.staff_id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    session_id integer NOT NULL,
    user_id integer NOT NULL,
    token_hash character varying(255) NOT NULL,
    refresh_token_hash character varying(255),
    device_info character varying(255),
    ip_address character varying(45),
    user_agent text,
    is_active boolean DEFAULT true,
    expires_at timestamp without time zone NOT NULL,
    refresh_expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_activity timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: user_sessions_session_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_sessions_session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_sessions_session_id_seq OWNER TO postgres;

--
-- Name: user_sessions_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_sessions_session_id_seq OWNED BY public.user_sessions.session_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    phone_number character varying(20),
    password_hash character varying(255) NOT NULL,
    role_id integer NOT NULL,
    is_active boolean DEFAULT true,
    is_email_verified boolean DEFAULT false,
    is_phone_verified boolean DEFAULT false,
    last_login timestamp without time zone,
    login_attempts integer DEFAULT 0,
    locked_until timestamp without time zone,
    password_changed_at timestamp without time zone,
    must_change_password boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: appointments appointment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments ALTER COLUMN appointment_id SET DEFAULT nextval('public.appointments_appointment_id_seq'::regclass);


--
-- Name: billing_items bill_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_items ALTER COLUMN bill_item_id SET DEFAULT nextval('public.billing_items_bill_item_id_seq'::regclass);


--
-- Name: billings bill_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings ALTER COLUMN bill_id SET DEFAULT nextval('public.billings_bill_id_seq'::regclass);


--
-- Name: branch_departments hospital_dept_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_departments ALTER COLUMN hospital_dept_id SET DEFAULT nextval('public.branch_departments_hospital_dept_id_seq'::regclass);


--
-- Name: branches branch_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches ALTER COLUMN branch_id SET DEFAULT nextval('public.branches_branch_id_seq'::regclass);


--
-- Name: client_modules client_module_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules ALTER COLUMN client_module_id SET DEFAULT nextval('public.client_modules_client_module_id_seq'::regclass);


--
-- Name: departments department_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN department_id SET DEFAULT nextval('public.departments_department_id_seq'::regclass);


--
-- Name: doctor_branch_departments doc_hosp_dept_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branch_departments ALTER COLUMN doc_hosp_dept_id SET DEFAULT nextval('public.doctor_branch_departments_doc_hosp_dept_id_seq'::regclass);


--
-- Name: doctor_branches doc_hospital_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branches ALTER COLUMN doc_hospital_id SET DEFAULT nextval('public.doctor_branches_doc_hospital_id_seq'::regclass);


--
-- Name: doctor_departments doc_dept_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_departments ALTER COLUMN doc_dept_id SET DEFAULT nextval('public.doctor_departments_doc_dept_id_seq'::regclass);


--
-- Name: doctor_shifts doctor_shift_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_shifts ALTER COLUMN doctor_shift_id SET DEFAULT nextval('public.doctor_shifts_doctor_shift_id_seq'::regclass);


--
-- Name: doctors doctor_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors ALTER COLUMN doctor_id SET DEFAULT nextval('public.doctors_doctor_id_seq'::regclass);


--
-- Name: hospitals hospital_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitals ALTER COLUMN hospital_id SET DEFAULT nextval('public.hospitals_hospital_id_seq'::regclass);


--
-- Name: modules module_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules ALTER COLUMN module_id SET DEFAULT nextval('public.modules_module_id_seq'::regclass);


--
-- Name: nurse_branches nurse_hospital_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_branches ALTER COLUMN nurse_hospital_id SET DEFAULT nextval('public.nurse_branches_nurse_hospital_id_seq'::regclass);


--
-- Name: nurse_shifts nurse_shift_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_shifts ALTER COLUMN nurse_shift_id SET DEFAULT nextval('public.nurse_shifts_nurse_shift_id_seq'::regclass);


--
-- Name: nurses nurse_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses ALTER COLUMN nurse_id SET DEFAULT nextval('public.nurses_nurse_id_seq'::regclass);


--
-- Name: opd_entries opd_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries ALTER COLUMN opd_id SET DEFAULT nextval('public.opd_entries_opd_id_seq'::regclass);


--
-- Name: password_reset_tokens reset_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN reset_id SET DEFAULT nextval('public.password_reset_tokens_reset_id_seq'::regclass);


--
-- Name: patients patient_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients ALTER COLUMN patient_id SET DEFAULT nextval('public.patients_patient_id_seq'::regclass);


--
-- Name: referral_doctor id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor ALTER COLUMN id SET DEFAULT nextval('public.referral_doctor_id_seq'::regclass);


--
-- Name: referral_doctor_service_percentage percentage_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_service_percentage ALTER COLUMN percentage_id SET DEFAULT nextval('public.referral_doctor_service_percentage_percentage_id_seq'::regclass);


--
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- Name: services service_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN service_id SET DEFAULT nextval('public.services_service_id_seq'::regclass);


--
-- Name: shift_branches shift_hospital_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_branches ALTER COLUMN shift_hospital_id SET DEFAULT nextval('public.shift_branches_shift_hospital_id_seq'::regclass);


--
-- Name: shifts shift_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts ALTER COLUMN shift_id SET DEFAULT nextval('public.shifts_shift_id_seq'::regclass);


--
-- Name: staff staff_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff ALTER COLUMN staff_id SET DEFAULT nextval('public.staff_staff_id_seq'::regclass);


--
-- Name: staff_branches staff_hospital_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_branches ALTER COLUMN staff_hospital_id SET DEFAULT nextval('public.staff_branches_staff_hospital_id_seq'::regclass);


--
-- Name: user_sessions session_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN session_id SET DEFAULT nextval('public.user_sessions_session_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (appointment_id, appointment_number, patient_name, phone_number, email, age, gender, patient_id, doctor_id, branch_id, department_id, appointment_date, appointment_time, reason_for_visit, appointment_status, booking_date, confirmed_by, cancelled_by, cancellation_reason, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: billing_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.billing_items (bill_item_id, bill_id, service_id, item_code, quantity, unit_price, doctor_id, department_id, created_at) FROM stdin;
\.


--
-- Data for Name: billings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.billings (bill_id, bill_number, patient_id, branch_id, opd_id, admission_id, bill_date, total_amount, discount_amount, tax_amount, net_payable, paid_amount, bill_status, payment_method, insurance_claim_id, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: branch_departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branch_departments (hospital_dept_id, branch_id, department_id, floor_number, room_numbers, head_of_department, is_operational, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branches (branch_id, hospital_id, branch_name, branch_code, address_line1, address_line2, city, state, pincode, country, latitude, longitude, contact_number, email, branch_manager, total_beds, emergency_available, icu_beds, general_beds, is_active, created_at, updated_at) FROM stdin;
1	1	Sunrise Main Branch	HSP123-MAIN	Testing 	\N	\N	\N	\N	India	\N	\N	9988675849	\N	\N	\N	f	0	0	t	2025-12-04 20:35:25.754075	2025-12-08 12:41:08.559375
\.


--
-- Data for Name: client_modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.client_modules (client_module_id, client_id, module_id, registered_date, marketing_id, status, created_by, updated_by, created_at, updated_at, uuid, branch_id) FROM stdin;
1	1	1	2025-12-08	\N	Inactive	System	superadmin	2025-12-08 15:00:45.998515	2025-12-08 16:26:31.92888	4a8ba204-7cbd-47e9-9d00-6403edfe64d0	1
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (department_id, department_name, department_code, description, is_active, created_at, updated_at) FROM stdin;
1	General Medicine	GEN_MED	General Medicine Department	t	2025-12-08 16:01:43.857134	2025-12-08 16:01:43.857134
\.


--
-- Data for Name: doctor_branch_departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_branch_departments (doc_hosp_dept_id, doctor_id, branch_id, department_id, is_primary, created_at) FROM stdin;
\.


--
-- Data for Name: doctor_branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_branches (doc_hospital_id, doctor_id, branch_id, joining_date, employment_type, is_active, created_at, updated_at) FROM stdin;
1	1	1	\N	Permanent	t	2025-12-04 20:40:16.539144	2025-12-04 20:40:16.539144
\.


--
-- Data for Name: doctor_departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_departments (doc_dept_id, doctor_id, department_id, is_primary_department, created_at) FROM stdin;
\.


--
-- Data for Name: doctor_shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_shifts (doctor_shift_id, doctor_id, branch_id, shift_id, department_id, shift_date, attendance_status, check_in_time, check_out_time, patients_attended, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctors (doctor_id, user_id, first_name, last_name, doctor_code, gender, date_of_birth, contact_number, email, qualification, specialization, experience_years, registration_number, registration_council, address, emergency_contact, consultation_fee, is_active, profile_photo, created_at, updated_at) FROM stdin;
1	4	ashwin	s	DOC016649	\N	\N	\N	\N		Dental	2	KAM123-456	\N	\N	\N	500.00	t	\N	2025-12-04 20:40:16.539144	2025-12-04 20:40:16.539144
\.


--
-- Data for Name: hospitals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hospitals (hospital_id, hospital_name, hospital_code, headquarters_address, contact_number, email, established_date, total_beds, hospital_type, accreditation, website, is_active, created_at, updated_at) FROM stdin;
1	Sunrise	HSP123	Testing 	9988675849	hospital@123.com	2025-12-04	0	Private	\N	\N	t	2025-12-04 20:35:25.754075	2025-12-05 10:14:58.267492
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.modules (module_id, module_code, module_name, field1, field2, status, created_by, updated_by, created_at, updated_at, uuid) FROM stdin;
1	MRKT	Marketing Module	\N	\N	 Active	Admin	\N	2025-12-08 12:49:26.982277	2025-12-08 12:49:56.328088	939bd1c2-0d83-4855-b51c-8e3239198319
3	PAY_RCVBLS	Payments Receivables	\N	\N	Active	Admin	\N	2025-12-08 12:49:26.982277	2025-12-08 12:49:56.328088	d785aab9-fd4c-4070-b9a4-84567e3d6d4a
2	REF_DOCTOR_PAY	Referral Doctor Payments	\N	\N	Active	Admin	\N	2025-12-08 12:49:26.982277	2025-12-08 12:50:22.894587	da973ecc-7d3e-4218-8506-967dd9f9d7a2
\.


--
-- Data for Name: nurse_branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nurse_branches (nurse_hospital_id, nurse_id, branch_id, department_id, joining_date, employment_type, "position", is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nurse_shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nurse_shifts (nurse_shift_id, nurse_id, branch_id, shift_id, department_id, shift_date, attendance_status, check_in_time, check_out_time, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: nurses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nurses (nurse_id, user_id, first_name, last_name, nurse_code, gender, date_of_birth, contact_number, email, qualification, specialization, experience_years, registration_number, registration_council, address, emergency_contact, is_active, profile_photo, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: opd_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.opd_entries (opd_id, opd_number, patient_id, branch_id, department_id, doctor_id, appointment_id, visit_type, visit_date, visit_time, token_number, reason_for_visit, symptoms, vital_signs, chief_complaint, diagnosis, prescription, lab_tests_ordered, follow_up_required, follow_up_date, consultation_fee, payment_status, visit_status, checked_in_time, consultation_start_time, consultation_end_time, checked_in_by, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (reset_id, user_id, token_hash, expires_at, used, used_at, created_at) FROM stdin;
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patients (patient_id, mrn_number, first_name, last_name, patient_code, gender, date_of_birth, age, blood_group, contact_number, email, address, city, state, pincode, emergency_contact_name, emergency_contact_number, emergency_contact_relation, aadhar_number, insurance_provider, insurance_policy_number, medical_history, allergies, current_medications, is_active, registration_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: referral_doctor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referral_doctor (id, department_id, doctor_name, mobile_number, speciality_type, medical_council_membership_number, council, pan_card_number, aadhar_card_number, bank_name, bank_branch, bank_address, bank_account_number, bank_ifsc_code, photo_upload_path, pan_upload_path, aadhar_upload_path, referral_pay, tenant_id, marketing_spoc, introduced_by, status, created_by, updated_by, created_at, updated_at, geo_latitude, geo_longitude, geo_accuracy, geo_altitude, geo_altitude_accuracy, geo_heading, geo_speed, geo_timestamp, uuid, address, clinic_photo_path) FROM stdin;
4	1	Dr. Sample Test	9876543210	General Medicine	KMC12345	Karnataka Medical Council	fdcc00edb966addd1c25d598a0ea1b16:b49cb8d7f9ed8a03e093b5f1e6e771b3	5f418eac3be8767525d8a7e5fa6589bb:982cca66899da17aad88e1004b5d9700	HDFC Bank	Indiranagar	Indiranagar, Bangalore	1234567890	HDFC0001234	uploads\\marketing\\photo-1765189906679-821107394.jpeg	uploads\\marketing\\pan-1765189906684-534094698.jpeg	uploads\\marketing\\aadhar-1765189906690-260568749.jpeg	N	1	5	5	Pending	Pavan	\N	2025-12-08 16:01:46.779293	2025-12-08 16:01:46.779293	12.97160000	77.59460000	10.00	\N	\N	\N	\N	\N	5a77b05b-68a8-4a3c-b292-aaf2fc4936a2	123, Sample Clinic Address, Bangalore	uploads\\marketing\\clinic_photo-1765189906694-216765760.jpeg
5	1	UI Test Doctor	9999999999											\N	\N	\N	0	1	5	5	Pending	Pavan	\N	2025-12-08 16:03:21.725114	2025-12-08 16:03:21.725114	12.96841520	77.59678570	16.32	\N	\N	\N	\N	\N	c0d74397-3238-43cf-90c3-4d74b4504549		\N
\.


--
-- Data for Name: referral_doctor_service_percentage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referral_doctor_service_percentage (percentage_id, referral_doctor_id, service_type, referral_pay, cash_percentage, inpatient_percentage, status, created_by, updated_by, created_at, updated_at, uuid) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (role_id, role_name, role_code, description, is_active, created_at, updated_at) FROM stdin;
1	Super Admin	SUPER_ADMIN	System Administrator with full access	t	2025-12-04 18:50:19.145876	2025-12-04 18:50:19.145876
2	Client Admin	CLIENT_ADMIN	Hospital Administrator	t	2025-12-04 18:50:19.145876	2025-12-04 18:50:19.145876
3	Doctor	DOCTOR	Medical Doctor	t	2025-12-04 18:50:19.145876	2025-12-04 18:50:19.145876
4	Nurse	NURSE	Nursing Staff	t	2025-12-04 18:50:19.145876	2025-12-04 18:50:19.145876
5	Receptionist	RECEPTIONIST	Front Desk Staff	t	2025-12-04 18:50:19.145876	2025-12-04 18:50:19.145876
6	Pharmacist	PHARMACIST	Pharmacy Staff	t	2025-12-04 18:50:19.145876	2025-12-04 18:50:19.145876
7	Lab Technician	LAB_TECH	Laboratory Staff	t	2025-12-04 18:50:19.145876	2025-12-04 18:50:19.145876
8	Marketing Executive	MRKT_EXEC	Marketing Executive	t	2025-12-05 10:47:15.260712	2025-12-05 10:47:15.260712
9	Marketing Manager	MRKT_MNGR	Marketing Manager	t	2025-12-05 10:50:21.322328	2025-12-05 10:50:21.322328
10	Chief Operations Officer	COO	Chief Operations Officer	t	2025-12-05 10:50:21.322328	2025-12-05 10:50:21.322328
11	Accounts Manager	ACCT_MNGR	Accounts Manager	t	2025-12-08 09:57:06.47519	2025-12-08 09:57:06.47519
12	Acountant	ACCNT	Acountant	t	2025-12-08 09:57:06.47519	2025-12-08 09:57:06.47519
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (service_id, service_code, service_name, description, service_category, default_unit_price, hsn_code, is_taxable, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: shift_branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shift_branches (shift_hospital_id, shift_id, branch_id, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shifts (shift_id, shift_name, shift_code, start_time, end_time, duration_hours, shift_type, description, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff (staff_id, user_id, first_name, last_name, staff_code, gender, date_of_birth, contact_number, email, address, city, state, pincode, qualification, staff_type, emergency_contact_name, emergency_contact_number, aadhar_number, profile_photo, is_active, created_at, updated_at) FROM stdin;
1	3	pavan		STF725969	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-04 20:35:25.754075	2025-12-04 20:35:25.754075
2	5	pavan	pavan	MRK531762	\N	\N	\N	\N	\N	\N	\N	\N	\N	MRKT_EXEC	\N	\N	\N	\N	t	2025-12-08 14:32:11.638129	2025-12-08 14:32:11.638129
\.


--
-- Data for Name: staff_branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_branches (staff_hospital_id, staff_id, branch_id, department_id, joining_date, employment_type, "position", salary, is_active, created_at, updated_at) FROM stdin;
1	1	1	\N	\N	Permanent	\N	\N	t	2025-12-04 20:35:25.754075	2025-12-04 20:35:25.754075
2	2	1	\N	\N	Permanent	\N	\N	t	2025-12-08 14:32:11.638129	2025-12-08 14:32:11.638129
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (session_id, user_id, token_hash, refresh_token_hash, device_info, ip_address, user_agent, is_active, expires_at, refresh_expires_at, created_at, last_activity) FROM stdin;
1	1	983a06c4102ae4274185d7bcae29e8e9bf84f4c30a0c0b07262bb3990f7192a5	7edcbae7ecd446da5d14e6c8a461d794ae277a30a4db70e2249ed9198878c326	\N	::1	\N	t	2025-12-11 19:10:05	2026-01-03 19:10:05	2025-12-04 19:10:05.320736	2025-12-04 19:10:05.320736
2	1	db5f2437f1de1807e4656faa886cba2a39c4b614cab983920bbc5b56457f0754	386f19760ffbbe2a533dd8febdfbb4ebb25324cd057f95e4433c7e6efc0fa534	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-11 19:10:15	2026-01-03 19:10:15	2025-12-04 19:10:15.244212	2025-12-04 19:10:15.244212
3	1	7cb4fef27041c987a1fe5effb659063db2f26e00ea8239756a1ef835c72c08b0	831a1a7ec42c9fcfc488b188c1345f10d34b2f663c901ae144ff9414ea09f32b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-11 19:10:27	2026-01-03 19:10:27	2025-12-04 19:10:27.447641	2025-12-04 19:10:27.447641
10	1	4a955f34fe906449353f04646b942369f452a85d713e00b113a4b5c754a29b17	a13fee7586d95b9fabf5081ac5277b41869b4cb2f3b2e21948916c791ef41776	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-15 13:50:19	2026-01-07 13:50:19	2025-12-08 13:50:19.229243	2025-12-08 14:00:09.223088
4	1	20db26b070018f33cd7e2662d246295845faaba034fa52f0fdbbe31183c0f590	fddb83776dcb3c459ad6c2ad49be7bb60e9dac8cbd0c87c62befb40c3f2c8821	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-11 19:15:38	2026-01-03 19:15:38	2025-12-04 19:15:38.81496	2025-12-04 19:16:33.233066
8	1	3a368fc10e2176a352492265db7c3532b776f59a89d831c66976ed3742ec70b4	9cdc1252fc0d3bece76ad4931c2dcb672b8513ff1c9677e5d385cbe1859003cf	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-15 12:38:05	2026-01-07 12:38:05	2025-12-08 12:38:05.661892	2025-12-08 12:42:44.849788
5	1	1ac13c470ed0eda57671ad026d0aff3081ce9eaae62d6d351d2adca53f7aa11c	e09317cc8ff48eac31666f604ddf036afb776bed492847d98721095fb528bdad	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-11 19:22:24	2026-01-03 19:22:24	2025-12-04 19:22:24.573711	2025-12-04 20:35:25.983645
14	5	210c538a16d9ad6aa35a1859b1c3a800c4fc89f0f778d79cae20ac1a78784fea	f35ca0982031f9f86b379457c4a1edbe9179584bfcf26c436afc350e6c0a4cb7	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-15 15:05:33	2026-01-07 15:05:33	2025-12-08 15:05:33.578308	2025-12-08 15:06:19.215565
9	1	4b8736b475b653e18019730cb3a0a8a38a43a274c061e44a8a553fcdbd7227db	911c6d834b004c2047129aff563d97115e082083ed478cff4e656a6b9f5e45a3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-15 13:12:16	2026-01-07 13:12:16	2025-12-08 13:12:16.036012	2025-12-08 13:12:32.465072
11	1	cf7411a55bce7b0bfa4b0c92fe6cf950032b953eebc1d7a1e2bd5ad9ea563cb1	d549e8bdb3ac4987105995913871cd497896641f6e6d427a2651b6efefae341d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-15 14:11:57	2026-01-07 14:11:57	2025-12-08 14:11:57.732197	2025-12-08 14:31:46.859245
7	1	4131503bd50666c9d96210732c005182fe3e8d90d75879973ea0fa846eb37b3c	56f02def6495910027afa0e6439f578e77c08390a53e380a02a20259008f70ab	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-11 20:43:00	2026-01-03 20:43:00	2025-12-04 20:43:00.861553	2025-12-05 10:16:15.573931
6	3	9bc2d76db21f52706e87a7e0de30977a3e7c7e4914fb2a2dbcae0ff69c3f0a57	1e36d7918f584d431c76735bfc27c40faff033be3230286cc390a3091d567365	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-11 20:38:01	2026-01-03 20:38:01	2025-12-04 20:38:01.359227	2025-12-04 20:42:02.586163
12	1	5c8d4a38db2170eb3991a3ce745165bca771474bbae0cd10f56cc016b550a3f0	f3ca5014f6c84d30bc6cdd69f1029e56cc0d103c3507a2458b42792cce9774f0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-15 14:33:41	2026-01-07 14:33:41	2025-12-08 14:33:41.806259	2025-12-08 14:33:53.130494
16	5	edffae2f1a08352c899878b5d3bfd403ba4b40287ccab445da0bf1bb98fa7d4b	9f5698b28d7ef7d404d2c81db91abda9d54a44a2746a734bd9eb4879c8cd96b2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-15 15:22:44	2026-01-07 15:22:44	2025-12-08 15:22:44.39467	2025-12-08 15:22:44.54968
13	5	74f4ebf494ffb7e278b61fa707975bd719afb035c41f3e81b298ab81089795ba	a80522bdb432630e393efa1f2822cb07d53afcf70539949c41cdc7eda773e084	\N	\N	\N	t	2025-12-08 15:38:28.731649	2025-12-09 14:38:28.731649	2025-12-08 14:38:28.731649	2025-12-08 14:38:28.731649
15	5	2268f60e16ddc94dedc26cf9c12f62824d6af5f8d4114e3cff87b62ad9ef5366	2db185c97f580207e4e77e95627c62bbc83fd22ecdfca93dd4ea10acd9b3450a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-15 15:08:06	2026-01-07 15:08:06	2025-12-08 15:08:06.236736	2025-12-08 15:22:22.462511
17	5	7aa5ce2f8549e34af628ed6cebe5a4ce3aed22366aba097b709da89a12e0dfd1	f50b3f7e1cc3a3ebf83c4cb459f6396a20ae0b07cc8dc642d0710011dea7d07b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-15 15:44:04	2026-01-07 15:44:04	2025-12-08 15:44:04.236423	2025-12-08 15:49:19.074538
18	5	99321f706ca365317ded59df53d24738da54f3f42812f635fc738967da263002	2a157192acc54cdec9cc4d707b578039d3007930a83ac732e9dceabdf01594d7	axios/1.13.2	::1	axios/1.13.2	t	2025-12-15 15:54:36	2026-01-07 15:54:36	2025-12-08 15:54:36.375359	2025-12-08 15:54:36.375359
19	5	6ed91b51d5e9a8c5bdf9aa243e573d8964134984ec39a18fba44896873ad499b	c82cff652b26a6c2f8e2e6202e1bff667ccaffa3ac777ed432f94634653933de	axios/1.13.2	::1	axios/1.13.2	t	2025-12-15 15:55:54	2026-01-07 15:55:54	2025-12-08 15:55:54.833196	2025-12-08 15:55:54.855521
20	5	e7ffa2a4aaf72b110bc97e6bd89a1b0dd887eb30d391b5541ce966431c96273f	40de6c0018fe47ce89d0e6be87cf1bca918d71cefa2f229bee44c2daa69f4b8a	axios/1.13.2	::1	axios/1.13.2	t	2025-12-15 15:56:44	2026-01-07 15:56:44	2025-12-08 15:56:44.129163	2025-12-08 15:56:44.153376
21	5	59e7fb81a1f80950a83350bd68c783934a99803ae4a99bb1dbb1d0af185c7036	cbf8afc39a9f80530ef164fce878e4be435120f23caff5ff0cb6a96725e38dbd	axios/1.13.2	::1	axios/1.13.2	t	2025-12-15 15:58:23	2026-01-07 15:58:23	2025-12-08 15:58:23.880008	2025-12-08 15:58:23.910511
22	5	a8f7629ec6c6c866c401077da919d0239e036419865a1e6f3c7ad2525d6b6442	eb9ea7f59e9415e934a4cca2fa1408c825c1acd6a69af0b0bb675bcbf95b84d0	axios/1.13.2	::1	axios/1.13.2	t	2025-12-15 15:58:51	2026-01-07 15:58:51	2025-12-08 15:58:51.757055	2025-12-08 15:58:51.794842
23	5	9565021c67dfff85f05f79048e1c1a63aa6eea5076e4f8e7590958a2b6ee4d1e	4cd15afd9d5b23bdd6ac40c1db5d963bdaeef9d3fb14c507e69389e8b523879d	axios/1.13.2	::1	axios/1.13.2	t	2025-12-15 16:00:01	2026-01-07 16:00:01	2025-12-08 16:00:01.391095	2025-12-08 16:00:01.434316
24	5	df6031c3133ca6d4dbb5b0a707cea6d006575c02f73bb0f5c99782ec7119b5a9	801215e429b9c42547c438c022788743a1062e5a6010e50df660bdfa3d6acbaa	axios/1.13.2	::1	axios/1.13.2	t	2025-12-15 16:01:25	2026-01-07 16:01:25	2025-12-08 16:01:25.298499	2025-12-08 16:01:25.340693
25	5	27c6ee253b3d91d03e6a017a0541e1d2b83947f302550fd42e06e6460589529b	7e454c719633277bec0b288672c6676d448afcf9046399b0f448c17454ff6807	axios/1.13.2	::1	axios/1.13.2	t	2025-12-15 16:01:46	2026-01-07 16:01:46	2025-12-08 16:01:46.637994	2025-12-08 16:01:46.670802
30	3	ba2fc5d93ee55847d713e577fd418f889ce30a9a472c63debcc313d4ac992485	1d3825f35c80f58b78bbb45284c2e5a78e160c8cd27f4b2347653f0bc4a2065d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-15 16:50:18	2026-01-07 16:50:18	2025-12-08 16:50:18.561176	2025-12-08 16:50:34.295394
29	1	df6b7703c0362ecad216120054bf69bf4f00acdd9cdda0f67d2bea33707537ba	b6948ba73edb77eaa6d18fdbf7db1fa0c95b3a87d9e5afb20b92eb04fc3cdc37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-15 16:31:04	2026-01-07 16:31:04	2025-12-08 16:31:04.678076	2025-12-08 16:31:10.601031
26	5	669bc8a1103030be885ae98726ca19446e013d00c109cd8e4f70ebdfe39d6df6	3e58b7c4c78d778982c5fb5a95c517795329f5fdad6c1b717b7ab849ef965b40	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-15 16:02:34	2026-01-07 16:02:34	2025-12-08 16:02:34.503811	2025-12-08 16:04:38.343852
27	1	f76ce8d0fe2986069738e88d372f22463956002b49db44263c75535086ef9bd1	859863d8782453b7eee135b5dccee00d1bcc762a692b494cebb4be9afb9a123f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-15 16:11:13	2026-01-07 16:11:13	2025-12-08 16:11:13.360508	2025-12-08 16:26:31.957693
28	5	c378e581a38ac7872a5120260d1a491dcc517041053b42cbe51301bbfa8b751a	f423e9abdd9259879ac483b322ed01390db495da53b0d3874ca70db0ef640256	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	2025-12-15 16:26:51	2026-01-07 16:26:51	2025-12-08 16:26:51.910877	2025-12-08 16:27:52.289307
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, email, phone_number, password_hash, role_id, is_active, is_email_verified, is_phone_verified, last_login, login_attempts, locked_until, password_changed_at, must_change_password, created_at, updated_at) FROM stdin;
3	9988789685	admin@sunrise.com	9988789685	$2a$10$zQ/WSej6OWfRdGkJ62GKMuP8.kWBiV6TaCZmscTGHhZwEH2eGvD8u	2	t	t	f	2025-12-08 16:50:18.568246	0	\N	\N	f	2025-12-04 20:35:25.754075	2025-12-08 16:50:18.568246
4	ashwin@sunrise.com	ashwin@sunrise.com	9878965478	$2a$10$Vwiixh2HpYrgjkAkM2O/4OdgwSB/HZs59GQ9oK/ShQn2aFMt8l.GG	3	t	t	f	\N	0	\N	\N	f	2025-12-04 20:40:16.539144	2025-12-04 20:40:16.539144
5	Pavan	Pavan@sunriseh.com	9988475636	$2a$10$zQ/WSej6OWfRdGkJ62GKMuP8.kWBiV6TaCZmscTGHhZwEH2eGvD8u	8	t	t	f	2025-12-08 16:26:51.92434	0	\N	\N	f	2025-12-08 14:32:11.638129	2025-12-08 16:26:51.92434
1	superadmin	admin@phchms.com	0000000000	$2a$10$CWawemWLuKnrzd6I1qdsk..uGK5NI4g4uhEKcGKz1LFrpV5h3NmQi	1	t	t	f	2025-12-08 16:31:04.683088	0	\N	\N	f	2025-12-04 18:50:19.145876	2025-12-08 16:31:04.683088
\.


--
-- Name: appointments_appointment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointments_appointment_id_seq', 1, false);


--
-- Name: billing_items_bill_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.billing_items_bill_item_id_seq', 1, false);


--
-- Name: billings_bill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.billings_bill_id_seq', 1, false);


--
-- Name: branch_departments_hospital_dept_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branch_departments_hospital_dept_id_seq', 1, false);


--
-- Name: branches_branch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branches_branch_id_seq', 1, true);


--
-- Name: client_modules_client_module_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.client_modules_client_module_id_seq', 1, true);


--
-- Name: departments_department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_department_id_seq', 1, false);


--
-- Name: doctor_branch_departments_doc_hosp_dept_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_branch_departments_doc_hosp_dept_id_seq', 1, false);


--
-- Name: doctor_branches_doc_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_branches_doc_hospital_id_seq', 1, true);


--
-- Name: doctor_departments_doc_dept_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_departments_doc_dept_id_seq', 1, false);


--
-- Name: doctor_shifts_doctor_shift_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_shifts_doctor_shift_id_seq', 1, false);


--
-- Name: doctors_doctor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctors_doctor_id_seq', 1, true);


--
-- Name: hospitals_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hospitals_hospital_id_seq', 1, true);


--
-- Name: modules_module_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.modules_module_id_seq', 4, true);


--
-- Name: nurse_branches_nurse_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nurse_branches_nurse_hospital_id_seq', 1, false);


--
-- Name: nurse_shifts_nurse_shift_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nurse_shifts_nurse_shift_id_seq', 1, false);


--
-- Name: nurses_nurse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nurses_nurse_id_seq', 1, false);


--
-- Name: opd_entries_opd_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.opd_entries_opd_id_seq', 1, false);


--
-- Name: password_reset_tokens_reset_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_reset_tokens_reset_id_seq', 1, false);


--
-- Name: patients_patient_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.patients_patient_id_seq', 1, false);


--
-- Name: referral_doctor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_doctor_id_seq', 5, true);


--
-- Name: referral_doctor_service_percentage_percentage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_doctor_service_percentage_percentage_id_seq', 1, false);


--
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 21, true);


--
-- Name: services_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_service_id_seq', 1, false);


--
-- Name: shift_branches_shift_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shift_branches_shift_hospital_id_seq', 1, false);


--
-- Name: shifts_shift_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shifts_shift_id_seq', 1, false);


--
-- Name: staff_branches_staff_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.staff_branches_staff_hospital_id_seq', 2, true);


--
-- Name: staff_staff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.staff_staff_id_seq', 2, true);


--
-- Name: user_sessions_session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_sessions_session_id_seq', 30, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 5, true);


--
-- Name: appointments appointments_appointment_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_appointment_number_key UNIQUE (appointment_number);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (appointment_id);


--
-- Name: billing_items billing_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_pkey PRIMARY KEY (bill_item_id);


--
-- Name: billings billings_bill_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_bill_number_key UNIQUE (bill_number);


--
-- Name: billings billings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_pkey PRIMARY KEY (bill_id);


--
-- Name: branch_departments branch_departments_branch_id_department_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_departments
    ADD CONSTRAINT branch_departments_branch_id_department_id_key UNIQUE (branch_id, department_id);


--
-- Name: branch_departments branch_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_departments
    ADD CONSTRAINT branch_departments_pkey PRIMARY KEY (hospital_dept_id);


--
-- Name: branches branches_hospital_id_branch_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_hospital_id_branch_code_key UNIQUE (hospital_id, branch_code);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (branch_id);


--
-- Name: client_modules client_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules
    ADD CONSTRAINT client_modules_pkey PRIMARY KEY (client_module_id);


--
-- Name: client_modules client_modules_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules
    ADD CONSTRAINT client_modules_uuid_unique UNIQUE (uuid);


--
-- Name: departments departments_department_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_department_code_key UNIQUE (department_code);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);


--
-- Name: doctor_branch_departments doctor_branch_departments_doctor_id_branch_id_department_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branch_departments
    ADD CONSTRAINT doctor_branch_departments_doctor_id_branch_id_department_id_key UNIQUE (doctor_id, branch_id, department_id);


--
-- Name: doctor_branch_departments doctor_branch_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branch_departments
    ADD CONSTRAINT doctor_branch_departments_pkey PRIMARY KEY (doc_hosp_dept_id);


--
-- Name: doctor_branches doctor_branches_doctor_id_branch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branches
    ADD CONSTRAINT doctor_branches_doctor_id_branch_id_key UNIQUE (doctor_id, branch_id);


--
-- Name: doctor_branches doctor_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branches
    ADD CONSTRAINT doctor_branches_pkey PRIMARY KEY (doc_hospital_id);


--
-- Name: doctor_departments doctor_departments_doctor_id_department_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_departments
    ADD CONSTRAINT doctor_departments_doctor_id_department_id_key UNIQUE (doctor_id, department_id);


--
-- Name: doctor_departments doctor_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_departments
    ADD CONSTRAINT doctor_departments_pkey PRIMARY KEY (doc_dept_id);


--
-- Name: doctor_shifts doctor_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_shifts
    ADD CONSTRAINT doctor_shifts_pkey PRIMARY KEY (doctor_shift_id);


--
-- Name: doctors doctors_doctor_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_doctor_code_key UNIQUE (doctor_code);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (doctor_id);


--
-- Name: doctors doctors_registration_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_registration_number_key UNIQUE (registration_number);


--
-- Name: hospitals hospitals_hospital_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitals
    ADD CONSTRAINT hospitals_hospital_code_key UNIQUE (hospital_code);


--
-- Name: hospitals hospitals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitals
    ADD CONSTRAINT hospitals_pkey PRIMARY KEY (hospital_id);


--
-- Name: modules modules_module_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_module_code_key UNIQUE (module_code);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (module_id);


--
-- Name: modules modules_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_uuid_unique UNIQUE (uuid);


--
-- Name: nurse_branches nurse_branches_nurse_id_branch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_branches
    ADD CONSTRAINT nurse_branches_nurse_id_branch_id_key UNIQUE (nurse_id, branch_id);


--
-- Name: nurse_branches nurse_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_branches
    ADD CONSTRAINT nurse_branches_pkey PRIMARY KEY (nurse_hospital_id);


--
-- Name: nurse_shifts nurse_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_shifts
    ADD CONSTRAINT nurse_shifts_pkey PRIMARY KEY (nurse_shift_id);


--
-- Name: nurses nurses_nurse_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses
    ADD CONSTRAINT nurses_nurse_code_key UNIQUE (nurse_code);


--
-- Name: nurses nurses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses
    ADD CONSTRAINT nurses_pkey PRIMARY KEY (nurse_id);


--
-- Name: nurses nurses_registration_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses
    ADD CONSTRAINT nurses_registration_number_key UNIQUE (registration_number);


--
-- Name: opd_entries opd_entries_opd_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_opd_number_key UNIQUE (opd_number);


--
-- Name: opd_entries opd_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_pkey PRIMARY KEY (opd_id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (reset_id);


--
-- Name: password_reset_tokens password_reset_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: patients patients_mrn_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_mrn_number_key UNIQUE (mrn_number);


--
-- Name: patients patients_patient_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_patient_code_key UNIQUE (patient_code);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (patient_id);


--
-- Name: referral_doctor referral_doctor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor
    ADD CONSTRAINT referral_doctor_pkey PRIMARY KEY (id);


--
-- Name: referral_doctor_service_percentage referral_doctor_service_percentage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_service_percentage
    ADD CONSTRAINT referral_doctor_service_percentage_pkey PRIMARY KEY (percentage_id);


--
-- Name: referral_doctor_service_percentage referral_doctor_service_percentage_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_service_percentage
    ADD CONSTRAINT referral_doctor_service_percentage_uuid_unique UNIQUE (uuid);


--
-- Name: referral_doctor referral_doctor_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor
    ADD CONSTRAINT referral_doctor_uuid_unique UNIQUE (uuid);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- Name: roles roles_role_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_code_key UNIQUE (role_code);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (service_id);


--
-- Name: services services_service_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_service_code_key UNIQUE (service_code);


--
-- Name: shift_branches shift_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_branches
    ADD CONSTRAINT shift_branches_pkey PRIMARY KEY (shift_hospital_id);


--
-- Name: shift_branches shift_branches_shift_id_branch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_branches
    ADD CONSTRAINT shift_branches_shift_id_branch_id_key UNIQUE (shift_id, branch_id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (shift_id);


--
-- Name: shifts shifts_shift_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_shift_code_key UNIQUE (shift_code);


--
-- Name: staff_branches staff_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_branches
    ADD CONSTRAINT staff_branches_pkey PRIMARY KEY (staff_hospital_id);


--
-- Name: staff_branches staff_branches_staff_id_branch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_branches
    ADD CONSTRAINT staff_branches_staff_id_branch_id_key UNIQUE (staff_id, branch_id);


--
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (staff_id);


--
-- Name: staff staff_staff_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_staff_code_key UNIQUE (staff_code);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: user_sessions user_sessions_refresh_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_refresh_token_hash_key UNIQUE (refresh_token_hash);


--
-- Name: user_sessions user_sessions_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_token_hash_key UNIQUE (token_hash);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_appointments_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_date ON public.appointments USING btree (appointment_date);


--
-- Name: idx_appointments_doctor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_doctor ON public.appointments USING btree (doctor_id);


--
-- Name: idx_appointments_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_patient ON public.appointments USING btree (patient_id);


--
-- Name: idx_appointments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_status ON public.appointments USING btree (appointment_status);


--
-- Name: idx_billings_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_billings_date ON public.billings USING btree (bill_date);


--
-- Name: idx_billings_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_billings_patient ON public.billings USING btree (patient_id);


--
-- Name: idx_billings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_billings_status ON public.billings USING btree (bill_status);


--
-- Name: idx_branches_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_branches_active ON public.branches USING btree (is_active);


--
-- Name: idx_branches_hospital; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_branches_hospital ON public.branches USING btree (hospital_id);


--
-- Name: idx_client_modules_branch_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_client_modules_branch_level ON public.client_modules USING btree (client_id, module_id, branch_id) WHERE (branch_id IS NOT NULL);


--
-- Name: idx_client_modules_hospital_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_client_modules_hospital_level ON public.client_modules USING btree (client_id, module_id) WHERE (branch_id IS NULL);


--
-- Name: idx_doctors_registration; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_doctors_registration ON public.doctors USING btree (registration_number);


--
-- Name: idx_doctors_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_doctors_user ON public.doctors USING btree (user_id);


--
-- Name: idx_nurses_registration; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nurses_registration ON public.nurses USING btree (registration_number);


--
-- Name: idx_nurses_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nurses_user ON public.nurses USING btree (user_id);


--
-- Name: idx_opd_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_opd_date ON public.opd_entries USING btree (visit_date);


--
-- Name: idx_opd_doctor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_opd_doctor ON public.opd_entries USING btree (doctor_id);


--
-- Name: idx_opd_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_opd_patient ON public.opd_entries USING btree (patient_id);


--
-- Name: idx_patients_contact; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_contact ON public.patients USING btree (contact_number);


--
-- Name: idx_patients_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_email ON public.patients USING btree (email);


--
-- Name: idx_patients_mrn; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_mrn ON public.patients USING btree (mrn_number);


--
-- Name: idx_reset_tokens_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reset_tokens_expires ON public.password_reset_tokens USING btree (expires_at);


--
-- Name: idx_reset_tokens_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reset_tokens_hash ON public.password_reset_tokens USING btree (token_hash);


--
-- Name: idx_reset_tokens_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reset_tokens_user ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_sessions_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_active ON public.user_sessions USING btree (is_active);


--
-- Name: idx_sessions_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_expires ON public.user_sessions USING btree (expires_at);


--
-- Name: idx_sessions_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_token ON public.user_sessions USING btree (token_hash);


--
-- Name: idx_sessions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_user ON public.user_sessions USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone_number);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role_id);


--
-- Name: appointments update_appointments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: billings update_billings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_billings_updated_at BEFORE UPDATE ON public.billings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: branch_departments update_branch_departments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_branch_departments_updated_at BEFORE UPDATE ON public.branch_departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: branches update_branches_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: client_modules update_client_modules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_client_modules_updated_at BEFORE UPDATE ON public.client_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_ist();


--
-- Name: departments update_departments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: doctor_branches update_doctor_branches_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_doctor_branches_updated_at BEFORE UPDATE ON public.doctor_branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: doctor_shifts update_doctor_shifts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_doctor_shifts_updated_at BEFORE UPDATE ON public.doctor_shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: doctors update_doctors_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: hospitals update_hospitals_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON public.hospitals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: modules update_modules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_ist();


--
-- Name: nurse_branches update_nurse_branches_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_nurse_branches_updated_at BEFORE UPDATE ON public.nurse_branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: nurse_shifts update_nurse_shifts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_nurse_shifts_updated_at BEFORE UPDATE ON public.nurse_shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: nurses update_nurses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_nurses_updated_at BEFORE UPDATE ON public.nurses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: opd_entries update_opd_entries_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_opd_entries_updated_at BEFORE UPDATE ON public.opd_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patients update_patients_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: referral_doctor_service_percentage update_referral_doctor_service_percentage_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_referral_doctor_service_percentage_updated_at BEFORE UPDATE ON public.referral_doctor_service_percentage FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_ist();


--
-- Name: referral_doctor update_referral_doctor_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_referral_doctor_updated_at BEFORE UPDATE ON public.referral_doctor FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_ist();


--
-- Name: roles update_roles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: services update_services_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: shifts update_shifts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: staff_branches update_staff_branches_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_staff_branches_updated_at BEFORE UPDATE ON public.staff_branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: staff update_staff_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_sessions update_user_sessions_activity; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_sessions_activity BEFORE UPDATE ON public.user_sessions FOR EACH ROW EXECUTE FUNCTION public.update_session_activity();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: appointments appointments_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- Name: appointments appointments_cancelled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: appointments appointments_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: appointments appointments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- Name: appointments appointments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE SET NULL;


--
-- Name: billing_items billing_items_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.billings(bill_id) ON DELETE CASCADE;


--
-- Name: billing_items billing_items_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- Name: billing_items billing_items_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE SET NULL;


--
-- Name: billing_items billing_items_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(service_id) ON DELETE SET NULL;


--
-- Name: billings billings_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- Name: billings billings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: billings billings_opd_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_opd_id_fkey FOREIGN KEY (opd_id) REFERENCES public.opd_entries(opd_id) ON DELETE SET NULL;


--
-- Name: billings billings_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- Name: branch_departments branch_departments_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_departments
    ADD CONSTRAINT branch_departments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- Name: branch_departments branch_departments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_departments
    ADD CONSTRAINT branch_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE CASCADE;


--
-- Name: branches branches_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE;


--
-- Name: client_modules client_modules_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules
    ADD CONSTRAINT client_modules_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- Name: client_modules client_modules_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules
    ADD CONSTRAINT client_modules_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE;


--
-- Name: client_modules client_modules_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules
    ADD CONSTRAINT client_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(module_id) ON DELETE CASCADE;


--
-- Name: doctor_branch_departments doctor_branch_departments_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branch_departments
    ADD CONSTRAINT doctor_branch_departments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- Name: doctor_branch_departments doctor_branch_departments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branch_departments
    ADD CONSTRAINT doctor_branch_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE CASCADE;


--
-- Name: doctor_branch_departments doctor_branch_departments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branch_departments
    ADD CONSTRAINT doctor_branch_departments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- Name: doctor_branches doctor_branches_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branches
    ADD CONSTRAINT doctor_branches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- Name: doctor_branches doctor_branches_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branches
    ADD CONSTRAINT doctor_branches_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- Name: doctor_departments doctor_departments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_departments
    ADD CONSTRAINT doctor_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE CASCADE;


--
-- Name: doctor_departments doctor_departments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_departments
    ADD CONSTRAINT doctor_departments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- Name: doctor_shifts doctor_shifts_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_shifts
    ADD CONSTRAINT doctor_shifts_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- Name: doctor_shifts doctor_shifts_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_shifts
    ADD CONSTRAINT doctor_shifts_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- Name: doctor_shifts doctor_shifts_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_shifts
    ADD CONSTRAINT doctor_shifts_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- Name: doctor_shifts doctor_shifts_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_shifts
    ADD CONSTRAINT doctor_shifts_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(shift_id) ON DELETE CASCADE;


--
-- Name: doctors doctors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: nurse_branches nurse_branches_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_branches
    ADD CONSTRAINT nurse_branches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- Name: nurse_branches nurse_branches_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_branches
    ADD CONSTRAINT nurse_branches_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- Name: nurse_branches nurse_branches_nurse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_branches
    ADD CONSTRAINT nurse_branches_nurse_id_fkey FOREIGN KEY (nurse_id) REFERENCES public.nurses(nurse_id) ON DELETE CASCADE;


--
-- Name: nurse_shifts nurse_shifts_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_shifts
    ADD CONSTRAINT nurse_shifts_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- Name: nurse_shifts nurse_shifts_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_shifts
    ADD CONSTRAINT nurse_shifts_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- Name: nurse_shifts nurse_shifts_nurse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_shifts
    ADD CONSTRAINT nurse_shifts_nurse_id_fkey FOREIGN KEY (nurse_id) REFERENCES public.nurses(nurse_id) ON DELETE CASCADE;


--
-- Name: nurse_shifts nurse_shifts_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_shifts
    ADD CONSTRAINT nurse_shifts_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(shift_id) ON DELETE CASCADE;


--
-- Name: nurses nurses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses
    ADD CONSTRAINT nurses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: opd_entries opd_entries_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id) ON DELETE SET NULL;


--
-- Name: opd_entries opd_entries_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- Name: opd_entries opd_entries_checked_in_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_checked_in_by_fkey FOREIGN KEY (checked_in_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: opd_entries opd_entries_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- Name: opd_entries opd_entries_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- Name: opd_entries opd_entries_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: referral_doctor referral_doctor_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor
    ADD CONSTRAINT referral_doctor_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- Name: referral_doctor_service_percentage referral_doctor_service_percentage_referral_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_service_percentage
    ADD CONSTRAINT referral_doctor_service_percentage_referral_doctor_id_fkey FOREIGN KEY (referral_doctor_id) REFERENCES public.referral_doctor(id) ON DELETE CASCADE;


--
-- Name: referral_doctor referral_doctor_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor
    ADD CONSTRAINT referral_doctor_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.hospitals(hospital_id) ON DELETE SET NULL;


--
-- Name: shift_branches shift_branches_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_branches
    ADD CONSTRAINT shift_branches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- Name: shift_branches shift_branches_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_branches
    ADD CONSTRAINT shift_branches_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(shift_id) ON DELETE CASCADE;


--
-- Name: staff_branches staff_branches_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_branches
    ADD CONSTRAINT staff_branches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- Name: staff_branches staff_branches_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_branches
    ADD CONSTRAINT staff_branches_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- Name: staff_branches staff_branches_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_branches
    ADD CONSTRAINT staff_branches_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(staff_id) ON DELETE CASCADE;


--
-- Name: staff staff_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict wffeIPacr9lNqofiGe8M1aTIj19giFHCPG52bImVPnYcVzL1bXtw3XpcD29evec

