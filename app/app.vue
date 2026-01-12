<template>
  <UApp>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <NuxtLayout>
        <NuxtPage :page-key="route => route.fullPath" />
      </NuxtLayout>
    </div>
  </UApp>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const user = useSupabaseUser()
const client = useSupabaseClient()

const publicRoutes = [
  '/', 
  '/login', 
  '/register', 
  '/pricing', 
  '/forgot-password', 
  '/update-password'
]

const isPublicRoute = (path: string) => {
  return publicRoutes.some(p => path === p || path.startsWith(p + '/'))
}

watch(user, (currentUser) => {
  if (!currentUser && !isPublicRoute(route.path)) {
    router.push('/login')
  }
})

const { initSessionKeeper } = useAuth()

onMounted(() => {
  initSessionKeeper()

  client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT' && !isPublicRoute(route.path)) {
      router.push('/login')
    }
  })
})
</script>