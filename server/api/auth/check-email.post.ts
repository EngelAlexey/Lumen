import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { email } = body

    if (!email) {
        throw createError({ statusCode: 400, message: 'Email required' })
    }

    const client = serverSupabaseServiceRole(event)

    const { data } = await client
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

    return { exists: !!data }
})
