import Stripe from 'stripe'
import { serverSupabaseUser, serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()

    // Check Stripe Key
    if (!config.stripeSecretKey) {
        throw createError({ statusCode: 500, message: 'Stripe Secret Key missing' })
    }

    const stripe = new Stripe(config.stripeSecretKey.trim(), {
        apiVersion: '2025-12-15.clover',
    })

    const body = await readBody(event)
    const { transactionId } = body

    if (!transactionId) {
        throw createError({ statusCode: 400, message: 'Transaction ID required' })
    }

    const user = await serverSupabaseUser(event)
    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const supabase = await serverSupabaseClient(event) as any

    // 1. Fetch Transaction
    const { data: transaction, error: txnError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

    if (txnError || !transaction) {
        throw createError({ statusCode: 404, message: 'Transaction not found' })
    }

    // If already paid, return success
    if (transaction.status === 'paid') {
        return { success: true, status: 'paid' }
    }

    // If no Stripe Session ID, cannot verify
    if (!transaction.stripe_checkout_session_id) {
        throw createError({ statusCode: 400, message: 'No Stripe session associated' })
    }

    try {
        // 2. Retrieve Session from Stripe
        const session = await stripe.checkout.sessions.retrieve(transaction.stripe_checkout_session_id)

        // 3. Update DB if paid
        if (session.payment_status === 'paid') {
            // Use Service Role to bypass RLS for updates if needed, though Client might have permissions.
            // Using Service Role is safer for backend status updates.
            const { serverSupabaseServiceRole } = await import('#supabase/server')
            const adminClient = serverSupabaseServiceRole<Database>(event)

            const { error: updateError } = await (adminClient.from('transactions') as any)
                .update({
                    status: 'paid',
                    paid_at: new Date().toISOString(),
                    // payment_method: 'stripe_checkout', // Already set
                    stripe_payment_intent_id: session.payment_intent as string
                })
                .eq('id', transactionId)

            if (updateError) {
                throw createError({ statusCode: 500, message: 'DB Update Failed' })
            }

            return { success: true, status: 'paid' }
        }

        return { success: false, status: session.payment_status }

    } catch (error: any) {
        throw createError({ statusCode: 500, message: error.message })
    }
})
