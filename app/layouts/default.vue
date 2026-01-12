<template>
  <div class="app-layout">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="logo">
          <UIcon name="i-heroicons-light-bulb" class="logo-icon w-8 h-8" />
          Lumen
        </h1>
        <p class="tagline">{{ config.name }}</p>
      </div>
      
      <nav class="nav-menu">
        <ClientOnly>
          <NuxtLink 
            v-for="item in navigation" 
            :key="item.to" 
            :to="item.to" 
            class="nav-item"
          >
            <UIcon :name="item.icon" class="nav-icon w-5 h-5" />
            <span>{{ item.label }}</span>
          </NuxtLink>
           <template #fallback>
             <!-- Skeleton Loader for Nav -->
            <div v-for="i in 5" :key="i" class="nav-item opacity-50">
              <div class="w-5 h-5 bg-gray-700 rounded-sm"></div>
              <div class="h-4 w-24 bg-gray-700 rounded-sm"></div>
            </div>
          </template>
        </ClientOnly>
      </nav>
      
      <div class="sidebar-footer">
        <ClientOnly>
          <div class="user-info">
            <div class="user-avatar">
              <UserCircleIcon class="avatar-icon" />
            </div>
            <div class="user-details">
              <p class="user-name">{{ userName }}</p>
              <p class="user-role">{{ userRole }}</p>
            </div>
          </div>
          <template #fallback>
            <div class="user-info opacity-50">
               <div class="user-avatar bg-gray-700"></div>
               <div class="user-details">
                   <p class="user-name text-xs">Cargando...</p>
               </div>
            </div>
          </template>
        </ClientOnly>
        <button @click="handleLogout" class="btn-logout">
          <ArrowRightOnRectangleIcon class="logout-icon" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
    
    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Header -->
      <header class="app-header">
        <div class="header-left">
          <ClientOnly>
             <h2 class="page-title">{{ pageTitle }}</h2>
             <template #fallback>
                 <div class="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
             </template>
          </ClientOnly>
        </div>
        <div class="header-right">
          <!-- Notifications -->
          <ClientOnly>
            <UPopover :popper="{ placement: 'bottom-end' }">
              <UButton icon="i-heroicons-bell" color="neutral" variant="ghost" size="lg">
                <UBadge v-if="unreadCount > 0" color="error" size="xs" :label="String(unreadCount)" class="absolute -top-1 -right-1" />
              </UButton>

              <!-- @vue-ignore -->
              <template #panel>
                <div class="w-96 max-h-[500px] flex flex-col">
                  <!-- Header -->
                  <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
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

                  <!-- Notifications List -->
                  <div class="flex-1 overflow-y-auto">
                    <div v-if="notifications.length === 0" class="p-8 text-center text-gray-500">
                      <UIcon name="i-heroicons-bell-slash" class="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p class="text-sm">No hay notificaciones</p>
                    </div>

                    <button
                      v-for="notif in notifications"
                      :key="notif.id"
                      class="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 transition-colors"
                      :class="{ 'bg-primary-50 dark:bg-primary-950/20': !notif.read }"
                      @click="markAsRead(notif.id)"
                    >
                      <div class="flex gap-3">
                        <div class="flex-shrink-0">
                          <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="{
                            'bg-green-100 dark:bg-green-900/30': notif.type === 'transaction_paid',
                            'bg-blue-100 dark:bg-blue-900/30': notif.type === 'transaction_created',
                            'bg-gray-100 dark:bg-gray-700': notif.type === 'user_action'
                          }">
                            <UIcon
                              :name="notif.type === 'transaction_paid' ? 'i-heroicons-check-circle' : notif.type === 'transaction_created' ? 'i-heroicons-shopping-cart' : 'i-heroicons-user'"
                              class="w-5 h-5"
                              :class="{
                                'text-green-600': notif.type === 'transaction_paid',
                                'text-blue-600': notif.type === 'transaction_created',
                                'text-gray-600': notif.type === 'user_action'
                              }"
                            />
                          </div>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="font-medium text-sm text-gray-900 dark:text-white">{{ notif.title }}</p>
                          <p class="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{{ notif.message }}</p>
                          <p class="text-xs text-gray-400 mt-1">{{ formatNotificationTime(notif.created_at) }}</p>
                        </div>
                        <div v-if="!notif.read" class="flex-shrink-0">
                          <div class="w-2 h-2 rounded-full bg-primary-500"></div>
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

          <div class="header-info">
            <ClientOnly>
              <span class="date">
                <CalendarIcon class="header-icon" />
                {{ currentDate }}
              </span>
              <span class="time">
                <ClockIcon class="header-icon" />
                {{ currentTime }}
              </span>
            </ClientOnly>
          </div>
        </div>
      </header>
      
      <!-- Page Content -->
      <main class="page-content">
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

// User profile data
interface UserProfile {
  full_name: string
  email: string
}
const userProfile = ref<UserProfile | null>(null)

// User Info
const userInitials = computed(() => {
  if (userProfile.value?.full_name) {
    const names = userProfile.value.full_name.split(' ')
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      const firstInitial = names[0]?.[0] || ''
      const lastInitial = names[names.length - 1]?.[0] || ''
      return (firstInitial + lastInitial).toUpperCase()
    }
    return names[0]?.substring(0, 2).toUpperCase() || 'US'
  }
  const email = user.value?.email || ''
  return email.substring(0, 2).toUpperCase() || 'US'
})

const userName = computed(() => {
  return userProfile.value?.full_name || user.value?.email?.split('@')[0] || 'Usuario'
})

const userRole = computed(() => {
  if (currentRole.value) return getRoleLabel(currentRole.value)
  if (isLoadingRole.value) return 'Cargando...'
  return 'Sin Rol'
})

// Interval cleanup
let dateTimeInterval: NodeJS.Timeout | null = null

// Setup auth state change listener
onMounted(() => {
  updateDateTime()
  dateTimeInterval = setInterval(updateDateTime, 60000) // Update every minute
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[Layout] Auth state changed:', event, 'Session:', !!session)
    
    if (session?.user?.id) {
      const userId = session.user.id
      console.log('[Layout] Fetching profile for user ID:', userId)
      
      // Fetch role - pass userId explicitly
      await fetchCurrentRole(userId)
      
      // Fetch user profile
      const { data, error } = await supabase
       .from('users')
        .select('full_name, email')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('[Layout] Error fetching profile:', error)
      }
      
      if (data) {
        console.log('[Layout] Profile loaded:', data)
        userProfile.value = data
      }
    } else {
      console.log('[Layout] No session or user ID')
      userProfile.value = null
    }
  })
})

// Page Title - Adapted based on business config
const pageTitle = computed(() => {
  const path = route.path
  
  // Find matching nav item for dynamic label
  const navItem = navigation.value.find((item: { to: string }) => 
    path === item.to || path.startsWith(item.to + '/')
  )
  if (navItem) return navItem.label
  
  // Fallback static titles
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

// Current Date & Time
const currentDate = ref('')
const currentTime = ref('')

const updateDateTime = () => {
  const now = new Date()
  currentDate.value = now.toLocaleDateString('es-CR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  currentTime.value = now.toLocaleTimeString('es-CR', { 
    hour: '2-digit', 
    minute: '2-digit'
  })
}

// Cleanup intervals
onUnmounted(() => {
  if (dateTimeInterval) {
    clearInterval(dateTimeInterval)
    dateTimeInterval = null
  }
})

onMounted(async () => {
  updateDateTime()
  
  // Load business type for dynamic menu
  await loadBusinessType()
})

// Format notification time
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

// Logout
const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
}

/* ============================================
   Sidebar Styles
   ============================================ */
.sidebar {
  width: 280px;
  background: linear-gradient(180deg, var(--color-primary-900), var(--color-primary-800));
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
  position: fixed;
  height: 100vh;
  z-index: 100;
}

.sidebar-header {
  padding: var(--space-8) var(--space-6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0;
  color: white;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.logo-icon {
  width: 2rem;
  height: 2rem;
  color: var(--color-primary-300);
}

.tagline {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin: var(--space-2) 0 0;
  font-weight: 500;
}

.nav-menu {
  flex: 1;
  padding: var(--space-6) var(--space-4);
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-2);
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  font-weight: 500;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateX(4px);
}

.nav-item.router-link-active {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-weight: 600;
}

.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.sidebar-footer {
  padding: var(--space-6);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: var(--color-primary-500);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.avatar-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: white;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 0.938rem;
  font-weight: 600;
  margin: 0;
  color: white;
  text-transform: capitalize;
}

.user-role {
  font-size: 0.813rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.btn-logout {
  width: 100%;
  padding: var(--space-3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.logout-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* ============================================
   Main Content Styles
   ============================================ */
.main-content {
  flex: 1;
  margin-left: 280px;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-color);
  padding: var(--space-6) var(--space-8);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-sm);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.header-info {
  display: flex;
  gap: var(--space-6);
  align-items: center;
}

.header-icon {
  width: 1rem;
  height: 1rem;
  margin-right: var(--space-1);
  vertical-align: middle;
}

.date {
  font-size: 0.938rem;
  color: var(--text-secondary);
  text-transform: capitalize;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.time {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.page-content {
  flex: 1;
  padding: var(--space-8);
  overflow-y: auto;
}

/* ============================================
   Responsive Design
   ============================================ */
@media (max-width: 768px) {
  .sidebar {
    width: 240px;
  }
  
  .main-content {
    margin-left: 240px;
  }
  
  .app-header {
    padding: var(--space-4) var(--space-6);
  }
  
  .page-title {
    font-size: 1.25rem;
  }
  
  .page-content {
    padding: var(--space-6);
  }
}
</style>
