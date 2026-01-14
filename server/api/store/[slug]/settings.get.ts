import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~~/app/types/database.types'

export default defineEventHandler(async (event) => {
    try {
        const slug = getRouterParam(event, 'slug')

        if (!slug) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Slug es requerido'
            })
        }

        const client = serverSupabaseServiceRole<Database>(event)

        // Get store settings by slug
        const { data: settings, error } = await client
            .from('store_settings')
            .select('*')
            .eq('slug', slug)
            .single()

        if (error || !settings) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Configuración de tienda no encontrada'
            })
        }

        // Only return public settings
        return {
            success: true,
            data: settings
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Error al obtener configuración'
        })
    }
})
