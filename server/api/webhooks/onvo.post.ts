
import { serverSupabaseServiceRole } from '#supabase/server'
import { Database } from '~/types/database.types'

import { validateOnvoEvent } from '../../validations/webhook'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const rawBody = await readRawBody(event)
    const signature = getHeader(event, 'onvo-signature')

    const body = await readBody(event)
    console.log('[OnvoWebhook] Event received:', body.type)

    const validation = validateOnvoEvent(body)
    if (!validation.shouldProcess || !validation.isValid) {
        return { received: true }
    }

    const { data, userId } = validation

    const client = serverSupabaseServiceRole<Database>(event)

    const { error } = await client
        .from('users')
        // @ts-ignore - Supabase type inference issue
        .update({
            subscription_status: 'active',
            onvo_subscription_id: data.subscription_id || data.id,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)

    if (error) {
        console.error('[OnvoWebhook] Failed to update user:', error)
        throw createError({ statusCode: 500, message: 'Database update failed' })
    }

    return { received: true }
})
