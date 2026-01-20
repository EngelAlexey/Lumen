<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { subDays, format } from 'date-fns'
import { useI18n } from 'vue-i18n'
import SalesChart from '~/components/reports/SalesChart.vue'
import DonutChart from '~/components/reports/DonutChart.vue'
import ProductPerformance from '~/components/reports/ProductPerformance.vue'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

definePageMeta({
  layout: 'default'
})

const { t } = useI18n()
const toast = useToast()

// State
// Default to last 30 days
const startDate = ref(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
const endDate = ref(format(new Date(), 'yyyy-MM-dd'))
const groupBy = ref('day')

// Data Fetching
const { data: salesData, status: salesStatus } = await useFetch('/api/reports/sales', {
  query: {
    startDate,
    endDate,
    groupBy
  },
  watch: [startDate, endDate, groupBy]
})

const { data: productsData, status: productsStatus } = await useFetch('/api/reports/top-products', {
  query: {
    startDate,
    endDate,
    limit: 5
  },
  watch: [startDate, endDate]
})

const { data: categoryData, status: categoryStatus } = await useFetch('/api/reports/by-category', {
  query: { startDate, endDate },
  watch: [startDate, endDate]
})

const { data: paymentData, status: paymentStatus } = await useFetch(
  '/api/reports/payment-methods',
  {
    query: { startDate, endDate },
    watch: [startDate, endDate]
  }
)

const salesLoading = computed(() => salesStatus.value === 'pending')
const productsLoading = computed(() => productsStatus.value === 'pending')
const categoryLoading = computed(() => categoryStatus.value === 'pending')
const paymentLoading = computed(() => paymentStatus.value === 'pending')

// Format Currency
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(val)
}

const exportOptions = [
  { label: 'CSV', value: 'CSV' },
  { label: 'Excel', value: 'Excel' },
  { label: 'PDF', value: 'PDF' }
]

const exportFormat = ref('')

watch(exportFormat, newVal => {
  if (newVal) {
    handleExport(newVal)
    // Reset immediately to allow re-selection of same option
    setTimeout(() => {
      exportFormat.value = ''
    }, 100)
  }
})

const handleExport = (formatType: string) => {
  try {
    if (formatType === 'CSV') exportCSV()
    if (formatType === 'Excel') exportExcel()
    if (formatType === 'PDF') exportPDF()
  } catch (error) {
    console.error('Export Error:', error)
    toast.add({
      title: t('common.error', 'Error'),
      description: t('reports.export_error', 'Ocurrió un error al exportar el reporte'),
      color: 'error'
    })
  }
}

const getExportData = () => {
  // Flatten data for export
  // Date | Sales | Orders | Avg Order
  // Products...
  // Allow simple export of daily sales first
  const chartData = salesData.value?.chartData
  if (!chartData?.labels || !chartData.datasets || !chartData.datasets[0]?.data) return []

  const values = chartData.datasets[0].data

  return chartData.labels.map((label: string, index: number) => {
    const value = values[index]
    return {
      Fecha: label,
      Ventas: typeof value === 'number' ? value : 0
    }
  })
}

const exportCSV = () => {
  const data = getExportData()
  if (!data.length) {
    toast.add({
      title: t('common.error', 'Error'),
      description: t('reports.no_data_export', 'No hay datos para exportar'),
      color: 'error'
    })
    return
  }

  const ws = XLSX.utils.json_to_sheet(data)
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `reporte_ventas_${startDate.value}_${endDate.value}.csv`
  link.click()

  toast.add({
    title: t('common.success', 'Éxito'),
    description: t('reports.export_success', 'Reporte CSV exportado correctamente'),
    color: 'success'
  })
}

const exportExcel = () => {
  const data = getExportData()
  if (!data.length) {
    toast.add({
      title: t('common.error', 'Error'),
      description: t('reports.no_data_export', 'No hay datos para exportar'),
      color: 'error'
    })
    return
  }

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Ventas')
  XLSX.writeFile(wb, `reporte_ventas_${startDate.value}_${endDate.value}.xlsx`)

  toast.add({
    title: t('common.success', 'Éxito'),
    description: t('reports.export_success', 'Reporte Excel exportado correctamente'),
    color: 'success'
  })
}

const exportPDF = () => {
  try {
    const doc = new jsPDF()
    const primaryColor = [63, 81, 181] as [number, number, number] // Indigo-like
    const secondaryColor = [100, 116, 139] as [number, number, number] // Slate-500

    // Helper for currency without symbol (to avoid encoding issues in standard fonts)
    const formatMoney = (val: number) => {
      return new Intl.NumberFormat('es-CR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val)
    }

    // --- Header ---
    doc.setFontSize(20)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('Lumen', 14, 20) // Brand Name

    doc.setFontSize(10)
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 26)

    // Title Area
    doc.setFillColor(248, 250, 252)
    doc.rect(14, 35, 182, 25, 'F')

    doc.setFontSize(14)
    doc.setTextColor(30, 41, 59)
    doc.text(`Reporte de Ventas`, 20, 45)

    doc.setFontSize(10)
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.text(`Período: ${startDate.value} al ${endDate.value}`, 20, 52)

    // --- Summary Section ---
    const summaryY = 70
    const cardWidth = 55

    // Sales
    doc.setFontSize(10)
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.text('Ventas Totales', 14, summaryY)
    doc.setFontSize(16)
    doc.setTextColor(30, 41, 59)
    doc.text(`CRC ${formatMoney(salesData.value?.summary?.totalSales || 0)}`, 14, summaryY + 8)

    // Orders
    doc.setFontSize(10)
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.text('Pedidos Totales', 14 + cardWidth, summaryY)
    doc.setFontSize(16)
    doc.setTextColor(30, 41, 59)
    doc.text(`${salesData.value?.summary?.totalCount || 0}`, 14 + cardWidth, summaryY + 8)

    // Avg Ticket
    doc.setFontSize(10)
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.text('Ticket Promedio', 14 + cardWidth * 2, summaryY)
    doc.setFontSize(16)
    doc.setTextColor(30, 41, 59)
    doc.text(
      `CRC ${formatMoney(salesData.value?.summary?.averageOrderValue || 0)}`,
      14 + cardWidth * 2,
      summaryY + 8
    )

    // --- Table ---
    const tableData = getExportData().map(row => [row.Fecha, formatMoney(row.Ventas || 0)])

    autoTable(doc, {
      startY: 90,
      head: [['Fecha', 'Ventas (CRC)']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'right', fontStyle: 'bold' }
      },
      foot: [['Total', formatMoney(salesData.value?.summary?.totalSales || 0)]],
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: 30,
        fontStyle: 'bold',
        halign: 'right'
      },
      didDrawPage: data => {
        // Footer
        doc.setFontSize(8)
        doc.setTextColor(150)
        const pageStr = 'Página ' + doc.getNumberOfPages()
        doc.text(pageStr, data.settings.margin.left, doc.internal.pageSize.height - 10)
      }
    })

    doc.save(`reporte_ventas_${startDate.value}_${endDate.value}.pdf`)

    toast.add({
      title: t('common.success', 'Éxito'),
      description: t('reports.export_success', 'Reporte PDF exportado correctamente'),
      color: 'success'
    })
  } catch (error) {
    console.error('Export Error:', error)
    toast.add({
      title: t('common.error', 'Error'),
      description: t('reports.export_error', 'Ocurrió un error al exportar el reporte'),
      color: 'error'
    })
  }
}

const groupOptions = computed(() => [
  { label: t('common.daily', 'Diario'), value: 'day' },
  { label: t('common.weekly', 'Semanal'), value: 'week' },
  { label: t('common.monthly', 'Mensual'), value: 'month' }
])

const selectedParams = computed(() => {
  return groupOptions.value.find(o => o.value === groupBy.value)
})
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm"
    >
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-heroicons-presentation-chart-line" class="w-8 h-8 text-primary-500" />
          {{ t('reports.title', 'Reportes') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t('reports.subtitle', 'Resumen de ventas y rendimiento') }}
        </p>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <UInput
          v-model="startDate"
          type="date"
          icon="i-heroicons-calendar"
          class="w-full sm:w-auto"
        />
        <span class="text-gray-400 hidden sm:inline">→</span>
        <UInput
          v-model="endDate"
          type="date"
          icon="i-heroicons-calendar"
          class="w-full sm:w-auto"
        />

        <USelectMenu v-model="groupBy" :items="groupOptions" value-key="value" label-key="label">
          <UButton icon="i-heroicons-funnel" color="neutral">
            {{ selectedParams?.label }}
          </UButton>
        </USelectMenu>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard>
        <div class="flex flex-col">
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">{{
            t('reports.total_sales', 'Ventas Totales')
          }}</span>
          <span class="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {{ salesLoading ? '...' : formatCurrency(salesData?.summary?.totalSales || 0) }}
          </span>
        </div>
      </UCard>

      <UCard>
        <div class="flex flex-col">
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">{{
            t('reports.total_orders', 'Pedidos Totales')
          }}</span>
          <span class="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {{ salesLoading ? '...' : salesData?.summary?.totalCount || 0 }}
          </span>
        </div>
      </UCard>

      <UCard>
        <div class="flex flex-col">
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">{{
            t('reports.avg_order', 'Ticket Promedio')
          }}</span>
          <span class="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {{ salesLoading ? '...' : formatCurrency(salesData?.summary?.averageOrderValue || 0) }}
          </span>
        </div>
      </UCard>
    </div>

    <!-- Main Content -->
    <div class="space-y-6">
      <!-- Sales Chart -->
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('reports.sales_trend', 'Tendencia de Ventas') }}
            </h3>
            <div class="flex gap-2">
              <UPopover mode="click" :content="{ align: 'end', side: 'bottom' }">
                <UButton icon="i-heroicons-arrow-down-tray" color="neutral" size="xs">
                  {{ t('reports.export', 'Exportar') }}
                  <UIcon name="i-heroicons-chevron-down-20-solid" class="w-4 h-4 ml-1" />
                </UButton>

                <template #content>
                  <div class="p-1 flex flex-col min-w-[120px]">
                    <UButton
                      v-for="opt in exportOptions"
                      :key="opt.value"
                      variant="ghost"
                      color="neutral"
                      class="justify-start"
                      @click="handleExport(opt.value)"
                    >
                      {{ opt.label }}
                    </UButton>
                  </div>
                </template>
              </UPopover>
            </div>
          </div>
        </template>

        <div v-if="salesLoading" class="h-[300px] flex items-center justify-center">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
        </div>
        <ClientOnly v-else-if="salesData?.chartData">
          <SalesChart :data="salesData.chartData" />
          <template #fallback>
            <div class="h-[300px] flex items-center justify-center text-gray-400">
              Cargando gráfico...
            </div>
          </template>
        </ClientOnly>
        <div v-else class="h-[300px] flex items-center justify-center text-gray-500">
          {{ t('reports.no_data', 'No hay datos') }}
        </div>
      </UCard>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Sales by Category -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('reports.sales_by_category', 'Ventas por Categoría') }}
            </h3>
          </template>
          <div v-if="categoryLoading" class="h-[250px] flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
          </div>
          <ClientOnly v-else-if="categoryData?.datasets?.length">
            <DonutChart :data="categoryData" />
          </ClientOnly>
          <div v-else class="h-[250px] flex items-center justify-center text-gray-500">
            {{ t('reports.no_data', 'No hay datos') }}
          </div>
        </UCard>

        <!-- Sales by Payment Method -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('reports.sales_by_payment', 'Métodos de Pago') }}
            </h3>
          </template>
          <div v-if="paymentLoading" class="h-[250px] flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
          </div>
          <ClientOnly v-else-if="paymentData?.datasets?.length">
            <DonutChart :data="paymentData" />
          </ClientOnly>
          <div v-else class="h-[250px] flex items-center justify-center text-gray-500">
            {{ t('reports.no_data', 'No hay datos') }}
          </div>
        </UCard>

        <!-- Top Products -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('reports.top_products', 'Productos Más Vendidos') }}
            </h3>
          </template>
          <ProductPerformance :products="productsData || []" :loading="productsLoading" />
        </UCard>
      </div>
    </div>
  </div>
</template>
