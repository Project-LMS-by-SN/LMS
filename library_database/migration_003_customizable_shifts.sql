-- Migration 003: Customizable Shifts
-- Removes the restriction that limits unreserved students to only one shift
-- This allows students to be assigned multiple shifts (e.g., Morning + Evening)

-- 1. Drop and recreate the trigger function to remove the single-shift restriction
CREATE OR REPLACE FUNCTION public.check_shift_assignment_rules()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    validity_access_type VARCHAR(20);
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

    RETURN NEW;
END;
$$;

-- 2. Remove the overlapping validity trigger (redundant since student_id is UNIQUE in student_validities)
DROP TRIGGER IF EXISTS trg_check_no_overlapping_validity ON public.student_validities;
DROP FUNCTION IF EXISTS public.check_no_overlapping_validity();
