-- Add calculator_allowed field to tests table
ALTER TABLE tests ADD COLUMN calculator_allowed BOOLEAN DEFAULT 0;
