import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event)
    const user = await serverSupabaseUser(event)
    const body = await readBody(event)

    if (!user) {
        throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    const { business_id, delete_transactions, delete_products } = body

    if (!business_id) {
        throw createError({ statusCode: 400, message: 'Business ID required' })
    }

    // Verify ownership
    const { data: userRecord } = await client
        .from('users')
        .select('business_id, role')
        .eq('id', user.id)
        .eq('id', user.id)
        .single()

    console.log('[API Reset] User:', user.id)
    console.log('[API Reset] User Record Business:', userRecord?.business_id)
    console.log('[API Reset] Target Business:', business_id)

    if (!userRecord || userRecord.business_id !== business_id) {
        throw createError({ statusCode: 403, message: 'Forbidden' })
    }

    // Perform Deletions
    // Delete Transactions
    if (delete_transactions) {
        const { error: txnError } = await client
            .from('transactions')
            .delete()
            .eq('business_id', business_id)

        if (txnError) throw createError({ statusCode: 500, message: txnError.message })

        const { error: cashError } = await client
            .from('cash_register_sessions')
            .delete()
            .eq('business_id', business_id)

        if (cashError) throw createError({ statusCode: 500, message: cashError.message })
    }

    // Delete Products
    if (delete_products) {
        const { error: prodError } = await client
            .from('products')
            .delete()
            .eq('business_id', business_id)

        if (prodError) throw createError({ statusCode: 500, message: prodError.message })
    }

    return { success: true }
})
