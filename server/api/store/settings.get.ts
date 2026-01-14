import { serverSupabaseServiceRole, serverSupabaseClient } from '#supabase/server'
import type { Database } from '../../../app/types/database.types'

export default defineEventHandler(async (event) => {
    try {
        // Get authenticated user using client
        const client = await serverSupabaseClient<Database>(event)
        const { data: { user }, error: authError } = await client.auth.getUser()

        if (authError || !user || !user.id) {
            throw createError({
                statusCode: 401,
                statusMessage: 'No autenticado'
            })
        }

        const serviceClient = serverSupabaseServiceRole<Database>(event)

        // Get user's business_id
        const { data: userData, error: userError } = await serviceClient
            .from('users')
            .select('business_id')
            .eq('id', user.id)
            .single<{ business_id: string | null }>()

        if (userError) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Error al obtener datos del usuario',
                message: userError.message
            })
        }

        if (!userData?.business_id) {
            throw createError({
                statusCode: 404,
                statusMessage: 'No se encontró negocio asociado'
            })
        }

        // Get or create store settings
        let { data: settings, error: settingsError } = await serviceClient
            .from('store_settings')
            .select('*')
            .eq('business_id', userData.business_id)
            .single()

        // If settings don't exist, create them
        if (settingsError && settingsError.code === 'PGRST116') {
            // Get business name for slug generation
            const { data: business } = await serviceClient
                .from('businesses')
                .select('name')
                .eq('id', userData.business_id)
                .single<{ name: string }>()

            const businessName = business?.name || 'tienda'

            // Generate slug using database function
            const { data: slugData } = await serviceClient
                .rpc('generate_store_slug' as any, { business_name: businessName })

            const slug = slugData || `tienda-${Date.now()}`

            // Create new settings
            const { data: newSettings, error: createError } = await serviceClient
                .from('store_settings')
                .insert({
                    business_id: userData.business_id,
                    store_name: businessName,
                    slug: slug,
                    is_enabled: false,
                    show_prices: true,
                    allow_orders: true,
                    primary_color: '#4F46E5',
                    secondary_color: '#10B981'
                } as never)
                .select()
                .single()

            if (createError) {
                throw createError({
                    statusCode: 500,
                    statusMessage: 'Error al crear configuración de tienda',
                    message: createError.message
                })
            }

            settings = newSettings
        } else if (settingsError) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Error al obtener configuración',
                message: settingsError.message
            })
        }

        return settings
    } catch (error: any) {
        if (error.statusCode) throw error

        throw createError({
            statusCode: 500,
            statusMessage: 'Error del servidor',
            message: error.message
        })
    }
})
