import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { email } = body

    if (!email) {
        throw createError({ statusCode: 400, message: 'Email required' })
    }

    const client = serverSupabaseServiceRole(event)

    // Check public.users (or auth via admin if needed, but public is usually enough if synced)
    // Ideally check auth.users but RLS prevents it. Service Role can check public.
    const { data } = await client
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

    return { exists: !!data }
})
