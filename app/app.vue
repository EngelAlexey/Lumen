<template>
  <UApp>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <NuxtLayout>
        <NuxtPage :page-key="route => route.fullPath" />
      </NuxtLayout>
    </div>
  </UApp>
</template>

<script setup>
const route = useRoute()
const supabase = useSupabaseClient()
const router = useRouter()

onMounted(() => {
  console.log('Lumen Platform Initialized')

  const user = useSupabaseUser()

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      console.log('App woke up, checking session...')
      
      if (!user.value) {
        console.log('Sesión muerta, forzando recarga...')
        window.location.href = '/login'
      }
    }
  })

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      router.push('/login')
    }
  })
})
</script>