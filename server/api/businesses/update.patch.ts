import { serverSupabaseServiceRole, serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import type { Database } from '../../../app/types/database.types'

export default defineEventHandler(async (event) => {
    try {
        // Get authenticated user
        const authClient = await serverSupabaseClient<Database>(event)
        const { data: { user }, error: authError } = await authClient.auth.getUser()

        if (authError || !user || !user.id) {
            throw createError({
                statusCode: 401,
                statusMessage: 'No autenticado'
            })
        }

        const client = serverSupabaseServiceRole<Database>(event)

        // Get the update data from request body
        const body = await readBody(event)

        // Get user's business_id
        const { data: userData, error: userError } = await client
            .from('users')
            .select('business_id, role')
            .eq('id', user.id)
            .single<{ business_id: string | null; role: string }>()

        if (userError || !userData?.business_id) {
            throw createError({
                statusCode: 404,
                statusMessage: 'No se encontró negocio asociado'
            })
        }

        // Check permissions - only owner can update business info
        if (userData.role !== 'owner') {
            throw createError({
                statusCode: 403,
                statusMessage: 'Solo el propietario puede actualizar la información del negocio'
            })
        }

        // Update business
        const { error: updateError } = await client
            .from('businesses')
            .update(body as never)
            .eq('id', userData.business_id)

        if (updateError) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Error al actualizar negocio',
                message: updateError.message
            })
        }

        return {
            success: true,
            message: 'Negocio actualizado exitosamente'
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Error al actualizar negocio'
        })
    }
})
