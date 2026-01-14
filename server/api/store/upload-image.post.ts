import { serverSupabaseServiceRole, serverSupabaseClient } from '#supabase/server'
import type { Database } from '../../../app/types/database.types'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

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
        const { data: userData } = await serviceClient
            .from('users')
            .select('business_id, role')
            .eq('id', user.id)
            .single<{ business_id: string | null; role: string }>()

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
                statusMessage: 'No tienes permisos para subir imágenes'
            })
        }

        // Parse multipart form data
        const formData = await readMultipartFormData(event)
        if (!formData || formData.length === 0) {
            throw createError({
                statusCode: 400,
                statusMessage: 'No se recibió ningún archivo'
            })
        }

        const fileData = formData[0]
        const imageType = formData.find(f => f.name === 'type')?.data.toString() || 'logo'

        // Validate file type
        if (!fileData.type || !ALLOWED_TYPES.includes(fileData.type)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Tipo de archivo no permitido. Solo PNG, JPG, WebP, SVG o ICO'
            })
        }

        // Validate file size
        if (!fileData.data || fileData.data.length > MAX_SIZE) {
            throw createError({
                statusCode: 400,
                statusMessage: 'El archivo es demasiado grande. Máximo 2MB'
            })
        }

        // Validate image type
        if (imageType !== 'logo' && imageType !== 'banner') {
            throw createError({
                statusCode: 400,
                statusMessage: 'Tipo de imagen inválido. Solo "logo" o "banner"'
            })
        }

        // Generate unique filename with timestamp to avoid caching
        const timestamp = Date.now()
        const extension = fileData.type?.split('/')[1] || 'png'
        const fileName = `${imageType}-${timestamp}.${extension}`
        const filePath = `${userData.business_id}/${fileName}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await serviceClient.storage
            .from('store-media')
            .upload(filePath, fileData.data, {
                contentType: fileData.type,
                upsert: true // Overwrite if exists
            })

        if (uploadError) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Error al subir imagen',
                message: uploadError.message
            })
        }

        // Get public URL
        const { data: urlData } = serviceClient.storage
            .from('store-media')
            .getPublicUrl(filePath)

        // Update store settings with new image URL
        const updateField = imageType === 'banner' ? 'banner_url' : 'logo_url'
        const { error: updateError } = await serviceClient
            .from('store_settings')
            .update({ [updateField]: urlData.publicUrl } as never)
            .eq('business_id', userData.business_id)

        if (updateError) {
            console.error('Error updating store settings:', updateError)
            // Don't throw error, image was uploaded successfully
        }

        return {
            success: true,
            url: urlData.publicUrl,
            path: filePath,
            type: imageType
        }
    } catch (error: any) {
        if (error.statusCode) throw error

        throw createError({
            statusCode: 500,
            statusMessage: 'Error del servidor',
            message: error.message
        })
    }
})
