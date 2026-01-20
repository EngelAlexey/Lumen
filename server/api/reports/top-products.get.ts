import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import { startOfDay, endOfDay, parseISO } from 'date-fns'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async event => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const client = await serverSupabaseClient<Database>(event)
  const query = getQuery(event)
  const startDate = query.startDate as string
  const endDate = query.endDate as string
  const limit = Number(query.limit) || 5

  if (!startDate || !endDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Start date and end date are required'
    })
  }

  // We need to join transaction_items with transactions to check status and date
  // Supabase JS client doesn't support complex joins + aggregation easily.
  // Workaround:
  // 1. Fetch transactions IDs in range
  // 2. Fetch items for those IDs
  // 3. Aggregate in memory

  const { data: transactionsData, error: txnError } = await client
    .from('transactions')
    .select('id')
    .gte('created_at', transactionDate(startDate, 'start'))
    .lte('created_at', transactionDate(endDate, 'end'))
    .in('status', ['paid', 'delivered'])

  if (txnError) throw txnError

  if (!transactionsData || transactionsData.length === 0) {
    return []
  }

  const transactionIds = transactionsData.map((t: any) => t.id)

  const { data: itemsData, error: itemsError } = await client
    .from('transaction_items')
    .select('product_id, product_name, quantity, subtotal')
    .in('transaction_id', transactionIds)

  if (itemsError) throw itemsError

  // Aggregate
  const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {}
  const items = itemsData || []

  items.forEach((item: any) => {
    const id = item.product_id
    if (!productStats[id]) {
      productStats[id] = {
        name: item.product_name,
        quantity: 0,
        revenue: 0
      }
    }
    productStats[id].quantity += item.quantity
    productStats[id].revenue += item.subtotal
  })

  // Sort and limit
  const sorted = Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)

  return sorted
})

function transactionDate(dateStr: string, type: 'start' | 'end') {
  if (type === 'start') return startOfDay(parseISO(dateStr)).toISOString()
  return endOfDay(parseISO(dateStr)).toISOString()
}
