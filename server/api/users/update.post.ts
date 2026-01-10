import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const requesterUser = await serverSupabaseUser(event)
    if (!requesterUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const supabaseAdmin = serverSupabaseServiceRole(event) as any
    const body = await readBody(event)

    const { targetUserId, updates } = body

    const { data: requesterProfile } = await supabaseAdmin
        .from('users')
        .select('role, business_id')
        .eq('id', requesterUser.id)
        .single()

    if (!requesterProfile) throw createError({ statusCode: 403, statusMessage: 'Perfil inválido' })

    const { data: targetProfile } = await supabaseAdmin
        .from('users')
        .select('role, business_id')
        .eq('id', targetUserId)
        .single()

    if (!targetProfile) throw createError({ statusCode: 404, statusMessage: 'Usuario objetivo no encontrado' })

    if (requesterProfile.business_id !== targetProfile.business_id) {
        throw createError({ statusCode: 403, statusMessage: 'Acceso denegado a otro negocio' })
    }

    const requesterIsOwner = requesterProfile.role === 'owner'
    const requesterIsManager = requesterProfile.role === 'manager'
    const targetIsOwner = targetProfile.role === 'owner'

    if (targetIsOwner && requesterUser.id !== targetUserId) {
        throw createError({ statusCode: 403, statusMessage: 'No puedes modificar al dueño del negocio' })
    }

    if (requesterIsManager) {
        if (targetIsOwner || targetProfile.role === 'manager') {
            if (requesterUser.id !== targetUserId) {
                throw createError({ statusCode: 403, statusMessage: 'Los gerentes solo pueden editar cajeros o personal' })
            }
        }
    }

    if (updates.password || updates.email) {
        const authUpdates: any = {}
        if (updates.password) authUpdates.password = updates.password
        if (updates.email) authUpdates.email = updates.email

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, authUpdates)
        if (authError) throw createError({ statusCode: 500, statusMessage: authError.message })
    }

    const publicUpdates: any = {}
    if (updates.fullName) publicUpdates.full_name = updates.fullName
    if (updates.phone) publicUpdates.phone = updates.phone

    if (updates.role && requesterIsOwner) {
        publicUpdates.role = updates.role
        await supabaseAdmin.auth.admin.updateUserById(targetUserId, { user_metadata: { role: updates.role } })
    }

    if (typeof updates.is_active === 'boolean') {
        publicUpdates.is_active = updates.is_active

        const banDuration = updates.is_active === false ? '876000h' : '0'
        await supabaseAdmin.auth.admin.updateUserById(targetUserId, { ban_duration: banDuration })
    }

    if (Object.keys(publicUpdates).length > 0) {
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .update(publicUpdates)
            .eq('id', targetUserId)

        if (dbError) throw createError({ statusCode: 500, statusMessage: dbError.message })
    }

    return { success: true }
})