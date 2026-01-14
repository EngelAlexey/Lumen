// @ts-expect-error - Vitest types are available at runtime
import { vi } from 'vitest'
import { ref, computed } from 'vue'

// Extend global namespace for test mocks
declare global {
    // eslint-disable-next-line no-var
    var defineComponent: ReturnType<typeof vi.fn>
    // eslint-disable-next-line no-var
    var useRuntimeConfig: ReturnType<typeof vi.fn>
    // eslint-disable-next-line no-var
    var ref: typeof ref
    // eslint-disable-next-line no-var
    var computed: typeof computed
}

// Make Vue composables available globally for Nuxt auto-imports
global.ref = ref
global.computed = computed

// Mock Nuxt composables
global.defineComponent = vi.fn()
global.useRuntimeConfig = vi.fn(() => ({
    public: {
        supabaseUrl: 'http://localhost:54321',
        supabaseKey: 'test-key'
    }
}))

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        auth: {
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            getSession: vi.fn(),
            onAuthStateChange: vi.fn()
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn()
        }))
    }))
}))
