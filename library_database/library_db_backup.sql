--
-- PostgreSQL database dump
--

\restrict NRZywDgrKQlLyWGQnpAIQRQSSiepfOhUoxUuIazLRqhUPoMtP9Dl0YbZBEGP8lZ

-- Dumped from database version 18.4 (Ubuntu 18.4-1.pgdg26.04+1)
-- Dumped by pg_dump version 18.4 (Ubuntu 18.4-1.pgdg26.04+1)

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
-- Name: check_no_overlapping_validity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_no_overlapping_validity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM student_validities
        WHERE student_id = NEW.student_id
          AND id <> COALESCE(NEW.id, 0)
          AND daterange(start_date, end_date, '[]')
              && daterange(NEW.start_date, NEW.end_date, '[]')
    ) THEN
        RAISE EXCEPTION 'Student already has validity in this date range';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_no_overlapping_validity() OWNER TO postgres;

--
-- Name: check_shift_assignment_rules(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_shift_assignment_rules() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    validity_access_type VARCHAR(20);
    active_shift_count INTEGER;
BEGIN
    SELECT access_type
    INTO validity_access_type
    FROM student_validities
    WHERE id = NEW.validity_id
    FOR UPDATE;

    IF validity_access_type = 'RESERVED' AND NEW.seat_id IS NULL THEN
        RAISE EXCEPTION 'Reserved student must have seat_id for every shift';
    END IF;

    IF validity_access_type = 'UNRESERVED' AND NEW.seat_id IS NOT NULL THEN
        RAISE EXCEPTION 'Unreserved student cannot have reserved seat';
    END IF;

    IF validity_access_type = 'UNRESERVED' AND NEW.assignment_status = 'ACTIVE' THEN
        SELECT COUNT(*)
        INTO active_shift_count
        FROM student_shift_assignments
        WHERE validity_id = NEW.validity_id
          AND assignment_status = 'ACTIVE'
          AND id <> COALESCE(NEW.id, 0);

        IF active_shift_count >= 1 THEN
            RAISE EXCEPTION 'Unreserved student can choose only one active shift';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_shift_assignment_rules() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id bigint NOT NULL,
    shift_assignment_id bigint NOT NULL,
    attendance_date date DEFAULT CURRENT_DATE NOT NULL,
    status character varying(20) DEFAULT 'PRESENT'::character varying NOT NULL,
    check_in_time time without time zone,
    check_out_time time without time zone,
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT attendance_check CHECK (((check_out_time IS NULL) OR (check_in_time IS NULL) OR (check_out_time >= check_in_time))),
    CONSTRAINT attendance_status_check CHECK (((status)::text = ANY ((ARRAY['PRESENT'::character varying, 'ABSENT'::character varying])::text[])))
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.attendance ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.attendance_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fee_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fee_plans (
    id bigint NOT NULL,
    plan_name character varying(100) NOT NULL,
    duration_days integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fee_plans_amount_check CHECK ((amount >= (0)::numeric)),
    CONSTRAINT fee_plans_duration_days_check CHECK ((duration_days > 0))
);


ALTER TABLE public.fee_plans OWNER TO postgres;

--
-- Name: fee_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.fee_plans ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fee_plans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: library_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.library_settings (
    id smallint DEFAULT 1 NOT NULL,
    library_name character varying(150) NOT NULL,
    address text,
    phone character varying(20),
    email character varying(150),
    logo_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT library_settings_id_check CHECK ((id = 1))
);


ALTER TABLE public.library_settings OWNER TO postgres;

--
-- Name: payment_modes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_modes (
    id bigint NOT NULL,
    mode_name character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.payment_modes OWNER TO postgres;

--
-- Name: payment_modes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.payment_modes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.payment_modes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id bigint NOT NULL,
    validity_id bigint NOT NULL,
    payment_mode_id bigint NOT NULL,
    invoice_no character varying(50) NOT NULL,
    amount_received numeric(10,2) NOT NULL,
    payment_date date DEFAULT CURRENT_DATE NOT NULL,
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT payments_amount_received_check CHECK ((amount_received > (0)::numeric))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.payments ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: seats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seats (
    id bigint NOT NULL,
    seat_number character varying(30) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.seats OWNER TO postgres;

--
-- Name: seats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.seats ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.seats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shifts (
    id bigint NOT NULL,
    shift_name character varying(100) NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.shifts OWNER TO postgres;

--
-- Name: shifts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.shifts ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shifts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: student_shift_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_shift_assignments (
    id bigint NOT NULL,
    validity_id bigint NOT NULL,
    shift_id bigint NOT NULL,
    seat_id bigint,
    assignment_status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT student_shift_assignments_assignment_status_check CHECK (((assignment_status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'ENDED'::character varying])::text[])))
);


ALTER TABLE public.student_shift_assignments OWNER TO postgres;

--
-- Name: student_shift_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.student_shift_assignments ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.student_shift_assignments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: student_validities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_validities (
    id bigint NOT NULL,
    student_id bigint NOT NULL,
    fee_plan_id bigint,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    access_type character varying(20) DEFAULT 'UNRESERVED'::character varying NOT NULL,
    CONSTRAINT student_validities_access_type_check CHECK (((access_type)::text = ANY ((ARRAY['RESERVED'::character varying, 'UNRESERVED'::character varying])::text[]))),
    CONSTRAINT student_validities_check CHECK ((end_date >= start_date)),
    CONSTRAINT student_validities_total_amount_check CHECK ((total_amount >= (0)::numeric))
);


ALTER TABLE public.student_validities OWNER TO postgres;

--
-- Name: student_validities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.student_validities ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.student_validities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id bigint NOT NULL,
    student_code character varying(50) NOT NULL,
    reg_no character varying(50),
    full_name character varying(150) NOT NULL,
    mobile character varying(20) NOT NULL,
    gender character varying(10) NOT NULL,
    dob date,
    address text,
    admission_date date DEFAULT CURRENT_DATE NOT NULL,
    profile_photo_url text,
    account_status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_by bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp without time zone,
    CONSTRAINT students_account_status_check CHECK (((account_status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'DISABLED'::character varying, 'DELETED'::character varying])::text[]))),
    CONSTRAINT students_gender_check CHECK (((gender)::text = ANY ((ARRAY['MALE'::character varying, 'FEMALE'::character varying, 'OTHER'::character varying])::text[])))
);


ALTER TABLE public.students OWNER TO postgres;

--
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.students ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.students_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) DEFAULT 'ADMIN'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['ADMIN'::character varying, 'STAFF'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (id, shift_assignment_id, attendance_date, status, check_in_time, check_out_time, remarks, created_at, updated_at) FROM stdin;
1	1	2026-07-01	PRESENT	08:05:00	13:55:00	\N	2026-06-24 13:14:14.808783	2026-06-24 13:14:14.808783
\.


--
-- Data for Name: fee_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fee_plans (id, plan_name, duration_days, amount, is_active, created_at, updated_at) FROM stdin;
1	Monthly Plan	30	1000.00	t	2026-06-24 13:14:14.791126	2026-06-24 13:14:14.791126
3	Quarterly Plan	90	1400.00	t	2026-06-26 21:39:00.905387	2026-06-26 21:39:00.905387
\.


--
-- Data for Name: library_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.library_settings (id, library_name, address, phone, email, logo_url, created_at, updated_at) FROM stdin;
1	Demo Library	Demo Address	9999999999	demo@library.com	\N	2026-06-24 13:14:14.789072	2026-06-24 13:14:14.789072
\.


--
-- Data for Name: payment_modes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_modes (id, mode_name, is_active, created_at, updated_at) FROM stdin;
1	Cash	t	2026-06-24 04:57:03.723076	2026-06-26 22:05:30.817732
6	UPI	t	2026-06-26 22:00:40.571309	2026-06-26 22:05:30.817732
7	Card	t	2026-06-26 22:00:40.571309	2026-06-26 22:05:30.817732
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, validity_id, payment_mode_id, invoice_no, amount_received, payment_date, remarks, created_at, updated_at) FROM stdin;
1	1	1	INV001	1000.00	2026-07-01	Full payment received	2026-06-24 13:14:14.805879	2026-06-24 13:14:14.805879
\.


--
-- Data for Name: seats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seats (id, seat_number, is_active, created_at, updated_at) FROM stdin;
1	A1	t	2026-06-24 13:14:14.795154	2026-06-24 13:14:14.795154
2	A2	t	2026-06-24 13:14:14.795154	2026-06-24 13:14:14.795154
3	S001	t	2026-06-26 22:43:47.367832	2026-06-26 22:43:47.367832
4	S002	t	2026-06-26 22:44:03.733437	2026-06-26 22:44:03.733437
\.


--
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shifts (id, shift_name, start_time, end_time, is_active, created_at, updated_at) FROM stdin;
1	Morning Shift	08:00:00	14:00:00	t	2026-06-24 13:14:14.793081	2026-06-24 13:14:14.793081
2	Evening Shift	14:00:00	20:00:00	t	2026-06-24 13:14:14.793081	2026-06-24 13:14:14.793081
\.


--
-- Data for Name: student_shift_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_shift_assignments (id, validity_id, shift_id, seat_id, assignment_status, created_at, updated_at) FROM stdin;
1	1	1	\N	ACTIVE	2026-06-24 13:14:14.802299	2026-06-24 13:14:14.802299
\.


--
-- Data for Name: student_validities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_validities (id, student_id, fee_plan_id, start_date, end_date, total_amount, created_at, updated_at, access_type) FROM stdin;
1	1	1	2026-07-01	2026-07-30	1000.00	2026-06-24 13:14:14.798533	2026-06-24 13:14:14.798533	UNRESERVED
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, student_code, reg_no, full_name, mobile, gender, dob, address, admission_date, profile_photo_url, account_status, created_by, created_at, updated_at, deleted_at) FROM stdin;
1	STU001	REG001	Rahul Kumar	9876543210	MALE	2002-05-15	Patna, Bihar	2026-06-24	\N	ACTIVE	\N	2026-06-24 13:14:14.796344	2026-06-24 13:14:14.796344	\N
2	STU002	REG002	Amit Kumar	9999999999	MALE	2003-08-20	Mumbai	2026-06-26	\N	DELETED	\N	2026-06-26 20:44:43.800557	2026-06-26 20:56:14.172203	2026-06-26 20:56:14.172203
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password_hash, role, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_id_seq', 1, true);


--
-- Name: fee_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fee_plans_id_seq', 3, true);


--
-- Name: payment_modes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_modes_id_seq', 7, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 2, true);


--
-- Name: seats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seats_id_seq', 4, true);


--
-- Name: shifts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shifts_id_seq', 4, true);


--
-- Name: student_shift_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_shift_assignments_id_seq', 2, true);


--
-- Name: student_validities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_validities_id_seq', 2, true);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.students_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: fee_plans fee_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_plans
    ADD CONSTRAINT fee_plans_pkey PRIMARY KEY (id);


--
-- Name: fee_plans fee_plans_plan_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_plans
    ADD CONSTRAINT fee_plans_plan_name_key UNIQUE (plan_name);


--
-- Name: library_settings library_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.library_settings
    ADD CONSTRAINT library_settings_pkey PRIMARY KEY (id);


--
-- Name: student_validities one_validity_per_student; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_validities
    ADD CONSTRAINT one_validity_per_student UNIQUE (student_id);


--
-- Name: payment_modes payment_modes_mode_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_modes
    ADD CONSTRAINT payment_modes_mode_name_key UNIQUE (mode_name);


--
-- Name: payment_modes payment_modes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_modes
    ADD CONSTRAINT payment_modes_pkey PRIMARY KEY (id);


--
-- Name: payments payments_invoice_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_no_key UNIQUE (invoice_no);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: seats seats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT seats_pkey PRIMARY KEY (id);


--
-- Name: seats seats_seat_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seats
    ADD CONSTRAINT seats_seat_number_key UNIQUE (seat_number);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_shift_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_shift_name_key UNIQUE (shift_name);


--
-- Name: student_shift_assignments student_shift_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_shift_assignments
    ADD CONSTRAINT student_shift_assignments_pkey PRIMARY KEY (id);


--
-- Name: student_validities student_validities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_validities
    ADD CONSTRAINT student_validities_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_reg_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_reg_no_key UNIQUE (reg_no);


--
-- Name: students students_student_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_student_code_key UNIQUE (student_code);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_attendance_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_date ON public.attendance USING btree (attendance_date);


--
-- Name: idx_attendance_shift_assignment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_shift_assignment_id ON public.attendance USING btree (shift_assignment_id);


--
-- Name: idx_payments_payment_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_payment_date ON public.payments USING btree (payment_date);


--
-- Name: idx_payments_payment_mode_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_payment_mode_id ON public.payments USING btree (payment_mode_id);


--
-- Name: idx_payments_validity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_validity_id ON public.payments USING btree (validity_id);


--
-- Name: idx_student_shift_assignments_seat_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_shift_assignments_seat_id ON public.student_shift_assignments USING btree (seat_id);


--
-- Name: idx_student_shift_assignments_shift_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_shift_assignments_shift_id ON public.student_shift_assignments USING btree (shift_id);


--
-- Name: idx_student_shift_assignments_validity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_shift_assignments_validity_id ON public.student_shift_assignments USING btree (validity_id);


--
-- Name: idx_student_validities_access_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_validities_access_type ON public.student_validities USING btree (access_type);


--
-- Name: idx_student_validities_end_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_validities_end_date ON public.student_validities USING btree (end_date);


--
-- Name: idx_student_validities_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_validities_student_id ON public.student_validities USING btree (student_id);


--
-- Name: idx_students_account_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_account_status ON public.students USING btree (account_status);


--
-- Name: idx_students_admission_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_admission_date ON public.students USING btree (admission_date);


--
-- Name: idx_students_full_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_full_name ON public.students USING btree (full_name);


--
-- Name: idx_students_gender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_gender ON public.students USING btree (gender);


--
-- Name: idx_students_mobile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_mobile ON public.students USING btree (mobile);


--
-- Name: one_active_reserved_seat_per_shift; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX one_active_reserved_seat_per_shift ON public.student_shift_assignments USING btree (shift_id, seat_id) WHERE (((assignment_status)::text = 'ACTIVE'::text) AND (seat_id IS NOT NULL));


--
-- Name: one_attendance_per_shift_per_day; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX one_attendance_per_shift_per_day ON public.attendance USING btree (shift_assignment_id, attendance_date);


--
-- Name: one_shift_once_per_validity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX one_shift_once_per_validity ON public.student_shift_assignments USING btree (validity_id, shift_id) WHERE ((assignment_status)::text = 'ACTIVE'::text);


--
-- Name: student_validities trg_check_no_overlapping_validity; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_check_no_overlapping_validity BEFORE INSERT OR UPDATE ON public.student_validities FOR EACH ROW EXECUTE FUNCTION public.check_no_overlapping_validity();


--
-- Name: student_shift_assignments trg_check_shift_assignment_rules; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_check_shift_assignment_rules BEFORE INSERT OR UPDATE ON public.student_shift_assignments FOR EACH ROW EXECUTE FUNCTION public.check_shift_assignment_rules();


--
-- Name: attendance attendance_shift_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_shift_assignment_id_fkey FOREIGN KEY (shift_assignment_id) REFERENCES public.student_shift_assignments(id) ON DELETE CASCADE;


--
-- Name: payments payments_payment_mode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payment_mode_id_fkey FOREIGN KEY (payment_mode_id) REFERENCES public.payment_modes(id) ON DELETE RESTRICT;


--
-- Name: payments payments_validity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_validity_id_fkey FOREIGN KEY (validity_id) REFERENCES public.student_validities(id) ON DELETE CASCADE;


--
-- Name: student_shift_assignments student_shift_assignments_seat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_shift_assignments
    ADD CONSTRAINT student_shift_assignments_seat_id_fkey FOREIGN KEY (seat_id) REFERENCES public.seats(id) ON DELETE SET NULL;


--
-- Name: student_shift_assignments student_shift_assignments_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_shift_assignments
    ADD CONSTRAINT student_shift_assignments_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(id) ON DELETE RESTRICT;


--
-- Name: student_shift_assignments student_shift_assignments_validity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_shift_assignments
    ADD CONSTRAINT student_shift_assignments_validity_id_fkey FOREIGN KEY (validity_id) REFERENCES public.student_validities(id) ON DELETE CASCADE;


--
-- Name: student_validities student_validities_fee_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_validities
    ADD CONSTRAINT student_validities_fee_plan_id_fkey FOREIGN KEY (fee_plan_id) REFERENCES public.fee_plans(id) ON DELETE SET NULL;


--
-- Name: student_validities student_validities_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_validities
    ADD CONSTRAINT student_validities_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: students students_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO library_user;


--
-- Name: TABLE attendance; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.attendance TO library_user;


--
-- Name: SEQUENCE attendance_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.attendance_id_seq TO library_user;


--
-- Name: TABLE fee_plans; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fee_plans TO library_user;


--
-- Name: SEQUENCE fee_plans_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.fee_plans_id_seq TO library_user;


--
-- Name: TABLE library_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.library_settings TO library_user;


--
-- Name: TABLE payment_modes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.payment_modes TO library_user;


--
-- Name: SEQUENCE payment_modes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.payment_modes_id_seq TO library_user;


--
-- Name: TABLE payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.payments TO library_user;


--
-- Name: SEQUENCE payments_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.payments_id_seq TO library_user;


--
-- Name: TABLE seats; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.seats TO library_user;


--
-- Name: SEQUENCE seats_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.seats_id_seq TO library_user;


--
-- Name: TABLE shifts; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.shifts TO library_user;


--
-- Name: SEQUENCE shifts_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.shifts_id_seq TO library_user;


--
-- Name: TABLE student_shift_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_shift_assignments TO library_user;


--
-- Name: SEQUENCE student_shift_assignments_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.student_shift_assignments_id_seq TO library_user;


--
-- Name: TABLE student_validities; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.student_validities TO library_user;


--
-- Name: SEQUENCE student_validities_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.student_validities_id_seq TO library_user;


--
-- Name: TABLE students; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.students TO library_user;


--
-- Name: SEQUENCE students_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.students_id_seq TO library_user;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users TO library_user;


--
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.users_id_seq TO library_user;


--
-- PostgreSQL database dump complete
--

\unrestrict NRZywDgrKQlLyWGQnpAIQRQSSiepfOhUoxUuIazLRqhUPoMtP9Dl0YbZBEGP8lZ

