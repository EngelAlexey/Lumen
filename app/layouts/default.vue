<template>
  <div class="flex min-h-screen bg-neutral-50 dark:bg-neutral-900 font-sans">
    <!-- Sidebar Navigation -->
    <DashboardSidebar 
      :user-profile="userProfile"
      :user="user"
      :user-role="userRole"
      @logout="handleLogout"
    />
    
    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col md:ml-[280px] transition-all duration-300">
      <!-- Header -->
      <header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center shadow-sm">
        <div class="flex items-center gap-4">
          <ClientOnly>
             <h2 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{{ pageTitle }}</h2>
             <template #fallback>
                 <div class="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
             </template>
          </ClientOnly>
        </div>
        <div class="flex items-center gap-6">
          <ClientOnly>
            <UPopover :popper="{ placement: 'bottom-end' }">
              <UButton icon="i-heroicons-bell" color="neutral" variant="ghost" size="lg" class="relative hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <UBadge v-if="unreadCount > 0" color="error" size="xs" :label="String(unreadCount)" class="absolute -top-1 -right-1 ring-2 ring-white dark:ring-gray-900" />
              </UButton>

              <!-- @vue-ignore -->
              <template #panel>
                <div class="w-96 max-h-[500px] flex flex-col bg-white dark:bg-gray-900 shadow-xl rounded-xl border border-gray-200 dark:border-gray-800">
                  <!-- Header -->
                  <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 class="font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
                    <UButton
                      v-if="unreadCount > 0"
                      size="xs"
                      variant="ghost"
                      color="primary"
                      @click="markAllAsRead()"
                    >
                      Marcar todas como leídas
                    </UButton>
                  </div>

                  <div class="flex-1 overflow-y-auto">
                    <div v-if="notifications.length === 0" class="p-10 text-center text-gray-500">
                      <UIcon name="i-heroicons-bell-slash" class="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-400" />
                      <p class="text-sm">No hay notificaciones</p>
                    </div>

                    <button
                      v-for="notif in notifications"
                      :key="notif.id"
                      class="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors last:border-0"
                      :class="{ 'bg-primary-50/40 dark:bg-primary-950/10': !notif.read }"
                      @click="markAsRead(notif.id)"
                    >
                      <div class="flex gap-3">
                        <div class="flex-shrink-0 mt-1">
                          <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-sm" :class="{
                            'bg-green-100 dark:bg-green-900/30 text-green-600': notif.type === 'transaction_paid',
                            'bg-blue-100 dark:bg-blue-900/30 text-blue-600': notif.type === 'transaction_created',
                            'bg-orange-100 dark:bg-orange-900/30 text-orange-600': notif.type === 'user_action'
                          }">
                            <UIcon
                              :name="notif.type === 'transaction_paid' ? 'i-heroicons-check-circle' : notif.type === 'transaction_created' ? 'i-heroicons-shopping-cart' : 'i-heroicons-user'"
                              class="w-4 h-4"
                            />
                          </div>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">{{ notif.title }}</p>
                          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-snug">{{ notif.message }}</p>
                          <p class="text-xs text-gray-400 mt-1.5 font-medium">{{ formatNotificationTime(notif.created_at) }}</p>
                        </div>
                        <div v-if="!notif.read" class="flex-shrink-0 mt-2">
                          <div class="w-2 h-2 rounded-full bg-primary-500 ring-2 ring-primary-200 dark:ring-primary-900"></div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </template>
            </UPopover>
            <template #fallback>
               <UButton icon="i-heroicons-bell" color="neutral" variant="ghost" size="lg" disabled class="opacity-50" />
            </template>
          </ClientOnly>

          <div class="hidden sm:flex items-center gap-6 border-l border-gray-200 dark:border-gray-800 pl-6 h-8">
            <ClientOnly>
              <span class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                <CalendarIcon class="w-4 h-4" />
                <span class="capitalize">{{ currentDate }}</span>
              </span>
              <span class="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white tabular-nums tracking-tight">
                <ClockIcon class="w-5 h-5 text-primary-500" />
                {{ currentTime }}
              </span>
            </ClientOnly>
          </div>
        </div>
      </header>
      
      <!-- Page Content -->
      <main class="flex-1 p-4 md:p-6 overflow-y-auto w-full max-w-[1600px] mx-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const route = useRoute()
const { getRoleLabel, fetchCurrentRole, currentRole, isLoading: isLoadingRole } = useRoles()
const { navigation, labels, loadBusinessType, businessType, config } = useBusinessConfig()
const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

const userProfile = computed(() => userStore.profile)

const userRole = computed(() => {
  if (currentRole.value) return getRoleLabel(currentRole.value)
  if (isLoadingRole.value) return 'Cargando...'
  return 'Sin Rol'
})

let dateTimeInterval: NodeJS.Timeout | null = null

const userStore = useUserStore()
    
onMounted(() => {
    userStore.initialize()
})

const pageTitle = computed(() => {
  const path = route.path
  
  const navItem = navigation.value.find((item: { to: string }) => 
    path === item.to || (item.to !== '/' && path.startsWith(item.to + '/'))
  )
  if (navItem) return navItem.label
  
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/transactions/new': labels.value.newTransaction,
    '/transactions': labels.value.transactions,
    '/cash-register': 'Caja',
    '/products': labels.value.products,
    '/users': 'Gestión de Usuarios',
    '/reports': 'Reportes',
    '/settings': 'Configuración',
    '/customers': 'Clientes'
  }
  return titles[path] || 'Lumen'
})

const currentDate = ref('')
const currentTime = ref('')

const updateDateTime = () => {
  const now = new Date()
  currentDate.value = now.toLocaleDateString('es-CR', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  })
  currentTime.value = now.toLocaleTimeString('es-CR', { 
    hour: '2-digit', 
    minute: '2-digit'
  })
}

onUnmounted(() => {
  if (dateTimeInterval) {
    clearInterval(dateTimeInterval)
    dateTimeInterval = null
  }
})

onMounted(async () => {
  updateDateTime()
  await loadBusinessType()
})

const formatNotificationTime = (timestamp: string) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffMs = now.getTime() - time.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins}m`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  return time.toLocaleDateString('es-CR')
}

const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>
