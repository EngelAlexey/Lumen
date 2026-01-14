import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

import { validateOrderParams } from '../../validations/store'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { businessId, customer, items, paymentMethod } = validateOrderParams(body)

    const client = serverSupabaseServiceRole<Database>(event) as any

    try {
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

        const subtotal = items.reduce((sum: number, item: any) => {
            return sum + ((item.price - (item.discount || 0)) * item.quantity)
        }, 0)
        const tax = 0
        const total = subtotal + tax

        const timestamp = Date.now().toString().slice(-6)
        const randomInfo = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        const transactionNumber = `ORD-${timestamp}-${randomInfo}`
        const transactionStatus = 'pending'
        const paymentMethodCode = paymentMethod === 'card' ? 'stripe_checkout' : 'transfer'

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
                cash_session_id: null,
                paid_at: null
            })
            .select()
            .single()

        if (txnError) throw txnError

        const transactionItems = items.map((item: any) => ({
            transaction_id: transaction.id,
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            business_id: businessId
        }))

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

        if (paymentMethod === 'card') {
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

                await client
                    .from('transactions')
                    .update({
                        onvo_checkout_url: link.url,
                        stripe_checkout_session_id: link.id
                    })
                    .eq('id', transaction.id)

                return { success: true, orderId: transaction.id, paymentUrl: link.url }
            } catch (paymentError: any) {
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
