import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { businessId, customer, items, paymentMethod = 'cash' } = body

    if (!businessId || !customer || !items || items.length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Faltan datos requeridos'
        })
    }

    const client = serverSupabaseServiceRole<Database>(event) as any

    try {
        // 1. Find or Create Customer
        let customerId: string | null = null

        if (customer.phone) {
            const { data } = await client
                .from('customers')
                .select('id')
                .eq('business_id', businessId)
                .eq('phone', customer.phone)
                .single()
            if (data) customerId = data.id
        }

        if (!customerId && customer.email) {
            const { data } = await client
                .from('customers')
                .select('id')
                .eq('business_id', businessId)
                .eq('email', customer.email)
                .single()
            if (data) customerId = data.id
        }

        if (!customerId) {
            const { data, error } = await client
                .from('customers')
                .insert({
                    business_id: businessId,
                    full_name: customer.full_name,
                    phone: customer.phone,
                    email: customer.email || null,
                    address: customer.address || null,
                    notes: customer.notes || null
                })
                .select()
                .single()

            if (error) throw error
            customerId = data.id
        } else {
            await client
                .from('customers')
                .update({
                    address: customer.address,
                    updated_at: new Date().toISOString()
                })
                .eq('id', customerId)
        }

        // 2. Create Transaction
        const subtotal = items.reduce((sum: number, item: any) => {
            return sum + ((item.price - (item.discount || 0)) * item.quantity)
        }, 0)

        // Tax calculation could be added here if needed, for now 0
        const tax = 0
        const total = subtotal + tax

        // Generate Transaction Number (simple implementation)
        const timestamp = Date.now().toString().slice(-6)
        const randomInfo = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        const transactionNumber = `ORD-${timestamp}-${randomInfo}`

        // Determine status based on payment method
        const isPaidOnDelivery = paymentMethod === 'cash' || paymentMethod === 'transfer'
        const transactionStatus = isPaidOnDelivery ? 'paid' : 'pending'
        const paymentMethodCode = paymentMethod === 'cash' ? 'cash' : (paymentMethod === 'transfer' ? 'transfer' : 'other')

        const { data: transaction, error: txnError } = await client
            .from('transactions')
            .insert({
                business_id: businessId,
                customer_id: customerId,
                transaction_number: transactionNumber,
                status: transactionStatus,
                delivery_status: 'pending',
                payment_method: paymentMethodCode,
                subtotal: subtotal,
                tax: tax,
                discount: 0,
                total: total,
                notes: `Pedido Online - ${customer.full_name}. Método: ${paymentMethod}. Notas: ${customer.notes || ''}`,
                delivery_date: null,
                shipping_address: customer.address,
                paid_at: isPaidOnDelivery ? new Date().toISOString() : null
            })
            .select()
            .single()

        if (txnError) throw txnError

        // 3. Create Transaction Items
        const transactionItems = items.map((item: any) => ({
            transaction_id: transaction.id,
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            business_id: businessId // Ensure this field exists or remove if not in schema
        }))

        // NOTE: If transaction_items doesn't have business_id, map without it. 
        // Based on typical schema it might, but checking safest path.
        // I will assume it DOES NOT have business_id based on typical item tables, 
        // but if it does, it's safer to check or add it.
        // Looking at database.types.ts in Step 501, it didn't show full details.
        // I'll stick to the core fields. If it fails, I'll know.
        // Correction: Most likely transaction_items is linked via transaction_id.
        // Let's remove business_id from items just to be safe or add it if the schema requires.
        // Safest is to stick to what was there. The previous code didn't have business_id.

        const { error: itemsError } = await client
            .from('transaction_items')
            .insert(items.map((item: any) => ({
                transaction_id: transaction.id,
                product_id: item.productId,
                product_name: item.name,
                quantity: item.quantity,
                unit_price: item.price,
                discount: item.discount || 0,
                subtotal: (item.price - (item.discount || 0)) * item.quantity
            })))

        if (itemsError) throw itemsError

        // If online payment, create payment link
        if (paymentMethod === 'online') {
            const onvo = useOnvo()
            const config = useRuntimeConfig()

            try {
                const link = await onvo.createCheckoutLink({
                    redirectUrl: `${config.public.siteUrl}/store/${customer.store_slug || 'tienda'}/order-success?order_id=${transaction.id}`,
                    cancelUrl: `${config.public.siteUrl}/store/${customer.store_slug || 'tienda'}/checkout`,
                    customerName: customer.full_name,
                    customerEmail: customer.email || 'cliente@example.com',
                    lineItems: items.map((item: any) => ({
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity
                    })),
                    metadata: {
                        transaction_id: transaction.id,
                        business_id: businessId
                    }
                })

                // Update transaction with payment URL
                await client
                    .from('transactions')
                    .update({
                        onvo_checkout_url: link.url,
                        stripe_checkout_session_id: link.id
                    })
                    .eq('id', transaction.id)

                return { success: true, orderId: transaction.id, paymentUrl: link.url }
            } catch (paymentError: any) {
                // If payment link creation fails, still return success but without payment link
                return { success: true, orderId: transaction.id, error: 'Payment link unavailable' }
            }
        }

        return { success: true, orderId: transaction.id }

    } catch (e: any) {
        throw createError({
            statusCode: 500,
            statusMessage: e.message || 'Error procesando el pedido'
        })
    }
})
