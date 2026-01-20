<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  products: {
    name: string
    quantity: number
    revenue: number
  }[]
  loading?: boolean
}>()

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(amount)
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm text-left">
      <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
        <tr>
          <th scope="col" class="px-6 py-3">
            {{ t('reports.product', 'Producto') }}
          </th>
          <th scope="col" class="px-6 py-3 text-right">
            {{ t('reports.quantity', 'Cantidad') }}
          </th>
          <th scope="col" class="px-6 py-3 text-right">
            {{ t('reports.revenue', 'Ingresos') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="3" class="px-6 py-4 text-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin h-5 w-5 mx-auto" />
          </td>
        </tr>
        <tr
          v-for="(product, index) in products"
          v-else-if="products.length > 0"
          :key="index"
          class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
            {{ product.name }}
          </td>
          <td class="px-6 py-4 text-right">
            {{ product.quantity }}
          </td>
          <td class="px-6 py-4 text-right">
            {{ formatCurrency(product.revenue) }}
          </td>
        </tr>
        <tr v-else>
          <td colspan="3" class="px-6 py-4 text-center text-gray-500">
            {{ t('reports.no_data', 'No hay datos disponibles') }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
