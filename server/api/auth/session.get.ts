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
    if (userWithBusiness.business_id) {
        const { data, error } = await serviceRole
            .from('businesses')
            .select('*')
            .eq('id', userWithBusiness.business_id)
            .single()

        if (!error && data) {
            business = data
        } else {
            const { data: fallbackData } = await serviceRole
                .from('businesses')
                .select('*')
                .eq('owner_id', user.id)
                .single()

            if (fallbackData) {
                business = fallbackData

                // @ts-ignore - Supabase type inference issue
                await serviceRole.from('users').update({ business_id: fallbackData.id }).eq('id', user.id)
            }
        }
    } else {
        const { data, error } = await serviceRole
            .from('businesses')
            .select('*')
            .eq('owner_id', user.id)
            .single()

        if (!error && data) {
            business = data

            // @ts-ignore - Supabase type inference issue
            await serviceRole.from('users').update({ business_id: data.id }).eq('id', user.id)
        }
    }

    return {
        user: userProfile,
        business
    }
})
