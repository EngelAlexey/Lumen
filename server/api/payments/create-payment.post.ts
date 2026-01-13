import { serverSupabaseServiceRole } from '#supabase/server'
import { Database } from '../../../app/types/database.types'
import { useOnvo } from '../../utils/onvo'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { transactionId } = body

    if (!transactionId) {
        throw createError({ statusCode: 400, message: 'Transaction ID is required' })
    }

    const config = useRuntimeConfig()
    const client = serverSupabaseServiceRole<Database>(event)
    const onvo = useOnvo()

    // 1. Fetch Transaction
    const { data: transaction, error: dbError } = await client
        .from('transactions')
        .select(`
            *,
            business:businesses(name),
            items:transaction_items(
                product_name,
                quantity,
                unit_price
            )
        `)
        .eq('id', transactionId)
        .single()

    if (dbError || !transaction) {
        throw createError({ statusCode: 404, message: 'Transaction not found' })
    }

    // 2. Prepare line items with casting
    const lineItems = ((transaction as any).items as any[]).map(item => ({
        description: item.product_name,
        unitAmount: Math.round(item.unit_price * 100),
        currency: 'CRC',
        quantity: item.quantity
    }))

    // 3. Create Checkout Link
    try {
        const link = await onvo.createCheckoutLink({
            currency: 'CRC',
            redirectUrl: `${config.public.siteUrl}/payment/success?transaction_id=${transactionId}`,
            cancelUrl: `${config.public.siteUrl}/payment/cancel?transaction_id=${transactionId}`,
            customerName: (transaction as any).customer_name || 'Cliente Invitado',
            customerEmail: 'cliente@example.com',
            lineItems: lineItems,
            metadata: {
                transaction_id: transactionId,
                business_id: (transaction as any).business_id
            }
        })

        // 4. Update Transaction with Payment Info
        await (client.from('transactions') as any)
            .update({
                payment_method: 'card_manual',
                onvo_checkout_url: link.url,
                stripe_checkout_session_id: link.id
            })
            .eq('id', transactionId)

        return {
            success: true,
            url: link.url
        }

    } catch (error: any) {
        console.error('[CreatePayment] Onvo Error:', error)
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to create payment link'
        })
    }
})
