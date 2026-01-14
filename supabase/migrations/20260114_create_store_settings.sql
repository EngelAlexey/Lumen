-- =====================================================
-- MIGRATION: Create store_settings table and related objects
-- =====================================================
-- Execute this in Supabase SQL Editor
-- =====================================================

-- 1. Create store_settings table
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    
    -- Basic Info
    store_name TEXT,
    store_description TEXT,
    slug TEXT UNIQUE NOT NULL,
    
    -- Visual Customization
    logo_url TEXT,
    banner_url TEXT,
    primary_color TEXT DEFAULT '#4F46E5', -- Indigo-600
    secondary_color TEXT DEFAULT '#10B981', -- Green-500
    
    -- Store Options
    is_enabled BOOLEAN DEFAULT false,
    show_prices BOOLEAN DEFAULT true,
    allow_orders BOOLEAN DEFAULT true,
    
    -- Contact Information
    contact_phone TEXT,
    contact_email TEXT,
    contact_whatsapp TEXT,
    business_hours TEXT, -- JSON string with schedule
    
    -- Social Media
    facebook_url TEXT,
    instagram_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_business_settings UNIQUE(business_id),
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_store_settings_business_id ON public.store_settings(business_id);
CREATE INDEX IF NOT EXISTS idx_store_settings_slug ON public.store_settings(slug);
CREATE INDEX IF NOT EXISTS idx_store_settings_enabled ON public.store_settings(is_enabled);

-- 3. Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist (for re-running script)
DROP POLICY IF EXISTS "Users can view own business store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Owners and admins can update store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Owners and admins can insert store settings" ON public.store_settings;

-- 5. Create RLS Policies

-- Users can view their own business settings
CREATE POLICY "Users can view own business store settings"
    ON public.store_settings FOR SELECT
    USING (
        business_id IN (
            SELECT business_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Only owners and admins can update
CREATE POLICY "Owners and admins can update store settings"
    ON public.store_settings FOR UPDATE
    USING (
        business_id IN (
            SELECT business_id FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Only owners and admins can insert
CREATE POLICY "Owners and admins can insert store settings"
    ON public.store_settings FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT business_id FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- 6. Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_store_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_store_settings_timestamp ON public.store_settings;
CREATE TRIGGER update_store_settings_timestamp
    BEFORE UPDATE ON public.store_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_store_settings_updated_at();

-- 8. Function to auto-generate slug from business name
CREATE OR REPLACE FUNCTION generate_store_slug(business_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INT := 0;
BEGIN
    -- Generate base slug: lowercase, replace spaces with hyphens, remove special chars
    base_slug := lower(regexp_replace(business_name, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- If slug is empty, use 'tienda'
    IF base_slug = '' THEN
        base_slug := 'tienda';
    END IF;
    
    final_slug := base_slug;
    
    -- Check if slug exists, if so add number
    WHILE EXISTS (SELECT 1 FROM public.store_settings WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- IMPORTANT: Execute this script in Supabase SQL Editor
-- Then proceed with the Storage Bucket setup
-- =====================================================
