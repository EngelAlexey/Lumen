<template>
  <UApp>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <NuxtLayout>
        <NuxtPage :page-key="route => route.fullPath" />
      </NuxtLayout>
      <UNotifications />
    </div>
  </UApp>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const user = useSupabaseUser()
const client = useSupabaseClient()

watch(user, (currentUser) => {
  if (!currentUser && route.path !== '/login' && route.path !== '/register') {
    router.push('/login')
  }
})

onMounted(() => {

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {      
      const { data, error } = await client.auth.getSession()
      
      if (error || !data.session) {
        window.location.href = '/login'
      }
    }
  })

  client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      router.push('/login')
    }
    if (event === 'TOKEN_REFRESHED') {
    }
  })
})
</script>