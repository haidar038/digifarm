-- Migration: Add observer role to user_role enum
-- This role provides view-only access for BI/client stakeholders

-- Add 'observer' to the user_role enum type
-- Note: PostgreSQL requires altering enum types carefully
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'observer';

-- Update the comment on the type to reflect all roles
COMMENT ON TYPE user_role IS 'User roles: farmer (default), manager (view all + own CRUD), observer (view-only), admin (full access)';
