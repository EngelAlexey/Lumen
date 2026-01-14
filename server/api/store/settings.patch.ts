import { serverSupabaseServiceRole, serverSupabaseClient } from '#supabase/server'
import type { Database } from '../../../app/types/database.types'
import { storeSettingsSchema } from '../../validations/schemas'
import { validateBody, createSuccessResponse, createErrorResponse } from '../../utils/validation'

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

        // Get user's business_id and role
        const { data: userData, error: userError } = await serviceClient
            .from('users')
            .select('business_id, role')
            .eq('id', user.id)
            .single<{ business_id: string | null; role: string }>()

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

        // Check if user is owner or admin
        if (userData.role !== 'owner' && userData.role !== 'admin') {
            throw createError({
                statusCode: 403,
                statusMessage: 'No tienes permisos para modificar la configuración de la tienda'
            })
        }

        // Validate request body
        const validatedData = await validateBody(event, storeSettingsSchema)

        // Update store settings
        const { data: updatedSettings, error: updateError } = await serviceClient
            .from('store_settings')
            .update(validatedData as never)
            .eq('business_id', userData.business_id)
            .select()
            .single()

        if (updateError) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Error al actualizar configuración',
                message: updateError.message
            })
        }

        return createSuccessResponse(
            updatedSettings,
            'Configuración actualizada exitosamente'
        )
    } catch (error: any) {
        if (error.statusCode) throw error

        throw createError({
            statusCode: 500,
            statusMessage: 'Error del servidor',
            message: error.message
        })
    }
})
