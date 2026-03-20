-- Add attachments JSONB column to tasks
-- Stores an array of {name, url} objects for hyperlink attachments

ALTER TABLE tasks ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;
