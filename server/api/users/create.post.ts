import { serverSupabaseClient } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    const supabaseUrl = config.public.supabaseUrl
    const serviceKey = config.supabaseServiceKey

    if (!supabaseUrl || !serviceKey) {
        throw createError({ statusCode: 500, message: 'Server configuration error' })
    }

    const client = await serverSupabaseClient(event)
    const { data: { user: requesterUser }, error: userError } = await client.auth.getUser()

    if (userError || !requesterUser || !requesterUser.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized - Invalid Session' })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    const body = await readBody(event)
    const { email, password, fullName, phone, role } = body

    if (!email || !password || !fullName || !role) {
        throw createError({ statusCode: 400, statusMessage: 'Faltan campos requeridos' })
    }

    const { data: requesterProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('role, business_id')
        .eq('id', requesterUser.id)
        .single()

    if (profileError || !requesterProfile) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Perfil no encontrado',
            message: 'No se pudo verificar el rol del usuario solicitante'
        })
    }

    const isOwner = requesterProfile.role === 'owner'
    const isManager = requesterProfile.role === 'manager'

    if (!isOwner && !isManager) {
        throw createError({ statusCode: 403, statusMessage: 'No tienes permisos para crear usuarios' })
    }
    if (isManager && (role === 'owner' || role === 'manager')) {
        throw createError({ statusCode: 403, statusMessage: 'Gerentes solo pueden crear staff/cajeros' })
    }

    const { data: newUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            phone: phone || null,
            role,
            business_id: requesterProfile.business_id
        }
    })

    if (createAuthError) {
        throw createError({ statusCode: 400, message: createAuthError.message })
    }

    const { error: insertError } = await supabaseAdmin.from('users').upsert({
        id: newUser.user.id,
        email,
        full_name: fullName,
        role,
        business_id: requesterProfile.business_id,
        phone: phone || null
    })

    if (insertError) {
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
        throw createError({ statusCode: 500, message: 'Error en tabla users: ' + insertError.message })
    }

    return { success: true, user: newUser.user }
})
