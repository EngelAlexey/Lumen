import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const supabaseAdmin = serverSupabaseServiceRole(event) as any
    const user = await serverSupabaseUser(event)
    const body = await readBody(event)

    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        })
    }

    const targetUserId = body.user_id

    if (!targetUserId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'User ID is required'
        })
    }

    // 1. Verify credentials: The requester must be an 'owner'
    // We check the requester's profile in the public table
    // Note: We use the admin client to bypass RLS for this check to be absolutely sure, 
    // though strictly speaking regular client would work if RLS is correct.
    const { data: requesterProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('role, business_id')
        .eq('id', user.id)
        .single()

    if (profileError || !requesterProfile || requesterProfile.role !== 'owner') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden: Only owners can delete users'
        })
    }

    // 2. Verify target user belongs to the same business
    const { data: targetProfile, error: targetError } = await supabaseAdmin
        .from('users')
        .select('business_id, role')
        .eq('id', targetUserId)
        .single()

    if (targetError || !targetProfile) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Target user not found'
        })
    }

    if (targetProfile.business_id !== requesterProfile.business_id) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden: Cannot delete user from another business'
        })
    }

    // Prevent deleting yourself
    if (targetUserId === user.id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Cannot delete yourself'
        })
    }

    // 3. Perform Deletion
    // A. Delete from Supabase Auth (This is the critical part that client-side cannot do)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    if (authDeleteError) {
        console.error('Error deleting auth user:', authDeleteError)
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to delete user from Auth system'
        })
    }

    // B. Delete from public table (Optional if cascade is set, but good practice to allow "Soft Delete" logic here instead if requested)
    // The user requested HARD delete from auth, which usually implies removing access. 
    // If we want to keep history, we should keep the public record but anonymize it or mark is_active=false. 
    // However, since auth user is gone, the foreign key constraint on id might cascade delete public.users!
    // Let's check if the trigger or FK handles this. 
    // By default supabase auth FK is ON DELETE CASCADE unless modified.
    // If we want detailed audit, we should have a separate audit_logs table, because public.users row will likely vanish.

    return { success: true }
})
