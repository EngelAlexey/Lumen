<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Customer } from '~/types/database.types'

const { t } = useI18n()

const props = defineProps<{
    customer?: Customer | null
    loading?: boolean
}>()

const emit = defineEmits(['close', 'submit'])

const schema = z.object({
    full_name: z.string().min(1, t('customers.form.validation.name_required')),
    email: z.string().email(t('customers.form.validation.email_invalid')).optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional()
})

const state = reactive({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
})

watch(() => props.customer, (newVal) => {
    if (newVal) {
        state.full_name = newVal.full_name
        state.email = newVal.email || ''
        state.phone = newVal.phone || ''
        state.address = newVal.address || ''
        state.notes = newVal.notes || ''
    } else {
        state.full_name = ''
        state.email = ''
        state.phone = ''
        state.address = ''
        state.notes = ''
    }
}, { immediate: true })

function handleSubmit(event: FormSubmitEvent<any>) {
    emit('submit', event.data)
}
</script>

<template>
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="handleSubmit">
        <UFormField :label="$t('customers.form.labels.full_name')" name="full_name" required>
            <UInput 
                v-model="state.full_name" 
                icon="i-heroicons-user" 
                :placeholder="$t('customers.form.placeholders.full_name')" 
            />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField :label="$t('customers.form.labels.phone')" name="phone">
                <UInput 
                    v-model="state.phone" 
                    icon="i-heroicons-phone" 
                    :placeholder="$t('customers.form.placeholders.phone')" 
                />
            </UFormField>

            <UFormField :label="$t('customers.form.labels.email')" name="email">
                <UInput 
                    v-model="state.email" 
                    icon="i-heroicons-envelope" 
                    :placeholder="$t('customers.form.placeholders.email')" 
                />
            </UFormField>
        </div>

        <UFormField :label="$t('customers.form.labels.address')" name="address">
            <UInput 
                v-model="state.address" 
                icon="i-heroicons-map-pin" 
                :placeholder="$t('customers.form.placeholders.address')" 
            />
        </UFormField>

        <UFormField :label="$t('customers.form.labels.notes')" name="notes">
            <UTextarea 
                v-model="state.notes" 
                :placeholder="$t('customers.form.placeholders.notes')" 
            />
        </UFormField>

        <div class="flex justify-end gap-3 mt-6">
            <UButton 
                color="neutral" 
                variant="ghost" 
                @click="$emit('close')"
            >
                {{ $t('common.buttons.cancel') }}
            </UButton>
            <UButton 
                type="submit" 
                color="primary" 
                :loading="loading"
            >
                {{ customer ? $t('customers.form.buttons.save_changes') : $t('customers.form.buttons.create') }}
            </UButton>
        </div>
    </UForm>
</template>
