<script setup lang="ts">
defineProps<{
  icon: string
  message: string
  actionText?: string
  actionIcon?: string
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="text-center py-8 text-gray-500">
    <UIcon :name="icon" class="w-12 h-12 mx-auto mb-2 opacity-50" />
    <p>{{ message }}</p>
    <UButton 
      v-if="actionText" 
      :icon="actionIcon"
      color="primary" 
      class="mt-4"
      @click="emit('action')"
    >
      {{ actionText }}
    </UButton>
  </div>
</template>
