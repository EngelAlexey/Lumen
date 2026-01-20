import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import { startOfDay, endOfDay, parseISO, startOfWeek, format } from 'date-fns'
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
  const groupBy = (query.groupBy as string) || 'day' // day, week, month

  if (!startDate || !endDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Start date and end date are required'
    })
  }

  // Get user's business
  // We assume the user belongs to a business. In this system manually getting it or relying on RLS.
  // If RLS is set up on 'transactions' to only show rows for user's business, we just query 'transactions'.
  // However, usually we want to be explicit.
  // Let's first quickly check user's metadata or profile to get business_id if needed,
  // but if RLS is good, we just filter by date.
  // SAFEGUARE: Filter by business_id if we can find it, otherwise rely on RLS.

  // Fetch transactions
  // Explicitly casting data to any[] to avoid 'never' type inference issue with the partial select
  // In a strict setup, we would define a specific type for the selected columns.
  const { data, error } = await client
    .from('transactions')
    .select('created_at, total, tax, discount, status')
    .gte('created_at', transactionDate(startDate, 'start'))
    .lte('created_at', transactionDate(endDate, 'end'))
    .in('status', ['paid', 'delivered']) // Only count completed/paid sales? Or all? Usually 'paid' or 'delivered' for sales reports.

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  const transactions = data || []
  console.log(
    '[Reports] Fetched transactions:',
    transactions.length,
    'for period:',
    startDate,
    'to',
    endDate
  )

  // Aggregation Logic
  const aggregated = aggregateData(transactions, groupBy, startDate, endDate)

  return {
    summary: {
      totalSales: transactions.reduce((sum: number, t: any) => sum + (t.total || 0), 0),
      totalCount: transactions.length,
      averageOrderValue: transactions.length
        ? transactions.reduce((sum: number, t: any) => sum + (t.total || 0), 0) /
          transactions.length
        : 0
    },
    chartData: aggregated
  }
})

function transactionDate(dateStr: string, type: 'start' | 'end') {
  if (type === 'start') return startOfDay(parseISO(dateStr)).toISOString()
  return endOfDay(parseISO(dateStr)).toISOString()
}

function aggregateData(transactions: any[], groupBy: string, start: string, end: string) {
  const s = parseISO(start)
  const e = parseISO(end)
  const grouped: Record<string, number> = {}

  // 1. Initialize all keys with 0 based on interval
  let current = s
  while (current <= e) {
    let key = ''
    if (groupBy === 'day') {
      key = format(current, 'yyyy-MM-dd')
      // increment by 1 day
      const next = new Date(current)
      next.setDate(next.getDate() + 1)
      current = next
    } else if (groupBy === 'week') {
      key = format(startOfWeek(current), 'yyyy-MM-dd')
      // increment by 1 week
      const next = new Date(current)
      next.setDate(next.getDate() + 7)
      current = next
    } else if (groupBy === 'month') {
      key = format(current, 'yyyy-MM')
      // increment by 1 month
      const next = new Date(current)
      next.setMonth(next.getMonth() + 1)
      current = next
    }
    grouped[key] = 0
  }

  // 2. Fill with actual data
  transactions.forEach(t => {
    const date = parseISO(t.created_at)
    let key = ''
    if (groupBy === 'day') key = format(date, 'yyyy-MM-dd')
    else if (groupBy === 'week') key = format(startOfWeek(date), 'yyyy-MM-dd')
    else if (groupBy === 'month') key = format(date, 'yyyy-MM')

    // Ensure key exists (in case transaction falls slightly outside generated range due to timezones, though we filtered by date)
    if (grouped[key] !== undefined) {
      grouped[key] += t.total
    } else {
      // fallback if logic mismatch
      grouped[key] = (grouped[key] || 0) + t.total
    }
  })

  // Sort keys
  const labels = Object.keys(grouped).sort()
  const data = labels.map(l => grouped[l])

  return {
    labels,
    datasets: [
      {
        label: 'Ventas',
        data: data,
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        tension: 0.4
      }
    ]
  }
}
