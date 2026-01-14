import { serverSupabaseUser, serverSupabaseServiceRole, serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient<Database>(event)
    const { data: { user }, error: authError } = await client.auth.getUser()

    if (authError || !user) {
        throw createError({
            statusCode: 401,
            message: 'Unauthorized'
        })
    }

    const serviceRole = serverSupabaseServiceRole<Database>(event)

    const { data: userProfile, error: userError } = await serviceRole
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    if (userError || !userProfile) {
        throw createError({
            statusCode: 404,
            message: 'User profile not found'
        })
    }

    const userWithBusiness = userProfile as { business_id: string | null;[key: string]: any }
    let business = null

    // 1. Try to fetch by explicit Business ID
    if (userWithBusiness.business_id) {
        const { data } = await serviceRole
            .from('businesses')
            .select('*')
            .eq('id', userWithBusiness.business_id)
            .single()

        if (data) business = data
    }

    // 2. Fallback: Search by Owner ID if not found
    if (!business) {
        const { data } = await serviceRole
            .from('businesses')
            .select('*')
            .eq('owner_id', user.id)
            .single()

        if (data) {
            business = data
            // 3. Repair Link: Update user if business was found but not linked
            // @ts-ignore - Supabase type inference issue
            await serviceRole.from('users').update({ business_id: data.id }).eq('id', user.id)
        }
    }

    return {
        user: userProfile,
        business
    }
})
