import Stripe from 'stripe'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    if (!config.stripeSecretKey) {
        throw createError({
            statusCode: 500,
            message: 'Stripe Secret Key is missing in configuration'
        })
    }

    const stripe = new Stripe(config.stripeSecretKey.trim(), {
        apiVersion: '2025-12-15.clover',
    })

    const user = await serverSupabaseUser(event)
    if (!user) {
        throw createError({
            statusCode: 401,
            message: 'Unauthorized'
        })
    }

    const body = await readBody(event)
    console.log('CREATE-PAYMENT: Received body:', body)
    const { transactionId } = body

    if (!transactionId) {
        throw createError({
            statusCode: 400,
            message: 'Transaction ID is required'
        })
    }

    const supabase = await serverSupabaseClient(event) as any

    // 1. Get Transaction Details
    const { data: transaction, error: txnError } = await supabase
        .from('transactions')
        .select(`
            *,
            transaction_items (
                product_name,
                unit_price,
                quantity,
                subtotal
            ),
            customers (
                email,
                full_name
            )
        `)
        .eq('id', transactionId)
        .single()

    if (txnError || !transaction) {
        throw createError({
            statusCode: 404,
            message: 'Transaction not found'
        })
    }

    // Authorization check: User must belong to the same business
    // Use Service Role to bypass RLS for this internal check
    const { serverSupabaseServiceRole } = await import('#supabase/server')
    const adminClient = serverSupabaseServiceRole<Database>(event)
    // Use ID or Sub (JWT) as user ID
    const userId = user.id || (user as any).sub

    if (!userId) {
        console.error('User ID is missing on user object:', user)
        throw createError({ statusCode: 401, message: 'User ID missing' })
    }

    const { data: userData } = await adminClient.from('users').select('business_id').eq('id', userId).single() as { data: any }

    console.log('Debug Create Payment:', {
        userId,
        userBusiness: userData?.business_id,
        txnBusiness: transaction.business_id
    })

    if (transaction.business_id !== userData?.business_id) {
        throw createError({ statusCode: 403, message: `Forbidden: TxnBiz ${transaction.business_id} != UserBiz ${userData?.business_id}` })
    }

    // 2. Prepare Line Items
    const line_items = transaction.transaction_items.map((item: any) => ({
        price_data: {
            currency: 'crc', // Or dynamic based on business settings
            product_data: {
                name: item.product_name,
            },
            unit_amount: Math.round(item.unit_price * 100), // Stripe expects amounts in cents/smallest unit
        },
        quantity: item.quantity,
    }))

    // 3. Create Stripe Session
    try {
        const sessionPayload: Stripe.Checkout.SessionCreateParams = {
            payment_method_types: ['card'],
            line_items: line_items,
            mode: 'payment',
            success_url: `${config.public.siteUrl}/transactions/${transactionId}?payment=success`,
            cancel_url: `${config.public.siteUrl}/transactions/${transactionId}?payment=cancelled`,
            metadata: {
                transaction_id: transactionId,
                business_id: transaction.business_id
            },
            client_reference_id: transactionId,
        }

        // Add customer email if available to pre-fill
        if (transaction.customers?.email) {
            sessionPayload.customer_email = transaction.customers.email
        }

        const session = await stripe.checkout.sessions.create(sessionPayload)

        // 4. Update Transaction with Session ID
        await supabase
            .from('transactions')
            .update({
                stripe_checkout_session_id: session.id,
                stripe_payment_url: session.url,
                payment_method: 'stripe_checkout',
                // We don't set status to 'paid' yet. Webhook does that.
            })
            .eq('id', transactionId)

        return { url: session.url }

    } catch (error: any) {
        console.error('Stripe Session Error:', error)
        throw createError({
            statusCode: 500,
            message: error.message
        })
    }
})
