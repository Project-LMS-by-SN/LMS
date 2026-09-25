-- Migration: Add aadhar_number column to students table
ALTER TABLE public.students
ADD COLUMN aadhar_number VARCHAR(12);
