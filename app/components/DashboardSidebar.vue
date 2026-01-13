<template>
  <aside class="w-[280px] bg-[#111827] border-r border-gray-800 text-white flex flex-col fixed h-screen z-[100] shadow-xl transition-all duration-300 hidden md:flex">
    <div class="p-6 border-b border-gray-800">
      <h1 class="text-2xl font-extrabold m-0 text-white flex items-center gap-2">
        <UIcon name="i-heroicons-light-bulb" class="w-8 h-8 text-purple-500" />
        Lumen
      </h1>
      <p class="text-sm text-gray-400 mt-2 font-medium">{{ config.name }}</p>
    </div>
    
    <nav class="flex-1 overflow-y-auto py-6 px-4 space-y-1">
      <ClientOnly>
        <NuxtLink 
          v-for="item in navigation" 
          :key="item.to" 
          :to="item.to" 
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 transition-all duration-200 hover:bg-gray-800 hover:text-white font-medium"
          active-class="bg-purple-600/10 text-purple-400 font-semibold border border-purple-600/20"
        >
          <UIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span>{{ item.label }}</span>
        </NuxtLink>
        <template #fallback>
          <div v-for="i in 5" :key="i" class="flex items-center gap-3 px-4 py-3 opacity-50">
            <div class="w-5 h-5 bg-gray-600 rounded"></div>
            <div class="h-4 w-24 bg-gray-600 rounded"></div>
          </div>
        </template>
      </ClientOnly>
    </nav>
    
    <div class="p-6 border-t border-gray-800">
      <ClientOnly>
        <div v-if="userProfile || user" class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ring-2 ring-gray-700">
            <template v-if="userInitials">
                <span class="text-white">{{ userInitials }}</span>
            </template>
            <UIcon v-else name="i-heroicons-user" class="w-6 h-6 text-gray-400" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[0.938rem] font-semibold text-white capitalize truncate">{{ userName }}</p>
            <p class="text-[0.813rem] text-gray-400 truncate">{{ userRole }}</p>
          </div>
        </div>
        <template #fallback>
           <div class="flex items-center gap-3 mb-4 opacity-50">
             <div class="w-10 h-10 bg-gray-800 rounded-full"></div>
             <div class="flex-1 space-y-2">
               <div class="h-3 w-20 bg-gray-800 rounded"></div>
               <div class="h-2 w-16 bg-gray-800 rounded"></div>
             </div>
           </div>
        </template>
      </ClientOnly>

      <button @click="emit('logout')" class="w-full p-3 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:bg-gray-700 hover:text-white active:scale-[0.98]">
        <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-5 h-5" />
        {{ $t('auth.logout', 'Cerrar Sesión') }}
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
const { navigation, config } = useBusinessConfig()

// Props currently empty as we reuse composables, but ready for extension
const props = defineProps<{
  userProfile?: { full_name: string, email: string } | null
  user?: any
  userRole?: string
}>()

const emit = defineEmits(['logout'])

// Helper for initials
const userInitials = computed(() => {
  if (props.userProfile?.full_name) {
    const names = props.userProfile.full_name.split(' ')
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      const firstInitial = names[0]?.[0] || ''
      const lastInitial = names[names.length - 1]?.[0] || ''
      return (firstInitial + lastInitial).toUpperCase()
    }
    return names[0]?.substring(0, 2).toUpperCase() || 'US'
  }
  const email = props.user?.email || ''
  return email.substring(0, 2).toUpperCase() || 'US'
})

const userName = computed(() => {
  return props.userProfile?.full_name || props.user?.email?.split('@')[0] || 'Usuario'
})
</script>
