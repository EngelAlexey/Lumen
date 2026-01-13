
import { serverSupabaseServiceRole } from '#supabase/server'
import { Database } from '../../app/types/database.types'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const rawBody = await readRawBody(event)
    const signature = getHeader(event, 'onvo-signature')

    // TODO: Verify signature properly using Onvo secret
    // const isValid = verifyOnvoSignature(rawBody, signature, config.onvoWebhookSecret)
    // if (!isValid) throw createError({ statusCode: 400, message: 'Invalid signature' })

    const body = await readBody(event)
    console.log('[OnvoWebhook] Event received:', body.type)

    if (body.type === 'payment_intent.succeeded' || body.type === 'checkout.session.completed') {
        const data = body.data
        const metadata = data.metadata || {}
        const userId = metadata.supabase_user_id

        console.log('[OnvoWebhook] Processing payment/checkout for user:', userId)

        if (userId) {
            const client = serverSupabaseServiceRole<Database>(event)

            // Update user subscription
            // We assume successful payment means active subscription
            const { error } = await client
                .from('users')
                .update({
                    subscription_status: 'active',
                    onvo_subscription_id: data.subscription_id || data.id, // Use subscription ID if available, else checkout/payment ID
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)

            if (error) {
                console.error('[OnvoWebhook] Failed to update user:', error)
                throw createError({ statusCode: 500, message: 'Database update failed' })
            }

            console.log('[OnvoWebhook] User subscription activated:', userId)
        } else {
            console.warn('[OnvoWebhook] No user ID found in metadata')
        }
    }

    return { received: true }
})
