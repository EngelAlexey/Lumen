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

  if (!startDate || !endDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Start date and end date are required'
    })
  }

  // 1. Fetch transactions to filter by date/status
  const { data: transactionsData, error: txnError } = await client
    .from('transactions')
    .select('id')
    .gte('created_at', transactionDate(startDate, 'start'))
    .lte('created_at', transactionDate(endDate, 'end'))
    .in('status', ['paid', 'delivered'])

  if (txnError) throw txnError

  if (!transactionsData || transactionsData.length === 0) {
    return { labels: [], datasets: [] }
  }

  const transactionIds = transactionsData.map((t: any) => t.id)

  // 2. Fetch items
  const { data: itemsData, error: itemsError } = await client
    .from('transaction_items')
    .select('product_id, subtotal')
    .in('transaction_id', transactionIds)

  if (itemsError) throw itemsError
  const items = itemsData || []

  if (items.length === 0) return { labels: [], datasets: [] }

  // 3. Fetch products to get categories
  const productIds = [...new Set(items.map((i: any) => i.product_id))]
  const { data: productsData, error: prodError } = await client
    .from('products')
    .select('id, category')
    .in('id', productIds)

  if (prodError) throw prodError

  // Map product_id -> category
  const productCategoryMap = new Map<string, string>()
  productsData?.forEach((p: any) => {
    if (p.category) productCategoryMap.set(p.id, p.category)
  })

  // 4. Aggregate
  const categoryStats: Record<string, number> = {}
  items.forEach((item: any) => {
    const cat = productCategoryMap.get(item.product_id) || 'Sin Categoría'
    categoryStats[cat] = (categoryStats[cat] || 0) + item.subtotal
  })

  // Sort by value desc
  const sortedCategories = Object.entries(categoryStats).sort(([, a], [, b]) => b - a)

  const labels = sortedCategories.map(([l]) => l)
  const data = sortedCategories.map(([, v]) => v)

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: [
          '#10B981',
          '#3B82F6',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#EC4899',
          '#6366F1',
          '#14B8A6'
        ]
      }
    ]
  }
})

function transactionDate(dateStr: string, type: 'start' | 'end') {
  if (type === 'start') return startOfDay(parseISO(dateStr)).toISOString()
  return endOfDay(parseISO(dateStr)).toISOString()
}
