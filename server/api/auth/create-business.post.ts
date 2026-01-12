import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { userId, businessName, businessType, phone, address, selectedPlan } = body

    if (!userId) {
        throw createError({
            statusCode: 400,
            message: 'User ID is required'
        })
    }

    const client = serverSupabaseServiceRole(event) as unknown as SupabaseClient<Database>

    // Check if business already exists
    const { data: existingBusiness } = await client
        .from('businesses')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle()

    if (existingBusiness) {
        return { success: true, business: existingBusiness, message: 'Business already exists' }
    }

    // Create Business
    // Rename destructured error to Avoid shadowing the global createError function
    const { data: newBusiness, error: dbError } = await client
        .from('businesses')
        .insert({
            name: businessName,
            business_type: businessType || 'retail',
            owner_id: userId,
            subscription_status: 'trialing',
            phone: phone || null,
            address: address || null
        })
        .select()
        .single()

    if (dbError) {
        console.error('[CreateBusiness] Failed to create business:', dbError)
        throw createError({
            statusCode: 500,
            message: 'Failed to create business record'
        })
    }

    // Link Business to User
    const { error: linkError } = await client
        .from('users')
        .update({ business_id: newBusiness.id })
        .eq('id', userId)

    if (linkError) {
        console.error('[CreateBusiness] Failed to link business to user:', linkError)
    }

    return { success: true, business: newBusiness }
})
