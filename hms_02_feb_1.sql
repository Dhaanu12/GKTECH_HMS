--
-- PostgreSQL database dump
--

\restrict r35lsYqclFAsems7SgG62AhJ0PqogBxqlfArsWlNHoAamvSapmfaXHNk1ivFP7b

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-02-02 10:53:32

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
-- TOC entry 2 (class 3079 OID 20062)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5995 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 354 (class 1255 OID 20100)
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
-- TOC entry 353 (class 1255 OID 20101)
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
-- TOC entry 220 (class 1259 OID 20102)
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
    CONSTRAINT appointments_gender_check CHECK (((gender)::text = ANY (ARRAY[('Male'::character varying)::text, ('Female'::character varying)::text, ('Other'::character varying)::text, ('Pediatric'::character varying)::text])))
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 20119)
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
-- TOC entry 5996 (class 0 OID 0)
-- Dependencies: 221
-- Name: appointments_appointment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointments_appointment_id_seq OWNED BY public.appointments.appointment_id;


--
-- TOC entry 222 (class 1259 OID 20120)
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
-- TOC entry 223 (class 1259 OID 20129)
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
-- TOC entry 5997 (class 0 OID 0)
-- Dependencies: 223
-- Name: billing_items_bill_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.billing_items_bill_item_id_seq OWNED BY public.billing_items.bill_item_id;


--
-- TOC entry 224 (class 1259 OID 20130)
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
-- TOC entry 225 (class 1259 OID 20148)
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
-- TOC entry 5998 (class 0 OID 0)
-- Dependencies: 225
-- Name: billings_bill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.billings_bill_id_seq OWNED BY public.billings.bill_id;


--
-- TOC entry 226 (class 1259 OID 20149)
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
-- TOC entry 227 (class 1259 OID 20158)
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
-- TOC entry 5999 (class 0 OID 0)
-- Dependencies: 227
-- Name: branch_departments_hospital_dept_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branch_departments_hospital_dept_id_seq OWNED BY public.branch_departments.hospital_dept_id;


--
-- TOC entry 228 (class 1259 OID 20159)
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
-- TOC entry 229 (class 1259 OID 20168)
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
-- TOC entry 6000 (class 0 OID 0)
-- Dependencies: 229
-- Name: branch_services_branch_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branch_services_branch_service_id_seq OWNED BY public.branch_services.branch_service_id;


--
-- TOC entry 230 (class 1259 OID 20169)
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
    enabled_modules jsonb,
    consultation_rooms integer DEFAULT 0,
    daycare_available boolean DEFAULT false,
    daycare_beds integer DEFAULT 0,
    clinic_schedule jsonb
);


ALTER TABLE public.branches OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 20186)
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
-- TOC entry 6001 (class 0 OID 0)
-- Dependencies: 231
-- Name: branches_branch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branches_branch_id_seq OWNED BY public.branches.branch_id;


--
-- TOC entry 232 (class 1259 OID 20187)
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
-- TOC entry 233 (class 1259 OID 20199)
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
-- TOC entry 6002 (class 0 OID 0)
-- Dependencies: 233
-- Name: client_modules_client_module_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.client_modules_client_module_id_seq OWNED BY public.client_modules.client_module_id;


--
-- TOC entry 234 (class 1259 OID 20200)
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
-- TOC entry 235 (class 1259 OID 20211)
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
-- TOC entry 6003 (class 0 OID 0)
-- Dependencies: 235
-- Name: consultation_outcomes_outcome_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.consultation_outcomes_outcome_id_seq OWNED BY public.consultation_outcomes.outcome_id;


--
-- TOC entry 236 (class 1259 OID 20212)
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
-- TOC entry 237 (class 1259 OID 20223)
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
-- TOC entry 6004 (class 0 OID 0)
-- Dependencies: 237
-- Name: departments_department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_department_id_seq OWNED BY public.departments.department_id;


--
-- TOC entry 238 (class 1259 OID 20224)
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
-- TOC entry 239 (class 1259 OID 20233)
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
-- TOC entry 6005 (class 0 OID 0)
-- Dependencies: 239
-- Name: doctor_branch_departments_doc_hosp_dept_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_branch_departments_doc_hosp_dept_id_seq OWNED BY public.doctor_branch_departments.doc_hosp_dept_id;


--
-- TOC entry 240 (class 1259 OID 20234)
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
-- TOC entry 241 (class 1259 OID 20245)
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
-- TOC entry 6006 (class 0 OID 0)
-- Dependencies: 241
-- Name: doctor_branches_doc_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_branches_doc_hospital_id_seq OWNED BY public.doctor_branches.doc_hospital_id;


--
-- TOC entry 242 (class 1259 OID 20246)
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
-- TOC entry 243 (class 1259 OID 20254)
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
-- TOC entry 6007 (class 0 OID 0)
-- Dependencies: 243
-- Name: doctor_departments_doc_dept_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_departments_doc_dept_id_seq OWNED BY public.doctor_departments.doc_dept_id;


--
-- TOC entry 244 (class 1259 OID 20255)
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
-- TOC entry 245 (class 1259 OID 20270)
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
-- TOC entry 6008 (class 0 OID 0)
-- Dependencies: 245
-- Name: doctor_shifts_doctor_shift_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_shifts_doctor_shift_id_seq OWNED BY public.doctor_shifts.doctor_shift_id;


--
-- TOC entry 313 (class 1259 OID 21477)
-- Name: doctor_weekly_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_weekly_schedules (
    schedule_id integer NOT NULL,
    doctor_id integer NOT NULL,
    branch_id integer NOT NULL,
    day_of_week character varying(10),
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    avg_consultation_time integer DEFAULT 15,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT doctor_weekly_schedules_day_of_week_check CHECK (((day_of_week)::text = ANY ((ARRAY['Monday'::character varying, 'Tuesday'::character varying, 'Wednesday'::character varying, 'Thursday'::character varying, 'Friday'::character varying, 'Saturday'::character varying, 'Sunday'::character varying])::text[])))
);


ALTER TABLE public.doctor_weekly_schedules OWNER TO postgres;

--
-- TOC entry 312 (class 1259 OID 21476)
-- Name: doctor_weekly_schedules_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctor_weekly_schedules_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_weekly_schedules_schedule_id_seq OWNER TO postgres;

--
-- TOC entry 6009 (class 0 OID 0)
-- Dependencies: 312
-- Name: doctor_weekly_schedules_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_weekly_schedules_schedule_id_seq OWNED BY public.doctor_weekly_schedules.schedule_id;


--
-- TOC entry 246 (class 1259 OID 20271)
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
-- TOC entry 247 (class 1259 OID 20288)
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
-- TOC entry 6010 (class 0 OID 0)
-- Dependencies: 247
-- Name: doctors_doctor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctors_doctor_id_seq OWNED BY public.doctors.doctor_id;


--
-- TOC entry 248 (class 1259 OID 20289)
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
-- TOC entry 6011 (class 0 OID 0)
-- Dependencies: 248
-- Name: COLUMN hospital_services.gst_rate; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.hospital_services.gst_rate IS 'GST percentage rate for this service (0-100)';


--
-- TOC entry 249 (class 1259 OID 20304)
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
-- TOC entry 6012 (class 0 OID 0)
-- Dependencies: 249
-- Name: hospital_services_hosp_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hospital_services_hosp_service_id_seq OWNED BY public.hospital_services.hosp_service_id;


--
-- TOC entry 250 (class 1259 OID 20305)
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
-- TOC entry 251 (class 1259 OID 20318)
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
-- TOC entry 6013 (class 0 OID 0)
-- Dependencies: 251
-- Name: hospitals_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hospitals_hospital_id_seq OWNED BY public.hospitals.hospital_id;


--
-- TOC entry 252 (class 1259 OID 20319)
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
-- TOC entry 253 (class 1259 OID 20330)
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
-- TOC entry 6014 (class 0 OID 0)
-- Dependencies: 253
-- Name: insurance_claims_claim_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.insurance_claims_claim_id_seq OWNED BY public.insurance_claims.claim_id;


--
-- TOC entry 254 (class 1259 OID 20331)
-- Name: lead_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lead_data (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    mobile_number character varying(10) NOT NULL,
    hospital_name character varying(255),
    address text,
    email character varying(255),
    description text,
    demo_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lead_data OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 20340)
-- Name: lead_data_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lead_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lead_data_id_seq OWNER TO postgres;

--
-- TOC entry 6015 (class 0 OID 0)
-- Dependencies: 255
-- Name: lead_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lead_data_id_seq OWNED BY public.lead_data.id;


--
-- TOC entry 315 (class 1259 OID 21516)
-- Name: medical_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medical_services (
    service_id integer NOT NULL,
    service_code character varying(20),
    service_name character varying(255) NOT NULL,
    category character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.medical_services OWNER TO postgres;

--
-- TOC entry 314 (class 1259 OID 21515)
-- Name: medical_services_service_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medical_services_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medical_services_service_id_seq OWNER TO postgres;

--
-- TOC entry 6016 (class 0 OID 0)
-- Dependencies: 314
-- Name: medical_services_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medical_services_service_id_seq OWNED BY public.medical_services.service_id;


--
-- TOC entry 256 (class 1259 OID 20341)
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
-- TOC entry 257 (class 1259 OID 20350)
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
-- TOC entry 6017 (class 0 OID 0)
-- Dependencies: 257
-- Name: mlc_entries_mlc_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mlc_entries_mlc_id_seq OWNED BY public.mlc_entries.mlc_id;


--
-- TOC entry 258 (class 1259 OID 20351)
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
-- TOC entry 259 (class 1259 OID 20364)
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
-- TOC entry 6018 (class 0 OID 0)
-- Dependencies: 259
-- Name: modules_module_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.modules_module_id_seq OWNED BY public.modules.module_id;


--
-- TOC entry 260 (class 1259 OID 20365)
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
-- TOC entry 261 (class 1259 OID 20376)
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
-- TOC entry 6019 (class 0 OID 0)
-- Dependencies: 261
-- Name: nurse_branches_nurse_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nurse_branches_nurse_hospital_id_seq OWNED BY public.nurse_branches.nurse_hospital_id;


--
-- TOC entry 262 (class 1259 OID 20377)
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
-- TOC entry 263 (class 1259 OID 20391)
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
-- TOC entry 6020 (class 0 OID 0)
-- Dependencies: 263
-- Name: nurse_shifts_nurse_shift_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nurse_shifts_nurse_shift_id_seq OWNED BY public.nurse_shifts.nurse_shift_id;


--
-- TOC entry 264 (class 1259 OID 20392)
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
-- TOC entry 265 (class 1259 OID 20407)
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
-- TOC entry 6021 (class 0 OID 0)
-- Dependencies: 265
-- Name: nurses_nurse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nurses_nurse_id_seq OWNED BY public.nurses.nurse_id;


--
-- TOC entry 266 (class 1259 OID 20408)
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
-- TOC entry 267 (class 1259 OID 20429)
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
-- TOC entry 6022 (class 0 OID 0)
-- Dependencies: 267
-- Name: opd_entries_opd_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.opd_entries_opd_id_seq OWNED BY public.opd_entries.opd_id;


--
-- TOC entry 268 (class 1259 OID 20430)
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
-- TOC entry 269 (class 1259 OID 20439)
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
-- TOC entry 6023 (class 0 OID 0)
-- Dependencies: 269
-- Name: password_reset_tokens_token_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_reset_tokens_token_id_seq OWNED BY public.password_reset_tokens.token_id;


--
-- TOC entry 311 (class 1259 OID 21452)
-- Name: patient_feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patient_feedback (
    id integer NOT NULL,
    patient_id integer,
    patient_name character varying(255) NOT NULL,
    mrn character varying(50),
    service_context character varying(100),
    rating integer,
    tags text,
    comment text,
    sentiment character varying(50) DEFAULT 'Neutral'::character varying,
    nurse_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT patient_feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.patient_feedback OWNER TO postgres;

--
-- TOC entry 310 (class 1259 OID 21451)
-- Name: patient_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.patient_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patient_feedback_id_seq OWNER TO postgres;

--
-- TOC entry 6024 (class 0 OID 0)
-- Dependencies: 310
-- Name: patient_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.patient_feedback_id_seq OWNED BY public.patient_feedback.id;


--
-- TOC entry 270 (class 1259 OID 20440)
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
    death_police_district character varying(255),
    address_line2 text,
    CONSTRAINT patients_blood_group_check CHECK (((blood_group)::text = ANY (ARRAY[('A+'::character varying)::text, ('A-'::character varying)::text, ('B+'::character varying)::text, ('B-'::character varying)::text, ('AB+'::character varying)::text, ('AB-'::character varying)::text, ('O+'::character varying)::text, ('O-'::character varying)::text]))),
    CONSTRAINT patients_gender_check CHECK (((gender)::text = ANY (ARRAY[('Male'::character varying)::text, ('Female'::character varying)::text, ('Other'::character varying)::text, ('Pediatric'::character varying)::text])))
);


ALTER TABLE public.patients OWNER TO postgres;

--
-- TOC entry 271 (class 1259 OID 20458)
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
-- TOC entry 6025 (class 0 OID 0)
-- Dependencies: 271
-- Name: patients_patient_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.patients_patient_id_seq OWNED BY public.patients.patient_id;


--
-- TOC entry 272 (class 1259 OID 20459)
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
-- TOC entry 273 (class 1259 OID 20469)
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
-- TOC entry 6026 (class 0 OID 0)
-- Dependencies: 273
-- Name: prescriptions_prescription_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.prescriptions_prescription_id_seq OWNED BY public.prescriptions.prescription_id;


--
-- TOC entry 274 (class 1259 OID 20470)
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
    branch_id integer,
    kyc_upload_path text
);


ALTER TABLE public.referral_doctor_module OWNER TO postgres;

--
-- TOC entry 275 (class 1259 OID 20483)
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
-- TOC entry 6027 (class 0 OID 0)
-- Dependencies: 275
-- Name: referral_doctor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_doctor_id_seq OWNED BY public.referral_doctor_module.id;


--
-- TOC entry 276 (class 1259 OID 20484)
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
-- TOC entry 277 (class 1259 OID 20497)
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
-- TOC entry 6028 (class 0 OID 0)
-- Dependencies: 277
-- Name: referral_doctor_service_percentage_percentage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_doctor_service_percentage_percentage_id_seq OWNED BY public.referral_doctor_service_percentage_module.percentage_id;


--
-- TOC entry 278 (class 1259 OID 20498)
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
-- TOC entry 279 (class 1259 OID 20510)
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
-- TOC entry 6029 (class 0 OID 0)
-- Dependencies: 279
-- Name: referral_doctors_referral_doctor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_doctors_referral_doctor_id_seq OWNED BY public.referral_doctors.referral_doctor_id;


--
-- TOC entry 280 (class 1259 OID 20511)
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
-- TOC entry 281 (class 1259 OID 20519)
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
-- TOC entry 6030 (class 0 OID 0)
-- Dependencies: 281
-- Name: referral_hospital_mapping_mapping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_hospital_mapping_mapping_id_seq OWNED BY public.referral_hospital_mapping.mapping_id;


--
-- TOC entry 282 (class 1259 OID 20520)
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
-- TOC entry 283 (class 1259 OID 20531)
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
-- TOC entry 6031 (class 0 OID 0)
-- Dependencies: 283
-- Name: referral_hospitals_referral_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_hospitals_referral_hospital_id_seq OWNED BY public.referral_hospitals.referral_hospital_id;


--
-- TOC entry 284 (class 1259 OID 20532)
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
-- TOC entry 285 (class 1259 OID 20546)
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
-- TOC entry 6032 (class 0 OID 0)
-- Dependencies: 285
-- Name: referral_patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_patients_id_seq OWNED BY public.referral_patients.id;


--
-- TOC entry 286 (class 1259 OID 20547)
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
-- TOC entry 287 (class 1259 OID 20561)
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
-- TOC entry 6033 (class 0 OID 0)
-- Dependencies: 287
-- Name: referral_payment_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_payment_details_id_seq OWNED BY public.referral_payment_details.id;


--
-- TOC entry 288 (class 1259 OID 20562)
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
-- TOC entry 289 (class 1259 OID 20574)
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
-- TOC entry 6034 (class 0 OID 0)
-- Dependencies: 289
-- Name: referral_payment_header_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_payment_header_id_seq OWNED BY public.referral_payment_header.id;


--
-- TOC entry 290 (class 1259 OID 20575)
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
-- TOC entry 291 (class 1259 OID 20590)
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
-- TOC entry 6035 (class 0 OID 0)
-- Dependencies: 291
-- Name: referral_payment_upload_batch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_payment_upload_batch_id_seq OWNED BY public.referral_payment_upload_batch.id;


--
-- TOC entry 292 (class 1259 OID 20591)
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
-- TOC entry 6036 (class 0 OID 0)
-- Dependencies: 292
-- Name: TABLE referral_payments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.referral_payments IS 'Stores referral doctor payment calculations and records with GST';


--
-- TOC entry 293 (class 1259 OID 20610)
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
-- TOC entry 6037 (class 0 OID 0)
-- Dependencies: 293
-- Name: referral_payments_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referral_payments_payment_id_seq OWNED BY public.referral_payments.payment_id;


--
-- TOC entry 294 (class 1259 OID 20611)
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
-- TOC entry 295 (class 1259 OID 20622)
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
-- TOC entry 6038 (class 0 OID 0)
-- Dependencies: 295
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- TOC entry 296 (class 1259 OID 20623)
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
-- TOC entry 297 (class 1259 OID 20635)
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
-- TOC entry 6039 (class 0 OID 0)
-- Dependencies: 297
-- Name: services_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_service_id_seq OWNED BY public.services.service_id;


--
-- TOC entry 298 (class 1259 OID 20636)
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
-- TOC entry 299 (class 1259 OID 20644)
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
-- TOC entry 6040 (class 0 OID 0)
-- Dependencies: 299
-- Name: shift_branches_shift_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shift_branches_shift_hospital_id_seq OWNED BY public.shift_branches.shift_hospital_id;


--
-- TOC entry 300 (class 1259 OID 20645)
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
-- TOC entry 301 (class 1259 OID 20660)
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
-- TOC entry 6041 (class 0 OID 0)
-- Dependencies: 301
-- Name: shifts_shift_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shifts_shift_id_seq OWNED BY public.shifts.shift_id;


--
-- TOC entry 302 (class 1259 OID 20661)
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
-- TOC entry 303 (class 1259 OID 20675)
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
-- TOC entry 304 (class 1259 OID 20686)
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
-- TOC entry 6042 (class 0 OID 0)
-- Dependencies: 304
-- Name: staff_branches_staff_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.staff_branches_staff_hospital_id_seq OWNED BY public.staff_branches.staff_hospital_id;


--
-- TOC entry 305 (class 1259 OID 20687)
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
-- TOC entry 6043 (class 0 OID 0)
-- Dependencies: 305
-- Name: staff_staff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.staff_staff_id_seq OWNED BY public.staff.staff_id;


--
-- TOC entry 306 (class 1259 OID 20688)
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
-- TOC entry 307 (class 1259 OID 20700)
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
-- TOC entry 6044 (class 0 OID 0)
-- Dependencies: 307
-- Name: user_sessions_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_sessions_session_id_seq OWNED BY public.user_sessions.session_id;


--
-- TOC entry 308 (class 1259 OID 20701)
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
-- TOC entry 309 (class 1259 OID 20716)
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
-- TOC entry 6045 (class 0 OID 0)
-- Dependencies: 309
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 5131 (class 2604 OID 20717)
-- Name: appointments appointment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments ALTER COLUMN appointment_id SET DEFAULT nextval('public.appointments_appointment_id_seq'::regclass);


--
-- TOC entry 5136 (class 2604 OID 20718)
-- Name: billing_items bill_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_items ALTER COLUMN bill_item_id SET DEFAULT nextval('public.billing_items_bill_item_id_seq'::regclass);


--
-- TOC entry 5140 (class 2604 OID 20719)
-- Name: billings bill_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings ALTER COLUMN bill_id SET DEFAULT nextval('public.billings_bill_id_seq'::regclass);


--
-- TOC entry 5147 (class 2604 OID 20720)
-- Name: branch_departments hospital_dept_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_departments ALTER COLUMN hospital_dept_id SET DEFAULT nextval('public.branch_departments_hospital_dept_id_seq'::regclass);


--
-- TOC entry 5151 (class 2604 OID 20721)
-- Name: branch_services branch_service_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_services ALTER COLUMN branch_service_id SET DEFAULT nextval('public.branch_services_branch_service_id_seq'::regclass);


--
-- TOC entry 5155 (class 2604 OID 20722)
-- Name: branches branch_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches ALTER COLUMN branch_id SET DEFAULT nextval('public.branches_branch_id_seq'::regclass);


--
-- TOC entry 5167 (class 2604 OID 20723)
-- Name: client_modules client_module_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules ALTER COLUMN client_module_id SET DEFAULT nextval('public.client_modules_client_module_id_seq'::regclass);


--
-- TOC entry 5173 (class 2604 OID 20724)
-- Name: consultation_outcomes outcome_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_outcomes ALTER COLUMN outcome_id SET DEFAULT nextval('public.consultation_outcomes_outcome_id_seq'::regclass);


--
-- TOC entry 5179 (class 2604 OID 20725)
-- Name: departments department_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN department_id SET DEFAULT nextval('public.departments_department_id_seq'::regclass);


--
-- TOC entry 5183 (class 2604 OID 20726)
-- Name: doctor_branch_departments doc_hosp_dept_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branch_departments ALTER COLUMN doc_hosp_dept_id SET DEFAULT nextval('public.doctor_branch_departments_doc_hosp_dept_id_seq'::regclass);


--
-- TOC entry 5186 (class 2604 OID 20727)
-- Name: doctor_branches doc_hospital_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branches ALTER COLUMN doc_hospital_id SET DEFAULT nextval('public.doctor_branches_doc_hospital_id_seq'::regclass);


--
-- TOC entry 5191 (class 2604 OID 20728)
-- Name: doctor_departments doc_dept_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_departments ALTER COLUMN doc_dept_id SET DEFAULT nextval('public.doctor_departments_doc_dept_id_seq'::regclass);


--
-- TOC entry 5194 (class 2604 OID 20729)
-- Name: doctor_shifts doctor_shift_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_shifts ALTER COLUMN doctor_shift_id SET DEFAULT nextval('public.doctor_shifts_doctor_shift_id_seq'::regclass);


--
-- TOC entry 5364 (class 2604 OID 21480)
-- Name: doctor_weekly_schedules schedule_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_weekly_schedules ALTER COLUMN schedule_id SET DEFAULT nextval('public.doctor_weekly_schedules_schedule_id_seq'::regclass);


--
-- TOC entry 5199 (class 2604 OID 20730)
-- Name: doctors doctor_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors ALTER COLUMN doctor_id SET DEFAULT nextval('public.doctors_doctor_id_seq'::regclass);


--
-- TOC entry 5204 (class 2604 OID 20731)
-- Name: hospital_services hosp_service_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospital_services ALTER COLUMN hosp_service_id SET DEFAULT nextval('public.hospital_services_hosp_service_id_seq'::regclass);


--
-- TOC entry 5210 (class 2604 OID 20732)
-- Name: hospitals hospital_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitals ALTER COLUMN hospital_id SET DEFAULT nextval('public.hospitals_hospital_id_seq'::regclass);


--
-- TOC entry 5215 (class 2604 OID 20733)
-- Name: insurance_claims claim_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurance_claims ALTER COLUMN claim_id SET DEFAULT nextval('public.insurance_claims_claim_id_seq'::regclass);


--
-- TOC entry 5221 (class 2604 OID 20734)
-- Name: lead_data id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_data ALTER COLUMN id SET DEFAULT nextval('public.lead_data_id_seq'::regclass);


--
-- TOC entry 5369 (class 2604 OID 21519)
-- Name: medical_services service_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_services ALTER COLUMN service_id SET DEFAULT nextval('public.medical_services_service_id_seq'::regclass);


--
-- TOC entry 5223 (class 2604 OID 20735)
-- Name: mlc_entries mlc_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mlc_entries ALTER COLUMN mlc_id SET DEFAULT nextval('public.mlc_entries_mlc_id_seq'::regclass);


--
-- TOC entry 5226 (class 2604 OID 20736)
-- Name: modules module_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules ALTER COLUMN module_id SET DEFAULT nextval('public.modules_module_id_seq'::regclass);


--
-- TOC entry 5231 (class 2604 OID 20737)
-- Name: nurse_branches nurse_hospital_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_branches ALTER COLUMN nurse_hospital_id SET DEFAULT nextval('public.nurse_branches_nurse_hospital_id_seq'::regclass);


--
-- TOC entry 5236 (class 2604 OID 20738)
-- Name: nurse_shifts nurse_shift_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_shifts ALTER COLUMN nurse_shift_id SET DEFAULT nextval('public.nurse_shifts_nurse_shift_id_seq'::regclass);


--
-- TOC entry 5240 (class 2604 OID 20739)
-- Name: nurses nurse_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses ALTER COLUMN nurse_id SET DEFAULT nextval('public.nurses_nurse_id_seq'::regclass);


--
-- TOC entry 5244 (class 2604 OID 20740)
-- Name: opd_entries opd_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries ALTER COLUMN opd_id SET DEFAULT nextval('public.opd_entries_opd_id_seq'::regclass);


--
-- TOC entry 5252 (class 2604 OID 20741)
-- Name: password_reset_tokens token_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN token_id SET DEFAULT nextval('public.password_reset_tokens_token_id_seq'::regclass);


--
-- TOC entry 5361 (class 2604 OID 21455)
-- Name: patient_feedback id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_feedback ALTER COLUMN id SET DEFAULT nextval('public.patient_feedback_id_seq'::regclass);


--
-- TOC entry 5255 (class 2604 OID 20742)
-- Name: patients patient_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients ALTER COLUMN patient_id SET DEFAULT nextval('public.patients_patient_id_seq'::regclass);


--
-- TOC entry 5262 (class 2604 OID 20743)
-- Name: prescriptions prescription_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions ALTER COLUMN prescription_id SET DEFAULT nextval('public.prescriptions_prescription_id_seq'::regclass);


--
-- TOC entry 5267 (class 2604 OID 20744)
-- Name: referral_doctor_module id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_module ALTER COLUMN id SET DEFAULT nextval('public.referral_doctor_id_seq'::regclass);


--
-- TOC entry 5273 (class 2604 OID 20745)
-- Name: referral_doctor_service_percentage_module percentage_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_service_percentage_module ALTER COLUMN percentage_id SET DEFAULT nextval('public.referral_doctor_service_percentage_percentage_id_seq'::regclass);


--
-- TOC entry 5281 (class 2604 OID 20746)
-- Name: referral_doctors referral_doctor_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctors ALTER COLUMN referral_doctor_id SET DEFAULT nextval('public.referral_doctors_referral_doctor_id_seq'::regclass);


--
-- TOC entry 5285 (class 2604 OID 20747)
-- Name: referral_hospital_mapping mapping_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_hospital_mapping ALTER COLUMN mapping_id SET DEFAULT nextval('public.referral_hospital_mapping_mapping_id_seq'::regclass);


--
-- TOC entry 5288 (class 2604 OID 20748)
-- Name: referral_hospitals referral_hospital_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_hospitals ALTER COLUMN referral_hospital_id SET DEFAULT nextval('public.referral_hospitals_referral_hospital_id_seq'::regclass);


--
-- TOC entry 5292 (class 2604 OID 20749)
-- Name: referral_patients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_patients ALTER COLUMN id SET DEFAULT nextval('public.referral_patients_id_seq'::regclass);


--
-- TOC entry 5297 (class 2604 OID 20750)
-- Name: referral_payment_details id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_details ALTER COLUMN id SET DEFAULT nextval('public.referral_payment_details_id_seq'::regclass);


--
-- TOC entry 5305 (class 2604 OID 20751)
-- Name: referral_payment_header id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_header ALTER COLUMN id SET DEFAULT nextval('public.referral_payment_header_id_seq'::regclass);


--
-- TOC entry 5311 (class 2604 OID 20752)
-- Name: referral_payment_upload_batch id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_upload_batch ALTER COLUMN id SET DEFAULT nextval('public.referral_payment_upload_batch_id_seq'::regclass);


--
-- TOC entry 5318 (class 2604 OID 20753)
-- Name: referral_payments payment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payments ALTER COLUMN payment_id SET DEFAULT nextval('public.referral_payments_payment_id_seq'::regclass);


--
-- TOC entry 5323 (class 2604 OID 20754)
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- TOC entry 5327 (class 2604 OID 20755)
-- Name: services service_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN service_id SET DEFAULT nextval('public.services_service_id_seq'::regclass);


--
-- TOC entry 5332 (class 2604 OID 20756)
-- Name: shift_branches shift_hospital_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_branches ALTER COLUMN shift_hospital_id SET DEFAULT nextval('public.shift_branches_shift_hospital_id_seq'::regclass);


--
-- TOC entry 5335 (class 2604 OID 20757)
-- Name: shifts shift_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts ALTER COLUMN shift_id SET DEFAULT nextval('public.shifts_shift_id_seq'::regclass);


--
-- TOC entry 5340 (class 2604 OID 20758)
-- Name: staff staff_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff ALTER COLUMN staff_id SET DEFAULT nextval('public.staff_staff_id_seq'::regclass);


--
-- TOC entry 5344 (class 2604 OID 20759)
-- Name: staff_branches staff_hospital_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_branches ALTER COLUMN staff_hospital_id SET DEFAULT nextval('public.staff_branches_staff_hospital_id_seq'::regclass);


--
-- TOC entry 5349 (class 2604 OID 20760)
-- Name: user_sessions session_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN session_id SET DEFAULT nextval('public.user_sessions_session_id_seq'::regclass);


--
-- TOC entry 5353 (class 2604 OID 20761)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5894 (class 0 OID 20102)
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
21	APT-20260102-9275	p1	7876556776	p1@gmail.com	77	Male	44	36	49	\N	2026-01-02	17:05:00	fever	Completed	2026-01-02 17:06:06.942221	\N	\N	\N	jdhjhf	2026-01-02 17:06:06.942221	2026-01-02 17:16:03.716052
22	APT-20260108-4284	Henry Rochers	8783665838	hendry@gmail.com	25	Male	49	38	53	\N	2026-01-08	12:59:00	Routine Checkup	In OPD	2026-01-08 12:00:06.505613	\N	\N	\N		2026-01-08 12:00:06.505613	2026-01-08 12:01:39.022013
23	APT-20260113-8673	Diya	9003101244		24	Female	\N	4	2	\N	2026-01-13	16:10:00	Routine Checkup	Scheduled	2026-01-13 13:11:35.888321	\N	\N	\N		2026-01-13 13:11:35.888321	2026-01-13 13:11:35.888321
24	APT-20260120-3611	Meera	6483683468	testing34@gmail.com	25	Female	56	39	55	\N	2026-01-20	16:33:00	Allergic issues	In OPD	2026-01-20 14:39:16.312486	\N	\N	\N		2026-01-20 14:39:16.312486	2026-01-22 12:29:13.293534
25	APT-20260122-6252	Punith	4628468642		25	Female	55	39	55	\N	2026-01-22	12:30:00	Skin concerns	Completed	2026-01-22 12:18:32.838257	\N	\N	\N		2026-01-22 12:18:32.838257	2026-01-22 12:52:57.989778
26	APT-20260122-9335	Keerthi	3868236863		24	Female	\N	39	55	\N	2026-01-22	12:45:00		Cancelled	2026-01-22 12:19:27.890253	\N	180	Patient Request		2026-01-22 12:19:27.890253	2026-01-27 18:04:27.832578
27	APT-20260128-4231	Priya	2345678901		25	Female	\N	44	55	\N	2026-01-28	12:30:00	nothing	Scheduled	2026-01-28 16:00:45.496505	\N	\N	\N	Testing	2026-01-28 16:00:45.496505	2026-01-28 16:00:45.496505
28	APT-20260130-4008	Joe	2312312321	\N	23	Female	71	39	55	\N	2026-01-30	11:15:00		In OPD	2026-01-30 16:47:12.655183	\N	\N	\N		2026-01-30 16:47:12.655183	2026-01-30 16:48:22.533516
\.


--
-- TOC entry 5896 (class 0 OID 20120)
-- Dependencies: 222
-- Data for Name: billing_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.billing_items (bill_item_id, bill_id, service_id, item_code, quantity, unit_price, doctor_id, department_id, created_at) FROM stdin;
\.


--
-- TOC entry 5898 (class 0 OID 20130)
-- Dependencies: 224
-- Data for Name: billings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.billings (bill_id, bill_number, patient_id, branch_id, opd_id, admission_id, bill_date, total_amount, discount_amount, tax_amount, net_payable, paid_amount, bill_status, payment_method, insurance_claim_id, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5900 (class 0 OID 20149)
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
51	47	5	\N	\N	\N	t	2025-12-18 12:08:17.67229	2025-12-18 12:08:17.67229
52	47	3	\N	\N	\N	t	2025-12-18 12:08:17.67229	2025-12-18 12:08:17.67229
53	47	2	\N	\N	\N	t	2025-12-18 12:08:17.67229	2025-12-18 12:08:17.67229
54	47	1	\N	\N	\N	t	2025-12-18 12:08:17.67229	2025-12-18 12:08:17.67229
55	47	4	\N	\N	\N	t	2025-12-18 12:08:17.67229	2025-12-18 12:08:17.67229
56	47	10	\N	\N	\N	t	2025-12-18 12:08:17.67229	2025-12-18 12:08:17.67229
57	49	8	\N	\N	\N	t	2026-01-02 16:09:04.300273	2026-01-02 16:09:04.300273
58	49	9	\N	\N	\N	t	2026-01-02 16:09:04.300273	2026-01-02 16:09:04.300273
59	49	15	\N	\N	\N	t	2026-01-02 16:09:04.300273	2026-01-02 16:09:04.300273
60	49	20	\N	\N	\N	t	2026-01-02 16:09:04.300273	2026-01-02 16:09:04.300273
61	50	17	\N	\N	\N	t	2026-01-02 16:26:47.435381	2026-01-02 16:26:47.435381
62	50	18	\N	\N	\N	t	2026-01-02 16:26:47.441996	2026-01-02 16:26:47.441996
63	50	21	\N	\N	\N	t	2026-01-02 16:26:47.44424	2026-01-02 16:26:47.44424
64	51	11	\N	\N	\N	t	2026-01-02 16:52:46.758205	2026-01-02 16:52:46.758205
65	51	10	\N	\N	\N	t	2026-01-02 16:52:46.758205	2026-01-02 16:52:46.758205
66	52	5	\N	\N	\N	t	2026-01-07 12:08:44.692563	2026-01-07 12:08:44.692563
67	52	6	\N	\N	\N	t	2026-01-07 12:08:44.692563	2026-01-07 12:08:44.692563
68	52	8	\N	\N	\N	t	2026-01-07 12:08:44.692563	2026-01-07 12:08:44.692563
69	52	10	\N	\N	\N	t	2026-01-07 12:08:44.692563	2026-01-07 12:08:44.692563
70	53	1	\N	\N	\N	t	2026-01-07 16:56:54.292284	2026-01-07 16:56:54.292284
71	53	5	\N	\N	\N	t	2026-01-07 16:56:54.292284	2026-01-07 16:56:54.292284
72	53	8	\N	\N	\N	t	2026-01-07 16:56:54.292284	2026-01-07 16:56:54.292284
73	53	26	\N	\N	\N	t	2026-01-07 16:56:54.292284	2026-01-07 16:56:54.292284
74	54	11	\N	\N	\N	t	2026-01-07 17:06:35.622139	2026-01-07 17:06:35.622139
75	54	4	\N	\N	\N	t	2026-01-07 17:06:35.624746	2026-01-07 17:06:35.624746
76	54	9	\N	\N	\N	t	2026-01-07 17:06:35.625677	2026-01-07 17:06:35.625677
77	55	1	\N	\N	\N	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
78	55	4	\N	\N	\N	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
79	55	7	\N	\N	\N	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
80	55	10	\N	\N	\N	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
81	55	13	\N	\N	\N	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
82	55	9	\N	\N	\N	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
83	55	11	\N	\N	\N	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
84	55	6	\N	\N	\N	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
85	55	23	\N	\N	\N	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
86	55	24	\N	\N	\N	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
87	55	18	\N	\N	\N	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
88	55	5	\N	\N	\N	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
89	55	8	\N	\N	\N	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
90	55	16	\N	\N	\N	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
91	55	15	\N	\N	\N	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
\.


--
-- TOC entry 5902 (class 0 OID 20159)
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
59	47	47	t	2025-12-18 12:08:17.67229	2025-12-18 12:08:17.67229
60	47	6	t	2025-12-18 12:08:17.67229	2025-12-18 12:08:17.67229
61	47	53	t	2025-12-18 12:08:17.67229	2025-12-18 12:08:17.67229
62	47	76	t	2025-12-18 12:08:17.67229	2025-12-18 12:08:17.67229
63	47	51	t	2025-12-18 12:08:17.67229	2025-12-18 12:08:17.67229
64	47	52	t	2025-12-18 12:08:17.67229	2025-12-18 12:08:17.67229
65	49	9	t	2026-01-02 16:09:04.300273	2026-01-02 16:09:04.300273
66	49	69	t	2026-01-02 16:09:04.300273	2026-01-02 16:09:04.300273
67	49	64	t	2026-01-02 16:09:04.300273	2026-01-02 16:09:04.300273
68	49	38	t	2026-01-02 16:09:04.300273	2026-01-02 16:09:04.300273
69	49	60	t	2026-01-02 16:09:04.300273	2026-01-02 16:09:04.300273
70	50	23	t	2026-01-02 16:26:47.445401	2026-01-02 16:26:47.445401
71	50	71	t	2026-01-02 16:26:47.450936	2026-01-02 16:26:47.450936
72	51	47	t	2026-01-02 16:52:46.758205	2026-01-02 16:52:46.758205
73	51	3	t	2026-01-02 16:52:46.758205	2026-01-02 16:52:46.758205
74	52	25	t	2026-01-07 12:08:44.692563	2026-01-07 12:08:44.692563
75	52	70	t	2026-01-07 12:08:44.692563	2026-01-07 12:08:44.692563
76	52	82	t	2026-01-07 12:08:44.692563	2026-01-07 12:08:44.692563
77	52	75	t	2026-01-07 12:08:44.692563	2026-01-07 12:08:44.692563
78	53	24	t	2026-01-07 16:56:54.292284	2026-01-07 16:56:54.292284
79	53	25	t	2026-01-07 16:56:54.292284	2026-01-07 16:56:54.292284
80	53	70	t	2026-01-07 16:56:54.292284	2026-01-07 16:56:54.292284
81	53	82	t	2026-01-07 16:56:54.292284	2026-01-07 16:56:54.292284
82	53	75	t	2026-01-07 16:56:54.292284	2026-01-07 16:56:54.292284
83	54	25	t	2026-01-07 17:06:35.626398	2026-01-07 17:06:35.626398
84	54	82	t	2026-01-07 17:06:35.630102	2026-01-07 17:06:35.630102
85	54	75	t	2026-01-07 17:06:35.630666	2026-01-07 17:06:35.630666
86	54	80	t	2026-01-07 17:06:35.631323	2026-01-07 17:06:35.631323
87	54	54	t	2026-01-07 17:06:35.632467	2026-01-07 17:06:35.632467
88	54	3	t	2026-01-07 17:06:35.633009	2026-01-07 17:06:35.633009
89	55	7	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
90	55	56	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
91	55	70	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
92	55	80	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
93	55	39	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
94	55	25	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
95	55	69	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
96	55	24	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
97	55	41	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
98	55	54	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
\.


--
-- TOC entry 5904 (class 0 OID 20169)
-- Dependencies: 230
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branches (branch_id, hospital_id, branch_name, branch_code, address_line1, address_line2, city, state, pincode, country, latitude, longitude, contact_number, email, branch_manager, total_beds, emergency_available, icu_beds, general_beds, is_active, created_at, updated_at, mlc_fee, enabled_modules, consultation_rooms, daycare_available, daycare_beds, clinic_schedule) FROM stdin;
1	4	apollo Main Branch	AP001-MAIN	Indira nagar	\N	\N	\N	\N	India	\N	\N	8282828282	\N	\N	\N	f	0	0	t	2025-12-04 11:34:02.498301	2025-12-04 12:46:08.255319	0.00	\N	0	f	0	\N
7	8	Kausalya Hospital Main Branch	KH0001-MAIN		\N	\N	\N	\N	India	\N	\N	+91 9876543234	\N	\N	\N	f	0	0	t	2025-12-05 10:15:34.112889	2025-12-05 10:15:34.112889	0.00	\N	0	f	0	\N
8	8	KH-P	BR-KH-001		\N	Pollachi	TN		India	\N	\N		\N	\N	\N	t	0	0	t	2025-12-05 10:21:27.728656	2025-12-05 10:21:27.728656	0.00	\N	0	f	0	\N
4	4	asdf	adf	adf	\N	aef	aef		India	\N	\N		\N	\N	\N	t	0	0	t	2025-12-04 12:44:45.220785	2025-12-05 11:23:10.203578	0.00	\N	0	f	0	\N
11	8	BR2	AM-BR-002		\N	AN	KY		India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-05 16:20:59.401814	2025-12-05 16:20:59.401814	0.00	\N	0	f	0	\N
2	5	City General Hospital Main Branch	CGH001-MAIN	123 Main Street	\N	\N	\N	\N	India	\N	\N	+91-9876543210	\N	\N	\N	f	0	0	f	2025-12-04 12:21:01.453672	2025-12-08 10:38:25.636414	0.00	\N	0	f	0	\N
12	10	KV hospital Main Branch	KV001-MAIN		\N	\N	\N	\N	India	\N	\N	+91 9776698765	\N	\N	\N	f	0	0	t	2025-12-08 10:39:46.204638	2025-12-08 10:39:46.204638	0.00	\N	0	f	0	\N
13	10	kvb-1	kv00-b1		\N	KA	TN		India	\N	\N		\N	\N	\N	t	0	0	t	2025-12-08 10:42:07.897786	2025-12-08 10:42:07.897786	0.00	\N	0	f	0	\N
14	12	Shanti Hospital Main Branch	SH001-MAIN		\N	\N	\N	\N	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-08 12:05:46.171886	2025-12-08 12:05:46.171886	0.00	\N	0	f	0	\N
15	13	Sun Main Branch	HS0023-MAIN		\N	\N	\N	\N	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-08 15:48:18.014037	2025-12-08 15:48:18.014037	0.00	\N	0	f	0	\N
16	13	s1	s1		\N	bangalore	KA		India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-08 15:48:48.348804	2025-12-08 15:48:48.348804	0.00	\N	0	f	0	\N
17	14	Ashoka Main Branch	AS001-MAIN		\N	\N	\N	\N	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-09 11:07:12.463634	2025-12-09 11:07:12.463634	0.00	\N	0	f	0	\N
18	15	test with bracnh and service Main Branch	BS001-MAIN		\N	\N	\N	\N	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-09 15:20:29.172298	2025-12-09 15:20:29.172298	0.00	\N	0	f	0	\N
19	15	B1 TEST BS	BR135		\N	AD	AD		India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-09 15:22:11.859836	2025-12-09 15:22:11.859836	0.00	\N	0	f	0	\N
20	16	with logo Main Branch	WL001-MAIN		\N	\N	\N	\N	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-10 11:54:52.590371	2025-12-10 11:54:52.590371	0.00	\N	0	f	0	\N
21	16	test wl b	wlb001	C-129, D-colony, P.K. Kandasamy street,	\N	Pollachi	Tamil Nadu	642001	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-10 12:09:28.128938	2025-12-10 12:09:28.128938	0.00	\N	0	f	0	\N
22	17	logo check Main Branch	LG001-MAIN		\N	\N	\N	\N	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-10 12:20:40.771076	2025-12-10 12:20:40.771076	0.00	\N	0	f	0	\N
3	6	Sunshine Medical Center Main Branch	SMC001-MAIN	456 Park Avenue	\N	\N	\N	\N	India	\N	\N	+91-9123456789	\N	\N	\N	f	0	0	f	2025-12-04 12:22:29.912709	2025-12-11 15:24:27.385855	0.00	\N	0	f	0	\N
23	6	sus 2	sus02	C-129, D-colony, P.K. Kandasamy street,	\N	Pollachi	Tamil Nadu	642001	India	\N	\N		\N	\N	\N	f	0	0	f	2025-12-10 15:02:42.270072	2025-12-11 15:24:27.385855	0.00	\N	0	f	0	\N
24	6	sus3	br01	1st Floor, 81, The Hulkul, 37, Lavelle Road, Shanthala Nagar, Ashok Nagar, Bengaluru, Karnataka Bengaluru, Karnataka 560001 India	\N	Bangalore	Karnataka	560001	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-12 10:50:20.336558	2025-12-12 10:50:20.336558	1000.00	\N	0	f	0	\N
25	19	Test Branch	TB1765860539458	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:18:59.457658	2025-12-16 10:18:59.457658	0.00	\N	0	f	0	\N
26	20	Test Branch	TB1765860626396	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:20:26.394471	2025-12-16 10:20:26.394471	0.00	\N	0	f	0	\N
27	21	Test Branch	TB1765860671686	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:21:11.684965	2025-12-16 10:21:11.684965	0.00	\N	0	f	0	\N
28	22	Test Branch	TB1765860703084	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:21:43.082444	2025-12-16 10:21:43.082444	0.00	\N	0	f	0	\N
29	23	Debug Branch	DBB1765860745416	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:22:25.417148	2025-12-16 10:22:25.417148	0.00	\N	0	f	0	\N
30	24	Test Branch	TB1765860783829	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:23:03.827374	2025-12-16 10:23:03.827374	0.00	\N	0	f	0	\N
31	25	Debug Branch	DBB1765860794602	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:23:14.604413	2025-12-16 10:23:14.604413	0.00	\N	0	f	0	\N
6	7	hehe	h12	Indira nagar	\N	Banglore	Karnataka	560038	India	\N	\N		\N	\N	\N	f	0	0	f	2025-12-04 15:11:45.659012	2025-12-16 10:25:23.880983	0.00	\N	0	f	0	\N
32	26	Refined Branch	RTB1765862303813	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:48:23.812037	2025-12-16 10:48:23.812037	0.00	\N	0	f	0	\N
33	27	Refined Branch	RTB1765862330103	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:48:50.101765	2025-12-16 10:48:50.101765	0.00	\N	0	f	0	\N
34	28	DD Branch	DDB	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 10:49:24.468903	2025-12-16 10:49:24.468903	0.00	\N	0	f	0	\N
35	29	Branch Doc Only	BDO1765863029829	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 11:00:29.835133	2025-12-16 11:00:29.835133	0.00	[{"id": "doc", "is_active": true}]	0	f	0	\N
36	30	Branch Doc Only	BDO1765863068572	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 11:01:08.576971	2025-12-16 11:01:08.576971	0.00	[{"id": "doc", "is_active": true}]	0	f	0	\N
37	31	Branch Doc Only	BDO1765863091634	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 11:01:31.639812	2025-12-16 11:01:31.639812	0.00	[{"id": "doc", "is_active": true}]	0	f	0	\N
38	32	Branch Doc Only	BDO1765863129532	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 11:02:09.536276	2025-12-16 11:02:09.536276	0.00	[{"id": "doc", "is_active": true}]	0	f	0	\N
39	33	Branch Doc Only	BDO1765863140875	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 11:02:20.879843	2025-12-16 11:02:20.879843	0.00	[{"id": "doc", "is_active": true}]	0	f	0	\N
40	34	Branch Doc Only	BDO1765884410264	\N	\N	\N	\N	\N	India	\N	\N	\N	\N	\N	\N	f	0	0	t	2025-12-16 16:56:50.26749	2025-12-16 16:56:50.26749	0.00	[{"id": "doc", "is_active": true}]	0	f	0	\N
41	35	Aradhana Main Branch	HS0001-MAIN	Indira nagar	\N	\N	\N	\N	India	\N	\N	8787676565	\N	\N	\N	f	0	0	t	2025-12-16 17:15:36.11764	2025-12-16 17:15:36.11764	0.00	\N	0	f	0	\N
43	36	akb1	ak001		\N	bangalore	KA		India	\N	\N	4354535636	\N	\N	\N	t	0	0	t	2025-12-17 11:49:44.361379	2025-12-17 11:49:44.361379	100.00	{}	0	f	0	\N
42	36	ak Main Branch	AK01-MAIN	Bangalore	\N	Bangalore	KA		India	\N	\N	9898767876	\N	\N	\N	f	0	0	t	2025-12-17 10:17:28.451481	2025-12-17 12:05:33.567259	100.00	{}	0	f	0	\N
45	38	57 Main Branch	658-MAIN		\N	\N	\N	\N	India	\N	\N		\N	\N	\N	f	0	0	t	2025-12-17 12:46:43.84368	2025-12-17 12:46:43.84368	0.00	\N	0	f	0	\N
46	39	camry hospital Main Branch	CAMRY001-MAIN	9/10/11, Arakere Bannerghatta Rd, Shantiniketan Layout, Arekere, Bengaluru, Karnataka 560076	\N	\N	\N	\N	India	\N	\N	9355304574	\N	\N	\N	f	0	0	t	2025-12-18 07:46:41.913832	2025-12-18 07:46:41.913832	0.00	\N	0	f	0	\N
47	40	Nano Hospital Main Branch	NANO001-MAIN	Arekere bangalore	\N	bangalore	karnataka		India	\N	\N	9847583746	\N	\N	\N	f	0	0	t	2025-12-18 12:08:17.67229	2025-12-18 12:17:49.392862	3000.00	\N	0	f	0	\N
5	7	pi Main Branch	ASDF-MAIN	Indira nagar	\N	Bangalore	KA		India	\N	\N	98698698698	\N	\N	\N	f	0	0	t	2025-12-04 14:43:50.165074	2025-12-23 10:42:09.855541	1000.00	{}	0	f	0	\N
51	43	hp Main Branch	HS78-MAIN		\N	\N	\N	\N	India	\N	\N		\N	\N	\N	f	0	0	t	2026-01-02 16:52:46.758205	2026-01-02 16:52:46.758205	0.00	\N	0	f	0	\N
50	42	Kashi branch 1	Branch1	123, colony	\N	Bangalore	KA	642001	India	\N	\N	8766676664	\N	\N	\N	f	0	0	t	2026-01-02 16:26:47.431468	2026-01-02 16:26:47.431468	100.00	[{"id": "doc", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}]	0	f	0	\N
49	42	Kashi Main Branch	HSP001-MAIN	123, A Colony, ST Street	\N	Banglore	KA		India	\N	\N	8787466565	\N	\N	\N	f	0	0	t	2026-01-02 16:09:04.300273	2026-01-02 17:04:13.688744	100.00	[{"id": "doc", "is_active": true}, {"id": "market", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "reception", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}]	0	f	0	\N
52	44	Kalyan Main Branch	HS0012-MAIN	123, hopstail road	\N	Bangalore	KA		India	\N	\N	7676567656	\N	\N	\N	t	0	0	t	2026-01-07 12:08:44.692563	2026-01-07 12:09:33.522262	0.00	[{"id": "doc", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]	0	f	0	\N
9	9	Amren Main Branch	AM001-MAIN		\N	\N	\N	\N	India	\N	\N		\N	\N	\N	f	0	0	f	2025-12-05 16:05:09.221919	2026-01-13 14:34:40.912511	0.00	\N	0	f	0	\N
10	9	branch-1	AM-BR-001		\N	CN	TN		India	\N	\N		\N	\N	\N	t	0	0	f	2025-12-05 16:07:11.758055	2026-01-13 14:34:40.912511	0.00	\N	0	f	0	\N
54	45	Kaveri Clinic Branch-1	KV-BR-01	123 Main Street	\N	Bangalore	KA	642001	India	\N	\N	8787656565	\N	\N	\N	f	0	0	t	2026-01-07 17:06:35.619006	2026-01-07 17:06:35.619006	499.00	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "market", "is_active": true}, {"id": "reception", "is_active": true}, {"id": "acc", "is_active": true}]	0	f	0	\N
53	45	Kaveri Clinic Main Branch	HS009-MAIN	LH Road, Gandhipuram,\r\nCoimbatore	\N	Bangalore	KA	642001	India	\N	\N	7676567777	\N	\N	\N	t	0	0	t	2026-01-07 16:56:54.292284	2026-01-07 17:07:33.951333	1000.00	[{"id": "doc", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]	0	f	0	\N
55	46	Care 24 Medical Centre & Hospital Main Branch	C24MCH-MAIN	XYZ, Periyar Nagar, Erode 638002	\N	\N	\N	\N	India	\N	\N	9123456789	\N	\N	\N	f	0	0	t	2026-01-20 12:07:54.34217	2026-01-29 17:49:48.81083	0.00	\N	40	t	3	{"friday": {"end1": "13:00", "end2": "19:00", "isOpen": true, "start1": "10:00", "start2": "17:00"}, "monday": {"end1": "13:00", "end2": "19:00", "isOpen": true, "start1": "10:00", "start2": "17:00"}, "sunday": {"end1": "00:00", "end2": "", "isOpen": false, "start1": "00:00", "start2": ""}, "tuesday": {"end1": "13:00", "end2": "19:00", "isOpen": true, "start1": "10:00", "start2": "17:00"}, "saturday": {"end1": "13:00", "end2": "19:00", "isOpen": true, "start1": "10:00", "start2": "17:00"}, "thursday": {"end1": "13:00", "end2": "19:00", "isOpen": true, "start1": "10:00", "start2": "17:00"}, "wednesday": {"end1": "13:00", "end2": "19:00", "isOpen": true, "start1": "10:00", "start2": "17:00"}}
\.


--
-- TOC entry 5906 (class 0 OID 20187)
-- Dependencies: 232
-- Data for Name: client_modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.client_modules (client_module_id, client_id, module_id, registered_date, marketing_id, status, created_by, updated_by, created_at, updated_at, uuid, branch_id) FROM stdin;
\.


--
-- TOC entry 5908 (class 0 OID 20200)
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
32	52	40	35	\N	Completed	ECG @ diagnositcs\nABG @ diagnostics\necho\nabdominal pelives\n	self fall\nhead injury	\N	Follow-up Required	2025-12-18 12:59:58.181536	2025-12-18 12:59:58.181536	[{"lab_name": "inhouse", "test_name": "GRBS"}]	\N	\N	[]
31	51	39	35	15	Completed	chest X-Ray\nAbdominal X-Ray\nCTScan abdominal	high fever, high BP,\nplatelet count down	2025-12-22	Follow-up Required	2025-12-18 12:48:52.924397	2025-12-18 12:48:52.924397	[{"lab_name": "inhouse", "test_name": "typhoid test"}, {"lab_name": "inhouse", "test_name": "Dengue test"}, {"lab_name": "inhouse", "test_name": "all hemitology and bio-chemistory test"}]	\N	\N	[]
34	52	40	35	\N	Completed	ECG @ diagnositcs\nABG @ diagnostics\necho\nabdominal pelives\n	self fall\nhead injury	\N	Follow-up Required	2025-12-18 13:04:23.501554	2025-12-18 13:04:23.501554	[{"lab_name": "inhouse", "test_name": "GRBS"}]	\N	\N	[]
38	55	43	5	\N	Completed			\N	Follow-up Required	2025-12-23 10:43:37.676611	2025-12-23 10:43:37.676611	[]	\N	\N	[]
36	53	41	5	16	Completed	kjf jf dkfjoiwfjoif 'ad mdoij 	fdf ff	2025-12-25	Follow-up Required	2025-12-22 17:56:09.791213	2025-12-22 17:56:09.791213	[{"lab_name": "1", "test_name": "a"}, {"lab_name": "1", "test_name": "b"}]	\N	\N	[]
40	56	44	36	17	Completed	f oj	kj wjf iejf \nfj fej \nweofk w jf\nwefok 	2026-01-09	Follow-up Required	2026-01-02 17:16:03.716052	2026-01-02 17:16:03.716052	[{"lab_name": "oedh ", "test_name": "l1"}, {"lab_name": "lf o", "test_name": "l2"}]	8	fn 	[]
42	57	45	37	18	Completed	X-ray\n	high temp\nvomit\n	2026-01-09	Follow-up Required	2026-01-07 12:40:00.599263	2026-01-07 12:40:00.599263	[{"lab_name": "lab1", "test_name": "blood test"}]	\N	\N	[]
43	58	46	37	\N	Draft	ECG\nCT scan	fracture in skull\n	\N	Follow-up Required	2026-01-07 12:56:53.2957	2026-01-07 12:56:53.314822	[{"lab_name": "lab1", "test_name": "CBC"}, {"lab_name": "Lab2", "test_name": "CTC"}]	\N	\N	[]
45	61	48	38	19	Completed		fracture\nblood loss	\N	Follow-up Required	2026-01-08 12:34:06.667185	2026-01-08 12:34:06.667185	[{"lab_name": "lab1", "test_name": "x ray"}]	\N	\N	[]
46	69	55	39	\N	Completed			\N	Follow-up Required	2026-01-22 12:52:57.989778	2026-01-22 12:52:57.989778	[]	\N	\N	[]
47	70	56	39	\N	Completed			\N	Follow-up Required	2026-01-22 16:14:15.036003	2026-01-22 16:14:15.036003	[]	\N	\N	[]
48	84	55	39	\N	Completed	eat NaCL	low BP	2026-01-31	Follow-up Required	2026-01-30 15:34:40.281199	2026-01-30 15:34:40.281199	[{"lab_name": "In-House", "test_name": "Blood Glucose Random"}]	\N	\N	[]
49	89	72	39	\N	Completed	REST	FRACTURE	2026-01-31	Follow-up Required	2026-01-30 17:02:51.246323	2026-01-30 17:02:51.246323	[{"lab_name": "In-House", "test_name": "Occlusal X-ray"}]	\N	\N	[]
\.


--
-- TOC entry 5910 (class 0 OID 20212)
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
-- TOC entry 5912 (class 0 OID 20224)
-- Dependencies: 238
-- Data for Name: doctor_branch_departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_branch_departments (doc_hosp_dept_id, doctor_id, branch_id, department_id, is_primary, created_at) FROM stdin;
\.


--
-- TOC entry 5914 (class 0 OID 20234)
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
40	35	47	\N	Permanent	t	2025-12-18 12:11:44.523664	2025-12-18 12:27:27.192174
35	36	49	\N	Permanent	t	2026-01-02 16:14:48.333525	2026-01-02 16:14:48.333525
36	37	52	\N	Permanent	t	2026-01-07 12:12:11.457039	2026-01-07 12:12:11.457039
37	38	53	\N	Permanent	t	2026-01-08 11:52:40.331227	2026-01-08 11:52:40.331227
38	38	54	\N	Permanent	t	2026-01-08 11:52:40.331227	2026-01-08 11:52:40.331227
39	39	55	\N	Permanent	t	2026-01-20 12:25:51.644667	2026-01-20 12:25:51.644667
47	44	55	\N	Permanent	t	2026-01-23 17:59:07.354489	2026-01-23 17:59:07.354489
48	45	55	\N	Permanent	t	2026-01-23 18:07:18.915281	2026-01-23 18:07:18.915281
\.


--
-- TOC entry 5916 (class 0 OID 20246)
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
20	35	1	t	2025-12-18 12:11:44.523664
21	36	16	t	2026-01-02 16:14:48.333525
22	37	1	t	2026-01-07 12:12:11.457039
23	38	13	t	2026-01-08 11:52:40.331227
24	39	9	t	2026-01-20 12:25:51.644667
25	44	1	t	2026-01-23 17:59:07.354489
26	45	9	t	2026-01-23 18:07:18.915281
\.


--
-- TOC entry 5918 (class 0 OID 20255)
-- Dependencies: 244
-- Data for Name: doctor_shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_shifts (doctor_shift_id, doctor_id, branch_id, shift_id, department_id, shift_date, attendance_status, check_in_time, check_out_time, patients_attended, notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5987 (class 0 OID 21477)
-- Dependencies: 313
-- Data for Name: doctor_weekly_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_weekly_schedules (schedule_id, doctor_id, branch_id, day_of_week, start_time, end_time, avg_consultation_time, is_active, created_at, updated_at) FROM stdin;
2	39	55	Thursday	09:00:00	17:00:00	15	t	2026-01-29 12:05:55.1288	2026-01-29 12:05:55.1288
3	39	55	Thursday	10:00:00	13:00:00	15	t	2026-01-29 16:38:31.834398	2026-01-29 16:38:31.834398
4	39	55	Friday	10:00:00	13:00:00	15	t	2026-01-30 12:36:09.477114	2026-01-30 12:36:09.477114
6	44	55	Friday	17:00:00	19:00:00	15	t	2026-01-30 12:50:25.98224	2026-01-30 12:50:25.98224
8	44	55	Monday	17:00:00	19:00:00	15	t	2026-01-30 12:50:26.004066	2026-01-30 12:50:26.004066
10	44	55	Tuesday	17:00:00	19:00:00	15	t	2026-01-30 12:50:26.034686	2026-01-30 12:50:26.034686
12	44	55	Wednesday	17:00:00	19:00:00	15	t	2026-01-30 12:50:26.063385	2026-01-30 12:50:26.063385
14	44	55	Thursday	17:00:00	19:00:00	15	t	2026-01-30 12:50:26.086327	2026-01-30 12:50:26.086327
16	44	55	Saturday	17:00:00	19:00:00	15	t	2026-01-30 12:50:26.115555	2026-01-30 12:50:26.115555
18	45	55	Friday	10:00:00	13:00:00	15	t	2026-01-30 12:50:42.313992	2026-01-30 12:50:42.313992
19	45	55	Friday	17:00:00	19:00:00	15	t	2026-01-30 12:50:42.349472	2026-01-30 12:50:42.349472
20	45	55	Monday	10:00:00	13:00:00	15	t	2026-01-30 12:50:42.365243	2026-01-30 12:50:42.365243
21	45	55	Monday	17:00:00	19:00:00	15	t	2026-01-30 12:50:42.38076	2026-01-30 12:50:42.38076
22	45	55	Tuesday	10:00:00	13:00:00	15	t	2026-01-30 12:50:42.391554	2026-01-30 12:50:42.391554
23	45	55	Tuesday	17:00:00	19:00:00	15	t	2026-01-30 12:50:42.408313	2026-01-30 12:50:42.408313
24	45	55	Wednesday	10:00:00	13:00:00	15	t	2026-01-30 12:50:42.430288	2026-01-30 12:50:42.430288
25	45	55	Wednesday	17:00:00	19:00:00	15	t	2026-01-30 12:50:42.44713	2026-01-30 12:50:42.44713
26	45	55	Thursday	10:00:00	13:00:00	15	t	2026-01-30 12:50:42.460824	2026-01-30 12:50:42.460824
27	45	55	Thursday	17:00:00	19:00:00	15	t	2026-01-30 12:50:42.474562	2026-01-30 12:50:42.474562
28	45	55	Saturday	10:00:00	13:00:00	15	t	2026-01-30 12:50:42.488373	2026-01-30 12:50:42.488373
29	45	55	Saturday	17:00:00	19:00:00	15	t	2026-01-30 12:50:42.503468	2026-01-30 12:50:42.503468
30	45	55	Sunday	00:00:00	00:00:00	15	t	2026-01-30 12:50:42.517398	2026-01-30 12:50:42.517398
5	44	55	Friday	10:00:00	13:00:00	15	t	2026-01-30 12:50:25.964176	2026-01-30 17:21:31.012476
7	44	55	Monday	10:00:00	13:00:00	15	t	2026-01-30 12:50:25.996157	2026-01-30 17:21:31.079854
9	44	55	Tuesday	10:00:00	13:00:00	15	t	2026-01-30 12:50:26.020554	2026-01-30 17:21:31.111966
11	44	55	Wednesday	10:00:00	13:00:00	15	t	2026-01-30 12:50:26.050033	2026-01-30 17:21:31.180615
13	44	55	Thursday	10:00:00	13:00:00	15	t	2026-01-30 12:50:26.071526	2026-01-30 17:21:31.21354
15	44	55	Saturday	10:00:00	13:00:00	15	t	2026-01-30 12:50:26.100234	2026-01-30 17:21:31.232986
17	44	55	Sunday	00:00:00	00:00:00	15	t	2026-01-30 12:50:26.134822	2026-01-30 17:21:31.264266
\.


--
-- TOC entry 5920 (class 0 OID 20271)
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
35	142	satish	k	DOC104865	Male	1995-01-12	\N	\N	MS Surgeon	surgeon	12	KMC23145Z	\N	bangalore	\N	1500.00	t	\N	2025-12-18 12:11:44.523664	2025-12-18 12:11:44.523664	ABC Bank	78362739281234	ABCBA7836hd	In-house	\N
36	151	doc1	1	DOC688436	Male	1988-04-01	\N	\N	MBBS MS	Nephron	6	66765	\N	Bangalore	\N	1000.00	t	\N	2026-01-02 16:14:48.333525	2026-01-02 16:14:48.333525	bank	8787656545	87y8y8	In-house	uploads\\signature-1767350688330-261794234.jfif
37	162	doctor1	doclname	DOC131583	Male	1990-01-02	\N	\N	MS	Surgeon	10	KMC-023-121	\N	Bangalore	\N	500.00	t	\N	2026-01-07 12:12:11.457039	2026-01-07 12:12:11.457039	abc 	12345764537	abc234k1	In-house	\N
38	175	doc1	kaveri	DOC360532	Female	1988-11-11	\N	\N	MBBS	internal medicine	3	839884398497	\N	Cape Town	\N	998.00	t	\N	2026-01-08 11:52:40.331227	2026-01-08 11:52:40.331227	bank1	838585258	847876647	In-house	\N
39	178	Anju	S	DOC151988	Female	1995-06-20	\N	\N	MBBS., M.D., DVL.,	Dermatologist	10	TN79490	\N	CKK Cology, Erode	\N	400.00	t	\N	2026-01-20 12:25:51.644667	2026-01-20 12:25:51.644667	ICICI Bank 	47293749479	ICICI7397	In-house	uploads\\signature-1768892151599-238622764.png
44	185	Vimal	K	DOC347725	Male	2026-01-12	\N	\N	M.B.B.S., M.D., D.M.	Cardiologist	5	T438624368	\N	Electronic City	\N	250.00	t	\N	2026-01-23 17:59:07.354489	2026-01-23 17:59:07.354489	IOB Bank	1537577577755577	PUNB01234	In-house	uploads\\signature-1769171347332-602157023.png
45	186	Vikram	R	DOC839303	Male	2026-01-12	\N	\N	MBBS., MD	Dermatologist	5	864832468	\N	Vinay Nagar	\N	300.00	t	\N	2026-01-23 18:07:18.915281	2026-01-23 18:07:18.915281	BOB	864836486	846284	In-house	uploads\\signature-1769171838835-473777785.png
\.


--
-- TOC entry 5922 (class 0 OID 20289)
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
-- TOC entry 5924 (class 0 OID 20305)
-- Dependencies: 250
-- Data for Name: hospitals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hospitals (hospital_id, hospital_name, hospital_code, headquarters_address, contact_number, email, established_date, total_beds, hospital_type, accreditation, website, is_active, created_at, updated_at, logo, logo_url, enabled_modules) FROM stdin;
10	KV hospital	KV001		+91 9776698765		2025-12-08	0	Private	\N	\N	t	2025-12-08 10:39:46.204638	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
8	Kausalya Hospital	KH0001		+91 9876543234	kh@gmail.com	2024-01-05	100	Private	\N	\N	t	2025-12-05 10:15:34.112889	2025-12-16 10:46:21.382342	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
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
40	Nano Hospital	NANO001	Arekere bangalore	9847583746	nanohospital@gmail.com	2025-12-18	50	Private	\N	\N	t	2025-12-18 12:08:17.67229	2025-12-18 12:08:17.67229	\N	uploads\\logo-1766039897656-526769580.png	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "market", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "reception", "is_active": true}]
43	hp	HS78				2026-01-02	0	Private	\N	\N	t	2026-01-02 16:52:46.758205	2026-01-02 16:52:46.758205	\N	uploads\\logo-1767352966752-751398379.jfif	[{"id": "reception", "is_active": true}, {"id": "doc", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "lab", "is_active": true}]
45	Kaveri Clinic	HS009	LH Road, Gandhipuram,\r\nCoimbatore	7676567777	kaveri@kaveri.com	1988-02-21	50	Private	\N	\N	t	2026-01-07 16:56:54.292284	2026-01-07 17:08:36.302851	\N	uploads\\logo-1767785916297-100756864.png	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
42	Kashi	HSP001	123, A Colony, ST Street	8787466565	kashi@kashi.com	2025-12-26	\N	Private	\N	\N	t	2026-01-02 16:09:04.300273	2026-01-02 16:59:46.667811	\N	uploads\\logo-1767350344295-54790220.png	[{"id": "doc", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "reception", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "lab", "is_active": true}]
44	Kalyan	HS0012	123, hopstail road	7676567656	kalyan@kalyan.com	2026-01-07	0	Private	\N	\N	t	2026-01-07 12:08:44.692563	2026-01-07 12:08:44.692563	\N	\N	[{"id": "doc", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
9	Amren	AM001				2025-12-05	0	Private	\N	\N	f	2025-12-05 16:05:09.221919	2026-01-13 14:34:40.912511	\N	\N	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "lab", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "market", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "reception", "is_active": true}]
46	Care 24 Medical Centre & Hospital	C24MCH	XYZ, Periyar Nagar, Erode 638002	9123456789	helpdesk@care24.com	2008-06-19	150	Private	\N	\N	t	2026-01-20 12:07:54.34217	2026-01-20 12:09:38.037282	\N	uploads\\logo-1768891074308-750381756.jpg	[{"id": "doc", "is_active": true}, {"id": "nurse", "is_active": true}, {"id": "reception", "is_active": true}, {"id": "acc", "is_active": true}, {"id": "market", "is_active": true}, {"id": "pharma", "is_active": true}, {"id": "lab", "is_active": true}]
\.


--
-- TOC entry 5926 (class 0 OID 20319)
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
20	2	IP173002	Jane Smith	Dr. Jones	APP002746	2025-11-02	2025-11-06	Orthopedics	Star Health	75000.00	5000.00	0.00	0.00	70000.00	0.00	0.00	0.00	\N	\N	\N	\N	47	40	2025-12-18 13:29:54.569603	2025-12-18 13:29:54.569603	0	0	\N	0
19	1	IP173001	John Doe	Dr. Smith	APP00134	2025-11-01	2025-11-05	Cardiology	HDFC Ergo	50000.00	0.00	10000.00	0.00	40000.00	32000.00	0.00	4000.00	HDFC	2025-12-18	8475629238	Received	47	40	2025-12-18 13:29:54.569603	2025-12-18 13:31:28.053659	4000	0		1
21	1	IP1001	John Doe	Dr. Smith	APP001	2023-10-01	2023-10-05	Cardiology	HDFC Ergo	50000.00	0.00	0.00	0.00	40000.00	40000.00	10000.00	0.00	HDFC Bank	2023-10-10	UTR123456	Partial Payment	49	42	2026-01-02 17:43:26.279023	2026-01-02 17:43:26.279023	0	0	\N	0
22	2	IP1002	Jane Smith	Dr. Jones	APP002	2023-10-02	2023-10-06	Orthopedics	Star Health	75000.00	5000.00	0.00	0.00	70000.00	70000.00	0.00	0.00	SBI	2023-10-12	UTR789012	Full Payment	49	42	2026-01-02 17:43:26.279023	2026-01-02 17:43:26.279023	0	0	\N	0
23	1	IP1001	John Doe	Dr. Smith	APP001	2023-10-01	2023-10-05	Cardiology	HDFC Ergo	50000.00	0.00	0.00	0.00	40000.00	40000.00	10000.00	0.00	HDFC Bank	2023-10-10	UTR123456	Partial Payment	53	45	2026-01-08 14:22:00.839345	2026-01-08 14:22:00.839345	0	0	\N	0
24	2	IP1002	Jane Smith	Dr. Jones	APP002	2023-10-02	2023-10-06	Orthopedics	Star Health	75000.00	5000.00	0.00	0.00	70000.00	70000.00	0.00	0.00	SBI	2023-10-12	UTR789012	Full Payment	53	45	2026-01-08 14:22:00.839345	2026-01-08 14:22:00.839345	0	0	\N	0
25	1	IP1001	John Doe	Dr. Smith	APP001	2023-10-01	2023-10-05	Cardiology	HDFC Ergo	50000.00	0.00	0.00	0.00	40000.00	40000.00	10000.00	0.00	HDFC Bank	2026-01-08	UTR123456	Partial Payment	53	45	2026-01-08 14:25:03.332154	2026-01-08 14:25:03.332154	0	0	\N	0
26	2	IP1002	Jane Smith	Dr. Jones	APP002	2023-10-02	2023-10-06	Orthopedics	Star Health	75000.00	5000.00	0.00	0.00	70000.00	70000.00	0.00	0.00	SBI	2026-01-08	UTR789012	Full Payment	53	45	2026-01-08 14:25:03.332154	2026-01-08 14:25:03.332154	0	0	\N	0
27	1	IP1001	John Doe	Dr. Smith	APP001	2023-10-01	2023-10-05	Cardiology	HDFC Ergo	50000.00	0.00	0.00	0.00	40000.00	40000.00	10000.00	0.00	HDFC Bank	2026-01-08	UTR123456	Partial Payment	53	45	2026-01-08 14:25:25.25483	2026-01-08 14:25:25.25483	0	0	\N	0
28	2	IP1002	Jane Smith	Dr. Jones	APP002	2023-10-02	2023-10-06	Orthopedics	Star Health	75000.00	5000.00	0.00	0.00	70000.00	70000.00	0.00	0.00	SBI	2026-01-08	UTR789012	Full Payment	53	45	2026-01-08 14:25:25.25483	2026-01-08 14:25:25.25483	0	0	\N	0
29	1	IP1001	John Doe	Dr. Smith	APP001	2026-01-01	2026-01-05	Cardiology	HDFC Ergo	50000.00	0.00	0.00	0.00	40000.00	40000.00	10000.00	0.00	HDFC Bank	2026-01-08	UTR123456	Partial Payment	53	45	2026-01-08 14:26:58.726588	2026-01-08 14:26:58.726588	0	0	\N	0
30	2	IP1002	Jane Smith	Dr. Jones	APP002	2026-01-03	2026-01-06	Orthopedics	Star Health	75000.00	5000.00	0.00	0.00	70000.00	70000.00	0.00	0.00	SBI	2026-01-08	UTR789012	Full Payment	53	45	2026-01-08 14:26:58.726588	2026-01-08 14:26:58.726588	0	0	\N	0
\.


--
-- TOC entry 5928 (class 0 OID 20331)
-- Dependencies: 254
-- Data for Name: lead_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lead_data (id, name, mobile_number, hospital_name, address, email, description, demo_date, created_at) FROM stdin;
1	pavan	9857847363	testing	Bangalore	pavan@pavan.com		2025-12-23 11:05:00	2025-12-22 11:05:34.059243
\.


--
-- TOC entry 5989 (class 0 OID 21516)
-- Dependencies: 315
-- Data for Name: medical_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medical_services (service_id, service_code, service_name, category, is_active, created_at) FROM stdin;
1	PRO-0001	Consultation OPD	procedure	t	2026-01-30 15:02:17.965474
2	PRO-0002	Consultation- for Inpatients	procedure	t	2026-01-30 15:02:17.965474
3	PRO-0003	Dressings of wounds	procedure	t	2026-01-30 15:02:17.965474
4	PRO-0004	Suturing of wounds with local anesthesia	procedure	t	2026-01-30 15:02:17.965474
5	PRO-0005	Aspiration Plural Effusion - Diagnostic	procedure	t	2026-01-30 15:02:17.965474
6	PRO-0006	Aspiration Plural Effusion - Therapeutic	procedure	t	2026-01-30 15:02:17.965474
7	PRO-0007	Abdominal / Peritoneal Aspiration - Diagnostic / Ascitic tapping /\r\nparacentesis - Diagnostic	procedure	t	2026-01-30 15:02:17.965474
8	PRO-0008	Abdominal / Peritoneal Aspiration - Therapeutic/ Ascitic tapping /\r\nparacentesis- Therapeutic	procedure	t	2026-01-30 15:02:17.965474
9	PRO-0009	Pericardial Aspiration	procedure	t	2026-01-30 15:02:17.965474
10	PRO-0010	Joints Aspiration	procedure	t	2026-01-30 15:02:17.965474
11	PRO-0011	Biopsy Skin	procedure	t	2026-01-30 15:02:17.965474
12	PRO-0012	Removal of Stitches /Sutures (7- 12 sutures)	procedure	t	2026-01-30 15:02:17.965474
13	PRO-0013	Venesection	procedure	t	2026-01-30 15:02:17.965474
14	PRO-0014	Phimosis correction / Paraphimosis reduction / Circumcision Under LA	procedure	t	2026-01-30 15:02:17.965474
15	PRO-0015	Sternal puncture	procedure	t	2026-01-30 15:02:17.965474
16	PRO-0016	Injection /Sclerotherapy / Banding of Haemorrhoids	procedure	t	2026-01-30 15:02:17.965474
17	PRO-0017	Injection for Varicose Veins	procedure	t	2026-01-30 15:02:17.965474
18	PRO-0018	Urinary bladder Catheterisation	procedure	t	2026-01-30 15:02:17.965474
19	PRO-0019	Dilatation of Urethral stricture	procedure	t	2026-01-30 15:02:17.965474
20	PRO-0020	Incision & Drainage under local Anaesthesia (Large)	procedure	t	2026-01-30 15:02:17.965474
21	PRO-0021	Intercostal Drainage	procedure	t	2026-01-30 15:02:17.965474
22	PRO-0022	Peritoneal Dialysis	procedure	t	2026-01-30 15:02:17.965474
23	PRO-0023	Excision of Moles	procedure	t	2026-01-30 15:02:17.965474
24	PRO-0024	Excision of Warts	procedure	t	2026-01-30 15:02:17.965474
25	PRO-0025	Excision of Molluscum contagiosum	procedure	t	2026-01-30 15:02:17.965474
26	PRO-0026	Excision of Veneral Warts	procedure	t	2026-01-30 15:02:17.965474
27	PRO-0027	Excision of Corns	procedure	t	2026-01-30 15:02:17.965474
28	PRO-0028	I/D Injection Keloid	procedure	t	2026-01-30 15:02:17.965474
29	PRO-0029	Chemical Cautery (s)	procedure	t	2026-01-30 15:02:17.965474
30	PRO-0030	Subconjunctival/subtenonâ€™s injections in one eyes	procedure	t	2026-01-30 15:02:17.965474
31	PRO-0031	Subconjunctival/subtenonâ€™s injections in both eyes	procedure	t	2026-01-30 15:02:17.965474
32	PRO-0032	Pterygium Surgery	procedure	t	2026-01-30 15:02:17.965474
33	PRO-0033	Conjunctival Peritomy	procedure	t	2026-01-30 15:02:17.965474
34	PRO-0034	Conjunctival wound repair or exploration following blunt trauma	procedure	t	2026-01-30 15:02:17.965474
35	PRO-0035	Removal of corneal foreign body	procedure	t	2026-01-30 15:02:17.965474
36	PRO-0036	Cauterization of ulcer/subconjunctival injection in one eye	procedure	t	2026-01-30 15:02:17.965474
37	PRO-0037	Cauterization of ulcer/subconjunctival injection in both eyes	procedure	t	2026-01-30 15:02:17.965474
38	PRO-0038	Corneal graftingâ€”Penetrating keratoplasty	procedure	t	2026-01-30 15:02:17.965474
39	PRO-0039	Corneal graftingâ€”Lamellar keratoplasty	procedure	t	2026-01-30 15:02:17.965474
40	PRO-0040	Cyanoacrylate /fibrin glue application for corneal perforation	procedure	t	2026-01-30 15:02:17.965474
41	PRO-0041	Bandage contact lenses for corneal perforation	procedure	t	2026-01-30 15:02:17.965474
42	PRO-0042	Scleral grafting or conjunctival flap for corneal perforation	procedure	t	2026-01-30 15:02:17.965474
43	PRO-0043	Keratoconus correction with therapeutic contact lenses	procedure	t	2026-01-30 15:02:17.965474
44	PRO-0044	UV radiation for cross-linking for keratoconus	procedure	t	2026-01-30 15:02:17.965474
45	PRO-0045	EDTA for band shaped keratopathy	procedure	t	2026-01-30 15:02:17.965474
46	PRO-0046	Arcuate keratotomy for astigmatism	procedure	t	2026-01-30 15:02:17.965474
47	PRO-0047	Re-suturing (Primary suturing) of corneal wound	procedure	t	2026-01-30 15:02:17.965474
48	PRO-0048	Penetrating keratoplasty ---- with glaucoma surgery	procedure	t	2026-01-30 15:02:17.965474
49	PRO-0049	Penetrating keratoplasty --- with vitrectomy	procedure	t	2026-01-30 15:02:17.965474
50	PRO-0050	Penetrating keratoplasty ---- with IOL implantation	procedure	t	2026-01-30 15:02:17.965474
51	PRO-0051	DALK- Deep anterior lamellar keratoplasty	procedure	t	2026-01-30 15:02:17.965474
52	PRO-0052	Keratoprosthesis stage I and II	procedure	t	2026-01-30 15:02:17.965474
53	PRO-0053	DSAEK- Descemetâ€™s stripping automated endothelial keratoplasty	procedure	t	2026-01-30 15:02:17.965474
54	PRO-0054	ALTK- Automated lamellar therapeutic keratoplasty	procedure	t	2026-01-30 15:02:17.965474
55	PRO-0055	Probing and Syringing of lacrimal sac- in one eye	procedure	t	2026-01-30 15:02:17.965474
56	PRO-0056	Probing and Syringing of lacrimal sac- in both eye	procedure	t	2026-01-30 15:02:17.965474
57	PRO-0057	Dacryocystorhinostomyâ€”Plain	procedure	t	2026-01-30 15:02:17.965474
58	PRO-0058	Dacryocystorhinostomyâ€”Plain with intubation and/or with\r\nlacrimal implants	procedure	t	2026-01-30 15:02:17.965474
59	PRO-0059	Dacryocystorhinostomyâ€”conjunctival with implant	procedure	t	2026-01-30 15:02:17.965474
60	PRO-0060	Caliculoplasty	procedure	t	2026-01-30 15:02:17.965474
61	PRO-0061	Dacryocystectomy	procedure	t	2026-01-30 15:02:17.965474
62	PRO-0062	Punctal plugs for dry eyes	procedure	t	2026-01-30 15:02:17.965474
63	PRO-0063	Refraction	procedure	t	2026-01-30 15:02:17.965474
64	PRO-0064	Indirect Ophthalmoscopy	procedure	t	2026-01-30 15:02:17.965474
65	PRO-0065	Orthoptic check-up- with synoptophore	procedure	t	2026-01-30 15:02:17.965474
66	PRO-0066	Leesâ€™ charting or Hessâ€™ charting	procedure	t	2026-01-30 15:02:17.965474
67	PRO-0067	Orthoptic exercises	procedure	t	2026-01-30 15:02:17.965474
68	PRO-0068	Pleoptic exercises	procedure	t	2026-01-30 15:02:17.965474
69	PRO-0069	Perimetry/field testâ€”Goldman	procedure	t	2026-01-30 15:02:17.965474
70	PRO-0070	Perimetry/field testâ€” automated	procedure	t	2026-01-30 15:02:17.965474
71	PRO-0071	Fluorescein angiography for fundus or iris	procedure	t	2026-01-30 15:02:17.965474
72	PRO-0072	Ultrasound A- Scan	procedure	t	2026-01-30 15:02:17.965474
73	PRO-0073	Ultrasound B- Scan	procedure	t	2026-01-30 15:02:17.965474
74	PRO-0074	Fundus Photo Test	procedure	t	2026-01-30 15:02:17.965474
75	PRO-0075	Indocyanin green angiography	procedure	t	2026-01-30 15:02:17.965474
76	PRO-0076	Corneal endothelial cell count with specular microscopy	procedure	t	2026-01-30 15:02:17.965474
77	PRO-0077	Corneal topography	procedure	t	2026-01-30 15:02:17.965474
78	PRO-0078	Corneal pachymetry	procedure	t	2026-01-30 15:02:17.965474
79	PRO-0079	Auto-refraction	procedure	t	2026-01-30 15:02:17.965474
80	PRO-0080	Macular function tests	procedure	t	2026-01-30 15:02:17.965474
81	PRO-0081	Potential acuity metry	procedure	t	2026-01-30 15:02:17.965474
82	PRO-0082	Laser interferometry	procedure	t	2026-01-30 15:02:17.965474
83	PRO-0083	OCT-Optical coherence tomography	procedure	t	2026-01-30 15:02:17.965474
84	PRO-0084	HRT- Heidelbergâ€™s retinal tomogram	procedure	t	2026-01-30 15:02:17.965474
85	PRO-0085	GDX--- Nerve fibre layer analyzer	procedure	t	2026-01-30 15:02:17.965474
86	PRO-0086	UBM- Ultrasound bio microscopy	procedure	t	2026-01-30 15:02:17.965474
87	PRO-0087	Non Contact tonometry	procedure	t	2026-01-30 15:02:17.965474
88	PRO-0088	IOP measurement with schiotz	procedure	t	2026-01-30 15:02:17.965474
89	PRO-0089	IOP measurement with applation tonometry	procedure	t	2026-01-30 15:02:17.965474
90	PRO-0090	Three mirror examination for reti	procedure	t	2026-01-30 15:02:17.965474
91	PRO-0091	90 D lens examination	procedure	t	2026-01-30 15:02:17.965474
92	PRO-0092	Gonioscopy	procedure	t	2026-01-30 15:02:17.965474
93	PRO-0093	Chalazion incision and curettage in one eye	procedure	t	2026-01-30 15:02:17.965474
94	PRO-0094	Chalazion incision and curettage in both eyes	procedure	t	2026-01-30 15:02:17.965474
95	PRO-0095	Ptosis surgery with fasanella servat procedure	procedure	t	2026-01-30 15:02:17.965474
96	PRO-0096	Ptosis surgery with LPS resection one lid	procedure	t	2026-01-30 15:02:17.965474
97	PRO-0097	Ptosis surgery with Sling surgery one lid	procedure	t	2026-01-30 15:02:17.965474
98	PRO-0098	Ectropion surgery- one lid	procedure	t	2026-01-30 15:02:17.965474
99	PRO-0099	Ectropion surgery- both lids	procedure	t	2026-01-30 15:02:17.965474
100	PRO-0100	Epicanthus correction	procedure	t	2026-01-30 15:02:17.965474
101	PRO-0101	Cantholysis and canthotomy	procedure	t	2026-01-30 15:02:17.965474
102	PRO-0102	Entropion surgery- one lid	procedure	t	2026-01-30 15:02:17.965474
103	PRO-0103	Entropion surgery- both lids	procedure	t	2026-01-30 15:02:17.965474
104	PRO-0104	Tarsorraphy	procedure	t	2026-01-30 15:02:17.965474
105	PRO-0105	Suturing of lid lacerations	procedure	t	2026-01-30 15:02:17.965474
106	PRO-0106	Lid retraction repair	procedure	t	2026-01-30 15:02:17.965474
107	PRO-0107	Concretions removal	procedure	t	2026-01-30 15:02:17.965474
108	PRO-0108	Bucket handle procedure for lid tumors	procedure	t	2026-01-30 15:02:17.965474
109	PRO-0109	Cheek rotation flap for lid tumors	procedure	t	2026-01-30 15:02:17.965474
110	PRO-0110	Orbitotomy	procedure	t	2026-01-30 15:02:17.965474
111	PRO-0111	Enucleation	procedure	t	2026-01-30 15:02:17.965474
112	PRO-0112	Enucleation with orbital implants and artificial prosthesis	procedure	t	2026-01-30 15:02:17.965474
113	PRO-0113	Evisceration	procedure	t	2026-01-30 15:02:17.965474
114	PRO-0114	Evisceration with orbital implants and artificial prosthesis	procedure	t	2026-01-30 15:02:17.965474
115	PRO-0115	Telecanthus correction	procedure	t	2026-01-30 15:02:17.965474
116	PRO-0116	Orbital decompression	procedure	t	2026-01-30 15:02:17.965474
117	PRO-0117	Exenteration	procedure	t	2026-01-30 15:02:17.965474
118	PRO-0118	Exenteration with skin grafting	procedure	t	2026-01-30 15:02:17.965474
119	PRO-0119	Fracture orbital repair	procedure	t	2026-01-30 15:02:17.965474
120	PRO-0120	Retinal laser procedures	procedure	t	2026-01-30 15:02:17.965474
121	PRO-0121	Retinal detachment surgery	procedure	t	2026-01-30 15:02:17.965474
122	PRO-0122	Retinal detachment surgery with scleral buckling	procedure	t	2026-01-30 15:02:17.965474
123	PRO-0123	Buckle removal	procedure	t	2026-01-30 15:02:17.965474
124	PRO-0124	Silicone oil removal	procedure	t	2026-01-30 15:02:17.965474
125	PRO-0125	Anterior retinal cryopexy	procedure	t	2026-01-30 15:02:17.965474
126	PRO-0126	Squint correction for one eye	procedure	t	2026-01-30 15:02:17.965474
127	PRO-0127	Squint correction for both eyes	procedure	t	2026-01-30 15:02:17.965474
128	PRO-0128	Trabeculectomy	procedure	t	2026-01-30 15:02:17.965474
129	PRO-0129	Trabeculotomy	procedure	t	2026-01-30 15:02:17.965474
130	PRO-0130	Trabeculectomy with Trabeculotomy	procedure	t	2026-01-30 15:02:17.965474
131	PRO-0131	Trephition	procedure	t	2026-01-30 15:02:17.965474
132	PRO-0132	Goniotomy	procedure	t	2026-01-30 15:02:17.965474
133	PRO-0133	Glaucoma surgery with Glaucoma valves (valve cost extra)	procedure	t	2026-01-30 15:02:17.965474
134	PRO-0134	Cyclocryotherapy	procedure	t	2026-01-30 15:02:17.965474
135	PRO-0135	YAG laser iridotomy	procedure	t	2026-01-30 15:02:17.965474
136	PRO-0136	YAG laser capsulotomy	procedure	t	2026-01-30 15:02:17.965474
137	PRO-0137	ALT-Argon laser trabeculoplasty	procedure	t	2026-01-30 15:02:17.965474
138	PRO-0138	PDT-Photodymic therapy	procedure	t	2026-01-30 15:02:17.965474
139	PRO-0139	TTT- Transpupillary thermal therapy	procedure	t	2026-01-30 15:02:17.965474
140	PRO-0140	PTK- Phototherapeutic keratectomy	procedure	t	2026-01-30 15:02:17.965474
141	PRO-0141	Argon/diode laser for retinal detatchment	procedure	t	2026-01-30 15:02:17.965474
142	PRO-0142	Intralase application for keratoconus	procedure	t	2026-01-30 15:02:17.965474
143	PRO-0143	EOG- electro-oculogram	procedure	t	2026-01-30 15:02:17.965474
144	PRO-0144	ERG- Electro-retinogram	procedure	t	2026-01-30 15:02:17.965474
145	PRO-0145	VEP- visually evoked potential	procedure	t	2026-01-30 15:02:17.965474
146	PRO-0146	Vitrectomy- pars plana	procedure	t	2026-01-30 15:02:17.965474
147	PRO-0147	Intravitreal injections- of antibiotics	procedure	t	2026-01-30 15:02:17.965474
148	PRO-0148	Intravitreal injections- of lucentis excluding cost of drug	procedure	t	2026-01-30 15:02:17.965474
149	PRO-0149	X- Ray orbit	procedure	t	2026-01-30 15:02:17.965474
150	PRO-0150	CT-orbit and brain	procedure	t	2026-01-30 15:02:17.965474
151	PRO-0151	MRI- Orbit and brain	procedure	t	2026-01-30 15:02:17.965474
152	PRO-0152	Dacryocystography	procedure	t	2026-01-30 15:02:17.965474
153	PRO-0153	Orbital angio-graphical studies	procedure	t	2026-01-30 15:02:17.965474
154	PRO-0154	ECCE with IOL	procedure	t	2026-01-30 15:02:17.965474
155	PRO-0155	SICS with IOL	procedure	t	2026-01-30 15:02:17.965474
156	PRO-0156	Phaco with foldable IOL (silicone and acrylic)/PMMA IOL	procedure	t	2026-01-30 15:02:17.965474
157	PRO-0157	Pars plana lensectomy with/without IOL	procedure	t	2026-01-30 15:02:17.965474
158	PRO-0158	Secondary IOL implantation- AC IOL PC IOL or scleral\r\nfixated IOL	procedure	t	2026-01-30 15:02:17.965474
159	PRO-0159	Cataract extraction with IOL with capsular tension rings\r\n(Cionniâ€™s ring)	procedure	t	2026-01-30 15:02:17.965474
160	PRO-0160	Optic nerve sheathotomy	procedure	t	2026-01-30 15:02:17.965474
161	PRO-0161	Iridodialysis repair or papillary reconstruction	procedure	t	2026-01-30 15:02:17.965474
162	PRO-0162	Iris cyst removal	procedure	t	2026-01-30 15:02:17.965474
163	PRO-0163	Lid Abscess incision and Drainage	procedure	t	2026-01-30 15:02:17.965474
164	PRO-0164	Orbital Abscess incision and Drainage	procedure	t	2026-01-30 15:02:17.965474
165	PRO-0165	Biopsy	procedure	t	2026-01-30 15:02:17.965474
166	PRO-0166	Paracentesis	procedure	t	2026-01-30 15:02:17.965474
167	PRO-0167	Scleral graft for scleral melting or perforation	procedure	t	2026-01-30 15:02:17.965474
168	PRO-0168	Amniotic membrane grafting	procedure	t	2026-01-30 15:02:17.965474
169	PRO-0169	Cyclodiathermy	procedure	t	2026-01-30 15:02:17.965474
170	PRO-0170	Intraocular foreign body removal	procedure	t	2026-01-30 15:02:17.965474
171	PRO-0171	Electrolysis	procedure	t	2026-01-30 15:02:17.965474
172	PRO-0172	Perforating injury repair	procedure	t	2026-01-30 15:02:17.965474
173	PRO-0173	Botulinum injection for blepharospasm or squint	procedure	t	2026-01-30 15:02:17.965474
174	PRO-0174	Flap Operation per quadrant	procedure	t	2026-01-30 15:02:17.965474
175	PRO-0175	Gingivectomy per quadrant	procedure	t	2026-01-30 15:02:17.965474
176	PRO-0176	Reduction & immobilization of fracture- Maxilla Under LA	procedure	t	2026-01-30 15:02:17.965474
177	PRO-0177	Reduction & immobilization of fracture-Mandible Under LA	procedure	t	2026-01-30 15:02:17.965474
178	PRO-0178	splints/Cirucum mandibular wiring under LA	procedure	t	2026-01-30 15:02:17.965474
179	PRO-0179	splints/Cirucum mandibular wiring under GA	procedure	t	2026-01-30 15:02:17.965474
180	PRO-0180	Internal wire fixation/plate fixation of Maxilla under LA	procedure	t	2026-01-30 15:02:17.965474
181	PRO-0181	Internal wire fixation/plate fixation of Maxilla under GA	procedure	t	2026-01-30 15:02:17.965474
182	PRO-0182	Internal wire fixation/plate fixation of Mandible under LA	procedure	t	2026-01-30 15:02:17.965474
183	PRO-0183	Internal wire fixation/plate fixation of Mandible under GA	procedure	t	2026-01-30 15:02:17.965474
184	PRO-0184	Extraction per tooth under LA	procedure	t	2026-01-30 15:02:17.965474
185	PRO-0185	Complicated Ext. per Tooth under LA	procedure	t	2026-01-30 15:02:17.965474
186	PRO-0186	Extraction of impacted tooth under LA	procedure	t	2026-01-30 15:02:17.965474
187	PRO-0187	Extraction in mentally retarded/patients with systemic\r\ndiseases/patient with special needs under short term GA	procedure	t	2026-01-30 15:02:17.965474
188	PRO-0188	Cyst & tumour of Maxilla /mandible by enucleation/ excision/\r\nmarsupalisation upto 4 cms under LA	procedure	t	2026-01-30 15:02:17.965474
189	PRO-0189	Cyst & tumour of Maxilla/mandible by enucleation/ excision/\r\nmarsupalisation size more than 4 cms under LA	procedure	t	2026-01-30 15:02:17.965474
190	PRO-0190	Cyst & tumour of Maxilla/mandible by enucleation / excision /\r\nmarsupalisation size more than 4 cms under GA	procedure	t	2026-01-30 15:02:17.965474
191	PRO-0191	TM joint ankylosis- under GA	procedure	t	2026-01-30 15:02:17.965474
192	PRO-0192	Biopsy Intraoral-Soft tissue	procedure	t	2026-01-30 15:02:17.965474
193	PRO-0193	Biopsy Intraoral-Bone	procedure	t	2026-01-30 15:02:17.965474
194	PRO-0194	Hemi-mandibulectomy with graft	procedure	t	2026-01-30 15:02:17.965474
195	PRO-0195	Hemi-mandibulectomy without graft	procedure	t	2026-01-30 15:02:17.965474
196	PRO-0196	Segmental-mandibulectomy with graft	procedure	t	2026-01-30 15:02:17.965474
197	PRO-0197	Segmental-mandibulectomy without graft	procedure	t	2026-01-30 15:02:17.965474
198	PRO-0198	Maxillectomy- Total with graft	procedure	t	2026-01-30 15:02:17.965474
199	PRO-0199	Maxillectomy- Total without graft	procedure	t	2026-01-30 15:02:17.965474
200	PRO-0200	Maxillectomy- partial with graft	procedure	t	2026-01-30 15:02:17.965474
201	PRO-0201	Maxillectomy- partial without graft	procedure	t	2026-01-30 15:02:17.965474
202	PRO-0202	Release of fibrous bands & grafting -in (OSMF) treatment under GA	procedure	t	2026-01-30 15:02:17.965474
203	PRO-0203	Pre-prosthetic surgery- Alveoloplasty	procedure	t	2026-01-30 15:02:17.965474
204	PRO-0204	Pre-prosthetic surgery - ridge augmentation	procedure	t	2026-01-30 15:02:17.965474
205	PRO-0205	Root canal Treatment(RCT) Anterior teeth(per tooth)	procedure	t	2026-01-30 15:02:17.965474
206	PRO-0206	Root canal Treatment(RCT) Posterior teeth (per tooth)	procedure	t	2026-01-30 15:02:17.965474
207	PRO-0207	Apicoectomy- Single root	procedure	t	2026-01-30 15:02:17.965474
208	PRO-0208	Apicoectomy-Multiple roots	procedure	t	2026-01-30 15:02:17.965474
209	PRO-0209	Metal Crown-per unit	procedure	t	2026-01-30 15:02:17.965474
210	PRO-0210	Metal Crown with Acrylic facing per unit	procedure	t	2026-01-30 15:02:17.965474
211	PRO-0211	Complete single denture-metal based	procedure	t	2026-01-30 15:02:17.965474
212	PRO-0212	Complete denture- acrylic based per arch	procedure	t	2026-01-30 15:02:17.965474
213	PRO-0213	Removable partial denture-Metal based-upto 3 teeth	procedure	t	2026-01-30 15:02:17.965474
214	PRO-0214	Removable partial denture-Metal based-more than 3 teeth	procedure	t	2026-01-30 15:02:17.965474
215	PRO-0215	Removable partial denture-Acrylic based-upto 3 teeth	procedure	t	2026-01-30 15:02:17.965474
216	PRO-0216	Removable partial denture-Acrylic based-more than 3 teeth	procedure	t	2026-01-30 15:02:17.965474
217	PRO-0217	Amalgum restoration-per tooth	procedure	t	2026-01-30 15:02:17.965474
218	PRO-0218	Composite Restoration-per tooth-anterior tooth	procedure	t	2026-01-30 15:02:17.965474
219	PRO-0219	Glas Ionomer-per tooth	procedure	t	2026-01-30 15:02:17.965474
220	PRO-0220	Scaling & polishing	procedure	t	2026-01-30 15:02:17.965474
221	PRO-0221	Removable Orthodontics appliance- per Arch	procedure	t	2026-01-30 15:02:17.965474
222	PRO-0222	Fixed Orhtodontics-per Arch	procedure	t	2026-01-30 15:02:17.965474
223	PRO-0223	Space maintainers-Fixed	procedure	t	2026-01-30 15:02:17.965474
224	PRO-0224	Habit breaking appliances-removable	procedure	t	2026-01-30 15:02:17.965474
225	PRO-0225	Habit breaking appliances-Fixed	procedure	t	2026-01-30 15:02:17.965474
226	PRO-0226	Expansion plate	procedure	t	2026-01-30 15:02:17.965474
227	PRO-0227	Feeding appliance for cleft palate	procedure	t	2026-01-30 15:02:17.965474
228	PRO-0228	Maxillo-facial prosthesis (sal/auricular/orbital/facial lost part)	procedure	t	2026-01-30 15:02:17.965474
229	PRO-0229	Functional orthodentic appliances	procedure	t	2026-01-30 15:02:17.965474
230	PRO-0230	Obturator (Maxillo-facial)	procedure	t	2026-01-30 15:02:17.965474
231	PRO-0231	Occlusal night guard(splint)	procedure	t	2026-01-30 15:02:17.965474
232	PRO-0232	Pure Tone Audiogram	procedure	t	2026-01-30 15:02:17.965474
233	PRO-0233	Impedence with stepedeal reflex	procedure	t	2026-01-30 15:02:17.965474
234	PRO-0234	SISI Tone Decay	procedure	t	2026-01-30 15:02:17.965474
235	PRO-0235	Multiple hearing assessment test to Adults	procedure	t	2026-01-30 15:02:17.965474
236	PRO-0236	Speech Discrimination Score	procedure	t	2026-01-30 15:02:17.965474
237	PRO-0237	Speech Assessment	procedure	t	2026-01-30 15:02:17.965474
238	PRO-0238	Speech therapy per session of 30-40 minutes	procedure	t	2026-01-30 15:02:17.965474
239	PRO-0239	Cold Calorie Test for Vestibular function	procedure	t	2026-01-30 15:02:17.965474
240	PRO-0240	Removal of foreign body From Nose	procedure	t	2026-01-30 15:02:17.965474
241	PRO-0241	Removal of foreign body From Ear	procedure	t	2026-01-30 15:02:17.965474
242	PRO-0242	Syringing (Ear)	procedure	t	2026-01-30 15:02:17.965474
243	PRO-0243	Polyp removal under LA	procedure	t	2026-01-30 15:02:17.965474
244	PRO-0244	Polyp removal under GA	procedure	t	2026-01-30 15:02:17.965474
245	PRO-0245	Peritonsillar abscess Drainage under LA	procedure	t	2026-01-30 15:02:17.965474
246	PRO-0246	Myringoplasty	procedure	t	2026-01-30 15:02:17.965474
247	PRO-0247	Staepedectomy	procedure	t	2026-01-30 15:02:17.965474
248	PRO-0248	Myringotomy with Grommet insertion	procedure	t	2026-01-30 15:02:17.965474
249	PRO-0249	Tympanotomy	procedure	t	2026-01-30 15:02:17.965474
250	PRO-0250	Tympanoplasty	procedure	t	2026-01-30 15:02:17.965474
251	PRO-0251	Mastoidectomy	procedure	t	2026-01-30 15:02:17.965474
252	PRO-0252	Otoplasty	procedure	t	2026-01-30 15:02:17.965474
253	PRO-0253	Labyrinthectomy	procedure	t	2026-01-30 15:02:17.965474
254	PRO-0254	Skull Base surgery	procedure	t	2026-01-30 15:02:17.965474
255	PRO-0255	Facial Nerve Decompression	procedure	t	2026-01-30 15:02:17.965474
256	PRO-0256	Septoplasty	procedure	t	2026-01-30 15:02:17.965474
257	PRO-0257	Submucous Resection	procedure	t	2026-01-30 15:02:17.965474
258	PRO-0258	Septo-rhinoplasty	procedure	t	2026-01-30 15:02:17.965474
259	PRO-0259	Rhinoplasty- Non-cosmetic	procedure	t	2026-01-30 15:02:17.965474
260	PRO-0260	Fracture Reduction	procedure	t	2026-01-30 15:02:17.965474
261	PRO-0261	Intra nasal Diathermy	procedure	t	2026-01-30 15:02:17.965474
262	PRO-0262	Turbinectomy	procedure	t	2026-01-30 15:02:17.965474
263	PRO-0263	Endoscopic DCR	procedure	t	2026-01-30 15:02:17.965474
264	PRO-0264	Endoscopic Surgery	procedure	t	2026-01-30 15:02:17.965474
265	PRO-0265	Septal Perforation Repair	procedure	t	2026-01-30 15:02:17.965474
266	PRO-0266	Antrum Puncture	procedure	t	2026-01-30 15:02:17.965474
267	PRO-0267	Lateral Rhinotomy	procedure	t	2026-01-30 15:02:17.965474
268	PRO-0268	Cranio-facial resection	procedure	t	2026-01-30 15:02:17.965474
269	PRO-0269	Caldwell Luc Surgery	procedure	t	2026-01-30 15:02:17.965474
270	PRO-0270	Angiofibroma Excision	procedure	t	2026-01-30 15:02:17.965474
271	PRO-0271	Endoscopic Hypophysectomy	procedure	t	2026-01-30 15:02:17.965474
272	PRO-0272	Endoscopic Optic Nerve Decompression	procedure	t	2026-01-30 15:02:17.965474
273	PRO-0273	Decompression of Orbit	procedure	t	2026-01-30 15:02:17.965474
274	PRO-0274	Punch/Wedge biopsy	procedure	t	2026-01-30 15:02:17.965474
275	PRO-0275	Tonsillectomy	procedure	t	2026-01-30 15:02:17.965474
276	PRO-0276	Uvulo-palatoplasty	procedure	t	2026-01-30 15:02:17.965474
277	PRO-0277	FESS for antrochoal polyp	procedure	t	2026-01-30 15:02:17.965474
278	PRO-0278	FESS for ethmoidal polyp	procedure	t	2026-01-30 15:02:17.965474
279	PRO-0279	Polyp removal ear	procedure	t	2026-01-30 15:02:17.965474
280	PRO-0280	Polyp removal Nose(Septal polyp)	procedure	t	2026-01-30 15:02:17.965474
281	PRO-0281	Mastoidectomy plus Ossciculoplasty including TORP or PORP	procedure	t	2026-01-30 15:02:17.965474
282	PRO-0282	Endolymphatic sac decompression	procedure	t	2026-01-30 15:02:17.965474
283	PRO-0283	Diagnostic endoscopy under GA	procedure	t	2026-01-30 15:02:17.965474
284	PRO-0284	Yonges operation for Atrophic rhinitis	procedure	t	2026-01-30 15:02:17.965474
285	PRO-0285	Vidian neurectomy for vasomotor Rhinitis	procedure	t	2026-01-30 15:02:17.965474
286	PRO-0286	Nasal Packing-anterior	procedure	t	2026-01-30 15:02:17.965474
287	PRO-0287	Nasal Packing-posterior	procedure	t	2026-01-30 15:02:17.965474
288	PRO-0288	Ranula Excision	procedure	t	2026-01-30 15:02:17.965474
289	PRO-0289	Tongue Tie excision	procedure	t	2026-01-30 15:02:17.965474
290	PRO-0290	Sub Mandibular Duct Lithotomy	procedure	t	2026-01-30 15:02:17.965474
291	PRO-0291	Adenoidectomy	procedure	t	2026-01-30 15:02:17.965474
292	PRO-0292	Palatopharyngoplasty	procedure	t	2026-01-30 15:02:17.965474
293	PRO-0293	Pharyngoplasty	procedure	t	2026-01-30 15:02:17.965474
294	PRO-0294	Styloidectomy	procedure	t	2026-01-30 15:02:17.965474
295	PRO-0295	Direct laryngoscopy including Biopsy under GA	procedure	t	2026-01-30 15:02:17.965474
296	PRO-0296	Oesophagoscopy/foreign body removal from	procedure	t	2026-01-30 15:02:17.965474
297	PRO-0297	Bronchoscopy with F.B.removal	procedure	t	2026-01-30 15:02:17.965474
298	PRO-0298	Other Major Surgery	procedure	t	2026-01-30 15:02:17.965474
299	PRO-0299	Other Minor Surgery	procedure	t	2026-01-30 15:02:17.965474
300	PRO-0300	Ear Lobe Repair one side	procedure	t	2026-01-30 15:02:17.965474
301	PRO-0301	Excision of Pinna for Growth (Squamous/Basal/ Injuries) Skin Only	procedure	t	2026-01-30 15:02:17.965474
302	PRO-0302	Excision of Pinna for Growth (Squamous/Basal/ Injuries) Skin and Cartilage	procedure	t	2026-01-30 15:02:17.965474
303	PRO-0303	Partial Amputation of Pinna	procedure	t	2026-01-30 15:02:17.965474
304	PRO-0304	Total Amputation of Pinna	procedure	t	2026-01-30 15:02:17.965474
305	PRO-0305	Total Amputation & Excision of External Auditory Meatus	procedure	t	2026-01-30 15:02:17.965474
306	PRO-0306	Excision of Cystic Hygroma	procedure	t	2026-01-30 15:02:17.965474
307	PRO-0307	Excision of Cystic Hygroma Extensive	procedure	t	2026-01-30 15:02:17.965474
308	PRO-0308	Excision of Branchial Cyst	procedure	t	2026-01-30 15:02:17.965474
309	PRO-0309	Excision of Branchial Sinus	procedure	t	2026-01-30 15:02:17.965474
310	PRO-0310	Excision of Pharyngeal Diverticulum	procedure	t	2026-01-30 15:02:17.965474
311	PRO-0311	Excision of Carotid Body-Tumours	procedure	t	2026-01-30 15:02:17.965474
312	PRO-0312	Operation for Cervical Rib	procedure	t	2026-01-30 15:02:17.965474
313	PRO-0313	Block Dissection of Cervical Lymph Nodes	procedure	t	2026-01-30 15:02:17.965474
314	PRO-0314	Pharyngectomy & Reconstruction	procedure	t	2026-01-30 15:02:17.965474
315	PRO-0315	Operation for Carcinoma Lip - Wedge-Excision	procedure	t	2026-01-30 15:02:17.965474
316	PRO-0316	Operation for Carcinoma Lip - Vermilionectomy	procedure	t	2026-01-30 15:02:17.965474
317	PRO-0317	Operation for Carcinoma Lip - Wedge Excision and Vermilonectomy	procedure	t	2026-01-30 15:02:17.965474
318	PRO-0318	Estlander Operation	procedure	t	2026-01-30 15:02:17.965474
319	PRO-0319	Abbe Operation	procedure	t	2026-01-30 15:02:17.965474
320	PRO-0320	Cheek Advancement	procedure	t	2026-01-30 15:02:17.965474
321	PRO-0321	Excision of the Maxilla	procedure	t	2026-01-30 15:02:17.965474
322	PRO-0322	Excision of mandible-segmental	procedure	t	2026-01-30 15:02:17.965474
323	PRO-0323	Mandibulectomy	procedure	t	2026-01-30 15:02:17.965474
324	PRO-0324	Partial Glossectomy	procedure	t	2026-01-30 15:02:17.965474
325	PRO-0325	Hemiglossectomy	procedure	t	2026-01-30 15:02:17.965474
326	PRO-0326	Total Glossectomy	procedure	t	2026-01-30 15:02:17.965474
327	PRO-0327	Commondo Operation	procedure	t	2026-01-30 15:02:17.965474
328	PRO-0328	Parotidectomy - Superficial	procedure	t	2026-01-30 15:02:17.965474
329	PRO-0329	Parotidectomy - Total	procedure	t	2026-01-30 15:02:17.965474
330	PRO-0330	Parotidectomy - Radical	procedure	t	2026-01-30 15:02:17.965474
331	PRO-0331	Repair of Parotid Duct	procedure	t	2026-01-30 15:02:17.965474
332	PRO-0332	Removal of Submandibular Salivary gland	procedure	t	2026-01-30 15:02:17.965474
333	PRO-0333	Hemithyroidectomy	procedure	t	2026-01-30 15:02:17.965474
334	PRO-0334	Partial Thyroidectomy (lobectomy)	procedure	t	2026-01-30 15:02:17.965474
335	PRO-0335	Subtotal Thyroidectomy	procedure	t	2026-01-30 15:02:17.965474
336	PRO-0336	Total Thyroidectomy	procedure	t	2026-01-30 15:02:17.965474
337	PRO-0337	Resection Enucleation of thyroid Adenoma	procedure	t	2026-01-30 15:02:17.965474
338	PRO-0338	Total Thyroidectomy and Block Dissection	procedure	t	2026-01-30 15:02:17.965474
339	PRO-0339	Excision of Lingual Thyroid	procedure	t	2026-01-30 15:02:17.965474
340	PRO-0340	Excision of Thyroglossal Cyst/Fistula	procedure	t	2026-01-30 15:02:17.965474
341	PRO-0341	Excision of Parathyroid Adenoma/Carcinoma	procedure	t	2026-01-30 15:02:17.965474
342	PRO-0342	Laryngectomy	procedure	t	2026-01-30 15:02:17.965474
343	PRO-0343	Laryngo Pharyngectomy	procedure	t	2026-01-30 15:02:17.965474
344	PRO-0344	Hyoid Suspension	procedure	t	2026-01-30 15:02:17.965474
345	PRO-0345	Genioplasty	procedure	t	2026-01-30 15:02:17.965474
346	PRO-0346	Direct Laryngoscopy including biopsy under GA	procedure	t	2026-01-30 15:02:17.965474
347	PRO-0347	Phonosurgery	procedure	t	2026-01-30 15:02:17.965474
348	PRO-0348	Fibroptic examition of Larynx under LA	procedure	t	2026-01-30 15:02:17.965474
349	PRO-0349	Microlaryngeal Surgery	procedure	t	2026-01-30 15:02:17.965474
350	PRO-0350	Laryngofissure	procedure	t	2026-01-30 15:02:17.965474
351	PRO-0351	Tracheal Stenosis Excision	procedure	t	2026-01-30 15:02:17.965474
352	PRO-0352	Excisional Biopsies	procedure	t	2026-01-30 15:02:17.965474
353	PRO-0353	Benign Tumour Excisions	procedure	t	2026-01-30 15:02:17.965474
354	PRO-0354	Temporal Bone subtotal resection	procedure	t	2026-01-30 15:02:17.965474
355	PRO-0355	Modified Radical Neck Dissection	procedure	t	2026-01-30 15:02:17.965474
356	PRO-0356	Carotid Body Excision	procedure	t	2026-01-30 15:02:17.965474
357	PRO-0357	Total Laryngectomy	procedure	t	2026-01-30 15:02:17.965474
358	PRO-0358	Flap Reconstructive Surgery	procedure	t	2026-01-30 15:02:17.965474
359	PRO-0359	Parapharyngeal Tumour Excision	procedure	t	2026-01-30 15:02:17.965474
360	PRO-0360	Other Major Surgery	procedure	t	2026-01-30 15:02:17.965474
361	PRO-0361	Other Minor Surgery	procedure	t	2026-01-30 15:02:17.965474
362	PRO-0362	Drainage of abscess	procedure	t	2026-01-30 15:02:17.965474
363	PRO-0363	Excision of lumps	procedure	t	2026-01-30 15:02:17.965474
364	PRO-0364	Local mastectomy-simple	procedure	t	2026-01-30 15:02:17.965474
365	PRO-0365	Radical mastectomy-formal or modified.	procedure	t	2026-01-30 15:02:17.965474
366	PRO-0366	Excision of mammary fistula	procedure	t	2026-01-30 15:02:17.965474
367	PRO-0367	Segmental resection of breast	procedure	t	2026-01-30 15:02:17.965474
368	PRO-0368	Other Major Surgery	procedure	t	2026-01-30 15:02:17.965474
369	PRO-0369	Other Minor Surgery	procedure	t	2026-01-30 15:02:17.965474
370	PRO-0370	Injury Of Superficial Soft Tissues	procedure	t	2026-01-30 15:02:17.965474
371	PRO-0371	Suturing of small wounds	procedure	t	2026-01-30 15:02:17.965474
372	PRO-0372	Secondary suture of wounds	procedure	t	2026-01-30 15:02:17.965474
373	PRO-0373	Debridement of wounds	procedure	t	2026-01-30 15:02:17.965474
374	PRO-0374	Removal Of Foreign Bodies- without C-ARM	procedure	t	2026-01-30 15:02:17.965474
375	PRO-0375	Excision of Cervical Lymph Node under LA	procedure	t	2026-01-30 15:02:17.965474
376	PRO-0376	Excision of Axillary Lymph Node under Gl Anaesthesia	procedure	t	2026-01-30 15:02:17.965474
377	PRO-0377	Excision of Inguinal Lymph Node under LA	procedure	t	2026-01-30 15:02:17.965474
378	PRO-0378	Excision Biopsy of Ulcers	procedure	t	2026-01-30 15:02:17.965474
379	PRO-0379	Excision Biopsy of Superficial Lumps	procedure	t	2026-01-30 15:02:17.965474
380	PRO-0380	Incision Biopsy of Growths/Ulcers	procedure	t	2026-01-30 15:02:17.965474
381	PRO-0381	Trucut Needle Biopsy (Including Needle)	procedure	t	2026-01-30 15:02:17.965474
382	PRO-0382	Percutaneous Kidney Biopsy	procedure	t	2026-01-30 15:02:17.965474
383	PRO-0383	Marrow Biopsy (Open)	procedure	t	2026-01-30 15:02:17.965474
384	PRO-0384	Muscle Biopsy	procedure	t	2026-01-30 15:02:17.965474
385	PRO-0385	Scalene Node Biopsy	procedure	t	2026-01-30 15:02:17.965474
386	PRO-0386	Excision of Sebaceous Cysts	procedure	t	2026-01-30 15:02:17.965474
387	PRO-0387	Excision of Superficial Lipoma	procedure	t	2026-01-30 15:02:17.965474
388	PRO-0388	Excision of Superficial Neurofibroma	procedure	t	2026-01-30 15:02:17.965474
389	PRO-0389	Excision of Dermoid Cysts	procedure	t	2026-01-30 15:02:17.965474
390	PRO-0390	Haemorrhoidectomy	procedure	t	2026-01-30 15:02:17.965474
391	PRO-0391	Stappler haemorrhoidectomy	procedure	t	2026-01-30 15:02:17.965474
392	PRO-0392	keloid excision	procedure	t	2026-01-30 15:02:17.965474
393	PRO-0393	Varicose vein Surgery- Trendelenburg operation with suturing or ligation	procedure	t	2026-01-30 15:02:17.965474
394	PRO-0394	Atresia of Oesophagus and Tracheo Oesophageal Fistula	procedure	t	2026-01-30 15:02:17.965474
395	PRO-0395	Operations for Replacement of Oesophagus by Colon	procedure	t	2026-01-30 15:02:17.965474
396	PRO-0396	Oesophagectomy for Carcinoma Easophagus	procedure	t	2026-01-30 15:02:17.965474
397	PRO-0397	Oesophageal Intubation (Mausseau Barbin Tube)	procedure	t	2026-01-30 15:02:17.965474
398	PRO-0398	Achalasia Cardia Transthoracic	procedure	t	2026-01-30 15:02:17.965474
399	PRO-0399	Achalasia Cardia Abdominal	procedure	t	2026-01-30 15:02:17.965474
400	PRO-0400	Oesophago Gastrectomy for mid 1/3 lesion	procedure	t	2026-01-30 15:02:17.965474
401	PRO-0401	Hellerâ€™s Operation	procedure	t	2026-01-30 15:02:17.965474
402	PRO-0402	Colon-Inter position or Replacement of Oesophagus	procedure	t	2026-01-30 15:02:17.965474
403	PRO-0403	Oesophago Gastrectomy â€“ Lower Corringers procedure	procedure	t	2026-01-30 15:02:17.965474
404	PRO-0404	Other Major Surgery	procedure	t	2026-01-30 15:02:17.965474
405	PRO-0405	Other Minor Surgery	procedure	t	2026-01-30 15:02:17.965474
406	PRO-0406	Gastroscopy	procedure	t	2026-01-30 15:02:17.965474
407	PRO-0407	Gastric & Duodenal Biopsy (Endoscopic)	procedure	t	2026-01-30 15:02:17.965474
408	PRO-0408	Pyloromyotomy	procedure	t	2026-01-30 15:02:17.965474
409	PRO-0409	Gastrostomy	procedure	t	2026-01-30 15:02:17.965474
410	PRO-0410	Simple Closure of Perforated peptic Ulcer	procedure	t	2026-01-30 15:02:17.965474
411	PRO-0411	Vagotomy Pyleroplasty / Gastro Jejunostomy	procedure	t	2026-01-30 15:02:17.965474
412	PRO-0412	Duodenojejunostomy	procedure	t	2026-01-30 15:02:17.965474
413	PRO-0413	Partial/Subtotal Gastrectomy for Carcinoma	procedure	t	2026-01-30 15:02:17.965474
414	PRO-0414	Partial/Subtotal Gastrectomy for Ulcer	procedure	t	2026-01-30 15:02:17.965474
415	PRO-0415	Operation for Bleeding Peptic Ulcer	procedure	t	2026-01-30 15:02:17.965474
416	PRO-0416	Operation for Gastrojejunal Ulcer	procedure	t	2026-01-30 15:02:17.965474
417	PRO-0417	Total Gastrectomy for Cancer	procedure	t	2026-01-30 15:02:17.965474
418	PRO-0418	Highly Selective Vagotomy	procedure	t	2026-01-30 15:02:17.965474
419	PRO-0419	Selective Vagotomy & Drainage	procedure	t	2026-01-30 15:02:17.965474
420	PRO-0420	Congenital Diaphragmatic Hernia	procedure	t	2026-01-30 15:02:17.965474
421	PRO-0421	Hiatus Hernia Repair- Abdominal	procedure	t	2026-01-30 15:02:17.965474
422	PRO-0422	Hiatus Hernia Repair- Transthoracic	procedure	t	2026-01-30 15:02:17.965474
423	PRO-0423	Exploratory Laparotomy (open)	procedure	t	2026-01-30 15:02:17.965474
424	PRO-0424	Epigastric Hernia Repair	procedure	t	2026-01-30 15:02:17.965474
425	PRO-0425	Umbilical Hernia Repair	procedure	t	2026-01-30 15:02:17.965474
426	PRO-0426	Ventral /incisional Hernia Repair	procedure	t	2026-01-30 15:02:17.965474
427	PRO-0427	Inguinal Hernia Herniorraphy	procedure	t	2026-01-30 15:02:17.965474
428	PRO-0428	Inguinal Hernia - Hernioplasty	procedure	t	2026-01-30 15:02:17.965474
429	PRO-0429	Femoral Hernia Repair	procedure	t	2026-01-30 15:02:17.965474
430	PRO-0430	Rare Hernias Repair (Spigalion Obturator Lumbar Sciatic)	procedure	t	2026-01-30 15:02:17.965474
431	PRO-0431	Splenectomy - For Trauma	procedure	t	2026-01-30 15:02:17.965474
432	PRO-0432	Splenectomy - For Hypersplenism	procedure	t	2026-01-30 15:02:17.965474
433	PRO-0433	Splenorenal Anastomosis	procedure	t	2026-01-30 15:02:17.965474
434	PRO-0434	Portocaval Anastomosis	procedure	t	2026-01-30 15:02:17.965474
435	PRO-0435	Direct Operation on Oesophagus for Portal Hypertension	procedure	t	2026-01-30 15:02:17.965474
436	PRO-0436	Mesentericocaval Anastomosis	procedure	t	2026-01-30 15:02:17.965474
437	PRO-0437	Warren Shunt	procedure	t	2026-01-30 15:02:17.965474
438	PRO-0438	Pancerato Duodenectomy	procedure	t	2026-01-30 15:02:17.965474
439	PRO-0439	By Pass Procedure for Inoperable Carcinoma of Pancreas	procedure	t	2026-01-30 15:02:17.965474
440	PRO-0440	Cystojejunostomy or Cystogastrostomy	procedure	t	2026-01-30 15:02:17.965474
441	PRO-0441	Cholecystectomy	procedure	t	2026-01-30 15:02:17.965474
442	PRO-0442	Cholecystectomy & Exploration of CBD	procedure	t	2026-01-30 15:02:17.965474
443	PRO-0443	Repair of CBD	procedure	t	2026-01-30 15:02:17.965474
444	PRO-0444	Operation for Hydatid Cyst of Liver	procedure	t	2026-01-30 15:02:17.965474
445	PRO-0445	Cholecystostomy	procedure	t	2026-01-30 15:02:17.965474
446	PRO-0446	Hepatic Resections (Lobectomy /Hepatectomy)	procedure	t	2026-01-30 15:02:17.965474
447	PRO-0447	Operation on Adrenal Glands - Bilateral	procedure	t	2026-01-30 15:02:17.965474
448	PRO-0448	Operation on Adrenal Glands - Unilateral	procedure	t	2026-01-30 15:02:17.965474
449	PRO-0449	Appendicectomy	procedure	t	2026-01-30 15:02:17.965474
450	PRO-0450	Appendicular Abscess â€“ Drainage	procedure	t	2026-01-30 15:02:17.965474
451	PRO-0451	Mesenteric Cyst- Excision	procedure	t	2026-01-30 15:02:17.965474
452	PRO-0452	Peritonioscopy/Laparoscopy	procedure	t	2026-01-30 15:02:17.965474
453	PRO-0453	Jejunostomy	procedure	t	2026-01-30 15:02:17.965474
454	PRO-0454	Ileostomy	procedure	t	2026-01-30 15:02:17.965474
455	PRO-0455	Resection & Anastomosis of Small Intestine including exploratory\r\nLaparotomy	procedure	t	2026-01-30 15:02:17.965474
456	PRO-0456	Duodenal Diverticulum	procedure	t	2026-01-30 15:02:17.965474
457	PRO-0457	Operation for Intestinal Obstruction	procedure	t	2026-01-30 15:02:17.965474
458	PRO-0458	Operation for Intestinal perforation	procedure	t	2026-01-30 15:02:17.965474
459	PRO-0459	Benign Tumours of Small Intestine	procedure	t	2026-01-30 15:02:17.965474
460	PRO-0460	Excision of Small Intestine Fistula	procedure	t	2026-01-30 15:02:17.965474
461	PRO-0461	Operations for GI Bleed	procedure	t	2026-01-30 15:02:17.965474
462	PRO-0462	Operations for Haemorrhage of Small Intestines	procedure	t	2026-01-30 15:02:17.965474
463	PRO-0463	Operations of the Duplication of the Intestines--- including exploratory\r\nLaparotomy	procedure	t	2026-01-30 15:02:17.965474
464	PRO-0464	Operations for Recurrent Intestinal Obstruction (Noble\r\nPlication & Other Operations for Adhesions)	procedure	t	2026-01-30 15:02:17.965474
465	PRO-0465	Ilieosigmoidostomy and related resection	procedure	t	2026-01-30 15:02:17.965474
466	PRO-0466	Ilieotransverse Colostomy and related resection	procedure	t	2026-01-30 15:02:17.965474
467	PRO-0467	Caecostomy	procedure	t	2026-01-30 15:02:17.965474
468	PRO-0468	Loop Colostomy Transverse Sigmoid	procedure	t	2026-01-30 15:02:17.965474
469	PRO-0469	Terminal Colostomy	procedure	t	2026-01-30 15:02:17.965474
470	PRO-0470	Closure of Colostomy	procedure	t	2026-01-30 15:02:17.965474
471	PRO-0471	Right Hemi-Colectomy	procedure	t	2026-01-30 15:02:17.965474
472	PRO-0472	Left Hemi-Colectomy	procedure	t	2026-01-30 15:02:17.965474
473	PRO-0473	Total Colectomy	procedure	t	2026-01-30 15:02:17.965474
474	PRO-0474	Operations for Volvulus of Large Bowel	procedure	t	2026-01-30 15:02:17.965474
475	PRO-0475	Operations for Sigmoid Diverticulitis	procedure	t	2026-01-30 15:02:17.965474
476	PRO-0476	Fissure in Ano with Internal sphinctrectomy with fissurectomy	procedure	t	2026-01-30 15:02:17.965474
477	PRO-0477	Fissure in Ano - Fissurectomy	procedure	t	2026-01-30 15:02:17.965474
478	PRO-0478	Rectal Polyp-Excision	procedure	t	2026-01-30 15:02:17.965474
479	PRO-0479	Fistula in Ano - High Fistulectomy	procedure	t	2026-01-30 15:02:17.965474
480	PRO-0480	Fistula in Ano - Low Fistulectomy	procedure	t	2026-01-30 15:02:17.965474
481	PRO-0481	Prolapse Rectum - Theirch Wiring	procedure	t	2026-01-30 15:02:17.965474
482	PRO-0482	Prolapse Rectum - Rectopexy	procedure	t	2026-01-30 15:02:17.965474
483	PRO-0483	Prolapse Rectum - Grahams Operation	procedure	t	2026-01-30 15:02:17.965474
484	PRO-0484	Operations for Hirschsprungs Disease	procedure	t	2026-01-30 15:02:17.965474
485	PRO-0485	Excision of Pilonidal Sinus (open)	procedure	t	2026-01-30 15:02:17.965474
486	PRO-0486	Excision of Pilonidal Sinus with closure	procedure	t	2026-01-30 15:02:17.965474
487	PRO-0487	Abdomino-Perineal Excision of Rectum	procedure	t	2026-01-30 15:02:17.965474
488	PRO-0488	Anterior Resection of rectum	procedure	t	2026-01-30 15:02:17.965474
489	PRO-0489	Pull Through Abdominal Resection	procedure	t	2026-01-30 15:02:17.965474
490	PRO-0490	Retro Peritoneal Tumor Removal	procedure	t	2026-01-30 15:02:17.965474
491	PRO-0491	Radio ablation of varicose veins (RFA Ablation)	procedure	t	2026-01-30 15:02:17.965474
492	PRO-0492	Laser ablation of varicose veins	procedure	t	2026-01-30 15:02:17.965474
493	PRO-0493	Laparoscopic Fundoplication	procedure	t	2026-01-30 15:02:17.965474
494	PRO-0494	Laparoscopic Splenectomy	procedure	t	2026-01-30 15:02:17.965474
495	PRO-0495	Laparoscopic Removal of hydatid cyst	procedure	t	2026-01-30 15:02:17.965474
496	PRO-0496	Laparoscopic treatment of Pseudo Pancreatic cyst	procedure	t	2026-01-30 15:02:17.965474
497	PRO-0497	Laparoscopic Whipple's operation (Laparoscopic Pancreatico\r\nDuodenectomy	procedure	t	2026-01-30 15:02:17.965474
498	PRO-0498	Laparoscopic GI bypass operation	procedure	t	2026-01-30 15:02:17.965474
499	PRO-0499	Laparoscopic Total Colectomy	procedure	t	2026-01-30 15:02:17.965474
500	PRO-0500	Laparoscopic Hemicolectomy	procedure	t	2026-01-30 15:02:17.965474
501	PRO-0501	Laparoscopic Anterior Resection (of Intestine/ Rectum)	procedure	t	2026-01-30 15:02:17.965474
502	PRO-0502	Laparoscopic Cholecystetomy	procedure	t	2026-01-30 15:02:17.965474
503	PRO-0503	Laparoscopic Appedicectomy	procedure	t	2026-01-30 15:02:17.965474
504	PRO-0504	Laparoscopic Hernia - inguinoplasty (including Tacker and Mesh)	procedure	t	2026-01-30 15:02:17.965474
505	PRO-0505	Laparoscopic ventral Hernia Repair	procedure	t	2026-01-30 15:02:17.965474
506	PRO-0506	Laparoscopic Paraumblical Hernia Repair	procedure	t	2026-01-30 15:02:17.965474
507	PRO-0507	Laparoscopic Adrenelectomy	procedure	t	2026-01-30 15:02:17.965474
508	PRO-0508	Laparoscopic Nephrectomy	procedure	t	2026-01-30 15:02:17.965474
509	PRO-0509	Other Major Surgery	procedure	t	2026-01-30 15:02:17.965474
510	PRO-0510	Other Minor Surgery	procedure	t	2026-01-30 15:02:17.965474
511	PRO-0511	Coronary Care with Cardiac Monitoring (Room Rent extra)	procedure	t	2026-01-30 15:02:17.965474
512	PRO-0512	Compressed air / piped oxygen /per hour	procedure	t	2026-01-30 15:02:17.965474
513	PRO-0513	Ventilator charges (Per day)	procedure	t	2026-01-30 15:02:17.965474
514	PRO-0514	Paediatric care for New born (Per day)	procedure	t	2026-01-30 15:02:17.965474
515	PRO-0515	Incubator charges (Per day)	procedure	t	2026-01-30 15:02:17.965474
516	PRO-0516	Neonatal ICU charges (Per day)	procedure	t	2026-01-30 15:02:17.965474
517	PRO-0517	Resuscitation	procedure	t	2026-01-30 15:02:17.965474
518	PRO-0518	Exchange Transfusion	procedure	t	2026-01-30 15:02:17.965474
519	PRO-0519	Pneupack ventilator in Nursery (Per day)	procedure	t	2026-01-30 15:02:17.965474
520	PRO-0520	Atrial Septal Defect(ASD) closure\r\nVentricular septal defect (VSD) with graft	procedure	t	2026-01-30 15:02:17.965474
521	PRO-0522	TOF/TAPVC/TCPC/REV/RSOV repair	procedure	t	2026-01-30 15:02:17.965474
522	PRO-0523	BD Glenn/Left atrium myxoma	procedure	t	2026-01-30 15:02:17.965474
523	PRO-0524	Senning/Arterial Switch Operation (ASO) with graft	procedure	t	2026-01-30 15:02:17.965474
524	PRO-0525	Double Switch Operation (DSO)	procedure	t	2026-01-30 15:02:17.965474
525	PRO-0526	Atrioventricular(AV) canal repair	procedure	t	2026-01-30 15:02:17.965474
526	PRO-0527	Fontan PROCEDURE	procedure	t	2026-01-30 15:02:17.965474
527	PRO-0528	Conduit repair	procedure	t	2026-01-30 15:02:17.965474
528	PRO-0529	Coronary Artery Bypass Graft surgery (CABG)	procedure	t	2026-01-30 15:02:17.965474
529	PRO-0530	CABG + Intra-Aortic Balloon Pump (IABP)	procedure	t	2026-01-30 15:02:17.965474
530	PRO-0531	CABG + Valve.	procedure	t	2026-01-30 15:02:17.965474
531	PRO-0532	CABG without bypass.	procedure	t	2026-01-30 15:02:17.965474
532	PRO-0533	Ascending aorta replacement	procedure	t	2026-01-30 15:02:17.965474
533	PRO-0534	Double Valve Replacement (DVR)	procedure	t	2026-01-30 15:02:17.965474
534	PRO-0535	Mitral valve Replacement(MVR)/ Aortic valve Replacement(AVR)	procedure	t	2026-01-30 15:02:17.965474
535	PRO-0536	Mitral Valve repair + Aortic Valve repair	procedure	t	2026-01-30 15:02:17.965474
536	PRO-0537	Aorta femoral bypass	procedure	t	2026-01-30 15:02:17.965474
537	PRO-0538	Blalock-Taussig shunt (BT Shunt) / Coarctation	procedure	t	2026-01-30 15:02:17.965474
538	PRO-0539	Pulmonary Artery Banding (PA Banding) Septostomy	procedure	t	2026-01-30 15:02:17.965474
539	PRO-0540	Pericardectomy	procedure	t	2026-01-30 15:02:17.965474
540	PRO-0541	Congenital cytomegalovirus (CMV)/ patent ductus arteriosus (PDA)	procedure	t	2026-01-30 15:02:17.965474
541	PRO-0542	Gunshot injury	procedure	t	2026-01-30 15:02:17.965474
542	PRO-0543	Heart transplant	procedure	t	2026-01-30 15:02:17.965474
543	PRO-0544	Balloon coronary angioplasty/PTCA	procedure	t	2026-01-30 15:02:17.965474
544	PRO-0545	Balloon coronary angioplasty/PTCA without Vascular Closure Device	procedure	t	2026-01-30 15:02:17.965474
545	PRO-0546	Rotablation	procedure	t	2026-01-30 15:02:17.965474
546	PRO-0547	Balloon Mitral Valvotomy / Percutaneous transvenous mitral\r\ncommissurotomy (PTMC) -	procedure	t	2026-01-30 15:02:17.965474
547	PRO-0548	Cardiac Catheterization (CATH)	procedure	t	2026-01-30 15:02:17.965474
548	PRO-0549	Aortic Arch Replacement	procedure	t	2026-01-30 15:02:17.965474
549	PRO-0550	Aortic Dissection	procedure	t	2026-01-30 15:02:17.965474
550	PRO-0551	Thoraco Abdominal Aneurism Repair	procedure	t	2026-01-30 15:02:17.965474
551	PRO-0552	Embolectomy	procedure	t	2026-01-30 15:02:17.965474
552	PRO-0553	Vascular Repair	procedure	t	2026-01-30 15:02:17.965474
553	PRO-0554	Bentall Repair with Prosthetic Valve	procedure	t	2026-01-30 15:02:17.965474
554	PRO-0555	Bentall Repair with Biologic Valve	procedure	t	2026-01-30 15:02:17.965474
555	PRO-0556	Coaractation dilatation	procedure	t	2026-01-30 15:02:17.965474
556	PRO-0557	Coaractation dilatation with Stenting	procedure	t	2026-01-30 15:02:17.965474
557	PRO-0558	TPI Single Chamber	procedure	t	2026-01-30 15:02:17.965474
558	PRO-0559	TPI Dual Chamber	procedure	t	2026-01-30 15:02:17.965474
559	PRO-0560	Permanent pacemaker implantation (PPI)- Single chamber	procedure	t	2026-01-30 15:02:17.965474
560	PRO-0561	Permanent pacemaker implantation- Dual Chamber	procedure	t	2026-01-30 15:02:17.965474
561	PRO-0562	Permanent pacemaker implantation (PPI)- Biventricular	procedure	t	2026-01-30 15:02:17.965474
562	PRO-0563	Automatic implantable Cardioverter defibrillator AICD Single chamber	procedure	t	2026-01-30 15:02:17.965474
563	PRO-0564	Automatic implantable Cardioverter defibrillator AICD - Dual Chamber	procedure	t	2026-01-30 15:02:17.965474
564	PRO-0565	Combo device implantation	procedure	t	2026-01-30 15:02:17.965474
565	PRO-0566	Diagnostic Electrophysiological studies conventional (including catheter)	procedure	t	2026-01-30 15:02:17.965474
566	PRO-0567	Ambulatory BP monitoring	procedure	t	2026-01-30 15:02:17.965474
567	PRO-0568	External Loop/event recording ( maximum up to 7 days)	procedure	t	2026-01-30 15:02:17.965474
568	PRO-0569	RF Ablation conventional	procedure	t	2026-01-30 15:02:17.965474
569	PRO-0570	Radiofrequency (RF) ablation Atrial Tachycardia/with 3-D mapping â€“ all\r\ninclusive	procedure	t	2026-01-30 15:02:17.965474
570	PRO-0571	Endomyocardial biopsy	procedure	t	2026-01-30 15:02:17.965474
571	PRO-0572	Intra aortic balloon pump (IABP)	procedure	t	2026-01-30 15:02:17.965474
572	PRO-0573	Intravascular coils	procedure	t	2026-01-30 15:02:17.965474
573	PRO-0574	Septostomy- Balloon	procedure	t	2026-01-30 15:02:17.965474
574	PRO-0575	Septostomy- Blade	procedure	t	2026-01-30 15:02:17.965474
575	PRO-0576	Aortic valve balloon dilatation (AVBD) / Pulmonary valve Balloon Dilatation\r\n(PVBD)	procedure	t	2026-01-30 15:02:17.965474
576	PRO-0577	Digital subtraction angiography-Peripheral artery	procedure	t	2026-01-30 15:02:17.965474
577	PRO-0578	Digital subtraction angiography- venogram	procedure	t	2026-01-30 15:02:17.965474
578	PRO-0579	CT Guided biopsy	procedure	t	2026-01-30 15:02:17.965474
579	PRO-0580	Sinogram	procedure	t	2026-01-30 15:02:17.965474
580	PRO-0581	Peripheral Angioplasty with VCD	procedure	t	2026-01-30 15:02:17.965474
581	PRO-0582	Peripheral Angioplasty	procedure	t	2026-01-30 15:02:17.965474
582	PRO-0583	Renal Angioplasty	procedure	t	2026-01-30 15:02:17.965474
583	PRO-0584	Intravascular ultrasound (IVUS)	procedure	t	2026-01-30 15:02:17.965474
584	PRO-0585	Fractional Flow Reserve (FFR) inclusive of cost of wire	procedure	t	2026-01-30 15:02:17.965474
585	PRO-0586	Holter analysis	procedure	t	2026-01-30 15:02:17.965474
586	PRO-0587	Aortic stent grafting for aortic aneurysm	procedure	t	2026-01-30 15:02:17.965474
587	PRO-0588	Inferior Vena Cava (IVC) filter implantation (Cost of Filter extra)	procedure	t	2026-01-30 15:02:17.965474
588	PRO-0589	ASD device closure	procedure	t	2026-01-30 15:02:17.965474
589	PRO-0589	VSD device closure	procedure	t	2026-01-30 15:02:17.965474
590	PRO-0589	PDA device closure	procedure	t	2026-01-30 15:02:17.965474
591	PRO-0590	Electrocardiogram (ECG)	procedure	t	2026-01-30 15:02:17.965474
592	PRO-0591	Head--up tilt test (HUTT)	procedure	t	2026-01-30 15:02:17.965474
593	PRO-0592	2D echocardiography	procedure	t	2026-01-30 15:02:17.965474
594	PRO-0593	3D echocardiography	procedure	t	2026-01-30 15:02:17.965474
595	PRO-0594	Fetal Echo	procedure	t	2026-01-30 15:02:17.965474
596	PRO-0595	2D Transesophageal Echocardiography (TEE)	procedure	t	2026-01-30 15:02:17.965474
597	PRO-0596	3D Transesophageal Echocardiography (TEE)	procedure	t	2026-01-30 15:02:17.965474
598	PRO-0597	Stress Echo- exercise	procedure	t	2026-01-30 15:02:17.965474
599	PRO-0598	Stress Echo- pharmacological	procedure	t	2026-01-30 15:02:17.965474
600	PRO-0599	Stress Myocardial Perfusion Imaging(MPI)-exercise	procedure	t	2026-01-30 15:02:17.965474
601	PRO-0600	Stress Myocardial Perfusion Imaging (MPI) â€“ pharmacological	procedure	t	2026-01-30 15:02:17.965474
602	PRO-0601	Coronary angiography	procedure	t	2026-01-30 15:02:17.965474
603	PRO-0602	CT coronary angiography	procedure	t	2026-01-30 15:02:17.965474
604	PRO-0603	Cardiac CT scan	procedure	t	2026-01-30 15:02:17.965474
605	PRO-0604	Cardiac MRI	procedure	t	2026-01-30 15:02:17.965474
606	PRO-0605	Stress Cardiac MRI	procedure	t	2026-01-30 15:02:17.965474
607	PRO-0606	MR angiography.	procedure	t	2026-01-30 15:02:17.965474
608	PRO-0607	Cardiac PET	procedure	t	2026-01-30 15:02:17.965474
609	PRO-0608	Pericardiocentesis	procedure	t	2026-01-30 15:02:17.965474
610	PRO-0609	Other Major Surgery	procedure	t	2026-01-30 15:02:17.965474
611	PRO-0610	Other Minor Surgery	procedure	t	2026-01-30 15:02:17.965474
612	PRO-0611	Normal delivery with or without Episiotomy & P. repair	procedure	t	2026-01-30 15:02:17.965474
613	PRO-0612	vacuum delivery	procedure	t	2026-01-30 15:02:17.965474
614	PRO-0613	Forceps Delivery	procedure	t	2026-01-30 15:02:17.965474
615	PRO-0614	Cesarean Section(CS)	procedure	t	2026-01-30 15:02:17.965474
616	PRO-0615	Cesarean Hysterectomy	procedure	t	2026-01-30 15:02:17.965474
617	PRO-0616	Rupture Uterus closure & repair with Tubal Ligation	procedure	t	2026-01-30 15:02:17.965474
618	PRO-0617	Perforation of Uterus after D/E Laparotomy & Closure	procedure	t	2026-01-30 15:02:17.965474
619	PRO-0618	Laparotomy for Ectopic pregnancy	procedure	t	2026-01-30 15:02:17.965474
620	PRO-0619	Laparotomy-peritonitis Lavage and Drainage	procedure	t	2026-01-30 15:02:17.965474
621	PRO-0620	Salphingo-Oophorectomy/ Oophorectomy Laparoscopic	procedure	t	2026-01-30 15:02:17.965474
622	PRO-0621	Ovarian Cystectomy-laparoscopic.	procedure	t	2026-01-30 15:02:17.965474
623	PRO-0622	Ovarian Cystectomy -laparotomy.	procedure	t	2026-01-30 15:02:17.965474
624	PRO-0623	Salpingo-Oophorectomy-laparotomy	procedure	t	2026-01-30 15:02:17.965474
625	PRO-0624	Laparoscopic Broad Ligament Hematoma Drainage with repair	procedure	t	2026-01-30 15:02:17.965474
626	PRO-0625	Exploration of perineal Haematoma & Repair	procedure	t	2026-01-30 15:02:17.965474
627	PRO-0626	Exploration of abdominal Haematoma (after laparotomy + LSCS)	procedure	t	2026-01-30 15:02:17.965474
628	PRO-0627	Manual Removal of Placenta	procedure	t	2026-01-30 15:02:17.965474
629	PRO-0628	Examination under anesthesia (EUA)	procedure	t	2026-01-30 15:02:17.965474
630	PRO-0629	Burst-abdomen Repair	procedure	t	2026-01-30 15:02:17.965474
631	PRO-0630	Gaping Perineal Wound Secondary Suturing	procedure	t	2026-01-30 15:02:17.965474
632	PRO-0631	Gaping abdominal wound Secondary Suturing	procedure	t	2026-01-30 15:02:17.965474
633	PRO-0632	Complete perineal tear-repair	procedure	t	2026-01-30 15:02:17.965474
634	PRO-0633	Exploration of PPH-tear repair	procedure	t	2026-01-30 15:02:17.965474
635	PRO-0634	Suction evacuation vesicular mole	procedure	t	2026-01-30 15:02:17.965474
636	PRO-0635	Suction evacuation Missed abortion/ incomplete abortion	procedure	t	2026-01-30 15:02:17.965474
637	PRO-0636	Colpotomy	procedure	t	2026-01-30 15:02:17.965474
638	PRO-0637	Repair of post-coital tear/ perineal injury	procedure	t	2026-01-30 15:02:17.965474
639	PRO-0638	Excision of urethral caruncle	procedure	t	2026-01-30 15:02:17.965474
640	PRO-0639	Shirodhkar/ McDonald stitch	procedure	t	2026-01-30 15:02:17.965474
641	PRO-0640	Abdominal Hysterectomy with or without salpingo-oophorectomy	procedure	t	2026-01-30 15:02:17.965474
642	PRO-0641	Non-descent Vaginal Hysterectomy (NDVH)	procedure	t	2026-01-30 15:02:17.965474
643	PRO-0642	Vaginal Hysterectomy with repairs (UV Prolapse)	procedure	t	2026-01-30 15:02:17.965474
644	PRO-0643	Myomectomy -laparotomy	procedure	t	2026-01-30 15:02:17.965474
645	PRO-0644	Myomectomy -laparoscopic	procedure	t	2026-01-30 15:02:17.965474
646	PRO-0645	Vaginoplasty	procedure	t	2026-01-30 15:02:17.965474
647	PRO-0646	Vulvectomy -Simple	procedure	t	2026-01-30 15:02:17.965474
648	PRO-0647	Vulvectomy-Radical	procedure	t	2026-01-30 15:02:17.965474
649	PRO-0648	Rectovaginal Fistula (RVF) Repair	procedure	t	2026-01-30 15:02:17.965474
650	PRO-0649	Manchester Operation	procedure	t	2026-01-30 15:02:17.965474
651	PRO-0650	Shirodkarâ€™s sling Operation or other sling operations for prolapse uterus	procedure	t	2026-01-30 15:02:17.965474
652	PRO-0651	Laparoscopic sling operations for prolapse uterus	procedure	t	2026-01-30 15:02:17.965474
653	PRO-0652	Diagnostic Curettage	procedure	t	2026-01-30 15:02:17.965474
654	PRO-0653	Cervical Biopsy	procedure	t	2026-01-30 15:02:17.965474
655	PRO-0654	Polypectomy	procedure	t	2026-01-30 15:02:17.965474
656	PRO-0655	Other-Minor Operation Endometrial	procedure	t	2026-01-30 15:02:17.965474
657	PRO-0656	Excision Vaginal Cyst/Bartholin Cyst	procedure	t	2026-01-30 15:02:17.965474
658	PRO-0657	Excision Vaginal Septum	procedure	t	2026-01-30 15:02:17.965474
659	PRO-0658	Laparoscopy -Diagnostic with chromopertubation and or adhesiolysis and\r\ndrilling	procedure	t	2026-01-30 15:02:17.965474
660	PRO-0659	Laparoscopy Sterilization	procedure	t	2026-01-30 15:02:17.965474
661	PRO-0660	LAVH	procedure	t	2026-01-30 15:02:17.965474
662	PRO-0661	Balloon Temponade for PPH	procedure	t	2026-01-30 15:02:17.965474
663	PRO-0662	Total laparoscopic hysterectomy	procedure	t	2026-01-30 15:02:17.965474
664	PRO-0663	Laparoscopic treatment of Ectopic pregnancy- salpingectomy/salpinostomy\r\nconservative	procedure	t	2026-01-30 15:02:17.965474
665	PRO-0664	Conisation of cervix	procedure	t	2026-01-30 15:02:17.965474
666	PRO-0665	Trachhelectomy of cervix for early CA cervix	procedure	t	2026-01-30 15:02:17.965474
667	PRO-0666	Hysteroscopic cannulation	procedure	t	2026-01-30 15:02:17.965474
668	PRO-0667	Laparotomy recannalization of Fallopian tubes-(Tubuloplasty)	procedure	t	2026-01-30 15:02:17.965474
669	PRO-0668	Laparoscopic recannalization of Fallopian tubes- (Tubuloplasty)	procedure	t	2026-01-30 15:02:17.965474
670	PRO-0669	Colposcopy	procedure	t	2026-01-30 15:02:17.965474
671	PRO-0670	Inversion of Uterus â€“ Vaginal Reposition	procedure	t	2026-01-30 15:02:17.965474
672	PRO-0671	Inversion of Uterus â€“ Abdominal Reposition	procedure	t	2026-01-30 15:02:17.965474
673	PRO-0672	Laparoscopic VVF Repair	procedure	t	2026-01-30 15:02:17.965474
674	PRO-0673	Abdominal VVF Repair	procedure	t	2026-01-30 15:02:17.965474
675	PRO-0674	Vaginal VVF Repair	procedure	t	2026-01-30 15:02:17.965474
676	PRO-0675	Interventional Ultrasonography (CVS)	procedure	t	2026-01-30 15:02:17.965474
677	PRO-0676	Amniocentesis	procedure	t	2026-01-30 15:02:17.965474
678	PRO-0677	Karyotyping	procedure	t	2026-01-30 15:02:17.965474
679	PRO-0678	Thermal balloon ablation.	procedure	t	2026-01-30 15:02:17.965474
680	PRO-0679	Ultrasonographic myolysis	procedure	t	2026-01-30 15:02:17.965474
681	PRO-0680	Vaginal Myomectomy	procedure	t	2026-01-30 15:02:17.965474
682	PRO-0681	Intra Uterine Inseminition	procedure	t	2026-01-30 15:02:17.965474
683	PRO-0682	ICSI	procedure	t	2026-01-30 15:02:17.965474
684	PRO-0683	Laparotomy abdominal sacro-colpopexy	procedure	t	2026-01-30 15:02:17.965474
685	PRO-0684	Vaginal Colpopexy	procedure	t	2026-01-30 15:02:17.965474
686	PRO-0685	Laparoscopic abdominal sacro-colpopexy	procedure	t	2026-01-30 15:02:17.965474
687	PRO-0686	Laparotomy pelvic Lymphadenectomy	procedure	t	2026-01-30 15:02:17.965474
688	PRO-0687	Laparoscopic pelvic Lymphadenectomy	procedure	t	2026-01-30 15:02:17.965474
689	PRO-0688	Endometrial aspiration cytology/biopsy	procedure	t	2026-01-30 15:02:17.965474
690	PRO-0689	Transvaginal sonography (TVS for Follicular monitioring /aspiration)	procedure	t	2026-01-30 15:02:17.965474
691	PRO-0690	laparoscopic treatment for stress incontinence	procedure	t	2026-01-30 15:02:17.965474
692	PRO-0691	Transvaginal tapes for Stress incontinence	procedure	t	2026-01-30 15:02:17.965474
693	PRO-0692	trans-obturator tapes for Stress incontinence	procedure	t	2026-01-30 15:02:17.965474
694	PRO-0693	Interventional radiographic arterial embolization	procedure	t	2026-01-30 15:02:17.965474
695	PRO-0694	Diagnostic cystoscopy	procedure	t	2026-01-30 15:02:17.965474
696	PRO-0695	Staging laparotomy surgery for CA Ovary	procedure	t	2026-01-30 15:02:17.965474
697	PRO-0696	Internal Iliac ligation	procedure	t	2026-01-30 15:02:17.965474
698	PRO-0697	stepwise devascularisation	procedure	t	2026-01-30 15:02:17.965474
699	PRO-0698	Assisted breech delivery	procedure	t	2026-01-30 15:02:17.965474
700	PRO-0699	Intra-uterine fetal blood transfusion	procedure	t	2026-01-30 15:02:17.965474
701	PRO-0700	Hysteroscopy TCRE	procedure	t	2026-01-30 15:02:17.965474
702	PRO-0701	Hysteroscopy Removal of IUCD	procedure	t	2026-01-30 15:02:17.965474
703	PRO-0702	Hysteroscopy Removal of Septum	procedure	t	2026-01-30 15:02:17.965474
704	PRO-0703	Hysteroscopy Diagnostic	procedure	t	2026-01-30 15:02:17.965474
705	PRO-0704	Radical Hysterectomy for Cancer cervix with pelvic lymphadenectomy	procedure	t	2026-01-30 15:02:17.965474
706	PRO-0705	Radical Hysterectomy for Cancer endometrium extending to cervix with\r\npelvic and para aortic lymphadenectomy	procedure	t	2026-01-30 15:02:17.965474
707	PRO-0706	Sterilization Post partum (minilap)	procedure	t	2026-01-30 15:02:17.965474
708	PRO-0707	Sterilization interval (minilap)	procedure	t	2026-01-30 15:02:17.965474
709	PRO-0708	Ultrasonography Level II scan/Anomaly Scan	procedure	t	2026-01-30 15:02:17.965474
710	PRO-0709	Fetal nuchal Translucency	procedure	t	2026-01-30 15:02:17.965474
711	PRO-0710	Fetal Doppler/Umblical Doppler/Uterine Vessel Doppler (USG Colour\r\nDoppler Pregnancy)	procedure	t	2026-01-30 15:02:17.965474
712	PRO-0711	MTP- 1st Trimester	procedure	t	2026-01-30 15:02:17.965474
713	PRO-0712	MTP - 2nd Trimester	procedure	t	2026-01-30 15:02:17.965474
714	PRO-0713	Quadruple test	procedure	t	2026-01-30 15:02:17.965474
715	PRO-0714	Biophysical score	procedure	t	2026-01-30 15:02:17.965474
716	PRO-0715	Other Major Surgery	procedure	t	2026-01-30 15:02:17.965474
717	PRO-0716	Other Minor Surgery	procedure	t	2026-01-30 15:02:17.965474
718	PRO-0717	Partial Nephrectomy -open	procedure	t	2026-01-30 15:02:17.965474
719	PRO-0718	Partial Nephrectomy-laproscopic/endoscopic	procedure	t	2026-01-30 15:02:17.965474
720	PRO-0719	Nephrolithomy -open	procedure	t	2026-01-30 15:02:17.965474
721	PRO-0720	Nephrolithomy -laproscopic/endoscopic	procedure	t	2026-01-30 15:02:17.965474
722	PRO-0721	Pyelolithotomy-open	procedure	t	2026-01-30 15:02:17.965474
723	PRO-0722	Pyelolithotomy -laproscopic/endoscopic	procedure	t	2026-01-30 15:02:17.965474
724	PRO-0723	Operations for Hydronephrosis -pyeloplasty open	procedure	t	2026-01-30 15:02:17.965474
725	PRO-0724	Operations for Hydronephrosis -pyeloplasty Lap/endoscopic	procedure	t	2026-01-30 15:02:17.965474
726	PRO-0725	Operations for Hydronephrosis Endoplyelotomy antegrade	procedure	t	2026-01-30 15:02:17.965474
727	PRO-0726	Operations for Hydronephrosis Endoplyelotomy retrograde	procedure	t	2026-01-30 15:02:17.965474
728	PRO-0727	Operations for Hydronephrosis -ureterocalicostomy	procedure	t	2026-01-30 15:02:17.965474
729	PRO-0728	Operations for Hydronephrosis-Ileal ureter	procedure	t	2026-01-30 15:02:17.965474
730	PRO-0729	Open Drainage of Perinephric Abscess	procedure	t	2026-01-30 15:02:17.965474
731	PRO-0730	Percutaneous Drainage of Perinephric Abscess -Ultrasound guided	procedure	t	2026-01-30 15:02:17.965474
732	PRO-0731	Cavernostomy	procedure	t	2026-01-30 15:02:17.965474
733	PRO-0732	Operations for Cyst of the Kidney -open	procedure	t	2026-01-30 15:02:17.965474
734	PRO-0733	Operations for Cyst of the Kidney -Lap/endoscopic	procedure	t	2026-01-30 15:02:17.965474
735	PRO-0734	Ureterolithotomy -open	procedure	t	2026-01-30 15:02:17.965474
736	PRO-0735	Ureterolithotomy-Lap/Endoscopic	procedure	t	2026-01-30 15:02:17.965474
737	PRO-0736	Nephroureterectomy open	procedure	t	2026-01-30 15:02:17.965474
738	PRO-0737	Nephroureterectomy -Lap/Endoscopic	procedure	t	2026-01-30 15:02:17.965474
739	PRO-0738	Operations for Ureter for -Double Ureters	procedure	t	2026-01-30 15:02:17.965474
740	PRO-0739	Operations for Ureter -for Ectopia of Single Ureter	procedure	t	2026-01-30 15:02:17.965474
741	PRO-0740	Operations for Vesico- ureteric Reflux -Open	procedure	t	2026-01-30 15:02:17.965474
742	PRO-0741	Operations for Vesico- ureteric Reflux-Lap/Endoscopic	procedure	t	2026-01-30 15:02:17.965474
743	PRO-0742	Operations for Vesico- ureteric Reflux/ Urinary incontinence with bulking\r\nagents	procedure	t	2026-01-30 15:02:17.965474
744	PRO-0743	Ureterostomy - Cutaneous	procedure	t	2026-01-30 15:02:17.965474
745	PRO-0744	Uretero-Colic anastomosis	procedure	t	2026-01-30 15:02:17.965474
746	PRO-0745	Formation of an Ileal Conduit	procedure	t	2026-01-30 15:02:17.965474
747	PRO-0746	Ureteric Catheterisation	procedure	t	2026-01-30 15:02:17.965474
748	PRO-0747	Biopsy of Bladder (Cystoscopic)	procedure	t	2026-01-30 15:02:17.965474
749	PRO-0748	Cysto-Litholapaxy	procedure	t	2026-01-30 15:02:17.965474
750	PRO-0749	Operations for Injuries of the Bladder	procedure	t	2026-01-30 15:02:17.965474
751	PRO-0750	Suprapubic Drainage (Cystostomy/vesicostomy)	procedure	t	2026-01-30 15:02:17.965474
752	PRO-0751	Simple Cystectomy	procedure	t	2026-01-30 15:02:17.965474
753	PRO-0752	Diverticulectomy -open	procedure	t	2026-01-30 15:02:17.965474
754	PRO-0753	Diverticulectomy- Lap/Endoscopic	procedure	t	2026-01-30 15:02:17.965474
755	PRO-0754	Diverticulectomy -Endoscopic incision of neck	procedure	t	2026-01-30 15:02:17.965474
756	PRO-0755	Augmentation Cystoplasty	procedure	t	2026-01-30 15:02:17.965474
757	PRO-0756	Operations for Extrophy of the Bladder- Single stage repair	procedure	t	2026-01-30 15:02:17.965474
758	PRO-0757	Operations for Extrophy of the Bladder- Multistage repair	procedure	t	2026-01-30 15:02:17.965474
759	PRO-0758	Operations for Extrophy of the Bladder- simple cystectomy with urinary\r\ndiversion	procedure	t	2026-01-30 15:02:17.965474
760	PRO-0759	Repair of Ureterocoel -Open	procedure	t	2026-01-30 15:02:17.965474
761	PRO-0760	Repair of Ureterocoel -Lap/Endoscopic	procedure	t	2026-01-30 15:02:17.965474
762	PRO-0761	Repair of Ureterocoel -Endoscopic incision	procedure	t	2026-01-30 15:02:17.965474
763	PRO-0762	Open Suprapubic Prostatectomy	procedure	t	2026-01-30 15:02:17.965474
764	PRO-0763	Open Retropubic Prostatectomy	procedure	t	2026-01-30 15:02:17.965474
765	PRO-0764	Transurethral Resection of Prostate (TURP)	procedure	t	2026-01-30 15:02:17.965474
766	PRO-0765	Urethroscopy/ Cystopanendoscopy	procedure	t	2026-01-30 15:02:17.965474
767	PRO-0766	Internal urethrotomy -optical	procedure	t	2026-01-30 15:02:17.965474
768	PRO-0767	Internal urethrotomy -Core through urethroplasty	procedure	t	2026-01-30 15:02:17.965474
769	PRO-0768	Urethral Reconstruction -End to end ansatamosis	procedure	t	2026-01-30 15:02:17.965474
770	PRO-0769	Urethral Reconstruction - substitution urethroplasty (Transpubic\r\nurethroplasty	procedure	t	2026-01-30 15:02:17.965474
771	PRO-0770	Abdomino Perineal urethroplasty	procedure	t	2026-01-30 15:02:17.965474
772	PRO-0771	Posterior Urethral Valve fulguration.	procedure	t	2026-01-30 15:02:17.965474
773	PRO-0772	Operations for Incontinence of Urine - Male -Open	procedure	t	2026-01-30 15:02:17.965474
774	PRO-0773	Operations for Incontinence of Urine - Male -Sling	procedure	t	2026-01-30 15:02:17.965474
775	PRO-0774	Operations for Incontinence of Urine - Male-Bulking agent	procedure	t	2026-01-30 15:02:17.965474
776	PRO-0775	Operations for Incontinence of Urine - Female -Open	procedure	t	2026-01-30 15:02:17.965474
777	PRO-0776	Operations for Incontinence of Urine - Female-Sling	procedure	t	2026-01-30 15:02:17.965474
778	PRO-0777	Operations for Incontinence of Urine - Female-Bulking agent	procedure	t	2026-01-30 15:02:17.965474
779	PRO-0778	Reduction of Paraphimosis	procedure	t	2026-01-30 15:02:17.965474
780	PRO-0779	Circumcision	procedure	t	2026-01-30 15:02:17.965474
781	PRO-0780	Meatotomy	procedure	t	2026-01-30 15:02:17.965474
782	PRO-0781	Meatoplasty	procedure	t	2026-01-30 15:02:17.965474
783	PRO-0782	Operations for Hypospadias + Chordee Correction	procedure	t	2026-01-30 15:02:17.965474
784	PRO-0783	Operations for Hypospadias - Second Stage	procedure	t	2026-01-30 15:02:17.965474
785	PRO-0784	Operations for Hypospadias - One Stage Repair	procedure	t	2026-01-30 15:02:17.965474
786	PRO-0785	Operations for Crippled Hypospadias	procedure	t	2026-01-30 15:02:17.965474
787	PRO-0786	Operations for Epispadias _primary repair	procedure	t	2026-01-30 15:02:17.965474
788	PRO-0787	Operations for Epispadias-crippled epispadias	procedure	t	2026-01-30 15:02:17.965474
789	PRO-0788	Partial Amputation of the Penis	procedure	t	2026-01-30 15:02:17.965474
790	PRO-0789	Total amputation of the Penis	procedure	t	2026-01-30 15:02:17.965474
791	PRO-0790	Orchidectomy-Simple	procedure	t	2026-01-30 15:02:17.965474
792	PRO-0791	Orchidectomy -Radical	procedure	t	2026-01-30 15:02:17.965474
793	PRO-0792	Post Radical Orchidectomy retroperitoneal lymph node dissection.	procedure	t	2026-01-30 15:02:17.965474
794	PRO-0793	Epididymectomy	procedure	t	2026-01-30 15:02:17.965474
795	PRO-0794	Adreneclectomy Unilateral/Bilateral for Tumour/For Carcinoma- Open	procedure	t	2026-01-30 15:02:17.965474
796	PRO-0795	Adreneclectomy Unilateral/Bilateral for Tumour/For Carcinoma -\r\nLap/Endoscopic	procedure	t	2026-01-30 15:02:17.965474
797	PRO-0796	Operations for Hydrocele - Unilateral	procedure	t	2026-01-30 15:02:17.965474
798	PRO-0797	Operations for Hydrocele - Bilateral	procedure	t	2026-01-30 15:02:17.965474
799	PRO-0798	Operation for Torsion of Testis	procedure	t	2026-01-30 15:02:17.965474
800	PRO-0799	Micro-surgical Vasovasostomy /Vaso epidedymal ansatamosis.	procedure	t	2026-01-30 15:02:17.965474
801	PRO-0800	Operations for Varicocele Unilateral-Microsurgical	procedure	t	2026-01-30 15:02:17.965474
802	PRO-0801	Operations for Varicocele Palomoâ€™s Unilateral - Lap	procedure	t	2026-01-30 15:02:17.965474
803	PRO-0802	Operations for Varicocele Bilateral --Microsurgical	procedure	t	2026-01-30 15:02:17.965474
804	PRO-0803	Operations for Varicocele Bilateral â€“ Lap/ Palomo	procedure	t	2026-01-30 15:02:17.965474
805	PRO-0804	Block Dissection of ilio-inguinal Nodes - One Side (For Ca- Penis)	procedure	t	2026-01-30 15:02:17.965474
806	PRO-0805	Block Dissection of ilio-inguinal Nodes - Both Sides (For Ca- Penis)	procedure	t	2026-01-30 15:02:17.965474
807	PRO-0806	Excision of Filarial Scrotum	procedure	t	2026-01-30 15:02:17.965474
808	PRO-0807	Kidney Transplantation (related)	procedure	t	2026-01-30 15:02:17.965474
809	PRO-0808	Kidney Transplantation (Spousal/ unrelated) Including immunosuppressant\r\ntherapy	procedure	t	2026-01-30 15:02:17.965474
810	PRO-0809	ABO incompatible Transplantation	procedure	t	2026-01-30 15:02:17.965474
811	PRO-0810	Swap Transplantation	procedure	t	2026-01-30 15:02:17.965474
812	PRO-0811	Kidney Transplant Graft Nephrectomy	procedure	t	2026-01-30 15:02:17.965474
813	PRO-0812	Donor Nephrectomy (open)	procedure	t	2026-01-30 15:02:17.965474
814	PRO-0813	Donor Nephrectomy (Laproscopic)	procedure	t	2026-01-30 15:02:17.965474
815	PRO-0814	Cadaver Transplantation	procedure	t	2026-01-30 15:02:17.965474
816	PRO-0815	Kidney Transplant with Native Kidney Nephrectomy (Related)/ Unilateral	procedure	t	2026-01-30 15:02:17.965474
817	PRO-0816	Kidney Transplant with Native Kidney Nephrectomy (Related)/ Bilateral	procedure	t	2026-01-30 15:02:17.965474
818	PRO-0817	Kidney Transplant with Native Kidney Nephrectomy (Spousal/ Unrelated)\r\nUnilateral	procedure	t	2026-01-30 15:02:17.965474
819	PRO-0818	Kidney Transplant with Native Kidney Nephrectomy (Spousal/ Unrelated)\r\nBilateral	procedure	t	2026-01-30 15:02:17.965474
820	PRO-0819	Post-Transplant Collection drainage for Lymphocele (open)	procedure	t	2026-01-30 15:02:17.965474
821	PRO-0820	Post-Transplant Collection drainage for Lymphocele (percutaneous)	procedure	t	2026-01-30 15:02:17.965474
822	PRO-0821	Post-Transplant Collection drainage for Lymphocele (Laproscopic)	procedure	t	2026-01-30 15:02:17.965474
823	PRO-0822	Arteriovenous Fistula for Haemodialysis	procedure	t	2026-01-30 15:02:17.965474
824	PRO-0823	Arteriovenous Shunt for Haemodialysis	procedure	t	2026-01-30 15:02:17.965474
825	PRO-0824	Jugular Catheterization for Haemodialysis	procedure	t	2026-01-30 15:02:17.965474
826	PRO-0825	Subclavian Catheterization for Haemodialysis	procedure	t	2026-01-30 15:02:17.965474
827	PRO-0826	One sided (single Lumen) Femoral Catheterization for Haemodialysis	procedure	t	2026-01-30 15:02:17.965474
828	PRO-0827	Bilateral (single Lumen) Femoral Catheterization for Haemodialysis	procedure	t	2026-01-30 15:02:17.965474
829	PRO-0828	Double Lumen Femoral Catheterization for Haemodialysis	procedure	t	2026-01-30 15:02:17.965474
830	PRO-0829	Permcath Insertion	procedure	t	2026-01-30 15:02:17.965474
831	PRO-0830	Arterio venous Prosthetic Graft	procedure	t	2026-01-30 15:02:17.965474
832	PRO-0831	Single lumen Jugular Catheterization	procedure	t	2026-01-30 15:02:17.965474
833	PRO-0832	Single lumen Subclavian Catheterization	procedure	t	2026-01-30 15:02:17.965474
834	PRO-0833	Plasma Exchange/ Plasma phresis	procedure	t	2026-01-30 15:02:17.965474
835	PRO-0834	Open method CAPD catheter insertion	procedure	t	2026-01-30 15:02:17.965474
836	PRO-0835	Schlendinger method CAPD catheter insertion	procedure	t	2026-01-30 15:02:17.965474
837	PRO-0836	Sustained low efficiency hemodialysis	procedure	t	2026-01-30 15:02:17.965474
838	PRO-0837	Continuous Veno venous/Arteriovenous Hemofilteration	procedure	t	2026-01-30 15:02:17.965474
839	PRO-0838	Hemodialysis for Sero negative cases	procedure	t	2026-01-30 15:02:17.965474
840	PRO-0839	Hemodialysis for Sero Positive cases	procedure	t	2026-01-30 15:02:17.965474
841	PRO-0840	Acute Peritoneal Dialysis	procedure	t	2026-01-30 15:02:17.965474
842	PRO-0841	Fistologram for Arteriovenous Fistula	procedure	t	2026-01-30 15:02:17.965474
843	PRO-0842	Ultrasound guided kidney Biopsy	procedure	t	2026-01-30 15:02:17.965474
844	PRO-0843	Fistula stenosis dilation	procedure	t	2026-01-30 15:02:17.965474
845	PRO-0844	Slow continuous Ultrafilteration	procedure	t	2026-01-30 15:02:17.965474
846	PRO-0845	PCNL - Unilateral	procedure	t	2026-01-30 15:02:17.965474
847	PRO-0846	PCNL - Bilateral	procedure	t	2026-01-30 15:02:17.965474
848	PRO-0847	Endoscopic Bulking agent Inject	procedure	t	2026-01-30 15:02:17.965474
849	PRO-0848	Testicular Biopsy	procedure	t	2026-01-30 15:02:17.965474
850	PRO-0849	Radical Nephrectomy -Open	procedure	t	2026-01-30 15:02:17.965474
851	PRO-0850	Radical Nephrectomy -Lap/Endoscopic	procedure	t	2026-01-30 15:02:17.965474
852	PRO-0851	Radical Nephrectomy plus IV thrombus	procedure	t	2026-01-30 15:02:17.965474
853	PRO-0852	Radical Nephrectomy plus IV thrombus plus cardiac bypass.	procedure	t	2026-01-30 15:02:17.965474
854	PRO-0853	Vesico Vaginal Fistula Repair (Open)	procedure	t	2026-01-30 15:02:17.965474
855	PRO-0854	Vesico Vaginal Fistula Repair (Laproscopic)	procedure	t	2026-01-30 15:02:17.965474
856	PRO-0855	Radical Cystectomy -Ileal conduit	procedure	t	2026-01-30 15:02:17.965474
857	PRO-0856	Radical Cystectomy - continent diversion.	procedure	t	2026-01-30 15:02:17.965474
858	PRO-0857	Radical Cystectomy â€“ Neo bladder	procedure	t	2026-01-30 15:02:17.965474
859	PRO-0858	Nephrectomy Simple -Open	procedure	t	2026-01-30 15:02:17.965474
860	PRO-0859	Nephrectomy Simple-lap/Endoscopic	procedure	t	2026-01-30 15:02:17.965474
861	PRO-0860	Nephrostomy -Open	procedure	t	2026-01-30 15:02:17.965474
862	PRO-0861	Nephrostomy -Lap/Endoscopic	procedure	t	2026-01-30 15:02:17.965474
863	PRO-0862	Ureteric Re- implant for Megaureter/Vesicoureteric reflex/uterocele (open)	procedure	t	2026-01-30 15:02:17.965474
864	PRO-0863	Ureteric Re -implant for Megaureter/Vesicoureteric reflex/ uterocele\r\n(Laproscopic)	procedure	t	2026-01-30 15:02:17.965474
865	PRO-0864	Partial Cystectomy	procedure	t	2026-01-30 15:02:17.965474
866	PRO-0865	TURP & TUR Bladder Tumour	procedure	t	2026-01-30 15:02:17.965474
867	PRO-0866	TURP with Cystolithotripsy	procedure	t	2026-01-30 15:02:17.965474
868	PRO-0867	Closure of Urethral Fistula	procedure	t	2026-01-30 15:02:17.965474
869	PRO-0868	Orchidopexy - Unilateral -Open	procedure	t	2026-01-30 15:02:17.965474
870	PRO-0869	Orchidopexy - Unilateral- Lap/Endoscopic	procedure	t	2026-01-30 15:02:17.965474
871	PRO-0870	Orchidopexy - Bilateral -Open	procedure	t	2026-01-30 15:02:17.965474
872	PRO-0871	Orchidopexy - Bilateral -Lap/Endoscopic	procedure	t	2026-01-30 15:02:17.965474
873	PRO-0872	Cystolithotomy -Suprapubic	procedure	t	2026-01-30 15:02:17.965474
874	PRO-0873	Endoscopic Removal of Stone in Bladder	procedure	t	2026-01-30 15:02:17.965474
875	PRO-0874	Resection Bladder Neck Endoscopic /Bladder neck incision/transurethral\r\nincision on prostrate	procedure	t	2026-01-30 15:02:17.965474
876	PRO-0875	Ureteroscopic Surgery	procedure	t	2026-01-30 15:02:17.965474
877	PRO-0876	Urethroplasty 1st Stage	procedure	t	2026-01-30 15:02:17.965474
878	PRO-0877	Scrotal Exploration	procedure	t	2026-01-30 15:02:17.965474
879	PRO-0878	Perineal Urethrostomy	procedure	t	2026-01-30 15:02:17.965474
880	PRO-0879	Dilatation of Stricture Urethra under G.A.	procedure	t	2026-01-30 15:02:17.965474
881	PRO-0880	Dilatation of Stricture Urethra under LA	procedure	t	2026-01-30 15:02:17.965474
882	PRO-0881	Laproscopic Nephrectomy	procedure	t	2026-01-30 15:02:17.965474
883	PRO-0882	Laproscopic partial Nephrectomy	procedure	t	2026-01-30 15:02:17.965474
884	PRO-0883	Laproscopic pyelolithotomy	procedure	t	2026-01-30 15:02:17.965474
885	PRO-0884	Laproscopic Pyeloplasty	procedure	t	2026-01-30 15:02:17.965474
886	PRO-0885	Laproscopic surgery for Renal cyst	procedure	t	2026-01-30 15:02:17.965474
887	PRO-0886	Laproscopic ureterolithotomy	procedure	t	2026-01-30 15:02:17.965474
888	PRO-0887	Laproscopic Nephro ureterotectomy	procedure	t	2026-01-30 15:02:17.965474
889	PRO-0888	Lithotripsy Extra corporeal shock wave.	procedure	t	2026-01-30 15:02:17.965474
890	PRO-0889	Uroflow Study (Uroflometry)	procedure	t	2026-01-30 15:02:17.965474
891	PRO-0890	Urodynamic Study (Cystometry)	procedure	t	2026-01-30 15:02:17.965474
892	PRO-0891	Cystoscopy with Retrograde Catheter -Unilateral /RGP	procedure	t	2026-01-30 15:02:17.965474
893	PRO-0892	Cystoscopy with Retrograde Catheter - Bilateral /RGP	procedure	t	2026-01-30 15:02:17.965474
894	PRO-0893	Cystoscopy with Bladder Biopsy (Cold Cup Biopsy)	procedure	t	2026-01-30 15:02:17.965474
895	PRO-0894	Voiding-cysto-urethrogram and retrograde urethrogram (Nephrostogram)	procedure	t	2026-01-30 15:02:17.965474
896	PRO-0895	Radical prostatectomy-Open	procedure	t	2026-01-30 15:02:17.965474
897	PRO-0896	Radical prostatectomy-Laproscopic	procedure	t	2026-01-30 15:02:17.965474
898	PRO-0897	Radical prostatectomy- Robotic (Robotic Partial Nephrectomy)	procedure	t	2026-01-30 15:02:17.965474
899	PRO-0898	Hollmium YAG Prostate Surgery	procedure	t	2026-01-30 15:02:17.965474
900	PRO-0899	Hollmium YAG OIU	procedure	t	2026-01-30 15:02:17.965474
901	PRO-0900	Hollmium YAG Core Through	procedure	t	2026-01-30 15:02:17.965474
902	PRO-0901	Hollmium YAG Stone Lithotripsy	procedure	t	2026-01-30 15:02:17.965474
903	PRO-0902	Green Light laser for prostate	procedure	t	2026-01-30 15:02:17.965474
904	PRO-0903	RIRS/ Flexible Ureteroscopy	procedure	t	2026-01-30 15:02:17.965474
905	PRO-0904	Microscopic VEA/ Vaso-Vasostomy (for Infertility)	procedure	t	2026-01-30 15:02:17.965474
906	PRO-0905	Cystoscopic Botulinum Toxin Injection ( Over active bladder/ Neurogenic\r\nbladder)	procedure	t	2026-01-30 15:02:17.965474
907	PRO-0906	Peyronieâ€™s disease â€“ Plaque excision with grafting	procedure	t	2026-01-30 15:02:17.965474
1074	PRO-1073	Skin Flaps - Arm Etc.	procedure	t	2026-01-30 15:02:17.965474
908	PRO-0907	High Intensity Focus Ultrasound (HIFU) (Robotic) for\r\nCarcinoma prostrate and renal cell carcinoma	procedure	t	2026-01-30 15:02:17.965474
909	PRO-0908	Prosthetic surgery for urinary incontinence	procedure	t	2026-01-30 15:02:17.965474
910	PRO-0909	TRUS guided prostate biopsy	procedure	t	2026-01-30 15:02:17.965474
911	PRO-0910	Ultra sound guided PCN	procedure	t	2026-01-30 15:02:17.965474
912	PRO-0911	Other Major Surgery	procedure	t	2026-01-30 15:02:17.965474
913	PRO-0912	Other Minor Surgery	procedure	t	2026-01-30 15:02:17.965474
914	PRO-0913	Craniotomy and Evacuation of Haematoma -Subdural	procedure	t	2026-01-30 15:02:17.965474
915	PRO-0914	Craniotomy and Evacuation of Haematoma -Extradural	procedure	t	2026-01-30 15:02:17.965474
916	PRO-0915	Evacuation /Excision of Brain Abscess by craniotomy	procedure	t	2026-01-30 15:02:17.965474
917	PRO-0916	Excision of Lobe (Frontal Temporal Cerebellum etc.)	procedure	t	2026-01-30 15:02:17.965474
918	PRO-0917	Excision of Brain Tumours -Supratentorial	procedure	t	2026-01-30 15:02:17.965474
919	PRO-0918	Excision of Brain Tumours -Infratentorial	procedure	t	2026-01-30 15:02:17.965474
920	PRO-0919	Surgery of spinal Cord Tumours	procedure	t	2026-01-30 15:02:17.965474
921	PRO-0920	Ventriculoatrial /Ventriculoperitoneal Shunt	procedure	t	2026-01-30 15:02:17.965474
922	PRO-0921	Twist Drill Craniostomy	procedure	t	2026-01-30 15:02:17.965474
923	PRO-0922	Subdural Tapping	procedure	t	2026-01-30 15:02:17.965474
924	PRO-0923	Ventricular Tapping	procedure	t	2026-01-30 15:02:17.965474
925	PRO-0924	Abscess Tapping	procedure	t	2026-01-30 15:02:17.965474
926	PRO-0925	Placement of ICP Monitor -	procedure	t	2026-01-30 15:02:17.965474
927	PRO-0926	Skull Traction Application	procedure	t	2026-01-30 15:02:17.965474
928	PRO-0927	Lumber Pressure Monitoring	procedure	t	2026-01-30 15:02:17.965474
929	PRO-0928	Vascular Malformations	procedure	t	2026-01-30 15:02:17.965474
930	PRO-0929	Meningo Encephalocoele excision and repair	procedure	t	2026-01-30 15:02:17.965474
931	PRO-0930	Meningomyelocoel Repair	procedure	t	2026-01-30 15:02:17.965474
932	PRO-0931	C.S.F. Rhinorrhaea Repair	procedure	t	2026-01-30 15:02:17.965474
933	PRO-0932	Cranioplasty	procedure	t	2026-01-30 15:02:17.965474
934	PRO-0933	Anterior Cervical Dissectomy	procedure	t	2026-01-30 15:02:17.965474
935	PRO-0934	Brachial Plexus Exploration and neurotization	procedure	t	2026-01-30 15:02:17.965474
936	PRO-0935	Median Nerve Decompression	procedure	t	2026-01-30 15:02:17.965474
937	PRO-0936	Peripheral Nerve Surgery â€“ Major	procedure	t	2026-01-30 15:02:17.965474
938	PRO-0937	Peripheral Nerve Surgery Minor	procedure	t	2026-01-30 15:02:17.965474
939	PRO-0938	Ventriculo-Atrial Shunt	procedure	t	2026-01-30 15:02:17.965474
940	PRO-0939	Nerve Biopsy	procedure	t	2026-01-30 15:02:17.965474
941	PRO-0940	Brain Biopsy	procedure	t	2026-01-30 15:02:17.965474
942	PRO-0941	Anterior Cervical Spine Surgery with fusion	procedure	t	2026-01-30 15:02:17.965474
943	PRO-0942	Anterio Lateral Decompression of spine	procedure	t	2026-01-30 15:02:17.965474
944	PRO-0943	Brain Mapping	procedure	t	2026-01-30 15:02:17.965474
945	PRO-0944	Cervical or Dorsal or Lumbar Laminectomy	procedure	t	2026-01-30 15:02:17.965474
946	PRO-0945	Combined Trans-oral Surgery & CV Junction Fusion	procedure	t	2026-01-30 15:02:17.965474
947	PRO-0946	C.V. Junction Fusion procedures	procedure	t	2026-01-30 15:02:17.965474
948	PRO-0947	Depressed Fracture Elevation	procedure	t	2026-01-30 15:02:17.965474
949	PRO-0948	Lumbar Discectomy	procedure	t	2026-01-30 15:02:17.965474
950	PRO-0949	Endarterectomy (Carotid)	procedure	t	2026-01-30 15:02:17.965474
951	PRO-0950	R.F. Lesion for Trigeminal Neuralgia	procedure	t	2026-01-30 15:02:17.965474
952	PRO-0951	Spasticity Surgery -	procedure	t	2026-01-30 15:02:17.965474
953	PRO-0952	Spinal Fusion Procedure	procedure	t	2026-01-30 15:02:17.965474
954	PRO-0953	Spinal Intra Medullary Tumours	procedure	t	2026-01-30 15:02:17.965474
955	PRO-0954	Spinal Bifida Surgery Major	procedure	t	2026-01-30 15:02:17.965474
956	PRO-0955	Spinal Bifida Surgery Minor	procedure	t	2026-01-30 15:02:17.965474
957	PRO-0956	Stereotaxic Procedures- biopsy/aspiration of cyst	procedure	t	2026-01-30 15:02:17.965474
958	PRO-0957	Trans Sphenoidal Surgery	procedure	t	2026-01-30 15:02:17.965474
959	PRO-0958	Trans Oral Surgery	procedure	t	2026-01-30 15:02:17.965474
960	PRO-0959	Implantation of DBS -One electrode	procedure	t	2026-01-30 15:02:17.965474
961	PRO-0960	Implantation of DBS -two electrodes	procedure	t	2026-01-30 15:02:17.965474
962	PRO-0961	Endoscopic aqueductoplasty	procedure	t	2026-01-30 15:02:17.965474
963	PRO-0962	Facial nerve reconstruction	procedure	t	2026-01-30 15:02:17.965474
964	PRO-0963	Carotid stenting	procedure	t	2026-01-30 15:02:17.965474
965	PRO-0964	Cervical disc arthroplasty	procedure	t	2026-01-30 15:02:17.965474
966	PRO-0965	Lumbar disc arthroplasty	procedure	t	2026-01-30 15:02:17.965474
967	PRO-0966	Corpus callostomy for Epilepsy	procedure	t	2026-01-30 15:02:17.965474
968	PRO-0967	Hemishpherotomy for Epilepsy	procedure	t	2026-01-30 15:02:17.965474
969	PRO-0968	Endoscopic CSF rhinorrhea repair	procedure	t	2026-01-30 15:02:17.965474
970	PRO-0969	Burr hole evacuation of chronic subdural haematoma	procedure	t	2026-01-30 15:02:17.965474
971	PRO-0970	Epilepsy surgery	procedure	t	2026-01-30 15:02:17.965474
972	PRO-0971	RF lesion for facet joint pain syndrome	procedure	t	2026-01-30 15:02:17.965474
973	PRO-0972	Cervical laminoplasty	procedure	t	2026-01-30 15:02:17.965474
974	PRO-0973	Lateral mass C1-C2 screw fixation	procedure	t	2026-01-30 15:02:17.965474
975	PRO-0974	Microsurgical decompression for Trigeminal nerve	procedure	t	2026-01-30 15:02:17.965474
976	PRO-0975	Microsurgical decompression for hemifacial spasm	procedure	t	2026-01-30 15:02:17.965474
977	PRO-0976	IC EC bypass procedures	procedure	t	2026-01-30 15:02:17.965474
978	PRO-0977	Image guided craniotomy	procedure	t	2026-01-30 15:02:17.965474
979	PRO-0978	Baclofen pump implantation	procedure	t	2026-01-30 15:02:17.965474
980	PRO-0979	Programmable VP shunt	procedure	t	2026-01-30 15:02:17.965474
981	PRO-0980	Endoscopic sympathectomy	procedure	t	2026-01-30 15:02:17.965474
982	PRO-0981	Lumber puncture	procedure	t	2026-01-30 15:02:17.965474
983	PRO-0982	External ventricular drainage (EVD)	procedure	t	2026-01-30 15:02:17.965474
984	PRO-0983	Endoscopic 3rd ventriculostomy	procedure	t	2026-01-30 15:02:17.965474
985	PRO-0984	Endoscopic cranial surgery/Biopsy/aspiration	procedure	t	2026-01-30 15:02:17.965474
986	PRO-0985	Endoscopic discectomy (Lumbar Cervical)	procedure	t	2026-01-30 15:02:17.965474
987	PRO-0986	Aneurysm coiling (Endovascular)	procedure	t	2026-01-30 15:02:17.965474
988	PRO-0987	Surgery for skull fractures	procedure	t	2026-01-30 15:02:17.965474
989	PRO-0988	Carpel Tunnel decompression	procedure	t	2026-01-30 15:02:17.965474
990	PRO-0989	Clipping of intracranial aneurysm	procedure	t	2026-01-30 15:02:17.965474
991	PRO-0990	Surgery for intracranial Arteriovenous malformarions(AVM)	procedure	t	2026-01-30 15:02:17.965474
992	PRO-0991	Foramen magnum decompression for Chari Malformation	procedure	t	2026-01-30 15:02:17.965474
993	PRO-0992	Dorsal column stimulation for backache in failed back syndrome	procedure	t	2026-01-30 15:02:17.965474
994	PRO-0993	Surgery for recurrent disc prolapse/epidural fibrosis	procedure	t	2026-01-30 15:02:17.965474
995	PRO-0994	Surgery for brain stem tumours	procedure	t	2026-01-30 15:02:17.965474
996	PRO-0995	Decompressive craniotomy for hemishpherical acute\r\nsubdural haematoma/brain swelling/large infarct	procedure	t	2026-01-30 15:02:17.965474
997	PRO-0996	Intra-arterial thrombolysis with TPA (for ischemic stroke )	procedure	t	2026-01-30 15:02:17.965474
998	PRO-0997	Steriotactic aspiration of intracerebral haematoma	procedure	t	2026-01-30 15:02:17.965474
999	PRO-0998	Endoscopic aspiration of intracerebellar haematoma	procedure	t	2026-01-30 15:02:17.965474
1000	PRO-0999	Steriotactic Radiosurgery for brain pathology(X knife/Gamma) - ONE\r\nsession	procedure	t	2026-01-30 15:02:17.965474
1001	PRO-1000	Steriotactic Radiosurgery for brain pathology(X knife / Gamma knife -Two or\r\nmore sessions	procedure	t	2026-01-30 15:02:17.965474
1002	PRO-1001	Chemotheraphy wafers for malignant brain tumors	procedure	t	2026-01-30 15:02:17.965474
1003	PRO-1002	Battery Placement for DBS	procedure	t	2026-01-30 15:02:17.965474
1004	PRO-1003	Baclofen pump implantation for spasticity	procedure	t	2026-01-30 15:02:17.965474
1005	PRO-1004	Peripheral Nerve tumor surgery	procedure	t	2026-01-30 15:02:17.965474
1006	PRO-1005	Surgery Intra Cranial Meningioma	procedure	t	2026-01-30 15:02:17.965474
1007	PRO-1006	Surgery for Intracranial Schwannoma	procedure	t	2026-01-30 15:02:17.965474
1008	PRO-1007	Surgery for Gliomas	procedure	t	2026-01-30 15:02:17.965474
1009	PRO-1008	Surgery for Orbital tumors	procedure	t	2026-01-30 15:02:17.965474
1010	PRO-1009	Surgery for Cranial (Skull) tumors	procedure	t	2026-01-30 15:02:17.965474
1011	PRO-1010	Surgery for Scalp AVMâ€™s	procedure	t	2026-01-30 15:02:17.965474
1012	PRO-1011	Kyphoplasty	procedure	t	2026-01-30 15:02:17.965474
1013	PRO-1012	Balloon Kyphoplasty	procedure	t	2026-01-30 15:02:17.965474
1014	PRO-1013	Lesioning procedures for Parkinsonâ€™s disease Dystonia etc.	procedure	t	2026-01-30 15:02:17.965474
1015	PRO-1014	Other Major Surgery	procedure	t	2026-01-30 15:02:17.965474
1016	PRO-1015	Other Minor Surgery	procedure	t	2026-01-30 15:02:17.965474
1017	PRO-1016	Excision of thyroglossal Duct/Cyst	procedure	t	2026-01-30 15:02:17.965474
1018	PRO-1017	Diaphragmatic Hernia Repair (Thoracic or Abdominal Approach)	procedure	t	2026-01-30 15:02:17.965474
1019	PRO-1018	Tracheo Oesophageal Fistula (Correction Surgery)	procedure	t	2026-01-30 15:02:17.965474
1020	PRO-1019	Colon Replacement of Oesophagus	procedure	t	2026-01-30 15:02:17.965474
1021	PRO-1020	Omphalo Mesenteric Cyst Excision	procedure	t	2026-01-30 15:02:17.965474
1022	PRO-1021	Omphalo Mesenteric Duct- Excision	procedure	t	2026-01-30 15:02:17.965474
1023	PRO-1022	Meckels Diverticulectomy	procedure	t	2026-01-30 15:02:17.965474
1024	PRO-1023	Omphalocele 1st Stage (Hernia Repair)	procedure	t	2026-01-30 15:02:17.965474
1025	PRO-1024	Omphalocele 2nd Stge (Hernia Repair)	procedure	t	2026-01-30 15:02:17.965474
1026	PRO-1025	Gastrochisis Repair	procedure	t	2026-01-30 15:02:17.965474
1027	PRO-1026	Inguinal Herniotomy	procedure	t	2026-01-30 15:02:17.965474
1028	PRO-1027	Congenital Hydrocele	procedure	t	2026-01-30 15:02:17.965474
1029	PRO-1028	Hydrocele of Cord	procedure	t	2026-01-30 15:02:17.965474
1030	PRO-1029	Torsion Testis Operation	procedure	t	2026-01-30 15:02:17.965474
1031	PRO-1030	Congenital Pyloric Stenosis- operation	procedure	t	2026-01-30 15:02:17.965474
1032	PRO-1031	Duodenal- Atresia Operation	procedure	t	2026-01-30 15:02:17.965474
1033	PRO-1032	Pancreatic Ring Operation	procedure	t	2026-01-30 15:02:17.965474
1034	PRO-1033	Meconium Ileus Operation	procedure	t	2026-01-30 15:02:17.965474
1035	PRO-1034	Malrotation of Intestines Operation	procedure	t	2026-01-30 15:02:17.965474
1036	PRO-1035	Rectal Biopsy (Megacolon)	procedure	t	2026-01-30 15:02:17.965474
1037	PRO-1036	Colostomy Transverse	procedure	t	2026-01-30 15:02:17.965474
1038	PRO-1037	Colostomy Left Iliac	procedure	t	2026-01-30 15:02:17.965474
1039	PRO-1038	Abdominal Perineal Pull Through (Hirschaprugis Disease)	procedure	t	2026-01-30 15:02:17.965474
1040	PRO-1039	Imperforate Anus Low Anomaly -Cut Back Operation	procedure	t	2026-01-30 15:02:17.965474
1041	PRO-1040	Imperforate Anus Low Anomaly - Perineal Anoplasty	procedure	t	2026-01-30 15:02:17.965474
1042	PRO-1041	Imperforate Anus High Anomaly -Sacroabdomino Perineal Pull Through	procedure	t	2026-01-30 15:02:17.965474
1043	PRO-1042	Imperforate Anus High Anomaly - Closure of Colostomy	procedure	t	2026-01-30 15:02:17.965474
1044	PRO-1043	Intususception Operation	procedure	t	2026-01-30 15:02:17.965474
1045	PRO-1044	Choledochoduodenostomy for Atresia of Extra Hepatic Billiary Duct	procedure	t	2026-01-30 15:02:17.965474
1046	PRO-1045	Operation of Choledochal Cyst	procedure	t	2026-01-30 15:02:17.965474
1047	PRO-1046	Nephrectomy for -Pyonephrosis	procedure	t	2026-01-30 15:02:17.965474
1048	PRO-1047	Nephrectomy for - Hydronephrosis	procedure	t	2026-01-30 15:02:17.965474
1049	PRO-1048	Nephrectomy for -Wilms Tumour	procedure	t	2026-01-30 15:02:17.965474
1050	PRO-1049	Paraortic Lymphadenoctomy with Nephrectomy for Wilms Tumour	procedure	t	2026-01-30 15:02:17.965474
1051	PRO-1050	Sacro-Coccygeal Teratoma Excision	procedure	t	2026-01-30 15:02:17.965474
1052	PRO-1051	Neuroblastoma Debulking	procedure	t	2026-01-30 15:02:17.965474
1053	PRO-1052	Neuroblastoma Total Excision	procedure	t	2026-01-30 15:02:17.965474
1054	PRO-1053	Rhabdomyosarcoma wide Excision	procedure	t	2026-01-30 15:02:17.965474
1055	PRO-1054	Congenital Atresia & Stenosis of Small Intestine	procedure	t	2026-01-30 15:02:17.965474
1056	PRO-1055	Muconium ileus	procedure	t	2026-01-30 15:02:17.965474
1057	PRO-1056	Mal-rotation & Volvulus of the Midgut	procedure	t	2026-01-30 15:02:17.965474
1058	PRO-1057	Excision of Meckleâ€™s Deverticulum	procedure	t	2026-01-30 15:02:17.965474
1059	PRO-1058	Other Major Surgery	procedure	t	2026-01-30 15:02:17.965474
1060	PRO-1059	Other Minor Surgery	procedure	t	2026-01-30 15:02:17.965474
1061	PRO-1060	Primary Suturing of Wound	procedure	t	2026-01-30 15:02:17.965474
1062	PRO-1061	Injection of Keloids - Ganglion	procedure	t	2026-01-30 15:02:17.965474
1063	PRO-1062	Injection of Keloids - Haemangioma	procedure	t	2026-01-30 15:02:17.965474
1064	PRO-1063	Free Grafts - Wolfe Grafts	procedure	t	2026-01-30 15:02:17.965474
1065	PRO-1064	Free Grafts - Theirech- Small Area 5%	procedure	t	2026-01-30 15:02:17.965474
1066	PRO-1065	Free Grafts - Large Area 10%	procedure	t	2026-01-30 15:02:17.965474
1067	PRO-1066	Free Grafts - Very Large Area 20% and above.	procedure	t	2026-01-30 15:02:17.965474
1068	PRO-1067	Skin Flaps - Rotation Flaps	procedure	t	2026-01-30 15:02:17.965474
1069	PRO-1068	Skin Flaps - Advancement Flaps	procedure	t	2026-01-30 15:02:17.965474
1070	PRO-1069	Skin Flaps - Direct- cross Leg Flaps- Cross Arm Flap	procedure	t	2026-01-30 15:02:17.965474
1071	PRO-1070	Skin Flaps - Cross Finger	procedure	t	2026-01-30 15:02:17.965474
1072	PRO-1071	Skin Flaps - Abdominal	procedure	t	2026-01-30 15:02:17.965474
1073	PRO-1072	Skin Flaps - Thoracic	procedure	t	2026-01-30 15:02:17.965474
1075	PRO-1074	Subcutaneous Pedicle Flaps Raising	procedure	t	2026-01-30 15:02:17.965474
1076	PRO-1075	Subcutaneous Pedicle Flaps Delay	procedure	t	2026-01-30 15:02:17.965474
1077	PRO-1076	Subcutaneous Pedicle Flaps Transfer	procedure	t	2026-01-30 15:02:17.965474
1078	PRO-1077	Cartilage Grafting	procedure	t	2026-01-30 15:02:17.965474
1079	PRO-1078	Reduction of Facial Fractures of Nose	procedure	t	2026-01-30 15:02:17.965474
1080	PRO-1079	Reduction of Facial Fractures of Maxilla	procedure	t	2026-01-30 15:02:17.965474
1081	PRO-1080	Reduction of Fractures of Mandible & Maxilla - Eye Let Splinting	procedure	t	2026-01-30 15:02:17.965474
1082	PRO-1081	Reduction of Fractures of Mandible & Maxilla - Cast Netal Splints	procedure	t	2026-01-30 15:02:17.965474
1083	PRO-1082	Reduction of Fractures of Mandible & Maxilla - Gumming Splints	procedure	t	2026-01-30 15:02:17.965474
1084	PRO-1083	Internal Wire Fixation of Mandible & Maxilla	procedure	t	2026-01-30 15:02:17.965474
1085	PRO-1084	Cleft Lip - repair.	procedure	t	2026-01-30 15:02:17.965474
1086	PRO-1085	Cleft Palate Repair	procedure	t	2026-01-30 15:02:17.965474
1087	PRO-1086	Primary Bone Grafting for alveolar cleft in Cleft Lip	procedure	t	2026-01-30 15:02:17.965474
1088	PRO-1087	Secondary Surgery for Cleft Lip Deformity	procedure	t	2026-01-30 15:02:17.965474
1089	PRO-1088	Secondary Surgery for Cleft Palate	procedure	t	2026-01-30 15:02:17.965474
1090	PRO-1089	Reconstruction of Eyelid Defects - Minor	procedure	t	2026-01-30 15:02:17.965474
1091	PRO-1090	Reconstruction of Eyelid Defects - Major	procedure	t	2026-01-30 15:02:17.965474
1092	PRO-1091	Plastic Surgery of Different Regions of the Ear - Minor	procedure	t	2026-01-30 15:02:17.965474
1093	PRO-1092	Plastic Surgery of Different Regions of the Ear - Major	procedure	t	2026-01-30 15:02:17.965474
1094	PRO-1093	Plastic Surgery of the Nose - Minor	procedure	t	2026-01-30 15:02:17.965474
1095	PRO-1094	Plastic Surgery of the Nose - Major	procedure	t	2026-01-30 15:02:17.965474
1096	PRO-1095	Plastic Surgery for Facial Paralysis (Support with Reanimation)	procedure	t	2026-01-30 15:02:17.965474
1097	PRO-1096	Pendulous Breast - Mammoplasty	procedure	t	2026-01-30 15:02:17.965474
1098	PRO-1097	Underdeveloped Breast Mammoplasty	procedure	t	2026-01-30 15:02:17.965474
1099	PRO-1098	After Mastectomy (Reconstruction)Mammoplasty	procedure	t	2026-01-30 15:02:17.965474
1100	PRO-1099	Syndactyly Repair	procedure	t	2026-01-30 15:02:17.965474
1101	PRO-1100	Dermabrasion Face	procedure	t	2026-01-30 15:02:17.965474
1102	PRO-1101	upto 30% Burns 1st Dressing	procedure	t	2026-01-30 15:02:17.965474
1103	PRO-1102	upto 30% Burns Subsequent Dressing	procedure	t	2026-01-30 15:02:17.965474
1104	PRO-1103	30% to 50% Burns 1st Dressing	procedure	t	2026-01-30 15:02:17.965474
1105	PRO-1104	30% to 50% Burns Subsequent Dressing	procedure	t	2026-01-30 15:02:17.965474
1106	PRO-1105	Extensive Burn -above 50% Frist Dressing	procedure	t	2026-01-30 15:02:17.965474
1107	PRO-1106	Extensive Burn -above 50% Subsequent dressing	procedure	t	2026-01-30 15:02:17.965474
1108	PRO-1107	Plaster Work	procedure	t	2026-01-30 15:02:17.965474
1109	PRO-1108	Fingers (post slab)	procedure	t	2026-01-30 15:02:17.965474
1110	PRO-1109	Fingers full plaster	procedure	t	2026-01-30 15:02:17.965474
1111	PRO-1110	Colles Fracture - Below elbow	procedure	t	2026-01-30 15:02:17.965474
1112	PRO-1111	Colles Fracture - Full plaster	procedure	t	2026-01-30 15:02:17.965474
1113	PRO-1112	Colles fracture Ant. Or post. slab	procedure	t	2026-01-30 15:02:17.965474
1114	PRO-1113	Above elbow full plaster	procedure	t	2026-01-30 15:02:17.965474
1115	PRO-1114	Above Knee post-slab	procedure	t	2026-01-30 15:02:17.965474
1116	PRO-1115	Below Knee full plaster	procedure	t	2026-01-30 15:02:17.965474
1117	PRO-1116	Below Knee post-slab	procedure	t	2026-01-30 15:02:17.965474
1118	PRO-1117	Tube Plaster (or plaster cylinder)	procedure	t	2026-01-30 15:02:17.965474
1119	PRO-1118	Above knee full plaster	procedure	t	2026-01-30 15:02:17.965474
1120	PRO-1119	Above knee full slab	procedure	t	2026-01-30 15:02:17.965474
1121	PRO-1120	Minerva Jacket	procedure	t	2026-01-30 15:02:17.965474
1122	PRO-1121	Plaster Jacket	procedure	t	2026-01-30 15:02:17.965474
1123	PRO-1122	Shoulder spica	procedure	t	2026-01-30 15:02:17.965474
1124	PRO-1123	Single Hip spica	procedure	t	2026-01-30 15:02:17.965474
1125	PRO-1124	Double Hip spica	procedure	t	2026-01-30 15:02:17.965474
1126	PRO-1125	Strapping of Finger	procedure	t	2026-01-30 15:02:17.965474
1127	PRO-1126	Strapping of Toes	procedure	t	2026-01-30 15:02:17.965474
1128	PRO-1127	Strapping of Wrist	procedure	t	2026-01-30 15:02:17.965474
1129	PRO-1128	Strapping of Elbow	procedure	t	2026-01-30 15:02:17.965474
1130	PRO-1129	Strapping of Knee	procedure	t	2026-01-30 15:02:17.965474
1131	PRO-1130	Strapping of Ankle	procedure	t	2026-01-30 15:02:17.965474
1132	PRO-1131	Strapping of Chest	procedure	t	2026-01-30 15:02:17.965474
1133	PRO-1132	Strapping of Shoulder	procedure	t	2026-01-30 15:02:17.965474
1134	PRO-1133	Figure of 8 bandage	procedure	t	2026-01-30 15:02:17.965474
1135	PRO-1134	Collar and cuff sling	procedure	t	2026-01-30 15:02:17.965474
1136	PRO-1135	Ball bandage	procedure	t	2026-01-30 15:02:17.965474
1137	PRO-1136	Application of P.O.P Casts for Upper & Lower Limbs	procedure	t	2026-01-30 15:02:17.965474
1138	PRO-1137	Application of Functiol Cast Brace	procedure	t	2026-01-30 15:02:17.965474
1139	PRO-1138	Application of Skin Traction	procedure	t	2026-01-30 15:02:17.965474
1140	PRO-1139	Application of Skeletal Tractions	procedure	t	2026-01-30 15:02:17.965474
1141	PRO-1140	Bandage & Strappings for Fractures	procedure	t	2026-01-30 15:02:17.965474
1142	PRO-1141	Aspiration & Intra Articular Injections	procedure	t	2026-01-30 15:02:17.965474
1143	PRO-1142	Application of P.O.P Spices & Jackets	procedure	t	2026-01-30 15:02:17.965474
1144	PRO-1143	Close Reduction of Fractures of Limb & P.O.P	procedure	t	2026-01-30 15:02:17.965474
1145	PRO-1144	Reduction of Compound Fractures	procedure	t	2026-01-30 15:02:17.965474
1146	PRO-1145	Open Reduction & Internal Fixation of Fingurs & Toes	procedure	t	2026-01-30 15:02:17.965474
1147	PRO-1146	Open Reduction offracture of Long Bones of Upper / Lower\r\nLimb -iling & Exterl Fixation	procedure	t	2026-01-30 15:02:17.965474
1148	PRO-1147	Open Reduction of fracture of Long Bones of Upper / Lower\r\nLimb -AO Procedures	procedure	t	2026-01-30 15:02:17.965474
1149	PRO-1148	Tension Band Wirings	procedure	t	2026-01-30 15:02:17.965474
1150	PRO-1149	Bone Grafting	procedure	t	2026-01-30 15:02:17.965474
1151	PRO-1150	Excision of Bone Tumours	procedure	t	2026-01-30 15:02:17.965474
1152	PRO-1151	Excision or other Operations for Scaphoid Fractures	procedure	t	2026-01-30 15:02:17.965474
1153	PRO-1152	Sequestrectomy & Saucerisation	procedure	t	2026-01-30 15:02:17.965474
1154	PRO-1153	Sequestrectomy & Saucerizations -Arthrotomy	procedure	t	2026-01-30 15:02:17.965474
1155	PRO-1154	Multiple Pinning Fracture Neck Femur	procedure	t	2026-01-30 15:02:17.965474
1156	PRO-1155	Plate Fixations for Fracture Neck Femur	procedure	t	2026-01-30 15:02:17.965474
1157	PRO-1156	A.O.Compression Procedures for Fracture Neck Femur	procedure	t	2026-01-30 15:02:17.965474
1243	PRO-1242	Electrical stimulation (therapeutic)	procedure	t	2026-01-30 15:02:17.965474
1158	PRO-1157	Open Reduction of Fracture Neck Femur Muscle Pedicle\r\nGraft and Internal Fixations	procedure	t	2026-01-30 15:02:17.965474
1159	PRO-1158	Close Reduction of Dislocations	procedure	t	2026-01-30 15:02:17.965474
1160	PRO-1159	Open Reduction of Dislocations	procedure	t	2026-01-30 15:02:17.965474
1161	PRO-1160	Open Reduction of Fracture Dislocation & Internal Fixation	procedure	t	2026-01-30 15:02:17.965474
1162	PRO-1161	Neurolysis/Nerve repair	procedure	t	2026-01-30 15:02:17.965474
1163	PRO-1162	Nerve Repair with Grafting	procedure	t	2026-01-30 15:02:17.965474
1164	PRO-1163	Tendon with Transplant or Graft	procedure	t	2026-01-30 15:02:17.965474
1165	PRO-1164	Tendon Lengthening/Tendon repair	procedure	t	2026-01-30 15:02:17.965474
1166	PRO-1165	Tendon Transfer	procedure	t	2026-01-30 15:02:17.965474
1167	PRO-1166	Laminectomy Excision Disc and Tumours	procedure	t	2026-01-30 15:02:17.965474
1168	PRO-1167	Spil Ostectomy and Internal Fixations	procedure	t	2026-01-30 15:02:17.965474
1169	PRO-1168	Anterolateral decompression for tuberculosis/ Costo- Transversectomy	procedure	t	2026-01-30 15:02:17.965474
1170	PRO-1169	Antereolateral Decompression and Spil Fusion	procedure	t	2026-01-30 15:02:17.965474
1171	PRO-1170	Corrective Ostectomy & Internal Fixation - short bones	procedure	t	2026-01-30 15:02:17.965474
1172	PRO-1171	Corrective Ostectomy & Internal Fixation - long bones	procedure	t	2026-01-30 15:02:17.965474
1173	PRO-1172	Arthrodesis of - Minor Joints	procedure	t	2026-01-30 15:02:17.965474
1174	PRO-1173	Arthrodesis of - Major Joints	procedure	t	2026-01-30 15:02:17.965474
1175	PRO-1174	Soft Tissue Operations for C.T.E.V.	procedure	t	2026-01-30 15:02:17.965474
1176	PRO-1175	Soft Tissue Operations for Polio	procedure	t	2026-01-30 15:02:17.965474
1177	PRO-1176	Hemiarthroplasty- Hip	procedure	t	2026-01-30 15:02:17.965474
1178	PRO-1177	Hemiarthroplasty- Shoulder	procedure	t	2026-01-30 15:02:17.965474
1179	PRO-1178	Operations for Brachial Plexus & Cervical Rib	procedure	t	2026-01-30 15:02:17.965474
1180	PRO-1179	Amputations - Below Knee	procedure	t	2026-01-30 15:02:17.965474
1181	PRO-1180	Amputations - Below Elbow	procedure	t	2026-01-30 15:02:17.965474
1182	PRO-1181	Amputations - Above Knee	procedure	t	2026-01-30 15:02:17.965474
1183	PRO-1182	Amputations - Above Elbow	procedure	t	2026-01-30 15:02:17.965474
1184	PRO-1183	Amputations - Forequarter	procedure	t	2026-01-30 15:02:17.965474
1185	PRO-1184	Amputations -Hind Quarter and Hemipelvectomy	procedure	t	2026-01-30 15:02:17.965474
1186	PRO-1185	Disarticulations - Major joint	procedure	t	2026-01-30 15:02:17.965474
1187	PRO-1186	Disarticulations - Minor joint	procedure	t	2026-01-30 15:02:17.965474
1188	PRO-1187	Arthrography	procedure	t	2026-01-30 15:02:17.965474
1189	PRO-1188	Arthroscopy - Diagnostic	procedure	t	2026-01-30 15:02:17.965474
1190	PRO-1189	Arthroscopy-therapeutic: without implant	procedure	t	2026-01-30 15:02:17.965474
1191	PRO-1190	Arthroscopy-therapeutic: with implant	procedure	t	2026-01-30 15:02:17.965474
1192	PRO-1191	Soft Tissue Operation on JOINTS -SMALL	procedure	t	2026-01-30 15:02:17.965474
1193	PRO-1192	Soft Tissue Operation on JOINTS -LARGE	procedure	t	2026-01-30 15:02:17.965474
1194	PRO-1193	Myocutaneous and Fasciocutaneous Flap Procedures for Limbs	procedure	t	2026-01-30 15:02:17.965474
1195	PRO-1194	Removal of Wires & Screw	procedure	t	2026-01-30 15:02:17.965474
1196	PRO-1195	Removal of Plates	procedure	t	2026-01-30 15:02:17.965474
1197	PRO-1196	Total Hip Replacement	procedure	t	2026-01-30 15:02:17.965474
1198	PRO-1197	Total Ankle Joint Replacement	procedure	t	2026-01-30 15:02:17.965474
1199	PRO-1198	Total Knee Joint Replacement	procedure	t	2026-01-30 15:02:17.965474
1200	PRO-1199	Total Shoulder Joint Replacement	procedure	t	2026-01-30 15:02:17.965474
1201	PRO-1200	Total Elbow Joint Replacement	procedure	t	2026-01-30 15:02:17.965474
1202	PRO-1201	Total Wrist Joint Replacement	procedure	t	2026-01-30 15:02:17.965474
1203	PRO-1202	Total finger joint replacement	procedure	t	2026-01-30 15:02:17.965474
1204	PRO-1203	Tubular external fixator	procedure	t	2026-01-30 15:02:17.965474
1205	PRO-1204	Ilizarov's external fixator	procedure	t	2026-01-30 15:02:17.965474
1206	PRO-1205	Pelvi-acetebular fracture -Internal fixation	procedure	t	2026-01-30 15:02:17.965474
1207	PRO-1206	Meniscectomy	procedure	t	2026-01-30 15:02:17.965474
1208	PRO-1207	Meniscus Repair	procedure	t	2026-01-30 15:02:17.965474
1209	PRO-1208	ACL Reconstruction	procedure	t	2026-01-30 15:02:17.965474
1210	PRO-1209	PCL Reconstruction	procedure	t	2026-01-30 15:02:17.965474
1211	PRO-1210	Knee Collateral Ligament Reconstruction	procedure	t	2026-01-30 15:02:17.965474
1212	PRO-1211	Bencarf Repair Shoulder	procedure	t	2026-01-30 15:02:17.965474
1213	PRO-1212	RC Repair	procedure	t	2026-01-30 15:02:17.965474
1214	PRO-1213	Biceps tenodesis	procedure	t	2026-01-30 15:02:17.965474
1215	PRO-1214	Distal biceps tendon repair	procedure	t	2026-01-30 15:02:17.965474
1216	PRO-1215	Arthrolysis of knee	procedure	t	2026-01-30 15:02:17.965474
1217	PRO-1216	Capsulotomy of Shoulder	procedure	t	2026-01-30 15:02:17.965474
1218	PRO-1217	Conservative Pop	procedure	t	2026-01-30 15:02:17.965474
1219	PRO-1218	Application for CTEV per sitting	procedure	t	2026-01-30 15:02:17.965474
1220	PRO-1219	Total Hip Replacement Revision Stage-I	procedure	t	2026-01-30 15:02:17.965474
1221	PRO-1220	Total Hip Replacement Revision Stage-II	procedure	t	2026-01-30 15:02:17.965474
1222	PRO-1221	Total Knee Replacement Revision Stage-I	procedure	t	2026-01-30 15:02:17.965474
1223	PRO-1222	Total Knee Replacement Revision Stage-II	procedure	t	2026-01-30 15:02:17.965474
1224	PRO-1223	Illizarov/ external fixation for limb lengthening/ deformity correction	procedure	t	2026-01-30 15:02:17.965474
1225	PRO-1224	Discectomy/ Micro Discectomy	procedure	t	2026-01-30 15:02:17.965474
1226	PRO-1225	Laminectomy	procedure	t	2026-01-30 15:02:17.965474
1227	PRO-1226	Spinal Fixation Cervical/dorsolumbar/ lumbosacral	procedure	t	2026-01-30 15:02:17.965474
1228	PRO-1227	Fusion Surgery Cervical/ Lumbar Spine upto 2 Level	procedure	t	2026-01-30 15:02:17.965474
1229	PRO-1228	More than 2 Level	procedure	t	2026-01-30 15:02:17.965474
1230	PRO-1229	Scoliosis Surgery/ Deformity Correction of Spine	procedure	t	2026-01-30 15:02:17.965474
1231	PRO-1230	Vertebroplasty	procedure	t	2026-01-30 15:02:17.965474
1232	PRO-1231	Spinal Injections	procedure	t	2026-01-30 15:02:17.965474
1233	PRO-1232	DHS for Fracture Neck Femur	procedure	t	2026-01-30 15:02:17.965474
1234	PRO-1233	Proximal Femoral Nail (PFN for IT Fracture)	procedure	t	2026-01-30 15:02:17.965474
1235	PRO-1234	Spinal Osteotomy	procedure	t	2026-01-30 15:02:17.965474
1236	PRO-1235	Illizarovâ€™s / External Fixation for Trauma	procedure	t	2026-01-30 15:02:17.965474
1237	PRO-1236	Soft Tissue Operations for Polio/ Cerebral Palsy	procedure	t	2026-01-30 15:02:17.965474
1238	PRO-1237	Mini Fixator for Hand/Foot	procedure	t	2026-01-30 15:02:17.965474
1239	PRO-1238	Other Major Surgery	procedure	t	2026-01-30 15:02:17.965474
1240	PRO-1239	Other Minor Surgery	procedure	t	2026-01-30 15:02:17.965474
1241	PRO-1240	Ultrasonic therapy	procedure	t	2026-01-30 15:02:17.965474
1242	PRO-1241	S.W. Diathermy	procedure	t	2026-01-30 15:02:17.965474
1244	PRO-1243	Muscle testing and diagnostic	procedure	t	2026-01-30 15:02:17.965474
1245	PRO-1244	Infra red	procedure	t	2026-01-30 15:02:17.965474
1246	PRO-1245	U.V. Therapeutic dose	procedure	t	2026-01-30 15:02:17.965474
1247	PRO-1246	Intermittent Lumbar Traction	procedure	t	2026-01-30 15:02:17.965474
1248	PRO-1247	Intermittent Cervical traction	procedure	t	2026-01-30 15:02:17.965474
1249	PRO-1248	Wax bath	procedure	t	2026-01-30 15:02:17.965474
1250	PRO-1249	Hot pack	procedure	t	2026-01-30 15:02:17.965474
1251	PRO-1250	Breathing Exercises & Postural Drainage	procedure	t	2026-01-30 15:02:17.965474
1252	PRO-1251	Cerebral Palsy â€“ exercise	procedure	t	2026-01-30 15:02:17.965474
1253	PRO-1252	Post â€“ polio exercise	procedure	t	2026-01-30 15:02:17.965474
1254	PRO-1253	Cobalt 60 therapy	procedure	t	2026-01-30 15:02:17.965474
1255	PRO-1254	Radical therapy	procedure	t	2026-01-30 15:02:17.965474
1256	PRO-1255	Palliative therapy	procedure	t	2026-01-30 15:02:17.965474
1257	PRO-1256	Linear accelerator	procedure	t	2026-01-30 15:02:17.965474
1258	PRO-1257	Radical therapy	procedure	t	2026-01-30 15:02:17.965474
1259	PRO-1258	Palliative therapy	procedure	t	2026-01-30 15:02:17.965474
1260	PRO-1259	3 D Planning	procedure	t	2026-01-30 15:02:17.965474
1261	PRO-1260	2 D Planing	procedure	t	2026-01-30 15:02:17.965474
1262	PRO-1261	IMRT(Intensity Modulated radiotherapy)	procedure	t	2026-01-30 15:02:17.965474
1263	PRO-1262	SRT (Stereotactic radiotherapy)	procedure	t	2026-01-30 15:02:17.965474
1264	PRO-1263	SRS(Stereotactic radio surgery)	procedure	t	2026-01-30 15:02:17.965474
1265	PRO-1264	IGRT(Image guided radiotherapy)	procedure	t	2026-01-30 15:02:17.965474
1266	PRO-1265	Respiratory Gating-alongwith Linear accelerator planning	procedure	t	2026-01-30 15:02:17.965474
1267	PRO-1266	Electron beam with Linear accelerator	procedure	t	2026-01-30 15:02:17.965474
1268	PRO-1267	Tomotherapy	procedure	t	2026-01-30 15:02:17.965474
1269	PRO-1268	Intracavitory	procedure	t	2026-01-30 15:02:17.965474
1270	PRO-1269	Interstitial	procedure	t	2026-01-30 15:02:17.965474
1271	PRO-1270	Intraluminal	procedure	t	2026-01-30 15:02:17.965474
1272	PRO-1271	Surface mould	procedure	t	2026-01-30 15:02:17.965474
1273	PRO-1272	GLIADAL WAFER	procedure	t	2026-01-30 15:02:17.965474
1274	PRO-1273	Neoadjuvant	procedure	t	2026-01-30 15:02:17.965474
1275	PRO-1274	Adjuvant	procedure	t	2026-01-30 15:02:17.965474
1276	PRO-1275	Concurrent-chemoadiation	procedure	t	2026-01-30 15:02:17.965474
1277	PRO-1276	Single drug	procedure	t	2026-01-30 15:02:17.965474
1278	PRO-1277	Multiple drugs	procedure	t	2026-01-30 15:02:17.965474
1279	PRO-1278	Targeted therapy	procedure	t	2026-01-30 15:02:17.965474
1280	PRO-1279	Chemoport facility	procedure	t	2026-01-30 15:02:17.965474
1281	PRO-1280	PICC line (peripherally inserted Central canulisation)	procedure	t	2026-01-30 15:02:17.965474
1282	PRO-1281	Upper G.I. Endoscopy + Lower G.I. Endoscopy	procedure	t	2026-01-30 15:02:17.965474
1283	PRO-1282	Diagnostic endoscopy	procedure	t	2026-01-30 15:02:17.965474
1284	PRO-1283	Endoscopic biopsy	procedure	t	2026-01-30 15:02:17.965474
1285	PRO-1284	Endoscopic mucosal resection	procedure	t	2026-01-30 15:02:17.965474
1286	PRO-1285	Oesophageal stricture dilatation	procedure	t	2026-01-30 15:02:17.965474
1287	PRO-1286	Balloon dilatation of achalasia cardia	procedure	t	2026-01-30 15:02:17.965474
1288	PRO-1287	Foreign body removal	procedure	t	2026-01-30 15:02:17.965474
1289	PRO-1288	Oesophageal stenting	procedure	t	2026-01-30 15:02:17.965474
1290	PRO-1289	Band ligation of oesophageal varices	procedure	t	2026-01-30 15:02:17.965474
1291	PRO-1290	Sclerotherapy of oesophageal varices	procedure	t	2026-01-30 15:02:17.965474
1292	PRO-1291	Glue injection of varices	procedure	t	2026-01-30 15:02:17.965474
1293	PRO-1292	Argon plasma coagulation	procedure	t	2026-01-30 15:02:17.965474
1294	PRO-1293	Pyloric balloon dilatation	procedure	t	2026-01-30 15:02:17.965474
1295	PRO-1294	Enteranal stenting	procedure	t	2026-01-30 15:02:17.965474
1296	PRO-1295	Duodenal stricture dilation	procedure	t	2026-01-30 15:02:17.965474
1297	PRO-1296	Single balloon enterocopy	procedure	t	2026-01-30 15:02:17.965474
1298	PRO-1297	Double balloon enteroscopy	procedure	t	2026-01-30 15:02:17.965474
1299	PRO-1298	Capsule endoscopy	procedure	t	2026-01-30 15:02:17.965474
1300	PRO-1299	Piles banding	procedure	t	2026-01-30 15:02:17.965474
1301	PRO-1300	Colonic stricture dilatation	procedure	t	2026-01-30 15:02:17.965474
1302	PRO-1301	Hot biopsy forceps procedures	procedure	t	2026-01-30 15:02:17.965474
1303	PRO-1302	Colonic stenting	procedure	t	2026-01-30 15:02:17.965474
1304	PRO-1303	Junction biopsy	procedure	t	2026-01-30 15:02:17.965474
1305	PRO-1304	Conjugal microscopy	procedure	t	2026-01-30 15:02:17.965474
1306	PRO-1305	Endoscopic sphincterotomy	procedure	t	2026-01-30 15:02:17.965474
1307	PRO-1306	CBD stone extraction	procedure	t	2026-01-30 15:02:17.965474
1308	PRO-1307	CBD stricture dilatation	procedure	t	2026-01-30 15:02:17.965474
1309	PRO-1308	Biliary stenting (plastic and metallic)	procedure	t	2026-01-30 15:02:17.965474
1310	PRO-1309	Mechanical lithotripsy of CBD stones	procedure	t	2026-01-30 15:02:17.965474
1311	PRO-1310	Pancreatic sphincterotomy	procedure	t	2026-01-30 15:02:17.965474
1312	PRO-1311	Pancreatic stricture dilatation	procedure	t	2026-01-30 15:02:17.965474
1313	PRO-1312	Pancreatic stone extraction	procedure	t	2026-01-30 15:02:17.965474
1314	PRO-1313	Mechanical lithotripsy of pancreatic stones	procedure	t	2026-01-30 15:02:17.965474
1315	PRO-1314	Endoscopic cysto gastrostomy	procedure	t	2026-01-30 15:02:17.965474
1316	PRO-1315	Balloon dilatation of papilla	procedure	t	2026-01-30 15:02:17.965474
1317	PRO-1316	Ultrasound guided FNAC	procedure	t	2026-01-30 15:02:17.965474
1318	PRO-1317	Ultrasound guided abscess Drainage	procedure	t	2026-01-30 15:02:17.965474
1319	PRO-1318	PTBD	procedure	t	2026-01-30 15:02:17.965474
1320	PRO-1319	Diagnostic angiography	procedure	t	2026-01-30 15:02:17.965474
1321	PRO-1320	Vascular embolization	procedure	t	2026-01-30 15:02:17.965474
1322	PRO-1321	TIPS	procedure	t	2026-01-30 15:02:17.965474
1323	PRO-1322	IVC graphy + hepatic veinography	procedure	t	2026-01-30 15:02:17.965474
1324	PRO-1323	Muscular stenting	procedure	t	2026-01-30 15:02:17.965474
1325	PRO-1324	BRTO	procedure	t	2026-01-30 15:02:17.965474
1326	PRO-1325	Portal haemodymic studies	procedure	t	2026-01-30 15:02:17.965474
1327	PRO-1326	Manometry and PH metry	procedure	t	2026-01-30 15:02:17.965474
1328	PRO-1327	Oesophageal PH metry	procedure	t	2026-01-30 15:02:17.965474
1329	PRO-1328	Oesophageal manometry	procedure	t	2026-01-30 15:02:17.965474
1330	PRO-1329	Small bowel manometry	procedure	t	2026-01-30 15:02:17.965474
1331	PRO-1330	Anorectal manometry	procedure	t	2026-01-30 15:02:17.965474
1332	PRO-1331	Colonic manometry	procedure	t	2026-01-30 15:02:17.965474
1333	PRO-1332	Biliary manometry	procedure	t	2026-01-30 15:02:17.965474
1334	PRO-1333	Sengstaken blackenesse tube tempode	procedure	t	2026-01-30 15:02:17.965474
1335	PRO-1334	Lintas machles tube tempode	procedure	t	2026-01-30 15:02:17.965474
1519	LAB-1515	Serum Iron	lab_test	t	2026-01-30 15:02:17.965474
1336	PRO-1335	Fecal fat test/ fecal chymotrypsin/ fecal elastase	procedure	t	2026-01-30 15:02:17.965474
1337	PRO-1336	Breath tests	procedure	t	2026-01-30 15:02:17.965474
1338	PRO-1337	Extra corporeal shortwave lithotripsy	procedure	t	2026-01-30 15:02:17.965474
1339	PRO-1338	Liver biopsy	procedure	t	2026-01-30 15:02:17.965474
1340	PRO-0001	TAVI/TAVR Implant	procedure	t	2026-01-30 15:02:17.965474
1341	PRO-0002	TAVI/TAVR Procedure cost	procedure	t	2026-01-30 15:02:17.965474
1342	PRO-0003	IVL (Coronary Intra Vascular Lithotripsy / Short wave Lithotripsy) â€“ including\r\nGST	procedure	t	2026-01-30 15:02:17.965474
1343	LAB-1339	Dental IOPA X-ray	lab_test	t	2026-01-30 15:02:17.965474
1344	LAB-1340	Occlusal X-ray	lab_test	t	2026-01-30 15:02:17.965474
1345	LAB-1341	OPG X-ray	lab_test	t	2026-01-30 15:02:17.965474
1346	LAB-1342	Lung Ventilation & Perfusion Scan (V/Q Scan)	lab_test	t	2026-01-30 15:02:17.965474
1347	LAB-1343	Lung Perfusion Scan	lab_test	t	2026-01-30 15:02:17.965474
1348	LAB-1344	Whole Body Bone Scan with SPECT.	lab_test	t	2026-01-30 15:02:17.965474
1349	LAB-1345	Three phase whole body Bone Scan	lab_test	t	2026-01-30 15:02:17.965474
1350	LAB-1346	Brain Perfusion SPECT Scan with Technetium 99m radiopharmaceuticals.	lab_test	t	2026-01-30 15:02:17.965474
1351	LAB-1347	Radionuclide Cisternography for CSF leak	lab_test	t	2026-01-30 15:02:17.965474
1352	LAB-1348	Gastro esophageal Reflux Study (G.E.R. Study)	lab_test	t	2026-01-30 15:02:17.965474
1353	LAB-1349	Gastro intestinal Bleed (GloB.) Study with Technetium 99m\r\nlabeled RBCs.	lab_test	t	2026-01-30 15:02:17.965474
1354	LAB-1350	Hepatobiliary Scintigraphy.	lab_test	t	2026-01-30 15:02:17.965474
1355	LAB-1351	Meckel's Scan	lab_test	t	2026-01-30 15:02:17.965474
1356	LAB-1352	Hepatosplenic scintigraphy with Technetium-99m radiopharmaceuticals	lab_test	t	2026-01-30 15:02:17.965474
1357	LAB-1353	Gastric emptying	lab_test	t	2026-01-30 15:02:17.965474
1358	LAB-1354	Renal Cortical Scintigraphy with Technetium 99m D.M.S.A.	lab_test	t	2026-01-30 15:02:17.965474
1359	LAB-1355	Dynamic Renography.	lab_test	t	2026-01-30 15:02:17.965474
1360	LAB-1356	Dynamic Renography with Diuretic.	lab_test	t	2026-01-30 15:02:17.965474
1361	LAB-1357	Dynamic Renography with Captopril	lab_test	t	2026-01-30 15:02:17.965474
1362	LAB-1358	Testicular Scan	lab_test	t	2026-01-30 15:02:17.965474
1363	LAB-1359	Thyroid Uptake measurements with 131-Iodine.	lab_test	t	2026-01-30 15:02:17.965474
1364	LAB-1360	Thyroid Scan with Technetium 99m Pertechnetate.	lab_test	t	2026-01-30 15:02:17.965474
1365	LAB-1361	Lodine-131 Whole Body Scan.	lab_test	t	2026-01-30 15:02:17.965474
1366	LAB-1362	Whole Body Scan with M.I.B.G.	lab_test	t	2026-01-30 15:02:17.965474
1367	LAB-1363	Parathyroid Scan	lab_test	t	2026-01-30 15:02:17.965474
1368	LAB-1364	131-lodine Therapy	lab_test	t	2026-01-30 15:02:17.965474
1369	LAB-1365	131-lodine Therapy <15mCi	lab_test	t	2026-01-30 15:02:17.965474
1370	LAB-1366	131-lodine Therapy 15-50mCi	lab_test	t	2026-01-30 15:02:17.965474
1371	LAB-1367	131-lodine Therapy 51-100mCi	lab_test	t	2026-01-30 15:02:17.965474
1372	LAB-1368	131-lodine Therapy >100mCi	lab_test	t	2026-01-30 15:02:17.965474
1373	LAB-1369	Phosphorus-32 therapy for metastatic bone pain palliation	lab_test	t	2026-01-30 15:02:17.965474
1374	LAB-1370	Samarium-153 therapy for metastatic bone pain palliation	lab_test	t	2026-01-30 15:02:17.965474
1375	LAB-1371	Radiosynovectomy with Yttrium	lab_test	t	2026-01-30 15:02:17.965474
1376	LAB-1372	Stress thallium / Myocardial Perfusion Scintigraphy	lab_test	t	2026-01-30 15:02:17.965474
1377	LAB-1373	Rest thallium / Myocardial Perfusion Scintigraphy	lab_test	t	2026-01-30 15:02:17.965474
1378	LAB-1374	Venography	lab_test	t	2026-01-30 15:02:17.965474
1379	LAB-1375	TMT	lab_test	t	2026-01-30 15:02:17.965474
1380	LAB-1376	TEE	lab_test	t	2026-01-30 15:02:17.965474
1381	LAB-1377	Lymph angiography	lab_test	t	2026-01-30 15:02:17.965474
1382	LAB-1378	Scintimammography.	lab_test	t	2026-01-30 15:02:17.965474
1383	LAB-1379	Indium lableled octeriotide Scan.	lab_test	t	2026-01-30 15:02:17.965474
1384	LAB-1380	FDG Whole body PET/CT Scan	lab_test	t	2026-01-30 15:02:17.965474
1385	LAB-1381	Brain/Heart FDG PET/CT Scan	lab_test	t	2026-01-30 15:02:17.965474
1386	LAB-1382	Gallium-68 Peptide PET/CT imaging for Neuroendocrine tumor	lab_test	t	2026-01-30 15:02:17.965474
1387	LAB-1383	Urine routine- pH Specific gravity sugar protein and microscopy	lab_test	t	2026-01-30 15:02:17.965474
1388	LAB-1384	Urine-Microalbumin	lab_test	t	2026-01-30 15:02:17.965474
1389	LAB-1385	Stool routine	lab_test	t	2026-01-30 15:02:17.965474
1390	LAB-1386	Stool occult blood	lab_test	t	2026-01-30 15:02:17.965474
1391	LAB-1387	Post coital smear examination	lab_test	t	2026-01-30 15:02:17.965474
1392	LAB-1388	Semen analysis	lab_test	t	2026-01-30 15:02:17.965474
1393	LAB-1389	Haemoglobin (Hb)	lab_test	t	2026-01-30 15:02:17.965474
1394	LAB-1390	Total Leucocytic Count (TLC)	lab_test	t	2026-01-30 15:02:17.965474
1395	LAB-1391	Differential Leucocytic Count (DLC)	lab_test	t	2026-01-30 15:02:17.965474
1396	LAB-1392	E.S.R.	lab_test	t	2026-01-30 15:02:17.965474
1397	LAB-1393	Total Red Cell count with MCVMCHMCHCDRW	lab_test	t	2026-01-30 15:02:17.965474
1398	LAB-1394	Complete Haemogram/CBC HbRBC count and indices\r\nTLC DLC Platelet ESR Peripheral smear examination	lab_test	t	2026-01-30 15:02:17.965474
1399	LAB-1395	Platelet count	lab_test	t	2026-01-30 15:02:17.965474
1400	LAB-1396	Reticulocyte count	lab_test	t	2026-01-30 15:02:17.965474
1401	LAB-1397	Absolute Eosinophil count	lab_test	t	2026-01-30 15:02:17.965474
1402	LAB-1398	Packed Cell Volume (PCV)	lab_test	t	2026-01-30 15:02:17.965474
1403	LAB-1399	Peripheral Smear Examination	lab_test	t	2026-01-30 15:02:17.965474
1404	LAB-1400	Smear for Malaria parasite	lab_test	t	2026-01-30 15:02:17.965474
1405	LAB-1401	Bleeding Time	lab_test	t	2026-01-30 15:02:17.965474
1406	LAB-1402	Osmotic fragility Test	lab_test	t	2026-01-30 15:02:17.965474
1407	LAB-1403	Bone Marrow Smear Examination	lab_test	t	2026-01-30 15:02:17.965474
1408	LAB-1404	Bone Marrow Smear Examination with iron stain	lab_test	t	2026-01-30 15:02:17.965474
1409	LAB-1405	Bone Marrow Smear Examination and cytochemistry	lab_test	t	2026-01-30 15:02:17.965474
1410	LAB-1406	Activated partial ThromboplastinTime (APTT)	lab_test	t	2026-01-30 15:02:17.965474
1411	LAB-1407	Rapid test for malaria(card test)	lab_test	t	2026-01-30 15:02:17.965474
1412	LAB-1408	WBC cytochemistry for leukemia -Complete panel	lab_test	t	2026-01-30 15:02:17.965474
1413	LAB-1409	Bleeding Disorder panel- PT APTT Thrombin Time\r\nFibrinogen D-Dimer/ FDP	lab_test	t	2026-01-30 15:02:17.965474
1414	LAB-1410	Factor Assays-Factor VIII	lab_test	t	2026-01-30 15:02:17.965474
1415	LAB-1411	Factor Assays-Factor IX	lab_test	t	2026-01-30 15:02:17.965474
1416	LAB-1412	Platelet Function test	lab_test	t	2026-01-30 15:02:17.965474
1417	LAB-1413	Tests for hypercoagulable states- Protein C Protein S Antithrombin	lab_test	t	2026-01-30 15:02:17.965474
1418	LAB-1414	Tests for lupus anticoagulant	lab_test	t	2026-01-30 15:02:17.965474
1419	LAB-1415	Tests for Antiphospholipid antibody IgG IgM ( for cardiolipin and B2\r\nGlycoprotein 1)	lab_test	t	2026-01-30 15:02:17.965474
1420	LAB-1416	Thalassemia studies (Red Cell indices and Hb HPLC)	lab_test	t	2026-01-30 15:02:17.965474
1421	LAB-1417	Tests for Sickling / Hb HPLC)	lab_test	t	2026-01-30 15:02:17.965474
1422	LAB-1418	Blood Group & RH Type	lab_test	t	2026-01-30 15:02:17.965474
1423	LAB-1419	Cross match	lab_test	t	2026-01-30 15:02:17.965474
1424	LAB-1420	Coombâ€™s Test Direct	lab_test	t	2026-01-30 15:02:17.965474
1425	LAB-1421	Coombâ€™s Test Indirect	lab_test	t	2026-01-30 15:02:17.965474
1426	LAB-1422	3 cell panel- antibody screening for pregnant female	lab_test	t	2026-01-30 15:02:17.965474
1427	LAB-1423	11 cells panel for antibody identification	lab_test	t	2026-01-30 15:02:17.965474
1428	LAB-1424	HBs Ag	lab_test	t	2026-01-30 15:02:17.965474
1429	LAB-1425	HCV	lab_test	t	2026-01-30 15:02:17.965474
1430	LAB-1426	HIV I and II	lab_test	t	2026-01-30 15:02:17.965474
1431	LAB-1427	VDRL	lab_test	t	2026-01-30 15:02:17.965474
1432	LAB-1428	RH Antibody titer	lab_test	t	2026-01-30 15:02:17.965474
1433	LAB-1429	Platelet Concentrate	lab_test	t	2026-01-30 15:02:17.965474
1434	LAB-1430	Random Donor Platelet(RDP)	lab_test	t	2026-01-30 15:02:17.965474
1435	LAB-1431	Single Donor Platelet (SDP- Aphresis)	lab_test	t	2026-01-30 15:02:17.965474
1436	LAB-1432	Routine-H & E	lab_test	t	2026-01-30 15:02:17.965474
1437	LAB-1433	special stain	lab_test	t	2026-01-30 15:02:17.965474
1438	LAB-1434	Immunohistochemistry(IHC)	lab_test	t	2026-01-30 15:02:17.965474
1439	LAB-1435	Frozen section	lab_test	t	2026-01-30 15:02:17.965474
1440	LAB-1436	Paraffin section	lab_test	t	2026-01-30 15:02:17.965474
1441	LAB-1437	Pap Smear	lab_test	t	2026-01-30 15:02:17.965474
1442	LAB-1438	Body fluid for Malignant cells	lab_test	t	2026-01-30 15:02:17.965474
1443	LAB-1439	FNAC	lab_test	t	2026-01-30 15:02:17.965474
1444	LAB-1440	Leukemia panel /Lymphoma panel	lab_test	t	2026-01-30 15:02:17.965474
1445	LAB-1441	PNH Panel-CD55CD59	lab_test	t	2026-01-30 15:02:17.965474
1446	LAB-1442	Karyotyping	lab_test	t	2026-01-30 15:02:17.965474
1447	LAB-1443	FISH	lab_test	t	2026-01-30 15:02:17.965474
1448	LAB-1444	Blood Glucose Random	lab_test	t	2026-01-30 15:02:17.965474
1449	LAB-1445	24 hrs urine for ProteinsSodium creatinine	lab_test	t	2026-01-30 15:02:17.965474
1450	LAB-1446	Blood Urea Nitrogen	lab_test	t	2026-01-30 15:02:17.965474
1451	LAB-1447	Serum Creatinine	lab_test	t	2026-01-30 15:02:17.965474
1452	LAB-1448	Urine Bile Pigment and Salt	lab_test	t	2026-01-30 15:02:17.965474
1453	LAB-1449	Urine Urobilinogen	lab_test	t	2026-01-30 15:02:17.965474
1454	LAB-1450	Urine Ketones	lab_test	t	2026-01-30 15:02:17.965474
1455	LAB-1451	Urine Occult Blood	lab_test	t	2026-01-30 15:02:17.965474
1456	LAB-1452	Urine total proteins	lab_test	t	2026-01-30 15:02:17.965474
1457	LAB-1453	Rheumatoid Factor test	lab_test	t	2026-01-30 15:02:17.965474
1458	LAB-1454	Bence Jones protein	lab_test	t	2026-01-30 15:02:17.965474
1459	LAB-1455	Serum Uric Acid	lab_test	t	2026-01-30 15:02:17.965474
1460	LAB-1456	Serum Bilirubin total & direct	lab_test	t	2026-01-30 15:02:17.965474
1461	LAB-1457	Serum Iron	lab_test	t	2026-01-30 15:02:17.965474
1462	LAB-1458	C.R.P.	lab_test	t	2026-01-30 15:02:17.965474
1463	LAB-1459	C.R.P Quantitative	lab_test	t	2026-01-30 15:02:17.965474
1464	LAB-1460	Body fluid (CSF/Ascitic Fluid etc.)Sugar Protein etc.	lab_test	t	2026-01-30 15:02:17.965474
1465	LAB-1461	Albumin.	lab_test	t	2026-01-30 15:02:17.965474
1466	LAB-1462	Creatinine clearance.	lab_test	t	2026-01-30 15:02:17.965474
1467	LAB-1463	Serum Cholesterol	lab_test	t	2026-01-30 15:02:17.965474
1468	LAB-1464	Total Iron Binding Capacity	lab_test	t	2026-01-30 15:02:17.965474
1469	LAB-1465	Glucose (Fasting & PP)	lab_test	t	2026-01-30 15:02:17.965474
1470	LAB-1466	Serum Calcium â€“Total	lab_test	t	2026-01-30 15:02:17.965474
1471	LAB-1467	Serum Calcium â€“Ionic	lab_test	t	2026-01-30 15:02:17.965474
1472	LAB-1468	Serum Phosphorus	lab_test	t	2026-01-30 15:02:17.965474
1473	LAB-1469	Total Protein Alb/Glo Ratio	lab_test	t	2026-01-30 15:02:17.965474
1474	LAB-1470	IgG.	lab_test	t	2026-01-30 15:02:17.965474
1475	LAB-1471	IgM.	lab_test	t	2026-01-30 15:02:17.965474
1476	LAB-1472	IgA.	lab_test	t	2026-01-30 15:02:17.965474
1477	LAB-1473	ANA.	lab_test	t	2026-01-30 15:02:17.965474
1478	LAB-1474	Ds DNA.	lab_test	t	2026-01-30 15:02:17.965474
1479	LAB-1475	S.G.P.T.	lab_test	t	2026-01-30 15:02:17.965474
1480	LAB-1476	S.G.O.T.	lab_test	t	2026-01-30 15:02:17.965474
1481	LAB-1477	Serum amylase	lab_test	t	2026-01-30 15:02:17.965474
1482	LAB-1478	Serum Lipase	lab_test	t	2026-01-30 15:02:17.965474
1483	LAB-1479	Serum Lactate	lab_test	t	2026-01-30 15:02:17.965474
1484	LAB-1480	Serum Magnesium	lab_test	t	2026-01-30 15:02:17.965474
1485	LAB-1481	Serum Sodium	lab_test	t	2026-01-30 15:02:17.965474
1486	LAB-1482	Serum Potassium	lab_test	t	2026-01-30 15:02:17.965474
1487	LAB-1483	Serum Ammonia	lab_test	t	2026-01-30 15:02:17.965474
1488	LAB-1484	Anemia Profile	lab_test	t	2026-01-30 15:02:17.965474
1489	LAB-1485	Serum Testosterone	lab_test	t	2026-01-30 15:02:17.965474
1490	LAB-1486	Imprint Smear From Endoscopy	lab_test	t	2026-01-30 15:02:17.965474
1491	LAB-1487	Triglyceride	lab_test	t	2026-01-30 15:02:17.965474
1492	LAB-1488	Glucose Tolerance Test (GTT)	lab_test	t	2026-01-30 15:02:17.965474
1493	LAB-1489	Triple Marker.	lab_test	t	2026-01-30 15:02:17.965474
1494	LAB-1490	C.P.K.	lab_test	t	2026-01-30 15:02:17.965474
1495	LAB-1491	Foetal Haemoglobin (HbF)	lab_test	t	2026-01-30 15:02:17.965474
1496	LAB-1492	Prothrombin Time (P.T.)	lab_test	t	2026-01-30 15:02:17.965474
1497	LAB-1493	L.D.H.	lab_test	t	2026-01-30 15:02:17.965474
1498	LAB-1494	Alkaline Phosphatase	lab_test	t	2026-01-30 15:02:17.965474
1499	LAB-1495	Acid Phosphatase	lab_test	t	2026-01-30 15:02:17.965474
1500	LAB-1496	CK MB	lab_test	t	2026-01-30 15:02:17.965474
1501	LAB-1497	CK MB Mass	lab_test	t	2026-01-30 15:02:17.965474
1502	LAB-1498	Troponin I	lab_test	t	2026-01-30 15:02:17.965474
1503	LAB-1499	Troponin T	lab_test	t	2026-01-30 15:02:17.965474
1504	LAB-1500	Glucose Phosphate Dehydrogenase (G 6PD)	lab_test	t	2026-01-30 15:02:17.965474
1505	LAB-1501	Lithium.	lab_test	t	2026-01-30 15:02:17.965474
1506	LAB-1502	Dilantin (phenytoin).	lab_test	t	2026-01-30 15:02:17.965474
1507	LAB-1503	Carbamazepine.	lab_test	t	2026-01-30 15:02:17.965474
1508	LAB-1504	Valproic acid.	lab_test	t	2026-01-30 15:02:17.965474
1509	LAB-1505	Feritin.	lab_test	t	2026-01-30 15:02:17.965474
1510	LAB-1506	Blood gas analysis	lab_test	t	2026-01-30 15:02:17.965474
1511	LAB-1507	Blood gas analysis with electrolytes	lab_test	t	2026-01-30 15:02:17.965474
1512	LAB-1508	Urine pregnancy test	lab_test	t	2026-01-30 15:02:17.965474
1513	LAB-1509	Tests for Antiphospholipid antibodies syndrome.	lab_test	t	2026-01-30 15:02:17.965474
1514	LAB-1510	Hb A1 C	lab_test	t	2026-01-30 15:02:17.965474
1515	LAB-1511	Hb Electrophoresis/ Hb HPLC	lab_test	t	2026-01-30 15:02:17.965474
1516	LAB-1512	Kidney Function Test.	lab_test	t	2026-01-30 15:02:17.965474
1517	LAB-1513	Liver Function Test.	lab_test	t	2026-01-30 15:02:17.965474
1518	LAB-1514	Lipid Profile.( Total cholesterolLDLHDLtreigylcerides)	lab_test	t	2026-01-30 15:02:17.965474
1520	LAB-1516	Total Iron Binding Capacity	lab_test	t	2026-01-30 15:02:17.965474
1521	LAB-1517	Serum Ferritin	lab_test	t	2026-01-30 15:02:17.965474
1522	LAB-1518	Vitamin B12 assay.	lab_test	t	2026-01-30 15:02:17.965474
1523	LAB-1519	Folic Acid assay.	lab_test	t	2026-01-30 15:02:17.965474
1524	LAB-1520	Extended Lipid Profile.( Total cholesterolLDLHDLtreigylceridesApo A1Apo\r\nBLp(a) )	lab_test	t	2026-01-30 15:02:17.965474
1525	LAB-1521	Apo A1.	lab_test	t	2026-01-30 15:02:17.965474
1526	LAB-1522	Apo B.	lab_test	t	2026-01-30 15:02:17.965474
1527	LAB-1523	Lp (a).	lab_test	t	2026-01-30 15:02:17.965474
1528	LAB-1524	CD 34 and 8 counts	lab_test	t	2026-01-30 15:02:17.965474
1529	LAB-1525	CD 34 and 8 percentage	lab_test	t	2026-01-30 15:02:17.965474
1530	LAB-1526	LDL.	lab_test	t	2026-01-30 15:02:17.965474
1531	LAB-1527	Homocysteine.	lab_test	t	2026-01-30 15:02:17.965474
1532	LAB-1528	HB Electrophoresis.	lab_test	t	2026-01-30 15:02:17.965474
1533	LAB-1529	Serum Electrophoresis.	lab_test	t	2026-01-30 15:02:17.965474
1534	LAB-1530	Fibrinogen.	lab_test	t	2026-01-30 15:02:17.965474
1535	LAB-1531	Chloride.	lab_test	t	2026-01-30 15:02:17.965474
1536	LAB-1532	Magnesium.	lab_test	t	2026-01-30 15:02:17.965474
1537	LAB-1533	GGTP.	lab_test	t	2026-01-30 15:02:17.965474
1538	LAB-1534	Lipase.	lab_test	t	2026-01-30 15:02:17.965474
1539	LAB-1535	Fructosamine.	lab_test	t	2026-01-30 15:02:17.965474
1540	LAB-1536	Î²2 microglobulin	lab_test	t	2026-01-30 15:02:17.965474
1541	LAB-1537	Catecholamines.	lab_test	t	2026-01-30 15:02:17.965474
1542	LAB-1538	Creatinine clearance.	lab_test	t	2026-01-30 15:02:17.965474
1543	LAB-1539	PSA- Total.	lab_test	t	2026-01-30 15:02:17.965474
1544	LAB-1540	PSA- Free.	lab_test	t	2026-01-30 15:02:17.965474
1545	LAB-1541	AFP.	lab_test	t	2026-01-30 15:02:17.965474
1546	LAB-1542	HCG.	lab_test	t	2026-01-30 15:02:17.965474
1547	LAB-1543	CA. 125.	lab_test	t	2026-01-30 15:02:17.965474
1548	LAB-1544	CA 199.	lab_test	t	2026-01-30 15:02:17.965474
1549	LAB-1545	CA 15.3.	lab_test	t	2026-01-30 15:02:17.965474
1550	LAB-1546	Vinyl Mandelic Acid	lab_test	t	2026-01-30 15:02:17.965474
1551	LAB-1547	Calcitonin	lab_test	t	2026-01-30 15:02:17.965474
1552	LAB-1548	Carcioembryonic antigen(CEA)	lab_test	t	2026-01-30 15:02:17.965474
1553	LAB-1549	Immunofluorescence	lab_test	t	2026-01-30 15:02:17.965474
1554	LAB-1550	Direct(Skin and kidney Disease)	lab_test	t	2026-01-30 15:02:17.965474
1555	LAB-1551	Indirect (antids DNA Anti Smith ANCA)	lab_test	t	2026-01-30 15:02:17.965474
1556	LAB-1552	VitD3 assay	lab_test	t	2026-01-30 15:02:17.965474
1557	LAB-1553	Serum Protein electrophoresis with immunofixationelectrophoresis (IFE)	lab_test	t	2026-01-30 15:02:17.965474
1558	LAB-1554	BETA-2 Microglobulin assay	lab_test	t	2026-01-30 15:02:17.965474
1559	LAB-1555	Anti cycliocitrullinated peptide (Anti CCP)	lab_test	t	2026-01-30 15:02:17.965474
1560	LAB-1556	Anti tissuetransglutaminase antibody	lab_test	t	2026-01-30 15:02:17.965474
1561	LAB-1557	Serum Erythropoetin	lab_test	t	2026-01-30 15:02:17.965474
1562	LAB-1558	ACTH	lab_test	t	2026-01-30 15:02:17.965474
1563	LAB-1559	T3 T4 TSH	lab_test	t	2026-01-30 15:02:17.965474
1564	SCA-1560	T3	scan	t	2026-01-30 15:02:17.965474
1565	SCA-1561	T4	scan	t	2026-01-30 15:02:17.965474
1566	SCA-1562	TSH	scan	t	2026-01-30 15:02:17.965474
1567	SCA-1563	LH	scan	t	2026-01-30 15:02:17.965474
1568	SCA-1564	FSH	scan	t	2026-01-30 15:02:17.965474
1569	SCA-1565	Prolactin	scan	t	2026-01-30 15:02:17.965474
1570	SCA-1566	Cortisol	scan	t	2026-01-30 15:02:17.965474
1571	SCA-1567	PTH(Paratharmone)	scan	t	2026-01-30 15:02:17.965474
1572	SCA-1568	C-Peptide.	scan	t	2026-01-30 15:02:17.965474
1573	SCA-1569	Insulin.	scan	t	2026-01-30 15:02:17.965474
1574	SCA-1570	Progesterone.	scan	t	2026-01-30 15:02:17.965474
1575	SCA-1571	17-DH Progesterone.	scan	t	2026-01-30 15:02:17.965474
1576	SCA-1572	DHEAS.	scan	t	2026-01-30 15:02:17.965474
1577	SCA-1573	Androstendione.	scan	t	2026-01-30 15:02:17.965474
1578	SCA-1574	Growth Hormone.	scan	t	2026-01-30 15:02:17.965474
1579	SCA-1575	TPO.	scan	t	2026-01-30 15:02:17.965474
1580	SCA-1576	Throglobulin.	scan	t	2026-01-30 15:02:17.965474
1581	SCA-1577	Hydatic Serology.	scan	t	2026-01-30 15:02:17.965474
1582	SCA-1578	Anti Sperm Antibodies.	scan	t	2026-01-30 15:02:17.965474
1583	SCA-1579	Qualitative.	scan	t	2026-01-30 15:02:17.965474
1584	SCA-1580	Quantitative.	scan	t	2026-01-30 15:02:17.965474
1585	SCA-1581	Qualitative.	scan	t	2026-01-30 15:02:17.965474
1586	SCA-1582	HPV serology	scan	t	2026-01-30 15:02:17.965474
1587	SCA-1583	Rota Virus serology	scan	t	2026-01-30 15:02:17.965474
1588	SCA-1584	PCR for TB	scan	t	2026-01-30 15:02:17.965474
1589	SCA-1585	PCR for HIV	scan	t	2026-01-30 15:02:17.965474
1590	SCA-1586	Chlamydae antigen	scan	t	2026-01-30 15:02:17.965474
1591	SCA-1587	chlamydae antibody	scan	t	2026-01-30 15:02:17.965474
1592	SCA-1588	Brucella serology	scan	t	2026-01-30 15:02:17.965474
1593	SCA-1589	Influenza A serology	scan	t	2026-01-30 15:02:17.965474
1594	SCA-1590	USG for Obstetrics - Anomalies scan	scan	t	2026-01-30 15:02:17.965474
1595	SCA-1591	Abdomen USG	scan	t	2026-01-30 15:02:17.965474
1596	SCA-1592	Pelvic USG ( prostate gynae infertility etc)	scan	t	2026-01-30 15:02:17.965474
1597	SCA-1593	Small parts USG ( scrotum thyroid parathyroid etc)	scan	t	2026-01-30 15:02:17.965474
1598	SCA-1594	Neonatal head (Tranfontanellar)	scan	t	2026-01-30 15:02:17.965474
1599	SCA-1595	Neonatal spine	scan	t	2026-01-30 15:02:17.965474
1600	SCA-1596	Contrast enhanced USG	scan	t	2026-01-30 15:02:17.965474
1601	SCA-1597	USG Breast	scan	t	2026-01-30 15:02:17.965474
1602	SCA-1598	USG Hystero-Salpaingography (HSG)	scan	t	2026-01-30 15:02:17.965474
1603	SCA-1599	Carotid Doppler	scan	t	2026-01-30 15:02:17.965474
1604	SCA-1600	Arterial Colour Doppler	scan	t	2026-01-30 15:02:17.965474
1605	SCA-1601	Venous Colour Doppler	scan	t	2026-01-30 15:02:17.965474
1606	SCA-1602	Colour Doppler renal arteries / any other organ	scan	t	2026-01-30 15:02:17.965474
1607	SCA-1603	USG guided intervention- FNAC	scan	t	2026-01-30 15:02:17.965474
1608	SCA-1604	USG guided intervention - biopsy	scan	t	2026-01-30 15:02:17.965474
1609	SCA-1605	USG guided intervention - nephrostomy	scan	t	2026-01-30 15:02:17.965474
1610	SCA-1606	Abdomen AP Supine or Erect (One film)	scan	t	2026-01-30 15:02:17.965474
1611	SCA-1607	Abdomen Lateral view (one film)	scan	t	2026-01-30 15:02:17.965474
1612	SCA-1608	Chest PA view (one film)	scan	t	2026-01-30 15:02:17.965474
1613	SCA-1609	Chest Lateral (one film)	scan	t	2026-01-30 15:02:17.965474
1614	SCA-1610	Mastoids: Towne view oblique views (3 films)	scan	t	2026-01-30 15:02:17.965474
1615	SCA-1611	Extremities bones & Joints AP & Lateral views (Two films)	scan	t	2026-01-30 15:02:17.965474
1616	SCA-1612	Pelvis A.P (one film)	scan	t	2026-01-30 15:02:17.965474
1617	SCA-1613	T. M. Joints (one film)	scan	t	2026-01-30 15:02:17.965474
1618	SCA-1614	Abdomen & Pelvis for K. U. B.	scan	t	2026-01-30 15:02:17.965474
1619	SCA-1615	Skull A. P. & Lateral (2 films)	scan	t	2026-01-30 15:02:17.965474
1620	SCA-1616	Spine A. P. & Lateral (2 films)	scan	t	2026-01-30 15:02:17.965474
1621	SCA-1617	PNS view (1 film)	scan	t	2026-01-30 15:02:17.965474
1622	SCA-1618	Barium Swallow	scan	t	2026-01-30 15:02:17.965474
1623	SCA-1619	Barium Upper GI study	scan	t	2026-01-30 15:02:17.965474
1624	SCA-1620	Barium Upper GI study (Double contrast)	scan	t	2026-01-30 15:02:17.965474
1625	SCA-1621	Barium Meal follow through	scan	t	2026-01-30 15:02:17.965474
1626	SCA-1622	Barium Enema (Single contrast/double contrast)	scan	t	2026-01-30 15:02:17.965474
1627	SCA-1623	Small bowel enteroclysis	scan	t	2026-01-30 15:02:17.965474
1628	SCA-1624	ERCP (Endoscopic Retrograde Cholangio â€“ Pancreatography)	scan	t	2026-01-30 15:02:17.965474
1629	SCA-1625	General :Fistulography /Sinography/Sialography/Dacrocystography/ T-Tube\r\ncholangiogram/Nephrostogram	scan	t	2026-01-30 15:02:17.965474
1630	SCA-1626	Percutaneous transhepatic cholangiography (PTC)	scan	t	2026-01-30 15:02:17.965474
1631	SCA-1627	Intravenous Pyelography (IVP)	scan	t	2026-01-30 15:02:17.965474
1632	SCA-1628	Micturating Cystourethrography (MCU)	scan	t	2026-01-30 15:02:17.965474
1633	SCA-1629	Retrograde Urethrography (RGU)	scan	t	2026-01-30 15:02:17.965474
1634	SCA-1630	Contrast Hystero-Salpingography (HSG)	scan	t	2026-01-30 15:02:17.965474
1635	SCA-1631	X ray - Arthrography	scan	t	2026-01-30 15:02:17.965474
1636	SCA-1632	Cephalography	scan	t	2026-01-30 15:02:17.965474
1637	SCA-1633	Myelography	scan	t	2026-01-30 15:02:17.965474
1638	SCA-1634	Diagnostic Digital Subtraction Angiography (DSA)	scan	t	2026-01-30 15:02:17.965474
1639	SCA-1635	X-ray Mammography	scan	t	2026-01-30 15:02:17.965474
1640	SCA-1636	MRI Mammography	scan	t	2026-01-30 15:02:17.965474
1641	SCA-1637	CT Head-Without Contrast (NCCT Head)	scan	t	2026-01-30 15:02:17.965474
1642	SCA-1638	CT Head- with Contrast (+ CT angiography)	scan	t	2026-01-30 15:02:17.965474
1643	SCA-1639	C. T. Chest - without contrast (for lungs)	scan	t	2026-01-30 15:02:17.965474
1644	SCA-1640	C. T. Scan Lower Abdomen(incl. Pelvis) With Contrast	scan	t	2026-01-30 15:02:17.965474
1645	SCA-1641	C. T. Scan Lower Abdomen( Incl. Pelvis) Without Contrast	scan	t	2026-01-30 15:02:17.965474
1646	SCA-1642	C. T. Scan Whole Abdomen Without Contrast	scan	t	2026-01-30 15:02:17.965474
1647	SCA-1643	C. T. Scan Whole Abdomen With Contrast	scan	t	2026-01-30 15:02:17.965474
1648	SCA-1644	Triple Phase CT abdomen	scan	t	2026-01-30 15:02:17.965474
1649	SCA-1645	CT angiography abdomen/ Chest	scan	t	2026-01-30 15:02:17.965474
1650	SCA-1646	CT Enteroclysis	scan	t	2026-01-30 15:02:17.965474
1651	SCA-1647	C. T. Scan Neck â€“ Without Contrast	scan	t	2026-01-30 15:02:17.965474
1652	SCA-1648	C. T. Scan Neck â€“ With Contrast	scan	t	2026-01-30 15:02:17.965474
1653	SCA-1649	C. T. Scan Orbits - Without Contrast	scan	t	2026-01-30 15:02:17.965474
1654	SCA-1650	C. T. Scan Orbits - With Contrast	scan	t	2026-01-30 15:02:17.965474
1655	SCA-1651	C. T. Scan of Para Nasal Sinuses- Without Contrast	scan	t	2026-01-30 15:02:17.965474
1656	SCA-1652	C. T. Scan of Para Nasal Sinuses - With Contrast	scan	t	2026-01-30 15:02:17.965474
1657	SCA-1653	C. T. Spine (Cervical Dorsal Lumbar Sacral)â€“without contrast	scan	t	2026-01-30 15:02:17.965474
1658	SCA-1654	CT Temporal bone â€“ without contrast	scan	t	2026-01-30 15:02:17.965474
1659	SCA-1655	CT - Dental	scan	t	2026-01-30 15:02:17.965474
1660	SCA-1656	C. T. Scan Limbs -Without Contrast	scan	t	2026-01-30 15:02:17.965474
1661	SCA-1657	C. T. Scan Limbs -With Contrast including CT angiography	scan	t	2026-01-30 15:02:17.965474
1662	SCA-1658	C.T. Guided intervention â€“FNAC	scan	t	2026-01-30 15:02:17.965474
1663	SCA-1659	C.T. Guided Trucut Biopsy	scan	t	2026-01-30 15:02:17.965474
1664	SCA-1660	C. T. Guided intervention -percutaneous catheter drainage / tube placement	scan	t	2026-01-30 15:02:17.965474
1665	SCA-1661	MRI Head â€“ Without Contrast	scan	t	2026-01-30 15:02:17.965474
1666	SCA-1662	MRI Head â€“ With Contrast	scan	t	2026-01-30 15:02:17.965474
1667	SCA-1663	MRI Orbits â€“ Without Contrast	scan	t	2026-01-30 15:02:17.965474
1668	SCA-1664	MRI Orbits â€“ With Contrast	scan	t	2026-01-30 15:02:17.965474
1669	SCA-1665	MRI Nasopharynx and PNS â€“ Without Contrast	scan	t	2026-01-30 15:02:17.965474
1670	SCA-1666	MRI Nasopharynx and PNS â€“ With Contrast	scan	t	2026-01-30 15:02:17.965474
1671	SCA-1667	MR for Salivary Glands with Sialography	scan	t	2026-01-30 15:02:17.965474
1672	SCA-1668	MRI Neck - Without Contrast	scan	t	2026-01-30 15:02:17.965474
1673	SCA-1669	MRI Neck- with contrast	scan	t	2026-01-30 15:02:17.965474
1674	SCA-1670	MRI Shoulder â€“ Without contrast	scan	t	2026-01-30 15:02:17.965474
1675	SCA-1671	MRI Shoulder â€“ With conntrast	scan	t	2026-01-30 15:02:17.965474
1676	SCA-1672	MRI shoulder both Joints - Without contrast	scan	t	2026-01-30 15:02:17.965474
1677	SCA-1673	MRI Shoulder both joints â€“ With contrast	scan	t	2026-01-30 15:02:17.965474
1678	SCA-1674	MRI Wrist Single joint - Without contrast	scan	t	2026-01-30 15:02:17.965474
1679	SCA-1675	MRI Wrist Single joint - With contrast	scan	t	2026-01-30 15:02:17.965474
1680	SCA-1676	MRI Wrist both joints - Without contrast	scan	t	2026-01-30 15:02:17.965474
1681	SCA-1677	MRI Wrist Both joints - With contrast	scan	t	2026-01-30 15:02:17.965474
1682	SCA-1678	MRI knee Single joint - Without contrast	scan	t	2026-01-30 15:02:17.965474
1683	SCA-1679	MRI knee Single joint - With contrast	scan	t	2026-01-30 15:02:17.965474
1684	SCA-1680	MRI knee both joints - Without contrast	scan	t	2026-01-30 15:02:17.965474
1685	SCA-1681	MRI knee both joints - With contrast	scan	t	2026-01-30 15:02:17.965474
1686	SCA-1682	MRI Ankle Single joint - Without contrast	scan	t	2026-01-30 15:02:17.965474
1687	SCA-1683	MRI Ankle single joint - With contrast	scan	t	2026-01-30 15:02:17.965474
1688	SCA-1684	MRI Ankle both joints - With contrast	scan	t	2026-01-30 15:02:17.965474
1689	SCA-1685	MRI Ankle both joints - Without contrast	scan	t	2026-01-30 15:02:17.965474
1690	SCA-1686	MRI Hip - With contrast	scan	t	2026-01-30 15:02:17.965474
1691	SCA-1687	MRI Hip â€“ without contrast	scan	t	2026-01-30 15:02:17.965474
1692	SCA-1688	MRI Pelvis â€“ Without Contrast	scan	t	2026-01-30 15:02:17.965474
1693	SCA-1689	MRI Pelvis â€“ with contrast	scan	t	2026-01-30 15:02:17.965474
1694	SCA-1690	MRI Extremities - With contrast	scan	t	2026-01-30 15:02:17.965474
1695	SCA-1691	MRI Extremities - Without contrast	scan	t	2026-01-30 15:02:17.965474
1696	SCA-1692	MRI Temporomandibular â€“ B/L - With contrast	scan	t	2026-01-30 15:02:17.965474
1697	SCA-1693	MRI Temporomandibular â€“ B/L - Without contrast	scan	t	2026-01-30 15:02:17.965474
1698	SCA-1694	MR Temporal Bone/ Inner ear with contrast	scan	t	2026-01-30 15:02:17.965474
1699	SCA-1695	MR Temporal Bone/ Inner ear without contrast	scan	t	2026-01-30 15:02:17.965474
1700	SCA-1696	MRI Abdomen â€“ Without Contrast	scan	t	2026-01-30 15:02:17.965474
1701	SCA-1697	MRI Abdomen â€“ With Contrast	scan	t	2026-01-30 15:02:17.965474
1702	SCA-1698	MRI Breast - With Contrast	scan	t	2026-01-30 15:02:17.965474
1703	SCA-1699	MRI Breast - Without Contrast	scan	t	2026-01-30 15:02:17.965474
1704	SCA-1700	MRI Spine Screening - Without Contrast	scan	t	2026-01-30 15:02:17.965474
1705	SCA-1701	MRI Chest â€“ Without Contrast	scan	t	2026-01-30 15:02:17.965474
1706	SCA-1702	MRI Chest â€“ With Contrast	scan	t	2026-01-30 15:02:17.965474
1707	SCA-1703	MRI Cervical/Cervico Dorsal Spine â€“ Without Contrast	scan	t	2026-01-30 15:02:17.965474
1708	SCA-1704	MRI Cervical/ Cervico Dorsal Spine â€“ With Contrast	scan	t	2026-01-30 15:02:17.965474
1709	SCA-1705	MRI Dorsal/ Dorso Lumbar Spine - Without Contrast	scan	t	2026-01-30 15:02:17.965474
1710	SCA-1706	MRI Dorsal/ Dorso Lumbar Spine â€“ With Contrast	scan	t	2026-01-30 15:02:17.965474
1711	SCA-1707	MRI Lumbar/ Lumbo-Sacral Spine â€“ Without Contrast	scan	t	2026-01-30 15:02:17.965474
1712	SCA-1708	MRI Lumbar/ Lumbo-Sacral Spine â€“ With Contrast	scan	t	2026-01-30 15:02:17.965474
1713	SCA-1709	Whole body MRI (For oncological workup)	scan	t	2026-01-30 15:02:17.965474
1714	SCA-1710	MR cholecysto-pancreatography.	scan	t	2026-01-30 15:02:17.965474
1715	SCA-1711	MRI Angiography - with contrast	scan	t	2026-01-30 15:02:17.965474
1716	SCA-1712	MR Enteroclysis	scan	t	2026-01-30 15:02:17.965474
1717	SCA-1713	Dexa Scan Bone Densitometry - Two sites	scan	t	2026-01-30 15:02:17.965474
1718	SCA-1714	Dexa Scan Bone Densitometry - Three sites (Spine Hip & extremity)	scan	t	2026-01-30 15:02:17.965474
1719	SCA-1715	Dexa Scan Bone Densitometry Whole body	scan	t	2026-01-30 15:02:17.965474
1720	SCA-1716	EEG/Video EEG	scan	t	2026-01-30 15:02:17.965474
1721	SCA-1717	EMG (Electro myography)	scan	t	2026-01-30 15:02:17.965474
1722	SCA-1718	Nerve condition velocity (at least 2 limbs)	scan	t	2026-01-30 15:02:17.965474
1723	SCA-1719	Decremental response (before and after neo stigmine)	scan	t	2026-01-30 15:02:17.965474
1724	SCA-1720	Incremental response	scan	t	2026-01-30 15:02:17.965474
1725	SCA-1721	SSEP (Somato sensory evoked potentials)	scan	t	2026-01-30 15:02:17.965474
1726	SCA-1722	Poly somnography	scan	t	2026-01-30 15:02:17.965474
1727	SCA-1723	Brachial plexus study	scan	t	2026-01-30 15:02:17.965474
1728	SCA-1724	Muscle biopsy	scan	t	2026-01-30 15:02:17.965474
1729	SCA-1725	ACHR anti body titre	scan	t	2026-01-30 15:02:17.965474
1730	SCA-1726	Anti MUSK body titre	scan	t	2026-01-30 15:02:17.965474
1731	SCA-1727	Serum COPPER	scan	t	2026-01-30 15:02:17.965474
1732	SCA-1728	Serum ceruloplasmin	scan	t	2026-01-30 15:02:17.965474
1733	SCA-1729	Urinary copper	scan	t	2026-01-30 15:02:17.965474
1734	SCA-1730	Serum homocystine	scan	t	2026-01-30 15:02:17.965474
1735	SCA-1731	Serum valproate level	scan	t	2026-01-30 15:02:17.965474
1736	SCA-1732	Serum phenol barbitone level	scan	t	2026-01-30 15:02:17.965474
1737	SCA-1733	Coagulation profile	scan	t	2026-01-30 15:02:17.965474
1738	SCA-1734	Protein C S anti thrombine â€“ III	scan	t	2026-01-30 15:02:17.965474
1739	SCA-1735	Serum lactate level	scan	t	2026-01-30 15:02:17.965474
1740	SCA-1736	Basic studies including cell count protein sugar gram stain\r\nIndia Ink preparation and smear for AFP	scan	t	2026-01-30 15:02:17.965474
1741	SCA-1737	Special studies	scan	t	2026-01-30 15:02:17.965474
1742	SCA-1738	PCR for tuberculosis/ Herpes simplex	scan	t	2026-01-30 15:02:17.965474
1743	SCA-1739	Bacterial culture and sensitivity	scan	t	2026-01-30 15:02:17.965474
1744	SCA-1740	Mycobacterial culture and sensitivity	scan	t	2026-01-30 15:02:17.965474
1745	SCA-1741	Fungal culture	scan	t	2026-01-30 15:02:17.965474
1746	SCA-1742	Malignant cells	scan	t	2026-01-30 15:02:17.965474
1747	SCA-1743	Anti measles antibody titre (with serum antibody titre)	scan	t	2026-01-30 15:02:17.965474
1748	SCA-1744	Viral culture	scan	t	2026-01-30 15:02:17.965474
1749	SCA-1745	Antibody titre (Herpes simplex cytomegalo virus flavivirus zoster varicella\r\nvirus)	scan	t	2026-01-30 15:02:17.965474
1750	SCA-1746	Oligoclonal band	scan	t	2026-01-30 15:02:17.965474
1751	SCA-1747	Myelin Basic protein	scan	t	2026-01-30 15:02:17.965474
1752	SCA-1748	Lactate	scan	t	2026-01-30 15:02:17.965474
1753	SCA-1749	Crypto coccal antigen	scan	t	2026-01-30 15:02:17.965474
1754	SCA-1750	D-xylase test	scan	t	2026-01-30 15:02:17.965474
1755	SCA-1751	Fecal fat test/ fecal chymotrypsin/ fecal elastase	scan	t	2026-01-30 15:02:17.965474
1756	SCA-1752	Breath tests	scan	t	2026-01-30 15:02:17.965474
1757	SCA-1753	H pylori serology for ciliac disease	scan	t	2026-01-30 15:02:17.965474
1758	SCA-1754	HBV genotyping	scan	t	2026-01-30 15:02:17.965474
1759	SCA-1755	HCV genotyping	scan	t	2026-01-30 15:02:17.965474
1760	SCA-1756	Urinary VMA	scan	t	2026-01-30 15:02:17.965474
1761	SCA-1757	Urinary metanephrine/Normetanephrine	scan	t	2026-01-30 15:02:17.965474
1762	SCA-1758	Urinary free catecholamine	scan	t	2026-01-30 15:02:17.965474
1763	SCA-1759	Serum catecholamine	scan	t	2026-01-30 15:02:17.965474
1764	SCA-1760	Serum aldosterone	scan	t	2026-01-30 15:02:17.965474
1765	SCA-1761	24 Hr urinary aldosterone	scan	t	2026-01-30 15:02:17.965474
1766	SCA-1762	Plasma renin activity	scan	t	2026-01-30 15:02:17.965474
1767	SCA-1763	Serum aldosterone/renin ratio	scan	t	2026-01-30 15:02:17.965474
1768	SCA-1764	Osmolality urine	scan	t	2026-01-30 15:02:17.965474
1769	SCA-1765	Osmolality serum	scan	t	2026-01-30 15:02:17.965474
1770	SCA-1766	Urinary sodium	scan	t	2026-01-30 15:02:17.965474
1771	SCA-1767	Urinary Chloride	scan	t	2026-01-30 15:02:17.965474
1772	SCA-1768	Urinary potassium	scan	t	2026-01-30 15:02:17.965474
1773	SCA-1769	Urinary calcium	scan	t	2026-01-30 15:02:17.965474
1774	SCA-1770	Thyroid binding globulin	scan	t	2026-01-30 15:02:17.965474
1775	SCA-1771	24 hr. urinary free cotisole	scan	t	2026-01-30 15:02:17.965474
1776	SCA-1772	Islet cell antebody	scan	t	2026-01-30 15:02:17.965474
1777	SCA-1773	GAD antibody	scan	t	2026-01-30 15:02:17.965474
1778	SCA-1774	Insulin associated antibody	scan	t	2026-01-30 15:02:17.965474
1779	SCA-1775	IGF-1	scan	t	2026-01-30 15:02:17.965474
1780	SCA-1776	IGF-BP3	scan	t	2026-01-30 15:02:17.965474
1781	SCA-1777	Sex hormone binding globulin	scan	t	2026-01-30 15:02:17.965474
1782	SCA-1778	USG guided FNAC thyroid gland	scan	t	2026-01-30 15:02:17.965474
1783	SCA-1779	E2	scan	t	2026-01-30 15:02:17.965474
1784	SCA-1780	Thyro globulin antibody	scan	t	2026-01-30 15:02:17.965474
1785	SCA-1781	Kappa Lambda Light Chains, Free, Serum/ Serum freelight chains (SFLC)	scan	t	2026-01-30 15:02:17.965474
1786	SCA-1782	Serum IGE Level	scan	t	2026-01-30 15:02:17.965474
1787	SCA-1783	NT-Pro BNP	scan	t	2026-01-30 15:02:17.965474
1788	SCA-1784	CECT Chest	scan	t	2026-01-30 15:02:17.965474
1789	SCA-1785	MRI-Prostate (Multi-parametric) ( Including CD)	scan	t	2026-01-30 15:02:17.965474
1790	SCA-1786	HCV RNA Quantitative	scan	t	2026-01-30 15:02:17.965474
1791	SCA-1787	Tarcolimus	scan	t	2026-01-30 15:02:17.965474
1792	SCA-1788	Protein Creatinine Ratio, Urine	scan	t	2026-01-30 15:02:17.965474
1793	SCA-1789	Fibroscan Liver	scan	t	2026-01-30 15:02:17.965474
1794	SCA-1790	HLA B27 (PCR)	scan	t	2026-01-30 15:02:17.965474
1795	SCA-1791	Mantoux Test	scan	t	2026-01-30 15:02:17.965474
1796	SCA-1792	Procalcitonin	scan	t	2026-01-30 15:02:17.965474
1797	SCA-1793	TORCH Test	scan	t	2026-01-30 15:02:17.965474
1798	SCA-1794	Intracoronary optical coherence tomography (OCT) / Intravascular optical\r\ncoherence tomography (IVOCT) /Intravascular Ventricular Assist System	scan	t	2026-01-30 15:02:17.965474
1799	SCA-1795	Fractional Flow Reserve (FFR) (inclusive of cost of\r\nwire)	scan	t	2026-01-30 15:02:17.965474
1800	SCA-1796	Anti -Smooth Muscle Antibody Test (ASMA)	scan	t	2026-01-30 15:02:17.965474
1801	SCA-1797	C ANCA-IFA	scan	t	2026-01-30 15:02:17.965474
1802	SCA-1798	P ANCA-IFA	scan	t	2026-01-30 15:02:17.965474
1803	SCA-1799	Angiotensin converting enzyme (ACE)	scan	t	2026-01-30 15:02:17.965474
1804	SCA-1800	Endo bronchial Ultrasound (EBUS) -Trans bronchial needle aspiration\r\n(TBNA) -Using New Needle	scan	t	2026-01-30 15:02:17.965474
1805	SCA-1801	Extractable Nuclear Antigens (ENA) - Quantitative	scan	t	2026-01-30 15:02:17.965474
1806	SCA-1802	Chromogranin A	scan	t	2026-01-30 15:02:17.965474
1807	SCA-1803	Faecal calprotectin (fecal calprotectin)	scan	t	2026-01-30 15:02:17.965474
1808	SCA-1804	C3-COMPLEMENT	scan	t	2026-01-30 15:02:17.965474
1809	SCA-1805	C4-COMPLEMENT	scan	t	2026-01-30 15:02:17.965474
1810	SCA-1806	Genexpert Test	scan	t	2026-01-30 15:02:17.965474
1811	SCA-1807	DJ stent removal	scan	t	2026-01-30 15:02:17.965474
1812	SCA-1808	Pulmonary Function Test (PFT) / (Spirometry with DLCO)	scan	t	2026-01-30 15:02:17.965474
1813	SCA-1809	EUS (Endoscopic Ultrasound) guided FNAC (Using with Needle)	scan	t	2026-01-30 15:02:17.965474
1814	SCA-1810	CT Urography	scan	t	2026-01-30 15:02:17.965474
1815	SCA-1811	Video Laryngoscopy	scan	t	2026-01-30 15:02:17.965474
1816	SCA-1812	CT Angio-Neck Vessels	scan	t	2026-01-30 15:02:17.965474
1817	SCA-1813	H1N1 (RT-PCR)	scan	t	2026-01-30 15:02:17.965474
1818	SCA-1814	Erythropoietin Level (Select CGHS rate code 1557 for approved rate)	scan	t	2026-01-30 15:02:17.965474
1819	SCA-1815	Anti HEV IgM	scan	t	2026-01-30 15:02:17.965474
1820	SCA-1816	Anti HAV IgM	scan	t	2026-01-30 15:02:17.965474
1821	SCA-1817	HBsAg Quantitative	scan	t	2026-01-30 15:02:17.965474
1822	SCA-1818	Typhidot IgM	scan	t	2026-01-30 15:02:17.965474
1823	SCA-1819	Hepatitis B Core Antibody (HBcAb) Level (Hepatitis B Core IgM Antibody)	scan	t	2026-01-30 15:02:17.965474
1824	SCA-1820	Anti HBs	scan	t	2026-01-30 15:02:17.965474
1825	SCA-1821	Free Triiodothyronine (FT3)	scan	t	2026-01-30 15:02:17.965474
1826	SCA-1822	Free Thyroxine (FT4)	scan	t	2026-01-30 15:02:17.965474
1827	SCA-1823	Widal Test	scan	t	2026-01-30 15:02:17.965474
1828	SCA-1824	Dengue Serology	scan	t	2026-01-30 15:02:17.965474
1829	SCA-1825	Blood component charges - Whole Blood per Unit	scan	t	2026-01-30 15:02:17.965474
1830	SCA-1826	Blood component charges - Packed Red Cell per Unit	scan	t	2026-01-30 15:02:17.965474
1831	SCA-1827	Blood component charges - Fresh Frozen Plasma	scan	t	2026-01-30 15:02:17.965474
1832	SCA-1828	Platelet Concentrate- Random Donor Platelet (RDP)	scan	t	2026-01-30 15:02:17.965474
1833	SCA-1829	Blood component charges - Cryoprecipitate	scan	t	2026-01-30 15:02:17.965474
1834	SCA-1830	Platelet Concentrate - Single Donor Platelet (SDP)-Apheresis per unit	scan	t	2026-01-30 15:02:17.965474
1835	SCA-1831	CCS Group A Officer of above 40 years of age -Male, Annual Health Check\r\nup	scan	t	2026-01-30 15:02:17.965474
1836	SCA-1832	CCS Group A Officer of above 40 years of age -female, Annual Health\r\nCheck up	scan	t	2026-01-30 15:02:17.965474
1837	CAN-1833	Interleukin 6 (IL 6)	can_procedure	t	2026-01-30 15:02:17.965474
1838	CAN-1834	High resolution computed Tomography (HRCT Chest)	can_procedure	t	2026-01-30 15:02:17.965474
1839	CAN-1835	Fluid air exchange (per eye)	can_procedure	t	2026-01-30 15:02:17.965474
1840	CAN-1836	C3F8 GAS Injection (per eye)	can_procedure	t	2026-01-30 15:02:17.965474
1841	CAN-1837	Diurnal variation of IOP (per eye)	can_procedure	t	2026-01-30 15:02:17.965474
1842	CAN-1838	Silicone oil injection (per eye)	can_procedure	t	2026-01-30 15:02:17.965474
1843	CAN-1839	Epiretinal Membrane (ERM) Peeling (per eye)	can_procedure	t	2026-01-30 15:02:17.965474
1844	CAN-1840	Epiretinal Membrane (ERM) Removal (per eye)	can_procedure	t	2026-01-30 15:02:17.965474
1845	CAN-1841	Internal limiting membrane (ILM) peeling (per eye)	can_procedure	t	2026-01-30 15:02:17.965474
1846	CAN-1842	Punctoplasty (per eye)	can_procedure	t	2026-01-30 15:02:17.965474
1847	CAN-1843	Punctal plug(Collagen/silicone) (per eye)	can_procedure	t	2026-01-30 15:02:17.965474
1848	CAN-1844	Laser Trabeculoplasty Gonioplasty (both eyes)	can_procedure	t	2026-01-30 15:02:17.965474
1849	CAN-1845	Eye laser pulse therapy (per eye)	can_procedure	t	2026-01-30 15:02:17.965474
1850	CAN-1846	Glaucoma valve/Glaucoma Ahmed valve	can_procedure	t	2026-01-30 15:02:17.965474
1851	CAN-1847	Malyugin Ring	can_procedure	t	2026-01-30 15:02:17.965474
1852	CAN-1848	Globe exploration (eye surgery)	can_procedure	t	2026-01-30 15:02:17.965474
1853	CAN-1849	Scleral Fixation Tissue glue	can_procedure	t	2026-01-30 15:02:17.965474
1854	CAN-1850	Fibro optic Nasal Endoscopy	can_procedure	t	2026-01-30 15:02:17.965474
1855	CAN-1851	Video Stroboscopy	can_procedure	t	2026-01-30 15:02:17.965474
1856	CAN-1852	Video Bronchoscopy with BAL	can_procedure	t	2026-01-30 15:02:17.965474
1857	CAN-1853	Sleep deprived EEG (Rate shall be the same CGHS rate of EEG/Video\r\nEEG) (Select CGHS rate code 1716)	can_procedure	t	2026-01-30 15:02:17.965474
\.


--
-- TOC entry 5930 (class 0 OID 20341)
-- Dependencies: 256
-- Data for Name: mlc_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mlc_entries (mlc_id, mlc_number, opd_id, patient_id, doctor_id, branch_id, police_station, police_station_district, brought_by, history_alleged, injury_description, nature_of_injury, opinion, created_at, updated_at, incident_date_time, alleged_cause, danger_to_life, age_of_injuries, treatment_given, remarks, examination_findings) FROM stdin;
1	MLC-2025-0001	41	30	19	3	jd c	gvkv	jv,ertgedr	jgvj 	loufouo	Dangerous to Life	\N	2025-12-12 11:17:50.956007	2025-12-12 12:21:58.472199	\N	\N	\N	\N	\N	\N	\N
2	MLC-2025-0002	47	35	5	5	asf	af	3453	af	asf	Simple	\N	2025-12-16 17:50:09.654731	2025-12-16 17:50:09.654731	\N	\N	\N	\N	\N	\N	\N
3	MLC-2025-0003	52	40	35	47	arekere	bangalore urban	kani	self fall	head injury and high BP	Simple	\N	2025-12-18 12:52:56.173325	2025-12-18 12:55:25.264063	2025-12-18 12:24:00		No	30 min	Dr. Satish attended and this a snormal head injury not serious	two wheeler	ECG @ diagnositcs\nABG @ diagnostics\necho\nabdominal pelives\n
4	MLC-2025-0004	53	41	5	5	police station	mdlkjf	attender1	lwekf fe 	;lkfe pkf ppiwj	Simple	\N	2025-12-22 18:00:40.415229	2025-12-22 18:00:40.415229	\N	\N	\N	\N	\N	\N	\N
5	MLC-2026-0001	61	48	38	53	Richmond	Bangalore	Will	hand fracture	slight bone crack	Simple	\N	2026-01-08 12:24:34.160112	2026-01-08 12:28:21.769638	2026-01-08 12:25:00	accident	No	30 minutes	plaster cast		fracture in right hand
6	MLC-2026-0002	86	70	39	55	Lavelle Road	Tianjin	Doe	NA	Theft	Simple	\N	2026-01-30 16:13:43.993923	2026-01-30 16:13:43.993923	\N	\N	\N	\N	\N	\N	\N
7	MLC-2026-0003	89	72	39	55	Bangalore	Karnataka	Doe	NA	Fracture	Simple	\N	2026-01-30 16:57:07.585432	2026-01-30 16:58:32.047191	2026-01-30 16:57:00	bike accident	No	1			Leg Fracure
\.


--
-- TOC entry 5932 (class 0 OID 20351)
-- Dependencies: 258
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
-- TOC entry 5934 (class 0 OID 20365)
-- Dependencies: 260
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
17	18	55	\N	\N	Permanent	\N	t	2026-01-20 12:53:40.345306	2026-01-20 12:53:40.345306
\.


--
-- TOC entry 5936 (class 0 OID 20377)
-- Dependencies: 262
-- Data for Name: nurse_shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nurse_shifts (nurse_shift_id, nurse_id, branch_id, shift_id, department_id, shift_date, attendance_status, check_in_time, check_out_time, notes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5938 (class 0 OID 20392)
-- Dependencies: 264
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
18	179	Olivia	K	NUR820453	\N	\N	\N	\N	B.Pharm	\N	1	46328648	\N	\N	\N	t	\N	2026-01-20 12:53:40.345306	2026-01-20 12:53:40.345306
\.


--
-- TOC entry 5940 (class 0 OID 20408)
-- Dependencies: 266
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
52	OPD-20251218-4275	40	47	\N	35	\N	Walk-in	2025-12-17	12:31:00	T-123	\N	BP high	{"grbs": "105", "spo2": "99", "pulse": "98", "height": "174", "weight": "98", "bp_systolic": "120", "temperature": "102", "bp_diastolic": "89"}	head injury	\N	\N	\N	f	\N	7500.00	Paid	Completed	2025-12-18 12:33:42.06894	\N	\N	143	\N	2025-12-18 12:33:42.06894	2025-12-18 13:04:23.501554	t	kani	8957485763	Self fall			Card
51	OPD-20251218-4355	39	47	\N	35	\N	Walk-in	2025-12-18	12:28:00	T-144	\N	dengue 	{"grbs": "110", "spo2": "90", "pulse": "98", "height": "159", "weight": "78", "bp_systolic": "110", "temperature": "120", "bp_diastolic": "98"}	fever\n	\N	\N	\N	f	\N	1500.00	Pending	Completed	2025-12-18 12:30:44.945461	\N	\N	143	\N	2025-12-18 12:30:44.945461	2025-12-18 12:48:52.924397	f		\N	\N	\N	\N	Cash
53	OPD-20251222-4257	41	5	\N	5	\N	Walk-in	2025-12-22	17:46:00	T-339	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	kwjdojf okjf ojf ojf ofj	\N	\N	\N	f	\N	1111.00	Pending	Completed	2025-12-22 17:47:00.888705	\N	\N	29	\N	2025-12-22 17:47:00.888705	2025-12-22 17:56:09.791213	t	attender1	8767656765	\N	\N	\N	Cash
54	OPD-20251222-3622	42	5	\N	5	\N	Walk-in	2025-12-22	18:04:00	T-260	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	kdofoo	\N	\N	\N	f	\N	1111.00	Pending	In-consultation	2025-12-22 18:05:23.182462	\N	\N	29	\N	2025-12-22 18:05:23.182462	2025-12-22 18:05:36.657413	t	wkdlkjfd j	4298548548	\N	\N	\N	Cash
55	OPD-20251223-4597	43	5	\N	5	\N	Walk-in	2025-12-23	10:39:00	T-478	\N		{"grbs": "332", "spo2": "324", "pulse": "33", "height": "178", "weight": "76", "bp_systolic": "1", "temperature": "99", "bp_diastolic": "23"}	Fever	\N	\N	\N	f	\N	1111.00	Pending	Completed	2025-12-23 10:40:28.272463	\N	\N	29	\N	2025-12-23 10:40:28.272463	2025-12-23 10:43:37.676611	f		\N	\N	\N	\N	Cash
56	OPD-20260102-5114	44	49	\N	36	\N	Appointment	2026-01-01	17:06:00	T-509	\N	jdhjhf	{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	fever	\N	\N	\N	f	\N	1000.00	Paid	Completed	2026-01-02 17:06:24.386982	\N	\N	152	\N	2026-01-02 17:06:24.386982	2026-01-02 17:45:12.664399	f						Cash
57	OPD-20260107-1845	45	52	\N	37	\N	Walk-in	2026-01-07	12:17:00	T-206	\N	cold, high temperature	{"grbs": "67", "spo2": "77", "pulse": "76", "height": "125", "weight": "88", "bp_systolic": "76", "temperature": "108", "bp_diastolic": "65"}	fever	\N	\N	\N	f	\N	500.00	Paid	Completed	2026-01-07 12:27:24.959384	\N	\N	163	\N	2026-01-07 12:27:24.959384	2026-01-07 12:40:00.599263	f		\N	\N	\N	\N	Cash
58	OPD-20260107-7012	46	52	\N	37	\N	Walk-in	2026-01-07	12:43:00	T-927	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	unconsious, blood in head	\N	\N	\N	f	\N	500.00	Pending	In-consultation	2026-01-07 12:51:21.431665	\N	\N	163	\N	2026-01-07 12:51:21.431665	2026-01-07 12:52:40.058847	t	henry	8765865657	\N	\N	\N	Cash
59	OPD-20260107-7032	45	52	\N	37	\N	Walk-in	2026-01-07	15:24:00	T-104	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	fever	\N	\N	\N	f	\N	500.00	Pending	Registered	2026-01-07 15:25:03.994121	\N	\N	163	\N	2026-01-07 15:25:03.994121	2026-01-07 15:25:03.994121	f		\N	\N	\N	\N	Cash
60	OPD-20260108-7592	47	53	\N	38	\N	Walk-in	2026-01-08	11:53:00	T-194	\N		{"grbs": "99–", "spo2": "98", "pulse": "65", "height": "176", "weight": "80", "bp_systolic": "44", "temperature": "108", "bp_diastolic": "55"}	fever	\N	\N	\N	f	\N	998.00	Pending	Registered	2026-01-08 11:54:59.702259	\N	\N	171	\N	2026-01-08 11:54:59.702259	2026-01-08 11:54:59.702259	f		\N	\N	\N	\N	Cash
62	OPD-20260108-9267	49	53	\N	38	\N	Appointment	2026-01-08	12:00:00	T-586	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	Routine Checkup	\N	\N	\N	f	\N	998.00	Pending	Registered	2026-01-08 12:01:39.018425	\N	\N	171	\N	2026-01-08 12:01:39.018425	2026-01-08 12:01:39.018425	f	\N	\N	\N	\N	\N	Cash
61	OPD-20260108-4109	48	53	\N	38	\N	Walk-in	2026-01-07	11:55:00	T-449	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	hand injury	\N	\N	\N	f	\N	2998.00	Paid	Completed	2026-01-08 11:58:46.758096	\N	\N	171	\N	2026-01-08 11:58:46.758096	2026-01-08 12:35:37.49775	t	Will	9847474848				Cash
63	OPD-20260113-9141	50	2	\N	4	\N	Walk-in	2026-01-13	12:51:00	T-488	\N	Skin tags	{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	Skin Concerns	\N	\N	\N	f	\N	300.00	Paid	Registered	2026-01-13 12:58:02.099184	\N	\N	24	\N	2026-01-13 12:58:02.099184	2026-01-13 12:58:02.099184	f		\N	\N	\N	\N	Cash
64	OPD-20260113-1809	50	2	\N	4	\N	Walk-in	2026-01-13	13:03:00	T-915	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	Skin Concern	\N	\N	\N	f	\N	300.00	Pending	Registered	2026-01-13 13:04:44.133114	\N	\N	24	\N	2026-01-13 13:04:44.133114	2026-01-13 13:04:44.133114	f		\N	\N	\N	\N	Cash
65	OPD-20260113-6762	51	2	\N	4	\N	Emergency	2026-01-13	14:29:00	T-651	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	Hair Concern	\N	\N	\N	f	\N	12334.00	Paid	Registered	2026-01-13 14:30:32.89174	\N	\N	24	\N	2026-01-13 14:30:32.89174	2026-01-13 14:30:32.89174	f		\N	\N	\N	\N	UPI
66	OPD-20260119-5937	52	2	\N	4	\N	Walk-in	2026-01-19	18:48:00	T-246	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	Severe Skin tags	\N	\N	\N	f	\N	12334.00	Pending	Registered	2026-01-19 18:50:27.820476	\N	\N	24	\N	2026-01-19 18:50:27.820476	2026-01-19 18:50:27.820476	f		\N	\N	\N	\N	Cash
68	OPD-20260120-1720	54	55	\N	39	\N	Follow-up	2026-01-20	13:07:00	T-345	\N	Dark pigmentation in face	{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	Skin Problems	\N	\N	\N	f	\N	400.00	Paid	Registered	2026-01-20 13:11:00.475972	\N	\N	180	\N	2026-01-20 13:11:00.475972	2026-01-20 13:11:00.475972	f		\N	\N	\N	\N	Cash
67	OPD-20260120-8831	53	55	\N	39	\N	Walk-in	2026-01-20	12:58:00	T-205	\N	Tired,hairfall increase	{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	Severe Hairfall	\N	\N	\N	f	\N	400.00	Paid	In-consultation	2026-01-20 13:07:19.388099	\N	\N	180	\N	2026-01-20 13:07:19.388099	2026-01-20 17:28:46.586014	f		\N	\N	\N	\N	Cash
69	OPD-20260122-3046	55	55	\N	39	\N	Appointment	2026-01-22	12:23:00	T-1	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	Skin concerns	\N	\N	\N	f	\N	400.00	Pending	Completed	2026-01-22 12:25:37.928355	\N	\N	180	\N	2026-01-22 12:25:37.928355	2026-01-22 12:52:57.989778	f	\N	\N	\N	\N	\N	Cash
71	OPD-20260127-9324	57	55	\N	39	\N	Walk-in	2026-01-27	12:42:00	T-1	\N		{"grbs": "70", "spo2": "60", "pulse": "30", "height": "157", "weight": "50", "bp_systolic": "10", "temperature": "40", "bp_diastolic": "20"}	Head injury	\N	\N	\N	f	\N	300.00	Paid	In-consultation	2026-01-27 12:44:15.74064	\N	\N	180	\N	2026-01-27 12:44:15.74064	2026-01-27 14:53:59.859975	f		\N	\N	\N	\N	Cash
70	OPD-20260122-8232	56	55	\N	39	\N	Appointment	2026-01-22	12:45:00	T-2	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	Allergic issues	\N	\N	\N	f	\N	400.00	Pending	Completed	2026-01-22 12:29:13.2888	\N	\N	180	\N	2026-01-22 12:29:13.2888	2026-01-22 16:14:15.036003	f	\N	\N	\N	\N	\N	Cash
78	OPD-20260127-7125	63	1	\N	4	\N	Walk-in	2025-01-27	10:00:00	T-1	Fever	\N	\N	\N	\N	\N	\N	f	\N	\N	Pending	Registered	2026-01-27 17:41:14.440911	\N	\N	25	\N	2026-01-27 17:41:14.440911	2026-01-27 17:41:14.440911	f	\N	\N	\N	\N	\N	Cash
79	OPD-20260127-8172	64	1	\N	4	\N	Walk-in	2025-01-27	10:15:00	T-2	Cold	\N	\N	\N	\N	\N	\N	f	\N	\N	Pending	Registered	2026-01-27 17:41:14.448186	\N	\N	25	\N	2026-01-27 17:41:14.448186	2026-01-27 17:41:14.448186	f	\N	\N	\N	\N	\N	Cash
80	OPD-20260127-6440	65	55	\N	44	\N	Walk-in	2026-01-27	18:00:00	T-2	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	testing	\N	\N	\N	f	\N	250.00	Pending	Registered	2026-01-27 18:01:32.885902	\N	\N	180	\N	2026-01-27 18:01:32.885902	2026-01-27 18:01:32.885902	f		\N	\N	\N	\N	Cash
81	OPD-20260127-9795	66	55	\N	39	\N	Walk-in	2026-01-27	18:14:00	T-3	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	tetst	\N	\N	\N	f	\N	400.00	Pending	Registered	2026-01-27 18:17:23.141629	\N	\N	180	\N	2026-01-27 18:17:23.141629	2026-01-27 18:17:23.141629	t	Unknown	0	Nil	\N	\N	Cash
82	OPD-20260129-7261	67	55	\N	44	\N	Walk-in	2026-01-29	12:55:00	T-1	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	Testing	\N	\N	\N	f	\N	250.00	Pending	Registered	2026-01-29 12:56:36.686682	\N	\N	180	\N	2026-01-29 12:56:36.686682	2026-01-29 12:56:36.686682	f		\N	\N	\N	\N	Cash
83	OPD-20260129-5615	68	55	\N	39	\N	Walk-in	2026-01-29	12:57:00	T-2	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	Testing	\N	\N	\N	f	\N	400.00	Pending	In-consultation	2026-01-29 12:58:31.491308	\N	\N	180	\N	2026-01-29 12:58:31.491308	2026-01-29 12:59:16.356796	f		\N	\N	\N	\N	Cash
84	OPD-20260130-8773	55	55	\N	39	\N	Follow-up	2026-01-30	15:04:00	T-1	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}		\N	\N	\N	f	\N	400.00	Paid	Completed	2026-01-30 15:04:21.706044	\N	\N	180	\N	2026-01-30 15:04:21.706044	2026-01-30 15:34:40.281199	f		\N	\N	\N	\N	Cash
86	OPD-20260130-7063	70	55	\N	39	\N	Emergency	2026-01-30	16:06:00	T-2	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "1000", "temperature": "", "bp_diastolic": "20"}		\N	\N	\N	f	\N	400.00	Pending	In-consultation	2026-01-30 16:11:48.546119	\N	\N	180	\N	2026-01-30 16:11:48.546119	2026-01-30 16:15:40.424635	t	Doe	\N	\N	\N	\N	Cash
88	OPD-20260130-3672	71	55	\N	39	\N	Appointment	2026-01-30	16:47:00	T-4	\N		{"spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}	fever	\N	\N	\N	f	\N	400.00	Pending	Registered	2026-01-30 16:48:22.527559	\N	\N	180	\N	2026-01-30 16:48:22.527559	2026-01-30 16:48:22.527559	f	\N	\N	\N	\N	\N	Cash
89	OPD-20260130-8337	72	55	\N	39	\N	Emergency	2026-01-30	16:52:00	T-5	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}		\N	\N	\N	f	\N	400.00	Pending	Completed	2026-01-30 16:53:41.436855	\N	\N	180	\N	2026-01-30 16:53:41.436855	2026-01-30 17:02:51.246323	t		\N	\N	\N	\N	Cash
87	OPD-20260130-7189	70	55	\N	44	\N	Follow-up	2026-01-30	16:36:00	T-3	\N		{"grbs": "", "spo2": "", "pulse": "", "height": "", "weight": "", "bp_systolic": "", "temperature": "", "bp_diastolic": ""}		\N	\N	\N	f	\N	250.00	Pending	In-consultation	2026-01-30 16:39:10.392967	\N	\N	180	\N	2026-01-30 16:39:10.392967	2026-01-30 17:06:17.13154	f		\N	\N	\N	\N	Cash
\.


--
-- TOC entry 5942 (class 0 OID 20430)
-- Dependencies: 268
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (token_id, user_id, token, expires_at, used, created_at) FROM stdin;
\.


--
-- TOC entry 5985 (class 0 OID 21452)
-- Dependencies: 311
-- Data for Name: patient_feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patient_feedback (id, patient_id, patient_name, mrn, service_context, rating, tags, comment, sentiment, nurse_id, created_at) FROM stdin;
1	56	Meera K	MRN-20260122-0002	Post Consultation	3	["Doctor Care","Nursing Staff"]	Nurse Olivia doing great job	Neutral	179	2026-01-23 12:01:53.93457
2	55	Punith S	MRN-20260122-0001	Post Treatment	2	["Nursing Staff"]	Good service equipped with all necessary medical facilities well maintained	Negative	179	2026-01-23 12:03:07.434073
3	3	Kishore S	MRN-20251205-7058	Post Consultation	4	[]	Well maintained Hospital	Positive	179	2026-01-23 12:04:25.052369
\.


--
-- TOC entry 5944 (class 0 OID 20440)
-- Dependencies: 270
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patients (patient_id, mrn_number, first_name, last_name, patient_code, gender, date_of_birth, age, blood_group, contact_number, email, address, city, state, pincode, emergency_contact_name, emergency_contact_number, emergency_contact_relation, aadhar_number, insurance_provider, insurance_policy_number, medical_history, allergies, current_medications, is_active, registration_date, created_at, updated_at, adhaar_number, is_deceased, date_of_death, time_of_death, declared_dead_by, cause_of_death, death_circumstances, is_death_mlc, death_police_station, post_mortem_required, relatives_name, relatives_notified_at, relatives_number, death_police_district, address_line2) FROM stdin;
1	MRN-20251204-9881	ef	srg	PAT-304918	Male	\N	121	\N	121212121212	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-04	2025-12-04 15:47:25.302044	2025-12-04 15:47:25.302044	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
2	MRN-20251204-2006	madhu	gj	PAT-651436	Male	\N	12	\N	q235r	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-04	2025-12-04 17:39:17.449029	2025-12-04 17:39:17.449029	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
3	MRN-20251205-7058	Kishore	S	PAT-801077	Male	\N	25	\N	9754876587	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-05	2025-12-05 12:21:23.716333	2025-12-05 12:21:23.716333	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
4	MRN-20251205-5552	Dhanush	S	PAT-279481	Male	\N	25	\N	7865675467	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-05	2025-12-05 17:38:33.223215	2025-12-05 17:38:33.223215	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
5	MRN-20251208-3813	Kanappa	S	PAT-231329	Male	\N	65	\N	2345676543	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 10:49:29.570992	2025-12-08 10:49:29.570992	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
6	MRN-20251208-5777	gg	2	PAT-586263	Male	\N	65	\N	8754678654	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 11:01:05.280731	2025-12-08 11:01:05.280731	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
7	MRN-20251208-2521	dwtr	s	PAT-864388	Male	\N	12	\N	5456765544	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 11:09:31.246537	2025-12-08 11:09:31.246537	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
8	MRN-20251208-7016	dfdfe	s	PAT-776444	Male	\N	33	\N	1235654567	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 11:48:38.112031	2025-12-08 11:48:38.112031	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
9	MRN-20251208-9166	Kumar	S	PAT-484001	Male	\N	44	\N	5678456787	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 12:14:28.172807	2025-12-08 12:14:28.172807	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
10	MRN-20251208-1077	aaa	s	PAT-803131	Male	\N	23	\N	8765678998	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 13:04:01.118688	2025-12-08 13:04:01.118688	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
11	MRN-20251208-8755	subash	S	PAT-361256	Male	\N	33	\N	8988899809	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 14:25:23.279645	2025-12-08 14:25:23.279645	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
12	MRN-20251208-4937	wer	wer	PAT-577182	Male	\N	3	\N	5456677866	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 15:03:46.474428	2025-12-08 15:03:46.474428	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
13	MRN-20251208-3013	akbar	S	PAT-113658	Male	\N	33	\N	sdf	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 15:05:07.382487	2025-12-08 15:05:07.382487	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
14	MRN-20251208-5263	birbal	S	PAT-915703	Male	\N	44	\N	3456787654	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 15:18:02.444362	2025-12-08 15:18:02.444362	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
15	MRN-20251208-6876	taj	t	PAT-492068	Male	\N	12	\N	8888888898	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 15:30:00.767658	2025-12-08 15:30:00.767658	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
16	MRN-20251208-7212	tilak	S	PAT-402066	Male	\N	25	\N	5456787654	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 15:53:39.423286	2025-12-08 15:53:39.423286	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
17	MRN-20251208-2552	raj	e	PAT-425927	Male	\N	16	\N	5456787655	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 15:59:09.143674	2025-12-08 15:59:09.143674	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
18	MRN-20251208-6434	lavender	w	PAT-258179	Female	\N	22	\N	5566778654	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 16:08:45.13068	2025-12-08 16:08:45.13068	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
19	MRN-20251208-2197	dinder	e	PAT-264973	Male	\N	33	\N	5456765456	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 16:44:54.374396	2025-12-08 16:44:54.374396		f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
23	MRN-20251208-6750	hello	hi	PAT-589438	Female	\N	33	O+	3456765678	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 17:14:30.660493	2025-12-08 17:14:30.660493	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
24	MRN-20251208-8734	fff	s	PAT-415601	Male	\N	33	\N	4567876545	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-08	2025-12-08 17:19:54.26983	2025-12-08 17:19:54.26983	234565676567	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
25	MRN-20251209-2238	Patient1	S	PAT-792330	Male	\N	35	A-	4565456787	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-09	2025-12-09 11:25:28.060777	2025-12-09 12:01:55.982594	121212121212	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
26	MRN-20251209-2262	P2	2	PAT-779870	Male	\N	55	A-	5456765444	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-09	2025-12-09 11:32:35.370263	2025-12-09 12:47:48.379883	121212121211	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
27	MRN-20251209-1588	sgf	sdfs	PAT-718981	Male	\N	234	A-		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-09	2025-12-09 17:11:33.994845	2025-12-09 17:11:33.994845	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
28	MRN-20251209-7115	Kathar	S	PAT-597078	Male	\N	44	A-		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-09	2025-12-09 17:49:08.261865	2025-12-09 17:49:08.261865	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
29	MRN-20251209-8256	ggg	gg	PAT-823615	Male	\N	44	A+	4534566346	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-09	2025-12-09 18:44:57.907519	2025-12-09 18:44:57.907519	563463463463	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
30	MRN-20251212-5300	sdc	scsc 	PAT-701740	Male	\N	11	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-12	2025-12-12 11:15:34.675632	2025-12-12 11:15:34.675632	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
32	MRN-20251212-9665	kjb;	ad	PAT-971784	Female	\N	33	A+	55555555555	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-12	2025-12-12 12:31:16.879279	2025-12-12 12:31:16.879279	555555555555	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
33	MRN-20251212-4829	s	s	PAT-348353	Male	\N	1	\N	1111111111	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-12	2025-12-12 12:34:50.011254	2025-12-12 12:34:50.011254	1111111111	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
31	MRN-20251212-5677	h	a	PAT-562063	Male	\N	22	A+	121212121	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-12	2025-12-12 11:16:15.347162	2025-12-12 12:43:41.161895	5151515151515	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
34	MRN-20251212-3151	kumar	a	PAT-727435	Male	\N	22	A+	8383838383	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-12	2025-12-12 14:52:31.703885	2025-12-12 14:52:31.703885	525252525252	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
35	MRN-20251216-7170	drg	dgf	PAT-842999	Female	\N	3	\N	345435345	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-16	2025-12-16 17:41:48.49753	2025-12-16 17:41:48.49753	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
36	MRN-20251216-4928	karnan	kalai	PAT-284754	Male	\N	55	A-	565756565	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-16	2025-12-16 18:04:23.984352	2025-12-16 18:04:23.984352	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
37	MRN-20251217-6827	ere	ewrt	PAT-293408	Male	\N	43	A-	345653465	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-17	2025-12-17 11:08:10.78601	2025-12-17 11:08:10.78601	346436	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
38	MRN-20251217-9446	345	345	PAT-286307	Male	\N	3	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-17	2025-12-17 12:06:30.445753	2025-12-17 12:06:30.445753	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
39	MRN-20251218-1007	kay	h	PAT-330517	Male	\N	32	O+	8957465738	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-18	2025-12-18 12:30:44.900873	2025-12-18 12:30:44.900873	896864758947	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
40	MRN-20251218-4775	jain	g	PAT-836167	Male	\N	45	AB+	8759684473	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-18	2025-12-18 12:33:42.029734	2025-12-18 13:04:23.520096	\N	t	2025-12-18	12:58:00	Dr.  Satish	cardiac arrest	high BP	t	arekere	t	jule, brother	2025-12-18 12:58:00	9876746538	bangalore urban	\N
41	MRN-20251222-3925	p1	p1	PAT-614714	Female	\N	23	A+		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-22	2025-12-22 17:47:00.877518	2025-12-22 17:47:00.877518	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
42	MRN-20251222-6513	dddd	dd	PAT-795493	Male	\N	33	A-		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-22	2025-12-22 18:05:23.178472	2025-12-22 18:05:23.178472	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
43	MRN-20251223-5901	patient	1	PAT-633424	Male	\N	33	A-	9897676565	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2025-12-23	2025-12-23 10:40:28.268386	2025-12-23 10:40:28.268386	765654567899	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
44	MRN-20260102-2645	p1	p	PAT-823180	Male	\N	77	\N	7876556776	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-02	2026-01-02 17:06:24.380681	2026-01-02 17:06:24.380681	878656587987	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
46	MRN-20260107-1409	Daniel	harry	PAT-524458	Male	\N	50	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-07	2026-01-07 12:51:21.428328	2026-01-07 12:51:21.428328	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
45	MRN-20260107-4823	George	kanna	PAT-214907	Male	\N	66	B+	7687656545	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-07	2026-01-07 12:27:24.954935	2026-01-07 15:25:03.987948	87967678687	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
47	MRN-20260108-4006	George	Hill	PAT-967556	Male	\N	44	A-	8387744884	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-08	2026-01-08 11:54:59.644968	2026-01-08 11:54:59.644968	898877584767	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
49	MRN-20260108-8958	Henry	Rochers	PAT-629924	Male	\N	25	\N	8783665838	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-08	2026-01-08 12:01:39.015819	2026-01-08 12:01:39.015819	987832783272	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
48	MRN-20260108-9440	Winston	Churchill	PAT-823379	Male	\N	57	B+		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-08	2026-01-08 11:58:46.698857	2026-01-08 12:34:06.779914	\N	t	2026-01-06	12:28:00	Dr.  Doctor`	Immediate Cause	accident	t	Richmond	t	Sony & Son	2026-01-07 07:02:00	8787676767	Bangalore	\N
54	MRN-20260120-4415	Gopika	S	PAT-937884	Female	\N	21	B+	9638326362	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-20	2026-01-20 13:11:00.473887	2026-01-20 13:11:00.473887	0750-9643-9564	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
55	MRN-20260122-0001	Punith	S	PAT-423751	Male	\N	25	\N	4628468642	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-22	2026-01-22 12:25:37.920913	2026-01-22 12:25:37.920913	351725753752	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
50	MRN-20260113-3543	Mega	S	PAT-842517	Female	\N	24	B+	9003101244	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-13	2026-01-13 12:58:02.093984	2026-01-13 13:04:44.128706	123456789012	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
51	MRN-20260113-5975	Deyga	S	PAT-831534	Female	\N	12	B-	4628346832	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-13	2026-01-13 14:30:19.570749	2026-01-13 14:30:32.886065	123456789012	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
52	MRN-20260119-1516	Jeevika	S	PAT-736644	Female	\N	24	B+	6216216268	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-19	2026-01-19 18:50:27.815381	2026-01-19 18:50:27.815381	3731073120370177312	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
53	MRN-20260120-7400	Deepika	S	PAT-759460	Female	\N	24	B+	4060234046	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-20	2026-01-20 13:07:19.386212	2026-01-20 13:07:19.386212	4527-3454-5234	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
56	MRN-20260122-0002	Meera	K	PAT-790633	Female	\N	25	\N	6483683468	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-22	2026-01-22 12:29:13.284072	2026-01-22 12:29:13.284072	576598658758	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
57	MRN-20260127-0001	Poorani	S	PAT-686051	Female	\N	30	B+	7428730894	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-27	2026-01-27 12:44:15.709514	2026-01-27 13:19:05.38676	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
63	MRN-20260127-0002	Father	Test	PAT-747391	Male	\N	45	\N	9999999999	\N	123 House	TestCity	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-27	2026-01-27 17:41:14.438963	2026-01-27 17:41:14.438963	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
64	MRN-20260127-0003	Daughter	Test	PAT-723065	Female	\N	10	\N	9999999999	\N	123 House	TestCity	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-27	2026-01-27 17:41:14.446826	2026-01-27 17:41:14.446826	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
65	MRN-20260127-0004	Dhaanu		PAT-204025	Female	\N	24	B+	7428730894	\N					\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-27	2026-01-27 18:01:32.877088	2026-01-27 18:01:32.877088	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	
66	MRN-20260127-0005	Diya		PAT-539325	Female	\N	35	B-	7428730899	\N					\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-27	2026-01-27 18:17:23.120687	2026-01-27 18:17:23.120687	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	
67	MRN-20260129-0001	Diya		PAT-104180	Female	\N	24	\N	4862304864	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-29	2026-01-29 12:56:36.672879	2026-01-29 12:56:36.672879	452384532532	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
68	MRN-20260129-0002	Nive		PAT-856809	Female	\N	24	\N	8832885684	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-29	2026-01-29 12:58:31.460744	2026-01-29 12:58:31.460744	486234864328	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
69	MRN-20260130-0001	Punith		PAT-971442	Male	\N	23	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-30	2026-01-30 16:10:20.225535	2026-01-30 16:10:20.225535	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
70	MRN-20260130-0002	Punith		PAT-199906	Male	\N	23	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-30	2026-01-30 16:11:48.54075	2026-01-30 16:11:48.54075	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
71	MRN-20260130-0003	Joe	vs	PAT-280966	Female	\N	23	\N	2312312321	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-30	2026-01-30 16:48:22.522124	2026-01-30 16:48:22.522124	213312312	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
72	MRN-20260130-0004	Jake		PAT-400152	Male	\N	22	\N	1234567777	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-01-30	2026-01-30 16:53:41.39263	2026-01-30 16:53:41.39263	\N	f	\N	\N	\N	\N	\N	f	\N	f	\N	\N	\N	\N	\N
\.


--
-- TOC entry 5946 (class 0 OID 20459)
-- Dependencies: 272
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
15	35	39	47	[{"name":"vitamin D","dosage":"500mg","frequency":"","duration":"","morning":true,"noon":false,"night":false,"food_timing":"After Food"},{"name":"c-syrup","dosage":"10ml","frequency":"","duration":"","morning":true,"noon":true,"night":true,"food_timing":"After Food"}]	high fever, high BP,\nplatelet count down	chest X-Ray\nAbdominal X-Ray\nCTScan abdominal	Active	2025-12-18 12:48:52.924397	2025-12-18 12:48:52.924397	[{"lab_name": "inhouse", "test_name": "typhoid test"}, {"lab_name": "inhouse", "test_name": "Dengue test"}, {"lab_name": "inhouse", "test_name": "all hemitology and bio-chemistory test"}]
16	5	41	5	[{"name":"med","dosage":"2","frequency":"","duration":"","morning":false,"noon":true,"night":false,"food_timing":"After Food"}]	fdf ff	kjf jf dkfjoiwfjoif 'ad mdoij 	Active	2025-12-22 17:56:09.791213	2025-12-22 17:56:09.791213	[{"lab_name": "1", "test_name": "a"}, {"lab_name": "1", "test_name": "b"}]
17	36	44	49	[{"name":"lkjf oiejf ","noon":false,"night":true,"dosage":"2","morning":false,"duration":"","frequency":"","food_timing":"After Food"}]	kj wjf iejf \nfj fej \nweofk w jf\nwefok 	f oj	Active	2026-01-02 17:16:03.716052	2026-01-02 17:16:03.716052	[{"lab_name": "oedh ", "test_name": "l1"}, {"lab_name": "lf o", "test_name": "l2"}]
18	37	45	52	[{"name":"medication","dosage":"50","frequency":"","duration":"","morning":true,"noon":false,"night":false,"food_timing":"Before Food"}]	high temp\nvomit\n	X-ray\n	Active	2026-01-07 12:40:00.599263	2026-01-07 12:40:00.599263	[{"lab_name": "lab1", "test_name": "blood test"}]
19	38	48	53	[{"name":"painkiller","noon":false,"night":true,"dosage":"100","morning":true,"duration":"","frequency":"","food_timing":"After Food"}]	fracture\nblood loss		Active	2026-01-08 12:34:06.667185	2026-01-08 12:34:06.667185	[{"lab_name": "lab1", "test_name": "x ray"}]
20	39	53	55	[{"name":"biotin tablet","dosage":"500mg","frequency":"1-0-1","duration":"30 days","instruction":"before food"},{"name":"iron tab ","dosage":"200mg","frequency":"1-0-1","duration":"20 days","instruction":"before food"}]		hisuitism	Active	2026-01-20 15:14:12.438317	2026-01-20 15:14:12.438317	[]
21	39	53	55	[{"name":"biotin tab","dosage":"500 mg","frequency":"1-0-1","duration":"5 Day","instruction":"After food"}]			Active	2026-01-20 15:57:40.11159	2026-01-20 15:57:40.11159	[]
22	39	53	55	[{"name":"testing","dosage":"500 m","frequency":"1-0-1","duration":"5 days","instruction":"After food"}]			Active	2026-01-22 11:15:06.414845	2026-01-22 11:15:06.414845	[]
\.


--
-- TOC entry 5948 (class 0 OID 20470)
-- Dependencies: 274
-- Data for Name: referral_doctor_module; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referral_doctor_module (id, department_id, doctor_name, mobile_number, speciality_type, medical_council_membership_number, council, pan_card_number, aadhar_card_number, bank_name, bank_branch, bank_address, bank_account_number, bank_ifsc_code, photo_upload_path, pan_upload_path, aadhar_upload_path, referral_pay, tenant_id, marketing_spoc, introduced_by, status, created_by, updated_by, created_at, updated_at, geo_latitude, geo_longitude, geo_accuracy, geo_altitude, geo_altitude_accuracy, geo_heading, geo_speed, geo_timestamp, uuid, address, clinic_photo_path, clinic_name, branch_id, kyc_upload_path) FROM stdin;
1	1	ref 	12121212121	tech										\N	\N	\N	0	6	91	91	Pending	test mang	\N	2025-12-14 17:10:08.027267	2025-12-14 17:10:08.027267	12.95597455	77.60265787	108.00	\N	\N	\N	\N	\N	d3903447-7b99-4037-a377-c33a63f984fe		\N		\N	\N
2	1	Dr.Kiruba	0962383456	Cardiology	JAK8638261	Tamil Nadu Medical Council	c84099c969a1ea039201ac1322344707:b9c8c805b6588484781cb78bf620b4e2	eae4446488bec3999684e3e64bc5bde5:fcfd76f388df0ca21866c436baf5fa2a	HDFC Bank	KH Road	Lavelle road, Bengaluru	641836846861	KAB00329	uploads\\marketing\\photo-1765799624682-292042139.jpg	uploads\\marketing\\pan-1765799624731-203379126.pdf	uploads\\marketing\\aadhar-1765799624733-748741002.pdf	0	6	91	91	Pending	test mang	\N	2025-12-15 17:23:44.882114	2025-12-15 17:23:44.882114	12.96844317	77.59662080	97.00	\N	\N	\N	\N	\N	ac809290-603a-4fb0-a5d9-b4171e4f1195	123, XYZ Street, Rajaji Street, Bengaluru	uploads\\marketing\\clinic_photo-1765799624741-46531499.png	Victoria Hospital	3	\N
3	1	Dr. Aishwarya	54643534636	Nuerosurgon	564564	fghgfh	0b4601c3b779973b4d142d4c9eb2f006:b6f203a3b3018b20c9791429c60bde9a	def0d5d24373c747d5fb35c7e00268c7:2f71157d3ebc776e6f6225f9774241d4	4567	45675	Indira nagar	457457	57	uploads\\marketing\\photo-1765887783951-885519294.webp	\N	\N	0	6	91	91	Pending	test mang	\N	2025-12-16 17:53:03.987925	2025-12-16 17:53:03.987925	\N	\N	\N	\N	\N	\N	\N	\N	490430c0-d2c3-40bd-b7ac-d0ebf23871c8	Indira nagar	uploads\\marketing\\clinic_photo-1765887783952-412500222.png	adfa	3	\N
4	1	referal	08248690754								C-129, D-colony, P.K. Kandasamy street,			\N	\N	\N	0	21	118	118	Pending	ecex1	\N	2025-12-17 11:22:25.61303	2025-12-17 11:22:25.61303	\N	\N	\N	\N	\N	\N	\N	\N	2103fa53-cbf6-471d-b55e-a6d0d7f61a3a	C-129, D-colony, P.K. Kandasamy street,\r\nJothinagar	\N		27	\N
5	1	rf1	4535345435	cardiology	565645	dgbfh	b58168e08bea4a86ded42555e961efbf:437beba37113da6ee807b48c1bd00cf2	edcc39c218d20b850d4d7b3e70da6540:95f6f42ad2e4f6029c64a22bb6eb0f2a	fdghfhf	fghfgh	rgh4hrg	354656	3456	\N	\N	\N	0	36	120	120	Pending	ak1	\N	2025-12-17 11:40:13.592311	2025-12-17 11:40:13.592311	\N	\N	\N	\N	\N	\N	\N	\N	6ef00fe0-3f12-4d8a-8fe7-5a50afe0583e	rgdfgd	\N	lavanaya	42	\N
6	1	Jonh	9986758493	Cardiology	12345KMC	KArnataka Medical Council	7f85dc5793f62cab4b55fe29782123a4:3e4d8f139dccca2ced056cae89a91b48	a3035f00d0ce9c4a14130ad7923bd0af:db9ff70cf0a21abbf0012748bb9f527f	hello bank	bangalore	bangalore richmond roal	78373628293846	IFJDNE1248	uploads\\marketing\\photo-1765995534666-731333021.png	uploads\\marketing\\pan-1765995534668-822880747.pdf	uploads\\marketing\\aadhar-1765995534668-825451461.pdf	0	10	132	132	Active	marketExec1	\N	2025-12-17 23:48:54.839242	2025-12-18 00:33:58.757269	12.88110080	77.62083840	17568.15	\N	\N	\N	\N	\N	f6731108-638d-4f95-b14f-9cb574e0c61b	bannergatta road, bangalore, 	uploads\\marketing\\clinic_photo-1765995534668-462741788.png	sagar clinic	12	\N
7	1	harish	7847655389	Pediatric	KMS5436271	KArnataka Medical Council	0e7b211bfdfb0bbca79620ca17ff75d0:0c7cfeeecd8bfdb14c98dd4441eb2b2d	022a791a32dabe0e815cc8dcfd141060:f55424eb85ed40f8b77860de81b3c083	ABC bank	arekere	bangalore richmond road	78373628293845	ABCBAN2345K	uploads\\marketing\\photo-1766025192887-29085720.png	uploads\\marketing\\pan-1766025192887-318607547.pdf	uploads\\marketing\\aadhar-1766025192887-939368326.pdf	0	39	137	137	Active	Markexec	\N	2025-12-18 08:03:12.943813	2025-12-18 08:44:03.486304	12.88110080	77.62083840	17568.15	\N	\N	\N	\N	\N	162512d8-0ca0-4c50-9123-ccf0fe87d7c9	bannerghatta road, arekere	uploads\\marketing\\clinic_photo-1766025192887-899902139.png	lata clinic	46	\N
8	1	pradeep	8957463527	neuro surgeon	KMS89473h	karnataka medical council	0e98595969535d58f95e3186b831465c:e1f0d188470cf89f371c18057e357096	0732c985e4c8e6a84e0e8c16b81c3b7d:89d31dc240164fa4ec15be4d6a53cf52	ABC BAnk	richmond	richmond road	7847363847592	abc2342k	uploads\\marketing\\photo-1766043548646-138025818.png	uploads\\marketing\\pan-1766043548649-799714298.pdf	uploads\\marketing\\aadhar-1766043548649-509423426.pdf	0	40	144	144	Active	mrktexecNano	\N	2025-12-18 13:09:08.718531	2025-12-18 13:09:58.028466	12.96347710	77.61350460	16338.82	\N	\N	\N	\N	\N	b7ae212e-6ad1-46ef-a09c-d681ffe9648f	central bangalore	uploads\\marketing\\clinic_photo-1766043548649-431041613.png	veda clinic	47	\N
9	1	name	8787656787											\N	\N	\N	0	40	145	145	Pending	managermrktNano	\N	2025-12-23 12:02:21.795748	2025-12-23 12:02:21.795748	\N	\N	\N	\N	\N	\N	\N	\N	9ff8fa91-78d4-4954-9eff-ae066c27856e		\N		47	uploads\\marketing\\kyc_document-1766471541684-339012306.pdf
10	1	h1	9887637647	jd ofh 	865	KMC	81f46f246a56ac9c1ca9d734d42a5d28:ef7092772759ddd7b5206580473b6858	c30bf31f73cb05aae4e59c422b93121f:cbc3a994855e64666d6c8f86392963d2	oiur 	ij 	0934u 	irj oir	0934	\N	uploads\\marketing\\pan-1767354664628-843616705.pdf	uploads\\marketing\\aadhar-1767354664629-32454332.pdf	0	42	153	153	Active	market1kashi	\N	2026-01-02 17:21:04.835298	2026-01-02 17:30:02.065525	\N	\N	\N	\N	\N	\N	\N	\N	ee81652b-909f-49d2-8b84-d4eb3ebf6cc0	lo ofof 	\N	jnd u 	49	uploads\\marketing\\kyc_document-1767354664630-504206225.pdf
11	1	Jennifer	8783764883	Cardiology	809	Karnataka Medical council	de2606e4ba3a77795642fb924c9db755:e479a89b6507fbc0426b802845c3a34e	2dbf40197a1352b0afa89a7aec89c86c:16def4c8feea56ed0b0a2d91a3a74efb	Bank2	Bank1Branch1	879, cart raod	7265768743	7887h8y	uploads\\marketing\\photo-1767856814388-380651593.png	uploads\\marketing\\pan-1767856814390-693949265.png	uploads\\marketing\\aadhar-1767856814396-31378370.pdf	0	45	172	172	Active	marketingexeckaveri	marketingexeckaveri	2026-01-08 12:50:14.918839	2026-01-08 14:15:41.846075	\N	\N	\N	\N	\N	\N	\N	\N	25232deb-b2b9-4d3a-9d1d-bdbf775988ec	333, Raven Road	uploads\\marketing\\clinic_photo-1767856814396-239798727.jfif	Sunrise Clinic	53	uploads\\marketing\\kyc_document-1767856814396-588799195.pdf
\.


--
-- TOC entry 5950 (class 0 OID 20484)
-- Dependencies: 276
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
19	8	Ambulance service	Y	30.00	20.00	Active	accountatnnano	accountatnnano	2025-12-18 13:09:58.025487	2025-12-18 13:11:13.508739	ea49ac85-fb52-48d9-9fdf-a7327d277b65
20	8	Day care procedures	Y	50.00	20.00	Active	accountatnnano	accountatnnano	2025-12-18 13:10:12.619103	2025-12-18 13:11:13.524842	3166e30d-81db-40e2-9d47-753c96677ba2
21	8	Major surgeries	Y	40.00	35.00	Active	accountatnnano	accountatnnano	2025-12-18 13:10:50.553719	2025-12-18 13:11:13.551956	5972a673-16de-4d90-8c93-ef75967f9ea7
22	10	Cafeteria/diet kitchen	Y	20.00	30.00	Active	acc1kashi	acc1kashi	2026-01-02 17:30:02.059501	2026-01-02 17:30:16.940501	7b3ee3f6-1826-437c-8adf-962f7f8c66a2
23	10	Consultation service	Y	15.00	25.00	Active	acc1kashi	acc1kashi	2026-01-02 17:31:00.002288	2026-01-02 17:31:12.641401	98eec66d-9e25-4d49-ba49-3d6c4908d550
24	10	Bed management	Y	50.00	75.00	Active	acc1kashi	acc1kashi	2026-01-02 17:34:48.166328	2026-01-02 17:34:58.601837	725e06d5-c8cb-4ad5-989c-e44eea168538
25	11	Biomedical waste management	Y	20.00	30.00	Active	accountantkaveri	accountantkaveri	2026-01-08 12:58:41.021643	2026-01-08 12:59:45.033425	7b58172f-152c-4789-b791-744162dc29dc
27	11	Colonoscopy	Y	50.00	45.00	Active	accountantkaveri	accountantkaveri	2026-01-08 12:59:25.35615	2026-01-08 12:59:45.268967	47d24160-3d33-4c22-8c72-27df6121d751
26	11	Call center service	Y	15.00	10.00	Active	accountantkaveri	accountantkaveri	2026-01-08 12:59:15.497439	2026-01-08 12:59:45.648373	28ba2803-16b7-4d22-bac1-d5eaabb3c539
28	11	Biopsy	Y	80.00	10.00	Active	accountantkaveri	accountantkaveri	2026-01-08 13:07:12.753404	2026-01-08 13:07:38.299865	fd8270f9-cf09-41b0-8d14-e9240ff55869
29	11	Blood bank service	Y	20.00	45.00	Active	accountantkaveri	accountantkaveri	2026-01-08 13:07:26.281999	2026-01-08 13:07:38.61041	0f444474-030d-4cb6-bf01-e6e668ea889e
\.


--
-- TOC entry 5952 (class 0 OID 20498)
-- Dependencies: 278
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
8	23	d1	oi 	e f	9093285845	d1@h1.com		t	149	2026-01-02 17:15:34.917785	2026-01-02 17:15:34.917785
9	24	KausalyaDoc	Ortho	Ortho	8937205728	doc1@kausalyahospital.com	MBBS	t	169	2026-01-08 11:29:21.039071	2026-01-08 11:29:21.039071
\.


--
-- TOC entry 5954 (class 0 OID 20511)
-- Dependencies: 280
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
14	49	23	t	149	2026-01-02 17:15:14.117743
15	53	24	t	169	2026-01-08 11:26:21.083871
16	53	25	t	169	2026-01-08 11:27:53.260781
\.


--
-- TOC entry 5956 (class 0 OID 20520)
-- Dependencies: 282
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
23	h1	jd nj	jj	e	8798732572	h1@gmail.com	Private	{f,"ij f[wifj"}	t	149	2026-01-02 17:15:14.106874	2026-01-02 17:15:14.106874
24	Kausalya	123, K Street, G Town	Bangalore	Karnataka	8787655555	kausalaya@hospital.com	Private	{"Neural Surgery",Dental,Ortho}	t	169	2026-01-08 11:26:21.00649	2026-01-08 11:26:21.00649
25	Ram clininc	123 cape town	Bangalore	Karnataka	7666666666	ram@hopsital.com	Private	{ortho,pediatric,dental}	t	169	2026-01-08 11:27:53.248184	2026-01-08 11:27:53.248184
\.


--
-- TOC entry 5958 (class 0 OID 20532)
-- Dependencies: 284
-- Data for Name: referral_patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referral_patients (id, referral_patient_id, patient_name, mobile_number, gender, age, place, referral_doctor_id, payment_type, service_required, status, remarks, created_by, marketing_spoc, created_at, updated_at) FROM stdin;
1	RP-1765800435948	test	1234567876	Male	22		2	Cash		Pending		test mang	91	2025-12-15 17:37:16.082657	2025-12-15 17:37:16.082657
2	6381268	Meera	86464239	Female	25	Bengaluru	2	Insurance	Dental X-Ray	Pending	Patient having corporate insurance verified the required docs	test mang	91	2025-12-15 17:40:09.475625	2025-12-15 17:40:09.475625
3	rtyer	rety	456456747	Female	55		3	Cash	456	Pending	456	test mang	91	2025-12-16 17:53:36.717478	2025-12-16 17:53:36.717478
4	65	fgh	08248690754	\N	\N		4	Cash		Pending		ecex1	118	2025-12-17 11:23:08.015983	2025-12-17 11:23:08.015983
5	patient 13	varma	9986758493	Male	25	bangalore	6	Cash	OT	Pending	testing this data	marketExec1	132	2025-12-18 00:09:26.577143	2025-12-18 00:09:26.577143
6	909	p1	9837498326	Male	87	3084	10	Cash	X-ray	Pending		market1kashi	153	2026-01-02 17:22:01.689181	2026-01-02 17:22:01.689181
9	888	p1	9887637647	Male	55	Bangalore	10	Cash	X-ray	Pending	fj oi 	market1kashi	153	2026-01-02 17:24:09.995996	2026-01-02 17:24:09.995996
10	768	ppp	9837498326	Male	88	Bangalore	10	Cash	X-ray	Pending	lwqj doqh o	market1kashi	153	2026-01-02 17:25:38.31974	2026-01-02 17:25:38.31974
11	0899	Raj	8478473638	Male	44	Banglaore	11	Cash	Heart	Pending		marketingexeckaveri	172	2026-01-08 12:51:38.050862	2026-01-08 12:51:38.050862
12	0900	Sam	7558478475	Female	42	Bangalore	11	Insurance		Pending		marketingexeckaveri	172	2026-01-08 12:53:27.191602	2026-01-08 12:53:27.191602
\.


--
-- TOC entry 5960 (class 0 OID 20547)
-- Dependencies: 286
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
46	0369727a-11f6-4452-a073-d2a5f50b5cab	8	Ambulance service	3000.00	30.00	900.00	\N	Active	accountatnnano	accountatnnano	2025-12-18 13:20:27.99304	2025-12-18 13:20:27.99304
47	82feab0c-263c-4e72-aa01-9139022bb0b4	8	Day care procedures	2500.00	50.00	1250.00	\N	Active	accountatnnano	accountatnnano	2025-12-18 13:20:27.99304	2025-12-18 13:20:27.99304
48	6e8dc225-42c2-482f-b10e-25a31dbbd72c	8	Endoscopic surgery	5000.00	0.00	0.00	\N	Active	accountatnnano	accountatnnano	2025-12-18 13:20:27.99304	2025-12-18 13:20:27.99304
49	d0f359dd-03be-4827-863a-152398d90839	8	ICU care	5000.00	0.00	0.00	\N	Active	accountatnnano	accountatnnano	2025-12-18 13:20:27.99304	2025-12-18 13:20:27.99304
50	f495a14d-096e-4676-b804-a20c669772c2	9	Day care procedures	2500.00	20.00	500.00	\N	Active	accountatnnano	accountatnnano	2025-12-18 13:20:27.99304	2025-12-18 13:20:27.99304
51	540a72ea-1615-4b04-82ab-412d64974e3c	9	Endoscopic surgery	2500.00	0.00	0.00	\N	Active	accountatnnano	accountatnnano	2025-12-18 13:20:27.99304	2025-12-18 13:20:27.99304
52	2ea3d032-a0f7-4d5f-92f8-b391eac3560c	9	ICU care	3000.00	0.00	0.00	\N	Active	accountatnnano	accountatnnano	2025-12-18 13:20:27.99304	2025-12-18 13:20:27.99304
53	7a8c0608-bc80-4b91-820c-fc171060e1c1	10	Bed management	1000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:34:10.772751	2026-01-02 17:34:10.772751
54	e72924d6-cff0-451c-adec-f08f57b89134	10	Cafeteria/diet kitchen	1000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:34:10.772751	2026-01-02 17:34:10.772751
55	693ec33f-faf8-4dba-9f63-88dad33f54a8	10	Consultation service	1000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:34:10.772751	2026-01-02 17:34:10.772751
56	14e04f1d-85f1-45f0-8de9-f77ed62be848	10	Dialysis	1000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:34:10.772751	2026-01-02 17:34:10.772751
57	84a464be-42b5-4c3d-a53d-d6bb3940fde6	10	Insurance/TPA processing	1000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:34:10.772751	2026-01-02 17:34:10.772751
58	6021b4dd-8682-4939-8a82-87931129a1e1	11	Bed management	5000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:34:10.772751	2026-01-02 17:34:10.772751
59	26e275d8-81d4-4fb7-bdf7-292325cd564b	11	Cafeteria/diet kitchen	1000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:34:10.772751	2026-01-02 17:34:10.772751
60	20fbf4ec-d26d-4800-bb30-4eaf4287d916	11	Consultation service	8000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:34:10.772751	2026-01-02 17:34:10.772751
61	6acda884-828e-447d-baff-992089effd2b	11	Dialysis	18000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:34:10.772751	2026-01-02 17:34:10.772751
62	cb8c0dba-630e-4e72-bd9a-94007f9acac4	12	Bed management	1000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:35:54.599753	2026-01-02 17:35:54.599753
63	d7d68834-1f56-4394-87f2-8edcc28857fc	12	Cafeteria/diet kitchen	1000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:35:54.599753	2026-01-02 17:35:54.599753
64	88aaef9f-b19f-4ccd-a702-a08d05729abc	12	Consultation service	1000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:35:54.599753	2026-01-02 17:35:54.599753
65	8c2801e1-aba1-494e-a1a2-57b4ad9edd57	12	Dialysis	1000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:35:54.599753	2026-01-02 17:35:54.599753
66	f58c790c-cea0-4272-bc20-75a0b1d23438	12	Insurance/TPA processing	1000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:35:54.599753	2026-01-02 17:35:54.599753
67	56e9f87b-418c-415a-b61f-1fb2b4d2fe66	13	Bed management	5000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:35:54.599753	2026-01-02 17:35:54.599753
68	987ee83e-ecc8-49f1-aa3c-a1994cb6e4f3	13	Cafeteria/diet kitchen	1000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:35:54.599753	2026-01-02 17:35:54.599753
69	af5d6c38-3bec-4bcf-b66f-856579a0a525	13	Consultation service	8000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:35:54.599753	2026-01-02 17:35:54.599753
70	495ffb73-8578-42c3-951e-ef79305b39bb	13	Dialysis	18000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:35:54.599753	2026-01-02 17:35:54.599753
71	5e9fb0cb-3f7a-459f-8f4e-68a15e41569c	14	Bed management	1000.00	50.00	500.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:38:29.189646	2026-01-02 17:38:29.189646
72	2a4bb576-a63c-4540-920c-8b788e486dce	14	Cafeteria/diet kitchen	1000.00	20.00	200.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:38:29.189646	2026-01-02 17:38:29.189646
73	3262170d-1a47-4aac-9453-a32291c291a7	14	Consultation service	1000.00	15.00	150.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:38:29.189646	2026-01-02 17:38:29.189646
74	d59c2154-e37f-4e73-abdf-092e70bde863	14	Dialysis	1000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:38:29.189646	2026-01-02 17:38:29.189646
75	6f528d29-3ff9-4259-a152-23a077df4614	14	Insurance/TPA processing	1000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:38:29.189646	2026-01-02 17:38:29.189646
76	92881b44-2874-4681-8fec-96fb1349059b	15	Bed management	5000.00	50.00	2500.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:38:29.189646	2026-01-02 17:38:29.189646
77	a5bc81ed-06dd-4fc6-944b-43f445bff4d2	15	Cafeteria/diet kitchen	1000.00	20.00	200.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:38:29.189646	2026-01-02 17:38:29.189646
78	7041feb0-2730-4c52-9bb4-223d93527c28	15	Consultation service	8000.00	15.00	1200.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:38:29.189646	2026-01-02 17:38:29.189646
79	449c4c00-cf1f-47d4-8d16-a69d96965873	15	Dialysis	18000.00	0.00	0.00	\N	Active	acc1kashi	acc1kashi	2026-01-02 17:38:29.189646	2026-01-02 17:38:29.189646
80	3146fdd9-79a0-49ce-aa14-9ca30bfe7c2b	16	Bed management	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:03:48.788158	2026-01-08 13:03:48.788158
81	77ff82ed-85b4-4539-9a25-530244250e18	16	Cafeteria/diet kitchen	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:03:48.788158	2026-01-08 13:03:48.788158
82	8a0e68a0-b242-4937-ab23-53d8182cbab8	16	Consultation service	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:03:48.788158	2026-01-08 13:03:48.788158
83	6e072b64-2f47-4d92-a998-df5074256ccc	16	Dialysis	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:03:48.788158	2026-01-08 13:03:48.788158
84	27b74ffb-8929-4feb-b229-5def40da4f9f	16	Insurance/TPA processing	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:03:48.788158	2026-01-08 13:03:48.788158
85	97fc3ca5-d757-44cd-8d70-3fceaac86e50	17	Bed management	5000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:03:48.788158	2026-01-08 13:03:48.788158
86	dcc37c4f-ecce-4d1b-8401-3d03fa694e77	17	Cafeteria/diet kitchen	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:03:48.788158	2026-01-08 13:03:48.788158
87	5c4bc150-c2f1-40b5-a86d-140f4511dad2	17	Consultation service	8000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:03:48.788158	2026-01-08 13:03:48.788158
88	969cb3fc-a405-4567-8006-464adb4a9614	17	Dialysis	18000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:03:48.788158	2026-01-08 13:03:48.788158
89	d7d9e700-1851-43e4-b36c-11b0e06d9dc3	18	Bed management	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:05:19.103333	2026-01-08 13:05:19.103333
90	d368a5c8-1404-405e-898e-6b3ce235b0db	18	Cafeteria/diet kitchen	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:05:19.103333	2026-01-08 13:05:19.103333
91	b639ba26-3d84-4549-a4bc-7bc83a264e33	18	Consultation service	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:05:19.103333	2026-01-08 13:05:19.103333
92	d089cc03-5680-4947-821a-b6c98e7ce1fd	18	Dialysis	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:05:19.103333	2026-01-08 13:05:19.103333
93	b0216855-6187-4ab6-873d-a29f41aa0e33	18	Insurance/TPA processing	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:05:19.103333	2026-01-08 13:05:19.103333
94	093b4bbe-bd00-4300-a1bf-1523e56521a4	19	Bed management	5000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:05:19.103333	2026-01-08 13:05:19.103333
95	36902236-ce66-4fa7-8927-d0e81599fac4	19	Cafeteria/diet kitchen	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:05:19.103333	2026-01-08 13:05:19.103333
96	aa94c87b-2be6-4e9a-ac25-abd7d9f1daee	19	Consultation service	8000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:05:19.103333	2026-01-08 13:05:19.103333
97	9f4e75dd-62e2-46f3-aebd-cb9dd5797b94	19	Dialysis	18000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:05:19.103333	2026-01-08 13:05:19.103333
98	2a8851c2-d2f7-4b38-848c-a723ad427b02	20	Bed management	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:08:53.186523	2026-01-08 13:08:53.186523
99	3a9858ab-f457-4561-9150-5c7077095809	20	Cafeteria/diet kitchen	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:08:53.186523	2026-01-08 13:08:53.186523
100	d4c93f0e-bb15-44bc-a30a-88174ad4684c	20	Consultation service	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:08:53.186523	2026-01-08 13:08:53.186523
101	2cacc899-74bd-4f6f-9abb-53a5cfd35808	20	Dialysis	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:08:53.186523	2026-01-08 13:08:53.186523
102	b50b5ec8-56cb-4b31-ab44-54d452bc651c	20	Insurance/TPA processing	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:08:53.186523	2026-01-08 13:08:53.186523
103	95b939dc-37b3-4475-a902-0d77561b562a	21	Bed management	5000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:08:53.186523	2026-01-08 13:08:53.186523
104	cfb0ddc7-405f-4575-a024-de2c3b018655	21	Cafeteria/diet kitchen	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:08:53.186523	2026-01-08 13:08:53.186523
105	e04fa149-771c-4120-ae36-fcab5b6ba622	21	Consultation service	8000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:08:53.186523	2026-01-08 13:08:53.186523
106	9e9fa9aa-63c3-454e-a519-b765c66e502c	21	Dialysis	18000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 13:08:53.186523	2026-01-08 13:08:53.186523
107	403595bb-8175-4231-a79a-8757c0893e84	22	Bed management	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 14:16:49.313934	2026-01-08 14:16:49.313934
108	2dd1b246-332f-407f-9259-65d782d4184d	22	Cafeteria/diet kitchen	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 14:16:49.313934	2026-01-08 14:16:49.313934
109	557a18e1-001d-4ee6-92f8-7071a2fb0daa	22	Consultation service	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 14:16:49.313934	2026-01-08 14:16:49.313934
110	64822a93-27d6-4092-b18f-16330c9e5f1a	22	Dialysis	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 14:16:49.313934	2026-01-08 14:16:49.313934
111	430905a0-ea0b-4bb8-981f-8ad3c0ffefbf	22	Insurance/TPA processing	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 14:16:49.313934	2026-01-08 14:16:49.313934
112	2e6fbc2d-0513-4b7b-af39-5ac0301f5635	23	Bed management	5000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 14:16:49.313934	2026-01-08 14:16:49.313934
113	00cc5602-1a8b-4571-b3dd-f33e9e3e4514	23	Cafeteria/diet kitchen	1000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 14:16:49.313934	2026-01-08 14:16:49.313934
114	8356062f-417d-413b-9be1-adcae604a405	23	Consultation service	8000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 14:16:49.313934	2026-01-08 14:16:49.313934
115	52c7289b-a8e9-4807-8a2e-650ffc7e3a04	23	Dialysis	18000.00	0.00	0.00	\N	Active	accountantkaveri	accountantkaveri	2026-01-08 14:16:49.313934	2026-01-08 14:16:49.313934
\.


--
-- TOC entry 5962 (class 0 OID 20562)
-- Dependencies: 288
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
8	37b69f61-5c1a-44da-ad2a-a91950e4de9f	7	bobby	IPD	nuro	Pradeep	KMS89473h	cash	2150.00	Active	accountatnnano	accountatnnano	2025-12-18 13:20:27.99304	2025-12-18 13:20:27.99304
9	35dc3e83-5a7d-468a-8f23-91742e92c1d2	7	havish	ipd	nuro	Pradeep	KMS89473h	Insurance	500.00	Active	accountatnnano	accountatnnano	2025-12-18 13:20:27.99304	2025-12-18 13:20:27.99304
10	8f12fc40-2a8d-4215-905a-7803f571a503	8	John Doe	IPD	Cardiology	Dr. h1	MCI-12345	Cash	0.00	Active	acc1kashi	acc1kashi	2026-01-02 17:34:10.772751	2026-01-02 17:34:10.772751
11	a045ddd2-5b41-4b01-a85e-338c4633feb5	8	Jasmine	IPD	Neurology	Dr. h1	MCI-12345	Cash	0.00	Active	acc1kashi	acc1kashi	2026-01-02 17:34:10.772751	2026-01-02 17:34:10.772751
12	9bd79556-ccf0-446d-9e16-fca9273bee0d	9	John Doe	IPD	Cardiology	Dr. h1	MCI-12345	Cash	0.00	Active	acc1kashi	acc1kashi	2026-01-02 17:35:54.599753	2026-01-02 17:35:54.599753
13	bdc15b7a-63ad-4e89-b6ed-12d7bc3f017f	9	Jasmine	IPD	Neurology	Dr. h1	MCI-12345	Cash	0.00	Active	acc1kashi	acc1kashi	2026-01-02 17:35:54.599753	2026-01-02 17:35:54.599753
14	3097e912-a9f2-4965-b036-bd38a73e87ad	10	John Doe	IPD	Cardiology	Dr. h1	865	Cash	850.00	Active	acc1kashi	acc1kashi	2026-01-02 17:38:29.189646	2026-01-02 17:38:29.189646
15	acaeef4c-27d7-4298-867a-a2edc3eae5a2	10	Jasmine	IPD	Neurology	Dr. h1	865	Cash	3900.00	Active	acc1kashi	acc1kashi	2026-01-02 17:38:29.189646	2026-01-02 17:38:29.189646
16	0131251f-068f-41b0-a316-345646445956	11	John Doe	IPD	Cardiology	Dr. Jennifer	87766647	Cash	0.00	Active	accountantkaveri	accountantkaveri	2026-01-08 13:03:48.788158	2026-01-08 13:03:48.788158
17	e5353587-9954-4ec5-8fa2-226ca437c697	11	Jasmine	IPD	Neurology	Dr. Jennifer	87766647	Cash	0.00	Active	accountantkaveri	accountantkaveri	2026-01-08 13:03:48.788158	2026-01-08 13:03:48.788158
18	de9e39c3-c89f-4c53-a5ea-9d1e36f400e1	12	John Doe	IPD	Cardiology	Dr. Jennifer	87766647	Cash	0.00	Active	accountantkaveri	accountantkaveri	2026-01-08 13:05:19.103333	2026-01-08 13:05:19.103333
19	7db933cd-2e1a-472f-bf1d-d6c724ed4ba7	12	Jasmine	IPD	Neurology	Dr. Jennifer	87766647	Insurance	0.00	Active	accountantkaveri	accountantkaveri	2026-01-08 13:05:19.103333	2026-01-08 13:05:19.103333
20	3e9c701a-4321-4ac3-957d-bb2bf29f7c49	13	John Doe	IPD	Cardiology	Dr. Jennifer	87766647	Cash	0.00	Active	accountantkaveri	accountantkaveri	2026-01-08 13:08:53.186523	2026-01-08 13:08:53.186523
21	c904dcac-4eb3-4c20-9e02-33f0a319f164	13	Jasmine	IPD	Neurology	Dr. Jennifer	87766647	Insurance	0.00	Active	accountantkaveri	accountantkaveri	2026-01-08 13:08:53.186523	2026-01-08 13:08:53.186523
22	b67b1b09-4537-48c1-b05c-5a35eb8ca165	14	John Doe	IPD	Cardiology	Dr. Jennifer	809	Cash	0.00	Active	accountantkaveri	accountantkaveri	2026-01-08 14:16:49.313934	2026-01-08 14:16:49.313934
23	5b2377f3-5135-4f4d-80cb-b94d32adf0fa	14	Jasmine	IPD	Neurology	Dr. Jennifer	809	Insurance	0.00	Active	accountantkaveri	accountantkaveri	2026-01-08 14:16:49.313934	2026-01-08 14:16:49.313934
\.


--
-- TOC entry 5964 (class 0 OID 20575)
-- Dependencies: 290
-- Data for Name: referral_payment_upload_batch; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referral_payment_upload_batch (id, uuid, hospital_id, branch_id, file_name, total_records, total_amount, status, created_by, updated_by, created_at, updated_at) FROM stdin;
1	94e9c8ed-1071-4177-94d7-a29b881bee5a	6	1	debug_test.xlsx	1	0.00	Active	1	1	2025-12-18 01:58:15.104499	2025-12-18 01:58:15.104499
2	d7f5b13d-df17-43bb-82bc-ad87a50a4ee8	10	12	Referral_Payment_Template (3).xlsx	1	0.00	Active	kvAccountant	kvAccountant	2025-12-18 01:58:48.763218	2025-12-18 01:58:48.763218
3	e0810a07-8756-4a0a-aec9-7b6790180640	10	12	Referral_Payment_Template (3).xlsx	1	0.00	Active	kvAccountant	kvAccountant	2025-12-18 02:02:22.814691	2025-12-18 02:02:22.814691
4	802c12b8-f45c-44d4-a183-a1313699db1a	39	46	Referral_Payment_Template (5).xlsx	1	0.00	Active	acccountantcamry	acccountantcamry	2025-12-18 08:50:19.210285	2025-12-18 08:50:19.210285
5	b1e3aedb-662e-4c91-b339-9e800eec8d5f	39	46	Referral_Payment_Template (5).xlsx	1	1300.00	Active	acccountantcamry	acccountantcamry	2025-12-18 09:03:09.025968	2025-12-18 09:03:09.025968
6	8f6391ef-88fc-4066-ac75-8c4174bc5579	39	46	Referral_Payment_Template.xlsx	2	25800.00	Active	acccountantcamry	acccountantcamry	2025-12-18 10:55:42.855291	2025-12-18 10:55:42.855291
7	b969c22c-ac50-433c-baa4-07ebcff72dce	40	47	Referral_Payment_Template (1).xlsx	2	2650.00	Active	accountatnnano	accountatnnano	2025-12-18 13:20:27.99304	2025-12-18 13:20:27.99304
8	8c2f1eec-487b-4aa0-b9b7-4680cbdd3b91	42	49	Referral_Payment_Template.xlsx	2	0.00	Active	acc1kashi	acc1kashi	2026-01-02 17:34:10.772751	2026-01-02 17:34:10.772751
9	3df1104f-fb38-487f-92d4-bdfe53bcaec1	42	49	Referral_Payment_Template.xlsx	2	0.00	Active	acc1kashi	acc1kashi	2026-01-02 17:35:54.599753	2026-01-02 17:35:54.599753
10	7be75e22-600e-477d-9c88-6bfb1571b5ea	42	49	Referral_Payment_Template.xlsx	2	4750.00	Active	acc1kashi	acc1kashi	2026-01-02 17:38:29.189646	2026-01-02 17:38:29.189646
11	67d51aa3-f49b-45e7-8fe1-8236d611a3f0	45	53	Referral_Payment_Template.xlsx	2	0.00	Active	accountantkaveri	accountantkaveri	2026-01-08 13:03:48.788158	2026-01-08 13:03:48.788158
12	4ab13a3d-0f44-41bc-b7fe-f885a0526eeb	45	53	Referral_Payment_Template.xlsx	2	0.00	Active	accountantkaveri	accountantkaveri	2026-01-08 13:05:19.103333	2026-01-08 13:05:19.103333
13	2bb5c867-719c-4037-8480-185911ad3814	45	53	Referral_Payment_Template.xlsx	2	0.00	Active	accountantkaveri	accountantkaveri	2026-01-08 13:08:53.186523	2026-01-08 13:08:53.186523
14	18098d6b-2674-4598-866d-6c4a6be8588b	45	53	Referral_Payment_Template.xlsx	2	0.00	Active	accountantkaveri	accountantkaveri	2026-01-08 14:16:49.313934	2026-01-08 14:16:49.313934
\.


--
-- TOC entry 5966 (class 0 OID 20591)
-- Dependencies: 292
-- Data for Name: referral_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referral_payments (payment_id, uuid, referral_doctor_id, hosp_service_id, service_code, service_name, service_amount, referral_percentage, referral_amount, gst_rate, gst_amount, total_payable, payment_status, payment_date, payment_mode, payment_reference, patient_id, billing_id, opd_id, remarks, created_by, updated_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5968 (class 0 OID 20611)
-- Dependencies: 294
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
-- TOC entry 5970 (class 0 OID 20623)
-- Dependencies: 296
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
-- TOC entry 5972 (class 0 OID 20636)
-- Dependencies: 298
-- Data for Name: shift_branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shift_branches (shift_hospital_id, shift_id, branch_id, is_active, created_at) FROM stdin;
\.


--
-- TOC entry 5974 (class 0 OID 20645)
-- Dependencies: 300
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shifts (shift_id, shift_name, shift_code, start_time, end_time, duration_hours, shift_type, description, is_active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5976 (class 0 OID 20661)
-- Dependencies: 302
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff (staff_id, user_id, first_name, last_name, staff_code, gender, date_of_birth, contact_number, email, address, city, state, pincode, qualification, staff_type, emergency_contact_name, emergency_contact_number, aadhar_number, profile_photo, is_active, created_at, updated_at) FROM stdin;
2	5	Madhu		STF242596	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-04 11:34:02.498301	2025-12-04 11:34:02.498301
3	6	Alice	Johnson	STF061548	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-04 12:21:01.453672	2025-12-04 12:21:01.453672
4	7	Bob	Smith	STF150013	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-04 12:22:29.912709	2025-12-04 12:22:29.912709
5	24	aefwegf	wgr	REC248382	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-04 13:14:08.383023	2025-12-04 13:14:08.383023
6	26	utdtgc		STF630243	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-04 14:43:50.165074	2025-12-04 14:43:50.165074
7	27	wef	awrte	ADM097332	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-04 15:08:17.271567	2025-12-04 15:08:17.271567
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
58	141	admin	nano	STF898343	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-18 12:08:17.67229	2025-12-18 12:08:17.67229
59	143	receptionist	nano	REC161881	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2025-12-18 12:12:41.883882	2025-12-18 12:12:41.883882
60	144	marketing 	exec1	MRK210273	\N	\N	\N	\N	\N	\N	\N	\N	\N	MRKT_EXEC	\N	\N	\N	\N	t	2025-12-18 12:13:29.924717	2025-12-18 12:13:29.924717
61	145	market	manager	MRK258381	\N	\N	\N	\N	\N	\N	\N	\N	\N	MRKT_MNGR	\N	\N	\N	\N	t	2025-12-18 12:14:18.046555	2025-12-18 12:14:18.046555
62	146	acct	nano	ACC338286	\N	\N	\N	\N	\N	\N	\N	\N	\N	Accountant	\N	\N	\N	\N	t	2025-12-18 12:15:37.947782	2025-12-18 12:15:37.947782
63	147	acct	manager	AM384977	\N	\N	\N	\N	\N	\N	\N	\N	\N	Accountant Manager	\N	\N	\N	\N	t	2025-12-18 12:16:24.645492	2025-12-18 12:16:24.645492
8	28	hoho	Madhumitha	ADM625363	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2025-12-04 15:17:05.29374	2025-12-23 11:43:20.601677
64	149	admin1		STF344400	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2026-01-02 16:09:04.300273	2026-01-02 16:09:04.300273
65	152	recep1	kashi	REC747481	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2026-01-02 16:15:47.482843	2026-01-02 16:15:47.482843
66	153	marketing	manager	MRK805424	\N	\N	\N	\N	\N	\N	\N	\N	\N	MRKT_EXEC	\N	\N	\N	\N	t	2026-01-02 16:16:45.345756	2026-01-02 16:16:45.345756
67	154	marketexec1	kashi	MRK884819	\N	\N	\N	\N	\N	\N	\N	\N	\N	MRKT_MNGR	\N	\N	\N	\N	t	2026-01-02 16:18:04.66752	2026-01-02 16:18:04.66752
68	155	acc1	kashi	ACC943316	\N	\N	\N	\N	\N	\N	\N	\N	\N	Accountant	\N	\N	\N	\N	t	2026-01-02 16:19:03.224386	2026-01-02 16:19:03.224386
69	157	accm1	kashi	AM998435	\N	\N	\N	\N	\N	\N	\N	\N	\N	Accountant Manager	\N	\N	\N	\N	t	2026-01-02 16:19:58.335328	2026-01-02 16:19:58.335328
70	158	admin		STF967080	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2026-01-02 16:52:46.758205	2026-01-02 16:52:46.758205
71	159	hp	np	REC465361	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2026-01-02 17:01:05.362359	2026-01-02 17:01:05.362359
72	160	admin1kalyan		STF925247	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2026-01-07 12:08:44.692563	2026-01-07 12:08:44.692563
73	163	receptionist	kalyan	REC170057	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2026-01-07 12:12:50.058595	2026-01-07 12:12:50.058595
74	164	marketing	exec	MRK211874	\N	\N	\N	\N	\N	\N	\N	\N	\N	MRKT_EXEC	\N	\N	\N	\N	t	2026-01-07 12:13:31.763002	2026-01-07 12:13:31.763002
75	165	accounts	exec	ACC257045	\N	\N	\N	\N	\N	\N	\N	\N	\N	Accountant	\N	\N	\N	\N	t	2026-01-07 12:14:16.896687	2026-01-07 12:14:16.896687
76	168	acounts	kalyanhospital	ACC317213	\N	\N	\N	\N	\N	\N	\N	\N	\N	Accountant	\N	\N	\N	\N	t	2026-01-07 12:15:17.130952	2026-01-07 12:15:17.130952
77	169	Kaveri	Admin1	STF214560	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2026-01-07 16:56:54.292284	2026-01-07 16:56:54.292284
78	170	Receptionist	Kaveri	REC245455	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2026-01-08 11:34:05.457584	2026-01-08 11:34:27.627614
79	171	receptionist2	Kaveri	REC362862	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2026-01-08 11:36:02.865205	2026-01-08 11:36:02.865205
80	172	marketing	executive	MRK653328	\N	\N	\N	\N	\N	\N	\N	\N	\N	MRKT_EXEC	\N	\N	\N	\N	t	2026-01-08 11:40:53.116827	2026-01-08 11:40:53.116827
81	174	Accountant	Kaveri	ACC833555	\N	\N	\N	\N	\N	\N	\N	\N	\N	Accountant	\N	\N	\N	\N	t	2026-01-08 11:43:53.331693	2026-01-08 11:43:53.331693
82	177	Vibin		STF074788	\N	\N	\N	\N	\N	\N	\N	\N	\N	ADMIN	\N	\N	\N	\N	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
83	180	Geetha	G	REC948519	\N	\N	\N	\N	\N	\N	\N	\N	\N	RECEPTIONIST	\N	\N	\N	\N	t	2026-01-20 12:55:48.520527	2026-01-20 12:55:48.520527
\.


--
-- TOC entry 5977 (class 0 OID 20675)
-- Dependencies: 303
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
61	58	47	\N	\N	Permanent	\N	\N	t	2025-12-18 12:08:17.67229	2025-12-18 12:08:17.67229
62	59	47	\N	\N	Permanent	\N	\N	t	2025-12-18 12:12:41.88786	2025-12-18 12:12:41.88786
63	60	47	\N	\N	Permanent	\N	\N	t	2025-12-18 12:13:29.924717	2025-12-18 12:13:29.924717
64	61	47	\N	\N	Permanent	\N	\N	t	2025-12-18 12:14:18.046555	2025-12-18 12:14:18.046555
65	62	47	\N	\N	Permanent	\N	\N	t	2025-12-18 12:15:37.947782	2025-12-18 12:15:37.947782
66	63	47	\N	\N	Permanent	\N	\N	t	2025-12-18 12:16:24.645492	2025-12-18 12:16:24.645492
67	64	49	\N	\N	Permanent	\N	\N	t	2026-01-02 16:09:04.300273	2026-01-02 16:09:04.300273
68	65	49	\N	\N	Permanent	\N	\N	t	2026-01-02 16:15:47.485155	2026-01-02 16:15:47.485155
69	66	49	\N	\N	Permanent	\N	\N	t	2026-01-02 16:16:45.345756	2026-01-02 16:16:45.345756
70	67	49	\N	\N	Permanent	\N	\N	t	2026-01-02 16:18:04.66752	2026-01-02 16:18:04.66752
71	68	49	\N	\N	Permanent	\N	\N	t	2026-01-02 16:19:03.224386	2026-01-02 16:19:03.224386
72	69	49	\N	\N	Permanent	\N	\N	t	2026-01-02 16:19:58.335328	2026-01-02 16:19:58.335328
73	70	51	\N	\N	Permanent	\N	\N	t	2026-01-02 16:52:46.758205	2026-01-02 16:52:46.758205
74	71	51	\N	\N	Permanent	\N	\N	t	2026-01-02 17:01:05.364237	2026-01-02 17:01:05.364237
75	72	52	\N	\N	Permanent	\N	\N	t	2026-01-07 12:08:44.692563	2026-01-07 12:08:44.692563
76	73	52	\N	\N	Permanent	\N	\N	t	2026-01-07 12:12:50.060519	2026-01-07 12:12:50.060519
77	74	52	\N	\N	Permanent	\N	\N	t	2026-01-07 12:13:31.763002	2026-01-07 12:13:31.763002
78	75	52	\N	\N	Permanent	\N	\N	t	2026-01-07 12:14:16.896687	2026-01-07 12:14:16.896687
79	76	52	\N	\N	Permanent	\N	\N	t	2026-01-07 12:15:17.130952	2026-01-07 12:15:17.130952
80	77	53	\N	\N	Permanent	\N	\N	t	2026-01-07 16:56:54.292284	2026-01-07 16:56:54.292284
81	78	54	\N	\N	Permanent	\N	\N	t	2026-01-08 11:34:05.462754	2026-01-08 11:34:05.462754
82	79	53	\N	\N	Permanent	\N	\N	t	2026-01-08 11:36:02.871047	2026-01-08 11:36:02.871047
83	80	53	\N	\N	Permanent	\N	\N	t	2026-01-08 11:40:53.116827	2026-01-08 11:40:53.116827
84	81	53	\N	\N	Permanent	\N	\N	t	2026-01-08 11:43:53.331693	2026-01-08 11:43:53.331693
85	81	54	\N	\N	Permanent	\N	\N	t	2026-01-08 11:43:53.331693	2026-01-08 11:43:53.331693
86	82	55	\N	\N	Permanent	\N	\N	t	2026-01-20 12:07:54.34217	2026-01-20 12:07:54.34217
87	83	55	\N	\N	Permanent	\N	\N	t	2026-01-20 12:55:48.522082	2026-01-20 12:55:48.522082
\.


--
-- TOC entry 5980 (class 0 OID 20688)
-- Dependencies: 306
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
361	1	46fa911244af72c9f0a59ba79105ba048c122c26eddc833a66aa033a4687b0f8	343fedc170bacd3ea2b455641aff38dceb112bb801e2d3b1bd676e82db16bb04	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 19:33:24	2026-01-17 19:33:24	t	2025-12-18 19:33:24.208238	2025-12-18 19:33:24.208238
362	1	f0c7f26794fdcc3fbd5287f1be82ee87089139708e34a2d8a132d60702aefb35	f374038777e1518d88e98dbaf3364b17251825f9973bfbc1eabc4afd52858d59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-26 14:40:28	2026-01-18 14:40:28	t	2025-12-19 14:40:28.200755	2025-12-19 14:40:28.200755
333	1	a0cf8f235589984117a56d9f28ea17bf540e859497d7b5990e400934d4d2f1e8	0d0bd268f51382bf46b17df20a0b6b1469485c6b1b01cb1833a8dc9531dcd2c1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-24 23:45:03	2026-01-16 23:45:03	t	2025-12-17 23:45:03.556601	2025-12-17 23:45:03.556601
347	139	12311ffa805cb123415540bbd01f1b4cc9c9982ffb2f031dfa835ff61aa1a319	b877f096df872ecc801ad0e6c7ed0232cd6c23efb1afcde26378f7037fe9b309	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 08:40:53	2026-01-17 08:40:53	t	2025-12-18 08:40:53.611832	2025-12-18 08:40:53.611832
363	1	9e9007d7bcee9008dfcaed969685ebf77c537f50edc87bd51ab1b11dae0b0ff3	ed16741e6f0f2fede8a42307111b1960680f3873e3b7e5e4133e719e8bac410c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-26 15:42:50	2026-01-18 15:42:50	t	2025-12-19 15:42:50.018936	2025-12-19 15:42:50.018936
334	132	84ef156cbdb51593083713bd33815ca8a2ecdbb190e198c2d7025955b72382be	2d3a5b9b7b35b81a743dd94f4d1f912475c4cd571b1e9f9baf4d7b9292cdea13	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-24 23:46:36	2026-01-16 23:46:36	t	2025-12-17 23:46:36.212548	2025-12-17 23:46:36.212548
348	1	8195a519e038c484f9b3bf05b0f51d79e7dce1974dd4a7a9a4f1a09e96a1bfd7	e55d98df7ab652dc53bc12c7c5737248deb5901f5403afda3e2c977013edeff5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 10:04:13	2026-01-17 10:04:13	t	2025-12-18 10:04:13.519515	2025-12-18 10:04:13.519515
364	1	2324b51755b8fcefd809e6c88cd8cc62460f66082bc8bcbd264b5806caa0cc9c	c8faf709dac826973039f8d4beeb0067d586031a78be64da198ba19887f6f98c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-26 15:59:24	2026-01-18 15:59:24	t	2025-12-19 15:59:24.778238	2025-12-19 15:59:24.778238
335	1	68eb5e9501d98cfe35e161997cf5b1721b7dd957f7cf55b434f3d8c57741c523	79397b12de85a0bd34ad529ae64f67f524c99a6b4f42087764ca21d07de370a9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 00:13:19	2026-01-17 00:13:19	t	2025-12-18 00:13:19.031382	2025-12-18 00:13:19.031382
349	139	b09896a502079e1be375f5a4e691f8097560bfee983f5dc9f81e71e8ee35bae1	80bcc520a33b8f292a12498c8b5611589ca750dd38938db23029427c756e96e8	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 10:04:59	2026-01-17 10:04:59	t	2025-12-18 10:04:59.467345	2025-12-18 10:04:59.467345
365	1	979efe52d0776798b21a1e02400973e291bd5e5cd22ec0b43652e95501762757	336e0f34aa7376d48c05fd4120430d7c57a4018c912f8f2ee0247dcf95a598e4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-26 16:09:11	2026-01-18 16:09:11	t	2025-12-19 16:09:11.864586	2025-12-19 16:09:11.864586
336	133	63315706103c1146ea30aba89467b8ca5096515bf643632e2d124e1a2973d166	d90fb7845eb8dc35cc1286093e2352da9bd217367e8707dd35296cb84ba83297	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 00:14:28	2026-01-17 00:14:28	t	2025-12-18 00:14:28.978794	2025-12-18 00:14:28.978794
350	139	7975ea056e60c2d2a1bf2fda7289dd8b6cd9edc73a51f3268371b77aabbbb82c	cfab7a8873751f9890c62a13352b789ac5f7b5477a23d6caf995e9583ab0804f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 10:51:35	2026-01-17 10:51:35	t	2025-12-18 10:51:35.395372	2025-12-18 10:51:35.395372
366	144	19355802ac1560592e02a154b003f858549cedaee8057e5c09de9e97326f2918	f01f829a45d602972d781886446dd713b7d6b45eab1233a929ee373b182abaf9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-26 16:31:29	2026-01-18 16:31:29	t	2025-12-19 16:31:29.671253	2025-12-19 16:31:29.671253
337	133	5e5f0e965e801358276116c208b9d78583b71764b0d7e0069c88270a8099e155	80fdecba2445f5ed631654858e841c508136d7c6756ca3d696610b2571e285f4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 00:34:45	2026-01-17 00:34:45	t	2025-12-18 00:34:45.942379	2025-12-18 00:34:45.942379
351	140	1fba655f256e251ced112839182556f9891d80dc1591b9962c23c86551109ff4	e3e383b065459e8e52ad30145e46197bc37dd419085a659f49d7a118c5a85e69	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 10:57:52	2026-01-17 10:57:52	t	2025-12-18 10:57:52.765297	2025-12-18 10:57:52.765297
352	137	008cd4f1134604d6b5059c8138ff926ccc910acbd1920b2494bd937d653dab9c	20d9ae0148e8e37f37f8a7ccad870029619d9a5e165a35c7f06df17eba6469b4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 10:58:20	2026-01-17 10:58:20	t	2025-12-18 10:58:20.555149	2025-12-18 10:58:20.555149
367	1	c5cc4c4028faa0881cb50e9e4bac7340f70013545d70828165bd0047a965a35f	29bf26b745637f3347d6fd05074bfee54fddf838c79cc7a94ad19aeb8374e096	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-26 16:32:37	2026-01-18 16:32:37	t	2025-12-19 16:32:37.827679	2025-12-19 16:32:37.827679
338	1	504888a8de2aef76ecdedf6d6297440f7a4e868d75a112a88365969109d1aa3d	ed4a31fe6e59127e7fc1c4c3ff7d06dedb963b19c7984b57ad4cf667cedb23af	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 00:36:12	2026-01-17 00:36:12	t	2025-12-18 00:36:12.64618	2025-12-18 00:36:12.64618
353	1	6aace48540b3c91a4f4697869caf4c9466712a2015081f3043e3519418291034	23d5a9b1ff3f38ff3878668bf3f1238192811db50df4ce91a58f83573d5abc5e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 12:01:35	2026-01-17 12:01:35	t	2025-12-18 12:01:35.567464	2025-12-18 12:01:35.567464
368	1	e8f25e6dc77dd52dc738b2b1d53ec75d0bb4c8367c1262ff47ab3f90b08edd49	6421fa9069dc44b1a1865bdcb60aae6ae7b43d4f539727466e8f43d5092b8952	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-26 16:54:06	2026-01-18 16:54:06	t	2025-12-19 16:54:06.278415	2025-12-19 16:54:06.278415
339	1	25096410cba5b34880c8cc30498efb02fa7e6edb6a9dc5c0603f63b1cd8b2602	254d8efe8caaf9c5512c122ea8ada220f997875b4a5fc16ec251adede6401748	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 01:22:35	2026-01-17 01:22:35	t	2025-12-18 01:22:35.206258	2025-12-18 01:22:35.206258
354	141	4bdf390632ad1f19eff4a6ff0f89c94ab5e2f214a8b0728abba3433dd03c13be	ccd3efa2797eabaea289fb99e8d33df9da32e7c3487e80bacf065f8e904470e4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 12:17:19	2026-01-17 12:17:19	t	2025-12-18 12:17:19.138268	2025-12-18 12:17:19.138268
369	1	3ce743349fc9d4bb5c07a6630bf27007006a64c71dcc02db7b4f100bfbe51ca5	148ef4a3ad165d4cc5cb9faf8680f4eacbae3a63a9d3f7f02d6ea905632bcd55	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-26 17:45:39	2026-01-18 17:45:39	t	2025-12-19 17:45:39.607912	2025-12-19 17:45:39.607912
340	133	070dacaa8d4fa64b18d4071b722338ed06be1a9b733c10b805767d23d2d3606e	6de1737cac3dd7e8892d27bae716313823a3f19079d399159b1071d664dab030	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 01:23:07	2026-01-17 01:23:07	t	2025-12-18 01:23:07.936281	2025-12-18 01:23:07.936281
355	143	a108e19dd0b5f499ce16cfd2daaa94febcdd8bf1ea48f71e29dc86f8ea48a1d3	c4b560a70d2bd383c5a90110726d48b3a3c8b74bee29c37186395c802af253e6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 12:18:10	2026-01-17 12:18:10	t	2025-12-18 12:18:10.166851	2025-12-18 12:18:10.166851
370	143	3716b2e9dcb1f18b0768b104bf50fae443e0c41a186ab2b61de58986ae314128	61dc3deec49b3d63d614c57abb4fb63d84102c61c6ba11e08d08aaeb1aabb848	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-26 17:50:23	2026-01-18 17:50:23	t	2025-12-19 17:50:23.015245	2025-12-19 17:50:23.015245
341	133	895fc1b031de7ca449b560d799d22f33565586f021a9fb4cd63c6f0af912c243	52baebd14b09d1cc8d856835000274b706752367ffa96b924c7c32c2eea37d99	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 02:00:40	2026-01-17 02:00:40	t	2025-12-18 02:00:40.494904	2025-12-18 02:00:40.494904
356	141	16bbf76378a1ea61ffab3692bf8e8742403b894255f816de08a52bbb009a8e6a	4c2e1241c922a3837b9d2739a531ae60ceaa7f6fa5f119d05841a81b9e57ce17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 12:20:27	2026-01-17 12:20:27	t	2025-12-18 12:20:27.46271	2025-12-18 12:20:27.46271
371	143	38b684af102d055f75020eb1a1d9fe4baf37712638a3ea78e7ffbddef314b503	e9db868276656e0e3c8b363a5d6acf5bf9e79e518cf1c02e5556c20be4d76148	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-26 18:39:35	2026-01-18 18:39:35	t	2025-12-19 18:39:35.579794	2025-12-19 18:39:35.579794
342	1	fa61a3e885c26f50ad05019fe56323f1f4566fb71a1cdac36728e7abec8fcfd8	1edb554726f11d2831a2e8b968637bf9a4219d26de121ba25d2faa6911db1ec6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 06:59:50	2026-01-17 06:59:50	t	2025-12-18 06:59:50.008014	2025-12-18 06:59:50.008014
357	143	de29b8786dbd8160e863679909c0a72281f4250b898dd30954430544523ca318	8f226adce5589d91c154ca9d69628d916df517d631a81e14e4b62940c1bb6b75	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 12:28:07	2026-01-17 12:28:07	t	2025-12-18 12:28:07.542441	2025-12-18 12:28:07.542441
372	144	6c66832e298292faf23f6b79a563d7541a31ee32af3b12881b31814bfc6bebe1	b4c0071b449343a6b7baf5c0a750999640e582568aa2ab9ff512851b44d17e11	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-26 18:41:34	2026-01-18 18:41:34	t	2025-12-19 18:41:34.471375	2025-12-19 18:41:34.471375
343	134	f4c3d2cc9dc31bc22d6f51c906d85c7987d3895d42adddb7412b09c549f3bdb5	5bcd42121ca3d1c755bc4a5fcf90f64c2b5826f7e0418c937fd887aaa1a0e921	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 07:47:54	2026-01-17 07:47:54	t	2025-12-18 07:47:54.776551	2025-12-18 07:47:54.776551
358	142	690d161bd5537ebf39e35dcd29c0c5b67b967b7e3f70eb6ae467408737c37a44	6c68b4bf0090eca57f7d7cf569f03c1aa3f9c417b207a343c1fd777538aef71f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 12:34:47	2026-01-17 12:34:47	t	2025-12-18 12:34:47.079649	2025-12-18 12:34:47.079649
344	137	3e15839ad39e2b1dc72843172b70341abb94c2e0914d1a8078f34e6e953506bb	652377a99e07ffab22be388cfa86e3d7270f917d592f3a4902128f776104673f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 07:59:53	2026-01-17 07:59:53	t	2025-12-18 07:59:53.98449	2025-12-18 07:59:53.98449
359	144	300a2610296254ef9fb8817f4f68b9aa0c67f9d606ba89abe8508feab676a378	af895ce7f741016edb3fe54d32234927e569e8eb48619005c1fa05444cad4450	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:06:07	2026-01-17 13:06:07	t	2025-12-18 13:06:07.995157	2025-12-18 13:06:07.995157
345	139	9b8404432b65983224355776ffe602891e31c2012f3de5efe76552e055e2920d	93c9b8095faec51b6d9fa2f1283b4be30a41d2ddb4a937c9ff99b2c26230e0b8	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 08:03:35	2026-01-17 08:03:35	t	2025-12-18 08:03:35.704642	2025-12-18 08:03:35.704642
360	146	b10cf02ad31a8db372401d35dee62f784deaf44577deb88aea04cf173d5f7d9a	c01da8a07377081e50bd615aa626b4cb0fe11ad9bfdd269084c10a68a5f00189	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-25 13:09:27	2026-01-17 13:09:27	t	2025-12-18 13:09:27.338602	2025-12-18 13:09:27.338602
373	1	ccb0fd636a1d71b70c016eace714ebb5bdf84997e4a59c536d086062ff9e0f69	9e1e185d55cc9fc28ffbffdf8638c4b3668b22d208a47f1db6814984346ac90c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-29 16:33:16	2026-01-21 16:33:16	t	2025-12-22 16:33:16.728552	2025-12-22 16:33:16.728552
374	1	c7f6c6312a75902f87c7c277b1e0660ac10c743210a86e29fd5ff197e80cc2fb	a423d69887ac85a4fff22595ab686aa8f61c046aad324ea01aed8245c1e21a44	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-29 17:20:47	2026-01-21 17:20:47	t	2025-12-22 17:20:47.874706	2025-12-22 17:20:47.874706
377	1	b778be83d10dc9de876d81fa18d392bd8de9ba25dd84ef857118515a92884dce	8948094b21a11e03f1e16b56d9ca2657561401a31c56ed56170a180883080ac3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-30 10:29:36	2026-01-22 10:29:36	t	2025-12-23 10:29:36.67939	2025-12-23 10:29:36.67939
388	1	8dd3fa191c5844670587e9a666fcf365a0f3356113344e0f498624ab6d4d331f	36c55c173e93327715be01e64ff8b9d2a92474e3c0b28d82424c4ae49198784e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-09 16:05:28	2026-02-01 16:05:28	t	2026-01-02 16:05:28.533881	2026-01-02 16:05:28.533881
396	1	f4f178d6b71cb4af5109f7715ba288b298ddd21a37c0014c54126feab87002a2	6340755f0e90d32bff3f8c136829db2e446003bce4f909ab2cdeabf5ed084fa1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-14 11:45:44	2026-02-06 11:45:44	t	2026-01-07 11:45:44.529955	2026-01-07 11:45:44.529955
408	175	006bf04226da6754d8e2fd5fc414b719cc2929c7e4e3e54a274d83a9d45bfc66	3c004882156c3803482e6614f38680364e9276333fbe77426237c14f8b7de765	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-15 12:18:24	2026-02-07 12:18:24	t	2026-01-08 12:18:24.967161	2026-01-08 12:18:24.967161
375	30	d194ac6fd00aedab0a93da183a4f3d09f510855cb5a590d8954207a45220b543	b93502c920b900fbe64dfa41d05b502dde67edd0d491b82d650a699d9d37bad6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-29 17:31:40	2026-01-21 17:31:40	t	2025-12-22 17:31:40.042442	2025-12-22 17:31:40.042442
378	29	8eca4eaf430a156aacc7d0162d1d7dd521d0d917d61eab953a98f00bf61fe78c	1e420f885b8c1c224595927762ee026f032ab1d7df5a1a04b5d25de1f69f6e7e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-30 10:36:15	2026-01-22 10:36:15	t	2025-12-23 10:36:15.68826	2025-12-23 10:36:15.68826
389	159	a0b209ff60b64aca2930a15122026d05f442f3691c7eea24715464288dc33165	52150a1942db9e29691017fe38d3188663b3866e53f06015400db24358c02fc2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-09 17:01:14	2026-02-01 17:01:14	t	2026-01-02 17:01:14.684115	2026-01-02 17:01:14.684115
397	1	7cb9b36fd750695dce5b4fdf0564dbeed77415eb42a890f4dbf02f75c74e6b67	5505aa52b227c7f680abe1b5bf86177f9c3a533ac1fb064ae434a43a799b5359	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-14 12:01:09	2026-02-06 12:01:09	t	2026-01-07 12:01:09.9171	2026-01-07 12:01:09.9171
409	172	39994350ad9ef22aa91452af53c49a45cac1a33318c23b18098de71551501aa9	50183e96c4ea473f6e0798b11fa130fccf358b3ecfcce34bb4a8e74366388a40	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-15 12:36:41	2026-02-07 12:36:41	t	2026-01-08 12:36:41.331068	2026-01-08 12:36:41.331068
376	29	57455c1e5fb612150c631e28c206be0a0f68f6a5ef3e99b10e572064242ab414	616216a13d3fb636bbade910cc21d468da40f437d04d791483cb91a1323b30d9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-29 17:32:26	2026-01-21 17:32:26	t	2025-12-22 17:32:26.877192	2025-12-22 17:32:26.877192
379	30	2ccc79f23d4d24ec41a646354eab43eb66f427e9ef7a604c3760607a5b8a7dd3	b304177b6240f02af50e1ec9e3276ff1a2eca4dce436e4bd375d9013abc2a666	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-30 10:43:02	2026-01-22 10:43:02	t	2025-12-23 10:43:02.880188	2025-12-23 10:43:02.880188
390	152	184070f92b4bfa99df60e53e37ae30e9f4b90a0a789e8fbd79f1f3b1b1935ad2	d51fd026f3094d1d15d4cd5c0712ae0f3f3a5c223a88b9011721076f343e24a8	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-09 17:04:35	2026-02-01 17:04:35	t	2026-01-02 17:04:35.925223	2026-01-02 17:04:35.925223
398	1	44acee07db33bd44d5697ae28c444b8e646a7bf3f74a11acd860a46ca59d8257	536344c0719547d9470d3912c06f454a22ba1bb0bbdacb490d143598fffe2aef	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-14 12:02:43	2026-02-06 12:02:43	t	2026-01-07 12:02:43.763001	2026-01-07 12:02:43.763001
410	174	096038d1be240cce8129745ce54a8a7139d45dc118f6354425efdf0b7cdc1b2c	a0f2513c5ec4748cea17c4daaa4f0b852f004a1783de5a24151b054190066cac	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-15 12:56:55	2026-02-07 12:56:55	t	2026-01-08 12:56:55.411449	2026-01-08 12:56:55.411449
411	174	a613887efeb4644d99c8a501a9f8fbd3ce15fd2b8aabd9d3bea4e2fbbb9181ef	9ef007ffa203324be73aad11ddef3a35cc6863aa9f077624242021d45b9e116b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-15 12:56:59	2026-02-07 12:56:59	t	2026-01-08 12:56:59.862806	2026-01-08 12:56:59.862806
380	1	7425e99f2fe13e49962462e463aeedb20687b351bbfc5e2ed1a52bc5089fbc45	d46e7229f88feeec7d57b9fd4139e758c66b000efd10cb17caeabd8b363e6f45	axios/1.13.2	::1	axios/1.13.2	2025-12-30 11:11:02	2026-01-22 11:11:02	t	2025-12-23 11:11:02.509837	2025-12-23 11:11:02.509837
391	151	fdfeaaf7bb863e670c1ad8e12eef34811363884cfe6930441b0fe07fd8475c50	153a99aebc72fef7f3ee20d7bffb54d3fc467ac91696a72cfeead822be1f718f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-09 17:08:28	2026-02-01 17:08:28	t	2026-01-02 17:08:28.418494	2026-01-02 17:08:28.418494
399	1	158f8caf16edd3c7a7772987c79bbde1ee199a5e126ec59881fcba368ea17b4a	cf06b7b84a6daf45e55c6a07300f8905df7ac1ced44dbd7e01bd0e5355549327	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-14 12:06:02	2026-02-06 12:06:02	t	2026-01-07 12:06:02.820722	2026-01-07 12:06:02.820722
400	1	d92a13c33087b6e6a89c33c5e0e88ffa47b2abab6f693f11e8c7e688b3697f50	8d54578a2e485540f57d941d9f80a4f937b8ef48b1199b077afaeecb4b391c96	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-14 12:07:12	2026-02-06 12:07:12	t	2026-01-07 12:07:12.534733	2026-01-07 12:07:12.534733
412	172	e2c1db4c271ef0ddb1dbd943dcbb9a6d1313f32d0f0ba830bcad29c3bc74b813	4c57040626902764f0cb1670d802b973bfce644765896af3eeae04318050dfe4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-15 13:10:03	2026-02-07 13:10:03	t	2026-01-08 13:10:03.507285	2026-01-08 13:10:03.507285
381	144	2a6252f0b9c6e71b65fb0e47e6fc9aa38c4f550f99611edda7851da56c278985	6c3eaa49b67793fc760a670c3bd357676669a112e45ff2ab9419377f762a2103	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-30 11:51:52	2026-01-22 11:51:52	t	2025-12-23 11:51:52.930391	2025-12-23 11:51:52.930391
392	149	b16549a0b8f86e2490366230543789f57c6359a47aa71f4a29164ffd86c79164	962624690504c86f61a183ec5bb1c4f4e165413955d6f613b8f061b2544dbda8	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-09 17:14:43	2026-02-01 17:14:43	t	2026-01-02 17:14:43.270094	2026-01-02 17:14:43.270094
401	163	0f262d6e25c9f8280e9295cf3d9c7701596e0aa072449d2dcc970e4f8b95c34d	96fc33d2815381e821534456a27430f86826ea555c2f7124396227480f42328f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-14 12:16:28	2026-02-06 12:16:28	t	2026-01-07 12:16:28.515838	2026-01-07 12:16:28.515838
413	174	6eadbc57dda260063475948a6b0c44a1c336e8447ab46610e86ef38398bca6c4	98fa4bab4c603d59413c92ed8cea7192747e9c88c6e05c5abccd68220f512bba	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-15 14:16:38	2026-02-07 14:16:38	t	2026-01-08 14:16:38.919229	2026-01-08 14:16:38.919229
382	145	d8bb327bfb1b1800bf6da52bec35f32ca9783f1ad2dcb42f8657c20819f28579	40616c4bef9b9ac98cc77cad942b42f67df316a1c48b4402fb00c3e2282a0acf	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-30 11:52:37	2026-01-22 11:52:37	t	2025-12-23 11:52:37.990753	2025-12-23 11:52:37.990753
393	153	8e7b18a4dffd165ab49803222951834f6dae71b5eabed5e7a0eca19e8f168434	6832912d6e8c4ebf81b5bd2a8cdbf733855b7058fcae74f45f8b37b26312dbbb	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-09 17:17:44	2026-02-01 17:17:44	t	2026-01-02 17:17:44.60637	2026-01-02 17:17:44.60637
402	162	fe7c7f8a6d960eb136bb366f656749034398061e9cf0155f53fb8117d36154b5	49cecc4d82d80ac511953f2a3891bab750f37150864e31a53ef13ac378407814	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-14 12:28:46	2026-02-06 12:28:46	t	2026-01-07 12:28:46.754472	2026-01-07 12:28:46.754472
414	1	5d16c9a50a23ef8eeb0892ba765cbb752cd1e925deac3464643627d60c543862	a7f5b5a1c6926f98f46ed2a7895b61303f3e9a73c9d3d90fa5896deef52cde6e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-15 14:19:08	2026-02-07 14:19:08	t	2026-01-08 14:19:08.550969	2026-01-08 14:19:08.550969
383	73	8096f27d64f9dbfedb07519b3a6a35cec16dd2c393ae99b3ffdae87505360560	a7f6e90ea79912524022e48e26c640aaba0f068571b30b1c110c7cfae727ff42	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-30 11:53:23	2026-01-22 11:53:23	t	2025-12-23 11:53:23.998401	2025-12-23 11:53:23.998401
394	155	3f369590374ad6168559989efc761e4471e66c86bc580aee446667d62b21d755	7008996ad89bf71b063837bca1a4ad588f81162aa825b46faf15e58c5ee1bc55	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-09 17:27:40	2026-02-01 17:27:40	t	2026-01-02 17:27:40.475547	2026-01-02 17:27:40.475547
403	1	2df27d9492825f2a8a7b3a6eea7560efc9895f7c6a94db427a2c543120c792b7	b193d9bd146657199ab261360c1b66f36c6f41d0afc7ee47a33c14afb882bd0e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-14 15:57:28	2026-02-06 15:57:28	t	2026-01-07 15:57:28.11034	2026-01-07 15:57:28.11034
415	146	19a24407e9cd041d2c8a99d6eaadea07052aa4d42fbae06350ca49c4980558fc	0a3291cc7f8ee60cdb9b4ca51f58e51ec5472ba8a70c340542c8cef0fde41367	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-15 14:19:40	2026-02-07 14:19:40	t	2026-01-08 14:19:40.402978	2026-01-08 14:19:40.402978
384	131	15dea674748cec2b4f24cf30efb5962124f56ccdc34d446a14ff40667b4b41a1	303d59e0f638a0f224f79a653c40dfc9bb9c8f4f7faa41678657ecc180bdfe1a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-30 12:36:46	2026-01-22 12:36:46	t	2025-12-23 12:36:46.029841	2025-12-23 12:36:46.029841
395	155	cc6a222e62a955f4d6ad033719c5be22b8185493547ddc96fcc595c7f523493e	8305c7587d3aa0680fca77bd19533ac5b8211665fb22c0e3c50dc46b9f7eb2c1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-09 17:30:50	2026-02-01 17:30:50	t	2026-01-02 17:30:50.755929	2026-01-02 17:30:50.755929
404	1	729e7effc6feae3810d5623d07d033b3fdcc9e858f5461d6e90f6117bdaf81c7	4d93a5861a0ce8fde0f307e9084436de69a2ba45c9db8edbda3ea29cdbe7f54b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-15 10:46:09	2026-02-07 10:46:09	t	2026-01-08 10:46:09.210089	2026-01-08 10:46:09.210089
416	174	cb440ede099842dc5dbf64bc624763a0f5bbe0cdf0b7a8ecd72ed0c8b51d6ce7	27d23247c2169e63099b5bfdd468881b3aba35eff2004c6b9b296e46425c07ea	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-15 14:21:27	2026-02-07 14:21:27	t	2026-01-08 14:21:27.980113	2026-01-08 14:21:27.980113
385	1	b838b6477b0940498845f418c7b77359da610051298ff718b60eea6daad9587a	603f1099194d278ad3b0bce0646562c3fd7c2253998f2fce981a061d67a492ab	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-30 12:37:27	2026-01-22 12:37:27	t	2025-12-23 12:37:27.713176	2025-12-23 12:37:27.713176
405	169	72e6785f5ca43ca54b06daab55645269ebfce625425568639c9237d4f4088d17	5a6dad638041c307b71f11647a0809cc2dc381ac7d9ea38a8e797b91fad9d3e2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-15 11:12:35	2026-02-07 11:12:35	t	2026-01-08 11:12:35.355273	2026-01-08 11:12:35.355273
386	75	f39249b6d3d2b16698f691acb0237ce75e4b0cb0e4417a6d26a073101eebacc4	5efd426cb7fdb6f616d2e1b1642079abdfbc8ada203f9cab1b6edc9e744d2554	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-30 12:37:55	2026-01-22 12:37:55	t	2025-12-23 12:37:55.45232	2025-12-23 12:37:55.45232
406	169	b81efee5f9f6cd0636cf6e118d1f29ee4047af610b16c8f9f48da34fe3c36dad	b1b299859a7ca819a6023436484a8626271d503228f898494625ce513270fcc1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-15 11:32:15	2026-02-07 11:32:15	t	2026-01-08 11:32:15.877547	2026-01-08 11:32:15.877547
387	146	cfc3518fa5a63882412c3e47f05b8a1f76f15ddcb19698dd207e2cd7dce7be67	a1ab5451f8903b6cf780b4d709f06cb25ca0483304fd30e171b10cb54c374408	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2025-12-30 14:27:57	2026-01-22 14:27:57	t	2025-12-23 14:27:57.080906	2025-12-23 14:27:57.080906
407	171	d3ea78528b15ce8d3f425a893df747758a63486b247918d95ada4d5c32b44c01	e43c3155422b9c63324e33a265bc18829399804a12c8f839241c7e8186283add	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-15 11:44:38	2026-02-07 11:44:38	t	2026-01-08 11:44:38.01403	2026-01-08 11:44:38.01403
417	1	907b2529c46a50d83af54d18c9d9345d64b312e437ea8edb1ec55be22a15e472	f122a35b8a274aec97456b40588047834afae23d926288c39d9027526c355797	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-20 11:45:26	2026-02-12 11:45:26	t	2026-01-13 11:45:26.151789	2026-01-13 11:45:26.151789
434	178	375375bdc633001fc7fe93aa944336f272d3720f9fe652e2db0e3a7331d14143	3187d2549c8e3460908ee92350c6bd6e2f569a5af8abe0e5d0096729211e920b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-27 14:40:36	2026-02-19 14:40:36	t	2026-01-20 14:40:36.422958	2026-01-20 14:40:36.422958
443	180	381da9b2d4672c0cc042c988ea1d7db88c418b498bf4e874c2be2581fe6e641f	3a4768b68fe04d8d8ab700a6ccac9f0b0d92274755bad23a15662366343c4bc9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-29 11:08:40	2026-02-21 11:08:40	t	2026-01-22 11:08:40.123856	2026-01-22 11:08:40.123856
453	179	3cbd6db0b87b5f64ddce2c76310ce35e60223192f74f5fa5551e04f80f1d52df	ad1759088cd3d4b606770deb0c644c3cbe89d86b683a0c0a5f37318e4e960549	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-29 16:51:55	2026-02-21 16:51:55	t	2026-01-22 16:51:55.027315	2026-01-22 16:51:55.027315
462	179	f9aeb2f6b5e6a7f7a68fb147a16b6a0cd895fe1f65adbe1820268339573f9171	6d483fbe30a72d9ed1c5bcbf240852adf5bd5ab205086fc3c9e184f4d9528a59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 10:16:17	2026-02-26 10:16:17	t	2026-01-27 10:16:17.079383	2026-01-27 10:16:17.079383
472	180	f9d8bad9443f527d7da6415d62d7d1797733d7812d7b03ffb0fe0313f74b67c0	8305e859b4171760cb4ca22dca7bc363bec955222c6dd75ef413a1660bb7d8e6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 14:57:52	2026-02-26 14:57:52	t	2026-01-27 14:57:52.135633	2026-01-27 14:57:52.135633
483	178	de5012f48626ff382bc4672641bf9954372806219e3adeb356ab4cad3ff4516b	2168f645e9b29c49cfbd582048fae794340280714cd1927ad6012de7d89c658e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 18:29:46	2026-02-26 18:29:46	t	2026-01-27 18:29:46.777639	2026-01-27 18:29:46.777639
493	180	9955c02b9df227d711600250ec891c41247b44d14c788e471e024af5ce07c9f9	de395db151ac977f88be7897e228c31d04f314b6e8b802035260adf1e915d9e1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 11:06:44	2026-02-28 11:06:44	t	2026-01-29 11:06:44.506204	2026-01-29 11:06:44.506204
502	177	9e7c16a0ce7ceeb656fec7c511db885a7b1937dd08e867efd50db68aa17acd9f	e8aaa1dbc1e640163e7898f0cf5fee5197d7ce5ea8a2fdfc1c6e62a219d07603	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 13:00:07	2026-02-28 13:00:07	t	2026-01-29 13:00:07.58717	2026-01-29 13:00:07.58717
511	180	49b19c527b8ff86a8e36ad292cf0928dd3c6c5aace501e3a1c8efce6384ab83d	1fb038ef3ff74dea937e842f4cfea4cf8d922f0c6f9085cb757a54b09d6c688e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 17:28:30	2026-02-28 17:28:30	t	2026-01-29 17:28:30.187984	2026-01-29 17:28:30.187984
521	177	3b87ee65e2c9063b91cf14e7b25b436480c0db280dee23705a4f36e803fc7c54	b3cdb13f957b80a126f56e2707a76d08382ba3d256ac2ab04b6d8970ae029708	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 11:32:07	2026-03-01 11:32:07	t	2026-01-30 11:32:07.399713	2026-01-30 11:32:07.399713
533	178	ad68ad2109d9814432aaf5f6f0195331528a5faa77151c90140fabfcbbb7c0d4	26f7fce703af5776bf9597c87655c2a549e97c8f627b80063a5301487ec7751f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 15:05:31	2026-03-01 15:05:31	t	2026-01-30 15:05:31.364083	2026-01-30 15:05:31.364083
542	178	77513e6ac0218061ab68c5d232c794e9458962ed4c973393ea59a9a53c877b10	2d6cb95d917ac2fba124efffe940fd3f04c0810140423a5a29e8480d2e4b17db	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 16:54:04	2026-03-01 16:54:04	t	2026-01-30 16:54:04.637072	2026-01-30 16:54:04.637072
551	180	0ded2960c51e05a911bd2911bf48f3113d46490b7775ab7879f3a4e485bbc3dc	b0d4ea698762c0c4930df6c951096259716616418ca6e99ff771ff1655f0c652	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-09 10:25:50	2026-03-04 10:25:50	t	2026-02-02 10:25:50.866341	2026-02-02 10:25:50.866341
418	169	f6d8232263e1a659a79abf13d98da1b15be6d08b7982b0f1c2b3d7102dd20c13	858935496965acb19147501d51fef4fd7a282465355d2e317834bbdc3e9fab8e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-20 11:55:07	2026-02-12 11:55:07	t	2026-01-13 11:55:07.748869	2026-01-13 11:55:07.748869
424	24	fed04e5e2d6563afc0d8562a6ff4227346a87b83a5e77d54e4502f5f5d735e09	8997abb3c592a5b4df6ad9b5bc07c913f04ef54038cd501b47673333f614bb14	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-26 17:28:00	2026-02-18 17:28:00	t	2026-01-19 17:28:00.761421	2026-01-19 17:28:00.761421
435	1	fb6eaa2b7768464879a688d511e97cf0d76f69a1f9c1ec7bc0450bd89dbcefe9	d5cec18e8f03ece7c7918ef1b0a783036cfe491feaa5926198be2c622f5a5353	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-27 16:16:46	2026-02-19 16:16:46	t	2026-01-20 16:16:46.988105	2026-01-20 16:16:46.988105
444	178	f671a4faa70295a7b703e231298860524f71269a0d6edcc034d35329362172a5	44b1b080c66e70371d68999d0db9e50eaf8a4f55cd86a58fe3ee123c6ffff869	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-29 11:12:26	2026-02-21 11:12:26	t	2026-01-22 11:12:26.431773	2026-01-22 11:12:26.431773
454	180	68136c6b77ee23df06afd4a1feda52a4cb2d0d34330ea9df6d5e3ba8c37c5d76	c2ba1f4925f8bd4d57b24521db2ab53b45aafce2975adec2c07357ce85097bc4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-29 16:53:58	2026-02-21 16:53:58	t	2026-01-22 16:53:58.059342	2026-01-22 16:53:58.059342
463	178	836f644528a13d82348365456d4168ffed00b3f27e9cbeb3c5fc1bc7bb97b506	34001bafb471845e007de083d70092fd8fb37bdd53e0646273ea3c26763ba940	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 10:44:12	2026-02-26 10:44:12	t	2026-01-27 10:44:12.029503	2026-01-27 10:44:12.029503
473	178	6cab53f57f87bbfa94b7b97299aa89e5968283313ad9115d5d04d917d4d13d08	447107ce78a5141e9009fc5bc3ddfe7e21d9748269290f4753678e85c374d355	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 15:05:16	2026-02-26 15:05:16	t	2026-01-27 15:05:16.607025	2026-01-27 15:05:16.607025
484	180	497d9a7e4a96bb993a495b8f45733db0411ac844feed3b041938e9f78fa8189e	817f8a994569f669c3bef171bf22cd2f4a1a7ae22fb0d1186bc33ac42b536ca0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 19:10:34	2026-02-26 19:10:34	t	2026-01-27 19:10:34.148468	2026-01-27 19:10:34.148468
494	177	efee44879848d28f49d840a9a33b708b2854585b63813d97c465e554ca2e6826	6ab3d4eab1c7c814a50e97656bdcbf562518192843afaf244a3a9fbfd04030ef	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 11:31:26	2026-02-28 11:31:26	t	2026-01-29 11:31:26.432948	2026-01-29 11:31:26.432948
503	180	706b3540ad9a59be1069e0aad077000e12b3acb40cb0b84f5111979578465955	832b77f70e765f2c372c00a5c649ce260be0fb95ac0dfc1ff306f910654d7dc6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 15:11:19	2026-02-28 15:11:19	t	2026-01-29 15:11:19.43521	2026-01-29 15:11:19.43521
512	177	9f632f77ab2e6932cba90e39a998ac6a2c3f284631cb35a48713ea853eb79bf8	2ab3a040ad2aec0b02bb15b6d5b4c3cd7fc794fa29e2d5b676025bf6531363b0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 17:44:28	2026-02-28 17:44:28	t	2026-01-29 17:44:28.366865	2026-01-29 17:44:28.366865
522	177	8f12d2151bf409c69ac610a899bd1ea53b63916d19b5086035dbc6c6e2735219	a037dd5e70eb07dcc1c6f04ccf7d5a2bc3bee6b7bc01fb0fb990487e4f249c28	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 11:41:02	2026-03-01 11:41:02	t	2026-01-30 11:41:02.213868	2026-01-30 11:41:02.213868
534	180	fd21cb758bc1170abb37336daf18e4edae394cf56e02a8c3f36dc4e21e49e73c	48bdc6968e69c0579ecd3e47e40b7c1830eca820ebb11faf401aab1d5df870c1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 15:32:42	2026-03-01 15:32:42	t	2026-01-30 15:32:42.094712	2026-01-30 15:32:42.094712
543	178	b1b6a96be682b170cf63c64d9000a7db5e4c9f14af2d6f9cad4cf3cf1833fb22	e8b1a5e316bbae6016653f2a6ff827e3c9e0c74969f7e2cdb06dd9ba4ff1b97b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 17:05:15	2026-03-01 17:05:15	t	2026-01-30 17:05:15.373288	2026-01-30 17:05:15.373288
552	179	5cac5ee81c52b3f05ffdf1f26d9a9d1f7a05d76754e52645798aeb2e82a4d0cd	ad51a4c4ab5360bca748cee461e1f476ed452a7aadba87179e07b1830c806c9c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-09 10:32:01	2026-03-04 10:32:01	t	2026-02-02 10:32:01.831852	2026-02-02 10:32:01.831852
419	1	d0224bd907e24a7bc492eef050747e14aa8f6d01ee07e3688a29bafacfe908f8	65b539d003240a8b06c7594f00edda614c48fa98966ff64f7b09d4f1edeb5913	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-20 12:31:09	2026-02-12 12:31:09	t	2026-01-13 12:31:09.599527	2026-01-13 12:31:09.599527
425	30	01964d59ec98008c0b7f9ef3b74aeb1e4e1574863d01ee2795a13305ccaf2fee	a2def9849df983e3d0c80be9171ec41f862daace666fba2b9edcd1303c61dd04	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-26 18:09:26	2026-02-18 18:09:26	t	2026-01-19 18:09:26.035213	2026-01-19 18:09:26.035213
436	1	408be6f67668e49271971b90251fa42528d24782e3f16d5e7e6a5dfe6a2d6820	c7b30a48e4d13d10a04184650d960684c6c1e1981e038965a6e1c4f8fc5a14ef	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-27 16:38:00	2026-02-19 16:38:00	t	2026-01-20 16:38:00.794417	2026-01-20 16:38:00.794417
445	180	c73779c9118d2f40beac9292b1ccc7dfb7712d8e67ca1ea210a5ccf3f136d126	98c0c35196d664d3a32d4e4dcd4c9177088f5e241241bb7fd16e4fb1b34dde4e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-29 12:17:41	2026-02-21 12:17:41	t	2026-01-22 12:17:41.274971	2026-01-22 12:17:41.274971
455	179	7780ab2ed8671555934415a78fb388861432f7aa75e079e829793931003067ba	9106700acf6ac9e290ead50ab642944fc1d4bb996a9dc4b88d4c175c9819fd40	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-30 11:35:55	2026-02-22 11:35:55	t	2026-01-23 11:35:55.654519	2026-01-23 11:35:55.654519
464	179	a4e51756f94d61643ec1e9a4cd3216a3e765a7054940e33eb4200b5c5006e4c3	9e05424f6e61e420180049d319c9896a406eb971fdb88fdbe06cbdcd5d55afbb	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 10:45:32	2026-02-26 10:45:32	t	2026-01-27 10:45:32.015566	2026-01-27 10:45:32.015566
474	180	6e2445961162c68aa2ee801aa9367eba3bd200994b9f3378b374d784385a78a5	8992982f70c830f50991a6b129e75564408b6e0a8419c3fe7484331123dc0ba4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 15:15:44	2026-02-26 15:15:44	t	2026-01-27 15:15:44.619343	2026-01-27 15:15:44.619343
485	179	5441a5c69992fac14bc88fb790c1ea52861b74d17cb3e1e4beba78a45a744592	f6dab9996a39c2c6828bfe6f620f8f86a3ba9a8ba59dfced2b332ffd8adc6f29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-04 10:01:35	2026-02-27 10:01:35	t	2026-01-28 10:01:35.49799	2026-01-28 10:01:35.49799
495	177	71ec4e389656bcaf76961e8e426c5327171d2a443bb81c0425eb86d50c37c4fb	5ae2b58572188d9092d1b32f61a7fd5642307013e3fe5af824186b45cbe26f53	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 12:37:16	2026-02-28 12:37:16	t	2026-01-29 12:37:16.41843	2026-01-29 12:37:16.41843
504	177	3a4e6e0cbf186b9c46031b7639ee80634c5650547f5db8fd5c86bdbe87cdab62	ddeedfa34167508f569d0e5a2e73597f9ad68a7ef313e8acc77bcf4512495c3c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 15:18:44	2026-02-28 15:18:44	t	2026-01-29 15:18:44.822734	2026-01-29 15:18:44.822734
513	180	cb187c6c02e2d76724332a1ef8e7e70709a3843bec5c47c82dfbde15c57c07c6	1f6169460cc2be1d2ae1df656d7052c0af8f1e883d9d3882b1b51137795b0c30	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 17:45:40	2026-02-28 17:45:40	t	2026-01-29 17:45:40.869466	2026-01-29 17:45:40.869466
523	177	aa1e4b22f503fd81361a2b5344a9d82089e6111da1632bff7e4cd23f1fc95c22	1173ef672bf308a07dbbb926408adb5d80f821301fd52b6909bb456b1797fa62	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 11:44:39	2026-03-01 11:44:39	t	2026-01-30 11:44:39.516293	2026-01-30 11:44:39.516293
535	178	30613b4c68b3d2360b860d11aeac1125ccbbe226f90d01b027432bc0cc2eb10e	61c0873904bb823cfa101b8d6c0893eb924bfd50dd4a309d4acfef1441ae3851	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 15:33:13	2026-03-01 15:33:13	t	2026-01-30 15:33:13.033856	2026-01-30 15:33:13.033856
544	180	d2b399780cb92b72b06ac939c0365719afb5e4e1cab8601758962d096c968704	15b155e88822bf6797d60d5e807713a4cb76f183554272245ced940a6d2ea603	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 17:07:23	2026-03-01 17:07:23	t	2026-01-30 17:07:23.633333	2026-01-30 17:07:23.633333
420	24	ab3d39b5232aeb1845ff2af613c578d9cd33848a0a80923c511cdeb3ff1cbe87	ed96dbb7db4db3f616d79cb632d863be6ed6f999b0efad5f5b9a38d2a42bd3b7	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-20 12:34:54	2026-02-12 12:34:54	t	2026-01-13 12:34:54.275267	2026-01-13 12:34:54.275267
426	23	2e01c890d41d765c1305861345b5b08f3e220d2f308163864b268c760ce68d7f	750f8e1c1bf72a01bb393d6cfd5fe12bc93e99b6bd0d408fe8749d9e695fdef3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-26 18:41:15	2026-02-18 18:41:15	t	2026-01-19 18:41:15.417486	2026-01-19 18:41:15.417486
437	178	c928e15912e47ff5b43a21e71354925f5a6d129393ca27a08cee32d5fd6c3541	4c2d41c4eaf3d3e98369414d29d3df9208c06401a23230babf2250484d1ee695	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-27 16:44:00	2026-02-19 16:44:00	t	2026-01-20 16:44:00.120607	2026-01-20 16:44:00.120607
446	178	9c6b12883dfc6fce727b1cb685cd745428d81d5133fd39899260e294744f3cb0	afadc1c530cd02d8d9bb59e18ae686c0693f7899caeef8e6f7f47e2ee20b8b5e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	2026-01-29 12:20:08	2026-02-21 12:20:08	t	2026-01-22 12:20:08.710209	2026-01-22 12:20:08.710209
456	180	610326825cea8ae49844df1c0aaac80d2e5dc44597bb1d98099c8d018e644764	ac6f01f11d31d52203d6b6698d0672f66ed7f38aadb2ff7911c6daa9a50ba92e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-30 12:17:56	2026-02-22 12:17:56	t	2026-01-23 12:17:56.608076	2026-01-23 12:17:56.608076
465	178	a65116fff83fd75d01f9207f3bb12b85a6e09dc13180fabcb8f2835da453ce01	9b9ac34da8f373bcde1b94e295c7252e80f7a0a30691c95ff55945c1cd58ab1f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 10:57:32	2026-02-26 10:57:32	t	2026-01-27 10:57:32.544427	2026-01-27 10:57:32.544427
475	180	22333a7682a5b43bcb4a0c930ea4f535e533740aeed3d203666dce88b9e38c9e	3d8949fef119173b95af888e81bceef064841da4948ae98a56682e65b670f86b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 15:29:46	2026-02-26 15:29:46	t	2026-01-27 15:29:46.376599	2026-01-27 15:29:46.376599
486	178	0ec994f52e896783fdcc9dbf2032dca371d2769970c0c0dcbe167261c901fde1	e19441f62a634ec9c5afbacc80569874edc4cb770f372f5e247b6e0d85819cd4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-04 10:03:42	2026-02-27 10:03:42	t	2026-01-28 10:03:42.919024	2026-01-28 10:03:42.919024
496	180	d91872066e0af6cf27ae07493410352d2daa8654b16174ae2c233b1cdc7a172a	3ebbcba88bf05ea9bb3911a0559d214461d0fc91e5dc234ea794114335b17a14	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 12:53:24	2026-02-28 12:53:24	t	2026-01-29 12:53:24.999387	2026-01-29 12:53:24.999387
505	180	18cf1f6b2f567f6e16f070acfecb5c4cf65b4849f1ae93f72c80e3ed18b8fa2d	f352fb53a8f932ba3751207a37589537244ebaee5c0d47c38b981c41812d566a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 15:23:11	2026-02-28 15:23:11	t	2026-01-29 15:23:11.80706	2026-01-29 15:23:11.80706
514	177	db591ad5685aebc63fdbf3b7946ba30ce69aae887b0500df136085908e53815a	f67bab2d7b9dfb63e03e77724de252678d75dcc9eeeb0ca7ce3ae493f0030e4a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 17:46:19	2026-02-28 17:46:19	t	2026-01-29 17:46:19.404168	2026-01-29 17:46:19.404168
524	177	4c17fd1dc36387c49c8f06c3d3b4d1b9d0526acd414605a9d05f085a741a06df	a9e8c7bbc0b76a8f177f8bb0135e089cb197d1fcae2d8afa3ecfbabbbea2bd87	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 12:10:00	2026-03-01 12:10:00	t	2026-01-30 12:10:00.72066	2026-01-30 12:10:00.72066
536	180	4297e7f4c2452da788973dbdc26b26317761824b7dae19462dc3003c2f0c4086	058bd933cb2611bcf3767ae0a323a1256084d73ae9530fd8b702ead69073f970	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 15:40:48	2026-03-01 15:40:48	t	2026-01-30 15:40:48.730664	2026-01-30 15:40:48.730664
545	177	e60ed71a5e0f202a753e00fcb5858efe8d11d72090d724b30265bf2540dc7d28	f542bab6872193db6a1523dd85968d5aa40bd6e34299b9258dbee6ad64e2c890	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 17:08:23	2026-03-01 17:08:23	t	2026-01-30 17:08:23.170725	2026-01-30 17:08:23.170725
421	1	5b99aa85336e1a854be9131645edebf71457c590833d5474736d8397ec9b5101	dd847fe24614de0464fa5b468f343d36ab8dc19c78cc9b4f8f99fa13c9e1d544	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-20 14:34:24	2026-02-12 14:34:24	t	2026-01-13 14:34:24.941022	2026-01-13 14:34:24.941022
427	24	4beac2d874aaa28f40a1aebe302a0366f48ca96593cf0a262e9839c71223ab6d	29829d5676d8e66b93080caf24d1bc666e55ad1c8afb8cc30c76b46f3a623314	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-26 18:48:12	2026-02-18 18:48:12	t	2026-01-19 18:48:12.421021	2026-01-19 18:48:12.421021
438	178	86694485020229a9c15046d1f85c327d881e580adbe6190b08f541ca2cca2589	b35ba752f333bdaa10e0d431b8924074b32f038ac66996d89d696ada6ee28663	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-27 16:47:04	2026-02-19 16:47:04	t	2026-01-20 16:47:04.527074	2026-01-20 16:47:04.527074
447	177	83f0824ed159a9d1f0c83e17ddf768aecf64f4beaa676cdf6625b263419595ea	9ce47516badf7d76529ad247acb035e12f13ba5863b02e11d5ab4a9e252082b0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	2026-01-29 12:55:43	2026-02-21 12:55:43	t	2026-01-22 12:55:43.516477	2026-01-22 12:55:43.516477
457	179	4061d98996207c1e7781b8f4d93e8a25c657d6334e4c7fdb8f9033fa59dea67f	6ba6f97cc4d2431cb5345f587a7f5a46d53aed68be1b6fe07dfde062dc1191e1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-30 12:56:30	2026-02-22 12:56:30	t	2026-01-23 12:56:30.548223	2026-01-23 12:56:30.548223
466	180	b8dd0f19e9e005c70c549aa6cf2b671670446381f6e111dcc99fcf031df0348e	a51bd49f76a7b40f8f1c1254099461fd4e329d276ae10f103d0c6d23d6e7651c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 11:24:59	2026-02-26 11:24:59	t	2026-01-27 11:24:59.282167	2026-01-27 11:24:59.282167
476	180	fa26bf634ec8b3c9c42c1c1179975426bc1a192cb4afdc9142d81a479aa6c908	af87968f003ac6dbeecf61163f1ca5b35b3be8910b10ad999d3016a65d1270a6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 17:59:27	2026-02-26 17:59:27	t	2026-01-27 17:59:27.586442	2026-01-27 17:59:27.586442
487	178	4572afa2ce60e51107a86f4e6d5a4cfaa8d7996b666abef54cef5fa242c91f52	94b254803d80f87704b3f16284b2b6b24f3fa8722086ddbba29297f6732351ce	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-04 12:20:21	2026-02-27 12:20:21	t	2026-01-28 12:20:21.52433	2026-01-28 12:20:21.52433
488	177	c7c42a0a593f8ed3d847403a5a1bc8e45cddd6e1428e5e9b4c315b852e7818ad	769f8b72fc962209b3307d592665e41b58fbc87f38ad150f1f00ea106df8a15c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-04 12:21:02	2026-02-27 12:21:02	t	2026-01-28 12:21:02.112135	2026-01-28 12:21:02.112135
497	178	0688aca2d8862ec3e1f6d3c348427b1659c987e70e3d137354e212699f564bac	c044842cae2088c8cb6aba3755513fc061d3ad37fed6c3da1dfc58756a62bb5d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 12:54:15	2026-02-28 12:54:15	t	2026-01-29 12:54:15.353883	2026-01-29 12:54:15.353883
506	177	62cb16fec257da8f535a761207cfb8a4ccfc2c0e17a91aa3d97ea73c1c75002c	e38b41eb38ca3bb6f5fa901359500027bd1e578cc2e2b536e7c0d5739fd24f49	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 15:25:23	2026-02-28 15:25:23	t	2026-01-29 15:25:23.024754	2026-01-29 15:25:23.024754
515	180	14ac3f51ba9562aa1d11502d04c32e07d5a51190ac4d5c04f155945592230f8a	f43fbf8cdd8ca7bf1a823a0d4945593e36fa11933d240aa13611fb00d82fac8a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 17:53:53	2026-02-28 17:53:53	t	2026-01-29 17:53:53.79125	2026-01-29 17:53:53.79125
525	180	8569f22623838610f654733475d446263d31e5e8ffa802f11f63c7c79258e2db	9e0af258193b85093fd1517fd1d02ca6f8bfa5adf3caf8a89c7c13620eab0e7f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 12:11:17	2026-03-01 12:11:17	t	2026-01-30 12:11:17.700936	2026-01-30 12:11:17.700936
537	178	9ba4bd6a07dae290f831960f5a4f78933850e400b8770852340256a4efd88630	5986a21bf28c58d00dab8258c9fb47b8fae23768eace3ef77cb28377307b488f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 16:12:07	2026-03-01 16:12:07	t	2026-01-30 16:12:07.177977	2026-01-30 16:12:07.177977
546	179	dd2826a8807353db1b760bce691eff5752f494382bf3c6ed21d7cb64196e5fff	55780a9268de0546f483c6cd3131efe12b9cf7ad6f563708c78515fd99b69470	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 17:24:41	2026-03-01 17:24:41	t	2026-01-30 17:24:41.061857	2026-01-30 17:24:41.061857
422	30	10cd341ca50b9bbea2ebe621effe1fe5908bd793cba99b7b07a328b17862bb3f	50d65a12250f0a57d5e976eab7a032b376f0eb6351f2d6aefe37b79c9e22beaa	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-20 14:38:16	2026-02-12 14:38:16	t	2026-01-13 14:38:16.508311	2026-01-13 14:38:16.508311
428	20	a8794f87938755eb74da43da9dc6ca252d76ce5ef9bd5ecd59bb9faedb492e69	61a164ce28cbbdadbc608b00503c7727161ea583827195a51522ddd2321e47e3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-26 18:51:53	2026-02-18 18:51:53	t	2026-01-19 18:51:53.671716	2026-01-19 18:51:53.671716
439	180	eec71a9d90bb989066d55bf29d910610c3818ea60e994668ba8af0da70254a91	deb7d918e8f19431a8c14f2b688e10c95d95b28608661ad7affb0ab03a87a105	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-27 16:50:54	2026-02-19 16:50:54	t	2026-01-20 16:50:54.053226	2026-01-20 16:50:54.053226
448	179	844d310a917b26a06bb1ad9db6a3b13e2e6846cd206483daa408caa9272770f8	ea77c64540666082c3fddd9a867b3eff050dab5dd0122eb40b7e311af74b54a4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-29 16:06:47	2026-02-21 16:06:47	t	2026-01-22 16:06:47.528573	2026-01-22 16:06:47.528573
458	180	19a6955a02913951f62d36ed4dff903c240c0065168335d78f7242deaecae317	0d9dd9672893e84b6586a626c13fe52b744ee803ce7caee54cfe5b4653e58051	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-30 12:59:31	2026-02-22 12:59:31	t	2026-01-23 12:59:31.466331	2026-01-23 12:59:31.466331
467	178	b4193c7d953757b472a176ad1404a075f9e382b64f40f83656cf4177b57aa4a4	2d71b501ab491fd0a1b1ad4146acfadd630c2a3fda81a099059712304f5249ef	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 11:41:27	2026-02-26 11:41:27	t	2026-01-27 11:41:27.993732	2026-01-27 11:41:27.993732
468	180	8a80be4caaac7ef7cf7f4fa1e52a8b99629d35fb069923d3ff91bff4aa63c5c6	88e83e2b417a3552c41fc8e59f42f226b6a74f09064422135d85207a9c4e3710	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 11:42:11	2026-02-26 11:42:11	t	2026-01-27 11:42:11.787652	2026-01-27 11:42:11.787652
477	179	fc434657678dce211b48feae263ff41e5f7eb8f8b1302377c5ab423f49ba13e6	ee7da92823629fc6a294d1e745d69a8d92275ec2a4c7e75af051eefcbfc75d27	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 18:06:24	2026-02-26 18:06:24	t	2026-01-27 18:06:24.196625	2026-01-27 18:06:24.196625
478	180	c94e51f226578d261a2d98047581db523f32b6f059f78e8c3b38527c5ce6b294	3ec05ae0b4068948dcb27a3db3f96ca15c021ec9b46f9bbaf1d31fe22be90356	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 18:06:40	2026-02-26 18:06:40	t	2026-01-27 18:06:40.901314	2026-01-27 18:06:40.901314
489	180	e84bc2361bf57b489562fc920b16baa89abc7ac89d18074634fbcb6f30f90014	74309caf860d11bed37648efc3e161a5d52b44b64e1c482af01201ceff888e4f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-04 12:38:03	2026-02-27 12:38:03	t	2026-01-28 12:38:03.902864	2026-01-28 12:38:03.902864
498	180	97b837e6ad2f86b5af6adfefc82b5ce16655f7d97de69ea93696f532582b52e0	6a8dfb61cd1d4762f3a1fb5d20d062ec530c2c0193e419cef14b572ca3ecaecb	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 12:55:45	2026-02-28 12:55:45	t	2026-01-29 12:55:45.609313	2026-01-29 12:55:45.609313
507	177	cadf29ddd33e768d41399fe493d61c829c59300a5c3c66a93c3e5980770d9330	0e93f0cf2d43137836379a568a7dfd916c4df08b7164559dd8565b95cfba58be	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 15:57:55	2026-02-28 15:57:55	t	2026-01-29 15:57:55.406192	2026-01-29 15:57:55.406192
516	177	d3956450321c1021ca047b57644bdef7e8f31bc9415cbbc037bb10f64ec17d57	efd53c292faab8afd1d9bd00a70168f00aa3b6221960a601af955ab794d5990b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 17:54:52	2026-02-28 17:54:52	t	2026-01-29 17:54:52.38758	2026-01-29 17:54:52.38758
517	180	7e8d620394d2bb08c8dd1e1a262dfc9596d0b1b2dab49b37e86dba91460fba41	7e67b59f4701c06004f7e10af533b268e3327bcdd574e13f103d6656d24b135d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 17:55:12	2026-02-28 17:55:12	t	2026-01-29 17:55:12.568209	2026-01-29 17:55:12.568209
526	177	b3eeb05aa714b7fcc33af427788091e86d014726331d9bd8f3d317c272b9625b	24c28b36aa4726aba3fd8eb3ca8abfd764d7b7487b18c67e8bb7eaf766a4ed26	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 12:34:16	2026-03-01 12:34:16	t	2026-01-30 12:34:16.810893	2026-01-30 12:34:16.810893
538	180	2847170f38eb3821697672877f958e66a4e7fa90b24a73f6c7b3cd1ce9328feb	7851aaf108ef6cd978cfa41dde86d4f056ba203cb028f9d4ac0262e80aad1125	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 16:16:40	2026-03-01 16:16:40	t	2026-01-30 16:16:40.890349	2026-01-30 16:16:40.890349
547	178	a1de4385750e29665606a85dc4b71d8df573c4e2716a1375b2cd357ec90fb605	d127d1bbfab8bd8fa5769daeb66168bf1619034350a3d6353d6f7765a89b27c9	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 17:38:15	2026-03-01 17:38:15	t	2026-01-30 17:38:15.984439	2026-01-30 17:38:15.984439
423	23	d7a9efb8a6b49b96609645ce9d8a22f97b96f10d1a79b7080e7c159ccc386e5c	91b4490a7bbb8cdc82de6d8ab423baa4b5585b44895edadf86084344c1deeb72	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-20 15:07:39	2026-02-12 15:07:39	t	2026-01-13 15:07:39.394662	2026-01-13 15:07:39.394662
429	1	346f7b5d6809a45d60fc090aa1ca6737c0be1d2bf4607be638027f038b717c0c	ec59df51900813c6c27a86abcfa69f71ed66a63656c7ba1f14df3abbff336262	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-27 11:53:34	2026-02-19 11:53:34	t	2026-01-20 11:53:34.53349	2026-01-20 11:53:34.53349
440	178	033fdda60e753fa613c3475dc34a17b773f40d33d17a47fd1ca1adfa0162b944	b2c12cba330fe23919d06a9d11bd6b7773c096813120dad7ff0ca51da0ea93ab	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-27 17:02:06	2026-02-19 17:02:06	t	2026-01-20 17:02:06.797567	2026-01-20 17:02:06.797567
449	178	b7cc45c6de6dbf77872250927a5e1c54a153bc28cb96c705193e8d3deebba99e	398625e848aa34458641bec71dde8f1e81a34cd16acee11a1f26aa767e0f7c67	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-29 16:12:34	2026-02-21 16:12:34	t	2026-01-22 16:12:34.670816	2026-01-22 16:12:34.670816
459	177	ffc25ccf11431dd76da4490330de5c9d9ce4642fd31ca366032c9f1ff18da745	540fdf837fcbf39e5f67878bbd47d82075dc2fb1cee0488fe5d70ee4b5a3fb2b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-30 17:36:28	2026-02-22 17:36:28	t	2026-01-23 17:36:28.923825	2026-01-23 17:36:28.923825
469	179	59839913866dc5b48c7fbee7e38c864a2e22c1255f19f613c810ae68bf450e75	8ec7403b788f895cc47ec36ea450c7d3c7ba36a7d946c50d91d9133c27e0c5dd	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 12:04:27	2026-02-26 12:04:27	t	2026-01-27 12:04:27.02064	2026-01-27 12:04:27.02064
479	179	e7045e3415b206c5812fa08e312acfc1cbc3864260b26a339afc32e1b1027bdc	579f2ec8b37870774dc3875239c749e09c2813998098808546e6681a748f1a17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 18:14:18	2026-02-26 18:14:18	t	2026-01-27 18:14:18.824471	2026-01-27 18:14:18.824471
480	180	4d4f35744023878ad2b4586a8249e98dbbb36bc2b57cec97ebbd828d96de2ce0	8783df907020e7ee7655b00106f76c40480aa1afe4d7e1151d8f17251859c00c	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 18:14:37	2026-02-26 18:14:37	t	2026-01-27 18:14:37.792641	2026-01-27 18:14:37.792641
490	178	e2e9ac07374cab18fa1d674de0dd43d9a55c14eaaf10e1c8b3aee6278697da5d	759808f817790349ecf67ca760fedee0ab3a4a5d391077857141c06286684028	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-04 13:04:36	2026-02-27 13:04:36	t	2026-01-28 13:04:36.2806	2026-01-28 13:04:36.2806
499	178	96fa2e59abb8f8efcc12b32b9145f723c5eb9a6bf052701f0520169b0e6653e4	5a507092be81c9f3625e4d139b63e50f730bd5f94af5513b978dd0648baff806	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 12:56:45	2026-02-28 12:56:45	t	2026-01-29 12:56:45.485423	2026-01-29 12:56:45.485423
508	180	ebca39b12acc5269eb19001bae0ce50ad7f176ddbd8e6085f92ccb60cba44dc1	f20bb2de2d544e3d267e80ebbde125917e9cdeea2ff40fb4118c50ca3703e6eb	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 17:13:15	2026-02-28 17:13:15	t	2026-01-29 17:13:15.850239	2026-01-29 17:13:15.850239
518	177	9e036a5bbe711b3b09a4da479ab5901365148af8387d98673bfaa7335c7e0ee5	f9e91f6e9999bf2575a15082c84b68287015f4fd89b1bdb53cce0f053aa1cd77	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 10:30:49	2026-03-01 10:30:49	t	2026-01-30 10:30:49.547727	2026-01-30 10:30:49.547727
527	180	e11cb88b47d37cb958cb9f96685ef7ddc27e75d52fc3eb0be45cd31cfd5d4b85	1120c08f97375246c8fe238a10f7eee81f5161acac95d6edf984b61895d75a6b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 12:59:34	2026-03-01 12:59:34	t	2026-01-30 12:59:34.168994	2026-01-30 12:59:34.168994
539	180	2c243e2dcfedbd926cbd29f1a770de01d0298d73230397029ac82963ef90f065	7bff3f11bef4d1731b5284ed363fd8d3bb5fab794f55a833fdeae1d8f1e52bd4	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 16:32:14	2026-03-01 16:32:14	t	2026-01-30 16:32:14.512021	2026-01-30 16:32:14.512021
548	178	727b6a8df1c923150c958c30bfbd9e00aac72817e67377c888a2ff3d8a83c887	814ec1500534148a904023d1f1489b0cf181ebf7a6b2c79b88da1afbc9419240	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-09 10:15:00	2026-03-04 10:15:00	t	2026-02-02 10:15:00.250256	2026-02-02 10:15:00.250256
430	177	120cc2c12f5c9f6feaa6216f7de97138ca55d0521a07b06eb68749984f7f1a06	0a130d9a53e4f956552ee2030f8a9f38b5d23abc0d7857efa6b7209a4eaa1182	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-27 12:10:51	2026-02-19 12:10:51	t	2026-01-20 12:10:51.501476	2026-01-20 12:10:51.501476
441	178	4f771a0fe2bebc3f8744a7f7485b9539f5045ac6d7bab37f85132efc23a8fc7e	97ba184b5b9cc61a9eae071b4467662509f011ada6290eadf8647bca85fa5779	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-28 10:51:15	2026-02-20 10:51:15	t	2026-01-21 10:51:15.97705	2026-01-21 10:51:15.97705
450	179	549183d5ffb438343e23e4be1979d3b33d4dac3a4b70611708da9240135fae06	db63a3d0f6a60361267ed464b758a566b00af8538c31ee6c25f78a69de7676e5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-29 16:20:54	2026-02-21 16:20:54	t	2026-01-22 16:20:54.445216	2026-01-22 16:20:54.445216
460	180	92dcab4f0923a3a4535c904f2b2297c5deca492c8fc5d9e334e3f1300b679280	d0c8987fae5a51bc5be84cf47e9a5a21576f873bea9ecefed6c8a636da80cbfc	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-30 17:37:57	2026-02-22 17:37:57	t	2026-01-23 17:37:57.526085	2026-01-23 17:37:57.526085
470	180	18b09f9e7c44edd3fb588d6b2dbc13fa635c9c434f7fc48ef62c44151cf9ca88	9cec98435c10ef7198584ac1b889788c133b69d5eecb11aac8fadd7117521369	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 12:05:00	2026-02-26 12:05:00	t	2026-01-27 12:05:00.78179	2026-01-27 12:05:00.78179
481	180	3d1ce6ad6836393adc68b02b39b2425159ba8d4659fe6bc785f63c6081ef0674	1cf901405f64bac76c153bf201438c51da04d23430590477eade29c0129b2b90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 18:22:42	2026-02-26 18:22:42	t	2026-01-27 18:22:42.079712	2026-01-27 18:22:42.079712
491	179	483b7065bc506f6d641bf5c9393bc0c865123cc23c52c7f98b9ab0cfc10ad150	a1d79aafa15735282b52aa7e155f365b7585ca31862f087f64d54c85d7b5ff9f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-04 13:07:11	2026-02-27 13:07:11	t	2026-01-28 13:07:11.614166	2026-01-28 13:07:11.614166
500	180	287fc8f1039088ad05f3674ce26246489f9efba1219fd1db45d9d3a25edf3656	b4428d67faa3754481f2e9c7f47eb1b3f2fbbe83c72e3f0c29950db489bd06c3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 12:57:46	2026-02-28 12:57:46	t	2026-01-29 12:57:46.001977	2026-01-29 12:57:46.001977
509	180	c297f2ad0764b2af9d5a24d969183bb9b06bdb280125ab58d5787aa95aacb975	7ae56f0fabf3e932f5d8961ca531fb807702e5cc40fb3d2b557575b620d879e3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 17:19:44	2026-02-28 17:19:44	t	2026-01-29 17:19:44.171921	2026-01-29 17:19:44.171921
519	177	1f839933ee4e0a6c7b8e68c885929a784fb8ba8cc893de13bd103e0f7b6b654c	38ac6c35f2875e357d2441832b9d229c27897ffce7e64df36ec8b99a710b4c71	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 10:47:07	2026-03-01 10:47:07	t	2026-01-30 10:47:07.972379	2026-01-30 10:47:07.972379
528	177	b9cdaef62e814397d74fc80cfe887fcf8683ed2d77cbbce1db4ef52315ff9a45	b806fe832095ebb4155673ef07c9531c730f26c4e7de1f09e2340a0d4f80c085	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 14:09:16	2026-03-01 14:09:16	t	2026-01-30 14:09:16.00309	2026-01-30 14:09:16.00309
529	180	36797e0d0488f51c9cbfec6997fc51069fa6325d22bb35a32fc88acc1842a81b	ce8373bbbb352518e889f0a3ef196774ef5852b408b64984963c7858e2ff95c5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 14:09:50	2026-03-01 14:09:50	t	2026-01-30 14:09:50.56946	2026-01-30 14:09:50.56946
540	178	0c89183d53159650c4f4ec49b043be9f0dfcc0482ba10ae806cf7fe0a46ddf33	718eb1569df7579374544b67fb730f15f6a334d056227c9284da8d039e918d90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 16:49:41	2026-03-01 16:49:41	t	2026-01-30 16:49:41.190751	2026-01-30 16:49:41.190751
549	178	ea8d692baabc30575228abbeef9d9e03d3763af9b17dfb232893f90460003b09	a70e566da284bb0b2487b218dd0b20b10129f3b215ad2e6a3b5165fc50231186	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-09 10:24:51	2026-03-04 10:24:51	t	2026-02-02 10:24:51.563369	2026-02-02 10:24:51.563369
431	178	6b9352335e5c9f735447042597c8359682bc57299212b14cf8a12241203dcec0	543feac0ebf731bd8baa241904244cbdf1ae8efa2df7925c1405ece86a7a07af	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-27 12:56:32	2026-02-19 12:56:32	t	2026-01-20 12:56:32.875008	2026-01-20 12:56:32.875008
432	179	e716a58f94ab3c98ecd3d0c97fcbde8da9d0d94442a9628290f6b247cda781c2	51da93998b8607e2607c0fe205f96e581590024559a2d8f0910decc3940486c8	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-27 12:56:55	2026-02-19 12:56:55	t	2026-01-20 12:56:55.312038	2026-01-20 12:56:55.312038
433	180	daee63e854b417a08d95dfceab3cedee8a56449b36058d83ef57410a5f7d5b3a	3874be01793fc5a4c108d4fa9766e2739f17ccf9e451b13428811f2d89e4ee25	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-27 12:57:15	2026-02-19 12:57:15	t	2026-01-20 12:57:15.811896	2026-01-20 12:57:15.811896
442	180	6efa05ce8333fddd355ba09e9df964b08f0269057dd555cf311c732378db37d7	09429b260dd9123083ad218f1f43e76201bf86d69fad56b7af116cda8ded0ea2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-28 15:33:47	2026-02-20 15:33:47	t	2026-01-21 15:33:47.092869	2026-01-21 15:33:47.092869
451	178	9231c0d6fbc2cfc781bc2356e0bdc14a8b07f262643b3bc18306aa7c5f0f2fe7	9861933ae9a01585d9aaa7598b48390dc05c85500f210fb80abe639b6d6f627f	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-29 16:49:45	2026-02-21 16:49:45	t	2026-01-22 16:49:45.91752	2026-01-22 16:49:45.91752
452	180	cce6c6101afa6c3f3b0ec8fdb6319dc2c031897ed85fd8ad8c3fa75da003c552	15fc75928bcac6c0cafc14ebc45ba13894dfe7bc13fd66092bc8db63564bb2c7	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-29 16:50:10	2026-02-21 16:50:10	t	2026-01-22 16:50:10.475051	2026-01-22 16:50:10.475051
461	177	82c672cdc55fdea8c2b2edff0a72c281a6090b4b5813d4057699fa6c0168aa95	7e12944945c8888ea61db1b476a7dbea504331d30d76e11112d6ed7d03a70298	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-01-30 17:40:16	2026-02-22 17:40:16	t	2026-01-23 17:40:16.363291	2026-01-23 17:40:16.363291
471	178	025d7023dfb50a535e03c58583f9d8be5912fcd84576bec535783820cd5a8e08	306722d993cd8fa643c4e47900369f1635a26199df96e4c4ec71efd5f2945e15	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 14:53:42	2026-02-26 14:53:42	t	2026-01-27 14:53:42.824861	2026-01-27 14:53:42.824861
482	179	420a3bf098be51ebe776ab96cbdecdd410a44fc6d37334618947513189235e5d	f757f0d4022f1e10f0cde95a29e8bfb5036b5565023b4ec40ac22d9932acab3d	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-03 18:23:46	2026-02-26 18:23:46	t	2026-01-27 18:23:46.825242	2026-01-27 18:23:46.825242
492	180	71d041e0d68320fd342a5a1d3d86770e5c6f9457b1005acd5ebbf7d7a4215b99	a3341ab450c08df4531f2681e9284b6afb48f72e328bd1f5d6e5c5f5f9dfe257	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-04 15:43:03	2026-02-27 15:43:03	t	2026-01-28 15:43:03.830126	2026-01-28 15:43:03.830126
501	178	d464689e42b6eeb36d6c5cb6f675a922b1b51fa02816e5261fb506a4bafafaf2	afac6650a9fcb4ba88a81390509209c3c1bf40c46c02e14e425da097959e6623	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 12:58:46	2026-02-28 12:58:46	t	2026-01-29 12:58:46.17438	2026-01-29 12:58:46.17438
510	177	2c9a02c393994d31190b123a6a79714a1229f0a5a7d1e06b0900b2edbfda6a30	da1bf148d41ea400920d2692498805c13397389052789a6695749489975d13c3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-05 17:27:30	2026-02-28 17:27:30	t	2026-01-29 17:27:30.053696	2026-01-29 17:27:30.053696
520	177	e6f38dba48a021a09f9c51163ecbb80b27b47e3744be7380af120fd7c8ab715f	babdd08889c2dacbaa0cb67106ae547f1e58d2f36502d9a355df2c8dcb98153b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 11:01:18	2026-03-01 11:01:18	t	2026-01-30 11:01:18.236028	2026-01-30 11:01:18.236028
530	178	b320473aa993205c210708d4c601d2b81a6c540931ce6d0c4fb9fee4d0fa6ed3	40c90ffaa7b548b8a4476385908ec16dc417069971c550e0089c203db5825cf6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 15:03:25	2026-03-01 15:03:25	t	2026-01-30 15:03:25.375499	2026-01-30 15:03:25.375499
531	178	e7dc3eeb0692f180e4cbbb8b7597bb7f5e041ef8a7fe072d0defb52954fd2b45	d67df6e17352636d40de9023437ca0423b953aaaa1cff4c10ab2a62b5d4875b5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 15:03:31	2026-03-01 15:03:31	t	2026-01-30 15:03:31.213725	2026-01-30 15:03:31.213725
532	180	e0250df6c06b18af51d170e0d4719cd84503fb461cca652bc752fc1fe8712fdb	049abb6af5b0edac7ad061e5b1dfd0ac7d4ae3a1f88063654d191948b2e3ddd6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 15:03:56	2026-03-01 15:03:56	t	2026-01-30 15:03:56.756569	2026-01-30 15:03:56.756569
541	180	255272f1f8ee1f37405cb0d41a557f615e321a9d18f4ec53e9edc9d0fb416b33	e4e369e550d59655893693d6e4e3dbfed520c8a137c0d781d5318d0f892d92f0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-06 16:51:46	2026-03-01 16:51:46	t	2026-01-30 16:51:46.716697	2026-01-30 16:51:46.716697
550	179	c89d1929b2fe2011f434cb0f4dbfddf2cf5478dbca9d2cb0fa6c0993422467be	a5c363b5e5846ccacecaf7e1e5da206d7efb6b21c9dac75b54bfd0218970525b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-09 10:25:09	2026-03-04 10:25:09	t	2026-02-02 10:25:09.639117	2026-02-02 10:25:09.639117
\.


--
-- TOC entry 5982 (class 0 OID 20701)
-- Dependencies: 308
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, email, phone_number, password_hash, role_id, is_active, is_email_verified, is_phone_verified, last_login, login_attempts, locked_until, password_changed_at, must_change_password, created_at, updated_at) FROM stdin;
25	dth	dth@gmail.com	wtwr	$2a$10$hNkEdQ8JZgp.J0oCDn5v2.E79YI0/4lqx16qHXsagIJZirZe02ZOG	2	t	f	f	\N	0	\N	\N	f	2025-12-04 13:14:27.34406	2025-12-04 13:14:27.34406
27	test	test@example.com		$2a$10$KAI4l4xxlgNSLKZaXl5wjea.0S7U8zFGJq94lOnTftWV6ihTU8zEi	2	t	t	f	2025-12-04 15:08:33.342937	0	\N	\N	f	2025-12-04 15:08:17.271567	2025-12-04 15:08:33.342937
33	kamakahinton	khinton@gmail.com		$2a$10$uaw/Hcpfb.zAWxLujJ0HZubnRO8WV6W6RCh6vue48OtmpXgCI1LT.	4	t	t	f	\N	0	\N	\N	f	2025-12-05 10:26:11.891738	2025-12-05 10:26:11.891738
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
70	doc2wl	doc2wl@gmail.com		$2a$10$xVbKImEYhpysEqfirvk/7eh.F1A0RzMfAPXMeemFNKsSb7MbUqd.i	3	t	t	f	2025-12-10 12:21:12.260867	0	\N	\N	f	2025-12-10 12:10:52.629981	2025-12-10 12:21:12.260867
72	recpwl@gmail.com	recpwl@gmail.com		$2a$10$oXIk9cagiP525mPvxe45L.5sbpul.sIurQ/AxY6iGjAnbzLBmbCCu	5	t	f	f	2025-12-10 12:22:24.278341	0	\N	\N	f	2025-12-10 12:22:07.042757	2025-12-10 12:22:24.278341
7	bob_smc	bob@sunshine.com	+91-9123456790	$2a$10$Vm8nc31FlrIs1sXTEXZobO4SarovAv8Uf/BESQdMHw8CZd1kXfj62	2	t	t	f	\N	2	\N	\N	f	2025-12-04 12:22:29.912709	2025-12-11 15:32:36.351615
71	logoca	logoca@gmail.com		$2a$10$e.NECRu0cFqcqnJOzigGKeNfuUQm0nGNbMKjarTBGmL37t7qJ6tSq	2	t	t	f	2025-12-11 15:33:19.400588	0	\N	\N	f	2025-12-10 12:20:40.771076	2025-12-11 15:33:19.400588
87	tetsdoc	testdoc@gmail.com		$2a$10$0N6Ydj5FcXuCaZvwbEPY8OGXC5DVeyzZxEAFq/VIqqPWGlhibZdpO	3	t	t	f	\N	0	\N	\N	f	2025-12-12 10:51:19.318091	2025-12-12 10:51:19.318091
88	recptest	recptest@gmail.com		$2a$10$fquA2P/zkR69WLwTsjDvM.N5UlpTxn8NyDMWEYyDZzLotjSqHhLkS	5	t	f	f	2025-12-12 10:52:20.765438	0	\N	\N	f	2025-12-12 10:52:05.178159	2025-12-12 10:52:20.765438
26	utdccgvjb	ca@gmail.com		$2a$10$Ms/1aiqgvfAqo/qkO6C7heXII/2TR01RpjY8aN0UFW8xoPNfVdcMC	2	t	t	f	2025-12-16 17:19:52.277869	0	\N	\N	f	2025-12-04 14:43:50.165074	2025-12-16 17:19:52.277869
90	doccc	doccctest@gmail.com		$2a$10$LovWPScAPqZL..uZ520zlesrUnxuCS8CG9Kwwn/GxeU4sf.u/OUrm	3	t	t	f	\N	0	\N	\N	f	2025-12-12 11:01:29.423252	2025-12-12 11:01:29.423252
28	wg	hoho@gmail.com	8788777766	$2a$10$wodDgzu6rMZUSJztiNktNeva0mubToJWROL/lXiKnedPZMl80X.gG	2	t	t	f	2025-12-04 15:17:42.204937	0	\N	\N	f	2025-12-04 15:17:05.29374	2025-12-23 11:43:20.601677
78	aef33	seddf@gmail.com		$2a$10$plTJzL51UDxxb23fQhCQ4eMkY/Bm/TJagrMNzkcJD.OmQuq84cxmu	11	t	t	f	\N	0	\N	\N	f	2025-12-11 10:20:28.864539	2025-12-11 10:20:28.864539
24	wrg	wrge@gmail.com	wrg	$2a$10$MlxP7cHVM6hascGqNFraiOm7LTC4QunKWbHglxljF0tQ9d/obY.A.	5	t	f	f	2026-01-19 18:48:12.428533	0	\N	\N	f	2025-12-04 13:14:08.38151	2026-01-19 18:48:12.428533
23	aefqf	sdg@ghmail.com	wqetf	$2a$10$BN57RNEEqB7/MPp6rTtbCexXrxfFnEZu6kECqeTMg07GNiikGSAqu	4	t	t	f	2026-01-19 18:41:15.420561	0	\N	\N	f	2025-12-04 13:13:34.850725	2026-01-19 18:41:15.420561
20	aef	aef@gmail.com	aef	$2a$10$3jGvN0/tdlzmBwe.rVMjEOK31C9x1IRM2CM3q6n3JfeDbo.p93JOq	3	t	t	f	2026-01-19 18:51:53.674633	0	\N	\N	f	2025-12-04 13:08:59.588336	2026-01-19 18:51:53.674633
79	shanthimang	shnathiacc@manager.com		$2a$10$3he5XzJWbJ3k1A7dKdw.VevriAyKGFAbQZ.iO/VfKosERkTiLVk6C	11	t	t	f	2025-12-11 10:30:13.206441	0	\N	\N	f	2025-12-11 10:29:49.769561	2025-12-11 10:30:13.206441
76	manager	manager@acc.com		$2a$10$vCwZWi3vjkdcwxCrx.LBu.SEo.JH3tO1ffrSwl2w8N.0Tk5OBxzJW	11	t	t	f	2025-12-11 10:38:19.996091	0	\N	\N	f	2025-12-11 10:19:26.610135	2025-12-11 10:38:19.996091
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
91	test mang	testmanager@gmail.com	6363737373	$2a$10$Wkdfdk4Y0m6UdTNpEAJYue0yVeaWFIXjBfCUjYeHvLRUJ227qZh0i	39	t	t	f	2025-12-16 18:08:44.11407	0	\N	\N	f	2025-12-14 17:04:38.512123	2025-12-16 18:08:44.11407
120	ak1	me1@ak.com	54645654	$2a$10$Gr4nNK6ydkqrLdnbDp870ua5b7C3MGMnMEJdJuCnj6cy6XgVr6i3a	39	t	t	f	2025-12-17 16:15:37.004965	0	\N	\N	f	2025-12-17 11:38:44.633024	2025-12-17 16:15:37.004965
74	accountant	acc@gktech.ai		$2a$10$sCmRFQTT/ub95b9iDji/3e8eqQSDMNIlbUqLYP4.2N4FuoDlbTZ0S	9	t	t	f	2025-12-17 14:52:15.296683	0	\N	\N	f	2025-12-10 13:17:36.40102	2025-12-17 14:52:15.296683
125	recep1ak	recep1@ak.com	565456764567	$2a$10$NJQOgXYoV0bTX74kV23hvuArnfHRY..DsRyuifTOVQKsmrrE4.YeO	5	t	f	f	2025-12-17 11:54:56.878451	0	\N	\N	f	2025-12-17 11:45:39.171465	2025-12-17 11:54:56.878451
119	admin1	admin1@ak.com	8787656765	$2a$10$1fZx/Y4swnF5cncc9BmEkuvOQyV3FHsKjCmUSP9OdX03BTpAFwuo6	2	t	t	f	2025-12-17 12:12:37.938285	0	\N	\N	f	2025-12-17 10:17:28.451481	2025-12-17 12:12:37.938285
127	doc2	doc2@ak.com	4535	$2a$10$p7WiMRctQBtBwJ21kFyljOw4ppcr0G3c0J9Ry/IpGIBI4YXbXJ4F6	3	t	t	f	\N	0	\N	\N	f	2025-12-17 12:15:12.253627	2025-12-17 12:15:12.253627
128	recep2ak	recep2@ak.com	8756765457	$2a$10$FeohrvHk7X4BsI5U23.Ud.nD88kVcl2tMFnaTBxTobq444L36rZxm	5	t	f	f	\N	0	\N	\N	f	2025-12-17 12:15:51.567499	2025-12-17 12:15:51.567499
130	admin23	aminf@dkfj.com		$2a$10$okX76wAuwGeB7JDGcdi.wOc1DEwzKRI6NaJyJyt7nCcVFHaqXOIoy	2	t	t	f	\N	0	\N	\N	f	2025-12-17 12:46:43.84368	2025-12-17 12:46:43.84368
73	acc1	acc1@gmail.com		$2a$10$yQAAVkOZ/2bDdSYZu5Hm9uTfoNkFkgI04QUSJxRCbUK7QDQpV3iZO	9	t	t	f	2025-12-23 11:53:24.05675	0	\N	\N	f	2025-12-10 12:34:36.988901	2025-12-23 11:53:24.05675
75	accmang	accmang@gmail.com		$2a$10$4MPdlOYmkUn1Qgj04kUIeugTPi951M7bn4qkbCY42pFi.innjHEAq	11	t	t	f	2025-12-23 12:37:55.461396	0	\N	\N	f	2025-12-10 15:46:36.62547	2025-12-23 12:37:55.461396
126	doc1ak	doc1@ak.com	4565454543	$2a$10$F1tpwEZm/1zZeZFEHYRVSeKMmib6GnhnLeAo86Giy21/6xgsIaMqK	3	t	t	f	2025-12-17 15:12:16.326857	0	\N	\N	f	2025-12-17 11:48:41.599657	2025-12-17 15:12:16.326857
132	marketExec1	marketexec@kvhospital.com		$2a$10$3IWNY8mw6oVqvV9txRqPfOY3y.e54Gf/wl4FDo4tu2Y3jFS6e73pO	39	t	t	f	2025-12-17 23:46:36.214469	0	\N	\N	f	2025-12-17 23:46:18.617785	2025-12-17 23:46:36.214469
147	managerAccountsnano	acctmngr@nanoh.com	9867588475	$2a$10$oWcLug6uhwhlzc9OYqFzPeWGZLaobAxL2/OtMasENscbpSwFPACCC	11	t	t	f	\N	0	\N	\N	f	2025-12-18 12:16:24.645492	2025-12-18 12:16:24.645492
141	nanoadmin	admin@nanohospital.com	8984756392	$2a$10$PSHsZKBNADpLnuUCvGLrn.n6TV84pB1w2cVgUMbsgEwvI/CxJO/hu	2	t	t	f	2025-12-18 12:20:27.503791	0	\N	\N	f	2025-12-18 12:08:17.67229	2025-12-18 12:20:27.503791
142	satishk Nanao	satishk@nanoh.com	9878763847	$2a$10$YFFqT5pJ7V2aS5ioO3XViuTSBvooyYgY5ad.ZEwvDfdHKlpXnBP/S	3	t	t	f	2025-12-18 12:34:47.121184	0	\N	\N	f	2025-12-18 12:11:44.523664	2025-12-18 12:34:47.121184
133	kvAccountant	accountant@kvhospital.com	12312463746	$2a$10$oeqFGbHwfFiF6gQR/1zg1uDVnme83ZKbgZA79AGEQZNSFdpB7v3TC	9	t	t	f	2025-12-18 02:00:40.53906	0	\N	\N	f	2025-12-18 00:14:14.327436	2025-12-18 02:00:40.53906
134	camry admin	admin@camryhospitalstest.com	8987645384	$2a$10$ljUcpoHIuJVPNkDwcBFwFOk6u5RTSEwVBvR9QU0EmwlOjnz2lEjRW	2	t	t	f	2025-12-18 07:47:54.819543	0	\N	\N	f	2025-12-18 07:46:41.913832	2025-12-18 07:47:54.819543
135	royf	doc1@camryhospitalstest.com	8794857638	$2a$10$Oed1Sz11mhJzwRo9Xoy4MeBS1odd7dlS6JZqHEzz8o7OXzkaG.gdC	3	t	t	f	\N	0	\N	\N	f	2025-12-18 07:52:22.267891	2025-12-18 07:52:22.267891
136	receptionistcamry	receptionist@camryhospitalstest.com	9761239874	$2a$10$uds35Yy5.oR6waGZMIRi1OcfAeG4h.rptmNXnwOY8qsyWL69VoN3W	5	t	f	f	\N	0	\N	\N	f	2025-12-18 07:53:13.053232	2025-12-18 07:53:13.053232
138	Markmanager	markmanager@camryhospitalstest.com	1234563234	$2a$10$QbPY1AKqRgv8vbNPCiMgGelDE1FfLxWZ.Gbh5d5Ge8KdZPi0YICG6	40	t	t	f	\N	0	\N	\N	f	2025-12-18 07:56:02.854324	2025-12-18 07:56:02.854324
139	acccountantcamry	accountantca@camryhospitalstest.com	8938475628	$2a$10$1RO.wihDdscQ2M6I1f2uuuXcWovSujaBvKkAykxP4jm6X3iADxNw6	9	t	t	f	2025-12-18 10:51:35.417247	0	\N	\N	f	2025-12-18 07:57:04.642941	2025-12-18 10:51:35.417247
140	acctManager	acctmanager@camryhospitalstest.com	8794857368	$2a$10$TfsIOUkzWWLpnFhYm4n4LeIf2ZKbRBwQ0Ih3w7n6e3fNuH78T8uoe	11	t	t	f	2025-12-18 10:57:52.806849	0	\N	\N	f	2025-12-18 07:57:46.877587	2025-12-18 10:57:52.806849
137	Markexec	markexec@camryhospitalstest.com	8475937263	$2a$10$Y3NKptqAWmaB36xEYaHVSuMrgMDZv3bGKh.gn799b0I57PBhrZd8C	39	t	t	f	2025-12-18 10:58:20.594294	0	\N	\N	f	2025-12-18 07:55:07.661001	2025-12-18 10:58:20.594294
143	nanoreceptionist1	receptionist@nanoh.com	8475632873	$2a$10$0O2g3nAipVpIS970BZ7XNOWusFOsGz73rJtumqWJ43gfjCuA426Se	5	t	f	f	2025-12-19 18:39:35.621958	0	\N	\N	f	2025-12-18 12:12:41.877767	2025-12-19 18:39:35.621958
157	accm1kashi	acc1m@kashi.com	8787656566	$2a$10$U5/fj6LslktYzmCxgbdAe.5WmFNEm23bGseKQkvli5fUaT2cOIW/G	11	t	t	f	\N	0	\N	\N	f	2026-01-02 16:19:58.335328	2026-01-02 16:19:58.335328
158	admin1hp	admin1@hp.com	8767656545	$2a$10$b6svcfET7KvDE3p/tt0FJ.fUm2MJWzhwi7V9YvlEuORLUAygXZzju	2	t	t	f	\N	0	\N	\N	f	2026-01-02 16:52:46.758205	2026-01-02 16:52:46.758205
29	recp	rec@gmail.com		$2a$10$TjF2jHBiXDdP3G2Yu3QzIO4iwu5M7hOyAWL7Ov/YcmDE86jwKwGyi	5	t	f	f	2025-12-23 10:36:15.692367	0	\N	\N	f	2025-12-04 15:18:27.769086	2025-12-23 10:36:15.692367
144	mrktexecNano	marketexec@nanoh.com	8958473847	$2a$10$2.nIyJbRWcMOn2gzT5vsIOQODEBmgzkJQNF1tTmBpQtjz55kOcODG	39	t	t	f	2025-12-23 11:51:53.003615	0	\N	\N	f	2025-12-18 12:13:29.924717	2025-12-23 11:51:53.003615
145	managermrktNano	marketmanager@nanoh.com	7893847568	$2a$10$iQmdNorHcP1bjRWNtPDwb.XYQ3mrM1T0eOhCWh4sJQst3ut4.PoqG	40	t	t	f	2025-12-23 11:52:38.05069	0	\N	\N	f	2025-12-18 12:14:18.046555	2025-12-23 11:52:38.05069
131	acc1ak	acc1@ak.com	8765679823	$2a$10$JN96NnXM6gUTmiWIQJG7KOGtlVBPFda96955EqajFnj7rfePgGw52	9	t	t	f	2025-12-23 12:36:46.100099	0	\N	\N	f	2025-12-17 16:17:32.18423	2025-12-23 12:36:46.100099
159	hprecep	recep1@hp.com	7876765676	$2a$10$2c/ee6j5vv4egpyoaWQ.yenHNO1csCaXJWDAsna4S37sDLiUsOLCy	5	t	f	f	2026-01-02 17:01:14.698959	0	\N	\N	f	2026-01-02 17:01:05.358543	2026-01-02 17:01:14.698959
174	accountantkaveri	accountant@kaveri.com	7699878787	$2a$10$imtfIhjuVgcmOs9qDOH6vuPJjmJycV1FkYCD3XkomwQYnUfjSXHL.	9	t	t	f	2026-01-08 14:21:27.982882	0	\N	\N	f	2026-01-08 11:43:53.331693	2026-01-08 14:21:27.982882
154	marketexec1	marketexec1@kashi.com	8787656546	$2a$10$OdeQA0684VMNICcz3mxUvenIzfvIxYmR3MCJpBX72mE9vthcVJLqC	40	t	t	f	\N	0	\N	\N	f	2026-01-02 16:18:04.66752	2026-01-02 16:18:04.66752
152	recep1kashi	recep1@kashi.com	8765676545	$2a$10$sMX0aTVlP2qTgZoxsNxe/.Mal70DP0sMVBN.FDMFwS856.deQyOfi	5	t	f	f	2026-01-02 17:04:35.930497	0	\N	\N	f	2026-01-02 16:15:47.468598	2026-01-02 17:04:35.930497
151	doc1kashi	doc1@kashi.com	8787656676	$2a$10$UklcyngFxWoAAviafXWEReWi0kTKYwLLGT4P6gs5z2O7px0S0W8Gu	3	t	t	f	2026-01-02 17:08:28.423057	0	\N	\N	f	2026-01-02 16:14:48.333525	2026-01-02 17:08:28.423057
149	kashiadmin1	admin1@kashi.com	8787656567	$2a$10$oyQ43ID9s6pEQKXT/yN82OPFps/vFgYQp7XQNTTxpg4WygAbv1cl2	2	t	t	f	2026-01-02 17:14:43.276451	0	\N	\N	f	2026-01-02 16:09:04.300273	2026-01-02 17:14:43.276451
153	market1kashi	market1@kashi.com	8787656765	$2a$10$jwvvUzj..sRZ7H8sNMAVR.TFHH9esHR85GXehqbm/Xmj.W9HLlExe	39	t	t	f	2026-01-02 17:17:44.610256	0	\N	\N	f	2026-01-02 16:16:45.345756	2026-01-02 17:17:44.610256
168	accountskalyanhosp	accountant@kalyan.com	9847635256	$2a$10$DdEt3CHbre5mj0ei0SOUUOYzERsZ6Ry2H5gd.8KQcxLm3RvX2OoG2	9	t	t	f	\N	0	\N	\N	f	2026-01-07 12:15:17.130952	2026-01-07 12:15:17.130952
155	acc1kashi	acc1@kashi.com	8977545678	$2a$10$C2nmhhSr7pufHMT330b0iOopqG8LrFu5d.9yS.wm6lTagTaFMQaHW	9	t	t	f	2026-01-02 17:30:50.760266	0	\N	\N	f	2026-01-02 16:19:03.224386	2026-01-02 17:30:50.760266
170	recep1kaveri	recep1@kaveri.com	656576576	$2a$10$bFzDiQ8EY9do8izBpV9wCOUqUbRotXsOXc1U3PdEJap30Z7N4JhCC	5	t	f	f	\N	0	\N	\N	f	2026-01-08 11:34:05.398303	2026-01-08 11:34:27.627614
163	kalyanreception	receptionist@kalyan.com	9985463524	$2a$10$v6/IlZAZg6okLep1eIfcleLXFWYioeX5ncjBdtT2Ccgf/vktm6UvW	5	t	f	f	2026-01-07 12:16:28.521137	0	\N	\N	f	2026-01-07 12:12:50.055144	2026-01-07 12:16:28.521137
160	admin1kalyan	admin1@kalyan.com	8787656545	$2a$10$PhIjr/qiNTmJC9gi41mAGeVqQCv0PBDKGzbc7NQxIHhpQdfl8dcP6	2	t	t	f	\N	0	\N	\N	f	2026-01-07 12:08:44.692563	2026-01-07 12:08:44.692563
164	marketingkalyan	marketing@kalyan.com	8746583625	$2a$10$cb3miWWWMLFcDyOy0ckwI.2eGVBRwAMO9ZCB8g3xzD8VYA1XHhQCy	39	t	t	f	\N	0	\N	\N	f	2026-01-07 12:13:31.763002	2026-01-07 12:13:31.763002
165	acctkalyan	accounts@kalyan.com	8745762938	$2a$10$mZ6Y1WbhtNAOWA3TZas2T.qixcs5oiCSOMXnR/406Lqs0xG/I9fAa	9	t	t	f	\N	0	\N	\N	f	2026-01-07 12:14:16.896687	2026-01-07 12:14:16.896687
162	doc kalyan	doc1@kalyan.com	998857463	$2a$10$esKb4tF/CXyr3u.lNoT4IOtPRp2yzvzjtAMKGuhexymNVRACSwkA.	3	t	t	f	2026-01-07 12:28:46.759298	0	\N	\N	f	2026-01-07 12:12:11.457039	2026-01-07 12:28:46.759298
146	accountatnnano	acctsuser@nanoh.com	9847563847	$2a$10$xAxV9GD6lLLXDM8MOX02z.e3Od.q5t6nujx16M.R0C5RxrFzdg4Yu	9	t	t	f	2026-01-08 14:19:40.407252	0	\N	\N	f	2025-12-18 12:15:37.947782	2026-01-08 14:19:40.407252
171	recep2kaveri	recep2@kaveri.com	8374932752	$2a$10$pD3BvKsSR8Bye0D4N8iXVOG8TXc5C3t9je.QTgupgFNAHiWV7ol6a	5	t	f	f	2026-01-08 11:44:38.07509	0	\N	\N	f	2026-01-08 11:36:02.807367	2026-01-08 11:44:38.07509
175	doc1kaveri	doc1@kaveri.com	9884578457	$2a$10$TfolAXC7Dsw0cixVivV0tOf5mIRqBRvfPNLm8ZdgqN2b6XVaQpKOO	3	t	t	f	2026-01-08 12:18:25.027903	0	\N	\N	f	2026-01-08 11:52:40.331227	2026-01-08 12:18:25.027903
172	marketingexeckaveri	marketingexecutive@kaveri.com	8475498578	$2a$10$jxK.dpbehOBNVH61WJMSP.qf9vO6O37UiCd6pKnssaNOY4TLAjBsa	39	t	t	f	2026-01-08 13:10:03.567725	0	\N	\N	f	2026-01-08 11:40:53.116827	2026-01-08 13:10:03.567725
5	madhus	madhu@apollo.com	3454545454	$2a$10$oKBdxCEE2IlBYwwrOGwBK.9kqQrvTf6jTlSmt35qsYEQWOaYoPr1G	2	t	t	f	\N	4	\N	\N	f	2025-12-04 11:34:02.498301	2026-01-13 11:51:49.756571
169	kaveriAdmin1	admin1@kaveri.com	87878787878	$2a$10$ThVDZpQZFD37qv0zDeGN3.Z0EDfZmm/J9qJIa4uMpkFxJy/qLDeL6	2	t	t	f	2026-01-13 11:55:07.754869	0	\N	\N	f	2026-01-07 16:56:54.292284	2026-01-13 11:55:07.754869
30	doc1	doc@gmail.com		$2a$10$WJNuev4wB2jE4WKFVobK5uWUnQ8MdUbdk5I.Fdpv3z2LV1OEZO.uu	3	t	t	f	2026-01-19 18:09:26.038554	0	\N	\N	f	2025-12-04 15:46:19.526657	2026-01-19 18:09:26.038554
176	pharmacist_user	pharmacist@hms.com	9876543210	$2a$10$22SoCYqKO7A4X3lY5PRWpeWRsouzjF14DterfNpdGls2FinpR/lea	6	t	t	f	\N	0	\N	\N	f	2026-01-19 16:58:45.606425	2026-01-19 16:59:20.633778
1	superadmin	admin@phchms.com	1234567890	$2a$10$6DY4twOM8RYBL2./Hgd6Y.mSd.NG8hJhv2CR/z97CGX3Is1YFR64C	1	t	t	f	2026-01-20 16:38:00.811363	0	\N	\N	f	2025-12-04 10:46:10.121592	2026-01-20 16:38:00.811363
177	Vibin	vibin@care24.com	8123456780	$2a$10$cDLB4EQ9ZQDqM.esUqfwO.MAbVtisQgv9h09fonfuIS60NlnB4Ez.	2	t	t	f	2026-01-30 17:08:23.178023	0	\N	\N	f	2026-01-20 12:07:54.34217	2026-01-30 17:08:23.178023
178	Anju	doctor@care24.com	4532745325	$2a$10$2ZOK040YqoNzjdcFHMylB.N2ZskPMoSVhV0qAGhpuWqtDXn4ahlMm	3	t	t	f	2026-02-02 10:24:51.572706	0	\N	\N	f	2026-01-20 12:25:51.644667	2026-02-02 10:24:51.572706
180	geetha	receptionist@care24.com	6757472974	$2a$10$T29I8UNb0gVQKRSVhT/YPuPjL/d2BBU..zGlwerVXvhgAxNdxeYAK	5	t	f	f	2026-02-02 10:25:50.903954	0	\N	\N	f	2026-01-20 12:55:48.509375	2026-02-02 10:25:50.903954
179	Olivia	nurse@care24.com	4846846846	$2a$10$GxzhI67xGPjwv8sbkFbz..PqeuZkniA1CM/7ccJaw.sVoOddR.2NW	4	t	t	f	2026-02-02 10:32:01.838326	0	\N	\N	f	2026-01-20 12:53:40.345306	2026-02-02 10:32:01.838326
185	Vimal	doctorc@care24.com	5373575969	$2a$10$D.BKbU5Z/Epq5pKZoL.jTOqQQdRJJ450JHC0vcdrHPiZvDsf0C0jm	3	t	t	f	\N	0	\N	\N	f	2026-01-23 17:59:07.354489	2026-01-23 17:59:07.354489
186	Vikram	vikram@care24.com	4652843684	$2a$10$X7WTUnaZGVZKgJKqmLAVLemHgYUjZ2HCSvhx3ku.PPwFCd5iFlQQ2	3	t	t	f	\N	0	\N	\N	f	2026-01-23 18:07:18.915281	2026-01-23 18:07:18.915281
\.


--
-- TOC entry 6046 (class 0 OID 0)
-- Dependencies: 221
-- Name: appointments_appointment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointments_appointment_id_seq', 28, true);


--
-- TOC entry 6047 (class 0 OID 0)
-- Dependencies: 223
-- Name: billing_items_bill_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.billing_items_bill_item_id_seq', 1, false);


--
-- TOC entry 6048 (class 0 OID 0)
-- Dependencies: 225
-- Name: billings_bill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.billings_bill_id_seq', 1, false);


--
-- TOC entry 6049 (class 0 OID 0)
-- Dependencies: 227
-- Name: branch_departments_hospital_dept_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branch_departments_hospital_dept_id_seq', 91, true);


--
-- TOC entry 6050 (class 0 OID 0)
-- Dependencies: 229
-- Name: branch_services_branch_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branch_services_branch_service_id_seq', 98, true);


--
-- TOC entry 6051 (class 0 OID 0)
-- Dependencies: 231
-- Name: branches_branch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branches_branch_id_seq', 55, true);


--
-- TOC entry 6052 (class 0 OID 0)
-- Dependencies: 233
-- Name: client_modules_client_module_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.client_modules_client_module_id_seq', 1, false);


--
-- TOC entry 6053 (class 0 OID 0)
-- Dependencies: 235
-- Name: consultation_outcomes_outcome_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.consultation_outcomes_outcome_id_seq', 49, true);


--
-- TOC entry 6054 (class 0 OID 0)
-- Dependencies: 237
-- Name: departments_department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_department_id_seq', 27, true);


--
-- TOC entry 6055 (class 0 OID 0)
-- Dependencies: 239
-- Name: doctor_branch_departments_doc_hosp_dept_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_branch_departments_doc_hosp_dept_id_seq', 1, false);


--
-- TOC entry 6056 (class 0 OID 0)
-- Dependencies: 241
-- Name: doctor_branches_doc_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_branches_doc_hospital_id_seq', 48, true);


--
-- TOC entry 6057 (class 0 OID 0)
-- Dependencies: 243
-- Name: doctor_departments_doc_dept_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_departments_doc_dept_id_seq', 26, true);


--
-- TOC entry 6058 (class 0 OID 0)
-- Dependencies: 245
-- Name: doctor_shifts_doctor_shift_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_shifts_doctor_shift_id_seq', 1, false);


--
-- TOC entry 6059 (class 0 OID 0)
-- Dependencies: 312
-- Name: doctor_weekly_schedules_schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_weekly_schedules_schedule_id_seq', 37, true);


--
-- TOC entry 6060 (class 0 OID 0)
-- Dependencies: 247
-- Name: doctors_doctor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctors_doctor_id_seq', 45, true);


--
-- TOC entry 6061 (class 0 OID 0)
-- Dependencies: 249
-- Name: hospital_services_hosp_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hospital_services_hosp_service_id_seq', 23, true);


--
-- TOC entry 6062 (class 0 OID 0)
-- Dependencies: 251
-- Name: hospitals_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hospitals_hospital_id_seq', 46, true);


--
-- TOC entry 6063 (class 0 OID 0)
-- Dependencies: 253
-- Name: insurance_claims_claim_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.insurance_claims_claim_id_seq', 30, true);


--
-- TOC entry 6064 (class 0 OID 0)
-- Dependencies: 255
-- Name: lead_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lead_data_id_seq', 1, true);


--
-- TOC entry 6065 (class 0 OID 0)
-- Dependencies: 314
-- Name: medical_services_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.medical_services_service_id_seq', 1857, true);


--
-- TOC entry 6066 (class 0 OID 0)
-- Dependencies: 257
-- Name: mlc_entries_mlc_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mlc_entries_mlc_id_seq', 7, true);


--
-- TOC entry 6067 (class 0 OID 0)
-- Dependencies: 259
-- Name: modules_module_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.modules_module_id_seq', 8, true);


--
-- TOC entry 6068 (class 0 OID 0)
-- Dependencies: 261
-- Name: nurse_branches_nurse_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nurse_branches_nurse_hospital_id_seq', 17, true);


--
-- TOC entry 6069 (class 0 OID 0)
-- Dependencies: 263
-- Name: nurse_shifts_nurse_shift_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nurse_shifts_nurse_shift_id_seq', 1, false);


--
-- TOC entry 6070 (class 0 OID 0)
-- Dependencies: 265
-- Name: nurses_nurse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nurses_nurse_id_seq', 18, true);


--
-- TOC entry 6071 (class 0 OID 0)
-- Dependencies: 267
-- Name: opd_entries_opd_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.opd_entries_opd_id_seq', 89, true);


--
-- TOC entry 6072 (class 0 OID 0)
-- Dependencies: 269
-- Name: password_reset_tokens_token_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_reset_tokens_token_id_seq', 1, false);


--
-- TOC entry 6073 (class 0 OID 0)
-- Dependencies: 310
-- Name: patient_feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.patient_feedback_id_seq', 3, true);


--
-- TOC entry 6074 (class 0 OID 0)
-- Dependencies: 271
-- Name: patients_patient_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.patients_patient_id_seq', 72, true);


--
-- TOC entry 6075 (class 0 OID 0)
-- Dependencies: 273
-- Name: prescriptions_prescription_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prescriptions_prescription_id_seq', 22, true);


--
-- TOC entry 6076 (class 0 OID 0)
-- Dependencies: 275
-- Name: referral_doctor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_doctor_id_seq', 11, true);


--
-- TOC entry 6077 (class 0 OID 0)
-- Dependencies: 277
-- Name: referral_doctor_service_percentage_percentage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_doctor_service_percentage_percentage_id_seq', 29, true);


--
-- TOC entry 6078 (class 0 OID 0)
-- Dependencies: 279
-- Name: referral_doctors_referral_doctor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_doctors_referral_doctor_id_seq', 9, true);


--
-- TOC entry 6079 (class 0 OID 0)
-- Dependencies: 281
-- Name: referral_hospital_mapping_mapping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_hospital_mapping_mapping_id_seq', 16, true);


--
-- TOC entry 6080 (class 0 OID 0)
-- Dependencies: 283
-- Name: referral_hospitals_referral_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_hospitals_referral_hospital_id_seq', 25, true);


--
-- TOC entry 6081 (class 0 OID 0)
-- Dependencies: 285
-- Name: referral_patients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_patients_id_seq', 12, true);


--
-- TOC entry 6082 (class 0 OID 0)
-- Dependencies: 287
-- Name: referral_payment_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_payment_details_id_seq', 115, true);


--
-- TOC entry 6083 (class 0 OID 0)
-- Dependencies: 289
-- Name: referral_payment_header_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_payment_header_id_seq', 23, true);


--
-- TOC entry 6084 (class 0 OID 0)
-- Dependencies: 291
-- Name: referral_payment_upload_batch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_payment_upload_batch_id_seq', 14, true);


--
-- TOC entry 6085 (class 0 OID 0)
-- Dependencies: 293
-- Name: referral_payments_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referral_payments_payment_id_seq', 1, false);


--
-- TOC entry 6086 (class 0 OID 0)
-- Dependencies: 295
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 51, true);


--
-- TOC entry 6087 (class 0 OID 0)
-- Dependencies: 297
-- Name: services_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_service_id_seq', 88, true);


--
-- TOC entry 6088 (class 0 OID 0)
-- Dependencies: 299
-- Name: shift_branches_shift_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shift_branches_shift_hospital_id_seq', 1, false);


--
-- TOC entry 6089 (class 0 OID 0)
-- Dependencies: 301
-- Name: shifts_shift_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shifts_shift_id_seq', 1, false);


--
-- TOC entry 6090 (class 0 OID 0)
-- Dependencies: 304
-- Name: staff_branches_staff_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.staff_branches_staff_hospital_id_seq', 87, true);


--
-- TOC entry 6091 (class 0 OID 0)
-- Dependencies: 305
-- Name: staff_staff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.staff_staff_id_seq', 83, true);


--
-- TOC entry 6092 (class 0 OID 0)
-- Dependencies: 307
-- Name: user_sessions_session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_sessions_session_id_seq', 552, true);


--
-- TOC entry 6093 (class 0 OID 0)
-- Dependencies: 309
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 186, true);


--
-- TOC entry 5399 (class 2606 OID 20763)
-- Name: appointments appointments_appointment_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_appointment_number_key UNIQUE (appointment_number);


--
-- TOC entry 5401 (class 2606 OID 20765)
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (appointment_id);


--
-- TOC entry 5407 (class 2606 OID 20767)
-- Name: billing_items billing_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_pkey PRIMARY KEY (bill_item_id);


--
-- TOC entry 5409 (class 2606 OID 20769)
-- Name: billings billings_bill_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_bill_number_key UNIQUE (bill_number);


--
-- TOC entry 5411 (class 2606 OID 20771)
-- Name: billings billings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_pkey PRIMARY KEY (bill_id);


--
-- TOC entry 5416 (class 2606 OID 20773)
-- Name: branch_departments branch_departments_branch_id_department_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_departments
    ADD CONSTRAINT branch_departments_branch_id_department_id_key UNIQUE (branch_id, department_id);


--
-- TOC entry 5418 (class 2606 OID 20775)
-- Name: branch_departments branch_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_departments
    ADD CONSTRAINT branch_departments_pkey PRIMARY KEY (hospital_dept_id);


--
-- TOC entry 5420 (class 2606 OID 20777)
-- Name: branch_services branch_services_branch_id_service_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_services
    ADD CONSTRAINT branch_services_branch_id_service_id_key UNIQUE (branch_id, service_id);


--
-- TOC entry 5422 (class 2606 OID 20779)
-- Name: branch_services branch_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_services
    ADD CONSTRAINT branch_services_pkey PRIMARY KEY (branch_service_id);


--
-- TOC entry 5424 (class 2606 OID 20781)
-- Name: branches branches_hospital_id_branch_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_hospital_id_branch_code_key UNIQUE (hospital_id, branch_code);


--
-- TOC entry 5426 (class 2606 OID 20783)
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (branch_id);


--
-- TOC entry 5430 (class 2606 OID 20785)
-- Name: client_modules client_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules
    ADD CONSTRAINT client_modules_pkey PRIMARY KEY (client_module_id);


--
-- TOC entry 5432 (class 2606 OID 20787)
-- Name: client_modules client_modules_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules
    ADD CONSTRAINT client_modules_uuid_unique UNIQUE (uuid);


--
-- TOC entry 5436 (class 2606 OID 20789)
-- Name: consultation_outcomes consultation_outcomes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_outcomes
    ADD CONSTRAINT consultation_outcomes_pkey PRIMARY KEY (outcome_id);


--
-- TOC entry 5439 (class 2606 OID 20791)
-- Name: departments departments_department_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_department_code_key UNIQUE (department_code);


--
-- TOC entry 5441 (class 2606 OID 20793)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);


--
-- TOC entry 5443 (class 2606 OID 20795)
-- Name: doctor_branch_departments doctor_branch_departments_doctor_id_branch_id_department_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branch_departments
    ADD CONSTRAINT doctor_branch_departments_doctor_id_branch_id_department_id_key UNIQUE (doctor_id, branch_id, department_id);


--
-- TOC entry 5445 (class 2606 OID 20797)
-- Name: doctor_branch_departments doctor_branch_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branch_departments
    ADD CONSTRAINT doctor_branch_departments_pkey PRIMARY KEY (doc_hosp_dept_id);


--
-- TOC entry 5447 (class 2606 OID 20799)
-- Name: doctor_branches doctor_branches_doctor_id_branch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branches
    ADD CONSTRAINT doctor_branches_doctor_id_branch_id_key UNIQUE (doctor_id, branch_id);


--
-- TOC entry 5449 (class 2606 OID 20801)
-- Name: doctor_branches doctor_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branches
    ADD CONSTRAINT doctor_branches_pkey PRIMARY KEY (doc_hospital_id);


--
-- TOC entry 5451 (class 2606 OID 20803)
-- Name: doctor_departments doctor_departments_doctor_id_department_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_departments
    ADD CONSTRAINT doctor_departments_doctor_id_department_id_key UNIQUE (doctor_id, department_id);


--
-- TOC entry 5453 (class 2606 OID 20805)
-- Name: doctor_departments doctor_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_departments
    ADD CONSTRAINT doctor_departments_pkey PRIMARY KEY (doc_dept_id);


--
-- TOC entry 5455 (class 2606 OID 20807)
-- Name: doctor_shifts doctor_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_shifts
    ADD CONSTRAINT doctor_shifts_pkey PRIMARY KEY (doctor_shift_id);


--
-- TOC entry 5615 (class 2606 OID 21494)
-- Name: doctor_weekly_schedules doctor_weekly_schedules_doctor_id_branch_id_day_of_week_sta_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_weekly_schedules
    ADD CONSTRAINT doctor_weekly_schedules_doctor_id_branch_id_day_of_week_sta_key UNIQUE (doctor_id, branch_id, day_of_week, start_time);


--
-- TOC entry 5617 (class 2606 OID 21492)
-- Name: doctor_weekly_schedules doctor_weekly_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_weekly_schedules
    ADD CONSTRAINT doctor_weekly_schedules_pkey PRIMARY KEY (schedule_id);


--
-- TOC entry 5457 (class 2606 OID 20809)
-- Name: doctors doctors_doctor_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_doctor_code_key UNIQUE (doctor_code);


--
-- TOC entry 5459 (class 2606 OID 20811)
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (doctor_id);


--
-- TOC entry 5461 (class 2606 OID 20813)
-- Name: doctors doctors_registration_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_registration_number_key UNIQUE (registration_number);


--
-- TOC entry 5465 (class 2606 OID 20815)
-- Name: hospital_services hospital_services_hospital_id_branch_id_service_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospital_services
    ADD CONSTRAINT hospital_services_hospital_id_branch_id_service_code_key UNIQUE (hospital_id, branch_id, service_code);


--
-- TOC entry 5467 (class 2606 OID 20817)
-- Name: hospital_services hospital_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospital_services
    ADD CONSTRAINT hospital_services_pkey PRIMARY KEY (hosp_service_id);


--
-- TOC entry 5469 (class 2606 OID 20819)
-- Name: hospitals hospitals_hospital_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitals
    ADD CONSTRAINT hospitals_hospital_code_key UNIQUE (hospital_code);


--
-- TOC entry 5471 (class 2606 OID 20821)
-- Name: hospitals hospitals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitals
    ADD CONSTRAINT hospitals_pkey PRIMARY KEY (hospital_id);


--
-- TOC entry 5473 (class 2606 OID 20823)
-- Name: insurance_claims insurance_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_pkey PRIMARY KEY (claim_id);


--
-- TOC entry 5475 (class 2606 OID 20825)
-- Name: lead_data lead_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lead_data
    ADD CONSTRAINT lead_data_pkey PRIMARY KEY (id);


--
-- TOC entry 5624 (class 2606 OID 21526)
-- Name: medical_services medical_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_services
    ADD CONSTRAINT medical_services_pkey PRIMARY KEY (service_id);


--
-- TOC entry 5480 (class 2606 OID 20827)
-- Name: mlc_entries mlc_entries_mlc_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mlc_entries
    ADD CONSTRAINT mlc_entries_mlc_number_key UNIQUE (mlc_number);


--
-- TOC entry 5482 (class 2606 OID 20829)
-- Name: mlc_entries mlc_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mlc_entries
    ADD CONSTRAINT mlc_entries_pkey PRIMARY KEY (mlc_id);


--
-- TOC entry 5484 (class 2606 OID 20831)
-- Name: modules modules_module_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_module_code_key UNIQUE (module_code);


--
-- TOC entry 5486 (class 2606 OID 20833)
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (module_id);


--
-- TOC entry 5488 (class 2606 OID 20835)
-- Name: modules modules_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_uuid_unique UNIQUE (uuid);


--
-- TOC entry 5490 (class 2606 OID 20837)
-- Name: nurse_branches nurse_branches_nurse_id_branch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_branches
    ADD CONSTRAINT nurse_branches_nurse_id_branch_id_key UNIQUE (nurse_id, branch_id);


--
-- TOC entry 5492 (class 2606 OID 20839)
-- Name: nurse_branches nurse_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_branches
    ADD CONSTRAINT nurse_branches_pkey PRIMARY KEY (nurse_hospital_id);


--
-- TOC entry 5494 (class 2606 OID 20841)
-- Name: nurse_shifts nurse_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_shifts
    ADD CONSTRAINT nurse_shifts_pkey PRIMARY KEY (nurse_shift_id);


--
-- TOC entry 5498 (class 2606 OID 20843)
-- Name: nurses nurses_nurse_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses
    ADD CONSTRAINT nurses_nurse_code_key UNIQUE (nurse_code);


--
-- TOC entry 5500 (class 2606 OID 20845)
-- Name: nurses nurses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses
    ADD CONSTRAINT nurses_pkey PRIMARY KEY (nurse_id);


--
-- TOC entry 5502 (class 2606 OID 20847)
-- Name: nurses nurses_registration_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses
    ADD CONSTRAINT nurses_registration_number_key UNIQUE (registration_number);


--
-- TOC entry 5507 (class 2606 OID 20849)
-- Name: opd_entries opd_entries_opd_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_opd_number_key UNIQUE (opd_number);


--
-- TOC entry 5509 (class 2606 OID 20851)
-- Name: opd_entries opd_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_pkey PRIMARY KEY (opd_id);


--
-- TOC entry 5513 (class 2606 OID 20853)
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (token_id);


--
-- TOC entry 5515 (class 2606 OID 20855)
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- TOC entry 5613 (class 2606 OID 21464)
-- Name: patient_feedback patient_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_feedback
    ADD CONSTRAINT patient_feedback_pkey PRIMARY KEY (id);


--
-- TOC entry 5520 (class 2606 OID 20857)
-- Name: patients patients_mrn_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_mrn_number_key UNIQUE (mrn_number);


--
-- TOC entry 5522 (class 2606 OID 20859)
-- Name: patients patients_patient_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_patient_code_key UNIQUE (patient_code);


--
-- TOC entry 5524 (class 2606 OID 20861)
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (patient_id);


--
-- TOC entry 5526 (class 2606 OID 20863)
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (prescription_id);


--
-- TOC entry 5528 (class 2606 OID 20865)
-- Name: referral_doctor_module referral_doctor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_module
    ADD CONSTRAINT referral_doctor_pkey PRIMARY KEY (id);


--
-- TOC entry 5532 (class 2606 OID 20867)
-- Name: referral_doctor_service_percentage_module referral_doctor_service_percentage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_service_percentage_module
    ADD CONSTRAINT referral_doctor_service_percentage_pkey PRIMARY KEY (percentage_id);


--
-- TOC entry 5534 (class 2606 OID 20869)
-- Name: referral_doctor_service_percentage_module referral_doctor_service_percentage_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_service_percentage_module
    ADD CONSTRAINT referral_doctor_service_percentage_uuid_unique UNIQUE (uuid);


--
-- TOC entry 5530 (class 2606 OID 20871)
-- Name: referral_doctor_module referral_doctor_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_module
    ADD CONSTRAINT referral_doctor_uuid_unique UNIQUE (uuid);


--
-- TOC entry 5537 (class 2606 OID 20873)
-- Name: referral_doctors referral_doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctors
    ADD CONSTRAINT referral_doctors_pkey PRIMARY KEY (referral_doctor_id);


--
-- TOC entry 5541 (class 2606 OID 20875)
-- Name: referral_hospital_mapping referral_hospital_mapping_branch_id_referral_hospital_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_hospital_mapping
    ADD CONSTRAINT referral_hospital_mapping_branch_id_referral_hospital_id_key UNIQUE (branch_id, referral_hospital_id);


--
-- TOC entry 5543 (class 2606 OID 20877)
-- Name: referral_hospital_mapping referral_hospital_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_hospital_mapping
    ADD CONSTRAINT referral_hospital_mapping_pkey PRIMARY KEY (mapping_id);


--
-- TOC entry 5545 (class 2606 OID 20879)
-- Name: referral_hospitals referral_hospitals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_hospitals
    ADD CONSTRAINT referral_hospitals_pkey PRIMARY KEY (referral_hospital_id);


--
-- TOC entry 5549 (class 2606 OID 20881)
-- Name: referral_patients referral_patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_patients
    ADD CONSTRAINT referral_patients_pkey PRIMARY KEY (id);


--
-- TOC entry 5551 (class 2606 OID 20883)
-- Name: referral_patients referral_patients_referral_patient_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_patients
    ADD CONSTRAINT referral_patients_referral_patient_id_key UNIQUE (referral_patient_id);


--
-- TOC entry 5554 (class 2606 OID 20885)
-- Name: referral_payment_details referral_payment_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_details
    ADD CONSTRAINT referral_payment_details_pkey PRIMARY KEY (id);


--
-- TOC entry 5556 (class 2606 OID 20887)
-- Name: referral_payment_details referral_payment_details_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_details
    ADD CONSTRAINT referral_payment_details_uuid_key UNIQUE (uuid);


--
-- TOC entry 5559 (class 2606 OID 20889)
-- Name: referral_payment_header referral_payment_header_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_header
    ADD CONSTRAINT referral_payment_header_pkey PRIMARY KEY (id);


--
-- TOC entry 5561 (class 2606 OID 20891)
-- Name: referral_payment_header referral_payment_header_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_header
    ADD CONSTRAINT referral_payment_header_uuid_key UNIQUE (uuid);


--
-- TOC entry 5564 (class 2606 OID 20893)
-- Name: referral_payment_upload_batch referral_payment_upload_batch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_upload_batch
    ADD CONSTRAINT referral_payment_upload_batch_pkey PRIMARY KEY (id);


--
-- TOC entry 5566 (class 2606 OID 20895)
-- Name: referral_payment_upload_batch referral_payment_upload_batch_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_upload_batch
    ADD CONSTRAINT referral_payment_upload_batch_uuid_key UNIQUE (uuid);


--
-- TOC entry 5571 (class 2606 OID 20897)
-- Name: referral_payments referral_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payments
    ADD CONSTRAINT referral_payments_pkey PRIMARY KEY (payment_id);


--
-- TOC entry 5573 (class 2606 OID 20899)
-- Name: referral_payments referral_payments_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payments
    ADD CONSTRAINT referral_payments_uuid_key UNIQUE (uuid);


--
-- TOC entry 5575 (class 2606 OID 20901)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 5577 (class 2606 OID 20903)
-- Name: roles roles_role_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_code_key UNIQUE (role_code);


--
-- TOC entry 5579 (class 2606 OID 20905)
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (service_id);


--
-- TOC entry 5581 (class 2606 OID 20907)
-- Name: services services_service_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_service_code_key UNIQUE (service_code);


--
-- TOC entry 5583 (class 2606 OID 20909)
-- Name: shift_branches shift_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_branches
    ADD CONSTRAINT shift_branches_pkey PRIMARY KEY (shift_hospital_id);


--
-- TOC entry 5585 (class 2606 OID 20911)
-- Name: shift_branches shift_branches_shift_id_branch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_branches
    ADD CONSTRAINT shift_branches_shift_id_branch_id_key UNIQUE (shift_id, branch_id);


--
-- TOC entry 5587 (class 2606 OID 20913)
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (shift_id);


--
-- TOC entry 5589 (class 2606 OID 20915)
-- Name: shifts shifts_shift_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_shift_code_key UNIQUE (shift_code);


--
-- TOC entry 5595 (class 2606 OID 20917)
-- Name: staff_branches staff_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_branches
    ADD CONSTRAINT staff_branches_pkey PRIMARY KEY (staff_hospital_id);


--
-- TOC entry 5597 (class 2606 OID 20919)
-- Name: staff_branches staff_branches_staff_id_branch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_branches
    ADD CONSTRAINT staff_branches_staff_id_branch_id_key UNIQUE (staff_id, branch_id);


--
-- TOC entry 5591 (class 2606 OID 20921)
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (staff_id);


--
-- TOC entry 5593 (class 2606 OID 20923)
-- Name: staff staff_staff_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_staff_code_key UNIQUE (staff_code);


--
-- TOC entry 5602 (class 2606 OID 20925)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);


--
-- TOC entry 5607 (class 2606 OID 20927)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5609 (class 2606 OID 20929)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5611 (class 2606 OID 20931)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5402 (class 1259 OID 20932)
-- Name: idx_appointments_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_date ON public.appointments USING btree (appointment_date);


--
-- TOC entry 5403 (class 1259 OID 20933)
-- Name: idx_appointments_doctor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_doctor ON public.appointments USING btree (doctor_id);


--
-- TOC entry 5404 (class 1259 OID 20934)
-- Name: idx_appointments_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_patient ON public.appointments USING btree (patient_id);


--
-- TOC entry 5405 (class 1259 OID 20935)
-- Name: idx_appointments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_appointments_status ON public.appointments USING btree (appointment_status);


--
-- TOC entry 5562 (class 1259 OID 20936)
-- Name: idx_batch_hospital; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_batch_hospital ON public.referral_payment_upload_batch USING btree (hospital_id);


--
-- TOC entry 5412 (class 1259 OID 20937)
-- Name: idx_billings_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_billings_date ON public.billings USING btree (bill_date);


--
-- TOC entry 5413 (class 1259 OID 20938)
-- Name: idx_billings_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_billings_patient ON public.billings USING btree (patient_id);


--
-- TOC entry 5414 (class 1259 OID 20939)
-- Name: idx_billings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_billings_status ON public.billings USING btree (bill_status);


--
-- TOC entry 5427 (class 1259 OID 20940)
-- Name: idx_branches_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_branches_active ON public.branches USING btree (is_active);


--
-- TOC entry 5428 (class 1259 OID 20941)
-- Name: idx_branches_hospital; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_branches_hospital ON public.branches USING btree (hospital_id);


--
-- TOC entry 5433 (class 1259 OID 20942)
-- Name: idx_client_modules_branch_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_client_modules_branch_level ON public.client_modules USING btree (client_id, module_id, branch_id) WHERE (branch_id IS NOT NULL);


--
-- TOC entry 5434 (class 1259 OID 20943)
-- Name: idx_client_modules_hospital_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_client_modules_hospital_level ON public.client_modules USING btree (client_id, module_id) WHERE (branch_id IS NULL);


--
-- TOC entry 5437 (class 1259 OID 20944)
-- Name: idx_consultations_referral; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultations_referral ON public.consultation_outcomes USING btree (referral_doctor_id);


--
-- TOC entry 5552 (class 1259 OID 20945)
-- Name: idx_details_header; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_details_header ON public.referral_payment_details USING btree (payment_header_id);


--
-- TOC entry 5462 (class 1259 OID 20946)
-- Name: idx_doctors_registration; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_doctors_registration ON public.doctors USING btree (registration_number);


--
-- TOC entry 5463 (class 1259 OID 20947)
-- Name: idx_doctors_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_doctors_user ON public.doctors USING btree (user_id);


--
-- TOC entry 5618 (class 1259 OID 21506)
-- Name: idx_dr_schedule_branch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dr_schedule_branch ON public.doctor_weekly_schedules USING btree (branch_id);


--
-- TOC entry 5619 (class 1259 OID 21505)
-- Name: idx_dr_schedule_day; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dr_schedule_day ON public.doctor_weekly_schedules USING btree (day_of_week);


--
-- TOC entry 5557 (class 1259 OID 20948)
-- Name: idx_header_batch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_header_batch ON public.referral_payment_header USING btree (batch_id);


--
-- TOC entry 5620 (class 1259 OID 21527)
-- Name: idx_medical_services_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_medical_services_category ON public.medical_services USING btree (category);


--
-- TOC entry 5621 (class 1259 OID 21528)
-- Name: idx_medical_services_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_medical_services_name ON public.medical_services USING btree (service_name);


--
-- TOC entry 5622 (class 1259 OID 21529)
-- Name: idx_medical_services_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_medical_services_search ON public.medical_services USING gin (to_tsvector('english'::regconfig, (service_name)::text));


--
-- TOC entry 5476 (class 1259 OID 20949)
-- Name: idx_mlc_mlc_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mlc_mlc_number ON public.mlc_entries USING btree (mlc_number);


--
-- TOC entry 5477 (class 1259 OID 20950)
-- Name: idx_mlc_opd_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mlc_opd_id ON public.mlc_entries USING btree (opd_id);


--
-- TOC entry 5478 (class 1259 OID 20951)
-- Name: idx_mlc_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mlc_patient_id ON public.mlc_entries USING btree (patient_id);


--
-- TOC entry 5495 (class 1259 OID 20952)
-- Name: idx_nurses_registration; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nurses_registration ON public.nurses USING btree (registration_number);


--
-- TOC entry 5496 (class 1259 OID 20953)
-- Name: idx_nurses_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nurses_user ON public.nurses USING btree (user_id);


--
-- TOC entry 5503 (class 1259 OID 20954)
-- Name: idx_opd_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_opd_date ON public.opd_entries USING btree (visit_date);


--
-- TOC entry 5504 (class 1259 OID 20955)
-- Name: idx_opd_doctor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_opd_doctor ON public.opd_entries USING btree (doctor_id);


--
-- TOC entry 5505 (class 1259 OID 20956)
-- Name: idx_opd_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_opd_patient ON public.opd_entries USING btree (patient_id);


--
-- TOC entry 5510 (class 1259 OID 20957)
-- Name: idx_password_reset_tokens_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- TOC entry 5511 (class 1259 OID 20958)
-- Name: idx_password_reset_tokens_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- TOC entry 5516 (class 1259 OID 20959)
-- Name: idx_patients_contact; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_contact ON public.patients USING btree (contact_number);


--
-- TOC entry 5517 (class 1259 OID 20960)
-- Name: idx_patients_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_email ON public.patients USING btree (email);


--
-- TOC entry 5518 (class 1259 OID 20961)
-- Name: idx_patients_mrn; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_mrn ON public.patients USING btree (mrn_number);


--
-- TOC entry 5535 (class 1259 OID 20962)
-- Name: idx_referral_doctors_hospital; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_doctors_hospital ON public.referral_doctors USING btree (referral_hospital_id);


--
-- TOC entry 5538 (class 1259 OID 20963)
-- Name: idx_referral_mapping_branch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_mapping_branch ON public.referral_hospital_mapping USING btree (branch_id);


--
-- TOC entry 5539 (class 1259 OID 20964)
-- Name: idx_referral_mapping_hospital; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_mapping_hospital ON public.referral_hospital_mapping USING btree (referral_hospital_id);


--
-- TOC entry 5546 (class 1259 OID 20965)
-- Name: idx_referral_patients_doctor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_patients_doctor ON public.referral_patients USING btree (referral_doctor_id);


--
-- TOC entry 5547 (class 1259 OID 20966)
-- Name: idx_referral_patients_mobile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_patients_mobile ON public.referral_patients USING btree (mobile_number);


--
-- TOC entry 5567 (class 1259 OID 20967)
-- Name: idx_referral_payments_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_payments_date ON public.referral_payments USING btree (payment_date);


--
-- TOC entry 5568 (class 1259 OID 20968)
-- Name: idx_referral_payments_doctor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_payments_doctor ON public.referral_payments USING btree (referral_doctor_id);


--
-- TOC entry 5569 (class 1259 OID 20969)
-- Name: idx_referral_payments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_referral_payments_status ON public.referral_payments USING btree (payment_status);


--
-- TOC entry 5598 (class 1259 OID 20970)
-- Name: idx_user_sessions_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_is_active ON public.user_sessions USING btree (is_active);


--
-- TOC entry 5599 (class 1259 OID 20971)
-- Name: idx_user_sessions_token_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_token_hash ON public.user_sessions USING btree (token_hash);


--
-- TOC entry 5600 (class 1259 OID 20972)
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- TOC entry 5603 (class 1259 OID 20973)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 5604 (class 1259 OID 20974)
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone_number);


--
-- TOC entry 5605 (class 1259 OID 20975)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role_id);


--
-- TOC entry 5717 (class 2620 OID 20976)
-- Name: appointments update_appointments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5718 (class 2620 OID 20977)
-- Name: billings update_billings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_billings_updated_at BEFORE UPDATE ON public.billings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5719 (class 2620 OID 20978)
-- Name: branch_departments update_branch_departments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_branch_departments_updated_at BEFORE UPDATE ON public.branch_departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5720 (class 2620 OID 20979)
-- Name: branches update_branches_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5721 (class 2620 OID 20980)
-- Name: client_modules update_client_modules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_client_modules_updated_at BEFORE UPDATE ON public.client_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_ist();


--
-- TOC entry 5722 (class 2620 OID 20981)
-- Name: departments update_departments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5723 (class 2620 OID 20982)
-- Name: doctor_branches update_doctor_branches_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_doctor_branches_updated_at BEFORE UPDATE ON public.doctor_branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5724 (class 2620 OID 20983)
-- Name: doctor_shifts update_doctor_shifts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_doctor_shifts_updated_at BEFORE UPDATE ON public.doctor_shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5746 (class 2620 OID 21508)
-- Name: doctor_weekly_schedules update_doctor_weekly_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_doctor_weekly_schedules_updated_at BEFORE UPDATE ON public.doctor_weekly_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5725 (class 2620 OID 20984)
-- Name: doctors update_doctors_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5726 (class 2620 OID 20985)
-- Name: hospital_services update_hospital_services_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_hospital_services_updated_at BEFORE UPDATE ON public.hospital_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5727 (class 2620 OID 20986)
-- Name: hospitals update_hospitals_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON public.hospitals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5728 (class 2620 OID 20987)
-- Name: insurance_claims update_insurance_claims_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_insurance_claims_updated_at BEFORE UPDATE ON public.insurance_claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5729 (class 2620 OID 20988)
-- Name: modules update_modules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_ist();


--
-- TOC entry 5730 (class 2620 OID 20989)
-- Name: nurse_branches update_nurse_branches_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_nurse_branches_updated_at BEFORE UPDATE ON public.nurse_branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5731 (class 2620 OID 20990)
-- Name: nurse_shifts update_nurse_shifts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_nurse_shifts_updated_at BEFORE UPDATE ON public.nurse_shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5732 (class 2620 OID 20991)
-- Name: nurses update_nurses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_nurses_updated_at BEFORE UPDATE ON public.nurses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5733 (class 2620 OID 20992)
-- Name: opd_entries update_opd_entries_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_opd_entries_updated_at BEFORE UPDATE ON public.opd_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5734 (class 2620 OID 20993)
-- Name: patients update_patients_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5736 (class 2620 OID 20994)
-- Name: referral_doctor_service_percentage_module update_referral_doctor_service_percentage_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_referral_doctor_service_percentage_updated_at BEFORE UPDATE ON public.referral_doctor_service_percentage_module FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_ist();


--
-- TOC entry 5735 (class 2620 OID 20995)
-- Name: referral_doctor_module update_referral_doctor_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_referral_doctor_updated_at BEFORE UPDATE ON public.referral_doctor_module FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_ist();


--
-- TOC entry 5737 (class 2620 OID 20996)
-- Name: referral_doctors update_referral_doctors_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_referral_doctors_updated_at BEFORE UPDATE ON public.referral_doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5738 (class 2620 OID 20997)
-- Name: referral_hospitals update_referral_hospitals_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_referral_hospitals_updated_at BEFORE UPDATE ON public.referral_hospitals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5739 (class 2620 OID 20998)
-- Name: referral_payments update_referral_payments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_referral_payments_updated_at BEFORE UPDATE ON public.referral_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_ist();


--
-- TOC entry 5740 (class 2620 OID 20999)
-- Name: roles update_roles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5741 (class 2620 OID 21000)
-- Name: services update_services_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5742 (class 2620 OID 21001)
-- Name: shifts update_shifts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5744 (class 2620 OID 21002)
-- Name: staff_branches update_staff_branches_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_staff_branches_updated_at BEFORE UPDATE ON public.staff_branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5743 (class 2620 OID 21003)
-- Name: staff update_staff_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5745 (class 2620 OID 21004)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5625 (class 2606 OID 21005)
-- Name: appointments appointments_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5626 (class 2606 OID 21010)
-- Name: appointments appointments_cancelled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5627 (class 2606 OID 21015)
-- Name: appointments appointments_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5628 (class 2606 OID 21020)
-- Name: appointments appointments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5629 (class 2606 OID 21025)
-- Name: appointments appointments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5630 (class 2606 OID 21030)
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE SET NULL;


--
-- TOC entry 5631 (class 2606 OID 21035)
-- Name: billing_items billing_items_bill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES public.billings(bill_id) ON DELETE CASCADE;


--
-- TOC entry 5632 (class 2606 OID 21040)
-- Name: billing_items billing_items_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5633 (class 2606 OID 21045)
-- Name: billing_items billing_items_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE SET NULL;


--
-- TOC entry 5634 (class 2606 OID 21050)
-- Name: billing_items billing_items_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_items
    ADD CONSTRAINT billing_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(service_id) ON DELETE SET NULL;


--
-- TOC entry 5635 (class 2606 OID 21055)
-- Name: billings billings_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5636 (class 2606 OID 21060)
-- Name: billings billings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5637 (class 2606 OID 21065)
-- Name: billings billings_opd_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_opd_id_fkey FOREIGN KEY (opd_id) REFERENCES public.opd_entries(opd_id) ON DELETE SET NULL;


--
-- TOC entry 5638 (class 2606 OID 21070)
-- Name: billings billings_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- TOC entry 5639 (class 2606 OID 21075)
-- Name: branch_departments branch_departments_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_departments
    ADD CONSTRAINT branch_departments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5640 (class 2606 OID 21080)
-- Name: branch_departments branch_departments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_departments
    ADD CONSTRAINT branch_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE CASCADE;


--
-- TOC entry 5641 (class 2606 OID 21085)
-- Name: branch_services branch_services_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_services
    ADD CONSTRAINT branch_services_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5642 (class 2606 OID 21090)
-- Name: branch_services branch_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_services
    ADD CONSTRAINT branch_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(service_id) ON DELETE CASCADE;


--
-- TOC entry 5643 (class 2606 OID 21095)
-- Name: branches branches_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE;


--
-- TOC entry 5644 (class 2606 OID 21100)
-- Name: client_modules client_modules_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules
    ADD CONSTRAINT client_modules_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5645 (class 2606 OID 21105)
-- Name: client_modules client_modules_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules
    ADD CONSTRAINT client_modules_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE;


--
-- TOC entry 5646 (class 2606 OID 21110)
-- Name: client_modules client_modules_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_modules
    ADD CONSTRAINT client_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(module_id) ON DELETE CASCADE;


--
-- TOC entry 5647 (class 2606 OID 21115)
-- Name: consultation_outcomes consultation_outcomes_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_outcomes
    ADD CONSTRAINT consultation_outcomes_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id);


--
-- TOC entry 5648 (class 2606 OID 21120)
-- Name: consultation_outcomes consultation_outcomes_opd_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_outcomes
    ADD CONSTRAINT consultation_outcomes_opd_id_fkey FOREIGN KEY (opd_id) REFERENCES public.opd_entries(opd_id);


--
-- TOC entry 5649 (class 2606 OID 21125)
-- Name: consultation_outcomes consultation_outcomes_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_outcomes
    ADD CONSTRAINT consultation_outcomes_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- TOC entry 5650 (class 2606 OID 21130)
-- Name: consultation_outcomes consultation_outcomes_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_outcomes
    ADD CONSTRAINT consultation_outcomes_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(prescription_id);


--
-- TOC entry 5651 (class 2606 OID 21135)
-- Name: consultation_outcomes consultation_outcomes_referral_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultation_outcomes
    ADD CONSTRAINT consultation_outcomes_referral_doctor_id_fkey FOREIGN KEY (referral_doctor_id) REFERENCES public.referral_doctors(referral_doctor_id);


--
-- TOC entry 5652 (class 2606 OID 21140)
-- Name: doctor_branch_departments doctor_branch_departments_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branch_departments
    ADD CONSTRAINT doctor_branch_departments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5653 (class 2606 OID 21145)
-- Name: doctor_branch_departments doctor_branch_departments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branch_departments
    ADD CONSTRAINT doctor_branch_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE CASCADE;


--
-- TOC entry 5654 (class 2606 OID 21150)
-- Name: doctor_branch_departments doctor_branch_departments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branch_departments
    ADD CONSTRAINT doctor_branch_departments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5655 (class 2606 OID 21155)
-- Name: doctor_branches doctor_branches_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branches
    ADD CONSTRAINT doctor_branches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5656 (class 2606 OID 21160)
-- Name: doctor_branches doctor_branches_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_branches
    ADD CONSTRAINT doctor_branches_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5657 (class 2606 OID 21165)
-- Name: doctor_departments doctor_departments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_departments
    ADD CONSTRAINT doctor_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE CASCADE;


--
-- TOC entry 5658 (class 2606 OID 21170)
-- Name: doctor_departments doctor_departments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_departments
    ADD CONSTRAINT doctor_departments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5659 (class 2606 OID 21175)
-- Name: doctor_shifts doctor_shifts_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_shifts
    ADD CONSTRAINT doctor_shifts_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5660 (class 2606 OID 21180)
-- Name: doctor_shifts doctor_shifts_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_shifts
    ADD CONSTRAINT doctor_shifts_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5661 (class 2606 OID 21185)
-- Name: doctor_shifts doctor_shifts_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_shifts
    ADD CONSTRAINT doctor_shifts_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5662 (class 2606 OID 21190)
-- Name: doctor_shifts doctor_shifts_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_shifts
    ADD CONSTRAINT doctor_shifts_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(shift_id) ON DELETE CASCADE;


--
-- TOC entry 5715 (class 2606 OID 21500)
-- Name: doctor_weekly_schedules doctor_weekly_schedules_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_weekly_schedules
    ADD CONSTRAINT doctor_weekly_schedules_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5716 (class 2606 OID 21495)
-- Name: doctor_weekly_schedules doctor_weekly_schedules_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_weekly_schedules
    ADD CONSTRAINT doctor_weekly_schedules_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5663 (class 2606 OID 21195)
-- Name: doctors doctors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5664 (class 2606 OID 21200)
-- Name: hospital_services hospital_services_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospital_services
    ADD CONSTRAINT hospital_services_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5665 (class 2606 OID 21205)
-- Name: hospital_services hospital_services_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospital_services
    ADD CONSTRAINT hospital_services_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE;


--
-- TOC entry 5666 (class 2606 OID 21210)
-- Name: insurance_claims insurance_claims_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5667 (class 2606 OID 21215)
-- Name: insurance_claims insurance_claims_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.insurance_claims
    ADD CONSTRAINT insurance_claims_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE;


--
-- TOC entry 5668 (class 2606 OID 21220)
-- Name: mlc_entries mlc_entries_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mlc_entries
    ADD CONSTRAINT mlc_entries_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);


--
-- TOC entry 5669 (class 2606 OID 21225)
-- Name: mlc_entries mlc_entries_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mlc_entries
    ADD CONSTRAINT mlc_entries_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id);


--
-- TOC entry 5670 (class 2606 OID 21230)
-- Name: mlc_entries mlc_entries_opd_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mlc_entries
    ADD CONSTRAINT mlc_entries_opd_id_fkey FOREIGN KEY (opd_id) REFERENCES public.opd_entries(opd_id);


--
-- TOC entry 5671 (class 2606 OID 21235)
-- Name: mlc_entries mlc_entries_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mlc_entries
    ADD CONSTRAINT mlc_entries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- TOC entry 5672 (class 2606 OID 21240)
-- Name: nurse_branches nurse_branches_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_branches
    ADD CONSTRAINT nurse_branches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5673 (class 2606 OID 21245)
-- Name: nurse_branches nurse_branches_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_branches
    ADD CONSTRAINT nurse_branches_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5674 (class 2606 OID 21250)
-- Name: nurse_branches nurse_branches_nurse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_branches
    ADD CONSTRAINT nurse_branches_nurse_id_fkey FOREIGN KEY (nurse_id) REFERENCES public.nurses(nurse_id) ON DELETE CASCADE;


--
-- TOC entry 5675 (class 2606 OID 21255)
-- Name: nurse_shifts nurse_shifts_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_shifts
    ADD CONSTRAINT nurse_shifts_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5676 (class 2606 OID 21260)
-- Name: nurse_shifts nurse_shifts_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_shifts
    ADD CONSTRAINT nurse_shifts_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5677 (class 2606 OID 21265)
-- Name: nurse_shifts nurse_shifts_nurse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_shifts
    ADD CONSTRAINT nurse_shifts_nurse_id_fkey FOREIGN KEY (nurse_id) REFERENCES public.nurses(nurse_id) ON DELETE CASCADE;


--
-- TOC entry 5678 (class 2606 OID 21270)
-- Name: nurse_shifts nurse_shifts_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurse_shifts
    ADD CONSTRAINT nurse_shifts_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(shift_id) ON DELETE CASCADE;


--
-- TOC entry 5679 (class 2606 OID 21275)
-- Name: nurses nurses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nurses
    ADD CONSTRAINT nurses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5680 (class 2606 OID 21280)
-- Name: opd_entries opd_entries_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id) ON DELETE SET NULL;


--
-- TOC entry 5681 (class 2606 OID 21285)
-- Name: opd_entries opd_entries_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5682 (class 2606 OID 21290)
-- Name: opd_entries opd_entries_checked_in_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_checked_in_by_fkey FOREIGN KEY (checked_in_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5683 (class 2606 OID 21295)
-- Name: opd_entries opd_entries_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5684 (class 2606 OID 21300)
-- Name: opd_entries opd_entries_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5685 (class 2606 OID 21305)
-- Name: opd_entries opd_entries_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.opd_entries
    ADD CONSTRAINT opd_entries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- TOC entry 5686 (class 2606 OID 21310)
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5713 (class 2606 OID 21470)
-- Name: patient_feedback patient_feedback_nurse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_feedback
    ADD CONSTRAINT patient_feedback_nurse_id_fkey FOREIGN KEY (nurse_id) REFERENCES public.users(user_id);


--
-- TOC entry 5714 (class 2606 OID 21465)
-- Name: patient_feedback patient_feedback_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_feedback
    ADD CONSTRAINT patient_feedback_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- TOC entry 5687 (class 2606 OID 21315)
-- Name: prescriptions prescriptions_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);


--
-- TOC entry 5688 (class 2606 OID 21320)
-- Name: prescriptions prescriptions_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id);


--
-- TOC entry 5689 (class 2606 OID 21325)
-- Name: prescriptions prescriptions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- TOC entry 5690 (class 2606 OID 21330)
-- Name: referral_doctor_module referral_doctor_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_module
    ADD CONSTRAINT referral_doctor_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE SET NULL;


--
-- TOC entry 5691 (class 2606 OID 21335)
-- Name: referral_doctor_module referral_doctor_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_module
    ADD CONSTRAINT referral_doctor_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5693 (class 2606 OID 21340)
-- Name: referral_doctor_service_percentage_module referral_doctor_service_percentage_referral_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_service_percentage_module
    ADD CONSTRAINT referral_doctor_service_percentage_referral_doctor_id_fkey FOREIGN KEY (referral_doctor_id) REFERENCES public.referral_doctor_module(id) ON DELETE CASCADE;


--
-- TOC entry 5692 (class 2606 OID 21345)
-- Name: referral_doctor_module referral_doctor_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctor_module
    ADD CONSTRAINT referral_doctor_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.hospitals(hospital_id) ON DELETE SET NULL;


--
-- TOC entry 5694 (class 2606 OID 21350)
-- Name: referral_doctors referral_doctors_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctors
    ADD CONSTRAINT referral_doctors_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 5695 (class 2606 OID 21355)
-- Name: referral_doctors referral_doctors_referral_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_doctors
    ADD CONSTRAINT referral_doctors_referral_hospital_id_fkey FOREIGN KEY (referral_hospital_id) REFERENCES public.referral_hospitals(referral_hospital_id) ON DELETE CASCADE;


--
-- TOC entry 5696 (class 2606 OID 21360)
-- Name: referral_hospital_mapping referral_hospital_mapping_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_hospital_mapping
    ADD CONSTRAINT referral_hospital_mapping_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5697 (class 2606 OID 21365)
-- Name: referral_hospital_mapping referral_hospital_mapping_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_hospital_mapping
    ADD CONSTRAINT referral_hospital_mapping_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 5698 (class 2606 OID 21370)
-- Name: referral_hospital_mapping referral_hospital_mapping_referral_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_hospital_mapping
    ADD CONSTRAINT referral_hospital_mapping_referral_hospital_id_fkey FOREIGN KEY (referral_hospital_id) REFERENCES public.referral_hospitals(referral_hospital_id) ON DELETE CASCADE;


--
-- TOC entry 5699 (class 2606 OID 21375)
-- Name: referral_hospitals referral_hospitals_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_hospitals
    ADD CONSTRAINT referral_hospitals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 5700 (class 2606 OID 21380)
-- Name: referral_patients referral_patients_referral_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_patients
    ADD CONSTRAINT referral_patients_referral_doctor_id_fkey FOREIGN KEY (referral_doctor_id) REFERENCES public.referral_doctor_module(id) ON DELETE SET NULL;


--
-- TOC entry 5701 (class 2606 OID 21385)
-- Name: referral_payment_details referral_payment_details_payment_header_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_details
    ADD CONSTRAINT referral_payment_details_payment_header_id_fkey FOREIGN KEY (payment_header_id) REFERENCES public.referral_payment_header(id) ON DELETE CASCADE;


--
-- TOC entry 5702 (class 2606 OID 21390)
-- Name: referral_payment_header referral_payment_header_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payment_header
    ADD CONSTRAINT referral_payment_header_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.referral_payment_upload_batch(id) ON DELETE CASCADE;


--
-- TOC entry 5703 (class 2606 OID 21395)
-- Name: referral_payments referral_payments_hosp_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payments
    ADD CONSTRAINT referral_payments_hosp_service_id_fkey FOREIGN KEY (hosp_service_id) REFERENCES public.hospital_services(hosp_service_id) ON DELETE SET NULL;


--
-- TOC entry 5704 (class 2606 OID 21400)
-- Name: referral_payments referral_payments_referral_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referral_payments
    ADD CONSTRAINT referral_payments_referral_doctor_id_fkey FOREIGN KEY (referral_doctor_id) REFERENCES public.referral_doctor_module(id) ON DELETE CASCADE;


--
-- TOC entry 5705 (class 2606 OID 21405)
-- Name: shift_branches shift_branches_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_branches
    ADD CONSTRAINT shift_branches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5706 (class 2606 OID 21410)
-- Name: shift_branches shift_branches_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_branches
    ADD CONSTRAINT shift_branches_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(shift_id) ON DELETE CASCADE;


--
-- TOC entry 5708 (class 2606 OID 21415)
-- Name: staff_branches staff_branches_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_branches
    ADD CONSTRAINT staff_branches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- TOC entry 5709 (class 2606 OID 21420)
-- Name: staff_branches staff_branches_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_branches
    ADD CONSTRAINT staff_branches_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5710 (class 2606 OID 21425)
-- Name: staff_branches staff_branches_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_branches
    ADD CONSTRAINT staff_branches_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(staff_id) ON DELETE CASCADE;


--
-- TOC entry 5707 (class 2606 OID 21430)
-- Name: staff staff_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5711 (class 2606 OID 21435)
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5712 (class 2606 OID 21440)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE RESTRICT;


-- Completed on 2026-02-02 10:53:32

--
-- PostgreSQL database dump complete
--

\unrestrict r35lsYqclFAsems7SgG62AhJ0PqogBxqlfArsWlNHoAamvSapmfaXHNk1ivFP7b

