import { serverSupabaseClient } from '#supabase/server'
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    const supabaseUrl = config.public.supabaseUrl
    const serviceKey = config.supabaseServiceKey

    // 1. Validación de Configuración
    if (!supabaseUrl || !serviceKey) {
        console.error('❌ Error Config: Faltan variables SUPABASE_URL o SUPABASE_SERVICE_KEY')
        throw createError({ statusCode: 500, message: 'Server configuration error' })
    }

    // 2. OBTENER USUARIO (Forma Robusta)
    // Usamos el cliente estándar para verificar el token de la petición
    const client = await serverSupabaseClient(event)
    const { data: { user: requesterUser }, error: userError } = await client.auth.getUser()

    // Validamos explícitamente que exista el usuario Y su ID
    if (userError || !requesterUser || !requesterUser.id) {
        console.error('❌ Error Auth:', userError?.message || 'Usuario sin ID')
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized - Invalid Session' })
    }

    // 3. Inicializar Admin (Modo Dios)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    const body = await readBody(event)
    const { email, password, fullName, phone, role } = body

    if (!email || !password || !fullName || !role) {
        throw createError({ statusCode: 400, statusMessage: 'Faltan campos requeridos' })
    }

    // 4. Buscar Perfil del Owner
    // Ahora estamos 100% seguros de que requesterUser.id es un string válido
    const { data: requesterProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('role, business_id')
        .eq('id', requesterUser.id) // <--- Aquí fallaba antes
        .single()

    if (profileError || !requesterProfile) {
        console.error('❌ Error buscando perfil para ID:', requesterUser.id, profileError)
        throw createError({
            statusCode: 403,
            statusMessage: 'Perfil no encontrado',
            message: 'No se pudo verificar el rol del usuario solicitante'
        })
    }

    // 5. Validar Permisos
    const isOwner = requesterProfile.role === 'owner'
    const isManager = requesterProfile.role === 'manager'

    if (!isOwner && !isManager) {
        throw createError({ statusCode: 403, statusMessage: 'No tienes permisos para crear usuarios' })
    }
    if (isManager && (role === 'owner' || role === 'manager')) {
        throw createError({ statusCode: 403, statusMessage: 'Gerentes solo pueden crear staff/cajeros' })
    }

    // 6. Crear el Nuevo Usuario (Auth)
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

    // 7. Insertar en tabla pública (Respaldo explícito)
    const { error: insertError } = await supabaseAdmin.from('users').upsert({
        id: newUser.user.id,
        email,
        full_name: fullName,
        role,
        business_id: requesterProfile.business_id,
        phone: phone || null
    })

    if (insertError) {
        // Rollback: Si falla la tabla pública, borramos el usuario de Auth
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
        throw createError({ statusCode: 500, message: 'Error en tabla users: ' + insertError.message })
    }

    return { success: true, user: newUser.user }
})