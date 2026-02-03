--
-- PostgreSQL database dump
--

\restrict BjcyatocHaidf0OnFESZZsFJLvzsQ1cHFzhMZiCvjNbFUxMHaiNtla4lS9easLF

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2025-12-18 11:03:56

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
-- TOC entry 2 (class 3079 OID 26786)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5929 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 345 (class 1255 OID 26824)
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
-- TOC entry 346 (class 1255 OID 26825)
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
-- TOC entry 220 (class 1259 OID 26826)
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
    CONSTRAINT appointments_appointment_status_check CHECK (((appointment_status)::text = ANY (ARRAY[('Scheduled'::character varying)::text, ('Confirmed'::character varying)::text, ('Cancelled'::character varying)::text, ('Completed'::character varying)::text, ('In OPD'::character varying)::text]))),
    CONSTRAINT appointments_gender_check CHECK (((gender)::text = ANY (ARRAY[('Male'::character varying)::text, ('Female'::character varying)::text, ('Other'::character varying)::text])))
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 26843)
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
-- TOC entry 5930 (class 0 OID 0)
-- Dependencies: 221
-- Name: appointments_appointment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointments_appointment_id_seq OWNED BY public.appointments.appointment_id;


--
-- TOC entry 222 (class 1259 OID 26844)
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
-- TOC entry 223 (class 1259 OID 26853)
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
-- TOC entry 5931 (class 0 OID 0)
-- Dependencies: 223
-- Name: billing_items_bill_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.billing_items_bill_item_id_seq OWNED BY public.billing_items.bill_item_id;


--
-- TOC entry 224 (class 1259 OID 26854)
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
    CONSTRAINT billings_bill_status_check CHECK (((bill_status)::text = ANY (ARRAY[('Draft'::character varying)::text, ('Generated'::character varying)::text, ('Paid'::character varying)::text, ('Partial'::character varying)::text, ('Cancelled'::character varying)::text]))),
    CONSTRAINT billings_payment_method_check CHECK (((payment_method)::text = ANY (ARRAY[('Cash'::character varying)::text, ('Card'::character varying)::text, ('UPI'::character varying)::text, ('Net-banking'::character varying)::text, ('Insurance'::character varying)::text, ('Cheque'::character varying)::text, ('Other'::character varying)::text])))
);


ALTER TABLE public.billings OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 26872)
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
-- TOC entry 5932 (class 0 OID 0)
-- Dependencies: 225
-- Name: billings_bill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.billings_bill_id_seq OWNED BY public.billings.bill_id;


--
-- TOC entry 226 (class 1259 OID 26873)
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
-- TOC entry 227 (class 1259 OID 26882)
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
-- TOC entry 5933 (class 0 OID 0)
-- Dependencies: 227
-- Name: branch_departments_hospital_dept_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branch_departments_hospital_dept_id_seq OWNED BY public.branch_departments.hospital_dept_id;


--
-- TOC entry 228 (class 1259 OID 26883)
-- Name: branch_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branch_services (
    branch_service_id integer NOT NULL,
    branch_id integer NOT NULL,
    service_id integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.branch_services OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 26892)
-- Name: branch_services_branch_service_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.branch_services_branch_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.branch_services_branch_service_id_seq OWNER TO postgres;

--
-- TOC entry 5934 (class 0 OID 0)
-- Dependencies: 229
-- Name: branch_services_branch_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branch_services_branch_service_id_seq OWNED BY public.branch_services.branch_service_id;


--
-- TOC entry 230 (class 1259 OID 26893)
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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    mlc_fee numeric(10,2) DEFAULT 0,
    enabled_modules jsonb
);


ALTER TABLE public.branches OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 26910)
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
-- TOC entry 5935 (class 0 OID 0)
-- Dependencies: 231
-- Name: branches_branch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branches_branch_id_seq OWNED BY public.branches.branch_id;


--
-- TOC entry 232 (class 1259 OID 26911)
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
-- TOC entry 233 (class 1259 OID 26923)
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
-- TOC entry 5936 (class 0 OID 0)
-- Dependencies: 233
-- Name: client_modules_client_module_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.client_modules_client_module_id_seq OWNED BY public.client_modules.client_module_id;


--
-- TOC entry 234 (class 1259 OID 26924)
-- Name: consultation_outcomes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consultation_outcomes (
    outcome_id integer NOT NULL,
    opd_id integer,
    patient_id integer,
    doctor_id integer,
    prescription_id integer,
    consultation_status character varying(50) DEFAULT 'Completed'::character varying,
    diagnosis text,
    notes text,
    next_visit_date date,
    next_visit_status character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    labs jsonb DEFAULT '[]'::jsonb,
    referral_doctor_id integer,
    referral_notes text,
    medications jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.consultation_outcomes OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 26935)
-- Name: consultation_outcomes_outcome_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.consultation_outcomes_outcome_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.consultation_outcomes_outcome_id_seq OWNER TO postgres;

--
-- TOC entry 5937 (class 0 OID 0)
-- Dependencies: 235
-- Name: consultation_outcomes_outcome_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.consultation_outcomes_outcome_id_seq OWNED BY public.consultation_outcomes.outcome_id;


--
-- TOC entry 236 (class 1259 OID 26936)
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
-- TOC entry 237 (class 1259 OID 26947)
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
-- TOC entry 5938 (class 0 OID 0)
-- Dependencies: 237
-- Name: departments_department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_department_id_seq OWNED BY public.departments.department_id;


--
-- TOC entry 238 (class 1259 OID 26948)
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
-- TOC entry 239 (class 1259 OID 26957)
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
-- TOC entry 5939 (class 0 OID 0)
-- Dependencies: 239
-- Name: doctor_branch_departments_doc_hosp_dept_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_branch_departments_doc_hosp_dept_id_seq OWNED BY public.doctor_branch_departments.doc_hosp_dept_id;


--
-- TOC entry 240 (class 1259 OID 26958)
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
    CONSTRAINT doctor_branches_employment_type_check CHECK (((employment_type)::text = ANY (ARRAY[('Permanent'::character varying)::text, ('Visiting'::character varying)::text, ('Consultant'::character varying)::text, ('Contract'::character varying)::text])))
);


ALTER TABLE public.doctor_branches OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 26969)
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
-- TOC entry 5940 (class 0 OID 0)
-- Dependencies: 241
-- Name: doctor_branches_doc_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_branches_doc_hospital_id_seq OWNED BY public.doctor_branches.doc_hospital_id;


--
-- TOC entry 242 (class 1259 OID 26970)
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
-- TOC entry 243 (class 1259 OID 26978)
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
-- TOC entry 5941 (class 0 OID 0)
-- Dependencies: 243
-- Name: doctor_departments_doc_dept_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_departments_doc_dept_id_seq OWNED BY public.doctor_departments.doc_dept_id;


--
-- TOC entry 244 (class 1259 OID 26979)
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
    CONSTRAINT doctor_shifts_attendance_status_check CHECK (((attendance_status)::text = ANY (ARRAY[('Present'::character varying)::text, ('Absent'::character varying)::text, ('Late'::character varying)::text, ('Half-day'::character varying)::text, ('On-leave'::character varying)::text])))
);


ALTER TABLE public.doctor_shifts OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 26994)
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
-- TOC entry 5942 (class 0 OID 0)
-- Dependencies: 245
-- Name: doctor_shifts_doctor_shift_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_shifts_doctor_shift_id_seq OWNED BY public.doctor_shifts.doctor_shift_id;


--
-- TOC entry 246 (class 1259 OID 26995)
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
    bank_name character varying(255),
    account_number character varying(50),
    ifsc_code character varying(20),
    doctor_type character varying(50) DEFAULT 'In-house'::character varying,
    signature_url character varying(255),
    CONSTRAINT doctors_doctor_type_check CHECK (((doctor_type)::text = ANY (ARRAY[('In-house'::character varying)::text, ('Visiting'::character varying)::text]))),
    CONSTRAINT doctors_gender_check CHECK (((gender)::text = ANY (ARRAY[('Male'::character varying)::text, ('Female'::character varying)::text, ('Other'::character varying)::text])))
);


ALTER TABLE public.doctors OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 27012)
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
-- TOC entry 5943 (class 0 OID 0)
-- Dependencies: 247
-- Name: doctors_doctor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctors_doctor_id_seq OWNED BY public.doctors.doctor_id;


--
-- TOC entry 248 (class 1259 OID 27013)
-- Name: hospital_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hospital_services (
    hosp_service_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid(),
    hospital_id integer NOT NULL,
    branch_id integer NOT NULL,
    service_code character varying(50) NOT NULL,
    service_name character varying(200) NOT NULL,
    service_description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    updated_by integer,
    gst_rate numeric(5,2) DEFAULT 0
);


ALTER TABLE public.hospital_services OWNER TO postgres;

--
-- TOC entry 5944 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN hospital_services.gst_rate; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.hospital_services.gst_rate IS 'GST percentage rate for this service (0-100)';


--
-- TOC entry 249 (class 1259 OID 27028)
-- Name: hospital_services_hosp_service_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hospital_services_hosp_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hospital_services_hosp_service_id_seq OWNER TO postgres;

--
-- TOC entry 5945 (class 0 OID 0)
-- Dependencies: 249
-- Name: hospital_services_hosp_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hospital_services_hosp_service_id_seq OWNED BY public.hospital_services.hosp_service_id;


--
-- TOC entry 250 (class 1259 OID 27029)
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
    logo text,
    logo_url character varying(500),
    enabled_modules jsonb,
    CONSTRAINT hospitals_hospital_type_check CHECK (((hospital_type)::text = ANY (ARRAY[('Government'::character varying)::text, ('Private'::character varying)::text, ('Trust'::character varying)::text, ('Corporate'::character varying)::text])))
);


ALTER TABLE public.hospitals OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 27042)
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
-- TOC entry 5946 (class 0 OID 0)
-- Dependencies: 251
-- Name: hospitals_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hospitals_hospital_id_seq OWNED BY public.hospitals.hospital_id;


--
-- TOC entry 252 (class 1259 OID 27043)
-- Name: insurance_claims; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.insurance_claims (
    claim_id integer NOT NULL,
    s_no integer,
    ip_no character varying(50),
    patient_name character varying(200),
    doctor_name character varying(200),
    approval_no character varying(100),
    admission_date date,
    discharge_date date,
    department character varying(100),
    insurance_name character varying(200),
    bill_amount numeric(15,2),
    advance_amount numeric(15,2),
    co_pay numeric(15,2),
    discount numeric(15,2),
    approval_amount numeric(15,2),
    amount_received numeric(15,2),
    pending_amount numeric(15,2),
    tds numeric(15,2),
    bank_name character varying(200),
    transaction_date date,
    utr_no character varying(100),
    remarks text,
    branch_id integer,
    hospital_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    moc_discount numeric DEFAULT 0,
    number_field_1 numeric DEFAULT 0,
    system_notes text,
    is_updated integer DEFAULT 0
);


ALTER TABLE public.insurance_claims OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 27054)
-- Name: insurance_claims_claim_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.insurance_claims_claim_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.insurance_claims_claim_id_seq OWNER TO postgres;

--
-- TOC entry 5947 (class 0 OID 0)
-- Dependencies: 253
-- Name: insurance_claims_claim_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.insurance_claims_claim_id_seq OWNED BY public.insurance_claims.claim_id;


--
-- TOC entry 254 (class 1259 OID 27055)
-- Name: mlc_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mlc_entries (
    mlc_id integer NOT NULL,
    mlc_number character varying(50) NOT NULL,
    opd_id integer,
    patient_id integer,
    doctor_id integer,
    branch_id integer,
    police_station character varying(255),
    police_station_district character varying(255),
    brought_by character varying(255),
    history_alleged text,
    injury_description text,
    nature_of_injury character varying(100),
    opinion text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    incident_date_time timestamp without time zone,
    alleged_cause text,
    danger_to_life character varying(50),
    age_of_injuries character varying(100),
    treatment_given text,
    remarks text,
    examination_findings text
);


ALTER TABLE public.mlc_entries OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 27064)
-- Name: mlc_entries_mlc_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mlc_entries_mlc_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mlc_entries_mlc_id_seq OWNER TO postgres;

--
-- TOC entry 5948 (class 0 OID 0)
-- Dependencies: 255
-- Name: mlc_entries_mlc_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mlc_entries_mlc_id_seq OWNED BY public.mlc_entries.mlc_id;


--
-- TOC entry 256 (class 1259 OID 27065)
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
-- TOC entry 257 (class 1259 OID 27078)
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
-- TOC entry 5949 (class 0 OID 0)
-- Dependencies: 257
-- Name: modules_module_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.modules_module_id_seq OWNED BY public.modules.module_id;


--
-- TOC entry 258 (class 1259 OID 27079)
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
    CONSTRAINT nurse_branches_employment_type_check CHECK (((employment_type)::text = ANY (ARRAY[('Permanent'::character varying)::text, ('Contract'::character varying)::text, ('Temporary'::character varying)::text])))
);


ALTER TABLE public.nurse_branches OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 27090)
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
-- TOC entry 5950 (class 0 OID 0)
-- Dependencies: 259
-- Name: nurse_branches_nurse_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nurse_branches_nurse_hospital_id_seq OWNED BY public.nurse_branches.nurse_hospital_id;


--
-- TOC entry 260 (class 1259 OID 27091)
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
    CONSTRAINT nurse_shifts_attendance_status_check CHECK (((attendance_status)::text = ANY (ARRAY[('Present'::character varying)::text, ('Absent'::character varying)::text, ('Late'::character varying)::text, ('Half-day'::character varying)::text, ('On-leave'::character varying)::text])))
);


ALTER TABLE public.nurse_shifts OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 27105)
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
-- TOC entry 5951 (class 0 OID 0)
-- Dependencies: 261
-- Name: nurse_shifts_nurse_shift_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nurse_shifts_nurse_shift_id_seq OWNED BY public.nurse_shifts.nurse_shift_id;


--
-- TOC entry 262 (class 1259 OID 27106)
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
    CONSTRAINT nurses_gender_check CHECK (((gender)::text = ANY (ARRAY[('Male'::character varying)::text, ('Female'::character varying)::text, ('Other'::character varying)::text])))
);


ALTER TABLE public.nurses OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 27121)
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
-- TOC entry 5952 (class 0 OID 0)
-- Dependencies: 263
-- Name: nurses_nurse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nurses_nurse_id_seq OWNED BY public.nurses.nurse_id;


--
-- TOC entry 264 (class 1259 OID 27122)
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
    is_mlc boolean DEFAULT false,
    attender_name character varying(100),
    attender_contact_number character varying(20),
    mlc_remarks text,
    referral_hospital character varying(255),
    referral_doctor_name character varying(255),
    payment_method character varying(50),
    CONSTRAINT opd_entries_payment_status_check CHECK (((payment_status)::text = ANY (ARRAY[('Paid'::character varying)::text, ('Pending'::character varying)::text, ('Partial'::character varying)::text, ('Waived'::character varying)::text]))),
    CONSTRAINT opd_entries_visit_status_check CHECK (((visit_status)::text = ANY (ARRAY[('Registered'::character varying)::text, ('In-consultation'::character varying)::text, ('Completed'::character varying)::text, ('Cancelled'::character varying)::text]))),
    CONSTRAINT opd_entries_visit_type_check CHECK (((visit_type)::text = ANY (ARRAY[('Walk-in'::character varying)::text, ('Follow-up'::character varying)::text, ('Emergency'::character varying)::text, ('Referral'::character varying)::text, ('Appointment'::character varying)::text])))
);


ALTER TABLE public.opd_entries OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 27143)
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
-- TOC entry 5953 (class 0 OID 0)
-- Dependencies: 265
-- Name: opd_entries_opd_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.opd_entries_opd_id_seq OWNED BY public.opd_entries.opd_id;


--
-- TOC entry 266 (class 1259 OID 27144)
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    token_id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- TOC entry 267 (class 1259 OID 27153)
-- Name: password_reset_tokens_token_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_reset_tokens_token_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_tokens_token_id_seq OWNER TO postgres;

--
-- TOC entry 5954 (class 0 OID 0)
-- Dependencies: 267
-- Name: password_reset_tokens_token_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_reset_tokens_token_id_seq OWNED BY public.password_reset_tokens.token_id;


--
-- TOC entry 268 (class 1259 OID 27154)
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
    adhaar_number character varying(20),
    is_deceased boolean DEFAULT false,
    date_of_death date,
    time_of_death time without time zone,
    declared_dead_by character varying(100),
    cause_of_death text,
    death_circumstances text,
    is_death_mlc boolean DEFAULT false,
    death_police_station character varying(255),
    post_mortem_required boolean DEFAULT false,
    relatives_name character varying(255),
    relatives_notified_at timestamp without time zone,
    relatives_number character varying(20),
    CONSTRAINT patients_blood_group_check CHECK (((blood_group)::text = ANY (ARRAY[('A+'::character varying)::text, ('A-'::character varying)::text, ('B+'::character varying)::text, ('B-'::character varying)::text, ('AB+'::character varying)::text, ('AB-'::character varying)::text, ('O+'::character varying)::text, ('O-'::character varying)::text]))),
    CONSTRAINT patients_gender_check CHECK (((gender)::text = ANY (ARRAY[('Male'::character varying)::text, ('Female'::character varying)::text, ('Other'::character varying)::text])))
);


ALTER TABLE public.patients OWNER TO postgres;

--
-- TOC entry 269 (class 1259 OID 27172)
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
-- TOC entry 5955 (class 0 OID 0)
-- Dependencies: 269
-- Name: patients_patient_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.patients_patient_id_seq OWNED BY public.patients.patient_id;


--
-- TOC entry 270 (class 1259 OID 27173)
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prescriptions (
    prescription_id integer NOT NULL,
    doctor_id integer,
    patient_id integer,
    branch_id integer,
    medications text,
    notes text,
    diagnosis text,
    status character varying(50) DEFAULT 'Active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    labs jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.prescriptions OWNER TO postgres;

--
-- TOC entry 271 (class 1259 OID 27183)
-- Name: prescriptions_prescription_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.prescriptions_prescription_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prescriptions_prescription_id_seq OWNER TO postgres;

--
-- TOC entry 5956 (class 0 OID 0)
-- Dependencies: 271
-- Name: prescriptions_prescription_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.prescriptions_prescription_id_seq OWNED BY public.prescriptions.prescription_id;


--
-- TOC entry 272 (class 1259 OID 27184)
-- Name: referral_doctor_module; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referral_doctor_module (
    id integer CONSTRAINT referral_doctor_id_not_null NOT NULL,
    department_id integer,
    doctor_name character varying(100) CONSTRAINT referral_doctor_doctor_name_not_null NOT NULL,
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
    uuid uuid DEFAULT gen_random_uuid() CONSTRAINT referral_doctor_uuid_not_null NOT NULL,
    address text,
    clinic_photo_path character varying(255),
    clinic_name character varying(255),
    branch_id integer
);


ALTER TABLE public.referral_doctor_module OWNER TO postgres;

--
-- TOC entry 273 (class 1259 OID 27197)
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
-- TOC entry 5957 (class 0 OID 0)
-- Dependencies: 273
-- Name: referral_doctor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_doctor_id_seq OWNED BY public.referral_doctor_module.id;


--
-- TOC entry 274 (class 1259 OID 27198)
-- Name: referral_doctor_service_percentage_module; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referral_doctor_service_percentage_module (
    percentage_id integer CONSTRAINT referral_doctor_service_percentage_percentage_id_not_null NOT NULL,
    referral_doctor_id integer CONSTRAINT referral_doctor_service_percentage_referral_doctor_id_not_null NOT NULL,
    service_type character varying(100),
    referral_pay character(1) DEFAULT 'N'::bpchar,
    cash_percentage numeric(5,2) DEFAULT 0,
    inpatient_percentage numeric(5,2) DEFAULT 0,
    status character varying(20) DEFAULT 'Active'::character varying,
    created_by character varying(100),
    updated_by character varying(100),
    created_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'::text),
    updated_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'::text),
    uuid uuid DEFAULT gen_random_uuid() CONSTRAINT referral_doctor_service_percentage_uuid_not_null NOT NULL
);


ALTER TABLE public.referral_doctor_service_percentage_module OWNER TO postgres;

--
-- TOC entry 275 (class 1259 OID 27211)
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
-- TOC entry 5958 (class 0 OID 0)
-- Dependencies: 275
-- Name: referral_doctor_service_percentage_percentage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_doctor_service_percentage_percentage_id_seq OWNED BY public.referral_doctor_service_percentage_module.percentage_id;


--
-- TOC entry 276 (class 1259 OID 27212)
-- Name: referral_doctors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referral_doctors (
    referral_doctor_id integer NOT NULL,
    referral_hospital_id integer NOT NULL,
    doctor_name character varying(255) NOT NULL,
    specialization character varying(100) NOT NULL,
    department character varying(100),
    phone_number character varying(20),
    email character varying(255),
    qualifications text,
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.referral_doctors OWNER TO postgres;

--
-- TOC entry 277 (class 1259 OID 27224)
-- Name: referral_doctors_referral_doctor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.referral_doctors_referral_doctor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.referral_doctors_referral_doctor_id_seq OWNER TO postgres;

--
-- TOC entry 5959 (class 0 OID 0)
-- Dependencies: 277
-- Name: referral_doctors_referral_doctor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_doctors_referral_doctor_id_seq OWNED BY public.referral_doctors.referral_doctor_id;


--
-- TOC entry 278 (class 1259 OID 27225)
-- Name: referral_hospital_mapping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referral_hospital_mapping (
    mapping_id integer NOT NULL,
    branch_id integer NOT NULL,
    referral_hospital_id integer NOT NULL,
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.referral_hospital_mapping OWNER TO postgres;

--
-- TOC entry 279 (class 1259 OID 27233)
-- Name: referral_hospital_mapping_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.referral_hospital_mapping_mapping_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.referral_hospital_mapping_mapping_id_seq OWNER TO postgres;

--
-- TOC entry 5960 (class 0 OID 0)
-- Dependencies: 279
-- Name: referral_hospital_mapping_mapping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_hospital_mapping_mapping_id_seq OWNED BY public.referral_hospital_mapping.mapping_id;


--
-- TOC entry 280 (class 1259 OID 27234)
-- Name: referral_hospitals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referral_hospitals (
    referral_hospital_id integer NOT NULL,
    hospital_name character varying(255) NOT NULL,
    hospital_address text,
    city character varying(100),
    state character varying(100),
    phone_number character varying(20),
    email character varying(255),
    hospital_type character varying(50),
    specialties text[],
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT referral_hospitals_hospital_type_check CHECK (((hospital_type)::text = ANY (ARRAY[('Government'::character varying)::text, ('Private'::character varying)::text, ('Specialty'::character varying)::text, ('Trust'::character varying)::text])))
);


ALTER TABLE public.referral_hospitals OWNER TO postgres;

--
-- TOC entry 281 (class 1259 OID 27245)
-- Name: referral_hospitals_referral_hospital_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.referral_hospitals_referral_hospital_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.referral_hospitals_referral_hospital_id_seq OWNER TO postgres;

--
-- TOC entry 5961 (class 0 OID 0)
-- Dependencies: 281
-- Name: referral_hospitals_referral_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_hospitals_referral_hospital_id_seq OWNED BY public.referral_hospitals.referral_hospital_id;


--
-- TOC entry 282 (class 1259 OID 27246)
-- Name: referral_patients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referral_patients (
    id integer NOT NULL,
    referral_patient_id character varying(50),
    patient_name character varying(100) NOT NULL,
    mobile_number character varying(20) NOT NULL,
    gender character varying(10),
    age integer,
    place character varying(100),
    referral_doctor_id integer,
    payment_type character varying(20) DEFAULT 'Cash'::character varying,
    service_required character varying(255),
    status character varying(20) DEFAULT 'Pending'::character varying,
    remarks text,
    created_by character varying(50),
    marketing_spoc character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT referral_patients_gender_check CHECK (((gender)::text = ANY (ARRAY[('Male'::character varying)::text, ('Female'::character varying)::text, ('Other'::character varying)::text]))),
    CONSTRAINT referral_patients_payment_type_check CHECK (((payment_type)::text = ANY (ARRAY[('Cash'::character varying)::text, ('Insurance'::character varying)::text])))
);


ALTER TABLE public.referral_patients OWNER TO postgres;

--
-- TOC entry 283 (class 1259 OID 27260)
-- Name: referral_patients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.referral_patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.referral_patients_id_seq OWNER TO postgres;

--
-- TOC entry 5962 (class 0 OID 0)
-- Dependencies: 283
-- Name: referral_patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_patients_id_seq OWNED BY public.referral_patients.id;


--
-- TOC entry 307 (class 1259 OID 28206)
-- Name: referral_payment_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referral_payment_details (
    id integer NOT NULL,
    uuid character varying(50) DEFAULT gen_random_uuid() NOT NULL,
    payment_header_id integer,
    service_name character varying(150),
    service_cost numeric(15,2) DEFAULT 0.00,
    referral_percentage numeric(5,2) DEFAULT 0.00,
    referral_amount numeric(15,2) DEFAULT 0.00,
    remarks text,
    status character varying(50) DEFAULT 'Active'::character varying,
    created_by character varying(100),
    updated_by character varying(100),
    created_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'::text),
    updated_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'::text)
);


ALTER TABLE public.referral_payment_details OWNER TO postgres;

--
-- TOC entry 306 (class 1259 OID 28205)
-- Name: referral_payment_details_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.referral_payment_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.referral_payment_details_id_seq OWNER TO postgres;

--
-- TOC entry 5963 (class 0 OID 0)
-- Dependencies: 306
-- Name: referral_payment_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_payment_details_id_seq OWNED BY public.referral_payment_details.id;


--
-- TOC entry 305 (class 1259 OID 28183)
-- Name: referral_payment_header; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referral_payment_header (
    id integer NOT NULL,
    uuid character varying(50) DEFAULT gen_random_uuid() NOT NULL,
    batch_id integer,
    patient_name character varying(150),
    admission_type character varying(100),
    department character varying(100),
    doctor_name character varying(150),
    medical_council_id character varying(100),
    payment_mode character varying(50),
    total_referral_amount numeric(15,2) DEFAULT 0.00,
    status character varying(50) DEFAULT 'Active'::character varying,
    created_by character varying(100),
    updated_by character varying(100),
    created_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'::text),
    updated_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'::text)
);


ALTER TABLE public.referral_payment_header OWNER TO postgres;

--
-- TOC entry 304 (class 1259 OID 28182)
-- Name: referral_payment_header_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.referral_payment_header_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.referral_payment_header_id_seq OWNER TO postgres;

--
-- TOC entry 5964 (class 0 OID 0)
-- Dependencies: 304
-- Name: referral_payment_header_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_payment_header_id_seq OWNED BY public.referral_payment_header.id;


--
-- TOC entry 303 (class 1259 OID 28162)
-- Name: referral_payment_upload_batch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referral_payment_upload_batch (
    id integer NOT NULL,
    uuid character varying(50) DEFAULT gen_random_uuid() NOT NULL,
    hospital_id integer NOT NULL,
    branch_id integer,
    file_name character varying(255) NOT NULL,
    total_records integer DEFAULT 0,
    total_amount numeric(15,2) DEFAULT 0.00,
    status character varying(50) DEFAULT 'Active'::character varying,
    created_by character varying(100),
    updated_by character varying(100),
    created_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'::text),
    updated_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'::text)
);


ALTER TABLE public.referral_payment_upload_batch OWNER TO postgres;

--
-- TOC entry 302 (class 1259 OID 28161)
-- Name: referral_payment_upload_batch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.referral_payment_upload_batch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.referral_payment_upload_batch_id_seq OWNER TO postgres;

--
-- TOC entry 5965 (class 0 OID 0)
-- Dependencies: 302
-- Name: referral_payment_upload_batch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_payment_upload_batch_id_seq OWNED BY public.referral_payment_upload_batch.id;


--
-- TOC entry 284 (class 1259 OID 27261)
-- Name: referral_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referral_payments (
    payment_id integer NOT NULL,
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    referral_doctor_id integer NOT NULL,
    hosp_service_id integer,
    service_code character varying(50),
    service_name character varying(200),
    service_amount numeric(12,2) NOT NULL,
    referral_percentage numeric(5,2) NOT NULL,
    referral_amount numeric(12,2) NOT NULL,
    gst_rate numeric(5,2) NOT NULL,
    gst_amount numeric(12,2) NOT NULL,
    total_payable numeric(12,2) NOT NULL,
    payment_status character varying(20) DEFAULT 'Pending'::character varying,
    payment_date date,
    payment_mode character varying(50),
    payment_reference character varying(100),
    patient_id integer,
    billing_id integer,
    opd_id integer,
    remarks text,
    created_by character varying(100),
    updated_by character varying(100),
    created_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'::text),
    updated_at timestamp without time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'::text),
    CONSTRAINT referral_payments_status_check CHECK (((payment_status)::text = ANY (ARRAY[('Pending'::character varying)::text, ('Paid'::character varying)::text, ('Cancelled'::character varying)::text, ('On-hold'::character varying)::text])))
);


ALTER TABLE public.referral_payments OWNER TO postgres;

--
-- TOC entry 5966 (class 0 OID 0)
-- Dependencies: 284
-- Name: TABLE referral_payments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.referral_payments IS 'Stores referral doctor payment calculations and records with GST';


--
-- TOC entry 285 (class 1259 OID 27280)
-- Name: referral_payments_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.referral_payments_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.referral_payments_payment_id_seq OWNER TO postgres;

--
-- TOC entry 5967 (class 0 OID 0)
-- Dependencies: 285
-- Name: referral_payments_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_payments_payment_id_seq OWNED BY public.referral_payments.payment_id;


--
-- TOC entry 286 (class 1259 OID 27281)
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
-- TOC entry 287 (class 1259 OID 27292)
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
-- TOC entry 5968 (class 0 OID 0)
-- Dependencies: 287
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- TOC entry 288 (class 1259 OID 27293)
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
-- TOC entry 289 (class 1259 OID 27305)
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
-- TOC entry 5969 (class 0 OID 0)
-- Dependencies: 289
-- Name: services_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_service_id_seq OWNED BY public.services.service_id;


--
-- TOC entry 290 (class 1259 OID 27306)
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
-- TOC entry 291 (class 1259 OID 27314)
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
-- TOC entry 5970 (class 0 OID 0)
-- Dependencies: 291
-- Name: shift_branches_shift_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shift_branches_shift_hospital_id_seq OWNED BY public.shift_branches.shift_hospital_id;


--
-- TOC entry 292 (class 1259 OID 27315)
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
    CONSTRAINT shifts_shift_type_check CHECK (((shift_type)::text = ANY (ARRAY[('Morning'::character varying)::text, ('Evening'::character varying)::text, ('Night'::character varying)::text, ('General'::character varying)::text])))
);


ALTER TABLE public.shifts OWNER TO postgres;

--
-- TOC entry 293 (class 1259 OID 27330)
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
-- TOC entry 5971 (class 0 OID 0)
-- Dependencies: 293
-- Name: shifts_shift_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shifts_shift_id_seq OWNED BY public.shifts.shift_id;


--
-- TOC entry 294 (class 1259 OID 27331)
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
    CONSTRAINT staff_gender_check CHECK (((gender)::text = ANY (ARRAY[('Male'::character varying)::text, ('Female'::character varying)::text, ('Other'::character varying)::text])))
);


ALTER TABLE public.staff OWNER TO postgres;

--
-- TOC entry 295 (class 1259 OID 27345)
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
    CONSTRAINT staff_branches_employment_type_check CHECK (((employment_type)::text = ANY (ARRAY[('Permanent'::character varying)::text, ('Contract'::character varying)::text, ('Temporary'::character varying)::text, ('Consultant'::character varying)::text])))
);


ALTER TABLE public.staff_branches OWNER TO postgres;

--
-- TOC entry 296 (class 1259 OID 27356)
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
-- TOC entry 5972 (class 0 OID 0)
-- Dependencies: 296
-- Name: staff_branches_staff_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.staff_branches_staff_hospital_id_seq OWNED BY public.staff_branches.staff_hospital_id;


--
-- TOC entry 297 (class 1259 OID 27357)
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
-- TOC entry 5973 (class 0 OID 0)
-- Dependencies: 297
-- Name: staff_staff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.staff_staff_id_seq OWNED BY public.staff.staff_id;


--
-- TOC entry 298 (class 1259 OID 27358)
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    session_id integer NOT NULL,
    user_id integer NOT NULL,
    token_hash character varying(255) NOT NULL,
    refresh_token_hash character varying(255),
    device_info text,
    ip_address character varying(45),
    user_agent text,
    expires_at timestamp without time zone NOT NULL,
    refresh_expires_at timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_used_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- TOC entry 299 (class 1259 OID 27370)
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
-- TOC entry 5974 (class 0 OID 0)
-- Dependencies: 299
-- Name: user_sessions_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_sessions_session_id_seq OWNED BY public.user_sessions.session_id;


--
-- TOC entry 300 (class 1259 OID 27371)
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
-- TOC entry 301 (class 1259 OID 27386)
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
-- TOC entry 5975 (class 0 OID 0)
-- Dependencies: 301
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 5111 (class 2604 OID 27387)
-- Name: appointments appointment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments ALTER COLUMN appointment_id SET DEFAULT nextval('public.appointments_appointment_id_seq'::regclass);


--
-- TOC entry 5116 (class 2604 OID 27388)
-- Name: billing_items bill_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_items ALTER COLUMN bill_item_id SET DEFAULT nextval('public.billing_items_bill_item_id_seq'::regclass);


--
-- TOC entry 5120 (class 2604 OID 27389)
-- Name: billings bill_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings ALTER COLUMN bill_id SET DEFAULT nextval('public.billings_bill_id_seq'::regclass);


--
-- TOC entry 5127 (class 2604 OID 27390)
-- Name: branch_departments hospital_dept_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_departments ALTER COLUMN hospital_dept_id SET DEFAULT nextval('public.branch_departments_hospital_dept_id_seq'::regclass);


--
-- TOC entry 5131 (class 2604 OID 27391)
-- Name: branch_services branch_service_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_services ALTER COLUMN branch_service_id SET DEFAULT nextval('public.branch_services_branch_service_id_seq'::regclass);


--
-- TOC entry 5135 (class 2604 OID 27392)
-- Name: branches branch_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches ALTER COLUMN branch_id SET DEFAULT nextval('public.branches_branch_id_seq'::regclass);


--
-- TOC entry 5144 (class 2604 OID 27393)
-- Name: client_modules client_module_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules ALTER COLUMN client_module_id SET DEFAULT nextval('public.client_modules_client_module_id_seq'::regclass);


--
-- TOC entry 5150 (class 2604 OID 27394)
-- Name: consultation_outcomes outcome_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_outcomes ALTER COLUMN outcome_id SET DEFAULT nextval('public.consultation_outcomes_outcome_id_seq'::regclass);


--
-- TOC entry 5156 (class 2604 OID 27395)
-- Name: departments department_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN department_id SET DEFAULT nextval('public.departments_department_id_seq'::regclass);


--
-- TOC entry 5160 (class 2604 OID 27396)
-- Name: doctor_branch_departments doc_hosp_dept_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branch_departments ALTER COLUMN doc_hosp_dept_id SET DEFAULT nextval('public.doctor_branch_departments_doc_hosp_dept_id_seq'::regclass);


--
-- TOC entry 5163 (class 2604 OID 27397)
-- Name: doctor_branches doc_hospital_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branches ALTER COLUMN doc_hospital_id SET DEFAULT nextval('public.doctor_branches_doc_hospital_id_seq'::regclass);


--
-- TOC entry 5168 (class 2604 OID 27398)
-- Name: doctor_departments doc_dept_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_departments ALTER COLUMN doc_dept_id SET DEFAULT nextval('public.doctor_departments_doc_dept_id_seq'::regclass);


--
-- TOC entry 5171 (class 2604 OID 27399)
-- Name: doctor_shifts doctor_shift_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_shifts ALTER COLUMN doctor_shift_id SET DEFAULT nextval('public.doctor_shifts_doctor_shift_id_seq'::regclass);


--
-- TOC entry 5176 (class 2604 OID 27400)
-- Name: doctors doctor_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors ALTER COLUMN doctor_id SET DEFAULT nextval('public.doctors_doctor_id_seq'::regclass);


--
-- TOC entry 5181 (class 2604 OID 27401)
-- Name: hospital_services hosp_service_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospital_services ALTER COLUMN hosp_service_id SET DEFAULT nextval('public.hospital_services_hosp_service_id_seq'::regclass);


--
-- TOC entry 5187 (class 2604 OID 27402)
-- Name: hospitals hospital_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitals ALTER COLUMN hospital_id SET DEFAULT nextval('public.hospitals_hospital_id_seq'::regclass);


--
-- TOC entry 5192 (class 2604 OID 27403)
-- Name: insurance_claims claim_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurance_claims ALTER COLUMN claim_id SET DEFAULT nextval('public.insurance_claims_claim_id_seq'::regclass);


--
-- TOC entry 5198 (class 2604 OID 27404)
-- Name: mlc_entries mlc_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mlc_entries ALTER COLUMN mlc_id SET DEFAULT nextval('public.mlc_entries_mlc_id_seq'::regclass);


--
-- TOC entry 5201 (class 2604 OID 27405)
-- Name: modules module_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules ALTER COLUMN module_id SET DEFAULT nextval('public.modules_module_id_seq'::regclass);


--
-- TOC entry 5206 (class 2604 OID 27406)
-- Name: nurse_branches nurse_hospital_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_branches ALTER COLUMN nurse_hospital_id SET DEFAULT nextval('public.nurse_branches_nurse_hospital_id_seq'::regclass);


--
-- TOC entry 5211 (class 2604 OID 27407)
-- Name: nurse_shifts nurse_shift_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_shifts ALTER COLUMN nurse_shift_id SET DEFAULT nextval('public.nurse_shifts_nurse_shift_id_seq'::regclass);


--
-- TOC entry 5215 (class 2604 OID 27408)
-- Name: nurses nurse_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses ALTER COLUMN nurse_id SET DEFAULT nextval('public.nurses_nurse_id_seq'::regclass);


--
-- TOC entry 5219 (class 2604 OID 27409)
-- Name: opd_entries opd_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries ALTER COLUMN opd_id SET DEFAULT nextval('public.opd_entries_opd_id_seq'::regclass);


--
-- TOC entry 5227 (class 2604 OID 27410)
-- Name: password_reset_tokens token_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN token_id SET DEFAULT nextval('public.password_reset_tokens_token_id_seq'::regclass);


--
-- TOC entry 5230 (class 2604 OID 27411)
-- Name: patients patient_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients ALTER COLUMN patient_id SET DEFAULT nextval('public.patients_patient_id_seq'::regclass);


--
-- TOC entry 5237 (class 2604 OID 27412)
-- Name: prescriptions prescription_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions ALTER COLUMN prescription_id SET DEFAULT nextval('public.prescriptions_prescription_id_seq'::regclass);


--
-- TOC entry 5242 (class 2604 OID 27413)
-- Name: referral_doctor_module id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_module ALTER COLUMN id SET DEFAULT nextval('public.referral_doctor_id_seq'::regclass);


--
-- TOC entry 5248 (class 2604 OID 27414)
-- Name: referral_doctor_service_percentage_module percentage_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_service_percentage_module ALTER COLUMN percentage_id SET DEFAULT nextval('public.referral_doctor_service_percentage_percentage_id_seq'::regclass);


--
-- TOC entry 5256 (class 2604 OID 27415)
-- Name: referral_doctors referral_doctor_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctors ALTER COLUMN referral_doctor_id SET DEFAULT nextval('public.referral_doctors_referral_doctor_id_seq'::regclass);


--
-- TOC entry 5260 (class 2604 OID 27416)
-- Name: referral_hospital_mapping mapping_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_hospital_mapping ALTER COLUMN mapping_id SET DEFAULT nextval('public.referral_hospital_mapping_mapping_id_seq'::regclass);


--
-- TOC entry 5263 (class 2604 OID 27417)
-- Name: referral_hospitals referral_hospital_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_hospitals ALTER COLUMN referral_hospital_id SET DEFAULT nextval('public.referral_hospitals_referral_hospital_id_seq'::regclass);


--
-- TOC entry 5267 (class 2604 OID 27418)
-- Name: referral_patients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_patients ALTER COLUMN id SET DEFAULT nextval('public.referral_patients_id_seq'::regclass);


--
-- TOC entry 5328 (class 2604 OID 28209)
-- Name: referral_payment_details id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_details ALTER COLUMN id SET DEFAULT nextval('public.referral_payment_details_id_seq'::regclass);


--
-- TOC entry 5322 (class 2604 OID 28186)
-- Name: referral_payment_header id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_header ALTER COLUMN id SET DEFAULT nextval('public.referral_payment_header_id_seq'::regclass);


--
-- TOC entry 5315 (class 2604 OID 28165)
-- Name: referral_payment_upload_batch id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_upload_batch ALTER COLUMN id SET DEFAULT nextval('public.referral_payment_upload_batch_id_seq'::regclass);


--
-- TOC entry 5272 (class 2604 OID 27419)
-- Name: referral_payments payment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payments ALTER COLUMN payment_id SET DEFAULT nextval('public.referral_payments_payment_id_seq'::regclass);


--
-- TOC entry 5277 (class 2604 OID 27420)
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- TOC entry 5281 (class 2604 OID 27421)
-- Name: services service_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN service_id SET DEFAULT nextval('public.services_service_id_seq'::regclass);


--
-- TOC entry 5286 (class 2604 OID 27422)
-- Name: shift_branches shift_hospital_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_branches ALTER COLUMN shift_hospital_id SET DEFAULT nextval('public.shift_branches_shift_hospital_id_seq'::regclass);


--
-- TOC entry 5289 (class 2604 OID 27423)
-- Name: shifts shift_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts ALTER COLUMN shift_id SET DEFAULT nextval('public.shifts_shift_id_seq'::regclass);


--
-- TOC entry 5294 (class 2604 OID 27424)
-- Name: staff staff_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff ALTER COLUMN staff_id SET DEFAULT nextval('public.staff_staff_id_seq'::regclass);


--
-- TOC entry 5298 (class 2604 OID 27425)
-- Name: staff_branches staff_hospital_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_branches ALTER COLUMN staff_hospital_id SET DEFAULT nextval('public.staff_branches_staff_hospital_id_seq'::regclass);


--
-- TOC entry 5303 (class 2604 OID 27426)
-- Name: user_sessions session_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN session_id SET DEFAULT nextval('public.user_sessions_session_id_seq'::regclass);


--
-- TOC entry 5307 (class 2604 OID 27427)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5836 (class 0 OID 26826)
-- Dependencies: 220
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (appointment_id, appointment_number, patient_name, phone_number, email, age, gender, patient_id, doctor_id, branch_id, department_id, appointment_date, appointment_time, reason_for_visit, appointment_status, booking_date, confirmed_by, cancelled_by, cancellation_reason, notes, created_at, updated_at) FROM stdin;
1	APT-20251204-1374	madhu	q235r		12	Male	\N	5	5	\N	2025-12-04	17:04:00	eqwed	Completed	2025-12-04 16:03:14.182868	\N	\N	\N	dgv	2025-12-04 16:03:14.182868	2025-12-04 17:39:17.472105
2	APT-20251205-3544	Kishore	9754876587	kishore@gmail.com	25	Male	\N	6	8	\N	2025-12-05	10:30:00	Routine check up	Completed	2025-12-05 12:20:28.681881	\N	\N	\N		2025-12-05 12:20:28.681881	2025-12-05 12:21:23.728764
3	APT-20251205-9613	Dhanush	7865675467		\N	\N	\N	8	10	\N	2025-12-05	10:30:00		Completed	2025-12-05 17:37:53.160492	\N	\N	\N		2025-12-05 17:37:53.160492	2025-12-05 17:38:33.234063
4	APT-20251208-2724	Kanappa	2345676543		65	Male	\N	9	12	\N	2025-12-08	11:30:00	Routinue checkup	Completed	2025-12-08 10:46:32.643702	\N	\N	\N		2025-12-08 10:46:32.643702	2025-12-08 10:49:29.580512
5	APT-20251208-9173	gg	8754678654		65	Male	\N	9	12	\N	2025-12-08	10:30:00		Completed	2025-12-08 10:57:49.903602	\N	\N	\N		2025-12-08 10:57:49.903602	2025-12-08 11:01:05.287951
6	APT-20251208-1559	dwtr	5456765544		\N	\N	\N	9	12	\N	2025-12-08	11:22:00		Completed	2025-12-08 11:02:48.530627	\N	\N	\N		2025-12-08 11:02:48.530627	2025-12-08 11:09:31.258732
7	APT-20251208-5121	dfdfe	1235654567		\N	\N	\N	9	12	\N	2025-12-08	03:44:00		Completed	2025-12-08 11:48:09.981202	\N	\N	\N		2025-12-08 11:48:09.981202	2025-12-08 11:48:38.128058
8	APT-20251208-5745	Kumar	5678456787		44	Male	\N	10	14	\N	2025-12-08	11:30:00		Completed	2025-12-08 12:12:43.257329	\N	\N	\N		2025-12-08 12:12:43.257329	2025-12-08 12:14:28.182074
9	APT-20251208-6264	akbar	sdf		\N	Male	\N	9	12	\N	2025-12-08	11:45:00		Completed	2025-12-08 15:04:22.324234	\N	\N	\N		2025-12-08 15:04:22.324234	2025-12-08 15:05:07.390756
10	APT-20251208-8217	birbal	3456787654		\N	\N	\N	9	12	\N	2025-12-08	03:30:00		Scheduled	2025-12-08 15:17:07.686981	\N	\N	\N		2025-12-08 15:17:07.686981	2025-12-08 15:17:07.686981
11	APT-20251208-1654	taj	8888888898		\N	\N	\N	9	12	\N	2025-12-08	04:56:00		In OPD	2025-12-08 15:29:43.492657	\N	\N	\N		2025-12-08 15:29:43.492657	2025-12-08 15:33:06.276871
12	APT-20251208-2904	tilak	5456787654		25	Male	\N	11	15	\N	2025-12-08	10:30:00		In OPD	2025-12-08 15:52:44.814877	\N	\N	\N		2025-12-08 15:52:44.814877	2025-12-08 15:53:39.42612
13	APT-20251208-7112	raj	5456787655		\N	Male	\N	11	15	\N	2025-12-08	11:30:00		In OPD	2025-12-08 15:58:55.006398	\N	\N	\N		2025-12-08 15:58:55.006398	2025-12-08 15:59:16.863078
14	APT-20251208-4096	lavender	5566778654		\N	\N	18	11	15	\N	2025-12-08	11:22:00		Completed	2025-12-08 16:08:23.978331	\N	\N	\N		2025-12-08 16:08:23.978331	2025-12-08 16:09:01.758203
15	APT-20251208-9636	fff	4567876545		\N	\N	24	12	15	\N	2025-12-08	22:30:00		In OPD	2025-12-08 17:15:12.140532	\N	\N	\N		2025-12-08 17:15:12.140532	2025-12-08 17:19:54.274328
16	APT-20251208-5099	dell	5456789098		\N	\N	\N	12	15	\N	2025-12-08	11:50:00		Scheduled	2025-12-08 17:22:51.867684	\N	\N	\N		2025-12-08 17:22:51.867684	2025-12-08 17:22:51.867684
17	APT-20251209-9896	Patient1	4565456787		\N	\N	25	13	17	\N	2025-12-09	10:30:00		Completed	2025-12-09 11:22:01.877349	\N	\N	\N		2025-12-09 11:22:01.877349	2025-12-09 11:28:19.294689
19	APT-20251209-1008	aaaaaaaaa	11111111111	d@gmail.com	22	Female	\N	14	17	\N	2025-12-09	10:30:00		Scheduled	2025-12-09 17:17:26.987685	\N	\N	\N		2025-12-09 17:17:26.987685	2025-12-09 17:17:26.987685
18	APT-20251209-8122	dgh	1212121212		\N	Male	\N	13	17	\N	2025-12-09	12:06:00		Cancelled	2025-12-09 12:05:34.800124	\N	62	Cancelled by receptionist		2025-12-09 12:05:34.800124	2025-12-09 18:06:40.516686
20	APT-20251212-2916	hh	4141414141		\N	\N	\N	19	3	\N	2025-12-12	13:31:00		Scheduled	2025-12-12 12:31:40.361947	\N	\N	\N		2025-12-12 12:31:40.361947	2025-12-12 12:31:40.361947
\.


--
-- TOC entry 5838 (class 0 OID 26844)
-- Dependencies: 222
-- Data for Name: billing_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.billing_items (bill_item_id, bill_id, service_id, item_code, quantity, unit_price, doctor_id, department_id, created_at) FROM stdin;
\.


--
-- TOC entry 5840 (class 0 OID 26854)
-- Dependencies: 224
-- Data for Name: billings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.billings (bill_id, bill_number, patient_id, branch_id, opd_id, admission_id, bill_date, total_amount, discount_amount, tax_amount, net_payable, paid_amount, bill_status, payment_method, insurance_claim_id, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5842 (class 0 OID 26873)
-- Dependencies: 226
-- Data for Name: branch_departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branch_departments (hospital_dept_id, branch_id, department_id, floor_number, room_numbers, head_of_department, is_operational, created_at, updated_at) FROM stdin;
1	18	8	\N	\N	\N	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
2	18	5	\N	\N	\N	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
3	18	1	\N	\N	\N	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
4	18	3	\N	\N	\N	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
5	18	9	\N	\N	\N	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
6	18	15	\N	\N	\N	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
7	18	12	\N	\N	\N	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
8	18	10	\N	\N	\N	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
9	18	7	\N	\N	\N	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
10	18	4	\N	\N	\N	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
11	19	8	\N	\N	\N	t	2025-12-09 15:22:11.862764	2025-12-09 15:22:11.862764
12	19	5	\N	\N	\N	t	2025-12-09 15:22:11.864216	2025-12-09 15:22:11.864216
13	19	6	\N	\N	\N	t	2025-12-09 15:22:11.864662	2025-12-09 15:22:11.864662
14	19	9	\N	\N	\N	t	2025-12-09 15:22:11.865149	2025-12-09 15:22:11.865149
15	19	12	\N	\N	\N	t	2025-12-09 15:22:11.865743	2025-12-09 15:22:11.865743
16	19	11	\N	\N	\N	t	2025-12-09 15:22:11.866179	2025-12-09 15:22:11.866179
17	19	10	\N	\N	\N	t	2025-12-09 15:22:11.866617	2025-12-09 15:22:11.866617
18	19	7	\N	\N	\N	t	2025-12-09 15:22:11.866947	2025-12-09 15:22:11.866947
19	19	4	\N	\N	\N	t	2025-12-09 15:22:11.86726	2025-12-09 15:22:11.86726
20	20	2	\N	\N	\N	t	2025-12-10 11:54:52.590371	2025-12-10 11:54:52.590371
21	20	5	\N	\N	\N	t	2025-12-10 11:54:52.590371	2025-12-10 11:54:52.590371
22	20	8	\N	\N	\N	t	2025-12-10 11:54:52.590371	2025-12-10 11:54:52.590371
23	20	11	\N	\N	\N	t	2025-12-10 11:54:52.590371	2025-12-10 11:54:52.590371
24	22	5	\N	\N	\N	t	2025-12-10 12:20:40.771076	2025-12-10 12:20:40.771076
25	22	9	\N	\N	\N	t	2025-12-10 12:20:40.771076	2025-12-10 12:20:40.771076
26	22	11	\N	\N	\N	t	2025-12-10 12:20:40.771076	2025-12-10 12:20:40.771076
27	22	8	\N	\N	\N	t	2025-12-10 12:20:40.771076	2025-12-10 12:20:40.771076
28	24	5	\N	\N	\N	t	2025-12-12 10:50:20.338835	2025-12-12 10:50:20.338835
29	24	8	\N	\N	\N	t	2025-12-12 10:50:20.341833	2025-12-12 10:50:20.341833
30	24	11	\N	\N	\N	t	2025-12-12 10:50:20.342189	2025-12-12 10:50:20.342189
31	41	17	\N	\N	\N	t	2025-12-16 17:15:36.11764	2025-12-16 17:15:36.11764
32	41	11	\N	\N	\N	t	2025-12-16 17:15:36.11764	2025-12-16 17:15:36.11764
33	41	12	\N	\N	\N	t	2025-12-16 17:15:36.11764	2025-12-16 17:15:36.11764
34	41	15	\N	\N	\N	t	2025-12-16 17:15:36.11764	2025-12-16 17:15:36.11764
35	42	8	\N	\N	\N	t	2025-12-17 10:17:28.451481	2025-12-17 10:17:28.451481
36	42	10	\N	\N	\N	t	2025-12-17 10:17:28.451481	2025-12-17 10:17:28.451481
37	42	18	\N	\N	\N	t	2025-12-17 10:17:28.451481	2025-12-17 10:17:28.451481
38	43	5	\N	\N	\N	t	2025-12-17 11:49:44.363954	2025-12-17 11:49:44.363954
39	43	8	\N	\N	\N	t	2025-12-17 11:49:44.365273	2025-12-17 11:49:44.365273
40	45	4	\N	\N	\N	t	2025-12-17 12:46:43.84368	2025-12-17 12:46:43.84368
41	45	20	\N	\N	\N	t	2025-12-17 12:46:43.84368	2025-12-17 12:46:43.84368
42	46	10	\N	\N	\N	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
43	46	8	\N	\N	\N	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
44	46	1	\N	\N	\N	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
45	46	2	\N	\N	\N	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
46	46	3	\N	\N	\N	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
47	46	5	\N	\N	\N	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
48	46	4	\N	\N	\N	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
49	46	21	\N	\N	\N	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
50	46	24	\N	\N	\N	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
\.


--
-- TOC entry 5844 (class 0 OID 26883)
-- Dependencies: 228
-- Data for Name: branch_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branch_services (branch_service_id, branch_id, service_id, is_active, created_at, updated_at) FROM stdin;
1	18	40	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
2	18	79	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
3	18	22	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
4	18	4	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
5	18	34	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
6	18	17	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
7	18	74	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
8	18	63	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
9	18	68	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
10	18	26	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
11	19	56	t	2025-12-09 15:22:11.867555	2025-12-09 15:22:11.867555
12	19	9	t	2025-12-09 15:22:11.869226	2025-12-09 15:22:11.869226
13	19	82	t	2025-12-09 15:22:11.869677	2025-12-09 15:22:11.869677
14	19	58	t	2025-12-09 15:22:11.870026	2025-12-09 15:22:11.870026
15	19	25	t	2025-12-09 15:22:11.870334	2025-12-09 15:22:11.870334
16	19	70	t	2025-12-09 15:22:11.870654	2025-12-09 15:22:11.870654
17	19	61	t	2025-12-09 15:22:11.871045	2025-12-09 15:22:11.871045
18	19	5	t	2025-12-09 15:22:11.871306	2025-12-09 15:22:11.871306
19	19	38	t	2025-12-09 15:22:11.871559	2025-12-09 15:22:11.871559
20	19	41	t	2025-12-09 15:22:11.871801	2025-12-09 15:22:11.871801
21	19	6	t	2025-12-09 15:22:11.87205	2025-12-09 15:22:11.87205
22	20	47	t	2025-12-10 11:54:52.590371	2025-12-10 11:54:52.590371
23	20	9	t	2025-12-10 11:54:52.590371	2025-12-10 11:54:52.590371
24	20	25	t	2025-12-10 11:54:52.590371	2025-12-10 11:54:52.590371
25	20	69	t	2025-12-10 11:54:52.590371	2025-12-10 11:54:52.590371
26	20	82	t	2025-12-10 11:54:52.590371	2025-12-10 11:54:52.590371
27	20	58	t	2025-12-10 11:54:52.590371	2025-12-10 11:54:52.590371
28	22	9	t	2025-12-10 12:20:40.771076	2025-12-10 12:20:40.771076
29	22	25	t	2025-12-10 12:20:40.771076	2025-12-10 12:20:40.771076
30	22	69	t	2025-12-10 12:20:40.771076	2025-12-10 12:20:40.771076
31	24	47	t	2025-12-12 10:50:20.34252	2025-12-12 10:50:20.34252
32	24	9	t	2025-12-12 10:50:20.345197	2025-12-12 10:50:20.345197
33	24	25	t	2025-12-12 10:50:20.345658	2025-12-12 10:50:20.345658
34	41	69	t	2025-12-16 17:15:36.11764	2025-12-16 17:15:36.11764
35	41	24	t	2025-12-16 17:15:36.11764	2025-12-16 17:15:36.11764
36	41	61	t	2025-12-16 17:15:36.11764	2025-12-16 17:15:36.11764
37	41	41	t	2025-12-16 17:15:36.11764	2025-12-16 17:15:36.11764
38	41	5	t	2025-12-16 17:15:36.11764	2025-12-16 17:15:36.11764
39	42	61	t	2025-12-17 10:17:28.451481	2025-12-17 10:17:28.451481
40	42	41	t	2025-12-17 10:17:28.451481	2025-12-17 10:17:28.451481
41	42	75	t	2025-12-17 10:17:28.451481	2025-12-17 10:17:28.451481
42	42	5	t	2025-12-17 10:17:28.451481	2025-12-17 10:17:28.451481
43	42	66	t	2025-12-17 10:17:28.451481	2025-12-17 10:17:28.451481
44	43	82	t	2025-12-17 11:49:44.365613	2025-12-17 11:49:44.365613
45	45	39	t	2025-12-17 12:46:43.84368	2025-12-17 12:46:43.84368
46	45	24	t	2025-12-17 12:46:43.84368	2025-12-17 12:46:43.84368
47	45	64	t	2025-12-17 12:46:43.84368	2025-12-17 12:46:43.84368
48	46	47	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
49	46	27	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
50	46	22	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
51	46	79	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
52	46	76	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
53	46	2	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
54	46	16	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
55	46	51	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
56	46	52	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
57	46	29	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
58	46	15	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
\.


--
-- TOC entry 5846 (class 0 OID 26893)
-- Dependencies: 230
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branches (branch_id, hospital_id, branch_name, branch_code, address_line1, address_line2, city, state, pincode, country, latitude, longitude, contact_number, email, branch_manager, total_beds, emergency_available, icu_beds, general_beds, is_active, created_at, updated_at, mlc_fee, enabled_modules) FROM stdin;
1	4	apollo Main Branch	AP001-MAIN	Indira nagar	\N	\N	\N	\N	India	\N	\N	8282828282	\N	\N	\N	f	0	0	t	2025-12-04 11:34:02.498301	2025-12-04 12:46:08.255319	0.00	\N
7	8	Kausalya Hospital Main Branch	KH0001-MAIN		\N	\N	\N	\N	India	\N	\N	+91 9876543234	\N	\N	\N	f	0	0	t	2025-12-05 10:15:34.112889	2025-12-05 10:15:34.112889	0.00	\N
8	8	KH-P	BR-KH-001		\N	Pollachi	TN		India	\N	\N		\N	\N	\N	t	0	0	t	2025-12-05 10:21:27.728656	2025-12-05 10:21:27.728656	0.00	\N
4	4	asdf	adf	adf	\N	aef	aef		India	\N	\N		\N	\N	\N	t	0	0	t	2025-12-04 12:44:45.220785	2025-12-05 11:23:10.203578	0.00	\N
9	9	Amren Main Branch	AM001-MAIN		\N	\N	\N	\N	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-05 16:05:09.221919	2025-12-05 16:05:09.221919	0.00	\N
10	9	branch-1	AM-BR-001		\N	CN	TN		India	\N	\N		\N	\N	\N	t	0	0	t	2025-12-05 16:07:11.758055	2025-12-05 16:07:11.758055	0.00	\N
11	8	BR2	AM-BR-002		\N	AN	KY		India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-05 16:20:59.401814	2025-12-05 16:20:59.401814	0.00	\N
2	5	City General Hospital Main Branch	CGH001-MAIN	123 Main Street	\N	\N	\N	\N	India	\N	\N	+91-9876543210	\N	\N	\N	f	0	0	f	2025-12-04 12:21:01.453672	2025-12-08 10:38:25.636414	0.00	\N
12	10	KV hospital Main Branch	KV001-MAIN		\N	\N	\N	\N	India	\N	\N	+91 9776698765	\N	\N	\N	f	0	0	t	2025-12-08 10:39:46.204638	2025-12-08 10:39:46.204638	0.00	\N
13	10	kvb-1	kv00-b1		\N	KA	TN		India	\N	\N		\N	\N	\N	t	0	0	t	2025-12-08 10:42:07.897786	2025-12-08 10:42:07.897786	0.00	\N
14	12	Shanti Hospital Main Branch	SH001-MAIN		\N	\N	\N	\N	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-08 12:05:46.171886	2025-12-08 12:05:46.171886	0.00	\N
15	13	Sun Main Branch	HS0023-MAIN		\N	\N	\N	\N	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-08 15:48:18.014037	2025-12-08 15:48:18.014037	0.00	\N
16	13	s1	s1		\N	bangalore	KA		India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-08 15:48:48.348804	2025-12-08 15:48:48.348804	0.00	\N
17	14	Ashoka Main Branch	AS001-MAIN		\N	\N	\N	\N	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-09 11:07:12.463634	2025-12-09 11:07:12.463634	0.00	\N
18	15	test with bracnh and service Main Branch	BS001-MAIN		\N	\N	\N	\N	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298	0.00	\N
19	15	B1 TEST BS	BR135		\N	AD	AD		India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-09 15:22:11.859836	2025-12-09 15:22:11.859836	0.00	\N
20	16	with logo Main Branch	WL001-MAIN		\N	\N	\N	\N	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-10 11:54:52.590371	2025-12-10 11:54:52.590371	0.00	\N
21	16	test wl b	wlb001	C-129, D-colony, P.K. Kandasamy street,	\N	Pollachi	Tamil Nadu	642001	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-10 12:09:28.128938	2025-12-10 12:09:28.128938	0.00	\N
22	17	logo check Main Branch	LG001-MAIN		\N	\N	\N	\N	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-10 12:20:40.771076	2025-12-10 12:20:40.771076	0.00	\N
3	6	Sunshine Medical Center Main Branch	SMC001-MAIN	456 Park Avenue	\N	\N	\N	\N	India	\N	\N	+91-9123456789	\N	\N	\N	f	0	0	f	2025-12-04 12:22:29.912709	2025-12-11 15:24:27.385855	0.00	\N
23	6	sus 2	sus02	C-129, D-colony, P.K. Kandasamy street,	\N	Pollachi	Tamil Nadu	642001	India	\N	\N		\N	\N	\N	f	0	0	f	2025-12-10 15:02:42.270072	2025-12-11 15:24:27.385855	0.00	\N
24	6	sus3	br01	1st Floor, 81, The Hulkul, 37, Lavelle Road, Shanthala Nagar, Ashok Nagar, Bengaluru, Karnataka Bengaluru, Karnataka 560001 India	\N	Bangalore	Karnataka	560001	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-12 10:50:20.336558	2025-12-12 10:50:20.336558	1000.00	\N
25	19	Test Branch	TB1765860539458	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:18:59.457658	2025-12-16 10:18:59.457658	0.00	\N
26	20	Test Branch	TB1765860626396	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:20:26.394471	2025-12-16 10:20:26.394471	0.00	\N
27	21	Test Branch	TB1765860671686	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:21:11.684965	2025-12-16 10:21:11.684965	0.00	\N
28	22	Test Branch	TB1765860703084	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:21:43.082444	2025-12-16 10:21:43.082444	0.00	\N
29	23	Debug Branch	DBB1765860745416	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:22:25.417148	2025-12-16 10:22:25.417148	0.00	\N
30	24	Test Branch	TB1765860783829	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:23:03.827374	2025-12-16 10:23:03.827374	0.00	\N
31	25	Debug Branch	DBB1765860794602	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:23:14.604413	2025-12-16 10:23:14.604413	0.00	\N
5	7	pi Main Branch	ASDF-MAIN	Indira nagar	\N	\N	\N	\N	India	\N	\N	98698698698	\N	\N	\N	f	0	0	f	2025-12-04 14:43:50.165074	2025-12-16 10:25:23.880983	0.00	\N
6	7	hehe	h12	Indira nagar	\N	Banglore	Karnataka	560038	India	\N	\N		\N	\N	\N	f	0	0	f	2025-12-04 15:11:45.659012	2025-12-16 10:25:23.880983	0.00	\N
32	26	Refined Branch	RTB1765862303813	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:48:23.812037	2025-12-16 10:48:23.812037	0.00	\N
33	27	Refined Branch	RTB1765862330103	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:48:50.101765	2025-12-16 10:48:50.101765	0.00	\N
34	28	DD Branch	DDB	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:49:24.468903	2025-12-16 10:49:24.468903	0.00	\N
35	29	Branch Doc Only	BDO1765863029829	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 11:00:29.835133	2025-12-16 11:00:29.835133	0.00	[{"id": "doc", "is_active": true}]
36	30	Branch Doc Only	BDO1765863068572	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 11:01:08.576971	2025-12-16 11:01:08.576971	0.00	[{"id": "doc", "is_active": true}]
37	31	Branch Doc Only	BDO1765863091634	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 11:01:31.639812	2025-12-16 11:01:31.639812	0.00	[{"id": "doc", "is_active": true}]
38	32	Branch Doc Only	BDO1765863129532	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 11:02:09.536276	2025-12-16 11:02:09.536276	0.00	[{"id": "doc", "is_active": true}]
39	33	Branch Doc Only	BDO1765863140875	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 11:02:20.879843	2025-12-16 11:02:20.879843	0.00	[{"id": "doc", "is_active": true}]
40	34	Branch Doc Only	BDO1765884410264	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 16:56:50.26749	2025-12-16 16:56:50.26749	0.00	[{"id": "doc", "is_active": true}]
41	35	Aradhana Main Branch	HS0001-MAIN	Indira nagar	\N	\N	\N	\N	India	\N	\N	8787676565	\N	\N	\N	f	0	0	t	2025-12-16 17:15:36.11764	2025-12-16 17:15:36.11764	0.00	\N
43	36	akb1	ak001		\N	bangalore	KA		India	\N	\N	4354535636	\N	\N	\N	t	0	0	t	2025-12-17 11:49:44.361379	2025-12-17 11:49:44.361379	100.00	{}
42	36	ak Main Branch	AK01-MAIN	Bangalore	\N	Bangalore	KA		India	\N	\N	9898767876	\N	\N	\N	f	0	0	t	2025-12-17 10:17:28.451481	2025-12-17 12:05:33.567259	100.00	{}
45	38	57 Main Branch	658-MAIN		\N	\N	\N	\N	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-17 12:46:43.84368	2025-12-17 12:46:43.84368	0.00	\N
46	39	camry hospital Main Branch	CAMRY001-MAIN	9/10/11, Arakere Bannerghatta Rd, Shantiniketan Layout, Arekere, Bengaluru, Karnataka 560076	\N	\N	\N	\N	India	\N	\N	9355304574	\N	\N	\N	f	0	0	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832	0.00	\N
\.


--
-- TOC entry 5848 (class 0 OID 26911)
-- Dependencies: 232
-- Data for Name: client_modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.client_modules (client_module_id, client_id, module_id, registered_date, marketing_id, status, created_by, updated_by, created_at, updated_at, uuid, branch_id) FROM stdin;
\.


--
-- TOC entry 5850 (class 0 OID 26924)
-- Dependencies: 234
-- Data for Name: consultation_outcomes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.consultation_outcomes (outcome_id, opd_id, patient_id, doctor_id, prescription_id, consultation_status, diagnosis, notes, next_visit_date, next_visit_status, created_at, updated_at, labs, referral_doctor_id, referral_notes, medications) FROM stdin;
1	4	3	6	1	Completed	heart disease	notes	2025-12-12	Follow-up Required	2025-12-05 15:14:40.024004	2025-12-05 15:14:40.024004	[]	\N	\N	[]
2	5	4	8	2	Completed	efh fjkh jkldfh jhf od	sdf asdf asdfg d	2025-12-12	Follow-up Required	2025-12-05 17:50:22.864538	2025-12-05 17:50:22.864538	[]	\N	\N	[]
3	6	5	9	3	Completed			2025-12-17	Follow-up Required	2025-12-08 10:53:17.898417	2025-12-08 10:53:17.898417	[]	\N	\N	[]
4	10	9	10	4	Completed	ghgh gh dgfh 	4 days high fever\nvomit sensation\nhigh bp - 4 days\npatient already taken ffor dollo 650 - 2 days antibiotic\n	2025-12-17	Follow-up Required	2025-12-08 12:27:17.163359	2025-12-08 12:27:17.163359	[]	\N	\N	[]
5	11	10	10	5	Completed	ef\nsdgd\ng\nn\nfg\nts\nrtddsf\n	rttt\nsdf\nfgs\ndg	2025-12-19	Follow-up Required	2025-12-08 13:05:07.709792	2025-12-08 13:05:07.709792	[{"lab_name": "sdg", "test_name": "gd"}, {"lab_name": "sg", "test_name": "sdg"}]	\N	\N	[]
6	12	11	9	6	Completed	werr\nwer\nwer\nwer\nr\nt\n rh\n	ert\n grt\ngfg \nefg\n \nf	2025-12-25	Follow-up Required	2025-12-08 14:31:06.833202	2025-12-08 14:31:06.833202	[{"lab_name": "sdf", "test_name": "dst"}, {"lab_name": "sf", "test_name": "sdt"}]	\N	\N	[]
7	7	6	9	8	Completed	df	wdf	2025-12-11	Follow-up Required	2025-12-08 14:39:55.467013	2025-12-08 14:39:55.467013	[{"lab_name": "assds", "test_name": "df"}]	\N	\N	[]
8	8	7	9	10	Completed	asd	das	2025-12-11	Follow-up Required	2025-12-08 14:41:42.084261	2025-12-08 14:41:42.084261	[{"lab_name": "as", "test_name": "asd"}]	\N	\N	[]
9	9	8	9	\N	Completed	sdfsfd	wdfdf	\N	Not Necessary	2025-12-08 14:53:35.614236	2025-12-08 14:53:35.614236	[]	\N	\N	[]
10	25	15	9	11	Completed	sac\nv\nv\ng\ng\ngffgs\n	qwed	2025-12-11	Follow-up Required	2025-12-08 15:45:34.975316	2025-12-08 15:45:34.975316	[{"lab_name": "wqd", "test_name": "qw"}, {"lab_name": "qwd", "test_name": "qwd"}]	\N	\N	[]
11	27	16	11	12	Completed	wqr	reqd	\N	Not Necessary	2025-12-08 15:55:17.542003	2025-12-08 15:55:17.542003	[{"lab_name": "qwer", "test_name": "qwer"}, {"lab_name": "qwr", "test_name": "qwr"}, {"lab_name": "qwr", "test_name": "qwre"}]	\N	\N	[]
12	29	17	11	\N	Completed		sfssfs	\N	Follow-up Required	2025-12-08 16:00:03.120649	2025-12-08 16:00:03.120649	[]	\N	\N	[]
13	30	18	11	\N	Completed		wdsa	\N	Follow-up Required	2025-12-08 16:09:01.758203	2025-12-08 16:09:01.758203	[]	\N	\N	[]
14	34	25	13	13	Completed	dental xray dfhdfh gdh dgh gh sdgh dgh sdg\nhj fhgj \n	dental\ntooth ache\npremolar\ncavity	2025-12-10	Follow-up Required	2025-12-09 11:28:19.294689	2025-12-09 11:28:19.294689	[{"lab_name": "test", "test_name": "blood test"}]	\N	\N	[]
15	36	25	13	\N	Completed	af	asfa	\N	Follow-up Required	2025-12-09 12:03:22.670367	2025-12-09 12:03:22.670367	[]	\N	\N	[]
16	35	26	13	\N	Completed	asef	af	\N	Not Necessary	2025-12-09 12:46:10.778647	2025-12-09 12:46:10.778647	[]	\N	\N	[]
17	37	26	13	\N	Completed		asef	\N	Follow-up Required	2025-12-09 12:53:10.465331	2025-12-09 12:53:10.465331	[]	\N	\N	[]
18	41	30	19	\N	Draft		srfrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr	\N	Follow-up Required	2025-12-12 12:06:30.276951	2025-12-12 12:07:29.750843	[]	6	\N	[{"name": "jl,k", "noon": false, "night": false, "dosage": "y,jkl,", "morning": true, "duration": "", "frequency": "", "food_timing": "Before Food"}]
20	42	31	19	\N	Completed			\N	Follow-up Required	2025-12-12 12:28:16.956338	2025-12-12 12:28:16.956338	[]	\N	\N	[]
22	43	32	19	\N	Completed			\N	Follow-up Required	2025-12-12 12:31:57.249239	2025-12-12 12:31:57.249239	[]	\N	\N	[]
23	44	33	19	\N	Draft			2025-12-05	Follow-up Required	2025-12-12 12:35:16.904713	2025-12-12 12:35:16.915651	[]	\N	\N	[]
24	45	31	19	14	Completed	sfgsfg	gsd	\N	Follow-up Required	2025-12-12 12:44:07.294197	2025-12-12 12:44:07.294197	[]	6	sdfgsdfg	[]
25	46	34	19	\N	Draft		dfgdfg	\N	Follow-up Required	2025-12-12 14:54:12.246653	2025-12-12 14:54:22.040426	[]	\N	\N	[]
28	50	38	32	\N	Draft		wfsdfg	\N	Follow-up Required	2025-12-17 12:16:20.832528	2025-12-17 12:16:44.492063	[{"lab_name": "safg", "test_name": "asfg"}, {"lab_name": "sdg", "test_name": "sd"}]	7	\N	[]
26	47	35	5	\N	Draft	retyreyt	rtyrtwrt	\N	Follow-up Required	2025-12-16 17:44:42.761679	2025-12-16 17:48:05.71541	[]	5	\N	[{"name": "rety", "noon": true, "night": true, "dosage": "ret", "morning": true, "duration": "", "frequency": "", "food_timing": "After Food"}, {"name": "rty", "noon": false, "night": false, "dosage": "rty", "morning": true, "duration": "", "frequency": "", "food_timing": "After Food"}]
27	48	36	5	\N	Draft	asgfsfg	sfgsfg	\N	Follow-up Required	2025-12-16 18:06:53.278476	2025-12-16 18:07:27.971778	[{"lab_name": "fg", "test_name": "afg"}, {"lab_name": "asg", "test_name": "asg"}]	5	\N	[{"name": "dsf", "noon": false, "night": false, "dosage": "sdfg", "morning": true, "duration": "", "frequency": "", "food_timing": "After Food"}]
\.


--
-- TOC entry 5852 (class 0 OID 26936)
-- Dependencies: 236
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (department_id, department_name, department_code, description, is_active, created_at, updated_at) FROM stdin;
1	Cardiology	CARD	Heart and cardiovascular system care	t	2025-12-04 12:48:18.934838	2025-12-04 12:48:18.934838
2	Pediatrics	PEDI	Medical care for infants, children, and adolescents	t	2025-12-04 12:48:18.937164	2025-12-04 12:48:18.937164
3	Orthopedics	ORTH	Musculoskeletal system treatment	t	2025-12-04 12:48:18.937758	2025-12-04 12:48:18.937758
4	Neurology	NEUR	Nervous system disorders treatment	t	2025-12-04 12:48:18.938248	2025-12-04 12:48:18.938248
5	General Surgery	SURG	Surgical procedures and operations	t	2025-12-04 12:48:18.938679	2025-12-04 12:48:18.938679
6	Emergency Medicine	EMER	24/7 emergency and trauma care	t	2025-12-04 12:48:18.939058	2025-12-04 12:48:18.939058
7	Radiology	RADI	Medical imaging and diagnostics	t	2025-12-04 12:48:18.939676	2025-12-04 12:48:18.939676
8	Obstetrics & Gynecology	OBGY	Women's health and childbirth	t	2025-12-04 12:48:18.940187	2025-12-04 12:48:18.940187
9	Dermatology	DERM	Skin, hair, and nail disorders	t	2025-12-04 12:48:18.940675	2025-12-04 12:48:18.940675
10	ENT (Otolaryngology)	ENT	Ear, nose, and throat treatment	t	2025-12-04 12:48:18.941167	2025-12-04 12:48:18.941167
11	Ophthalmology	OPHT	Eye care and vision treatment	t	2025-12-04 12:48:18.941577	2025-12-04 12:48:18.941577
12	Psychiatry	PSYC	Mental health and behavioral disorders	t	2025-12-04 12:48:18.941929	2025-12-04 12:48:18.941929
13	Internal Medicine	INTM	Adult disease prevention and treatment	t	2025-12-04 12:48:18.942253	2025-12-04 12:48:18.942253
14	Anesthesiology	ANES	Anesthesia and pain management	t	2025-12-04 12:48:18.942606	2025-12-04 12:48:18.942606
15	Oncology	ONCO	Cancer treatment and care	t	2025-12-04 12:48:18.942916	2025-12-04 12:48:18.942916
16	Nephrology	NEPH	Kidney disease treatment	t	2025-12-04 12:48:18.943254	2025-12-04 12:48:18.943254
17	Gastroenterology	GAST	Digestive system disorders	t	2025-12-04 12:48:18.943588	2025-12-04 12:48:18.943588
18	Endocrinology	ENDO	Hormone and gland disorders	t	2025-12-04 12:48:18.943914	2025-12-04 12:48:18.943914
19	Urology	UROL	Urinary tract and male reproductive system	t	2025-12-04 12:48:18.944264	2025-12-04 12:48:18.944264
20	Pulmonology	PULM	Respiratory system and lung diseases	t	2025-12-04 12:48:18.94458	2025-12-04 12:48:18.94458
21	Physiotherapy	PHYS	Physical rehabilitation and therapy	t	2025-12-04 12:48:18.944887	2025-12-04 12:48:18.944887
22	Pathology	PATH	Laboratory testing and disease diagnosis	t	2025-12-04 12:48:18.945197	2025-12-04 12:48:18.945197
23	Pharmacy	PHAR	Medication and pharmaceutical services	t	2025-12-04 12:48:18.945519	2025-12-04 12:48:18.945519
24	Intensive Care Unit (ICU)	ICU	Critical care for severe conditions	t	2025-12-04 12:48:18.945827	2025-12-04 12:48:18.945827
25	Dental	DENT	Oral and dental health care	t	2025-12-04 12:48:18.946162	2025-12-04 12:48:18.946162
26	Skin & burning\n	SKBR	Fire accident cases	t	2025-12-09 12:33:21.063517	2025-12-09 12:33:21.063517
27	Dietitian\n	DIET	Food and diet management	t	2025-12-04 12:48:18.946162	2025-12-04 12:48:18.946162
\.


--
-- TOC entry 5854 (class 0 OID 26948)
-- Dependencies: 238
-- Data for Name: doctor_branch_departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_branch_departments (doc_hosp_dept_id, doctor_id, branch_id, department_id, is_primary, created_at) FROM stdin;
\.


--
-- TOC entry 5856 (class 0 OID 26958)
-- Dependencies: 240
-- Data for Name: doctor_branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_branches (doc_hospital_id, doctor_id, branch_id, joining_date, employment_type, is_active, created_at, updated_at) FROM stdin;
1	4	2	\N	Permanent	t	2025-12-04 13:08:59.588336	2025-12-04 13:08:59.588336
2	5	5	\N	Permanent	t	2025-12-04 15:46:19.526657	2025-12-04 15:46:19.526657
3	6	7	\N	Permanent	t	2025-12-05 10:24:01.508555	2025-12-05 10:24:01.508555
4	6	8	\N	Permanent	t	2025-12-05 10:24:01.508555	2025-12-05 10:24:01.508555
5	7	11	\N	Permanent	t	2025-12-05 16:22:27.822726	2025-12-05 16:22:27.822726
6	7	7	\N	Permanent	t	2025-12-05 16:22:27.822726	2025-12-05 16:22:27.822726
7	8	10	\N	Permanent	t	2025-12-05 17:08:35.865492	2025-12-05 17:08:35.865492
8	8	9	\N	Permanent	t	2025-12-05 17:08:35.865492	2025-12-05 17:08:35.865492
9	9	13	\N	Permanent	t	2025-12-08 10:43:45.794712	2025-12-08 10:43:45.794712
10	9	12	\N	Permanent	t	2025-12-08 10:43:45.794712	2025-12-08 10:43:45.794712
11	10	14	\N	Permanent	t	2025-12-08 12:09:19.478613	2025-12-08 12:09:19.478613
12	11	15	\N	Permanent	t	2025-12-08 15:49:46.685247	2025-12-08 15:49:46.685247
13	11	16	\N	Permanent	t	2025-12-08 15:49:46.685247	2025-12-08 15:49:46.685247
14	12	15	\N	Permanent	t	2025-12-08 16:21:26.742169	2025-12-08 16:21:26.742169
15	13	17	\N	Permanent	t	2025-12-09 11:14:39.39946	2025-12-09 11:14:39.39946
16	14	17	\N	Permanent	t	2025-12-09 16:46:42.63248	2025-12-09 16:46:42.63248
17	15	17	\N	Permanent	t	2025-12-09 16:48:56.82302	2025-12-09 16:48:56.82302
18	16	20	\N	Permanent	t	2025-12-10 12:08:17.989291	2025-12-10 12:08:17.989291
19	18	21	\N	Permanent	t	2025-12-10 12:10:52.629981	2025-12-10 12:10:52.629981
20	19	3	\N	Permanent	t	2025-12-11 15:36:17.046982	2025-12-11 15:36:17.046982
21	21	24	\N	Permanent	t	2025-12-12 10:51:19.318091	2025-12-12 10:51:19.318091
22	22	24	\N	Permanent	t	2025-12-12 11:01:29.423252	2025-12-12 11:01:29.423252
23	24	33	\N	Permanent	t	2025-12-16 10:48:50.216192	2025-12-16 10:48:50.216192
24	25	34	\N	Permanent	t	2025-12-16 10:49:24.532909	2025-12-16 10:49:24.532909
25	26	35	\N	Permanent	t	2025-12-16 11:00:29.935786	2025-12-16 11:00:29.935786
26	28	37	\N	Permanent	t	2025-12-16 11:01:31.734163	2025-12-16 11:01:31.734163
27	29	38	\N	Permanent	t	2025-12-16 11:02:09.629037	2025-12-16 11:02:09.629037
28	30	39	\N	Permanent	t	2025-12-16 11:02:20.978553	2025-12-16 11:02:20.978553
29	31	40	\N	Permanent	t	2025-12-16 16:56:50.363361	2025-12-16 16:56:50.363361
30	32	42	\N	Permanent	t	2025-12-17 11:48:41.599657	2025-12-17 11:48:41.599657
31	33	43	\N	Permanent	t	2025-12-17 12:15:12.253627	2025-12-17 12:15:12.253627
32	33	42	\N	Permanent	t	2025-12-17 12:15:12.253627	2025-12-17 12:15:12.253627
33	34	46	\N	Permanent	t	2025-12-18 07:52:22.267891	2025-12-18 07:52:22.267891
\.


--
-- TOC entry 5858 (class 0 OID 26970)
-- Dependencies: 242
-- Data for Name: doctor_departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_departments (doc_dept_id, doctor_id, department_id, is_primary_department, created_at) FROM stdin;
1	4	1	t	2025-12-04 13:08:59.588336
2	5	1	t	2025-12-04 15:46:19.526657
3	6	1	t	2025-12-05 10:24:01.508555
4	7	20	t	2025-12-05 16:22:27.822726
5	8	20	t	2025-12-05 17:08:35.865492
6	9	4	t	2025-12-08 10:43:45.794712
7	10	3	t	2025-12-08 12:09:19.478613
8	11	5	t	2025-12-08 15:49:46.685247
9	12	14	t	2025-12-08 16:21:26.742169
10	13	12	t	2025-12-09 11:14:39.39946
11	14	4	t	2025-12-09 16:46:42.63248
12	15	2	t	2025-12-09 16:48:56.82302
13	16	1	t	2025-12-10 12:08:17.989291
14	18	1	t	2025-12-10 12:10:52.629981
15	19	2	t	2025-12-11 15:36:17.046982
16	21	1	t	2025-12-12 10:51:19.318091
17	22	2	t	2025-12-12 11:01:29.423252
18	32	3	t	2025-12-17 11:48:41.599657
19	34	3	t	2025-12-18 07:52:22.267891
\.


--
-- TOC entry 5860 (class 0 OID 26979)
-- Dependencies: 244
-- Data for Name: doctor_shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_shifts (doctor_shift_id, doctor_id, branch_id, shift_id, department_id, shift_date, attendance_status, check_in_time, check_out_time, patients_attended, notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5862 (class 0 OID 26995)
-- Dependencies: 246
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctors (doctor_id, user_id, first_name, last_name, doctor_code, gender, date_of_birth, contact_number, email, qualification, specialization, experience_years, registration_number, registration_council, address, emergency_contact, consultation_fee, is_active, profile_photo, created_at, updated_at, bank_name, account_number, ifsc_code, doctor_type, signature_url) FROM stdin;
4	20	asf	aef	DOC939652	\N	\N	\N	\N	AEF	aef	1	aEF	\N	\N	\N	12334.00	t	\N	2025-12-04 13:08:59.588336	2025-12-04 13:08:59.588336	\N	\N	\N	In-house	\N
5	30	doc	1	DOC379582	\N	\N	\N	\N	1	qw	1	1237865245486485	\N	\N	\N	1111.00	t	\N	2025-12-04 15:46:19.526657	2025-12-04 15:46:19.526657	\N	\N	\N	In-house	\N
6	32	Anand	Kali	DOC441566	\N	\N	\N	\N		Cardiology	\N	RN000123	\N	\N	\N	\N	t	\N	2025-12-05 10:24:01.508555	2025-12-05 10:24:01.508555	\N	\N	\N	In-house	\N
7	37	Aravind	Ram	DOC947885	\N	\N	\N	\N		Lungs	\N	RN00012	\N	\N	\N	\N	t	\N	2025-12-05 16:22:27.822726	2025-12-05 16:22:27.822726	\N	\N	\N	In-house	\N
8	40	Kishore	Jai	DOC715921	\N	\N	\N	\N		Lungs	\N	DR001	\N	\N	\N	\N	t	\N	2025-12-05 17:08:35.865492	2025-12-05 17:08:35.865492	\N	\N	\N	In-house	\N
9	43	Ram	Mohan	DOC825846	\N	\N	\N	\N		Nerves	\N	12345678	\N	\N	\N	\N	t	\N	2025-12-08 10:43:45.794712	2025-12-08 10:43:45.794712	\N	\N	\N	In-house	\N
10	46	Anand	Kumar	DOC959532	\N	\N	\N	\N		Dental	\N	345674577	\N	\N	\N	\N	t	\N	2025-12-08 12:09:19.478613	2025-12-08 12:09:19.478613	\N	\N	\N	In-house	\N
11	52	sun1	1	DOC186741	\N	\N	\N	\N		brain	\N	379876	\N	\N	\N	\N	t	\N	2025-12-08 15:49:46.685247	2025-12-08 15:49:46.685247	\N	\N	\N	In-house	\N
12	55	sundoc2	3	DOC086801	\N	\N	\N	\N		dd	\N	2434555	\N	\N	\N	\N	t	\N	2025-12-08 16:21:26.742169	2025-12-08 16:21:26.742169	\N	\N	\N	In-house	\N
13	59	Rathnam	S	DOC079454	\N	\N	\N	\N	MBBS MD	mental health	5	5467478588	\N	\N	\N	100.00	t	\N	2025-12-09 11:14:39.39946	2025-12-09 11:14:39.39946	\N	\N	\N	In-house	\N
14	64	Alopa	kanji	DOC002696	Female	2025-06-04	\N	\N	dfg fdg	Nerves	4	456787	\N	asfds\r\nasfg\r\nsg\r\nsfg\r\nsdfg	\N	100.00	t	\N	2025-12-09 16:46:42.63248	2025-12-09 16:46:42.63248	edfd	124542545	345453	In-house	uploads\\signature-1765279002629-331728013.svg
15	65	aratha	a	DOC136876	Female	2025-11-25	\N	\N		children	\N	456789	\N		\N	\N	t	\N	2025-12-09 16:48:56.82302	2025-12-09 16:48:56.82302	adf	34566	3456	Visiting	uploads\\signature-1765279136821-191925831.svg
16	68	docwl	s	DOC698041	Male	2003-12-28	\N	\N		awef	\N	dfsfsdf	\N		\N	1888.00	t	\N	2025-12-10 12:08:17.989291	2025-12-10 12:08:17.989291				In-house	uploads\\signature-1765348697987-977506676.png
18	70	doc2wl	s	DOC852685	Male	2020-01-28	\N	\N		af	\N	adfaef	\N		\N	1234.00	t	\N	2025-12-10 12:10:52.629981	2025-12-10 12:10:52.629981				In-house	\N
19	83	doc 	1	DOC577097	Male	2015-01-04	\N	\N		zdfgsvsdzfg	\N	asdegaergeg	\N		\N	1234.00	t	\N	2025-12-11 15:36:17.046982	2025-12-11 15:36:17.046982				In-house	\N
21	87	doc	test	DOC879369	Male	2025-12-04	\N	\N		weafsegf	\N	srdgvsff	\N		\N	\N	t	\N	2025-12-12 10:51:19.318091	2025-12-12 10:51:19.318091				In-house	uploads\\signature-1765516879316-444893382.png
22	90	esf	srtg	DOC489475	Male	2025-12-12	\N	\N		dfh	\N	sdfgvsfg	\N		\N	1222.00	t	\N	2025-12-12 11:01:29.423252	2025-12-12 11:01:29.423252				In-house	\N
24	102	Test	Doctor	D102	\N	\N	\N	\N	\N	\N	\N	REG102	\N	\N	\N	\N	t	\N	2025-12-16 10:48:50.212328	2025-12-16 10:48:50.212328	\N	\N	\N	In-house	\N
25	104	D	D	DC	\N	\N	\N	\N	\N	\N	\N	REGD	\N	\N	\N	\N	t	\N	2025-12-16 10:49:24.529841	2025-12-16 10:49:24.529841	\N	\N	\N	In-house	\N
26	106	Branch	Doc	BD	\N	\N	\N	\N	\N	\N	\N	BDR	\N	\N	\N	\N	t	\N	2025-12-16 11:00:29.932746	2025-12-16 11:00:29.932746	\N	\N	\N	In-house	\N
28	109	Branch	Doc	BD1765863091634	\N	\N	\N	\N	\N	\N	\N	BDR1765863091634	\N	\N	\N	\N	t	\N	2025-12-16 11:01:31.731589	2025-12-16 11:01:31.731589	\N	\N	\N	In-house	\N
29	111	Branch	Doc	BD1765863129532	\N	\N	\N	\N	\N	\N	\N	BDR1765863129532	\N	\N	\N	\N	t	\N	2025-12-16 11:02:09.626611	2025-12-16 11:02:09.626611	\N	\N	\N	In-house	\N
30	113	Branch	Doc	BD1765863140875	\N	\N	\N	\N	\N	\N	\N	BDR1765863140875	\N	\N	\N	\N	t	\N	2025-12-16 11:02:20.974648	2025-12-16 11:02:20.974648	\N	\N	\N	In-house	\N
31	115	Branch	Doc	BD1765884410264	\N	\N	\N	\N	\N	\N	\N	BDR1765884410264	\N	\N	\N	\N	t	\N	2025-12-16 16:56:50.360028	2025-12-16 16:56:50.360028	\N	\N	\N	In-house	\N
32	126	doc1	1	DOC321660	Male	1988-01-01	\N	\N	MBBS	Cardio	3	4567456	\N		\N	500.00	t	\N	2025-12-17 11:48:41.599657	2025-12-17 11:48:41.599657	adfd	234	45	In-house	\N
33	127	doc2	2	DOC912319	Male	1999-02-02	\N	\N		cardio	\N	2345245	\N		\N	100.00	t	\N	2025-12-17 12:15:12.253627	2025-12-17 12:15:12.253627	215	45	345	In-house	\N
34	135	Roy	F	DOC542594	Male	1994-12-26	\N	\N	MBBS	surgeon	10	KMC12345624	\N	Camry hospitals	\N	500.00	t	\N	2025-12-18 07:52:22.267891	2025-12-18 07:52:22.267891	bank abc	12345678912345	ABC1234DF	In-house	uploads\\signature-1766024542260-517585956.png
\.


--
-- TOC entry 5864 (class 0 OID 27013)
-- Dependencies: 248
-- Data for Name: hospital_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hospital_services (hosp_service_id, uuid, hospital_id, branch_id, service_code, service_name, service_description, is_active, created_at, updated_at, created_by, updated_by, gst_rate) FROM stdin;
1	960232b7-3e84-4f71-a098-fd336351c6ed	4	1	OPD-GEN	General OPD Consultation	General Outpatient Department Consultation Service	t	2025-12-14 16:24:35.393573	2025-12-14 16:24:35.393573	1	\N	0.00
2	f72024cd-40f2-4d83-83cb-858e2fb064d5	4	1	LAB-BLOOD	Blood Test Full Panel	Complete Blood Count and analysis	t	2025-12-14 16:24:35.393573	2025-12-14 16:24:35.393573	1	\N	0.00
4	b5691ed4-9365-432a-988c-e624db91cdd4	6	3	OPD-GEN	Consultation	General Consultation	t	2025-12-18 01:53:23.621397	2025-12-18 01:53:23.621397	1	\N	0.00
5	ee50554d-dbc0-440e-af96-24f4450e047f	6	3	XRAY-01	X-Ray	X-Ray Service	t	2025-12-18 01:53:23.645421	2025-12-18 01:53:23.645421	1	\N	0.00
6	b0d46c07-2718-4cb6-83d2-9fabb1cae1d0	6	3	LAB-BLOOD	Blood Test	Blood Test Service	t	2025-12-18 01:53:23.647476	2025-12-18 01:53:23.647476	1	\N	0.00
7	5b9f9888-251b-4c33-bcc6-94aee6fcd7c9	6	3	SURG-GEN	General Surgery	General Surgery	t	2025-12-18 01:53:23.650125	2025-12-18 01:53:23.650125	1	\N	0.00
8	bdcf97ed-f49b-4598-986c-acf146dd99a8	10	12	OPD-GEN	Consultation	General Consultation	t	2025-12-18 01:53:23.653866	2025-12-18 01:53:23.653866	1	\N	0.00
9	7b2ed873-2e87-4474-a694-55825e97b1dd	10	12	XRAY-01	X-Ray	X-Ray Service	t	2025-12-18 01:53:23.656047	2025-12-18 01:53:23.656047	1	\N	0.00
10	0450186f-2a9f-4938-9c8e-e2f12d168ee0	10	12	LAB-BLOOD	Blood Test	Blood Test Service	t	2025-12-18 01:53:23.65891	2025-12-18 01:53:23.65891	1	\N	0.00
11	8c8fa257-b0f6-447e-bec9-782b2e40a937	10	12	SURG-GEN	General Surgery	General Surgery	t	2025-12-18 01:53:23.660133	2025-12-18 01:53:23.660133	1	\N	0.00
12	ca7a908c-c6c8-45eb-8f98-18f3cbf59d3b	16	20	OPD-GEN	Consultation	General Consultation	t	2025-12-18 01:53:23.663245	2025-12-18 01:53:23.663245	1	\N	0.00
13	4ad45df9-36b3-4298-8fab-1ba3381fa4f5	16	20	XRAY-01	X-Ray	X-Ray Service	t	2025-12-18 01:53:23.664911	2025-12-18 01:53:23.664911	1	\N	0.00
14	6e6d8df7-5d1e-44f8-b01b-fc6a8eb4fce4	16	20	LAB-BLOOD	Blood Test	Blood Test Service	t	2025-12-18 01:53:23.666162	2025-12-18 01:53:23.666162	1	\N	0.00
15	1af51352-c385-48d8-a6f9-39ff81464393	16	20	SURG-GEN	General Surgery	General Surgery	t	2025-12-18 01:53:23.667303	2025-12-18 01:53:23.667303	1	\N	0.00
16	ec234b8e-1de4-4e53-9579-c3783ed41acb	36	42	OPD-GEN	Consultation	General Consultation	t	2025-12-18 01:53:23.671544	2025-12-18 01:53:23.671544	1	\N	0.00
17	cf5ba25b-2b28-4430-acee-ed0b6e41e8d8	36	42	XRAY-01	X-Ray	X-Ray Service	t	2025-12-18 01:53:23.673005	2025-12-18 01:53:23.673005	1	\N	0.00
18	56586616-5aca-46cb-84cc-673e9f059c79	36	42	LAB-BLOOD	Blood Test	Blood Test Service	t	2025-12-18 01:53:23.675395	2025-12-18 01:53:23.675395	1	\N	0.00
19	e1b1b235-4b31-4d50-bc6c-3018c5bff371	36	42	SURG-GEN	General Surgery	General Surgery	t	2025-12-18 01:53:23.676489	2025-12-18 01:53:23.676489	1	\N	0.00
\.


--
-- TOC entry 5866 (class 0 OID 27029)
-- Dependencies: 250
-- Data for Name: hospitals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hospitals (hospital_id, hospital_name, hospital_code, headquarters_address, contact_number, email, established_date, total_beds, hospital_type, accreditation, website, is_active, created_at, updated_at, logo, logo_url, enabled_modules) FROM stdin;
10	KV hospital	KV001		+91 9776698765		2025-12-08	0	Private	\N	\N	t	2025-12-08 10:39:46.204638	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
8	Kausalya Hospital	KH0001		+91 9876543234	kh@gmail.com	2024-01-05	100	Private	\N	\N	t	2025-12-05 10:15:34.112889	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
9	Amren	AM001				2025-12-05	0	Private	\N	\N	t	2025-12-05 16:05:09.221919	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
4	apollo	AP001		8282828282	apollo@apollo.com	2025-12-03	10	Private	\N	\N	t	2025-12-04 11:34:02.498301	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
5	City General Hospital	CGH001	123 Main Street	+91-9876543210	citygen@hospital.com	2025-12-04	0	Government	\N	\N	t	2025-12-04 12:21:01.453672	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
12	Shanti Hospital	SH001				2025-12-08	0	Private	\N	\N	t	2025-12-08 12:05:46.171886	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
13	Sun	HS0023				2025-12-08	0	Private	\N	\N	t	2025-12-08 15:48:18.014037	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
14	Ashoka	AS001				2025-12-09	0	Private	\N	\N	t	2025-12-09 11:07:12.463634	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
15	test with bracnh and service	BS001				2025-12-09	0	Trust	\N	\N	t	2025-12-09 15:20:29.172298	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
16	CMC	WL001				2025-12-10	0	Private	\N	\N	t	2025-12-10 11:54:52.590371	2025-12-16 10:46:21.382342	uploads\\logo-1765347892588-941941737.jpg	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
17	Mcc	LG001				2025-12-10	0	Private	\N	\N	t	2025-12-10 12:20:40.771076	2025-12-16 10:46:21.382342	uploads\\logo-1765349440769-959502370.avif	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
6	Sunshine Medical Center	SMC001	456 Park Avenue	+91-9123456789	sunshine@medical.com	2025-12-04	123	Private	\N	\N	t	2025-12-04 12:22:29.912709	2025-12-16 10:46:21.382342	uploads\\logo-1765520115019-24582548.jpg	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
19	Test Hospital	TH1765860539456	\N	\N	\N	\N	\N	Private	\N	\N	t	2025-12-16 10:18:59.457658	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}]
20	Test Hospital	TH1765860626394	\N	\N	\N	\N	\N	Private	\N	\N	t	2025-12-16 10:20:26.394471	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}]
21	Test Hospital	TH1765860671684	\N	\N	\N	\N	\N	Private	\N	\N	t	2025-12-16 10:21:11.684965	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}]
22	Test Hospital	TH1765860703082	\N	\N	\N	\N	\N	Private	\N	\N	t	2025-12-16 10:21:43.082444	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}]
23	Debug Hospital	DBH1765860745412	\N	\N	\N	\N	\N	Private	\N	\N	t	2025-12-16 10:22:25.413246	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}]
24	Test Hospital	TH1765860783827	\N	\N	\N	\N	\N	Private	\N	\N	t	2025-12-16 10:23:03.827374	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}]
25	Debug Hospital	DBH1765860794599	\N	\N	\N	\N	\N	Private	\N	\N	t	2025-12-16 10:23:14.601616	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}]
7	pi	ASDF	Indira nagar	98698698698		2025-12-04	0	Private	\N	\N	f	2025-12-04 14:43:50.165074	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
26	Refined Test Hospital	RTH1765862303811	\N	\N	\N	\N	\N	Private	\N	\N	t	2025-12-16 10:48:23.812037	2025-12-16 10:48:23.812037	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": false}]
27	Refined Test Hospital	RTH1765862330101	\N	\N	\N	\N	\N	Private	\N	\N	t	2025-12-16 10:48:50.101765	2025-12-16 10:48:50.325859	\N	\N	[{"id": "nurse", "is_active": true}]
28	Direct Debug Hosp	DDH	\N	\N	\N	\N	\N	Private	\N	\N	t	2025-12-16 10:49:24.467142	2025-12-16 10:49:24.467142	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": false}]
29	BranchTest Hosp 1765863029829	BTH1765863029829	\N	\N	\N	\N	\N	Private	\N	\N	t	2025-12-16 11:00:29.831252	2025-12-16 11:00:29.831252	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}]
30	BranchTest Hosp 1765863068572	BTH1765863068572	\N	\N	\N	\N	\N	Private	\N	\N	t	2025-12-16 11:01:08.573486	2025-12-16 11:01:08.573486	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}]
31	BranchTest Hosp 1765863091634	BTH1765863091634	\N	\N	\N	\N	\N	Private	\N	\N	t	2025-12-16 11:01:31.636099	2025-12-16 11:01:31.636099	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}]
32	BranchTest Hosp 1765863129532	BTH1765863129532	\N	\N	\N	\N	\N	Private	\N	\N	t	2025-12-16 11:02:09.534216	2025-12-16 11:02:09.534216	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}]
33	BranchTest Hosp 1765863140875	BTH1765863140875	\N	\N	\N	\N	\N	Private	\N	\N	t	2025-12-16 11:02:20.876208	2025-12-16 11:02:20.876208	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}]
34	BranchTest Hosp 1765884410264	BTH1765884410264	\N	\N	\N	\N	\N	Private	\N	\N	t	2025-12-16 16:56:50.265541	2025-12-16 16:56:50.265541	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}]
35	Aradhana	HS0001	Indira nagar	8787676565	aradhana@gmail.com	2025-12-16	155	Private	\N	\N	t	2025-12-16 17:15:36.11764	2025-12-16 17:15:36.11764	\N	uploads\\logo-1765885536112-215535984.png	[{"id": "doc", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
36	ak	AK01	Bangalore	9898767876	ak@gmail.com	2000-01-01	0	Private	\N	\N	t	2025-12-17 10:17:28.451481	2025-12-17 10:17:28.451481	\N	uploads\\logo-1765946848448-380932293.png	[{"id": "doc", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
38	57	658				2025-12-17	0	Private	\N	\N	t	2025-12-17 12:46:43.84368	2025-12-17 12:46:43.84368	\N	\N	[{"id": "doc", "is_active": true}, {"id": "market", "is_active": true}, {"id": "reception", "is_active": true}]
39	camry hospital	CAMRY001	9/10/11, Arakere Bannerghatta Rd, Shantiniketan Layout, Arekere, Bengaluru, Karnataka 560076	9355304574	camryhospitalstest@gmail.com	2025-12-18	50	Private	\N	\N	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832	\N	uploads\\logo-1766024201904-218704772.png	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "market", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "reception", "is_active": true}]
\.


--
-- TOC entry 5868 (class 0 OID 27043)
-- Dependencies: 252
-- Data for Name: insurance_claims; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.insurance_claims (claim_id, s_no, ip_no, patient_name, doctor_name, approval_no, admission_date, discharge_date, department, insurance_name, bill_amount, advance_amount, co_pay, discount, approval_amount, amount_received, pending_amount, tds, bank_name, transaction_date, utr_no, remarks, branch_id, hospital_id, created_at, updated_at, moc_discount, number_field_1, system_notes, is_updated) FROM stdin;
3	1	MRN 001	KUMAR	DR GOPAL	MED1234	2025-01-12	2025-12-30	ORTHO	MEDIASSIT	100000.00	2000.00	3000.00	2000.00	93000.00	92000.00	1000.00	9200.00	AXIX	2025-04-12	1234	RECEVI	21	16	2025-12-10 12:43:32.128595	2025-12-10 12:43:32.128595	0	0	\N	0
5	1	MRN 001	KUMAR	DR GOPAL	MED1234	2025-01-12	2025-12-30	ORTHO	MEDIASSIT	100000.00	2000.00	3000.00	2000.00	93000.00	92000.00	1000.00	9200.00	AXIX	2025-04-12	1234	RECEVI	3	6	2025-12-10 13:18:57.196455	2025-12-10 13:18:57.196455	0	0	\N	0
6	2	MRN002	SATHISH	DR KUMAR	FHPL123	\N	2025-05-12	ENT	FHPL	200000.00	5000.00	2000.00	5000.00	188000.00	0.00	0.00	0.00	\N	\N	\N	\N	3	6	2025-12-10 13:18:57.196455	2025-12-10 13:18:57.196455	0	0	\N	0
7	1	MRN 001	KUMAR	DR GOPAL	MED1234	2025-01-12	2025-12-30	ORTHO	MEDIASSIT	100000.00	2000.00	3000.00	2000.00	93000.00	92000.00	1000.00	9200.00	AXIX	2025-04-12	1234	RECEVI	3	6	2025-12-10 14:43:51.157241	2025-12-10 14:43:51.157241	0	0	\N	0
8	2	MRN002	SATHISH	DR KUMAR	FHPL123	\N	2025-05-12	ENT	FHPL	200000.00	5000.00	2000.00	5000.00	188000.00	0.00	0.00	0.00	\N	\N	\N	\N	3	6	2025-12-10 14:43:51.157241	2025-12-10 14:43:51.157241	0	0	\N	0
9	1	MRN 001	KUMAR	DR GOPAL	MED1234	2025-01-12	2025-12-30	ORTHO	MEDIASSIT	100000.00	2000.00	3000.00	2000.00	93000.00	92000.00	1000.00	9200.00	AXIX	2025-04-12	1234	RECEVI	23	6	2025-12-10 15:09:36.453241	2025-12-10 15:09:36.453241	0	0	\N	0
10	2	MRN002	SATHISH	DR KUMAR	FHPL123	\N	2025-05-12	ENT	FHPL	200000.00	5000.00	2000.00	5000.00	188000.00	0.00	0.00	0.00	\N	\N	\N	\N	23	6	2025-12-10 15:09:36.453241	2025-12-10 15:09:36.453241	0	0	\N	0
11	1	MRN 001	KUMAR	DR GOPAL	MED1234	2025-01-12	2025-12-30	ORTHO	MEDIASSIT	100000.00	2000.00	3000.00	2000.00	93000.00	92000.00	1000.00	9200.00	AXIX	2025-04-12	1234	RECEVI	20	16	2025-12-10 15:48:23.963831	2025-12-10 15:48:23.963831	0	0	\N	0
13	1	MRN 001	KUMAR	DR GOPAL	MED1234	2025-01-12	2025-12-30	ORTHO	MEDIASSIT	100000.00	2000.00	3000.00	2000.00	93000.00	92000.00	1000.00	9200.00	AXIX	2025-04-12	1234	RECEVI	14	12	2025-12-11 10:30:25.310909	2025-12-11 10:30:25.310909	0	0	\N	0
14	2	MRN002	SATHISH	DR KUMAR	FHPL12	2025-01-12	2025-05-12	ENT	FHPL	200000.00	5000.00	2000.00	5000.00	188000.00	0.00	0.00	0.00	\N	\N	\N	\N	14	12	2025-12-11 10:30:25.310909	2025-12-11 11:21:59.935462	0	0	\N	0
12	2	MRN002	SATHISH	DR KUMAR	FHPL123	\N	2025-05-12	ENT	FHPL	200000.00	5000.00	2000.00	5000.00	188000.00	90000.00	5000.00	9000.00	AXIS	2025-12-11	12345		20	16	2025-12-10 15:48:23.963831	2025-12-11 14:40:03.166268	9000	0		0
4	2	MRN002	SATHISH	DR KUMAR	FHPL123	\N	2025-05-12	ENT	FHPL	200000.00	5000.00	2000.00	5000.00	188000.00	90000.00	997.00	0.00		\N			21	16	2025-12-10 12:43:32.128595	2025-12-11 14:44:00.287397	0	0		0
15	1	MRN 003	SURA	DR GOPAL	LIC1234	2025-12-01	2025-12-30	ORTHO	LIC	100000.00	2000.00	3000.00	2000.00	35000.00	25000.00	1000.00	9200.00	AXIX	2025-12-04	1234	RECEVI	21	16	2025-12-11 14:59:30.933125	2025-12-11 14:59:30.933125	0	0	\N	0
16	2	MRN004	VISHNU	DR KUMAR	HDFC5678	\N	2025-12-05	ENT	HDFC	200000.00	5000.00	2000.00	5000.00	39000.00	25000.00	0.00	0.00	\N	\N	\N	\N	21	16	2025-12-11 14:59:30.933125	2025-12-11 14:59:30.933125	0	0	\N	0
17	3	MRN 005	ARUN	DR GOPAL	FHPL123	2025-12-01	2025-12-30	ORTHO	FHPL	100000.00	2000.00	3000.00	2000.00	38000.00	25000.00	1000.00	9200.00	AXIX	2025-12-04	1234	RECEVI	21	16	2025-12-11 14:59:30.933125	2025-12-11 14:59:30.933125	0	0	\N	0
18	4	MRN006	JOHN	DR KUMAR	MED1234	\N	2025-12-05	ENT	MED	200000.00	5000.00	2000.00	5000.00	39500.00	25000.00	0.00	0.00	\N	\N	\N	\N	21	16	2025-12-11 14:59:30.933125	2025-12-11 14:59:30.933125	0	0	\N	0
1	1	MRN 001	KUMAR	DR GOPAL	MED12345	2025-01-12	2025-12-30	ORTHO	MEDIASSIT	100000.00	2000.00	3000.00	2000.00	93000.00	50000.00	10000.00	5000.00	AXIX	2025-04-10	1234	RECEVI	21	16	2025-12-10 12:42:54.415439	2025-12-12 11:22:29.005458	5000	0		1
2	2	MRN002	SATHISH	DR KUMAR	FHPL123456	2025-01-12	2025-05-12	ENT	FHPL	200000.00	5000.00	2000.00	5000.00	188000.00	150400.00	0.00	18800.00	AXIS	2025-12-12	1234		21	16	2025-12-10 12:42:54.415439	2025-12-12 11:37:50.674761	18800	0		1
\.


--
-- TOC entry 5870 (class 0 OID 27055)
-- Dependencies: 254
-- Data for Name: mlc_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mlc_entries (mlc_id, mlc_number, opd_id, patient_id, doctor_id, branch_id, police_station, police_station_district, brought_by, history_alleged, injury_description, nature_of_injury, opinion, created_at, updated_at, incident_date_time, alleged_cause, danger_to_life, age_of_injuries, treatment_given, remarks, examination_findings) FROM stdin;
1	MLC-2025-0001	41	30	19	3	jd c	gvkv	jv,ertgedr	jgvj 	loufouo	Dangerous to Life	\N	2025-12-12 11:17:50.956007	2025-12-12 12:21:58.472199	\N	\N	\N	\N	\N	\N	\N
2	MLC-2025-0002	47	35	5	5	asf	af	3453	af	asf	Simple	\N	2025-12-16 17:50:09.654731	2025-12-16 17:50:09.654731	\N	\N	\N	\N	\N	\N	\N
\.


--
-- TOC entry 5872 (class 0 OID 27065)
-- Dependencies: 256
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.modules (module_id, module_code, module_name, field1, field2, status, created_by, updated_by, created_at, updated_at, uuid) FROM stdin;
1	doc	Doctors	\N	\N	Active	system	\N	2025-12-18 01:27:57.57028	2025-12-18 01:27:57.57028	bae566df-8337-457b-b24c-979c810176d0
2	nurse	Nurses	\N	\N	Active	system	\N	2025-12-18 01:27:57.57028	2025-12-18 01:27:57.57028	a0177f75-ebcc-42c9-a536-02db75dc577e
3	lab	Laboratory	\N	\N	Active	system	\N	2025-12-18 01:27:57.57028	2025-12-18 01:27:57.57028	1b608049-38af-40c3-9c59-d919157c6e21
4	pharma	Pharmacy	\N	\N	Active	system	\N	2025-12-18 01:27:57.57028	2025-12-18 01:27:57.57028	fafe8be4-fe99-4975-8ece-6cbdd95fdbae
5	market	Marketing	\N	\N	Active	system	\N	2025-12-18 01:27:57.57028	2025-12-18 01:27:57.57028	f3c5fb83-fd71-4ac6-8d93-0c8925f9ea16
6	acc	Accounts	\N	\N	Active	system	\N	2025-12-18 01:27:57.57028	2025-12-18 01:27:57.57028	d5eea434-0579-4b2c-85d4-a8f69e416ad8
7	reception	Reception	\N	\N	Active	system	\N	2025-12-18 01:27:57.57028	2025-12-18 01:27:57.57028	98ee6b2c-7bdf-43ec-bf8c-1ccbcd88acd6
8	referral_payment	Referral Payment	\N	\N	Active	system	\N	2025-12-18 01:27:57.57028	2025-12-18 01:27:57.57028	e6bc95e8-3b1b-45d7-ac4d-0cd5722b9187
\.


--
-- TOC entry 5874 (class 0 OID 27079)
-- Dependencies: 258
-- Data for Name: nurse_branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nurse_branches (nurse_hospital_id, nurse_id, branch_id, department_id, joining_date, employment_type, "position", is_active, created_at, updated_at) FROM stdin;
1	3	2	\N	\N	Permanent	\N	t	2025-12-04 13:13:34.850725	2025-12-04 13:13:34.850725
2	4	7	\N	\N	Permanent	\N	t	2025-12-05 10:26:11.891738	2025-12-05 10:26:11.891738
3	4	8	\N	\N	Permanent	\N	t	2025-12-05 10:26:11.891738	2025-12-05 10:26:11.891738
4	5	26	\N	\N	Permanent	\N	t	2025-12-16 10:20:26.456619	2025-12-16 10:20:26.456619
5	6	27	\N	\N	Permanent	\N	t	2025-12-16 10:21:11.74714	2025-12-16 10:21:11.74714
6	7	28	\N	\N	Permanent	\N	t	2025-12-16 10:21:43.145716	2025-12-16 10:21:43.145716
7	8	29	\N	\N	Permanent	\N	t	2025-12-16 10:22:25.478664	2025-12-16 10:22:25.478664
8	9	30	\N	\N	Permanent	\N	t	2025-12-16 10:23:03.890126	2025-12-16 10:23:03.890126
9	10	31	\N	\N	Permanent	\N	t	2025-12-16 10:23:14.666021	2025-12-16 10:23:14.666021
10	11	33	\N	\N	Permanent	\N	t	2025-12-16 10:48:50.219235	2025-12-16 10:48:50.219235
11	12	34	\N	\N	Permanent	\N	t	2025-12-16 10:49:24.536022	2025-12-16 10:49:24.536022
12	13	35	\N	\N	Permanent	\N	t	2025-12-16 11:00:29.939779	2025-12-16 11:00:29.939779
13	14	37	\N	\N	Permanent	\N	t	2025-12-16 11:01:31.737896	2025-12-16 11:01:31.737896
14	15	38	\N	\N	Permanent	\N	t	2025-12-16 11:02:09.633091	2025-12-16 11:02:09.633091
15	16	39	\N	\N	Permanent	\N	t	2025-12-16 11:02:20.982509	2025-12-16 11:02:20.982509
16	17	40	\N	\N	Permanent	\N	t	2025-12-16 16:56:50.368317	2025-12-16 16:56:50.368317
\.


--
-- TOC entry 5876 (class 0 OID 27091)
-- Dependencies: 260
-- Data for Name: nurse_shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nurse_shifts (nurse_shift_id, nurse_id, branch_id, shift_id, department_id, shift_date, attendance_status, check_in_time, check_out_time, notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5878 (class 0 OID 27106)
-- Dependencies: 262
-- Data for Name: nurses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nurses (nurse_id, user_id, first_name, last_name, nurse_code, gender, date_of_birth, contact_number, email, qualification, specialization, experience_years, registration_number, registration_council, address, emergency_contact, is_active, profile_photo, created_at, updated_at) FROM stdin;
3	23	afwetf	sg	NUR214911	\N	\N	\N	\N	awdaf	\N	11	12434342354	\N	\N	\N	t	\N	2025-12-04 13:13:34.850725	2025-12-04 13:13:34.850725
4	33	Kamala	Hinton	NUR571946	\N	\N	\N	\N	Nurse	\N	1	N001	\N	\N	\N	t	\N	2025-12-05 10:26:11.891738	2025-12-05 10:26:11.891738
5	94	Test	Nurse	N94	\N	\N	\N	\N	\N	\N	\N	REG94	\N	\N	\N	t	\N	2025-12-16 10:20:26.453611	2025-12-16 10:20:26.453611
6	95	Test	Nurse	N95	\N	\N	\N	\N	\N	\N	\N	REG95	\N	\N	\N	t	\N	2025-12-16 10:21:11.743768	2025-12-16 10:21:11.743768
7	96	Test	Nurse	N96	\N	\N	\N	\N	\N	\N	\N	REG96	\N	\N	\N	t	\N	2025-12-16 10:21:43.142798	2025-12-16 10:21:43.142798
8	97	Debug	Nurse	DN97	\N	\N	\N	\N	\N	\N	\N	REG97	\N	\N	\N	t	\N	2025-12-16 10:22:25.475833	2025-12-16 10:22:25.475833
9	98	Test	Nurse	N98	\N	\N	\N	\N	\N	\N	\N	REG98	\N	\N	\N	t	\N	2025-12-16 10:23:03.886701	2025-12-16 10:23:03.886701
10	99	Debug	Nurse	DN99	\N	\N	\N	\N	\N	\N	\N	REG99	\N	\N	\N	t	\N	2025-12-16 10:23:14.663539	2025-12-16 10:23:14.663539
11	103	Test	Nurse	N103	\N	\N	\N	\N	\N	\N	\N	REG103	\N	\N	\N	t	\N	2025-12-16 10:48:50.21767	2025-12-16 10:48:50.21767
12	105	N	N	NC	\N	\N	\N	\N	\N	\N	\N	REGN	\N	\N	\N	t	\N	2025-12-16 10:49:24.534288	2025-12-16 10:49:24.534288
13	107	Branch	Nurse	BN	\N	\N	\N	\N	\N	\N	\N	BNR	\N	\N	\N	t	\N	2025-12-16 11:00:29.937752	2025-12-16 11:00:29.937752
14	110	Branch	Nurse	BN1765863091634	\N	\N	\N	\N	\N	\N	\N	BNR1765863091634	\N	\N	\N	t	\N	2025-12-16 11:01:31.736013	2025-12-16 11:01:31.736013
15	112	Branch	Nurse	BN1765863129532	\N	\N	\N	\N	\N	\N	\N	BNR1765863129532	\N	\N	\N	t	\N	2025-12-16 11:02:09.631236	2025-12-16 11:02:09.631236
16	114	Branch	Nurse	BN1765863140875	\N	\N	\N	\N	\N	\N	\N	BNR1765863140875	\N	\N	\N	t	\N	2025-12-16 11:02:20.980698	2025-12-16 11:02:20.980698
17	116	Branch	Nurse	BN1765884410264	\N	\N	\N	\N	\N	\N	\N	BNR1765884410264	\N	\N	\N	t	\N	2025-12-16 16:56:50.366053	2025-12-16 16:56:50.366053
\.


--
-- TOC entry 5880 (class 0 OID 27122)
-- Dependencies: 264
-- Data for Name: opd_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.opd_entries (opd_id, opd_number, patient_id, branch_id, department_id, doctor_id, appointment_id, visit_type, visit_date, visit_time, token_number, reason_for_visit, symptoms, vital_signs, chief_complaint, diagnosis, prescription, lab_tests_ordered, follow_up_required, follow_up_date, consultation_fee, payment_status, visit_status, checked_in_time, consultation_start_time, consultation_end_time, checked_in_by, notes, created_at, updated_at, is_mlc, attender_name, attender_contact_number, mlc_remarks, referral_hospital, referral_doctor_name, payment_method) FROM stdin;
1	OPD-20251204-3031	1	5	\N	5	\N	Walk-in	2025-12-04	15:47:00	T-357	\N	head pain	{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	fever	\N	\N	\N	f	\N	123.00	Pending	Registered	2025-12-04 15:50:00.422672	\N	\N	29	\N	2025-12-04 15:50:00.422672	2025-12-04 15:50:00.422672	f	\N	\N	\N	\N	\N	\N
3	OPD-20251204-4748	2	5	\N	5	\N	Walk-in	2025-12-04	17:39:00	T-461	\N	dgv	{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	eqwed	\N	\N	\N	f	\N	213.00	Pending	Registered	2025-12-04 17:39:17.451742	\N	\N	29	\N	2025-12-04 17:39:17.451742	2025-12-04 17:39:17.451742	f	\N	\N	\N	\N	\N	\N
4	OPD-20251205-5934	3	8	\N	6	\N	Walk-in	2025-12-05	12:20:00	T-188	\N		{"spo2": "11", "pulse": "11", "height": "11", "weight": "11", "bp_systolic": "11", "temperature": "11", "bp_diastolic": "11"}	Routine check up	\N	\N	\N	f	\N	100.00	Pending	Completed	2025-12-05 12:21:23.719741	\N	\N	34	\N	2025-12-05 12:21:23.719741	2025-12-05 15:14:40.024004	f	\N	\N	\N	\N	\N	\N
12	OPD-20251208-5465	11	12	\N	9	\N	Walk-in	2025-12-08	14:24:00	T-251	\N		{"spo2": "1", "pulse": "1", "height": "1", "weight": "1", "bp_systolic": "1", "temperature": "1", "bp_diastolic": "1"}	asf	\N	\N	\N	f	\N	123.00	Pending	Completed	2025-12-08 14:25:23.280961	\N	\N	44	\N	2025-12-08 14:25:23.280961	2025-12-08 14:31:06.833202	f	\N	\N	\N	\N	\N	\N
5	OPD-20251205-9350	4	10	\N	8	\N	Walk-in	2025-12-05	17:37:00	T-367	\N		{"spo2": "2", "pulse": "2", "height": "2", "weight": "2", "bp_systolic": "1", "temperature": "2", "bp_diastolic": "2"}	Breathing trouble	\N	\N	\N	f	\N	100.00	Paid	Completed	2025-12-05 17:38:33.22566	\N	\N	41	\N	2025-12-05 17:38:33.22566	2025-12-05 17:51:36.363787	f	\N	\N	\N	\N	\N	\N
7	OPD-20251208-4607	6	12	\N	9	\N	Walk-in	2025-12-08	11:00:00	T-481	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	rfda	\N	\N	\N	f	\N	134.00	Pending	Completed	2025-12-08 11:01:05.281712	\N	\N	44	\N	2025-12-08 11:01:05.281712	2025-12-08 14:39:55.467013	f	\N	\N	\N	\N	\N	\N
6	OPD-20251208-9878	5	12	\N	9	\N	Walk-in	2025-12-08	10:47:00	T-910	\N		{"spo2": "1", "pulse": "1", "height": "1", "weight": "1", "bp_systolic": "1", "temperature": "1", "bp_diastolic": "1"}	Routinue checkup	\N	\N	\N	f	\N	100.00	Paid	Completed	2025-12-08 10:49:29.573392	\N	\N	44	\N	2025-12-08 10:49:29.573392	2025-12-08 10:54:55.602652	f	\N	\N	\N	\N	\N	\N
8	OPD-20251208-8165	7	12	\N	9	\N	Appointment	2025-12-08	11:09:00	T-273	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	1sdgf	\N	\N	\N	f	\N	134.00	Pending	Completed	2025-12-08 11:09:31.248603	\N	\N	44	\N	2025-12-08 11:09:31.248603	2025-12-08 14:41:42.084261	f	\N	\N	\N	\N	\N	\N
10	OPD-20251208-3749	9	14	\N	10	\N	Appointment	2025-12-08	12:13:00	T-241	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	fever	\N	\N	\N	f	\N	100.00	Paid	Completed	2025-12-08 12:14:28.17512	\N	\N	50	\N	2025-12-08 12:14:28.17512	2025-12-08 12:28:29.071843	f	\N	\N	\N	\N	\N	\N
9	OPD-20251208-1018	8	12	\N	9	\N	Appointment	2025-12-08	11:48:00	T-984	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	dfgdf	\N	\N	\N	f	\N	100.00	Pending	Completed	2025-12-08 11:48:38.114049	\N	\N	44	\N	2025-12-08 11:48:38.114049	2025-12-08 14:53:35.614236	f	\N	\N	\N	\N	\N	\N
11	OPD-20251208-5352	10	14	\N	10	\N	Walk-in	2025-12-08	13:03:00	T-689	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	ert\ngfsg\nfg\n	\N	\N	\N	f	\N	100.00	Pending	Completed	2025-12-08 13:04:01.119751	\N	\N	50	\N	2025-12-08 13:04:01.119751	2025-12-08 13:05:07.709792	f	\N	\N	\N	\N	\N	\N
13	OPD-20251208-8896	12	12	\N	9	\N	Walk-in	2025-12-08	15:03:00	T-695	\N		{"spo2": "1", "pulse": "1", "height": "1", "weight": "1", "bp_systolic": "1", "temperature": "1", "bp_diastolic": "1"}	asdff	\N	\N	\N	f	\N	111.00	Pending	Registered	2025-12-08 15:03:46.476729	\N	\N	44	\N	2025-12-08 15:03:46.476729	2025-12-08 15:03:46.476729	f	\N	\N	\N	\N	\N	\N
14	OPD-20251208-2623	13	12	\N	9	\N	Appointment	2025-12-08	15:04:00	T-647	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	qdas	\N	\N	\N	f	\N	1223.00	Pending	Registered	2025-12-08 15:05:07.383596	\N	\N	44	\N	2025-12-08 15:05:07.383596	2025-12-08 15:05:07.383596	f	\N	\N	\N	\N	\N	\N
15	OPD-20251208-1317	14	12	\N	9	\N	Appointment	2025-12-08	15:17:00	T-748	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	sdgfg	\N	\N	\N	f	\N	1234.00	Pending	Registered	2025-12-08 15:18:02.446479	\N	\N	44	\N	2025-12-08 15:18:02.446479	2025-12-08 15:18:02.446479	f	\N	\N	\N	\N	\N	\N
16	OPD-20251208-8771	14	12	\N	9	\N	Appointment	2025-12-08	15:18:00	T-633	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	wqe	\N	\N	\N	f	\N	\N	Pending	Registered	2025-12-08 15:18:48.970365	\N	\N	44	\N	2025-12-08 15:18:48.970365	2025-12-08 15:18:48.970365	f	\N	\N	\N	\N	\N	\N
17	OPD-20251208-4877	14	12	\N	9	\N	Appointment	2025-12-08	15:18:00	T-905	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	wqe	\N	\N	\N	f	\N	\N	Pending	Registered	2025-12-08 15:24:34.510247	\N	\N	44	\N	2025-12-08 15:24:34.510247	2025-12-08 15:24:34.510247	f	\N	\N	\N	\N	\N	\N
18	OPD-20251208-7076	14	12	\N	9	\N	Appointment	2025-12-08	15:25:00	T-761	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	qsa	\N	\N	\N	f	\N	222.00	Pending	Registered	2025-12-08 15:25:16.630313	\N	\N	44	\N	2025-12-08 15:25:16.630313	2025-12-08 15:25:16.630313	f	\N	\N	\N	\N	\N	\N
19	OPD-20251208-2568	14	12	\N	9	\N	Appointment	2025-12-08	15:27:00	T-845	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	ds	\N	\N	\N	f	\N	12.00	Pending	Registered	2025-12-08 15:28:01.838169	\N	\N	44	\N	2025-12-08 15:28:01.838169	2025-12-08 15:28:01.838169	f	\N	\N	\N	\N	\N	\N
20	OPD-20251208-2572	14	12	\N	9	\N	Appointment	2025-12-08	15:27:00	T-150	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	ds	\N	\N	\N	f	\N	12.00	Pending	Registered	2025-12-08 15:28:05.672503	\N	\N	44	\N	2025-12-08 15:28:05.672503	2025-12-08 15:28:05.672503	f	\N	\N	\N	\N	\N	\N
21	OPD-20251208-9683	14	12	\N	9	\N	Appointment	2025-12-08	15:27:00	T-724	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	ds	\N	\N	\N	f	\N	12.00	Pending	Registered	2025-12-08 15:28:17.606596	\N	\N	44	\N	2025-12-08 15:28:17.606596	2025-12-08 15:28:17.606596	f	\N	\N	\N	\N	\N	\N
22	OPD-20251208-2998	14	12	\N	9	\N	Appointment	2025-12-08	15:27:00	T-768	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	ds	\N	\N	\N	f	\N	12.00	Pending	Registered	2025-12-08 15:29:18.488799	\N	\N	44	\N	2025-12-08 15:29:18.488799	2025-12-08 15:29:18.488799	f	\N	\N	\N	\N	\N	\N
23	OPD-20251208-9760	15	12	\N	9	\N	Appointment	2025-12-08	15:29:00	T-125	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	eggg	\N	\N	\N	f	\N	234.00	Pending	Registered	2025-12-08 15:30:00.768879	\N	\N	44	\N	2025-12-08 15:30:00.768879	2025-12-08 15:30:00.768879	f	\N	\N	\N	\N	\N	\N
24	OPD-20251208-6606	15	12	\N	9	\N	Appointment	2025-12-08	15:29:00	T-151	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	eggg	\N	\N	\N	f	\N	234.00	Pending	Registered	2025-12-08 15:31:46.40173	\N	\N	44	\N	2025-12-08 15:31:46.40173	2025-12-08 15:31:46.40173	f	\N	\N	\N	\N	\N	\N
26	OPD-20251208-3625	15	12	\N	9	\N	Appointment	2025-12-08	15:32:00	T-202	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	seas	\N	\N	\N	f	\N	155.00	Pending	Registered	2025-12-08 15:33:06.274493	\N	\N	44	\N	2025-12-08 15:33:06.274493	2025-12-08 15:33:06.274493	f	\N	\N	\N	\N	\N	\N
25	OPD-20251208-2451	15	12	\N	9	\N	Appointment	2025-12-08	15:32:00	T-893	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	seas	\N	\N	\N	f	\N	155.00	Pending	Completed	2025-12-08 15:32:23.575447	\N	\N	44	\N	2025-12-08 15:32:23.575447	2025-12-08 15:45:34.975316	f	\N	\N	\N	\N	\N	\N
27	OPD-20251208-4204	16	15	\N	11	\N	Appointment	2025-12-08	15:53:00	T-162	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "1", "temperature": "", "bp_diastolic": ""}	dfadfasssd	\N	\N	\N	f	\N	\N	Pending	Completed	2025-12-08 15:53:39.424273	\N	\N	54	\N	2025-12-08 15:53:39.424273	2025-12-08 15:55:17.542003	f	\N	\N	\N	\N	\N	\N
36	OPD-20251209-4385	25	17	\N	13	\N	Walk-in	2025-12-09	12:01:00	T-294	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	asdf	\N	\N	\N	f	\N	123.00	Pending	Completed	2025-12-09 12:01:55.986069	\N	\N	62	\N	2025-12-09 12:01:55.986069	2025-12-09 12:03:22.670367	f		\N	\N	\N	\N	\N
29	OPD-20251208-8267	17	15	\N	11	\N	Appointment	2025-12-08	15:58:00	T-576	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	df	\N	\N	\N	f	\N	222.00	Pending	Completed	2025-12-08 15:59:16.860653	\N	\N	54	\N	2025-12-08 15:59:16.860653	2025-12-08 16:00:03.120649	f	\N	\N	\N	\N	\N	\N
35	OPD-20251209-2509	26	17	\N	13	\N	Emergency	2025-12-09	11:30:00	T-948	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	accident	\N	\N	\N	f	\N	100.00	Pending	Completed	2025-12-09 11:32:35.371244	\N	\N	62	\N	2025-12-09 11:32:35.371244	2025-12-09 12:46:10.778647	t	Attendee1	5456545455	\N	\N	\N	\N
30	OPD-20251208-5485	18	15	\N	11	\N	Appointment	2025-12-08	16:08:00	T-788	\N		{"spo2": "2", "pulse": "", "height": "2", "weight": "", "bp_systolic": "1", "temperature": "", "bp_diastolic": "2"}	sdf	\N	\N	\N	f	\N	100.00	Pending	Completed	2025-12-08 16:08:45.131532	\N	\N	54	\N	2025-12-08 16:08:45.131532	2025-12-08 16:09:01.758203	f	\N	\N	\N	\N	\N	\N
31	OPD-20251208-4256	19	15	\N	12	\N	Walk-in	2025-12-08	16:43:00	T-339	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	dfg	\N	\N	\N	f	\N	1234.00	Pending	Registered	2025-12-08 16:44:54.375841	\N	\N	54	\N	2025-12-08 16:44:54.375841	2025-12-08 16:44:54.375841	t	kamal	45756765456	\N	\N	\N	\N
32	OPD-20251208-5265	23	15	\N	12	\N	Walk-in	2025-12-08	17:11:00	T-683	\N	wer	{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	ergc	\N	\N	\N	f	\N	333.00	Pending	Registered	2025-12-08 17:14:30.66153	\N	\N	54	\N	2025-12-08 17:14:30.66153	2025-12-08 17:14:30.66153	t	22	7656787654	\N	\N	\N	\N
33	OPD-20251208-5250	24	15	\N	12	\N	Appointment	2025-12-08	17:19:00	T-980	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	dswd	\N	\N	\N	f	\N	1788.00	Pending	Registered	2025-12-08 17:19:54.272393	\N	\N	54	\N	2025-12-08 17:19:54.272393	2025-12-08 17:19:54.272393	f	\N	\N	\N	\N	\N	\N
34	OPD-20251209-3278	25	17	\N	13	\N	Appointment	2025-12-09	11:22:00	T-786	\N		{"spo2": "1", "pulse": "1", "height": "1", "weight": "1", "bp_systolic": "1", "temperature": "1", "bp_diastolic": "1"}	tooth pain	\N	\N	\N	f	\N	100.00	Pending	Completed	2025-12-09 11:25:28.062813	\N	\N	62	\N	2025-12-09 11:25:28.062813	2025-12-09 11:28:19.294689	f	\N	\N	\N	\N	\N	\N
37	OPD-20251209-5022	26	17	\N	13	\N	Walk-in	2025-12-09	12:47:00	T-945	\N		{"spo2": "1", "pulse": "1", "height": "23", "weight": "234", "bp_systolic": "123", "temperature": "12", "bp_diastolic": "12"}	wdfwsgfrsgf	\N	\N	\N	f	\N	122.00	Pending	Completed	2025-12-09 12:47:48.385797	\N	\N	62	\N	2025-12-09 12:47:48.385797	2025-12-09 12:53:10.465331	f		\N	\N	\N	\N	\N
38	OPD-20251209-8915	27	17	\N	14	\N	Walk-in	2025-12-09	17:07:00	T-674	\N		{"grbs": "3", "spo2": "4", "pulse": "3", "height": "4", "weight": "4", "bp_systolic": "23", "temperature": "3", "bp_diastolic": "3"}	fsdf	\N	\N	\N	f	\N	100.00	Pending	Registered	2025-12-09 17:11:33.996605	\N	\N	62	\N	2025-12-09 17:11:33.996605	2025-12-09 17:11:33.996605	t	drff	3242532535	\N	\N	\N	\N
39	OPD-20251209-7093	28	17	\N	13	\N	Walk-in	2025-12-09	17:47:00	T-552	\N		{"grbs": "1", "spo2": "1", "pulse": "1", "height": "1", "weight": "1", "bp_systolic": "1", "temperature": "1", "bp_diastolic": "1"}	adfdsfgsdfg sfdg 	\N	\N	\N	f	\N	100.00	Pending	In-consultation	2025-12-09 17:49:08.264657	\N	\N	62	\N	2025-12-09 17:49:08.264657	2025-12-09 17:50:32.049836	t	Kandi	89789679786	\N	\N	\N	\N
40	OPD-20251209-9264	29	5	\N	5	\N	Walk-in	2025-12-09	18:44:00	T-245	\N		{"grbs": "", "spo2": "", "pulse": "7", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": "6"}	dfgdfg	\N	\N	\N	f	\N	1111.00	Pending	In-consultation	2025-12-09 18:44:57.910227	\N	\N	29	\N	2025-12-09 18:44:57.910227	2025-12-09 18:45:10.743622	f		\N	\N	\N	\N	\N
41	OPD-20251212-3328	30	3	\N	19	\N	Walk-in	2025-12-12	11:15:00	T-936	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	mb ,jv	\N	\N	\N	f	\N	1234.00	Pending	In-consultation	2025-12-12 11:15:34.678607	\N	\N	84	\N	2025-12-12 11:15:34.678607	2025-12-12 11:20:32.650931	t	jv,	jgckjg	\N	\N	\N	Cash
45	OPD-20251212-4218	31	3	\N	19	\N	Walk-in	2025-12-12	12:36:00	T-200	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	hvh	\N	\N	\N	f	\N	1234.00	Pending	Completed	2025-12-12 12:43:41.165871	\N	\N	84	\N	2025-12-12 12:43:41.165871	2025-12-12 12:44:07.294197	f		\N	\N	\N	\N	Cash
42	OPD-20251212-1859	31	3	\N	19	\N	Referral	2025-12-12	11:15:00	T-639	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	hkclj	\N	\N	\N	f	\N	1234.00	Pending	Completed	2025-12-12 11:16:15.347951	\N	\N	84	\N	2025-12-12 11:16:15.347951	2025-12-12 12:28:16.956338	f		\N	\N	sdfvds	vm	Cash
43	OPD-20251212-3267	32	3	\N	19	\N	Walk-in	2025-12-12	12:30:00	T-454	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	kjcjv 	\N	\N	\N	f	\N	1234.00	Pending	Completed	2025-12-12 12:31:16.881496	\N	\N	84	\N	2025-12-12 12:31:16.881496	2025-12-12 12:31:57.249239	f		\N	\N	\N	\N	Cash
44	OPD-20251212-8521	33	3	\N	19	\N	Walk-in	2025-12-12	12:34:00	T-539	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	acccc	\N	\N	\N	f	\N	1234.00	Pending	In-consultation	2025-12-12 12:34:50.011992	\N	\N	84	\N	2025-12-12 12:34:50.011992	2025-12-12 12:34:58.120314	f		\N	\N	\N	\N	Cash
46	OPD-20251212-7311	34	3	\N	19	\N	Walk-in	2025-12-12	14:50:00	T-197	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	fever	\N	\N	\N	f	\N	1234.00	Pending	In-consultation	2025-12-12 14:52:31.70457	\N	\N	84	\N	2025-12-12 14:52:31.70457	2025-12-12 14:54:04.259529	f		\N	\N	\N	\N	Cash
47	OPD-20251216-7669	35	5	\N	5	\N	Walk-in	2025-12-16	17:41:00	T-399	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	345345	\N	\N	\N	f	\N	1111.00	Pending	In-consultation	2025-12-16 17:41:48.500409	\N	\N	29	\N	2025-12-16 17:41:48.500409	2025-12-16 17:43:59.383462	t	3453	345345	\N	\N	\N	Cash
48	OPD-20251216-3700	36	5	\N	5	\N	Walk-in	2025-12-16	18:03:00	T-558	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	accident	\N	\N	\N	f	\N	1111.00	Paid	In-consultation	2025-12-16 18:04:23.986233	\N	\N	29	\N	2025-12-16 18:04:23.986233	2025-12-16 18:06:42.522316	t	kanipriya	8787656787	\N	\N	\N	Cash
49	OPD-20251217-6272	37	5	\N	5	\N	Walk-in	2025-12-16	11:07:00	T-856	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	346346	\N	\N	\N	f	\N	1111.00	Paid	Registered	2025-12-17 11:08:10.786859	\N	\N	29	\N	2025-12-17 11:08:10.786859	2025-12-17 11:17:02.160244	f						Cash
2	OPD-20251204-9207	1	5	\N	5	\N	Walk-in	2025-12-17	16:59:00	T-456	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	fgjrgf	\N	\N	\N	f	\N	1243.00	Paid	In-consultation	2025-12-04 17:02:11.849626	\N	\N	29	\N	2025-12-04 17:02:11.849626	2025-12-17 11:21:15.317998	f						Cash
50	OPD-20251217-4987	38	42	\N	32	\N	Walk-in	2025-12-17	12:06:00	T-441	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	dfgg	\N	\N	\N	f	\N	600.00	Paid	In-consultation	2025-12-17 12:06:30.448481	\N	\N	125	\N	2025-12-17 12:06:30.448481	2025-12-17 12:06:52.827142	t	dfg	34	\N	\N	\N	Cash
\.


--
-- TOC entry 5882 (class 0 OID 27144)
-- Dependencies: 266
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (token_id, user_id, token, expires_at, used, created_at) FROM stdin;
\.


--
-- TOC entry 5884 (class 0 OID 27154)
-- Dependencies: 268
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patients (patient_id, mrn_number, first_name, last_name, patient_code, gender, date_of_birth, age, blood_group, contact_number, email, address, city, state, pincode, emergency_contact_name, emergency_contact_number, emergency_contact_relation, aadhar_number, insurance_provider, insurance_policy_number, medical_history, allergies, current_medications, is_active, registration_date, created_at, updated_at, adhaar_number, is_deceased, date_of_death, time_of_death, declared_dead_by, cause_of_death, death_circumstances, is_death_mlc, death_police_station, post_mortem_required, relatives_name, relatives_notified_at, relatives_number) FROM stdin;
1	MRN-20251204-9881	ef	srg	PAT-304918	Male	\N	121	\N	121212121212	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-04	2025-12-04 15:47:25.302044	2025-12-04 15:47:25.302044	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
2	MRN-20251204-2006	madhu	gj	PAT-651436	Male	\N	12	\N	q235r	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-04	2025-12-04 17:39:17.449029	2025-12-04 17:39:17.449029	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
3	MRN-20251205-7058	Kishore	S	PAT-801077	Male	\N	25	\N	9754876587	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-05	2025-12-05 12:21:23.716333	2025-12-05 12:21:23.716333	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
4	MRN-20251205-5552	Dhanush	S	PAT-279481	Male	\N	25	\N	7865675467	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-05	2025-12-05 17:38:33.223215	2025-12-05 17:38:33.223215	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
5	MRN-20251208-3813	Kanappa	S	PAT-231329	Male	\N	65	\N	2345676543	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 10:49:29.570992	2025-12-08 10:49:29.570992	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
6	MRN-20251208-5777	gg	2	PAT-586263	Male	\N	65	\N	8754678654	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 11:01:05.280731	2025-12-08 11:01:05.280731	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
7	MRN-20251208-2521	dwtr	s	PAT-864388	Male	\N	12	\N	5456765544	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 11:09:31.246537	2025-12-08 11:09:31.246537	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
8	MRN-20251208-7016	dfdfe	s	PAT-776444	Male	\N	33	\N	1235654567	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 11:48:38.112031	2025-12-08 11:48:38.112031	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
9	MRN-20251208-9166	Kumar	S	PAT-484001	Male	\N	44	\N	5678456787	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 12:14:28.172807	2025-12-08 12:14:28.172807	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
10	MRN-20251208-1077	aaa	s	PAT-803131	Male	\N	23	\N	8765678998	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 13:04:01.118688	2025-12-08 13:04:01.118688	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
11	MRN-20251208-8755	subash	S	PAT-361256	Male	\N	33	\N	8988899809	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 14:25:23.279645	2025-12-08 14:25:23.279645	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
12	MRN-20251208-4937	wer	wer	PAT-577182	Male	\N	3	\N	5456677866	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 15:03:46.474428	2025-12-08 15:03:46.474428	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
13	MRN-20251208-3013	akbar	S	PAT-113658	Male	\N	33	\N	sdf	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 15:05:07.382487	2025-12-08 15:05:07.382487	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
14	MRN-20251208-5263	birbal	S	PAT-915703	Male	\N	44	\N	3456787654	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 15:18:02.444362	2025-12-08 15:18:02.444362	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
15	MRN-20251208-6876	taj	t	PAT-492068	Male	\N	12	\N	8888888898	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 15:30:00.767658	2025-12-08 15:30:00.767658	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
16	MRN-20251208-7212	tilak	S	PAT-402066	Male	\N	25	\N	5456787654	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 15:53:39.423286	2025-12-08 15:53:39.423286	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
17	MRN-20251208-2552	raj	e	PAT-425927	Male	\N	16	\N	5456787655	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 15:59:09.143674	2025-12-08 15:59:09.143674	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
18	MRN-20251208-6434	lavender	w	PAT-258179	Female	\N	22	\N	5566778654	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 16:08:45.13068	2025-12-08 16:08:45.13068	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
19	MRN-20251208-2197	dinder	e	PAT-264973	Male	\N	33	\N	5456765456	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 16:44:54.374396	2025-12-08 16:44:54.374396		f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
23	MRN-20251208-6750	hello	hi	PAT-589438	Female	\N	33	O+	3456765678	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 17:14:30.660493	2025-12-08 17:14:30.660493	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
24	MRN-20251208-8734	fff	s	PAT-415601	Male	\N	33	\N	4567876545	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 17:19:54.26983	2025-12-08 17:19:54.26983	234565676567	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
25	MRN-20251209-2238	Patient1	S	PAT-792330	Male	\N	35	A-	4565456787	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-09	2025-12-09 11:25:28.060777	2025-12-09 12:01:55.982594	121212121212	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
26	MRN-20251209-2262	P2	2	PAT-779870	Male	\N	55	A-	5456765444	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-09	2025-12-09 11:32:35.370263	2025-12-09 12:47:48.379883	121212121211	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
27	MRN-20251209-1588	sgf	sdfs	PAT-718981	Male	\N	234	A-		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-09	2025-12-09 17:11:33.994845	2025-12-09 17:11:33.994845	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
28	MRN-20251209-7115	Kathar	S	PAT-597078	Male	\N	44	A-		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-09	2025-12-09 17:49:08.261865	2025-12-09 17:49:08.261865	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
29	MRN-20251209-8256	ggg	gg	PAT-823615	Male	\N	44	A+	4534566346	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-09	2025-12-09 18:44:57.907519	2025-12-09 18:44:57.907519	563463463463	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
30	MRN-20251212-5300	sdc	scsc 	PAT-701740	Male	\N	11	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-12	2025-12-12 11:15:34.675632	2025-12-12 11:15:34.675632	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
32	MRN-20251212-9665	kjb;	ad	PAT-971784	Female	\N	33	A+	55555555555	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-12	2025-12-12 12:31:16.879279	2025-12-12 12:31:16.879279	555555555555	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
33	MRN-20251212-4829	s	s	PAT-348353	Male	\N	1	\N	1111111111	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-12	2025-12-12 12:34:50.011254	2025-12-12 12:34:50.011254	1111111111	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
31	MRN-20251212-5677	h	a	PAT-562063	Male	\N	22	A+	121212121	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-12	2025-12-12 11:16:15.347162	2025-12-12 12:43:41.161895	5151515151515	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
34	MRN-20251212-3151	kumar	a	PAT-727435	Male	\N	22	A+	8383838383	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-12	2025-12-12 14:52:31.703885	2025-12-12 14:52:31.703885	525252525252	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
35	MRN-20251216-7170	drg	dgf	PAT-842999	Female	\N	3	\N	345435345	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-16	2025-12-16 17:41:48.49753	2025-12-16 17:41:48.49753	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
36	MRN-20251216-4928	karnan	kalai	PAT-284754	Male	\N	55	A-	565756565	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-16	2025-12-16 18:04:23.984352	2025-12-16 18:04:23.984352	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
37	MRN-20251217-6827	ere	ewrt	PAT-293408	Male	\N	43	A-	345653465	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-17	2025-12-17 11:08:10.78601	2025-12-17 11:08:10.78601	346436	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
38	MRN-20251217-9446	345	345	PAT-286307	Male	\N	3	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-17	2025-12-17 12:06:30.445753	2025-12-17 12:06:30.445753	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N
\.


--
-- TOC entry 5886 (class 0 OID 27173)
-- Dependencies: 270
-- Data for Name: prescriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prescriptions (prescription_id, doctor_id, patient_id, branch_id, medications, notes, diagnosis, status, created_at, updated_at, labs) FROM stdin;
1	6	3	8	[{"name":"arr","dosage":"1","frequency":"2","duration":""},{"name":"12","dosage":"1","frequency":"1","duration":""}]	notes	heart disease	Active	2025-12-05 15:14:40.024004	2025-12-05 15:14:40.024004	[]
2	8	4	10	[{"name":"asdf","dosage":"1","frequency":"1","duration":""},{"name":"werert","dosage":"21","frequency":"2","duration":""}]	sdf asdf asdfg d	efh fjkh jkldfh jhf od	Active	2025-12-05 17:50:22.864538	2025-12-05 17:50:22.864538	[]
3	9	5	12	[{"name":"dfg","dosage":"1","frequency":"1","duration":""},{"name":"wefsg","dosage":"2","frequency":"2","duration":""}]			Active	2025-12-08 10:53:17.898417	2025-12-08 10:53:17.898417	[]
4	10	9	14	[{"name":"ujkhg tyj","dosage":"4","frequency":"5","duration":""},{"name":"456","dosage":"5","frequency":"5","duration":""},{"name":"lab test","dosage":"fbps","frequency":"1","duration":""}]	4 days high fever\nvomit sensation\nhigh bp - 4 days\npatient already taken ffor dollo 650 - 2 days antibiotic\n	ghgh gh dgfh 	Active	2025-12-08 12:27:17.163359	2025-12-08 12:27:17.163359	[]
5	10	10	14	[{"name":"fsdg","dosage":"1","frequency":"","duration":"","morning":true,"noon":true,"night":true,"food_timing":"Before Food"},{"name":"2refds","dosage":"34","frequency":"","duration":"","morning":true,"noon":true,"night":false,"food_timing":"After Food"}]	rttt\nsdf\nfgs\ndg	ef\nsdgd\ng\nn\nfg\nts\nrtddsf\n	Active	2025-12-08 13:05:07.709792	2025-12-08 13:05:07.709792	[{"lab_name": "sdg", "test_name": "gd"}, {"lab_name": "sg", "test_name": "sdg"}]
6	9	11	12	[{"name":"sdf","dosage":"sdf","frequency":"","duration":"","morning":true,"noon":true,"night":true,"food_timing":"Before Food"},{"name":"sdghhu","dosage":"rtuy","frequency":"","duration":"","morning":true,"noon":true,"night":false,"food_timing":"Before Food"},{"name":"rtuthgf","dosage":"yhtg","frequency":"","duration":"","morning":true,"noon":true,"night":true,"food_timing":"Before Food"}]	ert\n grt\ngfg \nefg\n \nf	werr\nwer\nwer\nwer\nr\nt\n rh\n	Active	2025-12-08 14:31:06.833202	2025-12-08 14:31:06.833202	[{"lab_name": "sdf", "test_name": "dst"}, {"lab_name": "sf", "test_name": "sdt"}]
8	9	6	12	[{"name":"asd","dosage":"asd","frequency":"","duration":"","morning":true,"noon":false,"night":false,"food_timing":"After Food"}]	wdf	df	Active	2025-12-08 14:39:55.467013	2025-12-08 14:39:55.467013	[{"lab_name": "assds", "test_name": "df"}]
10	9	7	12	[{"name":"asd","dosage":"asd","frequency":"","duration":"","morning":true,"noon":false,"night":false,"food_timing":"After Food"}]	das	asd	Active	2025-12-08 14:41:42.084261	2025-12-08 14:41:42.084261	[{"lab_name": "as", "test_name": "asd"}]
11	9	15	12	[{"name":"t5","dosage":"4","frequency":"","duration":"","morning":true,"noon":true,"night":true,"food_timing":"Before Food"}]	qwed	sac\nv\nv\ng\ng\ngffgs\n	Active	2025-12-08 15:45:34.975316	2025-12-08 15:45:34.975316	[{"lab_name": "wqd", "test_name": "qw"}, {"lab_name": "qwd", "test_name": "qwd"}]
12	11	16	15	[{"name":"wqr","dosage":"qw","frequency":"","duration":"","morning":true,"noon":true,"night":true,"food_timing":"After Food"}]	reqd	wqr	Active	2025-12-08 15:55:17.542003	2025-12-08 15:55:17.542003	[{"lab_name": "qwer", "test_name": "qwer"}, {"lab_name": "qwr", "test_name": "qwr"}, {"lab_name": "qwr", "test_name": "qwre"}]
13	13	25	17	[{"name":"m1","dosage":"3","frequency":"","duration":"","morning":true,"noon":false,"night":false,"food_timing":"After Food"},{"name":"m2","dosage":"1","frequency":"","duration":"","morning":false,"noon":true,"night":false,"food_timing":"Before Food"}]	dental\ntooth ache\npremolar\ncavity	dental xray dfhdfh gdh dgh gh sdgh dgh sdg\nhj fhgj \n	Active	2025-12-09 11:28:19.294689	2025-12-09 11:28:19.294689	[{"lab_name": "test", "test_name": "blood test"}]
14	19	31	3	[{"name":"esgrs","dosage":"sgsf","frequency":"","duration":"","morning":true,"noon":false,"night":false,"food_timing":"After Food"}]	gsd	sfgsfg	Active	2025-12-12 12:44:07.294197	2025-12-12 12:44:07.294197	[]
\.


--
-- TOC entry 5888 (class 0 OID 27184)
-- Dependencies: 272
-- Data for Name: referral_doctor_module; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referral_doctor_module (id, department_id, doctor_name, mobile_number, speciality_type, medical_council_membership_number, council, pan_card_number, aadhar_card_number, bank_name, bank_branch, bank_address, bank_account_number, bank_ifsc_code, photo_upload_path, pan_upload_path, aadhar_upload_path, referral_pay, tenant_id, marketing_spoc, introduced_by, status, created_by, updated_by, created_at, updated_at, geo_latitude, geo_longitude, geo_accuracy, geo_altitude, geo_altitude_accuracy, geo_heading, geo_speed, geo_timestamp, uuid, address, clinic_photo_path, clinic_name, branch_id) FROM stdin;
1	1	ref 	12121212121	tech										\N	\N	\N	0	6	91	91	Pending	test mang	\N	2025-12-14 17:10:08.027267	2025-12-14 17:10:08.027267	12.95597455	77.60265787	108.00	\N	\N	\N	\N	\N	d3903447-7b99-4037-a377-c33a63f984fe		\N		\N
2	1	Dr.Kiruba	0962383456	Cardiology	JAK8638261	Tamil Nadu Medical Council	c84099c969a1ea039201ac1322344707:b9c8c805b6588484781cb78bf620b4e2	eae4446488bec3999684e3e64bc5bde5:fcfd76f388df0ca21866c436baf5fa2a	HDFC Bank	KH Road	Lavelle road, Bengaluru	641836846861	KAB00329	uploads\\marketing\\photo-1765799624682-292042139.jpg	uploads\\marketing\\pan-1765799624731-203379126.pdf	uploads\\marketing\\aadhar-1765799624733-748741002.pdf	0	6	91	91	Pending	test mang	\N	2025-12-15 17:23:44.882114	2025-12-15 17:23:44.882114	12.96844317	77.59662080	97.00	\N	\N	\N	\N	\N	ac809290-603a-4fb0-a5d9-b4171e4f1195	123, XYZ Street, Rajaji Street, Bengaluru	uploads\\marketing\\clinic_photo-1765799624741-46531499.png	Victoria Hospital	3
3	1	Dr. Aishwarya	54643534636	Nuerosurgon	564564	fghgfh	0b4601c3b779973b4d142d4c9eb2f006:b6f203a3b3018b20c9791429c60bde9a	def0d5d24373c747d5fb35c7e00268c7:2f71157d3ebc776e6f6225f9774241d4	4567	45675	Indira nagar	457457	57	uploads\\marketing\\photo-1765887783951-885519294.webp	\N	\N	0	6	91	91	Pending	test mang	\N	2025-12-16 17:53:03.987925	2025-12-16 17:53:03.987925	\N	\N	\N	\N	\N	\N	\N	\N	490430c0-d2c3-40bd-b7ac-d0ebf23871c8	Indira nagar	uploads\\marketing\\clinic_photo-1765887783952-412500222.png	adfa	3
4	1	referal	08248690754								C-129, D-colony, P.K. Kandasamy street,			\N	\N	\N	0	21	118	118	Pending	ecex1	\N	2025-12-17 11:22:25.61303	2025-12-17 11:22:25.61303	\N	\N	\N	\N	\N	\N	\N	\N	2103fa53-cbf6-471d-b55e-a6d0d7f61a3a	C-129, D-colony, P.K. Kandasamy street,\r\nJothinagar	\N		27
5	1	rf1	4535345435	cardiology	565645	dgbfh	b58168e08bea4a86ded42555e961efbf:437beba37113da6ee807b48c1bd00cf2	edcc39c218d20b850d4d7b3e70da6540:95f6f42ad2e4f6029c64a22bb6eb0f2a	fdghfhf	fghfgh	rgh4hrg	354656	3456	\N	\N	\N	0	36	120	120	Pending	ak1	\N	2025-12-17 11:40:13.592311	2025-12-17 11:40:13.592311	\N	\N	\N	\N	\N	\N	\N	\N	6ef00fe0-3f12-4d8a-8fe7-5a50afe0583e	rgdfgd	\N	lavanaya	42
6	1	Jonh	9986758493	Cardiology	12345KMC	KArnataka Medical Council	7f85dc5793f62cab4b55fe29782123a4:3e4d8f139dccca2ced056cae89a91b48	a3035f00d0ce9c4a14130ad7923bd0af:db9ff70cf0a21abbf0012748bb9f527f	hello bank	bangalore	bangalore richmond roal	78373628293846	IFJDNE1248	uploads\\marketing\\photo-1765995534666-731333021.png	uploads\\marketing\\pan-1765995534668-822880747.pdf	uploads\\marketing\\aadhar-1765995534668-825451461.pdf	0	10	132	132	Active	marketExec1	\N	2025-12-17 23:48:54.839242	2025-12-18 00:33:58.757269	12.88110080	77.62083840	17568.15	\N	\N	\N	\N	\N	f6731108-638d-4f95-b14f-9cb574e0c61b	bannergatta road, bangalore, 	uploads\\marketing\\clinic_photo-1765995534668-462741788.png	sagar clinic	12
7	1	harish	7847655389	Pediatric	KMS5436271	KArnataka Medical Council	0e7b211bfdfb0bbca79620ca17ff75d0:0c7cfeeecd8bfdb14c98dd4441eb2b2d	022a791a32dabe0e815cc8dcfd141060:f55424eb85ed40f8b77860de81b3c083	ABC bank	arekere	bangalore richmond road	78373628293845	ABCBAN2345K	uploads\\marketing\\photo-1766025192887-29085720.png	uploads\\marketing\\pan-1766025192887-318607547.pdf	uploads\\marketing\\aadhar-1766025192887-939368326.pdf	0	39	137	137	Active	Markexec	\N	2025-12-18 08:03:12.943813	2025-12-18 08:44:03.486304	12.88110080	77.62083840	17568.15	\N	\N	\N	\N	\N	162512d8-0ca0-4c50-9123-ccf0fe87d7c9	bannerghatta road, arekere	uploads\\marketing\\clinic_photo-1766025192887-899902139.png	lata clinic	46
\.


--
-- TOC entry 5890 (class 0 OID 27198)
-- Dependencies: 274
-- Data for Name: referral_doctor_service_percentage_module; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referral_doctor_service_percentage_module (percentage_id, referral_doctor_id, service_type, referral_pay, cash_percentage, inpatient_percentage, status, created_by, updated_by, created_at, updated_at, uuid) FROM stdin;
3	2	Ambulance service	Y	8.00	11.00	Active	\N	\N	2025-12-15 17:43:26.309739	2025-12-15 17:43:26.309739	285860a8-a1ea-4153-8408-e80e2b941b3a
4	2	Appointment scheduling	Y	5.00	4.00	Active	\N	\N	2025-12-15 17:43:26.309739	2025-12-15 17:43:26.309739	0f6373ba-98f8-4b10-afc6-5fe026ce32df
5	2	TMT / stress test	Y	10.00	90.00	Active	acc1	acc1	2025-12-16 11:08:30.655696	2025-12-16 11:08:38.584716	3a7d97cd-1f8e-40a8-b779-b0860ffc6eb9
6	3	Telemedicine	Y	10.00	10.00	Active	\N	\N	2025-12-16 17:55:51.932365	2025-12-16 17:55:51.932365	d84516f2-4cb2-4ed6-8a74-960175f5e186
7	5	Call center service	Y	10.00	10.00	Active	\N	\N	2025-12-17 16:30:40.87405	2025-12-17 16:30:40.87405	da519617-c649-47e3-863b-e2f55f059dec
8	5	Consultation service	Y	10.00	10.00	Active	\N	\N	2025-12-17 16:30:40.87405	2025-12-17 16:30:40.87405	5aa9836e-aa9a-4ad8-bdd8-f4671ec662d7
9	5	Appointment scheduling	Y	10.00	20.00	Active	acc1ak	acc1ak	2025-12-17 16:30:50.241818	2025-12-17 16:31:00.547788	38e98fd6-0d4a-404d-a252-c187cd031d33
10	4	Billing	Y	99.00	10.00	Active	acc1ak	acc1ak	2025-12-17 16:35:58.938995	2025-12-17 16:36:10.940597	dcf246c6-f6dd-4d20-8842-8c450b4fd15a
1	1	Security	Y	25.00	20.00	Active	\N	kvAccountant	2025-12-15 10:26:31.559851	2025-12-18 00:20:33.922674	050dc55f-f1f5-4e86-9153-ed8f1d3ab63a
2	1	Appointment scheduling	Y	25.00	20.00	Active	acc1	kvAccountant	2025-12-15 10:39:25.567599	2025-12-18 00:20:33.947996	fd7510e4-84b4-49f6-835b-803928521c87
11	1	Biopsy	Y	40.00	35.00	Active	kvAccountant	kvAccountant	2025-12-18 00:19:51.464549	2025-12-18 00:20:33.966242	81c7c095-183a-4d3a-ac4b-81f8fbdf15a6
12	6	Biomedical waste management	Y	10.00	0.00	Active	kvAccountant	kvAccountant	2025-12-18 00:20:57.033315	2025-12-18 00:22:00.548975	e8e964e2-c8dd-45bf-bb41-d9ba05d1fb0f
13	6	Critical care	Y	30.00	24.00	Active	kvAccountant	kvAccountant	2025-12-18 00:21:51.841394	2025-12-18 00:33:58.754092	a14a1b53-73fc-4d58-a1bd-d0fc5725e1aa
14	6	Consultation service	Y	20.00	20.00	Active	kvAccountant	kvAccountant	2025-12-18 02:01:15.28438	2025-12-18 02:01:24.822941	b3c2059c-64c6-44db-8769-3e9d61a3eda7
15	7	Ambulance service	Y	30.00	25.00	Active	acccountantcamry	acccountantcamry	2025-12-18 08:44:03.473042	2025-12-18 08:45:00.365839	2bdc4658-bc5e-4ada-95a9-7b6317e3b3cd
18	7	Laparoscopic surgery	Y	30.00	25.00	Active	acccountantcamry	acccountantcamry	2025-12-18 08:44:49.807873	2025-12-18 08:45:00.408003	398f2e0e-ddac-42b5-9609-e228a94e67e0
16	7	Major surgeries	Y	40.00	35.00	Active	acccountantcamry	acccountantcamry	2025-12-18 08:44:15.113494	2025-12-18 08:45:00.427394	141cd31e-9ff4-4532-9313-7ace6ef13f55
17	7	X-ray scan	Y	30.00	25.00	Active	acccountantcamry	acccountantcamry	2025-12-18 08:44:29.740802	2025-12-18 08:45:00.442096	8c004820-008d-4410-8cec-992085092098
\.


--
-- TOC entry 5892 (class 0 OID 27212)
-- Dependencies: 276
-- Data for Name: referral_doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referral_doctors (referral_doctor_id, referral_hospital_id, doctor_name, specialization, department, phone_number, email, qualifications, is_active, created_by, created_at, updated_at) FROM stdin;
1	1	geetha	cardio	qere	34535453466			t	26	2025-12-09 18:42:28.3987	2025-12-09 18:42:28.3987
2	1	efes	asdf	sdf				t	26	2025-12-09 18:42:38.073574	2025-12-09 18:42:38.073574
3	2	doc1	dental	adf	3456643463	g@gmail.com	sdfgsg	t	26	2025-12-10 09:42:13.883554	2025-12-10 09:42:13.883554
4	19	amren	dd					t	35	2025-12-10 10:49:07.367042	2025-12-10 10:49:07.367042
5	15	asf	asdf					t	26	2025-12-10 10:49:33.278188	2025-12-10 10:49:33.278188
6	20	doctor spcl	asefasef					t	80	2025-12-12 11:57:04.125231	2025-12-12 11:57:04.125231
7	21	doc1	sgf					t	119	2025-12-17 12:13:44.782345	2025-12-17 12:13:44.782345
\.


--
-- TOC entry 5894 (class 0 OID 27225)
-- Dependencies: 278
-- Data for Name: referral_hospital_mapping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referral_hospital_mapping (mapping_id, branch_id, referral_hospital_id, is_active, created_by, created_at) FROM stdin;
6	5	15	t	26	2025-12-10 10:27:00.931778
7	5	16	t	26	2025-12-10 10:29:03.432736
8	5	17	t	26	2025-12-10 10:29:22.041826
9	5	18	t	26	2025-12-10 10:29:42.219066
10	9	19	t	35	2025-12-10 10:48:55.398861
11	3	20	t	80	2025-12-12 11:56:48.309786
12	42	21	t	119	2025-12-17 12:13:19.491489
13	42	22	t	119	2025-12-17 12:13:30.287505
\.


--
-- TOC entry 5896 (class 0 OID 27234)
-- Dependencies: 280
-- Data for Name: referral_hospitals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referral_hospitals (referral_hospital_id, hospital_name, hospital_address, city, state, phone_number, email, hospital_type, specialties, is_active, created_by, created_at, updated_at) FROM stdin;
1	Kamala	Indira nagar	Banglore	Karnataka	3565645665	a@gmail.com	Private	{}	t	26	2025-12-09 18:39:09.88317	2025-12-09 18:39:09.88317
2	Hopsital1	werf	city	state	234552454543	a@gmail.com	Private	{erer,dfd}	t	26	2025-12-10 09:41:23.110529	2025-12-10 09:41:23.110529
3	hhh	dfgg	dfg	sdfg	345663566	sd@gmail.com	Private	{}	t	26	2025-12-10 09:47:57.480512	2025-12-10 09:47:57.480512
4	rg	asdg	asg				Private	{}	t	26	2025-12-10 09:52:39.569334	2025-12-10 09:52:39.569334
5	Debug Test Hospital		Mumbai	Maharashtra			Private	{}	t	26	2025-12-10 09:56:42.270898	2025-12-10 09:56:42.270898
6	asdfgsdgfs						Private	{}	t	26	2025-12-10 09:59:14.879555	2025-12-10 09:59:14.879555
7	dafadffw						Private	{}	t	26	2025-12-10 10:00:11.417147	2025-12-10 10:00:11.417147
8	weffes						Private	{}	t	26	2025-12-10 10:01:41.043955	2025-12-10 10:01:41.043955
9	sdfgsg	asg	asg				Private	{}	t	26	2025-12-10 10:08:27.870887	2025-12-10 10:08:27.870887
10	Final Test Hospital		Delhi	Delhi			Private	{}	t	26	2025-12-10 10:14:21.020507	2025-12-10 10:14:21.020507
11	sdfgdfgfg						Private	{}	t	26	2025-12-10 10:17:01.15587	2025-12-10 10:17:01.15587
12	3211111						Private	{}	t	26	2025-12-10 10:19:33.140161	2025-12-10 10:19:33.140161
13	3211111						Private	{}	t	26	2025-12-10 10:21:28.439791	2025-12-10 10:21:28.439791
14	asdfg						Private	{}	t	26	2025-12-10 10:21:33.304402	2025-12-10 10:21:33.304402
15	DEBUG TEST		Test	Test			Private	{}	t	26	2025-12-10 10:27:00.925327	2025-12-10 10:27:00.925327
16	3333333333333333						Private	{}	t	26	2025-12-10 10:29:03.428763	2025-12-10 10:29:03.428763
17	eeeeeeeeeeeeeee						Private	{}	t	26	2025-12-10 10:29:22.038778	2025-12-10 10:29:22.038778
18	kani						Private	{}	t	26	2025-12-10 10:29:42.215934	2025-12-10 10:29:42.215934
19	amren						Private	{}	t	35	2025-12-10 10:48:55.394879	2025-12-10 10:48:55.394879
20	app						Private	{}	t	80	2025-12-12 11:56:48.305365	2025-12-12 11:56:48.305365
21	Hospital1						Private	{qwr}	t	119	2025-12-17 12:13:19.487999	2025-12-17 12:13:19.487999
22	h2						Private	{qwr}	t	119	2025-12-17 12:13:30.285646	2025-12-17 12:13:30.285646
\.


--
-- TOC entry 5898 (class 0 OID 27246)
-- Dependencies: 282
-- Data for Name: referral_patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referral_patients (id, referral_patient_id, patient_name, mobile_number, gender, age, place, referral_doctor_id, payment_type, service_required, status, remarks, created_by, marketing_spoc, created_at, updated_at) FROM stdin;
1	RP-1765800435948	test	1234567876	Male	22		2	Cash		Pending		test mang	91	2025-12-15 17:37:16.082657	2025-12-15 17:37:16.082657
2	6381268	Meera	86464239	Female	25	Bengaluru	2	Insurance	Dental X-Ray	Pending	Patient having corporate insurance verified the required docs	test mang	91	2025-12-15 17:40:09.475625	2025-12-15 17:40:09.475625
3	rtyer	rety	456456747	Female	55		3	Cash	456	Pending	456	test mang	91	2025-12-16 17:53:36.717478	2025-12-16 17:53:36.717478
4	65	fgh	08248690754	\N	\N		4	Cash		Pending		ecex1	118	2025-12-17 11:23:08.015983	2025-12-17 11:23:08.015983
5	patient 13	varma	9986758493	Male	25	bangalore	6	Cash	OT	Pending	testing this data	marketExec1	132	2025-12-18 00:09:26.577143	2025-12-18 00:09:26.577143
\.


--
-- TOC entry 5923 (class 0 OID 28206)
-- Dependencies: 307
-- Data for Name: referral_payment_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referral_payment_details (id, uuid, payment_header_id, service_name, service_cost, referral_percentage, referral_amount, remarks, status, created_by, updated_by, created_at, updated_at) FROM stdin;
1	b516a39b-03f8-48ce-b376-9cbe7984b9d4	1	Consultation	500.00	0.00	0.00	\N	Active	1	1	2025-12-18 01:58:15.139974	2025-12-18 01:58:15.139974
2	ee02b1f0-7cad-40a9-8c6f-ba8d1f3fda7d	2	Blood Test	1000.00	0.00	0.00	\N	Active	kvAccountant	kvAccountant	2025-12-18 01:58:48.763218	2025-12-18 01:58:48.763218
3	c5fae33a-f65f-42af-85df-6afa58517102	2	Consultation	1000.00	0.00	0.00	\N	Active	kvAccountant	kvAccountant	2025-12-18 01:58:48.763218	2025-12-18 01:58:48.763218
4	79ba8279-ee76-4137-8e3b-18d71e3ba973	2	General Surgery	1000.00	0.00	0.00	\N	Active	kvAccountant	kvAccountant	2025-12-18 01:58:48.763218	2025-12-18 01:58:48.763218
5	f1d91147-327f-44a2-a90d-1f7df1f589b8	2	X-Ray	1000.00	0.00	0.00	\N	Active	kvAccountant	kvAccountant	2025-12-18 01:58:48.763218	2025-12-18 01:58:48.763218
6	8a5c6fa8-cc82-48f5-8b3f-854d0092aeaf	3	Blood Test	5000.00	0.00	0.00	\N	Active	kvAccountant	kvAccountant	2025-12-18 02:02:22.814691	2025-12-18 02:02:22.814691
7	86f023bb-f449-4b02-88bf-c65220baa012	3	Consultation	2500.00	0.00	0.00	\N	Active	kvAccountant	kvAccountant	2025-12-18 02:02:22.814691	2025-12-18 02:02:22.814691
8	738326aa-8fea-43d6-8202-1d3be8a01da1	3	General Surgery	1000.00	0.00	0.00	\N	Active	kvAccountant	kvAccountant	2025-12-18 02:02:22.814691	2025-12-18 02:02:22.814691
9	5bbd5a1c-1cc0-488b-908b-991bbd55f13f	3	X-Ray	1000.00	0.00	0.00	\N	Active	kvAccountant	kvAccountant	2025-12-18 02:02:22.814691	2025-12-18 02:02:22.814691
10	ae8c223a-84a7-42fb-99c6-33d08c284434	4	Ambulance service	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 08:50:19.210285	2025-12-18 08:50:19.210285
11	391cc169-e21c-4b00-8922-4fb9d90fd24e	4	ICU care	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 08:50:19.210285	2025-12-18 08:50:19.210285
12	eda30249-56ee-4fa6-b034-4b5c2c80ec30	4	Inpatient services	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 08:50:19.210285	2025-12-18 08:50:19.210285
13	c496ae3a-17eb-48a1-a2fa-6681b61bc3b9	4	Laboratory testing	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 08:50:19.210285	2025-12-18 08:50:19.210285
14	d082e594-df67-41f8-b8f8-89d19515875b	4	Laparoscopic surgery	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 08:50:19.210285	2025-12-18 08:50:19.210285
15	87bd7599-1c04-4714-905e-240f1f499235	4	Major surgeries	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 08:50:19.210285	2025-12-18 08:50:19.210285
16	d03a40dc-bf70-43d0-b098-a6c5f5afd59b	4	MRI scan	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 08:50:19.210285	2025-12-18 08:50:19.210285
17	1aebd9b7-cd10-4d31-a61d-a4427c29dbd5	4	SICU care	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 08:50:19.210285	2025-12-18 08:50:19.210285
18	85d8c8ca-23ae-4b42-9d2f-fe8673c0b714	4	TMT / stress test	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 08:50:19.210285	2025-12-18 08:50:19.210285
19	17c52db4-c04b-41bf-aba7-dc737ae301f7	4	Wound dressing	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 08:50:19.210285	2025-12-18 08:50:19.210285
20	cd75f792-dd02-4719-84c3-6581c8fb44ad	4	X-ray scan	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 08:50:19.210285	2025-12-18 08:50:19.210285
21	f7aaa290-9ea1-4c8d-960e-dbbbc6746789	5	Ambulance service	1000.00	30.00	300.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 09:03:09.025968	2025-12-18 09:03:09.025968
22	6892afdc-54d2-4576-bdda-2cfa03a0819b	5	ICU care	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 09:03:09.025968	2025-12-18 09:03:09.025968
23	4e8c2c00-4989-4191-a922-af0cceb0b171	5	Inpatient services	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 09:03:09.025968	2025-12-18 09:03:09.025968
24	9834920e-d550-44bc-85f4-62d7049a98ee	5	Laboratory testing	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 09:03:09.025968	2025-12-18 09:03:09.025968
25	df7a0d23-0c97-4dae-a0f2-6dfedc996508	5	Laparoscopic surgery	1000.00	30.00	300.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 09:03:09.025968	2025-12-18 09:03:09.025968
26	b14bf31f-afa7-4d2f-8c33-5973c47410d5	5	Major surgeries	1000.00	40.00	400.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 09:03:09.025968	2025-12-18 09:03:09.025968
27	f82c8547-f112-415e-bd90-4916a4ba08f9	5	MRI scan	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 09:03:09.025968	2025-12-18 09:03:09.025968
28	65d8d1f8-022b-4fac-a0ad-6892f430d6ed	5	SICU care	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 09:03:09.025968	2025-12-18 09:03:09.025968
29	00ba2adf-b47a-48cc-8725-bc27e62e96ce	5	TMT / stress test	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 09:03:09.025968	2025-12-18 09:03:09.025968
30	e8eb3608-6ecd-4520-912c-7651075f449c	5	Wound dressing	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 09:03:09.025968	2025-12-18 09:03:09.025968
31	779331c5-7fa6-40b6-bf66-be2b1dbe48f5	5	X-ray scan	1000.00	30.00	300.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 09:03:09.025968	2025-12-18 09:03:09.025968
32	68b23079-185d-48af-b32f-d919beb5390d	6	Ambulance service	5000.00	30.00	1500.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 10:55:42.855291	2025-12-18 10:55:42.855291
33	76b2f909-e87c-422f-8770-dffc970633b8	6	ICU care	2000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 10:55:42.855291	2025-12-18 10:55:42.855291
34	b26052c8-3bae-4bab-b41f-b15304a31c86	6	Inpatient services	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 10:55:42.855291	2025-12-18 10:55:42.855291
35	9075ccc4-c52f-43a0-8aa7-82a1a11d63a8	6	Laboratory testing	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 10:55:42.855291	2025-12-18 10:55:42.855291
36	3c40e42d-237f-48cc-9025-a39bc405ef5d	6	Laparoscopic surgery	40000.00	30.00	12000.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 10:55:42.855291	2025-12-18 10:55:42.855291
37	9f8a71d8-6b4f-4232-bc47-5f55e167e651	6	MRI scan	10000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 10:55:42.855291	2025-12-18 10:55:42.855291
38	cb530fde-81e7-44c4-9ae3-4e51175b06e5	6	SICU care	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 10:55:42.855291	2025-12-18 10:55:42.855291
39	df087349-d800-4b47-b8b9-c8918fa0ef5f	7	Ambulance service	1000.00	30.00	300.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 10:55:42.855291	2025-12-18 10:55:42.855291
40	5eec86c2-9a8d-44c2-8c83-92d885793045	7	ICU care	2000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 10:55:42.855291	2025-12-18 10:55:42.855291
41	8d7877a3-c341-461b-9091-3f704ecbd6a9	7	Inpatient services	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 10:55:42.855291	2025-12-18 10:55:42.855291
42	8b10a23f-905e-4932-850e-eb2dc890aef1	7	Laboratory testing	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 10:55:42.855291	2025-12-18 10:55:42.855291
43	3eee76a5-d72f-4fdb-ace2-3bba450064a1	7	Laparoscopic surgery	40000.00	30.00	12000.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 10:55:42.855291	2025-12-18 10:55:42.855291
44	1251a236-d296-4d86-947e-452b01be4970	7	MRI scan	10000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 10:55:42.855291	2025-12-18 10:55:42.855291
45	7554534d-4b4e-48c7-a413-eec0eeaa3239	7	SICU care	1000.00	0.00	0.00	\N	Active	acccountantcamry	acccountantcamry	2025-12-18 10:55:42.855291	2025-12-18 10:55:42.855291
\.


--
-- TOC entry 5921 (class 0 OID 28183)
-- Dependencies: 305
-- Data for Name: referral_payment_header; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referral_payment_header (id, uuid, batch_id, patient_name, admission_type, department, doctor_name, medical_council_id, payment_mode, total_referral_amount, status, created_by, updated_by, created_at, updated_at) FROM stdin;
1	15a495dd-6603-40bc-bcd4-cbd0e892e351	1	Test Patient	OPD	General	Dr. Test	MCI-TEST	Cash	0.00	Active	1	1	2025-12-18 01:58:15.127881	2025-12-18 01:58:15.127881
2	a204263f-f064-4ee1-bf4c-7623638c96b3	2	John Doe	IPD	Cardiology	John	12345KMC	Cash	0.00	Active	kvAccountant	kvAccountant	2025-12-18 01:58:48.763218	2025-12-18 01:58:48.763218
3	b5fa5c07-43ec-4e76-88cf-960e4cb45f99	3	williams	IPD	Cardiology	John	12345KMC	Cash	0.00	Active	kvAccountant	kvAccountant	2025-12-18 02:02:22.814691	2025-12-18 02:02:22.814691
4	38533f04-2787-45cf-98ca-0c81dd364842	4	nori	IPD	Pediatric	Harish	KMS5436271	Cash	0.00	Active	acccountantcamry	acccountantcamry	2025-12-18 08:50:19.210285	2025-12-18 08:50:19.210285
5	fd46a97f-b9ec-4344-ac55-615b7a11c0fc	5	MARY	IPD	Pediatric	Harish	KMS5436271	Cash	1300.00	Active	acccountantcamry	acccountantcamry	2025-12-18 09:03:09.025968	2025-12-18 09:03:09.025968
6	49b7b082-5368-4a44-b8cb-fb7d34565396	6	Kumar	IPD	Pediatrics	Harish	KMS5436271	Cash	13500.00	Active	acccountantcamry	acccountantcamry	2025-12-18 10:55:42.855291	2025-12-18 10:55:42.855291
7	35cb1e40-066c-40c3-9846-91d6798c0b5c	6	Kumar p	IPD	Pediatrics	Harish	KMS5436271	Cash	12300.00	Active	acccountantcamry	acccountantcamry	2025-12-18 10:55:42.855291	2025-12-18 10:55:42.855291
\.


--
-- TOC entry 5919 (class 0 OID 28162)
-- Dependencies: 303
-- Data for Name: referral_payment_upload_batch; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referral_payment_upload_batch (id, uuid, hospital_id, branch_id, file_name, total_records, total_amount, status, created_by, updated_by, created_at, updated_at) FROM stdin;
1	94e9c8ed-1071-4177-94d7-a29b881bee5a	6	1	debug_test.xlsx	1	0.00	Active	1	1	2025-12-18 01:58:15.104499	2025-12-18 01:58:15.104499
2	d7f5b13d-df17-43bb-82bc-ad87a50a4ee8	10	12	Referral_Payment_Template (3).xlsx	1	0.00	Active	kvAccountant	kvAccountant	2025-12-18 01:58:48.763218	2025-12-18 01:58:48.763218
3	e0810a07-8756-4a0a-aec9-7b6790180640	10	12	Referral_Payment_Template (3).xlsx	1	0.00	Active	kvAccountant	kvAccountant	2025-12-18 02:02:22.814691	2025-12-18 02:02:22.814691
4	802c12b8-f45c-44d4-a183-a1313699db1a	39	46	Referral_Payment_Template (5).xlsx	1	0.00	Active	acccountantcamry	acccountantcamry	2025-12-18 08:50:19.210285	2025-12-18 08:50:19.210285
5	b1e3aedb-662e-4c91-b339-9e800eec8d5f	39	46	Referral_Payment_Template (5).xlsx	1	1300.00	Active	acccountantcamry	acccountantcamry	2025-12-18 09:03:09.025968	2025-12-18 09:03:09.025968
6	8f6391ef-88fc-4066-ac75-8c4174bc5579	39	46	Referral_Payment_Template.xlsx	2	25800.00	Active	acccountantcamry	acccountantcamry	2025-12-18 10:55:42.855291	2025-12-18 10:55:42.855291
\.


--
-- TOC entry 5900 (class 0 OID 27261)
-- Dependencies: 284
-- Data for Name: referral_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referral_payments (payment_id, uuid, referral_doctor_id, hosp_service_id, service_code, service_name, service_amount, referral_percentage, referral_amount, gst_rate, gst_amount, total_payable, payment_status, payment_date, payment_mode, payment_reference, patient_id, billing_id, opd_id, remarks, created_by, updated_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5902 (class 0 OID 27281)
-- Dependencies: 286
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (role_id, role_name, role_code, description, is_active, created_at, updated_at) FROM stdin;
1	Super Admin	SUPER_ADMIN	System Administrator with full access	t	2025-12-04 10:46:10.121592	2025-12-04 10:46:10.121592
2	Client Admin	CLIENT_ADMIN	Hospital Administrator	t	2025-12-04 10:46:10.121592	2025-12-04 10:46:10.121592
3	Doctor	DOCTOR	Medical Doctor	t	2025-12-04 10:46:10.121592	2025-12-04 10:46:10.121592
4	Nurse	NURSE	Nursing Staff	t	2025-12-04 10:46:10.121592	2025-12-04 10:46:10.121592
5	Receptionist	RECEPTIONIST	Front Desk Staff	t	2025-12-04 10:46:10.121592	2025-12-04 10:46:10.121592
6	Pharmacist	PHARMACIST	Pharmacy Staff	t	2025-12-04 10:46:10.121592	2025-12-04 10:46:10.121592
7	Lab Technician	LAB_TECH	Laboratory Staff	t	2025-12-04 10:46:10.121592	2025-12-04 10:46:10.121592
9	Accountant	ACCOUNTANT	Acc	t	2025-12-10 12:34:28.156716	2025-12-10 12:34:28.156716
11	Accountant Manager	ACCOUNTANT_MANAGER	Manager of Accountants	t	2025-12-10 15:33:14.005491	2025-12-10 15:33:14.005491
29	Marketing Executive	MARKETING_EXECUTIVE	Marketing Staff	t	2025-12-14 16:24:13.824306	2025-12-14 16:24:13.824306
39	Marketing Executive	MRKT_EXEC	Marketing Executive Staff	t	2025-12-14 16:51:25.28731	2025-12-14 16:51:25.28731
40	Marketing Manager	MRKT_MNGR	Marketing Manager Staff	t	2025-12-14 16:51:25.28731	2025-12-14 16:51:25.28731
\.


--
-- TOC entry 5904 (class 0 OID 27293)
-- Dependencies: 288
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (service_id, service_code, service_name, description, service_category, default_unit_price, hsn_code, is_taxable, is_active, created_at, updated_at) FROM stdin;
1	SVC-OUTPATIENT593	Outpatient services	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
2	SVC-INPATIENTS499	Inpatient services	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
3	SVC-EMERGENCYC629	Emergency care	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
4	SVC-TRAUMACARE793	Trauma care	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
5	SVC-CRITICALCA514	Critical care	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
6	SVC-DAYCAREPRO911	Day care procedures	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
7	SVC-ADMISSIONS279	Admission service	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
8	SVC-DISCHARGES901	Discharge service	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
9	SVC-BEDMANAGEM362	Bed management	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
10	SVC-PREOPERATI759	Pre-operative care	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
11	SVC-POSTOPERAT78	Post-operative care	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
12	SVC-VACCINATIO355	Vaccination service	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
13	SVC-FOLLOWUPCA804	Follow-up care	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
14	SVC-PAINMANAGE894	Pain management	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
15	SVC-WOUNDDRESS767	Wound dressing	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
16	SVC-LABORATORY479	Laboratory testing	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
17	SVC-SAMPLECOLL925	Sample collection	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
18	SVC-RADIOLOGYI149	Radiology imaging	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
19	SVC-ECG23	ECG	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
20	SVC-EEG28	EEG	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
21	SVC-EMG89	EMG	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
22	SVC-TMTSTRESST749	TMT / stress test	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
23	SVC-ENDOSCOPY575	Endoscopy	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
24	SVC-COLONOSCOP385	Colonoscopy	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
25	SVC-BIOPSY28	Biopsy	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
26	SVC-ULTRASOUND255	Ultrasound scan	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
27	SVC-XRAYSCAN995	X-ray scan	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
28	SVC-CTSCAN722	CT scan	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
29	SVC-MRISCAN687	MRI scan	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
30	SVC-MAMMOGRAPH717	Mammography	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
31	SVC-PETSCAN72	PET scan	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
32	SVC-PHYSIOTHER918	Physiotherapy	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
33	SVC-OCCUPATION292	Occupational therapy	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
34	SVC-SPEECHTHER220	Speech therapy	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
35	SVC-RESPIRATOR417	Respiratory therapy	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
36	SVC-NUTRITIOND284	Nutrition & diet counseling	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
37	SVC-REHABILITA22	Rehabilitation	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
38	SVC-DIALYSIS985	Dialysis	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
39	SVC-CHEMOTHERA578	Chemotherapy	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
40	SVC-RADIOTHERA84	Radiotherapy	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
41	SVC-COUNSELING846	Counseling & psychotherapy	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
42	SVC-OPPHARMACY347	OP pharmacy service	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
43	SVC-IPPHARMACY766	IP pharmacy service	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
44	SVC-MEDICINEDI584	Medicine dispensing	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
45	SVC-DRUGREFILL49	Drug refill service	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
46	SVC-PRESCRIPTI616	Prescription management	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
47	SVC-AMBULANCES339	Ambulance service	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
48	SVC-MEDICALTRA492	Medical transport	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
49	SVC-MOBILECLIN179	Mobile clinic service	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
50	SVC-MINORPROCE577	Minor procedures	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
51	SVC-MAJORSURGE927	Major surgeries	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
52	SVC-LAPAROSCOP727	Laparoscopic surgery	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
53	SVC-ENDOSCOPIC704	Endoscopic surgery	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
54	SVC-DRESSINGSU188	Dressing & suturing	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
55	SVC-ANESTHESIA924	Anesthesia service	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
56	SVC-APPOINTMEN148	Appointment scheduling	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
57	SVC-QUEUEMANAG316	Queue management	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
58	SVC-BILLING929	Billing	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
59	SVC-PACKAGEBIL814	Package billing	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
60	SVC-INSURANCET715	Insurance/TPA processing	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
61	SVC-CORPORATEB488	Corporate billing	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
62	SVC-MEDICALREC266	Medical records (MRD)	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
63	SVC-TELEMEDICI656	Telemedicine	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
64	SVC-CONSULTATI453	Consultation service	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
65	SVC-PATIENTFEE195	Patient feedback	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
66	SVC-HOUSEKEEPI265	Housekeeping	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
67	SVC-LAUNDRY372	Laundry	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
68	SVC-SECURITY286	Security	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
69	SVC-CAFETERIAD190	Cafeteria/diet kitchen	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
70	SVC-BIOMEDICAL173	Biomedical waste management	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
71	SVC-FACILITYMA955	Facility maintenance	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
72	SVC-EQUIPMENTM894	Equipment maintenance	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
73	SVC-PARKINGSER463	Parking service	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
74	SVC-RECEPTIONH693	Reception/helpdesk	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
75	SVC-CALLCENTER642	Call center service	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
76	SVC-ICUCARE878	ICU care	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
77	SVC-NICUCARE765	NICU care	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
78	SVC-PICUCARE430	PICU care	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
79	SVC-SICUCARE185	SICU care	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
80	SVC-BURNSUNITC19	Burns unit care	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
81	SVC-POISONCENT95	Poison center service	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
82	SVC-BLOODBANKS162	Blood bank service	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
83	SVC-ORGANDONAT725	Organ donation support	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
84	SVC-HEALTHCAMP213	Health camps	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
85	SVC-HEALTHSCRE537	Health screenings	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
86	SVC-WELLNESSPR393	Wellness programs	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
87	SVC-PREVENTIVE11	Preventive health checkups	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
88	SVC-PUBLICAWAR724	Public awareness programs	\N	General	0.00	\N	t	t	2025-12-09 14:07:49.180404	2025-12-09 14:07:49.180404
\.


--
-- TOC entry 5906 (class 0 OID 27306)
-- Dependencies: 290
-- Data for Name: shift_branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shift_branches (shift_hospital_id, shift_id, branch_id, is_active, created_at) FROM stdin;
\.


--
-- TOC entry 5908 (class 0 OID 27315)
-- Dependencies: 292
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shifts (shift_id, shift_name, shift_code, start_time, end_time, duration_hours, shift_type, description, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5910 (class 0 OID 27331)
-- Dependencies: 294
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff (staff_id, user_id, first_name, last_name, staff_code, gender, date_of_birth, contact_number, email, address, city, state, pincode, qualification, staff_type, emergency_contact_name, emergency_contact_number, aadhar_number, profile_photo, is_active, created_at, updated_at) FROM stdin;
2	5	Madhu		STF242596	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-04 11:34:02.498301	2025-12-04 11:34:02.498301
3	6	Alice	Johnson	STF061548	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-04 12:21:01.453672	2025-12-04 12:21:01.453672
4	7	Bob	Smith	STF150013	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-04 12:22:29.912709	2025-12-04 12:22:29.912709
5	24	aefwegf	wgr	REC248382	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-04 13:14:08.383023	2025-12-04 13:14:08.383023
6	26	utdtgc		STF630243	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-04 14:43:50.165074	2025-12-04 14:43:50.165074
7	27	wef	awrte	ADM097332	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-04 15:08:17.271567	2025-12-04 15:08:17.271567
8	28	hoho	Madhumitha	ADM625363	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-04 15:17:05.29374	2025-12-04 15:17:05.29374
9	29	test	rescp	REC707769	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-04 15:18:27.770764	2025-12-04 15:18:27.770764
10	31	KH		STF934202	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-05 10:15:34.112889	2025-12-05 10:15:34.112889
12	35	admin		STF909315	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-05 16:05:09.221919	2025-12-05 16:05:09.221919
13	36	admin	2	ADM970614	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-05 16:06:10.560809	2025-12-05 16:06:10.560809
14	38	Harris	Kannan	REC003678	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-05 16:23:23.679772	2025-12-05 16:23:23.679772
11	34	Rita	s	REC672798	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-05 10:27:52.799333	2025-12-05 17:05:33.7887
15	39	c	2	ADM569494	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-05 17:06:09.438569	2025-12-05 17:06:09.438569
16	41	Krithika	Suraj	REC776668	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-05 17:09:36.669349	2025-12-05 17:09:36.669349
17	42	kvadmin		STF586288	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-08 10:39:46.204638	2025-12-08 10:39:46.204638
18	44	Recepkv1	S	REC894143	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-08 10:44:54.144934	2025-12-08 10:44:54.144934
19	45	shanti		STF746254	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-08 12:05:46.171886	2025-12-08 12:05:46.171886
20	50	receptionist	1	REC095018	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-08 12:11:35.018528	2025-12-08 12:11:35.018528
21	51	sun		STF098105	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-08 15:48:18.014037	2025-12-08 15:48:18.014037
22	54	sun12	2	REC244984	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-08 15:50:44.98579	2025-12-08 15:50:44.98579
23	56	rec	2	REC118450	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-08 16:21:58.452147	2025-12-08 16:21:58.452147
24	57	rec1	3	REC383947	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-08 16:26:23.947682	2025-12-08 16:26:23.947682
25	58	ashoka		STF632652	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-09 11:07:12.463634	2025-12-09 11:07:12.463634
26	62	Kalai	A	REC468943	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-09 11:21:08.944029	2025-12-09 11:21:08.944029
27	63	testbs		STF829370	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
28	66	withlogo		STF892692	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-10 11:54:52.590371	2025-12-10 11:54:52.590371
29	71	logo	ca	STF440853	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-10 12:20:40.771076	2025-12-10 12:20:40.771076
30	72	recwl	l	REC527044	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-10 12:22:07.04534	2025-12-10 12:22:07.04534
31	73	acc	1	ACC277040	\N	\N	\N	\N	\N	\N	\N	\N	\N	Accountant	\N	\N	\N	\N	t	2025-12-10 12:34:36.988901	2025-12-10 12:34:36.988901
32	74	accountant 	1	ACC856454	\N	\N	\N	\N	\N	\N	\N	\N	\N	Accountant	\N	\N	\N	\N	t	2025-12-10 13:17:36.40102	2025-12-10 13:17:36.40102
33	75	acc 	mang	AM796685	\N	\N	\N	\N	\N	\N	\N	\N	\N	Accountant Manager	\N	\N	\N	\N	t	2025-12-10 15:46:36.62547	2025-12-10 15:46:36.62547
34	76	acc	managanger	AM566663	\N	\N	\N	\N	\N	\N	\N	\N	\N	Accountant Manager	\N	\N	\N	\N	t	2025-12-11 10:19:26.610135	2025-12-11 10:19:26.610135
35	78	srgf	safr	AM628916	\N	\N	\N	\N	\N	\N	\N	\N	\N	Accountant Manager	\N	\N	\N	\N	t	2025-12-11 10:20:28.864539	2025-12-11 10:20:28.864539
36	79	shanthi	mang	AM189823	\N	\N	\N	\N	\N	\N	\N	\N	\N	Accountant Manager	\N	\N	\N	\N	t	2025-12-11 10:29:49.769561	2025-12-11 10:29:49.769561
37	80	client	admin	ADM507290	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-11 15:35:07.237875	2025-12-11 15:35:07.237875
38	84	recp 	1	REC711710	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-11 15:38:31.710705	2025-12-11 15:38:31.710705
39	88	test 	recp	REC925180	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-12 10:52:05.181455	2025-12-12 10:52:05.181455
40	91	test user	user1	MRK078921	\N	\N	\N	\N	\N	\N	\N	\N	\N	MRKT_EXEC	\N	\N	\N	\N	t	2025-12-14 17:04:38.512123	2025-12-14 17:04:38.512123
41	92	test user	user1	MRK702720	\N	\N	\N	\N	\N	\N	\N	\N	\N	MRKT_MNGR	\N	\N	\N	\N	t	2025-12-14 17:15:02.372289	2025-12-14 17:15:02.372289
42	117	admin1aradhana		STF536308	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-16 17:15:36.11764	2025-12-16 17:15:36.11764
43	118	exec1	1	MRK706131	\N	\N	\N	\N	\N	\N	\N	\N	\N	MRKT_EXEC	\N	\N	\N	\N	t	2025-12-16 18:08:26.077345	2025-12-16 18:08:26.077345
44	119	admin1		STF848533	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-17 10:17:28.451481	2025-12-17 10:17:28.451481
45	120	ak	ak1	MRK724688	\N	\N	\N	\N	\N	\N	\N	\N	\N	MRKT_EXEC	\N	\N	\N	\N	t	2025-12-17 11:38:44.633024	2025-12-17 11:38:44.633024
46	125	recep	1	REC139174	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-17 11:45:39.175207	2025-12-17 11:45:39.175207
47	128	recp45r34	3453	REC951568	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-17 12:15:51.568881	2025-12-17 12:15:51.568881
48	130	admin234		STF803897	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-17 12:46:43.84368	2025-12-17 12:46:43.84368
49	131	acc1	1	ACC452242	\N	\N	\N	\N	\N	\N	\N	\N	\N	Accountant	\N	\N	\N	\N	t	2025-12-17 16:17:32.18423	2025-12-17 16:17:32.18423
50	132	Marketing 	Exec	MRK378746	\N	\N	\N	\N	\N	\N	\N	\N	\N	MRKT_EXEC	\N	\N	\N	\N	t	2025-12-17 23:46:18.617785	2025-12-17 23:46:18.617785
51	133	accountant	kcv	ACC054423	\N	\N	\N	\N	\N	\N	\N	\N	\N	Accountant	\N	\N	\N	\N	t	2025-12-18 00:14:14.327436	2025-12-18 00:14:14.327436
52	134	camry	Admin	STF202370	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
53	136	Receptionist	Infodesk	REC593092	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-18 07:53:13.094167	2025-12-18 07:53:13.094167
54	137	Mark	exec	MRK708015	\N	\N	\N	\N	\N	\N	\N	\N	\N	MRKT_EXEC	\N	\N	\N	\N	t	2025-12-18 07:55:07.661001	2025-12-18 07:55:07.661001
55	138	Mark	Manager	MRK763153	\N	\N	\N	\N	\N	\N	\N	\N	\N	MRKT_MNGR	\N	\N	\N	\N	t	2025-12-18 07:56:02.854324	2025-12-18 07:56:02.854324
56	139	accounts	main	ACC824986	\N	\N	\N	\N	\N	\N	\N	\N	\N	Accountant	\N	\N	\N	\N	t	2025-12-18 07:57:04.642941	2025-12-18 07:57:04.642941
57	140	accounts 	manager	AM867252	\N	\N	\N	\N	\N	\N	\N	\N	\N	Accountant Manager	\N	\N	\N	\N	t	2025-12-18 07:57:46.877587	2025-12-18 07:57:46.877587
\.


--
-- TOC entry 5911 (class 0 OID 27345)
-- Dependencies: 295
-- Data for Name: staff_branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_branches (staff_hospital_id, staff_id, branch_id, department_id, joining_date, employment_type, "position", salary, is_active, created_at, updated_at) FROM stdin;
1	2	1	\N	\N	Permanent	\N	\N	t	2025-12-04 11:34:02.498301	2025-12-04 11:34:02.498301
2	3	2	\N	\N	Permanent	\N	\N	t	2025-12-04 12:21:01.453672	2025-12-04 12:21:01.453672
3	4	3	\N	\N	Permanent	\N	\N	t	2025-12-04 12:22:29.912709	2025-12-04 12:22:29.912709
4	5	2	\N	\N	Permanent	\N	\N	t	2025-12-04 13:14:08.383904	2025-12-04 13:14:08.383904
5	6	5	\N	\N	Permanent	\N	\N	t	2025-12-04 14:43:50.165074	2025-12-04 14:43:50.165074
6	7	3	\N	\N	Permanent	\N	\N	t	2025-12-04 15:08:17.271567	2025-12-04 15:08:17.271567
7	8	5	\N	\N	Permanent	\N	\N	t	2025-12-04 15:17:05.29374	2025-12-04 15:17:05.29374
8	9	5	\N	\N	Permanent	\N	\N	t	2025-12-04 15:18:27.771462	2025-12-04 15:18:27.771462
9	10	7	\N	\N	Permanent	\N	\N	t	2025-12-05 10:15:34.112889	2025-12-05 10:15:34.112889
10	11	8	\N	\N	Permanent	\N	\N	t	2025-12-05 10:27:52.800301	2025-12-05 10:27:52.800301
11	12	9	\N	\N	Permanent	\N	\N	t	2025-12-05 16:05:09.221919	2025-12-05 16:05:09.221919
12	13	9	\N	\N	Permanent	\N	\N	t	2025-12-05 16:06:10.560809	2025-12-05 16:06:10.560809
13	14	11	\N	\N	Permanent	\N	\N	t	2025-12-05 16:23:23.680328	2025-12-05 16:23:23.680328
14	15	7	\N	\N	Permanent	\N	\N	t	2025-12-05 17:06:09.438569	2025-12-05 17:06:09.438569
15	16	10	\N	\N	Permanent	\N	\N	t	2025-12-05 17:09:36.670108	2025-12-05 17:09:36.670108
16	17	12	\N	\N	Permanent	\N	\N	t	2025-12-08 10:39:46.204638	2025-12-08 10:39:46.204638
17	18	12	\N	\N	Permanent	\N	\N	t	2025-12-08 10:44:54.145618	2025-12-08 10:44:54.145618
18	19	14	\N	\N	Permanent	\N	\N	t	2025-12-08 12:05:46.171886	2025-12-08 12:05:46.171886
19	20	14	\N	\N	Permanent	\N	\N	t	2025-12-08 12:11:35.019175	2025-12-08 12:11:35.019175
20	21	15	\N	\N	Permanent	\N	\N	t	2025-12-08 15:48:18.014037	2025-12-08 15:48:18.014037
21	22	15	\N	\N	Permanent	\N	\N	t	2025-12-08 15:50:44.986495	2025-12-08 15:50:44.986495
22	23	16	\N	\N	Permanent	\N	\N	t	2025-12-08 16:21:58.452748	2025-12-08 16:21:58.452748
23	24	16	\N	\N	Permanent	\N	\N	t	2025-12-08 16:26:23.948403	2025-12-08 16:26:23.948403
24	25	17	\N	\N	Permanent	\N	\N	t	2025-12-09 11:07:12.463634	2025-12-09 11:07:12.463634
25	26	17	\N	\N	Permanent	\N	\N	t	2025-12-09 11:21:08.944885	2025-12-09 11:21:08.944885
26	27	18	\N	\N	Permanent	\N	\N	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298
27	28	20	\N	\N	Permanent	\N	\N	t	2025-12-10 11:54:52.590371	2025-12-10 11:54:52.590371
28	29	22	\N	\N	Permanent	\N	\N	t	2025-12-10 12:20:40.771076	2025-12-10 12:20:40.771076
29	30	21	\N	\N	Permanent	\N	\N	t	2025-12-10 12:22:07.04595	2025-12-10 12:22:07.04595
30	31	21	\N	\N	Permanent	\N	\N	t	2025-12-10 12:34:36.988901	2025-12-10 12:34:36.988901
31	31	20	\N	\N	Permanent	\N	\N	t	2025-12-10 12:34:36.988901	2025-12-10 12:34:36.988901
32	32	3	\N	\N	Permanent	\N	\N	t	2025-12-10 13:17:36.40102	2025-12-10 13:17:36.40102
33	33	3	\N	\N	Permanent	\N	\N	t	2025-12-10 15:46:36.62547	2025-12-10 15:46:36.62547
34	33	23	\N	\N	Permanent	\N	\N	t	2025-12-10 15:46:36.62547	2025-12-10 15:46:36.62547
35	34	3	\N	\N	Permanent	\N	\N	t	2025-12-11 10:19:26.610135	2025-12-11 10:19:26.610135
36	34	23	\N	\N	Permanent	\N	\N	t	2025-12-11 10:19:26.610135	2025-12-11 10:19:26.610135
37	35	3	\N	\N	Permanent	\N	\N	t	2025-12-11 10:20:28.864539	2025-12-11 10:20:28.864539
38	36	14	\N	\N	Permanent	\N	\N	t	2025-12-11 10:29:49.769561	2025-12-11 10:29:49.769561
39	37	3	\N	\N	Permanent	\N	\N	t	2025-12-11 15:35:07.237875	2025-12-11 15:35:07.237875
40	38	3	\N	\N	Permanent	\N	\N	t	2025-12-11 15:38:31.711375	2025-12-11 15:38:31.711375
41	39	24	\N	\N	Permanent	\N	\N	t	2025-12-12 10:52:05.182733	2025-12-12 10:52:05.182733
42	40	3	\N	\N	Permanent	\N	\N	t	2025-12-14 17:04:38.512123	2025-12-14 17:04:38.512123
43	41	21	\N	\N	Permanent	\N	\N	t	2025-12-14 17:15:02.372289	2025-12-14 17:15:02.372289
44	42	41	\N	\N	Permanent	\N	\N	t	2025-12-16 17:15:36.11764	2025-12-16 17:15:36.11764
45	43	27	\N	\N	Permanent	\N	\N	t	2025-12-16 18:08:26.077345	2025-12-16 18:08:26.077345
46	44	42	\N	\N	Permanent	\N	\N	t	2025-12-17 10:17:28.451481	2025-12-17 10:17:28.451481
47	45	42	\N	\N	Permanent	\N	\N	t	2025-12-17 11:38:44.633024	2025-12-17 11:38:44.633024
48	46	42	\N	\N	Permanent	\N	\N	t	2025-12-17 11:45:39.175864	2025-12-17 11:45:39.175864
49	47	43	\N	\N	Permanent	\N	\N	t	2025-12-17 12:15:51.569373	2025-12-17 12:15:51.569373
50	48	45	\N	\N	Permanent	\N	\N	t	2025-12-17 12:46:43.84368	2025-12-17 12:46:43.84368
51	49	42	\N	\N	Permanent	\N	\N	t	2025-12-17 16:17:32.18423	2025-12-17 16:17:32.18423
52	49	43	\N	\N	Permanent	\N	\N	t	2025-12-17 16:17:32.18423	2025-12-17 16:17:32.18423
53	50	12	\N	\N	Permanent	\N	\N	t	2025-12-17 23:46:18.617785	2025-12-17 23:46:18.617785
54	51	12	\N	\N	Permanent	\N	\N	t	2025-12-18 00:14:14.327436	2025-12-18 00:14:14.327436
55	52	46	\N	\N	Permanent	\N	\N	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832
56	53	46	\N	\N	Permanent	\N	\N	t	2025-12-18 07:53:13.098733	2025-12-18 07:53:13.098733
57	54	46	\N	\N	Permanent	\N	\N	t	2025-12-18 07:55:07.661001	2025-12-18 07:55:07.661001
58	55	46	\N	\N	Permanent	\N	\N	t	2025-12-18 07:56:02.854324	2025-12-18 07:56:02.854324
59	56	46	\N	\N	Permanent	\N	\N	t	2025-12-18 07:57:04.642941	2025-12-18 07:57:04.642941
60	57	46	\N	\N	Permanent	\N	\N	t	2025-12-18 07:57:46.877587	2025-12-18 07:57:46.877587
\.


--
-- TOC entry 5914 (class 0 OID 27358)
-- Dependencies: 298
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (session_id, user_id, token_hash, refresh_token_hash, device_info, ip_address, user_agent, expires_at, refresh_expires_at, is_active, created_at, last_used_at) FROM stdin;
1	1	9793de4ad38b5cd5d12036acb677edbaf1f6590084927ebef91d2c18869cefe0	f7eac0771d0baeb0749e29c4295a47c983ba513fab08559617945eb39873f5ab	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 10:54:25	2026-01-03 10:54:25	t	2025-12-04 10:54:25.009405	2025-12-04 10:54:25.009405
2	1	66b1e87982ff0e16f3c4edff74fd5b4c90f6639db55d2c16104d358b86541517	ed274a8a5c799efb03efc8543fc3ff95056585a14f13d5092cc52e790ab32eca	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 10:57:00	2026-01-03 10:57:00	t	2025-12-04 10:57:00.087709	2025-12-04 10:57:00.087709
3	1	e8b54950f2968d1c0e89e41a66eb83c74470615b6dc73c9ad60446df89b5fa77	584a54abec0869200846ab3ec2aaaa346ca01647036510527eed51e2fa6fff90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 10:59:18	2026-01-03 10:59:18	t	2025-12-04 10:59:18.188523	2025-12-04 10:59:18.188523
4	1	402e5ea842d3e52f83f10b0979b8997ba6ff27ac792535cd8117ab92a5e9f018	11bd92942497833ad0e332552d6f294525ac27724653bd794485a727bdd6dc94	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 11:00:59	2026-01-03 11:00:59	t	2025-12-04 11:00:59.099711	2025-12-04 11:00:59.099711
5	1	0bc5fe0370f863e50eb1eb8455d6f5c9c244e6bdd9633f8af3b47ea0dda1ced2	9cfebaa7b5cee6352a8e2f687f37bc2e02a1f9cf2cde0e94bec5ffdf1a826832	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 11:05:42	2026-01-03 11:05:42	t	2025-12-04 11:05:42.414807	2025-12-04 11:05:42.414807
6	1	447f27c4c0485a0442702f2bd002313740d5e4ce1f949cd83a3f4ab3ccd85170	1d381c797043ac2ef25ab495952d4b91d713c123a5646011f2aa845bd787bb41	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 11:05:54	2026-01-03 11:05:54	t	2025-12-04 11:05:54.382404	2025-12-04 11:05:54.382404
7	1	ecadda254d97bfcaaca1d66f6f6bd45ea8e314939915f988e3cbb1c7248e2b86	54ec51e9edcea577f27f45a976f5d196872c3c56239a8042ddbeb1179b1a3eb5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 11:09:10	2026-01-03 11:09:10	t	2025-12-04 11:09:10.420873	2025-12-04 11:09:10.420873
8	1	900d268c76501fb56dc50afa1ed93071d560a9653f2463fc260b52090b17bb2f	181197d5f285e0199af3ddfa0e4d966a23a01cb72058c8ad36b3154147418180	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 11:09:42	2026-01-03 11:09:42	t	2025-12-04 11:09:42.287873	2025-12-04 11:09:42.287873
9	1	5da68edbb9013932a049c8fde48e16ea74a1a95fdbe25cfec423c3a2c401435d	53d6558a79152b79c0c8b0dde4e6696f29cdc20f534c37f1c61322b9b16052ac	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 11:09:53	2026-01-03 11:09:53	t	2025-12-04 11:09:53.332362	2025-12-04 11:09:53.332362
10	1	576bb0a32134db0f7fb407f367aec1dc48480ed23cd01dc0f29b00f3a9b55ee2	5b7f6d44af53a32601b7d868c69d78e2fa4d0af616a4bc5f8a015d8c83d12e14	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 11:10:00	2026-01-03 11:10:00	t	2025-12-04 11:10:00.19703	2025-12-04 11:10:00.19703
11	1	9a20caddf74e8a31f871f5ed4d55acda0216a9f0e12d5a47865544630a69f4da	8f038b80e7105e2dcda453d09de1345dc84b13a383fa929b9c0bb239545d651c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 11:10:23	2026-01-03 11:10:23	t	2025-12-04 11:10:23.823292	2025-12-04 11:10:23.823292
12	1	9db610207e5b9c878690870de82cf52993453611baee9a9de60526b42d34cbe7	aeea0a695e5f443b726ee6eb2590555dbf845d5cacaa2b145b4ffd30b053998a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 11:21:58	2026-01-03 11:21:58	t	2025-12-04 11:21:58.188011	2025-12-04 11:21:58.188011
13	1	330c1db76a36c147f2f58ccd939fe190424668779057f35b289e1adae0c4c2d8	bdebec1525a35e9e46804b272d3b592d91052cbadd701ec51c9ea498a835f853	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 11:22:06	2026-01-03 11:22:06	t	2025-12-04 11:22:06.500635	2025-12-04 11:22:06.500635
14	1	66e6bda378651e3a6169002c520d1e75be304ea84d29807771b0c490295095da	c411ec9fe9294bad29d636dd828ef56c05db697a4ec35b03c7bfa8bea1e720f4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 11:29:01	2026-01-03 11:29:01	t	2025-12-04 11:29:01.730124	2025-12-04 11:29:01.730124
15	1	e26a7d70acd7e9337c5f8b399316031eafe51b35269399a58972c5a38e60fd09	8c6bb81df60d077785850d762899286caa11725a07fc27b671857d051321928a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 11:50:38	2026-01-03 11:50:38	t	2025-12-04 11:50:38.389754	2025-12-04 11:50:38.389754
16	1	6ce92a0797fc8ba5497ed98df8e1ba93a4a9362b2405f24c926dec776a9fa260	ade3cb12d4f8a72e8487b0e989f0051439d25d62aef1db49dfee3b66f5a71f81	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 12:08:00	2026-01-03 12:08:00	t	2025-12-04 12:08:00.689609	2025-12-04 12:08:00.689609
17	1	51af2d6a6aea852db77daf7918425c0527188be4da9871ae5acb36fe7a2a2b5d	e6284b6fa085101da7e3fc36c8018835acf5d2e566bd194d236d1bb31d4fd9f1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 12:08:27	2026-01-03 12:08:27	t	2025-12-04 12:08:27.521375	2025-12-04 12:08:27.521375
18	1	925fa817344aff8358ee290d1d0d7bedccfd13a9aa8538c0dad6c5d21447f69b	0ca1bb7ea735a44aa3476437710bcc02cdc63d6b4ba504f606dffcf71e5a2200	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 12:19:23	2026-01-03 12:19:23	t	2025-12-04 12:19:23.969538	2025-12-04 12:19:23.969538
19	1	be6922155a2b51e3fc0aa59d347bc7f44fcf22e4ae6c1d676ccaff11da1709e9	2dfeb84b8b6c21574c94446f8971a439685caa6cc532b5238ba7be81b34b31b3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 12:37:52	2026-01-03 12:37:52	t	2025-12-04 12:37:52.928647	2025-12-04 12:37:52.928647
20	1	eef2ede188b40ba49e4f88215b0a8619e2edb46bc4550613a301e0ef62afb78d	224efb5253debc7d63ec9b505c5946c4c9a712a92ceb61ce021ed65316b7b1f9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 12:52:04	2026-01-03 12:52:04	t	2025-12-04 12:52:04.312079	2025-12-04 12:52:04.312079
21	1	a30fafb96c3ab6e6deefe3ca37a04feb18364fcec2b0430f48465d4e0c43ee57	01bb2d1680d310854ffe32b4171c375953c6f4892900892455dbef36ea8a959a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 12:52:12	2026-01-03 12:52:12	t	2025-12-04 12:52:12.801613	2025-12-04 12:52:12.801613
22	1	f3bfbd3e6c54334f8f7b67b8f74130e955a5a86acd798190e627880cd0705a9f	3f3a9c0fe50e3bd58f7cbf37180f8600e46d65f824dc84e18bf064823c5851d5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 12:56:08	2026-01-03 12:56:08	t	2025-12-04 12:56:08.047956	2025-12-04 12:56:08.047956
23	1	bfd664ba183436f3ca119a913899b8ccba4b38546837f21a14690f6f8a8b7e58	2f219dacce4a9b0b218e1c0016f22c12d985eb03b23dfaf709af5dbe53c2bd7f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 14:35:27	2026-01-03 14:35:27	t	2025-12-04 14:35:27.887375	2025-12-04 14:35:27.887375
24	1	ec2ebdf3342bbc79d0c4db46de891ade4184b2060ff35c338af5780ca3d4388a	a6983e3e3b26fe3a0a885b19dfdeb5763c45c1f8d3b8f57ecd708ca024c4cc59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 14:35:37	2026-01-03 14:35:37	t	2025-12-04 14:35:37.532265	2025-12-04 14:35:37.532265
25	1	4af3142b12da1a5f13bfff322255ef4e884c07f4fff4ee9e065db443e71339d8	fb6981415b613f0a052b43dee817f62baae58cb10c2051732f879de1fa94328a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 14:35:50	2026-01-03 14:35:50	t	2025-12-04 14:35:50.508691	2025-12-04 14:35:50.508691
26	26	60927107efed22a4d41e27e1de499a33ba2b59fa173d1dd6ed2651fa506f0a8a	b062e622ab7ea4792c9720ee7b4f16e5100c1131f3e7e8ac70e1117f899fc830	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 14:44:30	2026-01-03 14:44:30	t	2025-12-04 14:44:30.756971	2025-12-04 14:44:30.756971
27	26	17e94981a3fc5b6f0d104d489510c2d3ce0169a5fc930495e45ad7fc3e9001e2	406216bd37f34cc48bc81208091d0feab1a4b540595d95e334d2e0a2a5c9024e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 14:57:14	2026-01-03 14:57:14	t	2025-12-04 14:57:14.426091	2025-12-04 14:57:14.426091
28	1	b18a006b8ab5b6098fb4197933ac37c13ae60e3baf0854cb7a798b3820676750	2039d466cf42c708dfea475759183a389dc4621b71496b4c428d69cc720a56f6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:01:40	2026-01-03 15:01:40	t	2025-12-04 15:01:40.816083	2025-12-04 15:01:40.816083
29	1	27838145c57f5fc3a35ad23754faccfd1877799eb74e9512e24a52814278980f	551d0f1c5bcdb8d62fa9a32899bf918197df0b1da2b941401cc9edbd347781ce	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:01:49	2026-01-03 15:01:49	t	2025-12-04 15:01:49.337331	2025-12-04 15:01:49.337331
30	1	696a6a221ed56296e22cf59707320c37fc3d1890bf4e61906ceea3d9dc524619	b95e1ff3634c345fa234466f96067727fbd31ee08d69a62fa2f7de0168104126	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:01:57	2026-01-03 15:01:57	t	2025-12-04 15:01:57.46401	2025-12-04 15:01:57.46401
31	1	56663040ca52863ba26df9d14e3731e89bb1d786d0b3a71d04307dff2999ba9d	e6b7185c054076667b503ec9d99ff8a185820030b5b880cd3f1c7a2edc47ea02	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:02:05	2026-01-03 15:02:05	t	2025-12-04 15:02:05.353664	2025-12-04 15:02:05.353664
32	1	7c7f691efdc71eda6974062fe60bac845ad2946bac796c4689c120fbbe94979e	d48e950a82bcca7fafaff288762e823f81d2f3b5a44bc16cabc53131f912c0fd	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:02:23	2026-01-03 15:02:23	t	2025-12-04 15:02:23.587532	2025-12-04 15:02:23.587532
33	1	e0bf1dd9b110f0572489d42cfd29f7b822bf930ccd825f80bde273f0d6c95111	4f828a34aca10fcedc8b799b4bff95066599b700a9b9901248fa623b04639645	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:02:31	2026-01-03 15:02:31	t	2025-12-04 15:02:31.034898	2025-12-04 15:02:31.034898
34	1	690b91c0bc71d5712ce90b2c5e0f61e583ca49e39ea865bf8ae094cf8784c638	8a72062e68686418b62ec0d825ed1e7abc8a5829a2faa51fc7b93c65729094be	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:02:51	2026-01-03 15:02:51	t	2025-12-04 15:02:51.423968	2025-12-04 15:02:51.423968
35	26	97640a871942d8416e49af778a02ae51cb76d2d4573d2599a32e4e33bcbc51cc	f5782c692e949760730aa355ef52e2ee6f450771b878f9dc8e8725b57beba977	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:03:03	2026-01-03 15:03:03	t	2025-12-04 15:03:03.535529	2025-12-04 15:03:03.535529
36	26	78ee4ca85cd4be13edb08c03c50ac638520b046ad716f758baf028cc807f00f7	59191c5683de4b26e8e0619285329853c97dbda6281e3a09460776328b94f69b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:03:10	2026-01-03 15:03:10	t	2025-12-04 15:03:10.747836	2025-12-04 15:03:10.747836
37	26	81333392b9a5f343628537f5c8d4e67eb938eda675c78e67b2417838dec2b205	2889a2027286875ff7429856403d5a48c3152052cb5bf3e6ba00abe3839e6014	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:03:21	2026-01-03 15:03:21	t	2025-12-04 15:03:21.729206	2025-12-04 15:03:21.729206
38	26	4a85c1e93c16b661e2fc65b1b638bca39b7bc2568bad085bb39fb4671f9e7ac1	5c8b0a62c9ac4aabd4a8f91bf2bfb49f73aa73060ebb7de453ff40a11b09dea6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:05:05	2026-01-03 15:05:05	t	2025-12-04 15:05:05.958174	2025-12-04 15:05:05.958174
39	26	37f00038d0a29e59faecbc56905aea9f10193e7b41c55ab6a649c0c6b9fcad4f	4636a51db5bb035145fb0c9cf5270a0dd5a9ab461d52caecef8b27f894750baf	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:07:20	2026-01-03 15:07:20	t	2025-12-04 15:07:20.547286	2025-12-04 15:07:20.547286
40	1	ce1e1dcdb0d5dbbb7c0991b0c61885a785ecb2cac17315cfb406b357533775f0	525998d520aebba39b447dc3aa8ecd33fb17beff2a3101ee106d50214f661f14	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:07:36	2026-01-03 15:07:36	t	2025-12-04 15:07:36.678515	2025-12-04 15:07:36.678515
41	1	8761020b480c109853d7745c0cec171b27b3e9d73173aab23b2cf92dd96a9f40	8756628288b29ccea7752fadd5aae303ad17b8a3058046732d8aa5173cebd687	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:07:47	2026-01-03 15:07:47	t	2025-12-04 15:07:47.803851	2025-12-04 15:07:47.803851
42	27	554f9986acd5a10cd2411ca60bdf4df37a2250dde78f60a035c2d2a231f720ba	5a598fd59da2501d82fc9f8f1be89183bc31142638817442f7d4b689e2f72a5f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:08:33	2026-01-03 15:08:33	t	2025-12-04 15:08:33.341163	2025-12-04 15:08:33.341163
43	26	1a8b6afb06d56349e1f63652db04361f8d6acec4c366b3791c0cac060dd2cd05	97c8032f114160844bf8e1422cbb4c7ed26f828e31dee6ded172f5c89a82d4fd	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:10:14	2026-01-03 15:10:14	t	2025-12-04 15:10:14.157257	2025-12-04 15:10:14.157257
44	1	099b9a79c6ff68a45cd02fa636752a5eb38517d7ae910850062904f682c9e5f2	5698ba70e98e24a82078bc69bef88fc4ec63905a274be808a1119b18c81db39a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:17:19	2026-01-03 15:17:19	t	2025-12-04 15:17:19.248752	2025-12-04 15:17:19.248752
45	1	bbbce8d5da075d124af3e3cee02f03c89c251a2dbb6fa74fcea1db6a52c13dad	85fcd50b0f66ccc756a3c484c3ce685ebfc35aa0848269f48974c38028debfe3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:17:28	2026-01-03 15:17:28	t	2025-12-04 15:17:28.401012	2025-12-04 15:17:28.401012
46	28	eb39dc6e8ff65653abab9297e9b86e539e7c1c4b6dd3e41d43d97d9621fd9e2f	aaa6ce98b9f06b3a448ce276a226a0376629871b5f653947c47dc02e40e85953	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:17:42	2026-01-03 15:17:42	t	2025-12-04 15:17:42.204178	2025-12-04 15:17:42.204178
47	29	58b6973917adfde830b0ea18651506fa0280842b8934745edda482f3ce07f741	83eddb36c08ec9351985aedb01da6406f76b2fd330924be77331fb8facc51c5f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:32:55	2026-01-03 15:32:55	t	2025-12-04 15:32:55.356629	2025-12-04 15:32:55.356629
48	29	5c52389160dac8eb3c1e44337d957b4ce57fba79afa068ffe9af234e96740a85	9f5cd2d1f11fb3344219697a46a4b2883b19e7c45000c0a0269d57810bb4f2ae	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:33:06	2026-01-03 15:33:06	t	2025-12-04 15:33:06.728079	2025-12-04 15:33:06.728079
49	29	5117c1ca951710c5e249cb415fe112a10d602dbf234b1c4919b75c47fa13fb40	c2006e9fc9d76152dad9d16c4a61dcce14135f854cc73efe62a9e1c63c2cfaa5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:33:19	2026-01-03 15:33:19	t	2025-12-04 15:33:19.451571	2025-12-04 15:33:19.451571
50	26	38038e886725e2acfc87554494197e332cdfc55bfe7a83905e8429546279e28b	85fcffcfddf77a45d4d7dc14b051bda1858df58ad565576c410944d17fccea6f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:45:32	2026-01-03 15:45:32	t	2025-12-04 15:45:32.132726	2025-12-04 15:45:32.132726
51	29	b4dfe3e27d060180245ee6416f42cf4c1676b3d5c738c2e80cd4e9bf2b740655	b55c644335152b56536c2547f6f3edb4dbb905fbf1135bc37a4cc47d0dfee24b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:46:48	2026-01-03 15:46:48	t	2025-12-04 15:46:48.465883	2025-12-04 15:46:48.465883
52	29	63142fe6509d7e2d7c68ca05c32d1780c828dac80292e6dd956f1a9ced633b9b	b566da8f9e06b15f3f7a850fcbda5c72df44dc5e7d924efbbcc02742a6aa64c2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 15:46:59	2026-01-03 15:46:59	t	2025-12-04 15:46:59.727975	2025-12-04 15:46:59.727975
53	29	0d660f37f66fffea8441de07c649f1b20b36849f163496adef3910f9c6033be0	03ef2ab2ce5d5b0a821ef741d23497ec92f0382083dc9958879d5cbb1d95ae57	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 16:05:00	2026-01-03 16:05:00	t	2025-12-04 16:05:00.519915	2025-12-04 16:05:00.519915
54	29	615bca374dcd72ba478ecbafb2d5d0e42fc46380edc0e7bf39a7bf984ee3edb3	8175896d71ebbe622b9cd573666e3a2ce410b1deeeb543cf08c2ed537ce86c32	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 16:05:11	2026-01-03 16:05:11	t	2025-12-04 16:05:11.611318	2025-12-04 16:05:11.611318
55	1	f52ad56f7fc8f025f2ecea269792195d1384292d7a41b6c09ae39a60f2868103	95e0473e6d1e197c629dbf5f0e921b7c1fd79296acb9c11c9b9b0630895b34f6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 16:40:18	2026-01-03 16:40:18	t	2025-12-04 16:40:18.675454	2025-12-04 16:40:18.675454
56	26	ae808a900565e3aaca796e08ceaf11182c7fbabb055a0490d7593c1e3f231b08	49112d2a6bd96f6f412ede70cbe3058d88711e1ceee5662ea0edcac387ea953b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 16:45:09	2026-01-03 16:45:09	t	2025-12-04 16:45:09.180419	2025-12-04 16:45:09.180419
57	29	2776a057ed5af29109ea08dfb46aa98dc38daca48e013f10c4228f7319122072	a97b995adeda04e87e1f97ede85d677b3fab29abe4b8cf95535d79f6cca5d80f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 16:45:54	2026-01-03 16:45:54	t	2025-12-04 16:45:54.788313	2025-12-04 16:45:54.788313
58	29	472cea76d4d1d0647cb75eeb9f39a90890703fae4a6a15e464d4281400f7dd9d	b08a59d2436dba8d61c144f61a676fcf38a92b0b2bf51879dadc399e6b7724cd	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 16:46:09	2026-01-03 16:46:09	t	2025-12-04 16:46:09.595438	2025-12-04 16:46:09.595438
59	1	0596b357f3c15c2a193dd1deb6536c3ffde2485e2fe8ce469c0cc3d957b38ec1	b4311c12fef81c92932abaeeb89de46f8f06295b204e4fe220eacb9ac924f226	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 17:20:14	2026-01-03 17:20:14	t	2025-12-04 17:20:14.278743	2025-12-04 17:20:14.278743
60	1	c62644f15acd2a1f7eae4bd133848467c4ea9d26c3953f461d6c61b31d58b1a2	777672cdaf9464f8a4ede768931113c10eaa181ea9ac386707f86b5e41d6931b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 17:20:25	2026-01-03 17:20:25	t	2025-12-04 17:20:25.020885	2025-12-04 17:20:25.020885
61	29	b11f5524843d0c91d439d064165cbb9ecbfaeea9815383f7be495422f3f7e36a	91436fc984d8a624ebf0bed26d3890fba20271f7b4ef8ebaf4ee156b7e2401eb	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 17:31:29	2026-01-03 17:31:29	t	2025-12-04 17:31:29.314393	2025-12-04 17:31:29.314393
62	29	5bf444441f85c4368bd47cf6fe3438586f8db0cf079d98e65c643d477cefcc3d	7e987ca629dbc2f697a393ed57117535748ecd0196d12595c7f3dfcb78fa132c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 17:31:50	2026-01-03 17:31:50	t	2025-12-04 17:31:50.470573	2025-12-04 17:31:50.470573
63	29	43f3e716ba0b1a6b9752b626de08b4008bd8c16e2264417e97422a7672ba5805	003ea8f5a7c1591aef30f557e68ef6d4c9777898574006a91b89736b71fb0814	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 17:32:12	2026-01-03 17:32:12	t	2025-12-04 17:32:12.824003	2025-12-04 17:32:12.824003
64	29	a6fc8be0988ab0ab67e899f46293e57cc206b15c63f54c0a3f814c3da6498a3c	d66d92b960a91e5ffe2e1afd6dfb51421ae34ddc18b7c9286216e468bc3b6595	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-11 17:32:40	2026-01-03 17:32:40	t	2025-12-04 17:32:40.447016	2025-12-04 17:32:40.447016
65	1	9003e000f4af0527e3fb6b4a5f142ec3f21a7c9a6b1b87558c91931301fc95bb	6f428db630ceaa979cb4bc39f60cf50200595b9f4b8f7b6f0fe460b8c6e08d67	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 10:06:24	2026-01-04 10:06:24	t	2025-12-05 10:06:24.705911	2025-12-05 10:06:24.705911
66	1	a8c0b0a63be51898f220b85caf233370b82a4113eb0a42ef43578a2d500dd9ea	b553f26a5a36fe593967e580dc000a436d31736fc30952a5ebeb470c7c2f0eae	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 10:06:47	2026-01-04 10:06:47	t	2025-12-05 10:06:47.165155	2025-12-05 10:06:47.165155
67	1	953236d22e2d0c18c90ac477b72fba4892c94ad6ee85b7db0983dd635ee2c12b	f5039ef6ff10504cd0b82a90d56f502d96dc230f11868c0bc6cc7006466e7224	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 10:07:02	2026-01-04 10:07:02	t	2025-12-05 10:07:02.633951	2025-12-05 10:07:02.633951
68	1	5d1dbcaeec55c8e04b8888f6141cad6df2ae8c09b9e29792dc715c76d04f6a91	570f1e81cf47175998dcc50a8facf0179eed845b9113eaff322328413d92ac51	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 10:07:15	2026-01-04 10:07:15	t	2025-12-05 10:07:15.63598	2025-12-05 10:07:15.63598
69	1	637e8f135846362308e939f0afbc7d7cd894033307bac4024368f82029ef3f3c	0c541decfa95b028a75e4aa241242f8a415e958bbdf8e1b13f5590dbaae984d3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 10:12:44	2026-01-04 10:12:44	t	2025-12-05 10:12:44.027804	2025-12-05 10:12:44.027804
70	32	3952073cd4e50e45de647a9c4bf5ccfd4e42d6b2b0b9a5cfeac9260154f028e8	d8d0e1c141a17252815962e99816880944075023bcbf430f7a5eddb1e0eb85a4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 11:24:28	2026-01-04 11:24:28	t	2025-12-05 11:24:28.806554	2025-12-05 11:24:28.806554
71	32	723b090c1666fd1306b3941ca6bb499ec24890ed48f87ae7364aa5507921050b	165fd957f1029f84dc2ff94c8baa6e8551ec340f593f44c6f830d831fa73a729	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 11:25:01	2026-01-04 11:25:01	t	2025-12-05 11:25:01.951219	2025-12-05 11:25:01.951219
72	32	df74881bd0a206eb4916e8ce8e458293f1740780511a94a2af0237ac473acbe6	2eec4c36db0202506812d3ccb8477611743ff6214d8ee596f582f5c7f510f3b4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 11:35:00	2026-01-04 11:35:00	t	2025-12-05 11:35:00.922246	2025-12-05 11:35:00.922246
73	32	cc2e930fbb642d00ba7a61387fb71a981862163b867940e744acfeae5930d027	fcf83c5fd3fc429484daec240a227a61cb7083ffae968f3e2e71979060293cab	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 11:39:57	2026-01-04 11:39:57	t	2025-12-05 11:39:57.918245	2025-12-05 11:39:57.918245
74	32	8b4d1e76af21ddcac22b86c14727f46587c2b0b8e01d4e01aaf9c067f1e87138	d74c3cad3c91bd08543e49f0497b5ae46e21fe08c2f38e62cccebd589055cc16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 11:46:20	2026-01-04 11:46:20	t	2025-12-05 11:46:20.882084	2025-12-05 11:46:20.882084
75	32	2d909832262c967dc8797e779978c2db9c7275e9e9d39360cc31dabd6ab72480	408b6270cbb939677e177610137588b0cbc602bb06f74bb0561929149c126ae9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 12:05:34	2026-01-04 12:05:34	t	2025-12-05 12:05:34.23793	2025-12-05 12:05:34.23793
76	1	3086d0df7b453427251a1a778baf93d1321149f730b9dfd22518e42c9ab42735	e6580ff876f11b5d7d3d62cfa4e49702327f7d6ce02fdd8d9d44884602ce525c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 12:18:06	2026-01-04 12:18:06	t	2025-12-05 12:18:06.804656	2025-12-05 12:18:06.804656
77	34	addfa2a2e9fe3e0a0f358e182b326fb212b1bb4a7e199fdc92627da3d2060302	2fe11e13c9229d6a52a29d6ec0f1d0d248bd61fd1a9dbfcaf8cd0957da642e05	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 12:18:42	2026-01-04 12:18:42	t	2025-12-05 12:18:42.896979	2025-12-05 12:18:42.896979
78	32	5b0217fb16a69cffc4324961f9e69500d85c6c3e9b39ee364540ce4ce6bc4d04	067cf2cb3a90a4c0f9739a401b18ed659958eeecfefba84fd8dab8cc527f28fc	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 12:21:43	2026-01-04 12:21:43	t	2025-12-05 12:21:43.185064	2025-12-05 12:21:43.185064
79	1	98ff9dcc1bd7f4e960efc0f7ee2a106533ea34e92a08d311fcd48dc9d4219075	4f213d1531f9cc078b9de178ca96a6acc66113b4caaaf9d1f22fa748d9ebba73	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 12:52:55	2026-01-04 12:52:55	t	2025-12-05 12:52:55.745735	2025-12-05 12:52:55.745735
80	34	6ab98eb9f343d91279c25d5d63476b213ce9c489fe20bba0a4112f80d370c55d	d22b9443ac3eb2f929479dc2e753de985a2a107a1c3bebce4bdca9758d388a7d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 12:56:17	2026-01-04 12:56:17	t	2025-12-05 12:56:17.785505	2025-12-05 12:56:17.785505
81	32	ac9ad63fd5d5b5981214b711e1f441d8e14a414ae0607b9adae130418f0e26ae	42db7573263c4d660d5e81fbcdd65ae35359b9939f749b08dcd1563ede8364e2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 13:07:08	2026-01-04 13:07:08	t	2025-12-05 13:07:08.83675	2025-12-05 13:07:08.83675
82	1	14d5a0753742fdfdd9ca3b78e321c51c3b15e050dbe775ba45f4aa4250b4ced3	279e9a8b1dcdf97efe717127643df34111c64c1e33d78dfea5136e8d416567fb	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 15:27:25	2026-01-04 15:27:25	t	2025-12-05 15:27:25.84959	2025-12-05 15:27:25.84959
83	34	c1cde9028f8a96cd5cf1ea079f010ecd7f60eee7138a03661c74e8055b947992	cbbd7d6bf9d88da6faf7d413feb53f54978551cd7b2d0b9c8b897950d73eafd6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 15:27:47	2026-01-04 15:27:47	t	2025-12-05 15:27:47.761804	2025-12-05 15:27:47.761804
84	32	4e19267bf2362bf7b7d0461f805453ae1fcdfa7d4cdf2173ef92ebd51a4fae25	7cee59c80e31d771854fef04c2198514122cd59bee40361c19946e8030160627	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 15:42:45	2026-01-04 15:42:45	t	2025-12-05 15:42:45.07735	2025-12-05 15:42:45.07735
85	1	78bae8aad6b2925ad298d3b2335bba4e703b89e5bcfc5279add4a5ca03f89d3b	42dfc29c8de8feab40f185a0353ed06676a5bdab16774a4375f6f0a6779a29d8	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 15:59:09	2026-01-04 15:59:09	t	2025-12-05 15:59:09.564947	2025-12-05 15:59:09.564947
86	35	340433cb5f7a9d5ef2483fe6b6131e0c4977bdd7b4f588f591204b21f08521da	b70d57ca47242c10769c8b5a488e3a1be1122edb4d0439bbe49ea874a28685a0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 16:07:49	2026-01-04 16:07:49	t	2025-12-05 16:07:49.078193	2025-12-05 16:07:49.078193
87	31	eb14c225c24d3162e8567203b331ea4a326bc87789100d4cb59a6510221d7b01	31ae0d7eb90594160d25ed2eb3fce192bc702fd6466fa95bf7eb48b7e55831fe	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 16:15:20	2026-01-04 16:15:20	t	2025-12-05 16:15:20.092409	2025-12-05 16:15:20.092409
88	35	4a35e23d145b3143b7bd4ad2a8ecb34ee6859a3bca14d914fe3006a9f6181d7c	0f630bb02549e86a4498586a22ed0e8df3010521b33d2dc20df4859272bacd29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 17:07:18	2026-01-04 17:07:18	t	2025-12-05 17:07:18.512635	2025-12-05 17:07:18.512635
89	41	89e4abf380b685ee733360450d4bafaf367a5afaa24485624861b97a0dcd6325	d743a52d2ae840670d6b88ba546ba9ffe31a5007bfc49d7084127d2008d2ef19	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 17:10:00	2026-01-04 17:10:00	t	2025-12-05 17:10:00.100006	2025-12-05 17:10:00.100006
90	40	9e14bc4805ab30dee0c11145da43014c17fe42ba1a618aa558492d12f540426f	99441f730b284a6cf419545011860c291fca42a848e1a5c0770615a343488001	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 17:39:18	2026-01-04 17:39:18	t	2025-12-05 17:39:18.876115	2025-12-05 17:39:18.876115
91	41	2708c94a2891d77f58574f9f4c91790e2db9e1ad7d704344f9069cf581db93dd	604f9853e6fbd833e2d82c0bd78ed549d4173e7930950ed48172b6b3b7f67289	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-12 17:51:23	2026-01-04 17:51:23	t	2025-12-05 17:51:23.246755	2025-12-05 17:51:23.246755
92	1	5fb326485bec054e3d10a5778405d36952703be10511720476bce7fb4c05a768	94f6421b253a72afbe5690592d37791c9bfe0b19c51e942c60828c9dcd81d141	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 09:40:20	2026-01-07 09:40:20	t	2025-12-08 09:40:20.692527	2025-12-08 09:40:20.692527
93	44	b0d34308fb2c96ff815fa85fb184adaef87046d03a8d4132bf4534d47d310ac6	61b68dc1165a4a89273386182589fc91262cb19c67561bc0dbb086270037c436	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 10:45:18	2026-01-07 10:45:18	t	2025-12-08 10:45:18.342534	2025-12-08 10:45:18.342534
94	1	0aeca4ffe655f45c0df58b28472372208dec50a0bbe8bb53d4f215f4e21b77e6	cf4c5b34412b2e5c0537950b8d31fbe5ede5a273775f549f5402cd668dfce219	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 10:50:48	2026-01-07 10:50:48	t	2025-12-08 10:50:48.218636	2025-12-08 10:50:48.218636
95	43	f37768fdf751586e4619bfe9477d1f7854f35013bdfd5a0ecd7684aa89d2c9c8	c97e3a9491a579ea4fd03697592c4f206664e373e87abb45f0f2e0004b4d9426	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 10:51:23	2026-01-07 10:51:23	t	2025-12-08 10:51:23.436787	2025-12-08 10:51:23.436787
96	44	15cd45cbb9d48871bed71686047480431f356c253be7d4f8cd849af7fb1deabb	997057ba11bc76e74c2af8cfb099d54f1bef4d792552f2d49fc832cc16e4fc0d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 10:54:21	2026-01-07 10:54:21	t	2025-12-08 10:54:21.302992	2025-12-08 10:54:21.302992
97	1	bcabd9e6e0a5ce9ed71488d32f8cf068bdf43222b318d2c559bfa13b0731afd0	34715dd54d28f2ea695a629fae94b192bcb8e2c267fcd3e4084f04be30971a28	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 11:10:53	2026-01-07 11:10:53	t	2025-12-08 11:10:53.879433	2025-12-08 11:10:53.879433
98	44	f71b890965d3414b8e2f6be4f619af44df5492d256d5b3640a91dc919fcf97c9	f675e77ee6a51a103b5e7f6aba611d0ec2b82ee95fa26d3bf5659324f6167046	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 11:16:11	2026-01-07 11:16:11	t	2025-12-08 11:16:11.806132	2025-12-08 11:16:11.806132
99	1	705f4c27622174871e25faf210af332769819e0efd8a2fab0ae4dcdd9c66c51b	15f09566d457b8d02ad7001aebe75fee73e9c379f9581a017fe1cfd72384be3c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 11:17:22	2026-01-07 11:17:22	t	2025-12-08 11:17:22.324015	2025-12-08 11:17:22.324015
100	43	746ce4f463a81e50fa926ecb49e574eab26d585dc936306200d5c934a3b00ed3	db834ee8c8ab825412474dab3430535fd7f962d7722c2d2b0ac7158ec5aa5c05	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 11:17:37	2026-01-07 11:17:37	t	2025-12-08 11:17:37.737019	2025-12-08 11:17:37.737019
101	44	8eeb4ce34a52f9990d6bd121e8f322a31724cf9e38ecf3eb2a86e97e44cc8530	873038a63aed953a0f9b698e1af19bd8cbf445bb4fe78789e92dd6588b7c3a50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 11:19:42	2026-01-07 11:19:42	t	2025-12-08 11:19:42.550001	2025-12-08 11:19:42.550001
102	1	0b6409102fd5da92b01fd65c907ec35ecbfb12adf652caabd8b56f60746ca785	a07f00bb3807830349707c14f9042bf19c47af2073e83827da08dd1fe0ebfb21	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 11:26:49	2026-01-07 11:26:49	t	2025-12-08 11:26:49.690552	2025-12-08 11:26:49.690552
103	1	0dca304d20ec97e6b90cb7e4efc3abf67f0cbba5d479c26c355dcedd66f1c4f7	246aa4752a31b67c990d4f360465f4b2af1f10044b65d7e90dba7b0143995a16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 11:45:52	2026-01-07 11:45:52	t	2025-12-08 11:45:52.950422	2025-12-08 11:45:52.950422
104	43	63caab8e54ade8fc6e4e850458bb7cf9fd9e0415ed29deb299ba94664c885cce	45c0863916f88d37bfe80a69bf170dbf46340d900e99de4688bbcc43d775976a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 11:46:05	2026-01-07 11:46:05	t	2025-12-08 11:46:05.012921	2025-12-08 11:46:05.012921
105	44	288e44db78cbd25a014800f47a2a6157b85fd3853fd747e2673faf6742bcd49e	7ed7337b6990a358e5ed7721fa79326b73bf9186ed15534c4cc3c2dea6844382	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 11:46:54	2026-01-07 11:46:54	t	2025-12-08 11:46:54.309594	2025-12-08 11:46:54.309594
106	1	024fb4f5e87f9adae4f69c8b86afa2b7fecfe19ea4ee48057d3027297e6e8b87	ce234438cb6956a8fffce7c75427851b99754b4a62604fdfdc7be2d9c7b0ba94	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 12:04:24	2026-01-07 12:04:24	t	2025-12-08 12:04:24.546284	2025-12-08 12:04:24.546284
107	45	41126fe39a087099d0bc4632f67018e89f524b08a6dcf6f60fa71e0627aa3b3e	e10437e3dd33b7a7ab9ae3b5ddb61bd0a7ef8cc9d0f841e12c30ac9bb0407868	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 12:06:28	2026-01-07 12:06:28	t	2025-12-08 12:06:28.918029	2025-12-08 12:06:28.918029
108	1	173c595db4e1a90267a738c319de4e3da201815f8fc25adb6fb11b67110c8a03	ec3e337b0aca43ace336bf63717cb4b9ea1642b1c25f4890561f45223b2817c4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 12:10:52	2026-01-07 12:10:52	t	2025-12-08 12:10:52.820677	2025-12-08 12:10:52.820677
109	50	90a675c6f5f4706099e2edf29db317d4d0c806e7f27d095135d176449d45f70e	9c448af386a366d96969f060637c1be1a11d55e13de41344b3c9722f7df963fc	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 12:11:51	2026-01-07 12:11:51	t	2025-12-08 12:11:51.44051	2025-12-08 12:11:51.44051
110	1	6898e2066cebb783b831d7d51074cf5586a03a02f4577fdef21cfb334bb773df	668845bda365d2e764b9cf4efa6a1a8bf114926edc1bec0bc5a49737acfd9124	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 12:14:56	2026-01-07 12:14:56	t	2025-12-08 12:14:56.258605	2025-12-08 12:14:56.258605
111	46	4e1cdfbe247a881a7726ef38e583a8622d42cffe67b9dc6fda937ef8792668f0	2e2b5118ea7a141d44b8b364f17a9aaf4c43fc23632f18dab607e244fe57a649	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 12:15:08	2026-01-07 12:15:08	t	2025-12-08 12:15:08.020876	2025-12-08 12:15:08.020876
112	1	f7700b98b9ce8b719513c799afafc2e357466d332abfe890707195b08b064755	4a35394297017144e31fd53e8340c427a0745167e2cea2a2a3bc26b8240c3245	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 12:28:09	2026-01-07 12:28:09	t	2025-12-08 12:28:09.831011	2025-12-08 12:28:09.831011
113	50	85fe605f4ba205a93b8eacead9d8efb4c95803fa33d911dfa61183e990da56aa	7e7470234a1a7324d06e654c984edf6ea75d5524aa02198cb57b677dd38114c5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 12:28:19	2026-01-07 12:28:19	t	2025-12-08 12:28:19.243315	2025-12-08 12:28:19.243315
114	1	79b47529f92e4b8dcf41b88ed3462857d2b49618dfc2327eb5c5863b5f71f65a	de12725d730f86d940bf3e105feeb5d6312617047750f99462be486310f12c49	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 12:40:03	2026-01-07 12:40:03	t	2025-12-08 12:40:03.194628	2025-12-08 12:40:03.194628
115	46	e8a9625c18b66d28e5734dbb2e5c8e04efe460fe7801a42f8b4bebe1510092ad	79378940ce301dfedd4a267d95f1cafa7757b37e7d8da990aa6f201fcfc180fe	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 12:40:44	2026-01-07 12:40:44	t	2025-12-08 12:40:44.798006	2025-12-08 12:40:44.798006
116	1	33d371d5bc21c0878738a65b5dfbb998c2ad50b790743fba31cc3a7a0bc3966a	653f9cd94976504fdc2af8f8ea7bd7e6d23dd112cbdb9d8586d36e8776426eea	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 13:02:50	2026-01-07 13:02:50	t	2025-12-08 13:02:50.291589	2025-12-08 13:02:50.291589
117	50	03fb823bd5c5b355a6669dc4b41063db7e5745ad1341f68aaa74b0314240cb86	9eff4b5a0c81782cc7dd337402395ae610a718156ee27732264a279bc99b8430	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 13:03:05	2026-01-07 13:03:05	t	2025-12-08 13:03:05.140214	2025-12-08 13:03:05.140214
118	46	40a0f74e103b701ae2af26da727c163f3ccfb4721960f49a1ca6f8197eaf59f8	a4d746d4cb635365f82fef99d8f1c00126b0240dbcb814f1a858d834066dd305	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 13:04:11	2026-01-07 13:04:11	t	2025-12-08 13:04:11.833638	2025-12-08 13:04:11.833638
119	1	de33533487498cb7fe682d3ae96074291eb4e4ab607684feb52bc69ebe27c888	378778735d54ad564b541b54fe0d1b5278726d9dba8825b16768fa8811b76813	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 14:28:59	2026-01-07 14:28:59	t	2025-12-08 14:28:59.2195	2025-12-08 14:28:59.2195
120	43	561ae61a9e95289dd5cd2fe90ca8aa20123e867e9dceaa04c32a846cc7930467	6dd484c9493a915d4f79f6191e3e0b791e303a8c98c20f58f4e38b9ccd2c6062	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 14:30:12	2026-01-07 14:30:12	t	2025-12-08 14:30:12.312833	2025-12-08 14:30:12.312833
121	1	c92261edb518b865cdc3f930564d7c524a6c92c9f8d7c578f80f97eb4e89b4cb	f2a4bfa6f3474db3e95f1f17fba0b094242fd48db4f0ef6f3072ca3fe8ca19bf	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 15:47:20	2026-01-07 15:47:20	t	2025-12-08 15:47:20.876257	2025-12-08 15:47:20.876257
122	54	e6378dd667f24eacddeaad87264c7c6aa32a85006a89e9065db77d8f5ae9c228	6a13934ded0cf73ac60c6357c8012c40df2a14f87edfdf25cbef6d932080891c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 15:51:04	2026-01-07 15:51:04	t	2025-12-08 15:51:04.91393	2025-12-08 15:51:04.91393
123	52	409ab5a5a507f7f71f8d46b003698e13c12c509227f47d99ceeb9bdc891002ef	61c2087d8a46e529e40f969779fb4d4d93e8feb4579bae556bf0547ab70d98a3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 15:51:20	2026-01-07 15:51:20	t	2025-12-08 15:51:20.132611	2025-12-08 15:51:20.132611
124	1	761abb0995b8d457a24342697fd7a0978b538773c5c0663d5982331ea7d61251	916cdba77d9543c05e5e5e56cde11a90732d0d31c75f75d78e797fbc1c2fd458	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 16:20:10	2026-01-07 16:20:10	t	2025-12-08 16:20:10.871786	2025-12-08 16:20:10.871786
125	51	b602a714b527e81f3df0760008244b62ce3d685a5f9bd8ed77d4d2eb413b2a84	11c7d80cdb4ee1f76b731c7653753e097662aceeaff9075e569ecdc2a79dc3c5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 16:20:28	2026-01-07 16:20:28	t	2025-12-08 16:20:28.096443	2025-12-08 16:20:28.096443
126	52	d553463d4e970c81669971b71ab17c877cc06763b814cefd5291405695d44909	2f04124ec2c9aebb5c340c77b947dc88049aa952f577345661af691564351ed4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 16:45:41	2026-01-07 16:45:41	t	2025-12-08 16:45:41.45899	2025-12-08 16:45:41.45899
127	1	719b025d6dbd46bc6f3c7db9eee609767b69cb6c199ea914241e2e248a3aaab6	55c045afb668ba8de67adb478383a70ac99d24a83e1fab4a66976714a945d6fc	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 16:46:33	2026-01-07 16:46:33	t	2025-12-08 16:46:33.94843	2025-12-08 16:46:33.94843
128	55	56c047ac5afcb25186b79d0f1eb631dbc653b39301d45c401997491f09768971	f18cafbb33cbd61d96bf5e501ce0e3b033fab4d6994a1777b7c973100ce5a633	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 16:47:18	2026-01-07 16:47:18	t	2025-12-08 16:47:18.992247	2025-12-08 16:47:18.992247
129	55	9c54978e89cd613fa3428e8cd58c78fb3d84f45776c418dc2f00a8683adf97e4	d6019c2dd0739e6e783d427d0e0295a24577209f1e1de158844f63fc34ec8bd7	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-15 17:04:13	2026-01-07 17:04:13	t	2025-12-08 17:04:13.450205	2025-12-08 17:04:13.450205
130	1	55d1a886c9c6b87d5d8575f26619961b02ff2677983791fee313ab0e9c2e4d8c	58f715acce49da003dc47a2437aa62054225727344f5f47ac5c052b10f3ed00e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 10:01:54	2026-01-08 10:01:54	t	2025-12-09 10:01:54.571807	2025-12-09 10:01:54.571807
131	29	c248e4682e99629ce8a9ca670e27d9649cd12a7a30954b532c3a023524055960	9de3fd300c3405181e830f97e461e9f6842e9fc5d373e2ffa3ab4cf703fe7282	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 10:52:42	2026-01-08 10:52:42	t	2025-12-09 10:52:42.946775	2025-12-09 10:52:42.946775
132	1	1f20f2cf46377bafa5cc05bf1bbad35728e8edc030f1bde54662a6758d812282	daa18cc00b23b0caf2d8f6b6c65b89296647b9e1bb495905eaee7dafc9ce27f6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 11:04:56	2026-01-08 11:04:56	t	2025-12-09 11:04:56.583949	2025-12-09 11:04:56.583949
133	55	0ad9e64d25aaa4010be97b5d31f7c9dce4bcfa6247e80c933876397d2a9c68de	833f12e38678cb48783cfd06f09602af393047a294abd3b77722f18980b17a5e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 11:05:30	2026-01-08 11:05:30	t	2025-12-09 11:05:30.541316	2025-12-09 11:05:30.541316
134	58	6585ca7d65f657ab488d15b00e766a3b5bf47eacabd2b010e0362221581390fd	e2bddeff7d7dfa8ef47db330aa49c78c18f7df8c55a2453624becdd15758f0bb	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 11:08:00	2026-01-08 11:08:00	t	2025-12-09 11:08:00.188022	2025-12-09 11:08:00.188022
135	59	5a2aa380e897a0a0f55c091fbd5bbf10fd80ea522d8ccb7fc6ab31d39854bd32	3fa18e636abb419716ba78e527acfea1ecaab6b1906a3d9d64bf8e4529c7b21a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 11:19:56	2026-01-08 11:19:56	t	2025-12-09 11:19:56.937364	2025-12-09 11:19:56.937364
136	58	87263b191ee6217f9edc1df5b5bbd095bbf5969c002ed3c031fa227ba80badaf	d35daafa726f0b8e9e3ab76e504ea9e61b5d082cdd013fc1ab2850db718749da	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 11:20:18	2026-01-08 11:20:18	t	2025-12-09 11:20:18.722444	2025-12-09 11:20:18.722444
137	62	bec50c7872604d1b1371a23ccc69014b408e200026bf390a231bb41794be2cd9	54ee8a8e4f0c604cda52c2d53896217a0669a5ec111dbe49ba76810d6a3b9dbe	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 11:21:25	2026-01-08 11:21:25	t	2025-12-09 11:21:25.549366	2025-12-09 11:21:25.549366
138	59	c28779d080f09b2417ba76c5c4d3ed7ace5314a82b618a160cbee5086e5a68f9	a4f02dc436275ce716f3d96104d0211ff01723a1998ef78e7e0cd43fb9c70fa1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 11:25:51	2026-01-08 11:25:51	t	2025-12-09 11:25:51.04438	2025-12-09 11:25:51.04438
139	62	8ac3c44037330e5ae3a108d322a4dfbda71c2f96c83d4f3275216df9f36783d2	83c28648a08e36876c6f234e1e0bc3a85c951b9131570947487f4d902507b929	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 11:30:30	2026-01-08 11:30:30	t	2025-12-09 11:30:30.58834	2025-12-09 11:30:30.58834
140	59	1a99b168f6fc463d04fb5e20118aec31b9c6124981760523f8845b3b32a7fc2e	a6ffbaa585c009f60aa204b080d8e774b35dd7de9284c9ba7ce0bdb947fec4af	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 11:32:53	2026-01-08 11:32:53	t	2025-12-09 11:32:53.881627	2025-12-09 11:32:53.881627
141	62	ceb72ad26ffa808083d70c0d4a18ed4e1e577659a1d641f3a7c065953c0b7cde	78618302ae4bd598a51be25477d41c67469b6facd86f7f0dd842142d4443e990	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 11:59:33	2026-01-08 11:59:33	t	2025-12-09 11:59:33.439312	2025-12-09 11:59:33.439312
142	1	366edc6122d4c431ec1167d7b0e5f3c2d34bbb12249045eaad3b65e823a2ae15	29315368f05b505ed830889209a1017590df5a35fd6bd0e7d0e5277501673c02	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 13:02:23	2026-01-08 13:02:23	t	2025-12-09 13:02:23.980643	2025-12-09 13:02:23.980643
143	1	6228969cdeb7f48f755549541e669ec9594b3a5d202b2ddad53b7572a5232747	dd56f86d500abb1acbce88b8d3bc3bfc9c2092e044b230e93946e9929898184f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 14:38:05	2026-01-08 14:38:05	t	2025-12-09 14:38:05.698382	2025-12-09 14:38:05.698382
144	63	493397b6bb7c968a21f190094330a7a95c300a374cbefec868d08168a1e7b9f1	0839ad62a508374839fbf16bd90291c60818570a523b76f39ea61c02fa1553ff	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 15:23:37	2026-01-08 15:23:37	t	2025-12-09 15:23:37.618825	2025-12-09 15:23:37.618825
145	1	96f9737d223d031006d44f450d5e6ac60c4f851d654559803cc90b54ba1b3c92	0abac51380a0e534696344952795e57a638472cc29b253af313c1e8cfef44bb0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 16:17:17	2026-01-08 16:17:17	t	2025-12-09 16:17:17.902494	2025-12-09 16:17:17.902494
146	1	b2c5053c2a37c1be07d5d465f2c687405468a4c6927a62963479730920b00981	e9c4a1fc8dfcb196c45bf9ed121164a760496aa2ab7f5f0fed289cadff68e1cc	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 16:32:56	2026-01-08 16:32:56	t	2025-12-09 16:32:56.998146	2025-12-09 16:32:56.998146
147	58	561a5d29b9b9026610bf51dc00995c4bb90f6966bd38ecd0173f416b809a6f72	aaf95002f4a0e05a058343d3aa6d0ccd99afd00cd8e7561408036d15b6d07c74	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 16:33:34	2026-01-08 16:33:34	t	2025-12-09 16:33:34.760659	2025-12-09 16:33:34.760659
148	62	b98d533a92c37fe83cb920850dddc1dfb64ec103c9add3c4643d863a939fc3b6	cf1b6a4d96157d9b63c6f4615afc4bab02f1dddc58388d7e0aee991d31b97166	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 16:50:34	2026-01-08 16:50:34	t	2025-12-09 16:50:34.833016	2025-12-09 16:50:34.833016
149	59	bd8d15217b7c38cc55ed50af78faa6b902d7f2f3df14d423365f988a5eead205	d68412df8334eb4e254eb09df6b32dfab9a403aef1f2c08139e7c89e7d52c929	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 17:14:57	2026-01-08 17:14:57	t	2025-12-09 17:14:57.198049	2025-12-09 17:14:57.198049
150	62	e122ba027f4e5f1a2589d19ec06e345edeca2f11c7dafaf875bb679090705dfe	25bcec85f4b66b18b6616ec54121c057663eb660896b530772aee38c68c39ad0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 17:38:40	2026-01-08 17:38:40	t	2025-12-09 17:38:40.278818	2025-12-09 17:38:40.278818
151	62	d33903e57cd9346d4e87be1315025ec4b81bdff92c29fb84646df1d627169bc2	f06b032872619dbd607934681ca6ca8a659b406f043b34d1f2a000b76345d0f7	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 17:39:31	2026-01-08 17:39:31	t	2025-12-09 17:39:31.40683	2025-12-09 17:39:31.40683
152	62	8b4ca9e8a702e0eda6d84ad083984120250f6814ef443942893a937211369d87	48172a561aa09c041599c8eec9fda6fc638f05400363333b4625509fdc5b8728	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 17:40:17	2026-01-08 17:40:17	t	2025-12-09 17:40:17.841892	2025-12-09 17:40:17.841892
153	26	032ffb45a1903a51c22be5f0fc816ce7343ec23ca21c26fa1dcbc0abd9427ccc	57dd32941cbeb5aaa3dabe95c940b1b99a1401d7d4c649536e9dd2ea4b433cf0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 18:22:47	2026-01-08 18:22:47	t	2025-12-09 18:22:47.451479	2025-12-09 18:22:47.451479
154	1	ca1d047054baf34042703138f982d2674718d7c0bb36d35300e6b93b6a9a3a47	d23793fc54606c17279dafbfb94fe42b66c20844a3c4dc0d89f5d9c6d9f08421	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 18:43:08	2026-01-08 18:43:08	t	2025-12-09 18:43:08.705514	2025-12-09 18:43:08.705514
155	30	87568a18cb05e37f3d8b7651501a0a2838adbe91120f6774ea09a8c2c6fb359b	1492bb7e18779e429c90df072613f273bdfff0a8726921cbc2bbd0472786c776	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 18:43:54	2026-01-08 18:43:54	t	2025-12-09 18:43:54.347035	2025-12-09 18:43:54.347035
156	29	2aa47f14c84f1715071beaef129912577e99fdd9f2cafa95ac80c4f84f7ac380	39328393f713ed813cda32fb936e37bec286b0068f84bbf77f38798b7e03c1ab	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 18:44:23	2026-01-08 18:44:23	t	2025-12-09 18:44:23.460776	2025-12-09 18:44:23.460776
157	1	bf00ec1bfc3c3660468db634a539529978166c36a212e0360ebfdb3357fd2f70	b4e6a6f5e3e9219776da0cafedc76f0bc4bcaba1d412055ffd22e74b27cc38cc	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 18:50:43	2026-01-08 18:50:43	t	2025-12-09 18:50:43.415932	2025-12-09 18:50:43.415932
158	30	ba364c6933c90c12c0083952732a2ea93dc00a2e29d3948bf6c248f8eb377aa1	17b93788903fa90ee302b6e23bbd49af958ebfb809cda88d273251c7a8b13fad	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-16 18:51:45	2026-01-08 18:51:45	t	2025-12-09 18:51:45.249571	2025-12-09 18:51:45.249571
159	1	6bb938b3723131ed016e2b9f6588620977825b4c586038c7c8054b15c9b9778f	3933a081f16d1588dfa0a3d4131700aed344d8e0bdfd3eb2a12d5bde8c25c584	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 09:40:08	2026-01-09 09:40:08	t	2025-12-10 09:40:08.271857	2025-12-10 09:40:08.271857
160	26	c2de95027cafe2f1031753897e2e70f52c6091eb006584b07055b037776acf80	d8fa12a6eeb4e5330aa9bcf36802100a9689bed028e7b52caa4430965d838c3f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 09:40:45	2026-01-09 09:40:45	t	2025-12-10 09:40:45.513275	2025-12-10 09:40:45.513275
161	1	300a54a4ecfa17f7c2708d35dfa52752cd0a6aedbf4c4b680e5ee6761177ce26	882651a3bd8ef612213c5407d540e97886b7716ed80b00ffb01936baf5ac7aff	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 09:54:31	2026-01-09 09:54:31	t	2025-12-10 09:54:31.864748	2025-12-10 09:54:31.864748
162	26	5ba0f828e22dd8bc00d813bbbdcfb9884cb7c9580cebf7a69656d9779a309f53	a147b95386bcb6ddc5024f99f4a990863bdfbabb44dedb8ef60db94309e9bb85	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 09:56:06	2026-01-09 09:56:06	t	2025-12-10 09:56:06.055911	2025-12-10 09:56:06.055911
163	26	52bcc5a1a821bf9308e36a5f824db78989e59708bc59a4e297f3d965dd773e4c	85212ffdbfc1c4879ef8fd67cf0d66346f807f8df53b114d4cb791a3c1e1fb6d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 10:08:18	2026-01-09 10:08:18	t	2025-12-10 10:08:18.863374	2025-12-10 10:08:18.863374
164	26	6418dd958ccd7dad202de7695a2ee7e25ae6323136794e041565e22f159dce0c	0741a39152d795a3fdef52961e21e3d8091a253fdcce3870246ec6e98de9cc43	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 10:16:49	2026-01-09 10:16:49	t	2025-12-10 10:16:49.312028	2025-12-10 10:16:49.312028
165	1	a640bb12347b53f426d8239de281620bee2c8f5e3e85a556fdb7c43ebb003b85	36274dfd18934e6d58ac42c461b8eab7a68bbd3bae1117aa4c1ae69ab53bdb5d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 10:30:14	2026-01-09 10:30:14	t	2025-12-10 10:30:14.747914	2025-12-10 10:30:14.747914
166	35	9e2b9cd99fb31bbf853928dbb52576d5a0899c6e8a70d4c331b29b9dc0011b45	79ed449f3c7d534c0b4da1f0d8ef896a0eab2b0b7627d916bbb872967bd6d3d9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 10:30:30	2026-01-09 10:30:30	t	2025-12-10 10:30:30.072888	2025-12-10 10:30:30.072888
167	35	6fbac1c0b231c34c4ff5571edcc2c0b6dd1011b1dd65439785407a27129ac451	290b8dfe85b99bec8bce9f31457ab5708e11b8c1321d9948438872371c58293d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 10:46:07	2026-01-09 10:46:07	t	2025-12-10 10:46:07.526855	2025-12-10 10:46:07.526855
168	35	4a432eff63341869c48a20e1a384edb6549152a6ef2824fcb7cd12a7e7a3f96b	bcb1f36099f0948694b1cbd8584d98a90d28df1edcc9bb4d3212b53a65980db5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 10:46:27	2026-01-09 10:46:27	t	2025-12-10 10:46:27.776203	2025-12-10 10:46:27.776203
169	26	d755487f5c67fb4d919ab85556915f86d4ac723e0fab87feeed45f6b171f4c7c	ca1eb9e0bed56e6e451e650899abf221ccf9ea395595dbd4713b59a9b7de5be7	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 10:49:20	2026-01-09 10:49:20	t	2025-12-10 10:49:20.642551	2025-12-10 10:49:20.642551
170	1	f359fd2752d739e611ed31633fe6a87e1194d5d49962f092b1a42e2d317b6b2b	85232968f902454ccac65e404edc2da1334bfe11acdd25a79d3bf4fe9e95f233	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 11:38:13	2026-01-09 11:38:13	t	2025-12-10 11:38:13.831542	2025-12-10 11:38:13.831542
177	66	fb1b548f11ffa45e51bb55d81ed9fb34e290c39eef99e78a4dc193f44f0626e2	ce7e6b3327cebe489b1d81aefff0bb243386832bd17d1b7db3f81ff6e40205ba	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 12:21:24	2026-01-09 12:21:24	t	2025-12-10 12:21:24.854198	2025-12-10 12:21:24.854198
183	74	e409785598f95168adb76f69ee8916e4f71a28cdcd269193045944ccd2234195	217765243fb8d79dd9d4d62a4d89bc80d7468fdf80aecd036f8b4114b288593c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 13:17:47	2026-01-09 13:17:47	t	2025-12-10 13:17:47.304806	2025-12-10 13:17:47.304806
189	73	a07e016f8d5a94c3ca2eb1180751128fecd9df3215067d2894649b7f81f9b4f5	f7f2225c5ed5d41a40be77ff8acc80823894b8c3810cca5c86c005e7d4cf5e13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 15:46:51	2026-01-09 15:46:51	t	2025-12-10 15:46:51.147267	2025-12-10 15:46:51.147267
195	1	4103c074720da7ccc4ac560bf484e98c71c5e00cf33d2803ae34579841d4763c	b07493aa3261d05c075ba6233a4b506695c0fc92517fabede9d8cdd4f25e95bd	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 10:29:04	2026-01-10 10:29:04	t	2025-12-11 10:29:04.200747	2025-12-11 10:29:04.200747
202	75	8019d298be83250c276ddc9a3c8a7b9ff8b592f9e76a027230682e0659227bc4	ffe23b9e3cfd605d0c798f9c437ec53651a988fbdfed10d1a6e438e6b498ecab	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 10:47:04	2026-01-10 10:47:04	t	2025-12-11 10:47:04.451141	2025-12-11 10:47:04.451141
208	73	73f600199d61a5dfd5882f206ff87158a1a343af0c958436789cea0d3ff52c4b	13955b4c2b61bfae92ed60dd3fcae89f46591b3e6bacc9051662dc1901f2decf	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 11:34:52	2026-01-10 11:34:52	t	2025-12-11 11:34:52.54684	2025-12-11 11:34:52.54684
215	73	69fe264de6c403ce1cd7a690191c076138a2b6845af8b0f5a857b556ad036d74	6c4087ff89b23b836020b32218679bcf56ef1e76ddfed1068404ce2bef67aca4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::ffff:192.168.10.69	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-18 15:19:23	2026-01-10 15:19:23	t	2025-12-11 15:19:23.691459	2025-12-11 15:19:23.691459
216	73	9165241d48fb249de47a8fb5ba88f68fc6116c3ca1972a8fd0a889886492ed8b	6be68334dd0b35f3d4876cf6a4e7c6134c46874781b2ce1644e19d34491bbae1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 15:19:29	2026-01-10 15:19:29	t	2025-12-11 15:19:29.261389	2025-12-11 15:19:29.261389
222	1	88d65977b270e14ff0562b4742f50932b991a4b3bbc8c3399557f1d6bd4b1af7	ed05d55f13bbb7035faf452a7db5701a2d7b8a98afe43b6df885a7d1714e1851	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 15:31:57	2026-01-10 15:31:57	t	2025-12-11 15:31:57.667347	2025-12-11 15:31:57.667347
229	73	6a7c6b506330a433433a6d4403d4827553d0869177505fb71e75e535d32be038	b634fc6d69e152221c4d05e8a547c10f3aa5b6fa27b76db51cf285fa76da6a31	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.83	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 15:37:44	2026-01-10 15:37:44	t	2025-12-11 15:37:44.161651	2025-12-11 15:37:44.161651
230	80	8bb69e539a87ed91f13329ca7c7a8cb4ab7531571f36c5450b527e8148a12274	28b231fd323aa5472a6e0ae3331d6871b3ec795f3c2b51a3072e251468b8c31f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 15:37:49	2026-01-10 15:37:49	t	2025-12-11 15:37:49.791023	2025-12-11 15:37:49.791023
239	73	f395a828ac41e75f0db3851952952cfe55d948bb6ec21d1556dbc181d9c4bbff	ddded539776cacbf3c641195e3c645962e013d0a3478ef1c8dddac6d3082ad0f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 11:03:32	2026-01-11 11:03:32	t	2025-12-12 11:03:32.336315	2025-12-12 11:03:32.336315
245	83	191c073ab08ec304dc5681de48ba90ad2b888effad5d3a28bf34f3da2ef37185	9a8cbb7615228827c979b7cd3d696fef21da9b2d6d29d407609ea3ea3a7722ac	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 11:49:26	2026-01-11 11:49:26	t	2025-12-12 11:49:26.567374	2025-12-12 11:49:26.567374
251	83	28c4fb9753cd2252bfd34ea052d3737b520c525cd48e439bb5268a53dcff97bf	d106be61fd85f194dc4f322780bf5b3131eb6ca9e328232d44bc8f1ad0fb046b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 14:53:55	2026-01-11 14:53:55	t	2025-12-12 14:53:55.989716	2025-12-12 14:53:55.989716
257	84	a89473caa746915af4eb9f994f4c0b84f68f1a9c5fd9694e7645360eb2a2894e	0aa343e991068799c0189231855395a73e059f04c473b0503b70d7019de8a21a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 15:25:49	2026-01-11 15:25:49	t	2025-12-12 15:25:49.99565	2025-12-12 15:25:49.99565
171	66	9a9a4536cbfafd489dea9ff014bddac618015f41c15168af39eea3c657baedce	c5d211361b27eb5248b94f5abeecf745b7c2b488acd0c72f80f4c73d02c17a25	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 11:55:14	2026-01-09 11:55:14	t	2025-12-10 11:55:14.922241	2025-12-10 11:55:14.922241
178	72	b67baf025b0b322072baa22871cdfb56b315c43e683235c43ed8533b835be6cc	eb8fdb64edd7d2c199e21455c7a6806fd0de5b5241e0257a737304374e24608a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 12:22:24	2026-01-09 12:22:24	t	2025-12-10 12:22:24.276691	2025-12-10 12:22:24.276691
184	74	e9210ac869e817966a9ff264643bdb31fa17ac3c3eb62fe23572d8cd2f453445	9f73ac3a4b8f7824275b4b682d7ec93a231c88de35711da9dbb17920cce3151d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 14:43:33	2026-01-09 14:43:33	t	2025-12-10 14:43:33.934648	2025-12-10 14:43:33.934648
190	1	36f445e25c272f5a7b4d1acd2479c2a461f92b8825ff8030b597a3ffc0bf5846	57e9df078729088e8f01ca16bf642afa12aaeeaf849b7eae5ff889827b5b0d78	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 10:18:39	2026-01-10 10:18:39	t	2025-12-11 10:18:39.318337	2025-12-11 10:18:39.318337
196	79	a5766a8ece49f6d8778334b3147536bbc8324b9208b05bdea4404d8c2901d202	6839c8cd3098bd2c8f356ad90ad47b7570e43629fc029ec42ed609168b17b84d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 10:30:13	2026-01-10 10:30:13	t	2025-12-11 10:30:13.205031	2025-12-11 10:30:13.205031
203	1	0906501a242d021d93ef081203a00ce25e3a7eb9e750c31903ac5adf2602179e	31ac6dc5345b37618c8a58fec5cee009ac98352f9b2fe9b9c8f550615a3ebbba	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 10:50:38	2026-01-10 10:50:38	t	2025-12-11 10:50:38.542616	2025-12-11 10:50:38.542616
209	1	5678e101ea09b0d523a79c41b50b251f8fe1a922d2b75c153a5e10e88b8bde06	628d5e7d5c89ed1b7d697401b236ff65d2cfa18c59e65b647aebfea842f2cec1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 14:51:01	2026-01-10 14:51:01	t	2025-12-11 14:51:01.169274	2025-12-11 14:51:01.169274
217	73	c88e31b121acf5be83617cfed76c1473d3c4b7ab0dbfedc106297d1395aaedc2	fe8a3495543141d658ad919522d54460bb34fe288b22e006663c303ca2e91746	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 15:21:25	2026-01-10 15:21:25	t	2025-12-11 15:21:25.767946	2025-12-11 15:21:25.767946
223	1	53ce1d1e1450b0a3bf31859ca0c898ef692dfa7138affb446023c18219c97061	c2d3ef42eec83eec0a973970e3bd984b9adb7a7beb2bacd8c9ede33e5ba20d1b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 15:33:01	2026-01-10 15:33:01	t	2025-12-11 15:33:01.872025	2025-12-11 15:33:01.872025
231	84	e14fdc91d935e4bf62ab32705d7f380734b8059a8ab712f1d4d535e555e623d2	522cd910e64cef8f7e6674bd59f495a44f266272af6e5d7fe2dee3fd9fccf1c0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 15:38:43	2026-01-10 15:38:43	t	2025-12-11 15:38:43.998522	2025-12-11 15:38:43.998522
234	1	5fb90ec7ca20de5597eba91903a7de37cad2d132219c934756be84e01006979a	bc6a5be7bfb1d4daba20f0312d603b26ec93c43bbc83ef25b394332e9c0c545e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 10:37:27	2026-01-11 10:37:27	t	2025-12-12 10:37:27.635837	2025-12-12 10:37:27.635837
240	26	e5b7d73663d6040a87cee5ee6a6dcda1e85028523a45779f54f94d3f0359101e	8cee325a55cc1f609e4847b53e062a5e55f58ae5e07d390159d0f32b5df66111	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::ffff:192.168.10.54	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-19 11:08:32	2026-01-11 11:08:32	t	2025-12-12 11:08:32.433531	2025-12-12 11:08:32.433531
246	80	6e50bcbade37bd4936feb0621bd7dbbc87d02e09809eb7c31660497643b200b1	c9bc949c939c972ec3a9c27cb9bee65e93a847913004496f5140fe4255881541	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 11:56:37	2026-01-11 11:56:37	t	2025-12-12 11:56:37.541614	2025-12-12 11:56:37.541614
252	84	2f5b58e3b44d9284783e7ba256d7721eadf0ff03981e0a3fcbcf2ca32e3fdb70	0f53b4817042c94abddbabe03a9c85ff864bf4ccdf62ab61f7dc22ab1719b62d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 14:58:45	2026-01-11 14:58:45	t	2025-12-12 14:58:45.645789	2025-12-12 14:58:45.645789
258	73	4886b3abd3ea63f28c2b22dcc548ebbcf3323557deb2e18b925fd5c52aafb9b4	07829af50f76677e5d68c00a88f2d99b3662832ca573ff3e18ef826a9278f186	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 16:04:59	2026-01-11 16:04:59	t	2025-12-12 16:04:59.172913	2025-12-12 16:04:59.172913
172	70	59bfc5a4a32265917ece3d679b380e895661f7bfb02b994b7354121d751be6c6	5f8f3ab6e4583165c548581595b752cd377bee2aef9664a80b30b94ec55d3d27	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 12:11:26	2026-01-09 12:11:26	t	2025-12-10 12:11:26.403745	2025-12-10 12:11:26.403745
179	1	f63594b0f90ccec8040c7f09ad3f921b6293e94edeacd65af8432df48b91dc59	0544e056e5753ed989c5d3c02820f69ca02a73f2850c17237155797de692b602	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 12:29:40	2026-01-09 12:29:40	t	2025-12-10 12:29:40.393556	2025-12-10 12:29:40.393556
185	74	5593e50d4fb80066ffe3b8aefb5339db8d45ba8b8dcfe8ebd8d01bc0b2abf174	e6a9e3f3c77f218bf7ed6b7717d7be446a543d3507becdfe471aee0a3cac1270	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 14:55:21	2026-01-09 14:55:21	t	2025-12-10 14:55:21.897728	2025-12-10 14:55:21.897728
191	76	98c9b99724a5ebd6f6351f495ade4c3dc19fc587e66642038814eb7ad0989f3e	e86818e51c894192f5180060c705d6468751ee10a5eb89c034412f28c9f45ffb	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 10:22:06	2026-01-10 10:22:06	t	2025-12-11 10:22:06.548811	2025-12-11 10:22:06.548811
197	1	42263928a2160de3a4adec7cb78008a0608b1348e44fb948debe1253d85a2780	a5b43039c0c32838e009e7fdb5480bb219e6726d2f5a0414810e5f752d22de52	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 10:33:45	2026-01-10 10:33:45	t	2025-12-11 10:33:45.305346	2025-12-11 10:33:45.305346
204	1	507eb7ca502f8f9d6bad60d458e2902ae7c0ecdbfcb2ba2d42f9bf81c8ceb1ac	fb71b7acb0b6bfaff64f664f2dacc73e85df1e9fc8fbac23c72d92f1f6dfb5ba	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 10:58:21	2026-01-10 10:58:21	t	2025-12-11 10:58:21.662609	2025-12-11 10:58:21.662609
210	1	b8ca15358d70e08808c65a449981a7dd9596b24c63a81cc67525b2239ac8acea	77214bf254ae83ade76ceb2475438e9f5dce892c34987e89d82cbf96b82f2c9f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 14:57:05	2026-01-10 14:57:05	t	2025-12-11 14:57:05.922864	2025-12-11 14:57:05.922864
218	1	6966a835855d1811d3783dbdfbca56c7f40e057ce64344512969c26b82babd1d	509d31d4f9eaee1f4276ee83beafd666aa05322e1639910ddc5c7f655257c00a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::ffff:192.168.10.69	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-18 15:21:51	2026-01-10 15:21:51	t	2025-12-11 15:21:51.085275	2025-12-11 15:21:51.085275
224	71	32d770401d7c7af1a33b09c9d766da813e1a9c75faf92aba52d785f512175a63	4bc7e01d6716217149d253475c77f8dd30354f42de9d9498aa4e97a9a8f64f8a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 15:33:19	2026-01-10 15:33:19	t	2025-12-11 15:33:19.398674	2025-12-11 15:33:19.398674
232	73	9e9d47944c45d4fd05c012e60b893996033eb52e26afa9cb73ee920ef7049798	b5510eaa32beee96de307e6be88271bad5777401723acc4511107af83999b8ec	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 16:48:24	2026-01-10 16:48:24	t	2025-12-11 16:48:24.501727	2025-12-11 16:48:24.501727
235	83	36e4a8bf2a82d42fe704723d954ea8305cad478aed8ca159c1e0e0af875ec329	80391f886afe19a44c7d60ab07c90d32041679d759646e6b580ab138a7a0e108	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 10:45:26	2026-01-11 10:45:26	t	2025-12-12 10:45:26.350779	2025-12-12 10:45:26.350779
241	84	ad0fad30c890c69fe388f307f3bacc2c592a4c95aef52e8f8702ca5383bcda73	7b866a115d61d2950137ea92a3f58ddce6e9bb216f8f3408c94a743bb6b3e7b0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::ffff:192.168.10.54	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-19 11:15:03	2026-01-11 11:15:03	t	2025-12-12 11:15:03.773595	2025-12-12 11:15:03.773595
247	83	6577aabef78a6dc668986efa99795ff063fcd1088ce0d01073a77391ea2b671c	f951a1650a4b6033da88826c0ae6fa2ed35c2706154483bfe59cd303b8b6b0bc	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 11:57:13	2026-01-11 11:57:13	t	2025-12-12 11:57:13.753787	2025-12-12 11:57:13.753787
253	80	f69400340b3f2431ddb321c2c43171bb9035f20d141b54014007edaac8168092	0853dde5f98342f8813f07135157dce2661a13c869dea1043f446f9f06adaff4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 15:02:55	2026-01-11 15:02:55	t	2025-12-12 15:02:55.0266	2025-12-12 15:02:55.0266
259	1	b5e848f543583197130d7302a937c9142b4299e919fd4e0850b54c1ccc4167f1	b0ef8f1e210cdc71a82f9a66fa1830d602f36a969dde0b81fdb54c3130dafda6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::ffff:192.168.10.69	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-19 17:08:26	2026-01-11 17:08:26	t	2025-12-12 17:08:26.883422	2025-12-12 17:08:26.883422
173	68	a0e55e3b8c8ae7bca52768767f692a67dba464c2b8f9304dcd14f1d55fbaadac	853de5bd1180e9d9c274524858fdb7b3c2e40f70e46c012a96c9bbea52ea5a6d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 12:11:47	2026-01-09 12:11:47	t	2025-12-10 12:11:47.231721	2025-12-10 12:11:47.231721
180	73	0c9d609bf475d5fdaf7a614353206ab38bd1d5acf27948061f80dcec15761847	d0bfe4a8738b7b7296ab00c82b121bc8ea15c27150c1aad20f777682d2516460	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 12:34:51	2026-01-09 12:34:51	t	2025-12-10 12:34:51.191436	2025-12-10 12:34:51.191436
186	1	7060abad25e1e77398d8ecf07da570fa66589e69ca472bb2a53a3373bdd99f59	6cdf2ae3ce4db6d10153e5b0467edaca855d19097d1424409b8b915d037965e0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 15:02:27	2026-01-09 15:02:27	t	2025-12-10 15:02:27.350174	2025-12-10 15:02:27.350174
192	73	b8a2cc0cfab719c571bf3ebd3de9092e8c43611470fe7be2adda8951ce9473d9	748af1b8f362f26cab0196cdf9b4f221ed50fe592206270f437354d6b0408ef3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 10:22:57	2026-01-10 10:22:57	t	2025-12-11 10:22:57.123558	2025-12-11 10:22:57.123558
198	76	6e337b1171e25588e3fbe06d26594a285b0b00a7a60b25a6a0e563748c6afa32	33c98182b7f721edc06278fb19b08a99d2ef4ac1db19e6e5ef625497fdcf3261	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 10:38:19	2026-01-10 10:38:19	t	2025-12-11 10:38:19.993691	2025-12-11 10:38:19.993691
199	1	ea1cf908ec4ce56c17db691562236e257198cdd2aceb8ac831a6f0001c607965	3c1f86844e7aeaac1ebe0ce43f013331d31b87e14d62cd00ce4adea9c7a7767e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 10:39:23	2026-01-10 10:39:23	t	2025-12-11 10:39:23.77978	2025-12-11 10:39:23.77978
205	1	05cce68a950749139904960c3182943d78bcab1457939bb8590ad3c790deb6e1	81a352100e18694efcdb736c83a26bc046dee27ce9205cdde72bad3f9e8367a9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 11:03:44	2026-01-10 11:03:44	t	2025-12-11 11:03:44.146266	2025-12-11 11:03:44.146266
211	1	b62765a1159295198ba12409dcbe6f887784718100eedcd4958990abb07c4918	b974099ad0f6d61dcb5fe5577579cdbe9f56e9ec58725df5856f9e683972a98a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.83	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 14:57:27	2026-01-10 14:57:27	t	2025-12-11 14:57:27.250797	2025-12-11 14:57:27.250797
212	73	1fee6f6e6e19243db349408a86dc614410cb2a4ee48745edcf6548768c90160d	72d5e81313a81df7e1940112e0f2ede3c3c53c2150ac0f47a96a1326f458ab17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.83	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 14:58:13	2026-01-10 14:58:13	t	2025-12-11 14:58:13.622816	2025-12-11 14:58:13.622816
219	73	a6d433d8cd4793352c16d3c0399d87b27b705dab6a54995a5f43e2e0fe84b85a	45befcac034e0fd6e668d374faf7a010533ff8a185e991242198496b0042f305	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::ffff:192.168.10.69	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-18 15:28:37	2026-01-10 15:28:37	t	2025-12-11 15:28:37.226647	2025-12-11 15:28:37.226647
225	73	7feffe8c7dfda4e71d46aeadb9a9ad7e117435f738e5f58704bc80455474a867	c8f1568febfc7b603c474c6b8307ad2328b630094dd928a8986503b7424d9faa	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	::ffff:192.168.10.71	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	2025-12-18 15:33:39	2026-01-10 15:33:39	t	2025-12-11 15:33:39.61388	2025-12-11 15:33:39.61388
226	1	306a3ef40c874379004fd79a5c47c05e763b29866db2a1b8f5fcf5ca92191f79	8829be830eb4151c874aac017337dfb3669130eaffe936003c234696d0080a10	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 15:33:56	2026-01-10 15:33:56	t	2025-12-11 15:33:56.924129	2025-12-11 15:33:56.924129
233	1	fd6431e26e6c532320c7fb3ebffec5b0372bd88beab6f523a33523ce995a61b8	6f2fe3a74402f301b95037f74c0396c720ab48ef01930f74619a80fab4a30069	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 17:40:56	2026-01-10 17:40:56	t	2025-12-11 17:40:56.50447	2025-12-11 17:40:56.50447
236	84	94b19df7720a033ea79fba7480a6f9a0c3219cd28abcc7150aa4f4c1d9d86685	110b107c8b6fbf50fe625bb06b7dc97c7a4c25176bbdd827b557d5885d8bca79	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 10:45:49	2026-01-11 10:45:49	t	2025-12-12 10:45:49.0668	2025-12-12 10:45:49.0668
242	83	54bdc9b699b3d26173c747c0d41a5c9c364418ceb19b991425932d06c6f954fe	621dce5dce5b4a2fab7f194d8a068047e553607f543587433df1b5a0c71360b8	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::ffff:192.168.10.54	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-19 11:17:13	2026-01-11 11:17:13	t	2025-12-12 11:17:13.202889	2025-12-12 11:17:13.202889
248	80	1f1592907ccb320fd3438180979ca70683e25c307bfb752930c74dbec2880637	57a7954a6b048d42f7bdced8c7ca788067800f3f112ba5e054a5361ad077db34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::ffff:192.168.10.54	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-19 12:19:14	2026-01-11 12:19:14	t	2025-12-12 12:19:14.309924	2025-12-12 12:19:14.309924
254	84	753f5dbbe1f893dd3cf892332e9c1669a60f10e6e3bdc9351e04b18216a55770	a3f83e0cb8892fe78d71a2f9a594a4fce308f5f9760301955e1df032eb4edab4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 15:05:39	2026-01-11 15:05:39	t	2025-12-12 15:05:39.237696	2025-12-12 15:05:39.237696
260	73	ed71f3f6fcb5e4b17dfd3dccda4a250af47bdbc9c957d3fc121261dd10f0e693	4ad61dc02f6314cd7f8caa72ef6c2eb4aa13392b507fe33108640668e05b2fd6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::ffff:192.168.10.69	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-19 17:22:17	2026-01-11 17:22:17	t	2025-12-12 17:22:17.606743	2025-12-12 17:22:17.606743
174	1	27f253a0a5d086794af35b100f859c7efac7a188da74331d5a69f96e6cdc0eb3	2e062332a58ef2a053f836f3ba89f64ba925dc63f2673b47109c212a178400fb	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 12:19:33	2026-01-09 12:19:33	t	2025-12-10 12:19:33.383559	2025-12-10 12:19:33.383559
181	73	37e87c8b723372df7f8c9975a2338fc6ab162c2fc39d79b17357b098cb173895	012178000547ec11a7623d929e67c14c59f14f7ac9be2030e055259043bea586	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 13:03:39	2026-01-09 13:03:39	t	2025-12-10 13:03:39.912456	2025-12-10 13:03:39.912456
187	74	862946fbc4737edb5fe7d37e5c668f84b73e35c274265b7b8ce49de3c73f96d2	f17ca37758f067b06429ec74c596857c169c9b1273390f530f97bb85cb3cf945	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 15:03:04	2026-01-09 15:03:04	t	2025-12-10 15:03:04.38575	2025-12-10 15:03:04.38575
193	73	a01ec00d20741a2620b4f1a3951f6bf091e42a21e048d8e218ba25e806bdc9b7	70f8f6bbae77a54b103a4090096756046961a668c87ce205a2f831f6be55789c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 10:27:04	2026-01-10 10:27:04	t	2025-12-11 10:27:04.549688	2025-12-11 10:27:04.549688
200	1	4727e0f11eeb310e3a7c8e6b3e2940f0c2f110358d72c1fde32357046665f4d6	1e33c5e6d41af925d2c6a764c8ae5a6c0b2757399b673ec452d3e694a6161180	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 10:44:27	2026-01-10 10:44:27	t	2025-12-11 10:44:27.454549	2025-12-11 10:44:27.454549
206	1	dfb7daf9e3719551aae4eac2e80abffd63f5ccbb468ab82c2f67ff227d22a2b1	b1b251b79244785c1ce763817754eda180e845d1f14305e0cd5e3e58985fa59f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 11:05:57	2026-01-10 11:05:57	t	2025-12-11 11:05:57.661365	2025-12-11 11:05:57.661365
213	1	e62440f61b19d652e14c471d4d4f73bea0a67dc929dbb8e575d67ffd7863651e	7711ac1f30362cb948a4b7df4d36fc5ab970e696fdf07c941d122dfe3d349449	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::ffff:192.168.10.69	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-18 15:14:32	2026-01-10 15:14:32	t	2025-12-11 15:14:32.612509	2025-12-11 15:14:32.612509
220	1	1d2949b781e4b164c6452c0bad06fd73bb75e5bd0fbd8daca89067467188bbbd	02cab3996751857d23b03df0bbefb5ae694c84aaffb80e308c7f81d63c2195c2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::ffff:192.168.10.69	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-18 15:29:13	2026-01-10 15:29:13	t	2025-12-11 15:29:13.547818	2025-12-11 15:29:13.547818
227	80	4cbaa017f608e61c76a7d4e6d9899288b9e3e2d8b56b68ff13af9b8410afa914	862469f541a22f20c7d77895872c4c2e52460d0f98f476e51d0dfe289dd5e4e8	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 15:35:15	2026-01-10 15:35:15	t	2025-12-11 15:35:15.865796	2025-12-11 15:35:15.865796
237	1	04016e39338ff7bbada4f6aa032dedb3801a6e200fb49089acd4ae3b7182c89c	c082630ba39fd6fa49911e464d6b615c043beb420ef498cf701db344c631c09e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 10:48:11	2026-01-11 10:48:11	t	2025-12-12 10:48:11.386798	2025-12-12 10:48:11.386798
243	80	201ce03084ab7d70e334a483616bfe09bdf0f874bd125aa309c33a350e2cc127	30b3914cf0629f37477f3a45e875f1e648c6e7961b73daf724b3c5b6a80627e9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 11:43:03	2026-01-11 11:43:03	t	2025-12-12 11:43:03.291513	2025-12-12 11:43:03.291513
249	84	51e3c9c892433b166679317a3d55dc52228050a2cbfb7bb1362d79c04ecf9e73	b3f1b8b2d4d53efa847f16f348ab63dc7b94598f733dbe5d7f4302256d408d30	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::ffff:192.168.10.54	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-19 12:30:46	2026-01-11 12:30:46	t	2025-12-12 12:30:46.748752	2025-12-12 12:30:46.748752
255	80	293246b8076d5c324319a61387abd517877cd12cc6de1d2bb421d5fab327cb96	67020f4cfe952810fdd3c479a378cbdcb3f3238e48277394da4352f8243d7b38	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 15:07:14	2026-01-11 15:07:14	t	2025-12-12 15:07:14.327024	2025-12-12 15:07:14.327024
261	1	e4ebb5c65204a6e980bb6492077315e376f4c48be6d9b74946b3c36eb2933d33	9fa60973117b103507d90271ea308865d18866567ccb9ea35850f071b77870c2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::ffff:192.168.10.69	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-19 17:56:12	2026-01-11 17:56:12	t	2025-12-12 17:56:12.303656	2025-12-12 17:56:12.303656
175	71	0e0f3eef1b4642c1dd6f4cbc22e55030e247350d6fa1a9e09546c85497b8db76	3c1a9773054e2c903681296eee4511aa4b406884243ed0a9e50a9a7db479459a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 12:21:00	2026-01-09 12:21:00	t	2025-12-10 12:21:00.315405	2025-12-10 12:21:00.315405
176	70	6968d0abc65b9be999d55bc292b53f23a6202199257943aa0892d0a41264bbff	2c021cf617223d8662ecf88f44bb45330aeb5b26d6180b4cbb281ba7abcdefd0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 12:21:12	2026-01-09 12:21:12	t	2025-12-10 12:21:12.259958	2025-12-10 12:21:12.259958
182	1	416c481496abee4bb7286589b9819b3fd72e3729adde0f9a09b89287190efa80	37ed7c09905b59726ebb738602b3a56d4a3147a56cd47679df85eabcdda1751e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 13:16:57	2026-01-09 13:16:57	t	2025-12-10 13:16:57.084276	2025-12-10 13:16:57.084276
188	1	0b7ee1dcf33421affb0821400f423b36242572c95e8dedf8585709229ec11854	abee69a4cff5ca244da4408766020c9dc1badedced79fb703b1f16edaccbe8ae	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-17 15:44:46	2026-01-09 15:44:46	t	2025-12-10 15:44:46.411995	2025-12-10 15:44:46.411995
194	76	1eb9e312ec82739488a0581ec4849de502e0ba051d4bafa08eb0b313648cdb52	292a632b92c0890f07829169f5d7d5d744df88cebc82cb7ae2f322e75b41b2b3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 10:28:43	2026-01-10 10:28:43	t	2025-12-11 10:28:43.256661	2025-12-11 10:28:43.256661
201	71	20b1050f5cc1b6fbf033e60e9a6f11d736ec49e062f5db06bf7de7b36838bb21	c634ab56894af26aef924df198f76547af7edc51eda0938c4b053518a9ef2d11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 10:44:51	2026-01-10 10:44:51	t	2025-12-11 10:44:51.031591	2025-12-11 10:44:51.031591
207	73	6fb7446482b3ce7b4787080f4bc9bbde93c55f7e58a2355b1c2a96ddc021b5f9	c6b0da6d1c60f67e2351662a41c5e4f4ed4dd0406371f6ff51bc3895d624eb94	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 11:06:45	2026-01-10 11:06:45	t	2025-12-11 11:06:45.961647	2025-12-11 11:06:45.961647
214	1	a8778abcd8003eed2ecbfa576b6f96ef28f4ef57dccafb2d475b4c91221a38bc	80269f94964b3376a9239a7acdff5aac73bca8c5b818d2093069da1a77e00610	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::ffff:192.168.10.69	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-18 15:18:14	2026-01-10 15:18:14	t	2025-12-11 15:18:14.805936	2025-12-11 15:18:14.805936
221	1	e8d2e47016f28c9903b9f9a5763a7c4b1da8512059ec1b6b09266c032ca158f4	5196d308ab9da42fa148344f683a092807f5809fc7dc8a5ee79a22852c7bac2f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 15:31:21	2026-01-10 15:31:21	t	2025-12-11 15:31:21.005485	2025-12-11 15:31:21.005485
228	83	81d9dbc52405838bc4f125299544ffc5e69c284c2b26fb2d161411dcfefe8577	b5cf8fd2ff0cf1683d4623b33312ee39ad88e68f09d6faa4c22b1a70e834ee0d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-18 15:36:32	2026-01-10 15:36:32	t	2025-12-11 15:36:32.065699	2025-12-11 15:36:32.065699
238	88	1b9e9f7b843cac188f2c3cdeac5b4cdc0c1eff3e4f5fe76568440b2704d59d0a	c85c65dd5180daaac47945128bc5982f5285dcc56af8197b92635252c9c6a293	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 10:52:20	2026-01-11 10:52:20	t	2025-12-12 10:52:20.763551	2025-12-12 10:52:20.763551
244	83	9a1c81216ad14335a6a5aaf4f0256212db710b0589b5f5d8ed5fd09d5f844f07	2d6f65e3096fa4477c673e53c047ffc4c5ef9a2fd692689f0139b457d82efb5a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 11:45:33	2026-01-11 11:45:33	t	2025-12-12 11:45:33.919825	2025-12-12 11:45:33.919825
250	84	1adede0d041690a1dbaa5379780099d63c9df44acaf8f326e8927a2de83d68fc	325656d5704982ff265678020aa366cceae0d0eb0bf9a8a09e573e7ef436141d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 14:49:45	2026-01-11 14:49:45	t	2025-12-12 14:49:45.962415	2025-12-12 14:49:45.962415
256	84	b6a3b0c5e442252bf263086a864010cbec80aa30b735941fb69c3540be9fa554	00ee8042ef879ae0e8214e244a7a959e46d7e9df9c712db813c963c03cd760d0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.50	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-19 15:17:34	2026-01-11 15:17:34	t	2025-12-12 15:17:34.32915	2025-12-12 15:17:34.32915
262	1	ef74b61850b1198f65e8028045dbee69b49050b2951e8f1dcfe93ed73b5e2d81	ad42415d7d4d0fd7148dff39b6dfbe5e4c09cbaf1d5dae521469d60ebcd375b9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	2025-12-21 16:14:57	2026-01-13 16:14:57	t	2025-12-14 16:14:57.346777	2025-12-14 16:14:57.346777
263	73	a13cb5812420b59725918cd7b9e9b64c39acfe7255fb278635d15e260361e09e	f04dcf9607359d23e7d147a515cda2d0e1cc4a8b81e75895292b97b0b433b88b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	2025-12-21 16:45:27	2026-01-13 16:45:27	t	2025-12-14 16:45:27.404144	2025-12-14 16:45:27.404144
264	1	e819bb118fca754c81775cc4774deae81e449805b9284d8fa636fa68872c2606	687f224d3e37b034b6c6e1aa65f2045fd84e3a6129738415f49de33a9ee4de00	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	2025-12-21 16:53:09	2026-01-13 16:53:09	t	2025-12-14 16:53:09.109528	2025-12-14 16:53:09.109528
265	91	a4f45068604567152553f16371f3c3de86d6867e6036eef1707e1f5178575616	937652e7511168b4bce79ca5ca39f69e15716f890e09bffb2165be4c1a8bfcb0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	2025-12-21 17:06:05	2026-01-13 17:06:05	t	2025-12-14 17:06:05.766656	2025-12-14 17:06:05.766656
266	1	4070931073302b976004167ea655840ba8b5ca6d8177c0a8d7899a4c595a1755	fe92652ea3361735e8547957ebea57b41a26f1860e2aa1bfa6054c2b118b068b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	2025-12-21 17:14:21	2026-01-13 17:14:21	t	2025-12-14 17:14:21.08904	2025-12-14 17:14:21.08904
267	92	ca5959d53288370a6f22a86bbb3db46b4f3343209fb0383dc8ebc7d6b5918cfd	f3a3cf480b23b1435345fd87cfb50d5c9090d5b6ec5c2324e7d639d5ce33c1dd	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	2025-12-21 17:15:23	2026-01-13 17:15:23	t	2025-12-14 17:15:23.056549	2025-12-14 17:15:23.056549
268	73	3c6b226856338bdaf762f40ed04f95e78bced768eb8b55a8c8d4c8acd96d11ef	1fd305d5fb3b5ba838654cc20a4b9fd2f6eedafb21f12a6e765c4f357bdb182f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	2025-12-21 17:19:15	2026-01-13 17:19:15	t	2025-12-14 17:19:15.617918	2025-12-14 17:19:15.617918
269	92	d731f34e5a13ff59b22ca9fa6a6f0e9df5dc991d1806949f4babeb3febe82aab	97228e300b761899e50249f0a665956d257a9accefdd1f69035c65c76a9294da	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	2025-12-21 17:21:37	2026-01-13 17:21:37	t	2025-12-14 17:21:37.657316	2025-12-14 17:21:37.657316
270	73	991b46751bba8d755571b10d87072e4a91c4afd817b71163b6143e578e290961	3ef6a3fd07de5fb1d326a465121315d95c7fc5ac0b4de69eded3ad0859e8df60	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	2025-12-22 10:08:02	2026-01-14 10:08:02	t	2025-12-15 10:08:02.656249	2025-12-15 10:08:02.656249
271	1	ac4ea6dfa09e76d9f19f8f636c9668d668a411719a4a6844aa6025df9bcff504	db85594ef96136013b1be5d21cf9ae6015a960b58925114c8ac6a82009a6a976	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	2025-12-22 17:16:56	2026-01-14 17:16:56	t	2025-12-15 17:16:56.455392	2025-12-15 17:16:56.455392
272	91	03191b19c5a919dd60a20077bfd218d9dd4365415cd395499456bd1b323f82e9	cce9ecd46bdff5bab45cc8710023a7216ae304695c9a898902de5192343c6063	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	2025-12-22 17:17:35	2026-01-14 17:17:35	t	2025-12-15 17:17:35.755583	2025-12-15 17:17:35.755583
273	73	c48cb0d75677edac3c13f62a9e8c51dbf6270a235808d066135144a8f6d1043e	2c08625bbcee6690aaf8de6b4d888f8516b5df44e748cf2a32575dbc2256fe15	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	2025-12-22 17:40:59	2026-01-14 17:40:59	t	2025-12-15 17:40:59.121905	2025-12-15 17:40:59.121905
274	1	c5c10c7b50625449561c4f483b5561092be982f4fea848196d378652835ee1fc	8eba3571747f4f32fcbfd54a90649771214b24df1ec4b33d48d5071341db6fd3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 10:16:27	2026-01-15 10:16:27	t	2025-12-16 10:16:27.8546	2025-12-16 10:16:27.8546
275	1	3ca416ef302bfc28cba63f07779d1cbfeeaee932c1f4d9a19b04319582277e52	fb67c41a4ef80f9b87383360679e1e4c666e27faae91d2baff64917b18dd1456	axios/1.13.2	::1	axios/1.13.2	2025-12-23 10:18:44	2026-01-15 10:18:44	t	2025-12-16 10:18:44.971335	2025-12-16 10:18:44.971335
276	1	5fb8c58b3446b84cf1f548ff046d2e152f0023a58a80506eee8a8e14708b40dd	0bbb11e8c4aa29648814b0557af9d557de58e1db4c4b8323cc234a39d99a68dd	axios/1.13.2	::1	axios/1.13.2	2025-12-23 10:18:59	2026-01-15 10:18:59	t	2025-12-16 10:18:59.31577	2025-12-16 10:18:59.31577
277	1	46a375fd00d78c568e607ca2c6b213d9fe23d343aa86c3a36ef02adc108b67c6	b70e356069335b5e3b2f1c0cdd3755bf045c4138ba4f9f3c4996a2539186e504	axios/1.13.2	::1	axios/1.13.2	2025-12-23 10:20:26	2026-01-15 10:20:26	t	2025-12-16 10:20:26.361473	2025-12-16 10:20:26.361473
278	94	276a9d00a9ba439f2be81ae255de8f5d4ffbbadb3d256fe63b40cfc0e80991fb	1b15179e93fe4f544ebf540bf519ebbe7b41811067fcd5e910dcb5afed14a384	axios/1.13.2	::1	axios/1.13.2	2025-12-23 10:20:26	2026-01-15 10:20:26	t	2025-12-16 10:20:26.510463	2025-12-16 10:20:26.510463
279	94	276a9d00a9ba439f2be81ae255de8f5d4ffbbadb3d256fe63b40cfc0e80991fb	1b15179e93fe4f544ebf540bf519ebbe7b41811067fcd5e910dcb5afed14a384	axios/1.13.2	::1	axios/1.13.2	2025-12-23 10:20:26	2026-01-15 10:20:26	t	2025-12-16 10:20:26.571721	2025-12-16 10:20:26.571721
280	1	66d45e9d4ab46f05a671d31b3551572a7ac0bf649dbc54e66684f8c176827156	ef49020cb587a172b5649326249b1daa1de321a048370a7f4bed107994093574	axios/1.13.2	::1	axios/1.13.2	2025-12-23 10:21:11	2026-01-15 10:21:11	t	2025-12-16 10:21:11.655076	2025-12-16 10:21:11.655076
281	95	6585c06a2ab6a3ef2e6695cdfa935f231b38dbf765cd1543a8eea61046c7c14f	2b4bf6ee2860ee461110e16a38306c6bc39017dfed17727de1cf3d5bd0972d02	axios/1.13.2	::1	axios/1.13.2	2025-12-23 10:21:11	2026-01-15 10:21:11	t	2025-12-16 10:21:11.800891	2025-12-16 10:21:11.800891
282	95	6585c06a2ab6a3ef2e6695cdfa935f231b38dbf765cd1543a8eea61046c7c14f	2b4bf6ee2860ee461110e16a38306c6bc39017dfed17727de1cf3d5bd0972d02	axios/1.13.2	::1	axios/1.13.2	2025-12-23 10:21:11	2026-01-15 10:21:11	t	2025-12-16 10:21:11.861527	2025-12-16 10:21:11.861527
283	1	ff96438a69896f8d47e6b035141f30f02de711cbe3371575069bd3039c76ff7f	fee03a9fbf3c131d31d556637580d0fc451b39b4246a912c82e264b0356399c4	axios/1.13.2	::1	axios/1.13.2	2025-12-23 10:21:43	2026-01-15 10:21:43	t	2025-12-16 10:21:43.047887	2025-12-16 10:21:43.047887
284	96	f8ad841520d8a70dfa69892d72c4c056c0ea5b433494f50d2c1dd50211c7b1aa	683b4a9b6f1e5239bc77eccde8353b071be310caad5bccefe3f04a935e4d0c01	axios/1.13.2	::1	axios/1.13.2	2025-12-23 10:21:43	2026-01-15 10:21:43	t	2025-12-16 10:21:43.199351	2025-12-16 10:21:43.199351
285	96	f8ad841520d8a70dfa69892d72c4c056c0ea5b433494f50d2c1dd50211c7b1aa	683b4a9b6f1e5239bc77eccde8353b071be310caad5bccefe3f04a935e4d0c01	axios/1.13.2	::1	axios/1.13.2	2025-12-23 10:21:43	2026-01-15 10:21:43	t	2025-12-16 10:21:43.254494	2025-12-16 10:21:43.254494
286	1	a060287194494ae5eec787cd16a88b84ea51871248d21b6d8b7b270fcd088816	ef1ba3f93d9204bb4961821882eee379fdf481d4c9a0773ee632bd23ec5ec1ea	axios/1.13.2	::1	axios/1.13.2	2025-12-23 10:23:03	2026-01-15 10:23:03	t	2025-12-16 10:23:03.794023	2025-12-16 10:23:03.794023
287	98	706c212566226bf84c90f76f9ec0a30cb484967bc01eef4db1ba6bbc52af0b4a	bc8f90faec842bb32d273a243daa96b167930c86edd886808e57d143d319d674	axios/1.13.2	::1	axios/1.13.2	2025-12-23 10:23:03	2026-01-15 10:23:03	t	2025-12-16 10:23:03.943058	2025-12-16 10:23:03.943058
288	98	706c212566226bf84c90f76f9ec0a30cb484967bc01eef4db1ba6bbc52af0b4a	bc8f90faec842bb32d273a243daa96b167930c86edd886808e57d143d319d674	axios/1.13.2	::1	axios/1.13.2	2025-12-23 10:23:03	2026-01-15 10:23:03	t	2025-12-16 10:23:03.998031	2025-12-16 10:23:03.998031
289	1	a94fe79a1445acacec28d82497a2f460357fd96199b96c63d9884a0917f731f7	a5f2522852336e8e93402544e2551ac992d06c452d9ee9ee87c28cd08d5d1320	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 10:25:42	2026-01-15 10:25:42	t	2025-12-16 10:25:42.752743	2025-12-16 10:25:42.752743
290	1	da25532f79eafb3c9bf84bfbda7d629b87ee57cbae360152bf89946b915e7368	1008c3c07699c356f5cb42a64bdacabd8eea7aa7536d1a7416fd1816d2b3a909	axios/1.13.2	::1	axios/1.13.2	2025-12-23 10:48:23	2026-01-15 10:48:23	t	2025-12-16 10:48:23.7819	2025-12-16 10:48:23.7819
291	1	532c9ec7f4187a8ef3b8924209489d76140a2db5af0535e90ca50967dc17673e	6fb4ba2bd7132b648692a012645499172e017cec74733d6db865c20ea6353990	axios/1.13.2	::1	axios/1.13.2	2025-12-23 10:48:50	2026-01-15 10:48:50	t	2025-12-16 10:48:50.072561	2025-12-16 10:48:50.072561
292	104	eff78fb8cd4eaa9c354acf880e9e10e16c919ab502ee80c1deee5e5e61773528	5aa091f7517345c3a3033151f776bd8128762a2d531348bcfc106b87f6d477a7	DebugScript	127.0.0.1	DebugScript	2025-12-23 10:49:24	2026-01-15 10:49:24	t	2025-12-16 10:49:24.622283	2025-12-16 10:49:24.622283
293	113	213533c8a46e3fd6c2a4a34052cf72e99321808e54a31264d2651429261a0395	bda5df8d71a2f5530e46c690119acd7d0a987e70c6a171d7b7828fb61a7a5a05	Test	127.0.0.1	Test	2025-12-23 11:02:21	2026-01-15 11:02:21	t	2025-12-16 11:02:21.07693	2025-12-16 11:02:21.07693
294	1	06dac0fdaac410d687afcc0d572b7ddb1b0ff58310514918dc0a8a89696d6238	58011fd2319ca954c9ff494d6faf7add2ff396bb288effed1c9ddeccb51f07e0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 11:05:22	2026-01-15 11:05:22	t	2025-12-16 11:05:22.459677	2025-12-16 11:05:22.459677
295	91	3f8c2a966e90bdfc5fbf73db4d4291cfadaa305269fa6fd12d0ad183f27574ab	8e083421ae672ff294ae848bc4ae5a6e6dd79f3ac05e51b5eb717806f6972caf	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 11:05:35	2026-01-15 11:05:35	t	2025-12-16 11:05:35.675272	2025-12-16 11:05:35.675272
296	1	15f80c6132b98ec61479440092b5b50dec68ea43452cbb785734390f8f1e69a3	1f7edfcb25b27d21bdcb7269206bcf8a0050d2a14bfa3c4533ece7abaefa41bb	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 11:06:46	2026-01-15 11:06:46	t	2025-12-16 11:06:46.498909	2025-12-16 11:06:46.498909
297	73	eafc9bb3282deb24a2531bbe77958277b593f44bac9da676418bda8c2db52ae0	778ce5d67e6ae10f9b699c4e5728261ba65f31d4be35e3b5e3bc79532836e9de	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 11:08:05	2026-01-15 11:08:05	t	2025-12-16 11:08:05.015826	2025-12-16 11:08:05.015826
298	1	d7d750f564ea40ec44c74dbf8c8ad090c0369e68d360cab582c6dc0495066e5f	bf93da9f13a7f1b83e5a3695a207ed2c72eea42ef7228a4dda44ca8fce6281b9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.57	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 16:43:37	2026-01-15 16:43:37	t	2025-12-16 16:43:37.614002	2025-12-16 16:43:37.614002
299	29	d353e2d57bfba94d710cd1176211fd8bda318d048c6d9003741ffef3381f60f5	fcff2a5b3980e5cd79015cf90709990f8c3ccf82d5c9fd81f00a10a095c91d44	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::ffff:192.168.10.57	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 16:44:17	2026-01-15 16:44:17	t	2025-12-16 16:44:17.718368	2025-12-16 16:44:17.718368
300	115	8451517c555814a52a7a60885a962a1691d61718218b1e2e045b197455770d74	5852dfb3b57c4bc5320f102eb121b9a033ff949b9103ed59448021c09116685c	Test	127.0.0.1	Test	2025-12-23 16:56:50	2026-01-15 16:56:50	t	2025-12-16 16:56:50.45861	2025-12-16 16:56:50.45861
301	29	c7ce0e8dbbbac0ba1034cde55b560db62463ae6b1729da9e73e9fd5395bb7bff	9427fe364959b2c1c3583dc65b8809a4323d97f91a9b08fa07085b510f879ae9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 16:59:24	2026-01-15 16:59:24	t	2025-12-16 16:59:24.046697	2025-12-16 16:59:24.046697
302	1	cc142744e73a1548f54c2a66278aa5f96630b04cebd4c72ad79a98b72f7447bc	bfa5d79613696a000eb84bc4b334bbb0d569fe0e679f212a8064f290b1823a3b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 17:13:09	2026-01-15 17:13:09	t	2025-12-16 17:13:09.540385	2025-12-16 17:13:09.540385
303	117	5a3d6c5302a01fd261e30c2adcedd78ad3ae81f6674b66396862a1fb832df7fd	99b6887538c79cae5130aa491d775b1ff06253e978443baa6a1d23fac447fa6f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 17:18:21	2026-01-15 17:18:21	t	2025-12-16 17:18:21.095651	2025-12-16 17:18:21.095651
304	1	3212da3aa52335e463b61e5bac56dd5fd5157157bdb5a3637ecc8e7b507121d4	4ee0529b9e578c6f023e1843fd1109e8cd0de5c3149f2af4b2d19c415dcd08a1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 17:18:46	2026-01-15 17:18:46	t	2025-12-16 17:18:46.364742	2025-12-16 17:18:46.364742
305	26	8dc4fa400b3c181a0e25b8a467f45f9c08c538aa673e63a587e557916faf66a5	9e3f75812d2d32095b61643992b9972a72e9048acbf27bc32ff7c8531fdc6b27	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 17:19:52	2026-01-15 17:19:52	t	2025-12-16 17:19:52.27595	2025-12-16 17:19:52.27595
306	1	67ab2188b6b8c9052cdf0dd73d6ba9eeef368c1214f40ca91590c76dca309b05	ff621dc910565d1214c8f8ad755f4b411360147dd7294a50a83972d85c499eb9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 17:20:28	2026-01-15 17:20:28	t	2025-12-16 17:20:28.505771	2025-12-16 17:20:28.505771
307	30	89de43c1015f64e308567ec792c7aa8608c37d93cbe517f23d541fcf83ffd745	d3cfd2ee0e5cdb13b256c63b247bfa39341f08ccf1974c9d8240ad765f2024e1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 17:20:55	2026-01-15 17:20:55	t	2025-12-16 17:20:55.87137	2025-12-16 17:20:55.87137
308	29	0d9ad7988a8594a303cb5bf39bb848815ea7c4515b4de690f921d1158284e690	646cc837dd0700a8184ae0c219957991ab5141f7c20155e71ec1c282e4b9e00c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 17:21:28	2026-01-15 17:21:28	t	2025-12-16 17:21:28.676983	2025-12-16 17:21:28.676983
309	1	c8dee75d61c9871f195e8910d17b4e6b395760bbe12c095e7273afb40d6c40b8	1fa273dfccd8c22b2310585be817bce68bd8f8028d74b79c2f2b49389f3de047	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 17:29:58	2026-01-15 17:29:58	t	2025-12-16 17:29:58.618191	2025-12-16 17:29:58.618191
310	29	1e85d7ad0625cb7b31ec2bdfd5c88c0d5aa3ef93e138c6e0c23e569282fde78e	bf79b38964bead2656386f2edfdbf8c7009a8dd4d17bd997ad0c638cafb23d1c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 17:38:25	2026-01-15 17:38:25	t	2025-12-16 17:38:25.696735	2025-12-16 17:38:25.696735
311	30	7f7c5d280721857de5a446db665dafb53456ffec4a67c38fd2f7825eb58d6f5b	accbe6711b2a50546a0522352ef97857fd91e1fac6bb815392ac868dc836ee26	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 17:43:45	2026-01-15 17:43:45	t	2025-12-16 17:43:45.231316	2025-12-16 17:43:45.231316
312	30	e999d9aa13cd0cf5e2e390e0a95d4cb4a2a331356ba030269bfc776fd2ad5734	455b5b79833d8d4476c90caf93a7b1788cfcf6739690cc8a6b8865693b404c44	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 17:49:41	2026-01-15 17:49:41	t	2025-12-16 17:49:41.128476	2025-12-16 17:49:41.128476
313	91	f069de88d0f9fe86f208f7cc8737be7f852f2610431c054984af2ac005295c7e	2be3137d52ff9f783f558d019c1017feaafaff596ccddde13218a5dcafbdfc08	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 17:51:53	2026-01-15 17:51:53	t	2025-12-16 17:51:53.745675	2025-12-16 17:51:53.745675
314	92	c46e4ca5d76165a22526fb82c6ca1fb5297208fe68eb46588147d739c684b2aa	3e25c752e01e385685f490e8c79b5a4da79f1b030394177a6878d3e2f693b585	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 17:54:11	2026-01-15 17:54:11	t	2025-12-16 17:54:11.230735	2025-12-16 17:54:11.230735
315	73	be3b13542d5f14790f662d1456415f0a9115c489e6da57bd6548626fcac17e3a	2f13d8fba81889fc544636202874516be27c28490fa9ea8b9ab31c6e34d5cc41	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 17:54:32	2026-01-15 17:54:32	t	2025-12-16 17:54:32.21687	2025-12-16 17:54:32.21687
316	29	2f7373d11d8999a98c559ba6a49deade34a9ae6d4b05e55ee31ea372012ca75e	9704616d28d2a54958f8d3b2ae15004f03eacff103cdf61729b5ef237ae9ffb8	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 18:03:13	2026-01-15 18:03:13	t	2025-12-16 18:03:13.620591	2025-12-16 18:03:13.620591
317	91	4d0eee66ded163d0dc29f80c941094e3b32860c4d210ffa2847fc8b5f3111aee	79728ec61f93cb74a18431c8f8b1e65acfc1a64e782a7dad96c3ee415f995b84	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 18:08:44	2026-01-15 18:08:44	t	2025-12-16 18:08:44.111944	2025-12-16 18:08:44.111944
318	73	57a0c21fce8442cf897f083ce77ca3fce0827de617111e9601956af813e28b1d	b2f9fdc91bd55f4663ad071f17c697d7fee67e3c0e2af1a8812d85218a1ce0da	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 18:09:19	2026-01-15 18:09:19	t	2025-12-16 18:09:19.596384	2025-12-16 18:09:19.596384
319	29	92c3216be0dfc59bdf1bd144c4a1db74b26b929234755a682067d5cb6b5490d4	979c3672c000fe8137c7effa39e348cbcedfcd351f2812a99a3734659e517192	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-23 18:12:31	2026-01-15 18:12:31	t	2025-12-16 18:12:31.494408	2025-12-16 18:12:31.494408
320	1	b02d860030ff6289ff665233fb7efac638dba9e9574e90b050b2df0a10971d2d	cbe488d8daaed78796f092d61c22c4b066198ab4fd889ecaf1a4b49d1be4d5b7	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-24 10:59:55	2026-01-16 10:59:55	t	2025-12-17 10:59:55.545826	2025-12-17 10:59:55.545826
321	30	f157843f3b8fad249dc6a2465a72ca7dc2ebc2ed238722b1a3124f8c6fbccec8	8ad7edb89e951c17d85e382dcb02149d520d60e51b94114eca65a9ad52f97a5b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-24 11:21:07	2026-01-16 11:21:07	t	2025-12-17 11:21:07.028694	2025-12-17 11:21:07.028694
322	118	3296e70c1b809a43813b4378b972c21be527c8f4ebdfaefc6354d1ed88f99a96	4ac03495014b4fc5ea8945f81ba90636da4cf9d2a5ff7a3f7003c66c50dff26e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-24 11:22:01	2026-01-16 11:22:01	t	2025-12-17 11:22:01.252873	2025-12-17 11:22:01.252873
323	120	3e08009a3568f2197ec213e614a5965ee30d6f13b9b4e7fa2b11d6fe93d4885d	f97db22a1783a858551ecd8a53d98e4fa195c1ca65c8fa99fea795aa9508db62	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-24 11:39:19	2026-01-16 11:39:19	t	2025-12-17 11:39:19.956694	2025-12-17 11:39:19.956694
324	125	08c5c9242da2a479ad84cd04cef32a7b8c377a5c1215c59c3acca9a4fec334f9	7c271c3cc8e60d679500bb9d26e983bd4a41005c53486f5938ff1f8518a05e5b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-24 11:54:56	2026-01-16 11:54:56	t	2025-12-17 11:54:56.87607	2025-12-17 11:54:56.87607
325	126	eb25a2e4625d0feff2c2753aa4c986853e7b89af345dbca0f6befa732e82a1bb	8f7246183a3e09efe9880ea28c87f490ceca592ee765790eb759f3dd2c74f0c1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-24 11:55:22	2026-01-16 11:55:22	t	2025-12-17 11:55:22.884045	2025-12-17 11:55:22.884045
326	119	114bb83b66588f57a6d727432444f0b0b73fa32e50eb89630f13afb3d738a5a8	a40c932f85a8fd299107f4491387ded7ef3b29986a7509939a5f28e29337730d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-24 12:12:37	2026-01-16 12:12:37	t	2025-12-17 12:12:37.93567	2025-12-17 12:12:37.93567
327	74	58417c462d0b679a5039830e182477d4c85ff24b3ba18668d921dfaca8bc9ba3	a6c599f825d6850f4789829d21985e094fdb293ec95c2aaa677bc4e757f9eb5f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-24 14:52:15	2026-01-16 14:52:15	t	2025-12-17 14:52:15.29468	2025-12-17 14:52:15.29468
328	126	38f6ea7a557d407c8e01d25fc7016b4456efb88e1825ac70e4ccf239d0758593	3d62d18d6ded77a5fb5c7e4a99e8e292bda36c73c1f44b100fb1426a24d0519c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-24 15:12:16	2026-01-16 15:12:16	t	2025-12-17 15:12:16.317822	2025-12-17 15:12:16.317822
329	1	f3275f932399d120cdb237a147611cbf158af4a2a792b357fe7abb90715b166d	a7456e8e620e03e96792fe2eac6c370053b46f135bc30578cbf9b5f9943d8f66	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-24 16:15:07	2026-01-16 16:15:07	t	2025-12-17 16:15:07.292687	2025-12-17 16:15:07.292687
330	120	c256fcd2d30158a8bd8e505a7c7a6e6bf05c9464bf20f498d656d383458bd262	ee6f67d59883884eb8f3c637ff0d2f368b3bdd56f9e299b1b27cec1f9a5f4b69	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-24 16:15:37	2026-01-16 16:15:37	t	2025-12-17 16:15:37.002894	2025-12-17 16:15:37.002894
331	131	df9f9e3247aac83c0f0b76bd4e0f6177ab9f24c4bf48c395a3a7bfad4f36a1bb	aa053b3bb7e88addae6c74e1399204729ebf894b54177d1825dfb9927578c7da	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	2025-12-24 16:17:50	2026-01-16 16:17:50	t	2025-12-17 16:17:50.467123	2025-12-17 16:17:50.467123
332	1	b866fe8e0f96e87a0d5a2b6360e88ecf3707a6c0523e64ff8b73476f7b53a3d8	1d9e22e3dab73e7b454e9b9a54bd21e894bec523e1e0cbeb1de3feeb3a283bdb	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-24 22:42:19	2026-01-16 22:42:19	t	2025-12-17 22:42:19.65698	2025-12-17 22:42:19.65698
346	137	cb91f6ad7cbed7e1e51ab77dc4a85c7827dc1cdd69d98b84c44d3da0d97bde21	bd0de9bf7ead3bb78f73d109c7690060e252257f62c26ad3076ed681e7ca1359	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 08:28:47	2026-01-17 08:28:47	t	2025-12-18 08:28:47.017873	2025-12-18 08:28:47.017873
333	1	a0cf8f235589984117a56d9f28ea17bf540e859497d7b5990e400934d4d2f1e8	0d0bd268f51382bf46b17df20a0b6b1469485c6b1b01cb1833a8dc9531dcd2c1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-24 23:45:03	2026-01-16 23:45:03	t	2025-12-17 23:45:03.556601	2025-12-17 23:45:03.556601
347	139	12311ffa805cb123415540bbd01f1b4cc9c9982ffb2f031dfa835ff61aa1a319	b877f096df872ecc801ad0e6c7ed0232cd6c23efb1afcde26378f7037fe9b309	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 08:40:53	2026-01-17 08:40:53	t	2025-12-18 08:40:53.611832	2025-12-18 08:40:53.611832
334	132	84ef156cbdb51593083713bd33815ca8a2ecdbb190e198c2d7025955b72382be	2d3a5b9b7b35b81a743dd94f4d1f912475c4cd571b1e9f9baf4d7b9292cdea13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-24 23:46:36	2026-01-16 23:46:36	t	2025-12-17 23:46:36.212548	2025-12-17 23:46:36.212548
348	1	8195a519e038c484f9b3bf05b0f51d79e7dce1974dd4a7a9a4f1a09e96a1bfd7	e55d98df7ab652dc53bc12c7c5737248deb5901f5403afda3e2c977013edeff5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 10:04:13	2026-01-17 10:04:13	t	2025-12-18 10:04:13.519515	2025-12-18 10:04:13.519515
335	1	68eb5e9501d98cfe35e161997cf5b1721b7dd957f7cf55b434f3d8c57741c523	79397b12de85a0bd34ad529ae64f67f524c99a6b4f42087764ca21d07de370a9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 00:13:19	2026-01-17 00:13:19	t	2025-12-18 00:13:19.031382	2025-12-18 00:13:19.031382
349	139	b09896a502079e1be375f5a4e691f8097560bfee983f5dc9f81e71e8ee35bae1	80bcc520a33b8f292a12498c8b5611589ca750dd38938db23029427c756e96e8	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 10:04:59	2026-01-17 10:04:59	t	2025-12-18 10:04:59.467345	2025-12-18 10:04:59.467345
336	133	63315706103c1146ea30aba89467b8ca5096515bf643632e2d124e1a2973d166	d90fb7845eb8dc35cc1286093e2352da9bd217367e8707dd35296cb84ba83297	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 00:14:28	2026-01-17 00:14:28	t	2025-12-18 00:14:28.978794	2025-12-18 00:14:28.978794
350	139	7975ea056e60c2d2a1bf2fda7289dd8b6cd9edc73a51f3268371b77aabbbb82c	cfab7a8873751f9890c62a13352b789ac5f7b5477a23d6caf995e9583ab0804f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 10:51:35	2026-01-17 10:51:35	t	2025-12-18 10:51:35.395372	2025-12-18 10:51:35.395372
337	133	5e5f0e965e801358276116c208b9d78583b71764b0d7e0069c88270a8099e155	80fdecba2445f5ed631654858e841c508136d7c6756ca3d696610b2571e285f4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 00:34:45	2026-01-17 00:34:45	t	2025-12-18 00:34:45.942379	2025-12-18 00:34:45.942379
351	140	1fba655f256e251ced112839182556f9891d80dc1591b9962c23c86551109ff4	e3e383b065459e8e52ad30145e46197bc37dd419085a659f49d7a118c5a85e69	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 10:57:52	2026-01-17 10:57:52	t	2025-12-18 10:57:52.765297	2025-12-18 10:57:52.765297
352	137	008cd4f1134604d6b5059c8138ff926ccc910acbd1920b2494bd937d653dab9c	20d9ae0148e8e37f37f8a7ccad870029619d9a5e165a35c7f06df17eba6469b4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 10:58:20	2026-01-17 10:58:20	t	2025-12-18 10:58:20.555149	2025-12-18 10:58:20.555149
338	1	504888a8de2aef76ecdedf6d6297440f7a4e868d75a112a88365969109d1aa3d	ed4a31fe6e59127e7fc1c4c3ff7d06dedb963b19c7984b57ad4cf667cedb23af	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 00:36:12	2026-01-17 00:36:12	t	2025-12-18 00:36:12.64618	2025-12-18 00:36:12.64618
339	1	25096410cba5b34880c8cc30498efb02fa7e6edb6a9dc5c0603f63b1cd8b2602	254d8efe8caaf9c5512c122ea8ada220f997875b4a5fc16ec251adede6401748	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 01:22:35	2026-01-17 01:22:35	t	2025-12-18 01:22:35.206258	2025-12-18 01:22:35.206258
340	133	070dacaa8d4fa64b18d4071b722338ed06be1a9b733c10b805767d23d2d3606e	6de1737cac3dd7e8892d27bae716313823a3f19079d399159b1071d664dab030	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 01:23:07	2026-01-17 01:23:07	t	2025-12-18 01:23:07.936281	2025-12-18 01:23:07.936281
341	133	895fc1b031de7ca449b560d799d22f33565586f021a9fb4cd63c6f0af912c243	52baebd14b09d1cc8d856835000274b706752367ffa96b924c7c32c2eea37d99	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 02:00:40	2026-01-17 02:00:40	t	2025-12-18 02:00:40.494904	2025-12-18 02:00:40.494904
342	1	fa61a3e885c26f50ad05019fe56323f1f4566fb71a1cdac36728e7abec8fcfd8	1edb554726f11d2831a2e8b968637bf9a4219d26de121ba25d2faa6911db1ec6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 06:59:50	2026-01-17 06:59:50	t	2025-12-18 06:59:50.008014	2025-12-18 06:59:50.008014
343	134	f4c3d2cc9dc31bc22d6f51c906d85c7987d3895d42adddb7412b09c549f3bdb5	5bcd42121ca3d1c755bc4a5fcf90f64c2b5826f7e0418c937fd887aaa1a0e921	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 07:47:54	2026-01-17 07:47:54	t	2025-12-18 07:47:54.776551	2025-12-18 07:47:54.776551
344	137	3e15839ad39e2b1dc72843172b70341abb94c2e0914d1a8078f34e6e953506bb	652377a99e07ffab22be388cfa86e3d7270f917d592f3a4902128f776104673f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 07:59:53	2026-01-17 07:59:53	t	2025-12-18 07:59:53.98449	2025-12-18 07:59:53.98449
345	139	9b8404432b65983224355776ffe602891e31c2012f3de5efe76552e055e2920d	93c9b8095faec51b6d9fa2f1283b4be30a41d2ddb4a937c9ff99b2c26230e0b8	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 08:03:35	2026-01-17 08:03:35	t	2025-12-18 08:03:35.704642	2025-12-18 08:03:35.704642
\.


--
-- TOC entry 5916 (class 0 OID 27371)
-- Dependencies: 300
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, email, phone_number, password_hash, role_id, is_active, is_email_verified, is_phone_verified, last_login, login_attempts, locked_until, password_changed_at, must_change_password, created_at, updated_at) FROM stdin;
20	aef	aef@gmail.com	aef	$2a$10$QA8NQfTvu4Pssa4zjBJ0/uct6ltSEOuZ/5o.gQZDBk7q4hXm1Wm3O	3	t	t	f	\N	0	\N	\N	f	2025-12-04 13:08:59.588336	2025-12-04 13:08:59.588336
23	aefqf	sdg@ghmail.com	wqetf	$2a$10$368JjGx8HpnwKwQjkG/2o.8xRhPdsEnDpoK/KZdxKiGvGmNjtPjQW	4	t	t	f	\N	0	\N	\N	f	2025-12-04 13:13:34.850725	2025-12-04 13:13:34.850725
24	wrg	wrge@gmail.com	wrg	$2a$10$u3wNzoWy188wUz9okQtop.Lcc2HoUIjrPobkyk.5vQi.uq4y3csk.	5	t	f	f	\N	0	\N	\N	f	2025-12-04 13:14:08.38151	2025-12-04 13:14:08.38151
25	dth	dth@gmail.com	wtwr	$2a$10$hNkEdQ8JZgp.J0oCDn5v2.E79YI0/4lqx16qHXsagIJZirZe02ZOG	2	t	f	f	\N	0	\N	\N	f	2025-12-04 13:14:27.34406	2025-12-04 13:14:27.34406
27	test	test@example.com		$2a$10$KAI4l4xxlgNSLKZaXl5wjea.0S7U8zFGJq94lOnTftWV6ihTU8zEi	2	t	t	f	2025-12-04 15:08:33.342937	0	\N	\N	f	2025-12-04 15:08:17.271567	2025-12-04 15:08:33.342937
33	kamakahinton	khinton@gmail.com		$2a$10$uaw/Hcpfb.zAWxLujJ0HZubnRO8WV6W6RCh6vue48OtmpXgCI1LT.	4	t	t	f	\N	0	\N	\N	f	2025-12-05 10:26:11.891738	2025-12-05 10:26:11.891738
28	wg	hoho@gmail.com	awrg	$2a$10$wodDgzu6rMZUSJztiNktNeva0mubToJWROL/lXiKnedPZMl80X.gG	2	t	t	f	2025-12-04 15:17:42.204937	0	\N	\N	f	2025-12-04 15:17:05.29374	2025-12-04 15:17:42.204937
58	ashoka	ashoka@gmail.com		$2a$10$5SQDt7lIVK.q7tSh9MdxUuwF5WdaC.zVbmBhjDiXOzyISI7U8PLiS	2	t	t	f	2025-12-09 16:33:34.762548	0	\N	\N	f	2025-12-09 11:07:12.463634	2025-12-09 16:33:34.762548
40	jaikishore	jaikishore@gmail.com		$2a$10$iOzdp9GTApACUf/hALcWHeQhTUd0.Jd88TPxMPrIuhAxqNFA4P922	3	t	t	f	2025-12-05 17:39:18.877867	0	\N	\N	f	2025-12-05 17:08:35.865492	2025-12-05 17:39:18.877867
41	krithikaS	krithikas@gmail.com		$2a$10$RR0UbHvUirAUB7RzmDqc7uxbhZJL6ffqXVt.j3IHvBGymPgHhKT/a	5	t	f	f	2025-12-05 17:51:23.248497	0	\N	\N	f	2025-12-05 17:09:36.666577	2025-12-05 17:51:23.248497
6	alice_cgh	alice@citygen.com	+91-9876543211	$2a$10$wD7WGUVYHdkcAPiSMLYiO.FgZfVp/FaIu5GljB6Q2bDRRrhdbJn3m	2	t	t	f	\N	0	\N	\N	f	2025-12-04 12:21:01.453672	2025-12-04 12:21:01.453672
42	kvadmin	kvadmin@gmail.com		$2a$10$ktq/0EdeK1wDBVbrnE/aNOD94ZNXTx6lHUDu8VGOr7P1uBzUbushO	2	t	t	f	\N	0	\N	\N	f	2025-12-08 10:39:46.204638	2025-12-08 10:39:46.204638
45	shanti	shanti@gmail.com		$2a$10$mqPoYttq210wNVU3X.MWV.gOTC3L/dGFtS16J3Ca5OyzQxWupA5uy	2	t	t	f	2025-12-08 12:06:28.920143	0	\N	\N	f	2025-12-08 12:05:46.171886	2025-12-08 12:06:28.920143
51	sun	sun@gmail.com		$2a$10$5QhXTKomfzoIDphIl4sWgeG.30ORhaHkc4tucZ.nr.jvFW2RTdj2i	2	t	t	f	2025-12-08 16:20:28.098317	0	\N	\N	f	2025-12-08 15:48:18.014037	2025-12-08 16:20:28.098317
32	anandkali	ak@gmail.com		$2a$10$CoBXmeuV.hZe2ipS38RpuOx90LHsM5rYfodp4Ael1dtWiPLYzUpDC	3	t	t	f	2025-12-05 15:42:45.079196	0	\N	\N	f	2025-12-05 10:24:01.508555	2025-12-05 15:42:45.079196
36	admin2	amren1@gmail.com		$2a$10$RdsZV3//dS66KNLNUhy7NebpE.AYLEV8MLLCi.BtYeJaTnQ2v3Pdu	2	t	t	f	\N	0	\N	\N	f	2025-12-05 16:06:10.560809	2025-12-05 16:06:10.560809
50	recepshanti	recep@shanti.com		$2a$10$64NlFYj3w74lsCQsUHFj.OkLL/C4zBl940ZY.w.vspeCptl0UX2Zq	5	t	f	f	2025-12-08 13:03:05.142133	0	\N	\N	f	2025-12-08 12:11:35.015557	2025-12-08 13:03:05.142133
31	KH	kh@gmail.com		$2a$10$DGM4rMTX/5AyGLoDmvw.xeHZeW1LAh7wFWOUr./2/EKgrau3Cd9k2	2	t	t	f	2025-12-05 16:15:20.094738	0	\N	\N	f	2025-12-05 10:15:34.112889	2025-12-05 16:15:20.094738
55	sundoc2	doc2@sun.com		$2a$10$cje6E76KvDqeNGKimP8py.bofljcRdmy23pOirwDKbRTm5a2zUe1O	3	t	t	f	2025-12-09 11:05:30.542732	0	\N	\N	f	2025-12-08 16:21:26.742169	2025-12-09 11:05:30.542732
37	araindram	aravind@amren.com		$2a$10$oV6vxODFuLhYkpGtuKE1S.mXMtaMdwMZyWJypd7YT6jFNJw50L/ou	3	t	t	f	\N	0	\N	\N	f	2025-12-05 16:22:27.822726	2025-12-05 16:22:27.822726
38	harriskannan	hkannan@gmail.com		$2a$10$x.hpE0wBD6euM7uiDB8IpOyoP22CbcHaPncKeiuDBQNd9OmVgVWjW	5	t	f	f	\N	0	\N	\N	f	2025-12-05 16:23:23.676947	2025-12-05 16:23:23.676947
34	ritas	rita@gmail.com	4563545665	$2a$10$d9FCwlyoPiz3iALCewwox.LkzYlqXmzVdmuouNL5z/cHOpuo9BZQC	5	t	f	f	2025-12-05 15:27:47.764095	0	\N	\N	f	2025-12-05 10:27:52.796381	2025-12-05 17:05:33.7887
56	rec2	rec2@sun.com	5456787656	$2a$10$QlGdA26xvGhgZdcmWXo48.acCwNuLgZXRyfgFnZYzFeriwA9Qsw/a	5	t	f	f	\N	0	\N	\N	f	2025-12-08 16:21:58.449304	2025-12-08 16:21:58.449304
39	c2	c2@gmail.com		$2a$10$QCgHI69KeEkkoTeY60qVeOOj7wCEPWEuiy4sq12G1BSDHdqZm3DCO	2	t	t	f	\N	0	\N	\N	f	2025-12-05 17:06:09.438569	2025-12-05 17:06:09.438569
46	anand	anand@gmail.com		$2a$10$EaYu5oAPP/SU70Ka09dvSO7OzE3eZ55iopQqRXSNDPL10QKB2EXh6	3	t	t	f	2025-12-08 13:04:11.835238	0	\N	\N	f	2025-12-08 12:09:19.478613	2025-12-08 13:04:11.835238
57	reddd	rec3@sun.com	1234567898	$2a$10$wQTS.HdD9lzLWO9meqyNhOn70dmWwHB57bCfrzDvQdTMXWdFmHs06	5	t	f	f	\N	0	\N	\N	f	2025-12-08 16:26:23.946184	2025-12-08 16:26:23.946184
52	sun1	doc1@sun.com		$2a$10$CFLbFglYs0Q/c5iu5F3ua.hPapeuc3DXRy/V/AffCGbv4taZqexae	3	t	t	f	2025-12-08 16:45:41.461268	0	\N	\N	f	2025-12-08 15:49:46.685247	2025-12-08 16:45:41.461268
44	recep1	recep@kv.com		$2a$10$Bhue3XyMshNqRFczOgmCuuxqLGcKB4pBVhgWXYozYnl9QS0Trr8qG	5	t	f	f	2025-12-08 11:46:54.311673	0	\N	\N	f	2025-12-08 10:44:54.143178	2025-12-08 11:46:54.311673
43	ram	ramkv@gmail.com		$2a$10$7W4PSpTU6rPSue2rA0gMJu9elM4.Pg75WSpmbY5yc4B5oJW6FLWOO	3	t	t	f	2025-12-08 14:30:12.31433	0	\N	\N	f	2025-12-08 10:43:45.794712	2025-12-08 14:30:12.31433
64	alopa	doc3@ashoka.com	5678765678	$2a$10$R8w3MeFxu6llndZea/hlcO4BmPcFn1cJ8TOZ1Mv73NwCj5vRyLsCG	3	t	t	f	\N	0	\N	\N	f	2025-12-09 16:46:42.63248	2025-12-09 16:46:42.63248
54	sun23	rec@sun.com		$2a$10$V1Pcu0EQVQS/lKYnA3hwtunj0jp63cSE6n9uzjqJEJeJy31dEcWKm	5	t	f	f	2025-12-08 15:51:04.915858	0	\N	\N	f	2025-12-08 15:50:44.983562	2025-12-08 15:51:04.915858
65	as	doc4@ashoka.com	45676545667	$2a$10$jczDkZ5NYjWGgd9SHkJJpO1Us00e4CeHIkmWreNVkW8Efl8ApSXs2	3	t	t	f	\N	0	\N	\N	f	2025-12-09 16:48:56.82302	2025-12-09 16:48:56.82302
35	admin	amren@gmail.com		$2a$10$HZZCMaj3QPptn9r2ZglvoOQy7.C3HAY9p6M20nMOvRIFIC92KmpdO	2	t	t	f	2025-12-10 10:46:27.777653	0	\N	\N	f	2025-12-05 16:05:09.221919	2025-12-10 10:46:27.777653
63	testbs	testbs@gmail.com		$2a$10$VJTOeoZJXofwwSWtK7TpquS/EFyK55jnb8VvynlPhUhisSDvn.U/O	2	t	t	f	2025-12-09 15:23:37.620646	0	\N	\N	f	2025-12-09 15:20:29.172298	2025-12-09 15:23:37.620646
62	kalai	recep1@ashoka.com		$2a$10$Lc84.OOVeb/ro6/UrFefLeIrtVjpUSfjCJSn8rtZvPAk9hegpTdDS	5	t	f	f	2025-12-09 17:40:17.844405	0	\N	\N	f	2025-12-09 11:21:08.940956	2025-12-09 17:40:17.844405
59	rathnam	doc1@ashoka.com	8765676545	$2a$10$JpMCuXXi5RTwtXdliWNMN.tda62wTH6DeIxo7mQ1V2SC0y/g3MC3e	3	t	t	f	2025-12-09 17:14:57.199976	0	\N	\N	f	2025-12-09 11:14:39.39946	2025-12-09 17:14:57.199976
66	withlogo	withlogo@gmail.com		$2a$10$YQCouR3N4kDDVoPHRdOPD.jFanlUeT2OT58w4JQpHEMnik8LgpTd.	2	t	t	f	2025-12-10 12:21:24.856068	4	\N	\N	f	2025-12-10 11:54:52.590371	2025-12-11 15:32:47.643511
68	docwl@gmail.com	docwl@gmail.com		$2a$10$JRP/Htn9ClKaqNuPtJjjyuakMFdT/7HvQPZGYs1oMnGgMld33Pf0i	3	t	t	f	2025-12-10 12:11:47.233403	0	\N	\N	f	2025-12-10 12:08:17.989291	2025-12-10 12:11:47.233403
5	madhus	madhu@apollo.com	3454545454	$2a$10$oKBdxCEE2IlBYwwrOGwBK.9kqQrvTf6jTlSmt35qsYEQWOaYoPr1G	2	t	t	f	\N	3	\N	\N	f	2025-12-04 11:34:02.498301	2025-12-11 15:30:03.339723
70	doc2wl	doc2wl@gmail.com		$2a$10$xVbKImEYhpysEqfirvk/7eh.F1A0RzMfAPXMeemFNKsSb7MbUqd.i	3	t	t	f	2025-12-10 12:21:12.260867	0	\N	\N	f	2025-12-10 12:10:52.629981	2025-12-10 12:21:12.260867
72	recpwl@gmail.com	recpwl@gmail.com		$2a$10$oXIk9cagiP525mPvxe45L.5sbpul.sIurQ/AxY6iGjAnbzLBmbCCu	5	t	f	f	2025-12-10 12:22:24.278341	0	\N	\N	f	2025-12-10 12:22:07.042757	2025-12-10 12:22:24.278341
7	bob_smc	bob@sunshine.com	+91-9123456790	$2a$10$Vm8nc31FlrIs1sXTEXZobO4SarovAv8Uf/BESQdMHw8CZd1kXfj62	2	t	t	f	\N	2	\N	\N	f	2025-12-04 12:22:29.912709	2025-12-11 15:32:36.351615
71	logoca	logoca@gmail.com		$2a$10$e.NECRu0cFqcqnJOzigGKeNfuUQm0nGNbMKjarTBGmL37t7qJ6tSq	2	t	t	f	2025-12-11 15:33:19.400588	0	\N	\N	f	2025-12-10 12:20:40.771076	2025-12-11 15:33:19.400588
87	tetsdoc	testdoc@gmail.com		$2a$10$0N6Ydj5FcXuCaZvwbEPY8OGXC5DVeyzZxEAFq/VIqqPWGlhibZdpO	3	t	t	f	\N	0	\N	\N	f	2025-12-12 10:51:19.318091	2025-12-12 10:51:19.318091
88	recptest	recptest@gmail.com		$2a$10$fquA2P/zkR69WLwTsjDvM.N5UlpTxn8NyDMWEYyDZzLotjSqHhLkS	5	t	f	f	2025-12-12 10:52:20.765438	0	\N	\N	f	2025-12-12 10:52:05.178159	2025-12-12 10:52:20.765438
26	utdccgvjb	ca@gmail.com		$2a$10$Ms/1aiqgvfAqo/qkO6C7heXII/2TR01RpjY8aN0UFW8xoPNfVdcMC	2	t	t	f	2025-12-16 17:19:52.277869	0	\N	\N	f	2025-12-04 14:43:50.165074	2025-12-16 17:19:52.277869
30	doc1	doc@gmail.com		$2a$10$AKI4mab3oBEZLSc/z7SV2eM9RmGauaTS556CIzuKYh4VxmdCdjQR.	3	t	t	f	2025-12-17 11:21:07.030626	0	\N	\N	f	2025-12-04 15:46:19.526657	2025-12-17 11:21:07.030626
90	doccc	doccctest@gmail.com		$2a$10$LovWPScAPqZL..uZ520zlesrUnxuCS8CG9Kwwn/GxeU4sf.u/OUrm	3	t	t	f	\N	0	\N	\N	f	2025-12-12 11:01:29.423252	2025-12-12 11:01:29.423252
78	aef33	seddf@gmail.com		$2a$10$plTJzL51UDxxb23fQhCQ4eMkY/Bm/TJagrMNzkcJD.OmQuq84cxmu	11	t	t	f	\N	0	\N	\N	f	2025-12-11 10:20:28.864539	2025-12-11 10:20:28.864539
79	shanthimang	shnathiacc@manager.com		$2a$10$3he5XzJWbJ3k1A7dKdw.VevriAyKGFAbQZ.iO/VfKosERkTiLVk6C	11	t	t	f	2025-12-11 10:30:13.206441	0	\N	\N	f	2025-12-11 10:29:49.769561	2025-12-11 10:30:13.206441
76	manager	manager@acc.com		$2a$10$vCwZWi3vjkdcwxCrx.LBu.SEo.JH3tO1ffrSwl2w8N.0Tk5OBxzJW	11	t	t	f	2025-12-11 10:38:19.996091	0	\N	\N	f	2025-12-11 10:19:26.610135	2025-12-11 10:38:19.996091
75	accmang	accmang@gmail.com		$2a$10$4MPdlOYmkUn1Qgj04kUIeugTPi951M7bn4qkbCY42pFi.innjHEAq	11	t	t	f	2025-12-11 10:47:04.453387	0	\N	\N	f	2025-12-10 15:46:36.62547	2025-12-11 10:47:04.453387
83	doc12	doc1@sus.com		$2a$10$Chq/1ITrhwAffQq0oirrJOlVNYYqZsmIIce4.YG4yM3W3JiRxLt8O	3	t	t	f	2025-12-12 14:53:55.991084	0	\N	\N	f	2025-12-11 15:36:17.046982	2025-12-12 14:53:55.991084
80	client	clientadmin@sus.com		$2a$10$RZDdg8blG1ismZ3sW/Y0N.R9ou0Zm5RvEhw/F6AVVXyOpBgIQJEXW	2	t	t	f	2025-12-12 15:07:14.328339	0	\N	\N	f	2025-12-11 15:35:07.237875	2025-12-12 15:07:14.328339
84	recp123	recp@sus.com		$2a$10$GpCelvwrRQt2z/JUubAdFu7.GPxhk9BXUIVgfHPaIyro2EMxQZg16	5	t	f	f	2025-12-12 15:25:49.997307	0	\N	\N	f	2025-12-11 15:38:31.708997	2025-12-12 15:25:49.997307
102	doc1765862330107	doc1765862330105@test.com	1111111111	$2a$10$90PsargaD1c4nELKekLVP.K5bZtN03WetAQEmei5US/j8C0VQmrHK	3	t	f	f	\N	0	\N	\N	f	2025-12-16 10:48:50.159033	2025-12-16 10:48:50.159033
103	nurse1765862330159	nurse1765862330159@test.com	2222222222	$2a$10$9GeGm5sNSabTRe.SOoMZbu/JlYEZYfOgA7Rwz9NrIbs1J7IYe0Kiq	4	t	f	f	\N	0	\N	\N	f	2025-12-16 10:48:50.210758	2025-12-16 10:48:50.210758
93	nurse1765860539462	nurse1765860539461@test.com	8888888888	$2a$10$l5W9e0sJlqna2wJ7b33ar.ooJpu7xKD1f3PmFeN2A9p04Wij8GGeK	4	t	f	f	\N	0	\N	\N	f	2025-12-16 10:18:59.514798	2025-12-16 10:18:59.514798
105	dd_nurse	dd_nur_1765862364469@test.com	\N	$2a$10$8XFG3ohppM4xF1kLuAg5dO9SykiEDnaOPMX8EiT9NM3oF4JjUmOD.	4	t	t	f	\N	0	\N	\N	f	2025-12-16 10:49:24.529185	2025-12-16 10:49:24.529185
104	dd_doc	dd_doc_1765862364469@test.com	\N	$2a$10$8XFG3ohppM4xF1kLuAg5dO9SykiEDnaOPMX8EiT9NM3oF4JjUmOD.	3	t	t	f	2025-12-16 10:49:24.623733	0	\N	\N	f	2025-12-16 10:49:24.52749	2025-12-16 10:49:24.623733
94	nurse1765860626400	nurse1765860626399@test.com	8888888888	$2a$10$cvouGaw.Xf4zF1XcXb/dNOHjothjnFqWgJSk3zPqgH9BjuyUJgZKy	4	t	f	f	2025-12-16 10:20:26.572231	0	\N	\N	f	2025-12-16 10:20:26.451364	2025-12-16 10:20:26.572231
106	b_doc_1765863029829	b_doc_1765863029829@test.com	\N	$2a$10$VD.8v7iSZgJb2qkIzSiYKOq67vaTcKZWpH1vXJ/8S8IMC52DWqxC.	3	t	t	f	\N	0	\N	\N	f	2025-12-16 11:00:29.931514	2025-12-16 11:00:29.931514
107	b_nur_1765863029829	b_nur_1765863029829@test.com	\N	$2a$10$VD.8v7iSZgJb2qkIzSiYKOq67vaTcKZWpH1vXJ/8S8IMC52DWqxC.	4	t	t	f	\N	0	\N	\N	f	2025-12-16 11:00:29.937305	2025-12-16 11:00:29.937305
95	nurse1765860671690	nurse1765860671688@test.com	8888888888	$2a$10$6xpL1o9XuVerGcYMNXNrbuJF8H5CrV6ATFIeGKixojEt//S6S4fVa	4	t	f	f	2025-12-16 10:21:11.862057	0	\N	\N	f	2025-12-16 10:21:11.741251	2025-12-16 10:21:11.862057
108	b_doc_1765863068572	b_doc_1765863068572@test.com	\N	$2a$10$tBUe0IK.0AvyI/WxrJeU1OU55l6KZCasA5t9HBeA96RX98dTnMfhK	3	t	t	f	\N	0	\N	\N	f	2025-12-16 11:01:08.667392	2025-12-16 11:01:08.667392
109	b_doc_1765863091634	b_doc_1765863091634@test.com	\N	$2a$10$zB9LCvLlkdpOOFVmbi1WiuMSe4TiqjS7yn8jJvazruFInpYEpaTFy	3	t	t	f	\N	0	\N	\N	f	2025-12-16 11:01:31.730566	2025-12-16 11:01:31.730566
96	nurse1765860703088	nurse1765860703087@test.com	8888888888	$2a$10$a1cjjbOGk54pttuoyxxNduVOC6usjQ7lQIndxF1Dq7j1tTggGxDre	4	t	f	f	2025-12-16 10:21:43.255015	0	\N	\N	f	2025-12-16 10:21:43.140558	2025-12-16 10:21:43.255015
97	debugnurse1765860745474	debugnurse1765860745418@test.com	\N	$2a$10$MyqK4QZqEbtV/WtDoBelu.7JMzlG1I.aiwsObtcDYF2VOByLySkxm	4	t	f	f	\N	0	\N	\N	f	2025-12-16 10:22:25.474528	2025-12-16 10:22:25.474528
110	b_nur_1765863091634	b_nur_1765863091634@test.com	\N	$2a$10$zB9LCvLlkdpOOFVmbi1WiuMSe4TiqjS7yn8jJvazruFInpYEpaTFy	4	t	t	f	\N	0	\N	\N	f	2025-12-16 11:01:31.735583	2025-12-16 11:01:31.735583
111	b_doc_1765863129532	b_doc_1765863129532@test.com	\N	$2a$10$XXYd6hjoxLCUUBNrKJRJw.bya4ebiK07khFfe7PJLXeXRQOGU6Xg2	3	t	t	f	\N	0	\N	\N	f	2025-12-16 11:02:09.625576	2025-12-16 11:02:09.625576
98	nurse1765860783833	nurse1765860783832@test.com	8888888888	$2a$10$ScsoBZQpBSTcW.ZYChTbQue1ipa7k77tUHnxcbbI4xY4nST6Y/9oq	4	t	f	f	2025-12-16 10:23:03.99856	0	\N	\N	f	2025-12-16 10:23:03.88439	2025-12-16 10:23:03.99856
99	debugnurse1765860794660	debugnurse1765860794604@test.com	\N	$2a$10$MXCYwqE3SqoCHbquVHWOuel4J5wcOI5ijMPNtur8TCM9a1A1MiN1.	4	t	f	f	\N	0	\N	\N	f	2025-12-16 10:23:14.662414	2025-12-16 10:23:14.662414
112	b_nur_1765863129532	b_nur_1765863129532@test.com	\N	$2a$10$XXYd6hjoxLCUUBNrKJRJw.bya4ebiK07khFfe7PJLXeXRQOGU6Xg2	4	t	t	f	\N	0	\N	\N	f	2025-12-16 11:02:09.630796	2025-12-16 11:02:09.630796
100	doc1765862303817	doc1765862303816@test.com	1111111111	$2a$10$F1jlyF5V6RgQlbtVvWB2qOCHZWllF0JEAug0MOev9BLEDqK06srQW	3	t	f	f	\N	0	\N	\N	f	2025-12-16 10:48:23.867754	2025-12-16 10:48:23.867754
101	nurse1765862303869	nurse1765862303869@test.com	2222222222	$2a$10$MD4vtLLObnXZxnMnrbwXfeCxjNJKFeNEsH1pzCEmj.DGxhTuVfIOS	4	t	f	f	\N	0	\N	\N	f	2025-12-16 10:48:23.920316	2025-12-16 10:48:23.920316
114	b_nur_1765863140875	b_nur_1765863140875@test.com	\N	$2a$10$E.GeKc6ausHI2jqdQWimnuxXB2hcwoyIE.MRXQxyrGdTRu6M.HZjG	4	t	t	f	\N	0	\N	\N	f	2025-12-16 11:02:20.980154	2025-12-16 11:02:20.980154
113	b_doc_1765863140875	b_doc_1765863140875@test.com	\N	$2a$10$E.GeKc6ausHI2jqdQWimnuxXB2hcwoyIE.MRXQxyrGdTRu6M.HZjG	3	t	t	f	2025-12-16 11:02:21.078475	0	\N	\N	f	2025-12-16 11:02:20.973554	2025-12-16 11:02:21.078475
92	test mang2	testmanager2@gmail.com	6363737373	$2a$10$2CYfeyMaXhFoAMKOp/kBNuJQHpElhiQfSgdsQ.cGR8XFcDN8Kxrnm	40	t	t	f	2025-12-16 17:54:11.232721	0	\N	\N	f	2025-12-14 17:15:02.372289	2025-12-16 17:54:11.232721
115	b_doc_1765884410264	b_doc_1765884410264@test.com	\N	$2a$10$Pti2OysrZC6q8I3Ed5wzOOijy34LlPKHuW7m3jIMs1L/UVmvJIO9C	3	t	t	f	2025-12-16 16:56:50.460255	0	\N	\N	f	2025-12-16 16:56:50.358915	2025-12-16 16:56:50.460255
116	b_nur_1765884410264	b_nur_1765884410264@test.com	\N	$2a$10$Pti2OysrZC6q8I3Ed5wzOOijy34LlPKHuW7m3jIMs1L/UVmvJIO9C	4	t	t	f	\N	0	\N	\N	f	2025-12-16 16:56:50.365549	2025-12-16 16:56:50.365549
118	ecex1	exec1@gmail.com		$2a$10$M.2HZ9ANRjCB245vPoo50e5ulAaoBGbPjIqVK7PDLXCK4V9AnY4Ey	39	t	t	f	2025-12-17 11:22:01.254953	0	\N	\N	f	2025-12-16 18:08:26.077345	2025-12-17 11:22:01.254953
117	admin1aradhana	admin1@aradhana.com	8787676545	$2a$10$hdrqexF.L/cKMg6yXJ1gk.GkVI0dciLx42lcljab45RSggUTssn56	2	t	t	f	2025-12-16 17:18:21.097512	0	\N	\N	f	2025-12-16 17:15:36.11764	2025-12-16 17:18:21.097512
73	acc1	acc1@gmail.com		$2a$10$yQAAVkOZ/2bDdSYZu5Hm9uTfoNkFkgI04QUSJxRCbUK7QDQpV3iZO	9	t	t	f	2025-12-16 18:09:19.597178	0	\N	\N	f	2025-12-10 12:34:36.988901	2025-12-16 18:09:19.597178
29	recp	rec@gmail.com		$2a$10$TjF2jHBiXDdP3G2Yu3QzIO4iwu5M7hOyAWL7Ov/YcmDE86jwKwGyi	5	t	f	f	2025-12-16 18:12:31.495767	0	\N	\N	f	2025-12-04 15:18:27.769086	2025-12-16 18:12:31.495767
91	test mang	testmanager@gmail.com	6363737373	$2a$10$Wkdfdk4Y0m6UdTNpEAJYue0yVeaWFIXjBfCUjYeHvLRUJ227qZh0i	39	t	t	f	2025-12-16 18:08:44.11407	0	\N	\N	f	2025-12-14 17:04:38.512123	2025-12-16 18:08:44.11407
120	ak1	me1@ak.com	54645654	$2a$10$Gr4nNK6ydkqrLdnbDp870ua5b7C3MGMnMEJdJuCnj6cy6XgVr6i3a	39	t	t	f	2025-12-17 16:15:37.004965	0	\N	\N	f	2025-12-17 11:38:44.633024	2025-12-17 16:15:37.004965
74	accountant	acc@gktech.ai		$2a$10$sCmRFQTT/ub95b9iDji/3e8eqQSDMNIlbUqLYP4.2N4FuoDlbTZ0S	9	t	t	f	2025-12-17 14:52:15.296683	0	\N	\N	f	2025-12-10 13:17:36.40102	2025-12-17 14:52:15.296683
125	recep1ak	recep1@ak.com	565456764567	$2a$10$NJQOgXYoV0bTX74kV23hvuArnfHRY..DsRyuifTOVQKsmrrE4.YeO	5	t	f	f	2025-12-17 11:54:56.878451	0	\N	\N	f	2025-12-17 11:45:39.171465	2025-12-17 11:54:56.878451
119	admin1	admin1@ak.com	8787656765	$2a$10$1fZx/Y4swnF5cncc9BmEkuvOQyV3FHsKjCmUSP9OdX03BTpAFwuo6	2	t	t	f	2025-12-17 12:12:37.938285	0	\N	\N	f	2025-12-17 10:17:28.451481	2025-12-17 12:12:37.938285
127	doc2	doc2@ak.com	4535	$2a$10$p7WiMRctQBtBwJ21kFyljOw4ppcr0G3c0J9Ry/IpGIBI4YXbXJ4F6	3	t	t	f	\N	0	\N	\N	f	2025-12-17 12:15:12.253627	2025-12-17 12:15:12.253627
128	recep2ak	recep2@ak.com	8756765457	$2a$10$FeohrvHk7X4BsI5U23.Ud.nD88kVcl2tMFnaTBxTobq444L36rZxm	5	t	f	f	\N	0	\N	\N	f	2025-12-17 12:15:51.567499	2025-12-17 12:15:51.567499
130	admin23	aminf@dkfj.com		$2a$10$okX76wAuwGeB7JDGcdi.wOc1DEwzKRI6NaJyJyt7nCcVFHaqXOIoy	2	t	t	f	\N	0	\N	\N	f	2025-12-17 12:46:43.84368	2025-12-17 12:46:43.84368
126	doc1ak	doc1@ak.com	4565454543	$2a$10$F1tpwEZm/1zZeZFEHYRVSeKMmib6GnhnLeAo86Giy21/6xgsIaMqK	3	t	t	f	2025-12-17 15:12:16.326857	0	\N	\N	f	2025-12-17 11:48:41.599657	2025-12-17 15:12:16.326857
131	acc1ak	acc1@ak.com	8765679823	$2a$10$JN96NnXM6gUTmiWIQJG7KOGtlVBPFda96955EqajFnj7rfePgGw52	9	t	t	f	2025-12-17 16:17:50.468525	0	\N	\N	f	2025-12-17 16:17:32.18423	2025-12-17 16:17:50.468525
132	marketExec1	marketexec@kvhospital.com		$2a$10$3IWNY8mw6oVqvV9txRqPfOY3y.e54Gf/wl4FDo4tu2Y3jFS6e73pO	39	t	t	f	2025-12-17 23:46:36.214469	0	\N	\N	f	2025-12-17 23:46:18.617785	2025-12-17 23:46:36.214469
133	kvAccountant	accountant@kvhospital.com	12312463746	$2a$10$oeqFGbHwfFiF6gQR/1zg1uDVnme83ZKbgZA79AGEQZNSFdpB7v3TC	9	t	t	f	2025-12-18 02:00:40.53906	0	\N	\N	f	2025-12-18 00:14:14.327436	2025-12-18 02:00:40.53906
134	camry admin	admin@camryhospitalstest.com	8987645384	$2a$10$ljUcpoHIuJVPNkDwcBFwFOk6u5RTSEwVBvR9QU0EmwlOjnz2lEjRW	2	t	t	f	2025-12-18 07:47:54.819543	0	\N	\N	f	2025-12-18 07:46:41.913832	2025-12-18 07:47:54.819543
135	royf	doc1@camryhospitalstest.com	8794857638	$2a$10$Oed1Sz11mhJzwRo9Xoy4MeBS1odd7dlS6JZqHEzz8o7OXzkaG.gdC	3	t	t	f	\N	0	\N	\N	f	2025-12-18 07:52:22.267891	2025-12-18 07:52:22.267891
136	receptionistcamry	receptionist@camryhospitalstest.com	9761239874	$2a$10$uds35Yy5.oR6waGZMIRi1OcfAeG4h.rptmNXnwOY8qsyWL69VoN3W	5	t	f	f	\N	0	\N	\N	f	2025-12-18 07:53:13.053232	2025-12-18 07:53:13.053232
138	Markmanager	markmanager@camryhospitalstest.com	1234563234	$2a$10$QbPY1AKqRgv8vbNPCiMgGelDE1FfLxWZ.Gbh5d5Ge8KdZPi0YICG6	40	t	t	f	\N	0	\N	\N	f	2025-12-18 07:56:02.854324	2025-12-18 07:56:02.854324
1	superadmin	admin@phchms.com	1234567890	$2a$10$6DY4twOM8RYBL2./Hgd6Y.mSd.NG8hJhv2CR/z97CGX3Is1YFR64C	1	t	t	f	2025-12-18 10:04:13.525114	0	\N	\N	f	2025-12-04 10:46:10.121592	2025-12-18 10:04:13.525114
139	acccountantcamry	accountantca@camryhospitalstest.com	8938475628	$2a$10$1RO.wihDdscQ2M6I1f2uuuXcWovSujaBvKkAykxP4jm6X3iADxNw6	9	t	t	f	2025-12-18 10:51:35.417247	0	\N	\N	f	2025-12-18 07:57:04.642941	2025-12-18 10:51:35.417247
140	acctManager	acctmanager@camryhospitalstest.com	8794857368	$2a$10$TfsIOUkzWWLpnFhYm4n4LeIf2ZKbRBwQ0Ih3w7n6e3fNuH78T8uoe	11	t	t	f	2025-12-18 10:57:52.806849	0	\N	\N	f	2025-12-18 07:57:46.877587	2025-12-18 10:57:52.806849
137	Markexec	markexec@camryhospitalstest.com	8475937263	$2a$10$Y3NKptqAWmaB36xEYaHVSuMrgMDZv3bGKh.gn799b0I57PBhrZd8C	39	t	t	f	2025-12-18 10:58:20.594294	0	\N	\N	f	2025-12-18 07:55:07.661001	2025-12-18 10:58:20.594294
\.


--
-- TOC entry 5976 (class 0 OID 0)
-- Dependencies: 221
-- Name: appointments_appointment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointments_appointment_id_seq', 20, true);


--
-- TOC entry 5977 (class 0 OID 0)
-- Dependencies: 223
-- Name: billing_items_bill_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.billing_items_bill_item_id_seq', 1, false);


--
-- TOC entry 5978 (class 0 OID 0)
-- Dependencies: 225
-- Name: billings_bill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.billings_bill_id_seq', 1, false);


--
-- TOC entry 5979 (class 0 OID 0)
-- Dependencies: 227
-- Name: branch_departments_hospital_dept_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branch_departments_hospital_dept_id_seq', 50, true);


--
-- TOC entry 5980 (class 0 OID 0)
-- Dependencies: 229
-- Name: branch_services_branch_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branch_services_branch_service_id_seq', 58, true);


--
-- TOC entry 5981 (class 0 OID 0)
-- Dependencies: 231
-- Name: branches_branch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branches_branch_id_seq', 46, true);


--
-- TOC entry 5982 (class 0 OID 0)
-- Dependencies: 233
-- Name: client_modules_client_module_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.client_modules_client_module_id_seq', 1, false);


--
-- TOC entry 5983 (class 0 OID 0)
-- Dependencies: 235
-- Name: consultation_outcomes_outcome_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.consultation_outcomes_outcome_id_seq', 28, true);


--
-- TOC entry 5984 (class 0 OID 0)
-- Dependencies: 237
-- Name: departments_department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_department_id_seq', 27, true);


--
-- TOC entry 5985 (class 0 OID 0)
-- Dependencies: 239
-- Name: doctor_branch_departments_doc_hosp_dept_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_branch_departments_doc_hosp_dept_id_seq', 1, false);


--
-- TOC entry 5986 (class 0 OID 0)
-- Dependencies: 241
-- Name: doctor_branches_doc_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_branches_doc_hospital_id_seq', 33, true);


--
-- TOC entry 5987 (class 0 OID 0)
-- Dependencies: 243
-- Name: doctor_departments_doc_dept_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_departments_doc_dept_id_seq', 19, true);


--
-- TOC entry 5988 (class 0 OID 0)
-- Dependencies: 245
-- Name: doctor_shifts_doctor_shift_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_shifts_doctor_shift_id_seq', 1, false);


--
-- TOC entry 5989 (class 0 OID 0)
-- Dependencies: 247
-- Name: doctors_doctor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctors_doctor_id_seq', 34, true);


--
-- TOC entry 5990 (class 0 OID 0)
-- Dependencies: 249
-- Name: hospital_services_hosp_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hospital_services_hosp_service_id_seq', 23, true);


--
-- TOC entry 5991 (class 0 OID 0)
-- Dependencies: 251
-- Name: hospitals_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hospitals_hospital_id_seq', 39, true);


--
-- TOC entry 5992 (class 0 OID 0)
-- Dependencies: 253
-- Name: insurance_claims_claim_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.insurance_claims_claim_id_seq', 18, true);


--
-- TOC entry 5993 (class 0 OID 0)
-- Dependencies: 255
-- Name: mlc_entries_mlc_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mlc_entries_mlc_id_seq', 2, true);


--
-- TOC entry 5994 (class 0 OID 0)
-- Dependencies: 257
-- Name: modules_module_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.modules_module_id_seq', 8, true);


--
-- TOC entry 5995 (class 0 OID 0)
-- Dependencies: 259
-- Name: nurse_branches_nurse_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nurse_branches_nurse_hospital_id_seq', 16, true);


--
-- TOC entry 5996 (class 0 OID 0)
-- Dependencies: 261
-- Name: nurse_shifts_nurse_shift_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nurse_shifts_nurse_shift_id_seq', 1, false);


--
-- TOC entry 5997 (class 0 OID 0)
-- Dependencies: 263
-- Name: nurses_nurse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nurses_nurse_id_seq', 17, true);


--
-- TOC entry 5998 (class 0 OID 0)
-- Dependencies: 265
-- Name: opd_entries_opd_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.opd_entries_opd_id_seq', 50, true);


--
-- TOC entry 5999 (class 0 OID 0)
-- Dependencies: 267
-- Name: password_reset_tokens_token_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_reset_tokens_token_id_seq', 1, false);


--
-- TOC entry 6000 (class 0 OID 0)
-- Dependencies: 269
-- Name: patients_patient_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.patients_patient_id_seq', 38, true);


--
-- TOC entry 6001 (class 0 OID 0)
-- Dependencies: 271
-- Name: prescriptions_prescription_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prescriptions_prescription_id_seq', 14, true);


--
-- TOC entry 6002 (class 0 OID 0)
-- Dependencies: 273
-- Name: referral_doctor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_doctor_id_seq', 7, true);


--
-- TOC entry 6003 (class 0 OID 0)
-- Dependencies: 275
-- Name: referral_doctor_service_percentage_percentage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_doctor_service_percentage_percentage_id_seq', 18, true);


--
-- TOC entry 6004 (class 0 OID 0)
-- Dependencies: 277
-- Name: referral_doctors_referral_doctor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_doctors_referral_doctor_id_seq', 7, true);


--
-- TOC entry 6005 (class 0 OID 0)
-- Dependencies: 279
-- Name: referral_hospital_mapping_mapping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_hospital_mapping_mapping_id_seq', 13, true);


--
-- TOC entry 6006 (class 0 OID 0)
-- Dependencies: 281
-- Name: referral_hospitals_referral_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_hospitals_referral_hospital_id_seq', 22, true);


--
-- TOC entry 6007 (class 0 OID 0)
-- Dependencies: 283
-- Name: referral_patients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_patients_id_seq', 5, true);


--
-- TOC entry 6008 (class 0 OID 0)
-- Dependencies: 306
-- Name: referral_payment_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_payment_details_id_seq', 45, true);


--
-- TOC entry 6009 (class 0 OID 0)
-- Dependencies: 304
-- Name: referral_payment_header_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_payment_header_id_seq', 7, true);


--
-- TOC entry 6010 (class 0 OID 0)
-- Dependencies: 302
-- Name: referral_payment_upload_batch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_payment_upload_batch_id_seq', 6, true);


--
-- TOC entry 6011 (class 0 OID 0)
-- Dependencies: 285
-- Name: referral_payments_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_payments_payment_id_seq', 1, false);


--
-- TOC entry 6012 (class 0 OID 0)
-- Dependencies: 287
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 51, true);


--
-- TOC entry 6013 (class 0 OID 0)
-- Dependencies: 289
-- Name: services_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_service_id_seq', 88, true);


--
-- TOC entry 6014 (class 0 OID 0)
-- Dependencies: 291
-- Name: shift_branches_shift_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shift_branches_shift_hospital_id_seq', 1, false);


--
-- TOC entry 6015 (class 0 OID 0)
-- Dependencies: 293
-- Name: shifts_shift_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shifts_shift_id_seq', 1, false);


--
-- TOC entry 6016 (class 0 OID 0)
-- Dependencies: 296
-- Name: staff_branches_staff_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.staff_branches_staff_hospital_id_seq', 60, true);


--
-- TOC entry 6017 (class 0 OID 0)
-- Dependencies: 297
-- Name: staff_staff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.staff_staff_id_seq', 57, true);


--
-- TOC entry 6018 (class 0 OID 0)
-- Dependencies: 299
-- Name: user_sessions_session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_sessions_session_id_seq', 352, true);


--
-- TOC entry 6019 (class 0 OID 0)
-- Dependencies: 301
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 140, true);


--
-- TOC entry 5361 (class 2606 OID 27429)
-- Name: appointments appointments_appointment_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_appointment_number_key UNIQUE (appointment_number);


--
-- TOC entry 5363 (class 2606 OID 27431)
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (appointment_id);


--
-- TOC entry 5369 (class 2606 OID 27433)
-- Name: billing_items billing_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_pkey PRIMARY KEY (bill_item_id);


--
-- TOC entry 5371 (class 2606 OID 27435)
-- Name: billings billings_bill_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_bill_number_key UNIQUE (bill_number);


--
-- TOC entry 5373 (class 2606 OID 27437)
-- Name: billings billings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_pkey PRIMARY KEY (bill_id);


--
-- TOC entry 5378 (class 2606 OID 27439)
-- Name: branch_departments branch_departments_branch_id_department_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_departments
    ADD CONSTRAINT branch_departments_branch_id_department_id_key UNIQUE (branch_id, department_id);


--
-- TOC entry 5380 (class 2606 OID 27441)
-- Name: branch_departments branch_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_departments
    ADD CONSTRAINT branch_departments_pkey PRIMARY KEY (hospital_dept_id);


--
-- TOC entry 5382 (class 2606 OID 27443)
-- Name: branch_services branch_services_branch_id_service_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_services
    ADD CONSTRAINT branch_services_branch_id_service_id_key UNIQUE (branch_id, service_id);


--
-- TOC entry 5384 (class 2606 OID 27445)
-- Name: branch_services branch_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_services
    ADD CONSTRAINT branch_services_pkey PRIMARY KEY (branch_service_id);


--
-- TOC entry 5386 (class 2606 OID 27447)
-- Name: branches branches_hospital_id_branch_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_hospital_id_branch_code_key UNIQUE (hospital_id, branch_code);


--
-- TOC entry 5388 (class 2606 OID 27449)
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (branch_id);


--
-- TOC entry 5392 (class 2606 OID 27451)
-- Name: client_modules client_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules
    ADD CONSTRAINT client_modules_pkey PRIMARY KEY (client_module_id);


--
-- TOC entry 5394 (class 2606 OID 27453)
-- Name: client_modules client_modules_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules
    ADD CONSTRAINT client_modules_uuid_unique UNIQUE (uuid);


--
-- TOC entry 5398 (class 2606 OID 27455)
-- Name: consultation_outcomes consultation_outcomes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_outcomes
    ADD CONSTRAINT consultation_outcomes_pkey PRIMARY KEY (outcome_id);


--
-- TOC entry 5401 (class 2606 OID 27457)
-- Name: departments departments_department_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_department_code_key UNIQUE (department_code);


--
-- TOC entry 5403 (class 2606 OID 27459)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);


--
-- TOC entry 5405 (class 2606 OID 27461)
-- Name: doctor_branch_departments doctor_branch_departments_doctor_id_branch_id_department_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branch_departments
    ADD CONSTRAINT doctor_branch_departments_doctor_id_branch_id_department_id_key UNIQUE (doctor_id, branch_id, department_id);


--
-- TOC entry 5407 (class 2606 OID 27463)
-- Name: doctor_branch_departments doctor_branch_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branch_departments
    ADD CONSTRAINT doctor_branch_departments_pkey PRIMARY KEY (doc_hosp_dept_id);


--
-- TOC entry 5409 (class 2606 OID 27465)
-- Name: doctor_branches doctor_branches_doctor_id_branch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branches
    ADD CONSTRAINT doctor_branches_doctor_id_branch_id_key UNIQUE (doctor_id, branch_id);


--
-- TOC entry 5411 (class 2606 OID 27467)
-- Name: doctor_branches doctor_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branches
    ADD CONSTRAINT doctor_branches_pkey PRIMARY KEY (doc_hospital_id);


--
-- TOC entry 5413 (class 2606 OID 27469)
-- Name: doctor_departments doctor_departments_doctor_id_department_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_departments
    ADD CONSTRAINT doctor_departments_doctor_id_department_id_key UNIQUE (doctor_id, department_id);


--
-- TOC entry 5415 (class 2606 OID 27471)
-- Name: doctor_departments doctor_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_departments
    ADD CONSTRAINT doctor_departments_pkey PRIMARY KEY (doc_dept_id);


--
-- TOC entry 5417 (class 2606 OID 27473)
-- Name: doctor_shifts doctor_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_shifts
    ADD CONSTRAINT doctor_shifts_pkey PRIMARY KEY (doctor_shift_id);


--
-- TOC entry 5419 (class 2606 OID 27475)
-- Name: doctors doctors_doctor_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_doctor_code_key UNIQUE (doctor_code);


--
-- TOC entry 5421 (class 2606 OID 27477)
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (doctor_id);


--
-- TOC entry 5423 (class 2606 OID 27479)
-- Name: doctors doctors_registration_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_registration_number_key UNIQUE (registration_number);


--
-- TOC entry 5427 (class 2606 OID 27481)
-- Name: hospital_services hospital_services_hospital_id_branch_id_service_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospital_services
    ADD CONSTRAINT hospital_services_hospital_id_branch_id_service_code_key UNIQUE (hospital_id, branch_id, service_code);


--
-- TOC entry 5429 (class 2606 OID 27483)
-- Name: hospital_services hospital_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospital_services
    ADD CONSTRAINT hospital_services_pkey PRIMARY KEY (hosp_service_id);


--
-- TOC entry 5431 (class 2606 OID 27485)
-- Name: hospitals hospitals_hospital_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitals
    ADD CONSTRAINT hospitals_hospital_code_key UNIQUE (hospital_code);


--
-- TOC entry 5433 (class 2606 OID 27487)
-- Name: hospitals hospitals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitals
    ADD CONSTRAINT hospitals_pkey PRIMARY KEY (hospital_id);


--
-- TOC entry 5435 (class 2606 OID 27489)
-- Name: insurance_claims insurance_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_pkey PRIMARY KEY (claim_id);


--
-- TOC entry 5440 (class 2606 OID 27491)
-- Name: mlc_entries mlc_entries_mlc_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mlc_entries
    ADD CONSTRAINT mlc_entries_mlc_number_key UNIQUE (mlc_number);


--
-- TOC entry 5442 (class 2606 OID 27493)
-- Name: mlc_entries mlc_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mlc_entries
    ADD CONSTRAINT mlc_entries_pkey PRIMARY KEY (mlc_id);


--
-- TOC entry 5444 (class 2606 OID 27495)
-- Name: modules modules_module_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_module_code_key UNIQUE (module_code);


--
-- TOC entry 5446 (class 2606 OID 27497)
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (module_id);


--
-- TOC entry 5448 (class 2606 OID 27499)
-- Name: modules modules_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_uuid_unique UNIQUE (uuid);


--
-- TOC entry 5450 (class 2606 OID 27501)
-- Name: nurse_branches nurse_branches_nurse_id_branch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_branches
    ADD CONSTRAINT nurse_branches_nurse_id_branch_id_key UNIQUE (nurse_id, branch_id);


--
-- TOC entry 5452 (class 2606 OID 27503)
-- Name: nurse_branches nurse_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_branches
    ADD CONSTRAINT nurse_branches_pkey PRIMARY KEY (nurse_hospital_id);


--
-- TOC entry 5454 (class 2606 OID 27505)
-- Name: nurse_shifts nurse_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_shifts
    ADD CONSTRAINT nurse_shifts_pkey PRIMARY KEY (nurse_shift_id);


--
-- TOC entry 5458 (class 2606 OID 27507)
-- Name: nurses nurses_nurse_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses
    ADD CONSTRAINT nurses_nurse_code_key UNIQUE (nurse_code);


--
-- TOC entry 5460 (class 2606 OID 27509)
-- Name: nurses nurses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses
    ADD CONSTRAINT nurses_pkey PRIMARY KEY (nurse_id);


--
-- TOC entry 5462 (class 2606 OID 27511)
-- Name: nurses nurses_registration_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses
    ADD CONSTRAINT nurses_registration_number_key UNIQUE (registration_number);


--
-- TOC entry 5467 (class 2606 OID 27513)
-- Name: opd_entries opd_entries_opd_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_opd_number_key UNIQUE (opd_number);


--
-- TOC entry 5469 (class 2606 OID 27515)
-- Name: opd_entries opd_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_pkey PRIMARY KEY (opd_id);


--
-- TOC entry 5473 (class 2606 OID 27517)
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (token_id);


--
-- TOC entry 5475 (class 2606 OID 27519)
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- TOC entry 5480 (class 2606 OID 27521)
-- Name: patients patients_mrn_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_mrn_number_key UNIQUE (mrn_number);


--
-- TOC entry 5482 (class 2606 OID 27523)
-- Name: patients patients_patient_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_patient_code_key UNIQUE (patient_code);


--
-- TOC entry 5484 (class 2606 OID 27525)
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (patient_id);


--
-- TOC entry 5486 (class 2606 OID 27527)
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (prescription_id);


--
-- TOC entry 5488 (class 2606 OID 27529)
-- Name: referral_doctor_module referral_doctor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_module
    ADD CONSTRAINT referral_doctor_pkey PRIMARY KEY (id);


--
-- TOC entry 5492 (class 2606 OID 27531)
-- Name: referral_doctor_service_percentage_module referral_doctor_service_percentage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_service_percentage_module
    ADD CONSTRAINT referral_doctor_service_percentage_pkey PRIMARY KEY (percentage_id);


--
-- TOC entry 5494 (class 2606 OID 27533)
-- Name: referral_doctor_service_percentage_module referral_doctor_service_percentage_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_service_percentage_module
    ADD CONSTRAINT referral_doctor_service_percentage_uuid_unique UNIQUE (uuid);


--
-- TOC entry 5490 (class 2606 OID 27535)
-- Name: referral_doctor_module referral_doctor_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_module
    ADD CONSTRAINT referral_doctor_uuid_unique UNIQUE (uuid);


--
-- TOC entry 5497 (class 2606 OID 27537)
-- Name: referral_doctors referral_doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctors
    ADD CONSTRAINT referral_doctors_pkey PRIMARY KEY (referral_doctor_id);


--
-- TOC entry 5501 (class 2606 OID 27539)
-- Name: referral_hospital_mapping referral_hospital_mapping_branch_id_referral_hospital_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_hospital_mapping
    ADD CONSTRAINT referral_hospital_mapping_branch_id_referral_hospital_id_key UNIQUE (branch_id, referral_hospital_id);


--
-- TOC entry 5503 (class 2606 OID 27541)
-- Name: referral_hospital_mapping referral_hospital_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_hospital_mapping
    ADD CONSTRAINT referral_hospital_mapping_pkey PRIMARY KEY (mapping_id);


--
-- TOC entry 5505 (class 2606 OID 27543)
-- Name: referral_hospitals referral_hospitals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_hospitals
    ADD CONSTRAINT referral_hospitals_pkey PRIMARY KEY (referral_hospital_id);


--
-- TOC entry 5509 (class 2606 OID 27545)
-- Name: referral_patients referral_patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_patients
    ADD CONSTRAINT referral_patients_pkey PRIMARY KEY (id);


--
-- TOC entry 5511 (class 2606 OID 27547)
-- Name: referral_patients referral_patients_referral_patient_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_patients
    ADD CONSTRAINT referral_patients_referral_patient_id_key UNIQUE (referral_patient_id);


--
-- TOC entry 5569 (class 2606 OID 28222)
-- Name: referral_payment_details referral_payment_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_details
    ADD CONSTRAINT referral_payment_details_pkey PRIMARY KEY (id);


--
-- TOC entry 5571 (class 2606 OID 28224)
-- Name: referral_payment_details referral_payment_details_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_details
    ADD CONSTRAINT referral_payment_details_uuid_key UNIQUE (uuid);


--
-- TOC entry 5564 (class 2606 OID 28197)
-- Name: referral_payment_header referral_payment_header_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_header
    ADD CONSTRAINT referral_payment_header_pkey PRIMARY KEY (id);


--
-- TOC entry 5566 (class 2606 OID 28199)
-- Name: referral_payment_header referral_payment_header_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_header
    ADD CONSTRAINT referral_payment_header_uuid_key UNIQUE (uuid);


--
-- TOC entry 5559 (class 2606 OID 28179)
-- Name: referral_payment_upload_batch referral_payment_upload_batch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_upload_batch
    ADD CONSTRAINT referral_payment_upload_batch_pkey PRIMARY KEY (id);


--
-- TOC entry 5561 (class 2606 OID 28181)
-- Name: referral_payment_upload_batch referral_payment_upload_batch_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_upload_batch
    ADD CONSTRAINT referral_payment_upload_batch_uuid_key UNIQUE (uuid);


--
-- TOC entry 5516 (class 2606 OID 27549)
-- Name: referral_payments referral_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payments
    ADD CONSTRAINT referral_payments_pkey PRIMARY KEY (payment_id);


--
-- TOC entry 5518 (class 2606 OID 27551)
-- Name: referral_payments referral_payments_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payments
    ADD CONSTRAINT referral_payments_uuid_key UNIQUE (uuid);


--
-- TOC entry 5520 (class 2606 OID 27553)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 5522 (class 2606 OID 27555)
-- Name: roles roles_role_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_code_key UNIQUE (role_code);


--
-- TOC entry 5524 (class 2606 OID 27557)
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (service_id);


--
-- TOC entry 5526 (class 2606 OID 27559)
-- Name: services services_service_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_service_code_key UNIQUE (service_code);


--
-- TOC entry 5528 (class 2606 OID 27561)
-- Name: shift_branches shift_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_branches
    ADD CONSTRAINT shift_branches_pkey PRIMARY KEY (shift_hospital_id);


--
-- TOC entry 5530 (class 2606 OID 27563)
-- Name: shift_branches shift_branches_shift_id_branch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_branches
    ADD CONSTRAINT shift_branches_shift_id_branch_id_key UNIQUE (shift_id, branch_id);


--
-- TOC entry 5532 (class 2606 OID 27565)
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (shift_id);


--
-- TOC entry 5534 (class 2606 OID 27567)
-- Name: shifts shifts_shift_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_shift_code_key UNIQUE (shift_code);


--
-- TOC entry 5540 (class 2606 OID 27569)
-- Name: staff_branches staff_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_branches
    ADD CONSTRAINT staff_branches_pkey PRIMARY KEY (staff_hospital_id);


--
-- TOC entry 5542 (class 2606 OID 27571)
-- Name: staff_branches staff_branches_staff_id_branch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_branches
    ADD CONSTRAINT staff_branches_staff_id_branch_id_key UNIQUE (staff_id, branch_id);


--
-- TOC entry 5536 (class 2606 OID 27573)
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (staff_id);


--
-- TOC entry 5538 (class 2606 OID 27575)
-- Name: staff staff_staff_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_staff_code_key UNIQUE (staff_code);


--
-- TOC entry 5547 (class 2606 OID 27577)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);


--
-- TOC entry 5552 (class 2606 OID 27579)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5554 (class 2606 OID 27581)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5556 (class 2606 OID 27583)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5364 (class 1259 OID 27584)
-- Name: idx_appointments_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_date ON public.appointments USING btree (appointment_date);


--
-- TOC entry 5365 (class 1259 OID 27585)
-- Name: idx_appointments_doctor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_doctor ON public.appointments USING btree (doctor_id);


--
-- TOC entry 5366 (class 1259 OID 27586)
-- Name: idx_appointments_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_patient ON public.appointments USING btree (patient_id);


--
-- TOC entry 5367 (class 1259 OID 27587)
-- Name: idx_appointments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_status ON public.appointments USING btree (appointment_status);


--
-- TOC entry 5557 (class 1259 OID 28230)
-- Name: idx_batch_hospital; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_batch_hospital ON public.referral_payment_upload_batch USING btree (hospital_id);


--
-- TOC entry 5374 (class 1259 OID 27588)
-- Name: idx_billings_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_billings_date ON public.billings USING btree (bill_date);


--
-- TOC entry 5375 (class 1259 OID 27589)
-- Name: idx_billings_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_billings_patient ON public.billings USING btree (patient_id);


--
-- TOC entry 5376 (class 1259 OID 27590)
-- Name: idx_billings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_billings_status ON public.billings USING btree (bill_status);


--
-- TOC entry 5389 (class 1259 OID 27591)
-- Name: idx_branches_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_branches_active ON public.branches USING btree (is_active);


--
-- TOC entry 5390 (class 1259 OID 27592)
-- Name: idx_branches_hospital; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_branches_hospital ON public.branches USING btree (hospital_id);


--
-- TOC entry 5395 (class 1259 OID 27593)
-- Name: idx_client_modules_branch_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_client_modules_branch_level ON public.client_modules USING btree (client_id, module_id, branch_id) WHERE (branch_id IS NOT NULL);


--
-- TOC entry 5396 (class 1259 OID 27594)
-- Name: idx_client_modules_hospital_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_client_modules_hospital_level ON public.client_modules USING btree (client_id, module_id) WHERE (branch_id IS NULL);


--
-- TOC entry 5399 (class 1259 OID 27595)
-- Name: idx_consultations_referral; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultations_referral ON public.consultation_outcomes USING btree (referral_doctor_id);


--
-- TOC entry 5567 (class 1259 OID 28232)
-- Name: idx_details_header; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_details_header ON public.referral_payment_details USING btree (payment_header_id);


--
-- TOC entry 5424 (class 1259 OID 27596)
-- Name: idx_doctors_registration; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_doctors_registration ON public.doctors USING btree (registration_number);


--
-- TOC entry 5425 (class 1259 OID 27597)
-- Name: idx_doctors_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_doctors_user ON public.doctors USING btree (user_id);


--
-- TOC entry 5562 (class 1259 OID 28231)
-- Name: idx_header_batch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_header_batch ON public.referral_payment_header USING btree (batch_id);


--
-- TOC entry 5436 (class 1259 OID 27598)
-- Name: idx_mlc_mlc_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mlc_mlc_number ON public.mlc_entries USING btree (mlc_number);


--
-- TOC entry 5437 (class 1259 OID 27599)
-- Name: idx_mlc_opd_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mlc_opd_id ON public.mlc_entries USING btree (opd_id);


--
-- TOC entry 5438 (class 1259 OID 27600)
-- Name: idx_mlc_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mlc_patient_id ON public.mlc_entries USING btree (patient_id);


--
-- TOC entry 5455 (class 1259 OID 27601)
-- Name: idx_nurses_registration; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nurses_registration ON public.nurses USING btree (registration_number);


--
-- TOC entry 5456 (class 1259 OID 27602)
-- Name: idx_nurses_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nurses_user ON public.nurses USING btree (user_id);


--
-- TOC entry 5463 (class 1259 OID 27603)
-- Name: idx_opd_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_opd_date ON public.opd_entries USING btree (visit_date);


--
-- TOC entry 5464 (class 1259 OID 27604)
-- Name: idx_opd_doctor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_opd_doctor ON public.opd_entries USING btree (doctor_id);


--
-- TOC entry 5465 (class 1259 OID 27605)
-- Name: idx_opd_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_opd_patient ON public.opd_entries USING btree (patient_id);


--
-- TOC entry 5470 (class 1259 OID 27606)
-- Name: idx_password_reset_tokens_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- TOC entry 5471 (class 1259 OID 27607)
-- Name: idx_password_reset_tokens_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- TOC entry 5476 (class 1259 OID 27608)
-- Name: idx_patients_contact; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_contact ON public.patients USING btree (contact_number);


--
-- TOC entry 5477 (class 1259 OID 27609)
-- Name: idx_patients_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_email ON public.patients USING btree (email);


--
-- TOC entry 5478 (class 1259 OID 27610)
-- Name: idx_patients_mrn; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_mrn ON public.patients USING btree (mrn_number);


--
-- TOC entry 5495 (class 1259 OID 27611)
-- Name: idx_referral_doctors_hospital; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_doctors_hospital ON public.referral_doctors USING btree (referral_hospital_id);


--
-- TOC entry 5498 (class 1259 OID 27612)
-- Name: idx_referral_mapping_branch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_mapping_branch ON public.referral_hospital_mapping USING btree (branch_id);


--
-- TOC entry 5499 (class 1259 OID 27613)
-- Name: idx_referral_mapping_hospital; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_mapping_hospital ON public.referral_hospital_mapping USING btree (referral_hospital_id);


--
-- TOC entry 5506 (class 1259 OID 27614)
-- Name: idx_referral_patients_doctor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_patients_doctor ON public.referral_patients USING btree (referral_doctor_id);


--
-- TOC entry 5507 (class 1259 OID 27615)
-- Name: idx_referral_patients_mobile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_patients_mobile ON public.referral_patients USING btree (mobile_number);


--
-- TOC entry 5512 (class 1259 OID 27616)
-- Name: idx_referral_payments_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_payments_date ON public.referral_payments USING btree (payment_date);


--
-- TOC entry 5513 (class 1259 OID 27617)
-- Name: idx_referral_payments_doctor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_payments_doctor ON public.referral_payments USING btree (referral_doctor_id);


--
-- TOC entry 5514 (class 1259 OID 27618)
-- Name: idx_referral_payments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_payments_status ON public.referral_payments USING btree (payment_status);


--
-- TOC entry 5543 (class 1259 OID 27619)
-- Name: idx_user_sessions_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_is_active ON public.user_sessions USING btree (is_active);


--
-- TOC entry 5544 (class 1259 OID 27620)
-- Name: idx_user_sessions_token_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_token_hash ON public.user_sessions USING btree (token_hash);


--
-- TOC entry 5545 (class 1259 OID 27621)
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- TOC entry 5548 (class 1259 OID 27622)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 5549 (class 1259 OID 27623)
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone_number);


--
-- TOC entry 5550 (class 1259 OID 27624)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role_id);


--
-- TOC entry 5660 (class 2620 OID 27625)
-- Name: appointments update_appointments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5661 (class 2620 OID 27626)
-- Name: billings update_billings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_billings_updated_at BEFORE UPDATE ON public.billings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5662 (class 2620 OID 27627)
-- Name: branch_departments update_branch_departments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_branch_departments_updated_at BEFORE UPDATE ON public.branch_departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5663 (class 2620 OID 27628)
-- Name: branches update_branches_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5664 (class 2620 OID 27629)
-- Name: client_modules update_client_modules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_client_modules_updated_at BEFORE UPDATE ON public.client_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_ist();


--
-- TOC entry 5665 (class 2620 OID 27630)
-- Name: departments update_departments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5666 (class 2620 OID 27631)
-- Name: doctor_branches update_doctor_branches_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_doctor_branches_updated_at BEFORE UPDATE ON public.doctor_branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5667 (class 2620 OID 27632)
-- Name: doctor_shifts update_doctor_shifts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_doctor_shifts_updated_at BEFORE UPDATE ON public.doctor_shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5668 (class 2620 OID 27633)
-- Name: doctors update_doctors_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5669 (class 2620 OID 27634)
-- Name: hospital_services update_hospital_services_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_hospital_services_updated_at BEFORE UPDATE ON public.hospital_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5670 (class 2620 OID 27635)
-- Name: hospitals update_hospitals_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON public.hospitals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5671 (class 2620 OID 27636)
-- Name: insurance_claims update_insurance_claims_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_insurance_claims_updated_at BEFORE UPDATE ON public.insurance_claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5672 (class 2620 OID 27637)
-- Name: modules update_modules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_ist();


--
-- TOC entry 5673 (class 2620 OID 27638)
-- Name: nurse_branches update_nurse_branches_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_nurse_branches_updated_at BEFORE UPDATE ON public.nurse_branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5674 (class 2620 OID 27639)
-- Name: nurse_shifts update_nurse_shifts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_nurse_shifts_updated_at BEFORE UPDATE ON public.nurse_shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5675 (class 2620 OID 27640)
-- Name: nurses update_nurses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_nurses_updated_at BEFORE UPDATE ON public.nurses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5676 (class 2620 OID 27641)
-- Name: opd_entries update_opd_entries_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_opd_entries_updated_at BEFORE UPDATE ON public.opd_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5677 (class 2620 OID 27642)
-- Name: patients update_patients_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5679 (class 2620 OID 27643)
-- Name: referral_doctor_service_percentage_module update_referral_doctor_service_percentage_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_referral_doctor_service_percentage_updated_at BEFORE UPDATE ON public.referral_doctor_service_percentage_module FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_ist();


--
-- TOC entry 5678 (class 2620 OID 27644)
-- Name: referral_doctor_module update_referral_doctor_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_referral_doctor_updated_at BEFORE UPDATE ON public.referral_doctor_module FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_ist();


--
-- TOC entry 5680 (class 2620 OID 27645)
-- Name: referral_doctors update_referral_doctors_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_referral_doctors_updated_at BEFORE UPDATE ON public.referral_doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5681 (class 2620 OID 27646)
-- Name: referral_hospitals update_referral_hospitals_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_referral_hospitals_updated_at BEFORE UPDATE ON public.referral_hospitals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5682 (class 2620 OID 27647)
-- Name: referral_payments update_referral_payments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_referral_payments_updated_at BEFORE UPDATE ON public.referral_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_ist();


--
-- TOC entry 5683 (class 2620 OID 27648)
-- Name: roles update_roles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5684 (class 2620 OID 27649)
-- Name: services update_services_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5685 (class 2620 OID 27650)
-- Name: shifts update_shifts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5687 (class 2620 OID 27651)
-- Name: staff_branches update_staff_branches_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_staff_branches_updated_at BEFORE UPDATE ON public.staff_branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5686 (class 2620 OID 27652)
-- Name: staff update_staff_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5688 (class 2620 OID 27653)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5572 (class 2606 OID 27654)
-- Name: appointments appointments_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5573 (class 2606 OID 27659)
-- Name: appointments appointments_cancelled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5574 (class 2606 OID 27664)
-- Name: appointments appointments_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5575 (class 2606 OID 27669)
-- Name: appointments appointments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5576 (class 2606 OID 27674)
-- Name: appointments appointments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5577 (class 2606 OID 27679)
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE SET NULL;


--
-- TOC entry 5578 (class 2606 OID 27684)
-- Name: billing_items billing_items_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.billings(bill_id) ON DELETE CASCADE;


--
-- TOC entry 5579 (class 2606 OID 27689)
-- Name: billing_items billing_items_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5580 (class 2606 OID 27694)
-- Name: billing_items billing_items_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE SET NULL;


--
-- TOC entry 5581 (class 2606 OID 27699)
-- Name: billing_items billing_items_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(service_id) ON DELETE SET NULL;


--
-- TOC entry 5582 (class 2606 OID 27704)
-- Name: billings billings_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5583 (class 2606 OID 27709)
-- Name: billings billings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5584 (class 2606 OID 27714)
-- Name: billings billings_opd_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_opd_id_fkey FOREIGN KEY (opd_id) REFERENCES public.opd_entries(opd_id) ON DELETE SET NULL;


--
-- TOC entry 5585 (class 2606 OID 27719)
-- Name: billings billings_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- TOC entry 5586 (class 2606 OID 27724)
-- Name: branch_departments branch_departments_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_departments
    ADD CONSTRAINT branch_departments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5587 (class 2606 OID 27729)
-- Name: branch_departments branch_departments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_departments
    ADD CONSTRAINT branch_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE CASCADE;


--
-- TOC entry 5588 (class 2606 OID 27734)
-- Name: branch_services branch_services_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_services
    ADD CONSTRAINT branch_services_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5589 (class 2606 OID 27739)
-- Name: branch_services branch_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_services
    ADD CONSTRAINT branch_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(service_id) ON DELETE CASCADE;


--
-- TOC entry 5590 (class 2606 OID 27744)
-- Name: branches branches_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE;


--
-- TOC entry 5591 (class 2606 OID 27749)
-- Name: client_modules client_modules_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules
    ADD CONSTRAINT client_modules_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5592 (class 2606 OID 27754)
-- Name: client_modules client_modules_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules
    ADD CONSTRAINT client_modules_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE;


--
-- TOC entry 5593 (class 2606 OID 27759)
-- Name: client_modules client_modules_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules
    ADD CONSTRAINT client_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(module_id) ON DELETE CASCADE;


--
-- TOC entry 5594 (class 2606 OID 27764)
-- Name: consultation_outcomes consultation_outcomes_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_outcomes
    ADD CONSTRAINT consultation_outcomes_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id);


--
-- TOC entry 5595 (class 2606 OID 27769)
-- Name: consultation_outcomes consultation_outcomes_opd_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_outcomes
    ADD CONSTRAINT consultation_outcomes_opd_id_fkey FOREIGN KEY (opd_id) REFERENCES public.opd_entries(opd_id);


--
-- TOC entry 5596 (class 2606 OID 27774)
-- Name: consultation_outcomes consultation_outcomes_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_outcomes
    ADD CONSTRAINT consultation_outcomes_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- TOC entry 5597 (class 2606 OID 27779)
-- Name: consultation_outcomes consultation_outcomes_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_outcomes
    ADD CONSTRAINT consultation_outcomes_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(prescription_id);


--
-- TOC entry 5598 (class 2606 OID 27784)
-- Name: consultation_outcomes consultation_outcomes_referral_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_outcomes
    ADD CONSTRAINT consultation_outcomes_referral_doctor_id_fkey FOREIGN KEY (referral_doctor_id) REFERENCES public.referral_doctors(referral_doctor_id);


--
-- TOC entry 5599 (class 2606 OID 27789)
-- Name: doctor_branch_departments doctor_branch_departments_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branch_departments
    ADD CONSTRAINT doctor_branch_departments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5600 (class 2606 OID 27794)
-- Name: doctor_branch_departments doctor_branch_departments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branch_departments
    ADD CONSTRAINT doctor_branch_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE CASCADE;


--
-- TOC entry 5601 (class 2606 OID 27799)
-- Name: doctor_branch_departments doctor_branch_departments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branch_departments
    ADD CONSTRAINT doctor_branch_departments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5602 (class 2606 OID 27804)
-- Name: doctor_branches doctor_branches_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branches
    ADD CONSTRAINT doctor_branches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5603 (class 2606 OID 27809)
-- Name: doctor_branches doctor_branches_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branches
    ADD CONSTRAINT doctor_branches_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5604 (class 2606 OID 27814)
-- Name: doctor_departments doctor_departments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_departments
    ADD CONSTRAINT doctor_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE CASCADE;


--
-- TOC entry 5605 (class 2606 OID 27819)
-- Name: doctor_departments doctor_departments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_departments
    ADD CONSTRAINT doctor_departments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5606 (class 2606 OID 27824)
-- Name: doctor_shifts doctor_shifts_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_shifts
    ADD CONSTRAINT doctor_shifts_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5607 (class 2606 OID 27829)
-- Name: doctor_shifts doctor_shifts_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_shifts
    ADD CONSTRAINT doctor_shifts_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5608 (class 2606 OID 27834)
-- Name: doctor_shifts doctor_shifts_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_shifts
    ADD CONSTRAINT doctor_shifts_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5609 (class 2606 OID 27839)
-- Name: doctor_shifts doctor_shifts_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_shifts
    ADD CONSTRAINT doctor_shifts_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(shift_id) ON DELETE CASCADE;


--
-- TOC entry 5610 (class 2606 OID 27844)
-- Name: doctors doctors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5611 (class 2606 OID 27849)
-- Name: hospital_services hospital_services_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospital_services
    ADD CONSTRAINT hospital_services_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5612 (class 2606 OID 27854)
-- Name: hospital_services hospital_services_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospital_services
    ADD CONSTRAINT hospital_services_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE;


--
-- TOC entry 5613 (class 2606 OID 27859)
-- Name: insurance_claims insurance_claims_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5614 (class 2606 OID 27864)
-- Name: insurance_claims insurance_claims_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE;


--
-- TOC entry 5615 (class 2606 OID 27869)
-- Name: mlc_entries mlc_entries_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mlc_entries
    ADD CONSTRAINT mlc_entries_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);


--
-- TOC entry 5616 (class 2606 OID 27874)
-- Name: mlc_entries mlc_entries_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mlc_entries
    ADD CONSTRAINT mlc_entries_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id);


--
-- TOC entry 5617 (class 2606 OID 27879)
-- Name: mlc_entries mlc_entries_opd_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mlc_entries
    ADD CONSTRAINT mlc_entries_opd_id_fkey FOREIGN KEY (opd_id) REFERENCES public.opd_entries(opd_id);


--
-- TOC entry 5618 (class 2606 OID 27884)
-- Name: mlc_entries mlc_entries_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mlc_entries
    ADD CONSTRAINT mlc_entries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- TOC entry 5619 (class 2606 OID 27889)
-- Name: nurse_branches nurse_branches_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_branches
    ADD CONSTRAINT nurse_branches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5620 (class 2606 OID 27894)
-- Name: nurse_branches nurse_branches_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_branches
    ADD CONSTRAINT nurse_branches_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5621 (class 2606 OID 27899)
-- Name: nurse_branches nurse_branches_nurse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_branches
    ADD CONSTRAINT nurse_branches_nurse_id_fkey FOREIGN KEY (nurse_id) REFERENCES public.nurses(nurse_id) ON DELETE CASCADE;


--
-- TOC entry 5622 (class 2606 OID 27904)
-- Name: nurse_shifts nurse_shifts_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_shifts
    ADD CONSTRAINT nurse_shifts_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5623 (class 2606 OID 27909)
-- Name: nurse_shifts nurse_shifts_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_shifts
    ADD CONSTRAINT nurse_shifts_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5624 (class 2606 OID 27914)
-- Name: nurse_shifts nurse_shifts_nurse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_shifts
    ADD CONSTRAINT nurse_shifts_nurse_id_fkey FOREIGN KEY (nurse_id) REFERENCES public.nurses(nurse_id) ON DELETE CASCADE;


--
-- TOC entry 5625 (class 2606 OID 27919)
-- Name: nurse_shifts nurse_shifts_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_shifts
    ADD CONSTRAINT nurse_shifts_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(shift_id) ON DELETE CASCADE;


--
-- TOC entry 5626 (class 2606 OID 27924)
-- Name: nurses nurses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses
    ADD CONSTRAINT nurses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5627 (class 2606 OID 27929)
-- Name: opd_entries opd_entries_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id) ON DELETE SET NULL;


--
-- TOC entry 5628 (class 2606 OID 27934)
-- Name: opd_entries opd_entries_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5629 (class 2606 OID 27939)
-- Name: opd_entries opd_entries_checked_in_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_checked_in_by_fkey FOREIGN KEY (checked_in_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5630 (class 2606 OID 27944)
-- Name: opd_entries opd_entries_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5631 (class 2606 OID 27949)
-- Name: opd_entries opd_entries_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5632 (class 2606 OID 27954)
-- Name: opd_entries opd_entries_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- TOC entry 5633 (class 2606 OID 27959)
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5634 (class 2606 OID 27964)
-- Name: prescriptions prescriptions_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);


--
-- TOC entry 5635 (class 2606 OID 27969)
-- Name: prescriptions prescriptions_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id);


--
-- TOC entry 5636 (class 2606 OID 27974)
-- Name: prescriptions prescriptions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- TOC entry 5637 (class 2606 OID 27979)
-- Name: referral_doctor_module referral_doctor_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_module
    ADD CONSTRAINT referral_doctor_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE SET NULL;


--
-- TOC entry 5638 (class 2606 OID 27984)
-- Name: referral_doctor_module referral_doctor_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_module
    ADD CONSTRAINT referral_doctor_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5640 (class 2606 OID 27989)
-- Name: referral_doctor_service_percentage_module referral_doctor_service_percentage_referral_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_service_percentage_module
    ADD CONSTRAINT referral_doctor_service_percentage_referral_doctor_id_fkey FOREIGN KEY (referral_doctor_id) REFERENCES public.referral_doctor_module(id) ON DELETE CASCADE;


--
-- TOC entry 5639 (class 2606 OID 27994)
-- Name: referral_doctor_module referral_doctor_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_module
    ADD CONSTRAINT referral_doctor_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.hospitals(hospital_id) ON DELETE SET NULL;


--
-- TOC entry 5641 (class 2606 OID 27999)
-- Name: referral_doctors referral_doctors_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctors
    ADD CONSTRAINT referral_doctors_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 5642 (class 2606 OID 28004)
-- Name: referral_doctors referral_doctors_referral_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctors
    ADD CONSTRAINT referral_doctors_referral_hospital_id_fkey FOREIGN KEY (referral_hospital_id) REFERENCES public.referral_hospitals(referral_hospital_id) ON DELETE CASCADE;


--
-- TOC entry 5643 (class 2606 OID 28009)
-- Name: referral_hospital_mapping referral_hospital_mapping_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_hospital_mapping
    ADD CONSTRAINT referral_hospital_mapping_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5644 (class 2606 OID 28014)
-- Name: referral_hospital_mapping referral_hospital_mapping_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_hospital_mapping
    ADD CONSTRAINT referral_hospital_mapping_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 5645 (class 2606 OID 28019)
-- Name: referral_hospital_mapping referral_hospital_mapping_referral_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_hospital_mapping
    ADD CONSTRAINT referral_hospital_mapping_referral_hospital_id_fkey FOREIGN KEY (referral_hospital_id) REFERENCES public.referral_hospitals(referral_hospital_id) ON DELETE CASCADE;


--
-- TOC entry 5646 (class 2606 OID 28024)
-- Name: referral_hospitals referral_hospitals_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_hospitals
    ADD CONSTRAINT referral_hospitals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 5647 (class 2606 OID 28029)
-- Name: referral_patients referral_patients_referral_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_patients
    ADD CONSTRAINT referral_patients_referral_doctor_id_fkey FOREIGN KEY (referral_doctor_id) REFERENCES public.referral_doctor_module(id) ON DELETE SET NULL;


--
-- TOC entry 5659 (class 2606 OID 28225)
-- Name: referral_payment_details referral_payment_details_payment_header_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_details
    ADD CONSTRAINT referral_payment_details_payment_header_id_fkey FOREIGN KEY (payment_header_id) REFERENCES public.referral_payment_header(id) ON DELETE CASCADE;


--
-- TOC entry 5658 (class 2606 OID 28200)
-- Name: referral_payment_header referral_payment_header_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_header
    ADD CONSTRAINT referral_payment_header_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.referral_payment_upload_batch(id) ON DELETE CASCADE;


--
-- TOC entry 5648 (class 2606 OID 28034)
-- Name: referral_payments referral_payments_hosp_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payments
    ADD CONSTRAINT referral_payments_hosp_service_id_fkey FOREIGN KEY (hosp_service_id) REFERENCES public.hospital_services(hosp_service_id) ON DELETE SET NULL;


--
-- TOC entry 5649 (class 2606 OID 28039)
-- Name: referral_payments referral_payments_referral_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payments
    ADD CONSTRAINT referral_payments_referral_doctor_id_fkey FOREIGN KEY (referral_doctor_id) REFERENCES public.referral_doctor_module(id) ON DELETE CASCADE;


--
-- TOC entry 5650 (class 2606 OID 28044)
-- Name: shift_branches shift_branches_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_branches
    ADD CONSTRAINT shift_branches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5651 (class 2606 OID 28049)
-- Name: shift_branches shift_branches_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_branches
    ADD CONSTRAINT shift_branches_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(shift_id) ON DELETE CASCADE;


--
-- TOC entry 5653 (class 2606 OID 28054)
-- Name: staff_branches staff_branches_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_branches
    ADD CONSTRAINT staff_branches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5654 (class 2606 OID 28059)
-- Name: staff_branches staff_branches_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_branches
    ADD CONSTRAINT staff_branches_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5655 (class 2606 OID 28064)
-- Name: staff_branches staff_branches_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_branches
    ADD CONSTRAINT staff_branches_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(staff_id) ON DELETE CASCADE;


--
-- TOC entry 5652 (class 2606 OID 28069)
-- Name: staff staff_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5656 (class 2606 OID 28074)
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5657 (class 2606 OID 28079)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE RESTRICT;


-- Completed on 2025-12-18 11:03:57

--
-- PostgreSQL database dump complete
--

\unrestrict BjcyatocHaidf0OnFESZZsFJLvzsQ1cHFzhMZiCvjNbFUxMHaiNtla4lS9easLF

