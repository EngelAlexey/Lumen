-- 1. Add subscription columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onvo_customer_id TEXT,
ADD COLUMN IF NOT EXISTS onvo_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing',
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'solo';

-- 2. Drop columns from businesses table (optional, but requested to move logic)
-- We'll keep them for a moment or mark them deprecated if needed, but user said "handling in business is an error"
-- Let's remove them to avoid confusion
ALTER TABLE public.businesses
DROP COLUMN IF EXISTS onvo_customer_id,
DROP COLUMN IF EXISTS onvo_subscription_id,
DROP COLUMN IF EXISTS subscription_status,
DROP COLUMN IF EXISTS subscription_plan;

-- 3. Update Trigger Function handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  new_business_id uuid;
BEGIN
  -- A. Crear el perfil en 'public.users' con datos de SUSCRIPCIÓN
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    role,
    onvo_customer_id,
    subscription_status,
    subscription_plan
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'owner',
    new.raw_user_meta_data->>'onvo_customer_id',
    'trialing', -- Siempre nace en trialing/incomplete hasta que pague
    COALESCE(new.raw_user_meta_data->>'selected_plan', 'solo')
  );

  -- B. Crear el negocio (Solo datos del negocio)
  INSERT INTO public.businesses (
    name, 
    business_type, 
    owner_id
  )
  VALUES (
    new.raw_user_meta_data->>'business_name',
    COALESCE(new.raw_user_meta_data->>'business_type', 'retail'),
    new.id
  )
  RETURNING id INTO new_business_id;

  -- C. Vincular usuario al negocio
  UPDATE public.users
  SET business_id = new_business_id
  WHERE id = new.id;

  RETURN new;
END;
$function$;
