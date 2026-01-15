-- 1. Drop the old constraint FIRST so we can update the values
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Update existing rows that would violate the new constraint.
-- Mapping legacy roles to 'employee' or keeping valid ones.
UPDATE public.users 
SET role = 'employee' 
WHERE role NOT IN ('owner', 'admin', 'employee') OR role IS NULL;

-- 3. Add the new constraint allowing the correct roles
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('owner', 'admin', 'employee'));
