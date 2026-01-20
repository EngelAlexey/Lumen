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

  // Fetch transactions
  const { data: transactionsData, error } = await client
    .from('transactions')
    .select('payment_method, total')
    .gte('created_at', transactionDate(startDate, 'start'))
    .lte('created_at', transactionDate(endDate, 'end'))
    .in('status', ['paid', 'delivered'])

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  const transactions = transactionsData || []

  // Aggregate
  const stats: Record<string, number> = {}
  transactions.forEach((t: any) => {
    // Normalize payment method label if needed?
    // We'll rely on the translation in frontend to map codes to labels
    const method = t.payment_method || 'unknown'
    stats[method] = (stats[method] || 0) + t.total
  })

  const sorted = Object.entries(stats).sort(([, a], [, b]) => b - a)

  return {
    labels: sorted.map(([l]) => l),
    datasets: [
      {
        data: sorted.map(([, v]) => v),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444']
      }
    ]
  }
})

function transactionDate(dateStr: string, type: 'start' | 'end') {
  if (type === 'start') return startOfDay(parseISO(dateStr)).toISOString()
  return endOfDay(parseISO(dateStr)).toISOString()
}
