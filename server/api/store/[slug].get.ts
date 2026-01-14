import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
    const slug = getRouterParam(event, 'slug')
    const client = await serverSupabaseClient<Database>(event)

    if (!slug) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Slug is required'
        })
    }

    const { data, error } = await client
        .from('businesses')
        .select('id, name, slug, phone, address, business_type')
        .eq('slug', slug)
        .single()

    if (error || !data) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Business not found'
        })
    }

    return data
})
