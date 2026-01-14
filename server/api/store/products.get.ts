import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const businessId = query.businessId as string
    const client = await serverSupabaseClient<Database>(event)

    if (!businessId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Business ID is required'
        })
    }

    const { data, error } = await client
        .from('products')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name')

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        })
    }

    return data
})
