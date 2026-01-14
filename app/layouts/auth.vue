<template>
  <div class="min-h-screen bg-white dark:bg-gray-950 flex flex-col text-gray-900 dark:text-gray-100">
    
    <LandingNavbar />

    <main class="flex-1 flex flex-col relative">
      <slot />
    </main>

  </div>
</template>

<script setup lang="ts">
const router = useRouter()
</script>
