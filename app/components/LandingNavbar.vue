<template>
  <nav class="border-b border-gray-200 dark:border-gray-800 py-4 bg-white dark:bg-gray-950">
    <div class="max-w-7xl mx-auto px-4 flex justify-between items-center">
      <div class="flex items-center gap-2 cursor-pointer" @click="navigateTo('/')">
        <UIcon name="i-heroicons-light-bulb" class="w-8 h-8 text-primary-600" />
        <span class="text-xl font-bold text-gray-900 dark:text-white">Lumen</span>
      </div>
      <div class="flex gap-4">
        <UButton to="/login" variant="ghost" color="neutral">{{ $t('landing.nav.login') }}</UButton>
        <UButton to="/pricing" color="primary">{{ $t('landing.nav.start') }}</UButton>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
</script>
