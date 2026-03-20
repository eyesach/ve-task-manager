-- Add job_title column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title text;
