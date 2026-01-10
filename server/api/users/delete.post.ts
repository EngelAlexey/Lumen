import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const requesterUser = await serverSupabaseUser(event)
    if (!requesterUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    const supabaseAdmin = serverSupabaseServiceRole(event) as any
    const body = await readBody(event)
    const { user_id: targetUserId } = body
    const { data: requesterProfile } = await supabaseAdmin
        .from('users')
        .select('role, business_id')
        .eq('id', requesterUser.id)
        .single()

    if (!requesterProfile || requesterProfile.role !== 'owner') {
        throw createError({ statusCode: 403, statusMessage: 'Solo el dueño puede eliminar usuarios permanentemente' })
    }

    const { data: targetProfile } = await supabaseAdmin
        .from('users')
        .select('business_id, role')
        .eq('id', targetUserId)
        .single()

    if (!targetProfile) throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' })

    if (targetProfile.business_id !== requesterProfile.business_id) {
        throw createError({ statusCode: 403, statusMessage: 'No puedes eliminar usuarios de otro negocio' })
    }

    if (targetUserId === requesterUser.id) {
        throw createError({ statusCode: 400, statusMessage: 'No puedes eliminar tu propia cuenta de dueño aquí' })
    }

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    if (authDeleteError) {
        throw createError({ statusCode: 500, statusMessage: authDeleteError.message })
    }

    await supabaseAdmin.from('users').delete().eq('id', targetUserId)

    return { success: true }
})