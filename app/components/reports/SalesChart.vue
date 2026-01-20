<script setup lang="ts">
import { Line, Bar } from 'vue-chartjs'
import { computed } from 'vue'

// Registration moved to plugins/chartjs.ts

const props = defineProps<{
  data: {
    labels: string[]
    datasets: any[]
  }
  type?: 'line' | 'bar'
}>()

const chartData = computed(() => {
  const dataset = props.data.datasets[0]
  return {
    ...props.data,
    datasets: [
      {
        ...dataset,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx
          const gradient = ctx.createLinearGradient(0, 0, 0, 400)
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.5)') // Emerald 500
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)')
          return gradient
        },
        borderColor: '#10B981',
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#10B981',
        fill: true
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      titleColor: '#1f2937',
      bodyColor: '#1f2937',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      padding: 10,
      displayColors: false,
      callbacks: {
        label: function (context: any) {
          let label = context.dataset.label || ''
          if (label) {
            label += ': '
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(
              context.parsed.y
            )
          }
          return label
        }
      }
    }
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(156, 163, 175, 0.1)'
      },
      ticks: {
        callback: function (value: any) {
          return new Intl.NumberFormat('es-CR', {
            notation: 'compact',
            compactDisplay: 'short'
          }).format(value)
        }
      }
    },
    x: {
      grid: {
        display: false
      }
    }
  }
}))
</script>

<template>
  <div class="w-full h-[300px] sm:h-[400px]">
    <Line v-if="!type || type === 'line'" :data="chartData" :options="chartOptions" />
    <Bar v-else :data="chartData" :options="chartOptions" />
  </div>
</template>
