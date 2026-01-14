import { serverSupabaseClient } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'
import { createUserSchema } from '../../validations/schemas'
import { validateBody, createSuccessResponse, createErrorResponse } from '../../utils/validation'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    const supabaseUrl = config.public.supabaseUrl
    const serviceKey = config.supabaseServiceKey

    if (!supabaseUrl || !serviceKey) {
        throw createErrorResponse('Server configuration error', 500)
    }

    // Authenticate requester
    const client = await serverSupabaseClient(event)
    const { data: { user: requesterUser }, error: userError } = await client.auth.getUser()

    if (userError || !requesterUser?.id) {
        throw createErrorResponse('Sesión inválida', 401)
    }

    // Validate request body with Zod
    const validatedData = await validateBody(event, createUserSchema)
    const { full_name, email, password, role, status } = validatedData

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    // Check requester permissions
    const { data: requesterProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('role, business_id')
        .eq('id', requesterUser.id)
        .single()

    if (profileError || !requesterProfile) {
        throw createErrorResponse('No se pudo verificar el rol del usuario', 403)
    }

    const isOwner = requesterProfile.role === 'owner'
    const isAdmin = requesterProfile.role === 'admin'

    if (!isOwner && !isAdmin) {
        throw createErrorResponse('No tienes permisos para crear usuarios', 403)
    }

    if (isAdmin && (role === 'owner' || role === 'admin')) {
        throw createErrorResponse('Administradores solo pueden crear empleados', 403)
    }

    // Create auth user
    const { data: newUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name,
            role,
            business_id: requesterProfile.business_id
        }
    })

    if (createAuthError) {
        throw createErrorResponse(createAuthError.message, 400)
    }

    // Insert into users table
    const { error: insertError } = await supabaseAdmin.from('users').upsert({
        id: newUser.user.id,
        email,
        full_name,
        role,
        business_id: requesterProfile.business_id,
        is_active: status === 'active'
    })

    if (insertError) {
        // Rollback auth user creation if insert fails
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
        throw createErrorResponse(`Error al crear usuario: ${insertError.message}`, 500)
    }

    return createSuccessResponse(
        { user: newUser.user },
        'Usuario creado exitosamente'
    )
})
