<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import { computed } from 'vue'

// Registration moved to plugins/chartjs.ts

defineProps<{
  data: {
    labels: string[]
    datasets: any[]
  }
}>()

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        usePointStyle: true,
        boxWidth: 8
      }
    }
  }
}))
</script>

<template>
  <div class="w-full h-[250px]">
    <Doughnut :data="data" :options="chartOptions" />
  </div>
</template>
