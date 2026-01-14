<script setup lang="ts">
const props = defineProps<{
  status: string
  type?: 'transaction' | 'user' | 'delivery' | 'user_role' | 'custom'
  customColors?: Record<string, string>
  customLabels?: Record<string, string>
}>()

const { t } = useI18n()

const defaultColors: Record<string, Record<string, string>> = {
  transaction: {
    pending: 'warning',
    delivered: 'info',
    paid: 'success',
    cancelled: 'error'
  },
  user: {
    active: 'success',
    inactive: 'neutral'
  },
  user_role: {
    owner: 'primary',
    admin: 'info',
    employee: 'neutral'
  },
  delivery: {
    pending: 'neutral',
    preparing: 'warning',
    ready: 'info',
    in_route: 'primary',
    delivered: 'success',
    cancelled: 'error'
  }
}

const defaultLabels: Record<string, Record<string, string>> = {
  transaction: {
    pending: t('dashboard.transactions.status.pending'),
    delivered: t('dashboard.transactions.status.delivered'),
    paid: t('dashboard.transactions.status.paid'),
    cancelled: t('dashboard.transactions.status.cancelled')
  }
}

const badgeColor = computed(() => {
  if (props.customColors?.[props.status]) {
    return props.customColors[props.status] as any
  }
  
  const typeColors = defaultColors[props.type || 'custom']
  return (typeColors?.[props.status] || 'neutral') as any
})

const { getRoleLabel, getStatusLabel } = useOptions()

const badgeLabel = computed(() => {
  if (props.customLabels?.[props.status]) {
    return props.customLabels[props.status]
  }

  if (props.type === 'user_role') {
    return getRoleLabel(props.status)
  }

  if (props.type === 'user') {
    return getStatusLabel(props.status)
  }
  
  const typeLabels = defaultLabels[props.type || 'custom']
  return typeLabels?.[props.status] || props.status
})
</script>

<template>
  <UBadge 
    :color="badgeColor" 
    variant="subtle"
  >
    {{ badgeLabel }}
  </UBadge>
</template>
