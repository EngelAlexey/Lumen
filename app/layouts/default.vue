<template>
  <div class="app-layout">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="logo">
          <LightBulbIcon class="logo-icon" />
          Lumen
        </h1>
        <p class="tagline">Control Financiero</p>
      </div>
      
      <nav class="nav-menu">
        <NuxtLink to="/dashboard" class="nav-item">
          <ChartBarIcon class="nav-icon" />
          <span>Dashboard</span>
        </NuxtLink>
        
        <NuxtLink to="/transactions" class="nav-item">
          <CreditCardIcon class="nav-icon" />
          <span>Transacciones</span>
        </NuxtLink>
        
        <NuxtLink to="/cash-register" class="nav-item">
          <BanknotesIcon class="nav-icon" />
          <span>Caja</span>
        </NuxtLink>
        
        <NuxtLink to="/products" class="nav-item">
          <CubeIcon class="nav-icon" />
          <span>Productos</span>
        </NuxtLink>
        
        <NuxtLink to="/users" class="nav-item" v-if="isAdmin">
          <UsersIcon class="nav-icon" />
          <span>Usuarios</span>
        </NuxtLink>
        
        <NuxtLink to="/reports" class="nav-item">
          <ChartPieIcon class="nav-icon" />
          <span>Reportes</span>
        </NuxtLink>
        
        <NuxtLink to="/settings" class="nav-item">
          <Cog6ToothIcon class="nav-icon" />
          <span>Configuración</span>
        </NuxtLink>
      </nav>
      
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            <UserCircleIcon class="avatar-icon" />
          </div>
          <div class="user-details">
            <p class="user-name">{{ userName }}</p>
            <p class="user-role">{{ userRole }}</p>
          </div>
        </div>
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
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>
        <div class="header-right">
          <div class="header-info">
            <span class="date">
              <CalendarIcon class="header-icon" />
              {{ currentDate }}
            </span>
            <span class="time">
              <ClockIcon class="header-icon" />
              {{ currentTime }}
            </span>
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

<script setup>
import {
  LightBulbIcon,
  ChartBarIcon,
  CreditCardIcon,
  BanknotesIcon,
  CubeIcon,
  UsersIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const route = useRoute()
const { currentRole, isAdmin, fetchCurrentRole, getRoleLabel, isLoading } = useRoles()

// User profile data
const userProfile = ref(null)

// User Info
const userInitials = computed(() => {
  if (userProfile.value?.full_name) {
    const names = userProfile.value.full_name.split(' ')
    return names.length > 1 
      ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
      : names[0].substring(0, 2).toUpperCase()
  }
  const email = user.value?.email || ''
  return email.substring(0, 2).toUpperCase()
})

const userName = computed(() => {
  return userProfile.value?.full_name || user.value?.email?.split('@')[0] || 'Usuario'
})

const userRole = computed(() => {
  if (isLoading.value) return 'Cargando...'
  if (!currentRole.value) return 'Sin Rol'
  return getRoleLabel(currentRole.value)
})

// Setup auth state change listener
onMounted(() => {
  updateDateTime()
  setInterval(updateDateTime, 60000) // Update every minute
  
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

// Page Title
const pageTitle = computed(() => {
  const titles = {
    '/dashboard': 'Dashboard',
    '/transactions': 'Transacciones',
    '/cash-register': 'Caja Registradora',
    '/products': 'Productos',
    '/users': 'Gestión de Usuarios',
    '/reports': 'Reportes',
    '/settings': 'Configuración'
  }
  return titles[route.path] || 'Lumen'
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

onMounted(() => {
  updateDateTime()
  setInterval(updateDateTime, 60000) // Update every minute
})

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
