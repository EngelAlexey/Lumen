<script setup lang="ts">
definePageMeta({
  layout: false
})
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
    <!-- Navbar -->
    <nav class="border-b border-gray-200 dark:border-gray-800 py-4">
      <div class="max-w-7xl mx-auto px-4 flex justify-between items-center">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-light-bulb" class="w-8 h-8 text-primary-600" />
          <span class="text-xl font-bold text-gray-900 dark:text-white">Lumen</span>
        </div>
        <div class="flex gap-4">
          <UButton to="/login" variant="ghost" color="neutral">Iniciar Sesión</UButton>
          <UButton to="/pricing" color="primary">Comenzar Gratis</UButton>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <main class="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <div class="max-w-4xl space-y-8">
        <h1 class="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Control total para tu <span class="text-primary-600">Negocio</span>
        </h1>
        <p class="text-xl text-gray-500 max-w-2xl mx-auto">
          Gestiona ventas, inventario y personal en una sola plataforma. Diseñada para crecer contigo.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <UButton to="/pricing" size="xl" icon="i-heroicons-rocket-launch">
            Empieza tu prueba gratis
          </UButton>
          <UButton to="/login" variant="outline" size="xl" icon="i-heroicons-arrow-right-end-on-rectangle">
            Ir al Dashboard
          </UButton>
        </div>
      </div>

      <!-- Features Preview -->
      <div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
        <UCard>
          <template #header>
            <UIcon name="i-heroicons-banknotes" class="w-8 h-8 text-primary-500 mb-2" />
            <h3 class="text-xl font-bold">Punto de Venta</h3>
          </template>
          Registra ventas en segundos, acepta múltiples métodos de pago y mantén tu caja cuadrada siempre.
        </UCard>
        
        <UCard>
          <template #header>
            <UIcon name="i-heroicons-chart-bar-square" class="w-8 h-8 text-primary-500 mb-2" />
            <h3 class="text-xl font-bold">Reportes en Vivo</h3>
          </template>
          Toma decisiones basadas en datos reales. Conoce tus productos más vendidos y tus horas pico.
        </UCard>
        
        <UCard>
          <template #header>
            <UIcon name="i-heroicons-users" class="w-8 h-8 text-primary-500 mb-2" />
            <h3 class="text-xl font-bold">Gestión de Equipo</h3>
          </template>
          Asigna roles, controla permisos y monitorea el rendimiento de tu personal fácilmente.
        </UCard>
      </div>
    </main>
    
    <!-- Footer -->
    <footer class="border-t border-gray-200 dark:border-gray-800 py-8 text-center text-gray-500 text-sm">
      © {{ new Date().getFullYear() }} Lumen Platform. Todos los derechos reservados.
    </footer>
  </div>
</template>
