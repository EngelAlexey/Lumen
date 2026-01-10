// nuxt.config.ts
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  srcDir: 'app',
  css: ['~/assets/css/main.css'],

  modules: [
    '@nuxtjs/supabase',
    '@nuxt/ui'
  ],

  supabase: {
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/', '/register', '/pricing'],
    },

    cookieOptions: {
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: true
    },

    clientOptions: {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true
      }
    }
  },

  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,

    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    }
  }
})