-- Add Onvopay columns to businesses table
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS onvo_customer_id TEXT,
ADD COLUMN IF NOT EXISTS onvo_subscription_id TEXT;

-- Add Onvopay columns to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS onvo_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS onvo_checkout_url TEXT;
