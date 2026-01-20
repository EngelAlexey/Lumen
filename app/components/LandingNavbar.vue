<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <nav
    class="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-50"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div
          class="flex-shrink-0 flex items-center gap-2 cursor-pointer"
          @click="navigateTo(localePath('/'))"
        >
          <div class="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <UIcon name="i-heroicons-bolt" class="w-5 h-5 text-white" />
          </div>
          <span class="font-bold text-xl tracking-tight">Lumen</span>
        </div>

        <!-- Desktop Navigation -->
        <div class="flex items-center gap-4">
          <UButton :to="localePath('/login')" variant="ghost" color="neutral">
            {{ t('landing.nav.login') }}
          </UButton>
          <UButton :to="localePath('/pricing')" color="primary">
            {{ t('landing.nav.start') }}
          </UButton>
        </div>
      </div>
    </div>
  </nav>
</template>
