<script setup lang="ts">
defineProps<{
  title: string
  icon?: string
  subtitle?: string
}>()
</script>

<template>
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
    <div>
      <h1 v-if="icon" class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <UIcon :name="icon" class="w-8 h-8 text-primary-500" />
        {{ title }}
      </h1>
      <h1 v-else class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="text-gray-500 dark:text-gray-400 mt-1">
        {{ subtitle }}
      </p>
    </div>
    
    <div class="flex gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
