<script setup lang="ts">
const user = useSupabaseUser()
const router = useRouter()

definePageMeta({
  layout: 'auth'
})

onMounted(() => {
  if (user.value) {
    router.push('/dashboard')
  }
})
</script>

<template>
  <div class="flex-1 w-full flex flex-col">
    <!-- Hero -->
    <div class="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <div class="max-w-4xl space-y-8">
        <h1 class="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {{ $t('landing.hero.title_prefix') }} <span class="text-primary-600">{{ $t('landing.hero.title_highlight') }}</span>
        </h1>
        <p class="text-xl text-gray-500 max-w-2xl mx-auto">
          {{ $t('landing.hero.subtitle') }}
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <UButton to="/pricing" size="xl" icon="i-heroicons-rocket-launch">
            {{ $t('landing.hero.cta_primary') }}
          </UButton>
          <UButton to="/login" variant="outline" size="xl" icon="i-heroicons-arrow-right-end-on-rectangle">
            {{ $t('landing.hero.cta_secondary') }}
          </UButton>
        </div>
      </div>

      <!-- Features Preview -->
      <div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
        <UCard>
          <template #header>
            <UIcon name="i-heroicons-banknotes" class="w-8 h-8 text-primary-500 mb-2" />
            <h3 class="text-xl font-bold">{{ $t('landing.features.pos_title') }}</h3>
          </template>
          {{ $t('landing.features.pos_desc') }}
        </UCard>
        
        <UCard>
          <template #header>
            <UIcon name="i-heroicons-chart-bar-square" class="w-8 h-8 text-primary-500 mb-2" />
            <h3 class="text-xl font-bold">{{ $t('landing.features.reports_title') }}</h3>
          </template>
          {{ $t('landing.features.reports_desc') }}
        </UCard>
        
        <UCard>
          <template #header>
            <UIcon name="i-heroicons-users" class="w-8 h-8 text-primary-500 mb-2" />
            <h3 class="text-xl font-bold">{{ $t('landing.features.team_title') }}</h3>
          </template>
          {{ $t('landing.features.team_desc') }}
        </UCard>
      </div>
    </div>
    
    <!-- Footer -->
    <footer class="border-t border-gray-200 dark:border-gray-800 py-8 text-center text-gray-500 text-sm">
      {{ $t('landing.footer', { year: new Date().getFullYear() }) }}
    </footer>
  </div>
</template>
