import { serverSupabaseServiceRole } from '#supabase/server'
import { Database } from '../../../app/types/database.types'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const headers = event.node.req.headers
    const signature = headers['x-webhook-secret']

    if (signature !== config.onvoWebhookSecret) {
        console.warn('[Onvo Webhook] Invalid signature:', signature)
        throw createError({ statusCode: 401, message: 'Invalid signature' })
    }

    const body = await readBody(event)
    const eventType = body.type // e.g. 'checkout-session.succeeded', 'subscription.active'
    const data = body.data

    console.log(`[Onvo Webhook] Received event: ${eventType}`, data.id)

    const client = serverSupabaseServiceRole<Database>(event)

    try {
        // Handle Events

        // 1. One-time Payment Success
        if (eventType === 'checkout-session.succeeded') {
            const transactionId = data.metadata?.transaction_id
            if (transactionId) {
                await (client
                    .from('transactions') as any)
                    .update({
                        status: 'paid',
                        paid_at: new Date().toISOString(),
                        onvo_payment_intent_id: data.id
                    })
                    .eq('id', transactionId)
                console.log(`[Onvo Webhook] Transaction ${transactionId} marked as paid`)
            }
        }

        // 2. Subscription Active / Created
        if (eventType === 'subscription.created' || eventType === 'subscription.active') {
            const onvoCustomerId = data.customerId
            // Find business by Onvo Customer ID
            if (onvoCustomerId) {
                await (client
                    .from('businesses') as any)
                    .update({
                        subscription_status: 'active',
                        onvo_subscription_id: data.id,
                        subscription_plan: 'pro'
                    })
                    .eq('onvo_customer_id', onvoCustomerId)
                console.log(`[Onvo Webhook] Subscription active for customer ${onvoCustomerId}`)
            }
        }

        // 3. Subscription Invoice Paid (Recurring success)
        if (eventType === 'invoice.payment_succeeded') {
            // Refresh status or extend date
            const onvoSubscriptionId = data.subscriptionId
            if (onvoSubscriptionId) {
                await (client
                    .from('businesses') as any)
                    .update({ subscription_status: 'active' })
                    .eq('onvo_subscription_id', onvoSubscriptionId)
            }
        }

        return { received: true }

    } catch (error) {
        console.error('[Onvo Webhook] Error processing event:', error)
        throw createError({ statusCode: 500, message: 'Internal Server Error' })
    }
})
