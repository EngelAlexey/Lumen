export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  srcDir: 'app',
  css: ['~/styles/main.css'],

  modules: [
    '@nuxtjs/supabase',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/i18n'
  ],

  imports: {
    dirs: [
      'composables',
      'composables/auth',
      'composables/business',
      'composables/cart',
      'composables/customers',
      'composables/dashboard',
      'composables/products',
      'composables/store',
      'composables/transactions',
      'composables/utils'
    ]
  },

  i18n: {
    langDir: 'locales',
    locales: [
      { code: 'es', file: 'es.json', name: 'Español' },
      { code: 'en', file: 'en.json', name: 'English' }
    ],
    defaultLocale: 'es',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    }
  },

  supabase: {
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/', '/register', '/pricing', '/payment/processing', '/payment/test', '/confirm'],
    },

    cookieOptions: {
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
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
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    onvoSecretKey: process.env.ONVO_WEBHOOK_SECRET,
    onvoWebhookSecret: process.env.ONVO_REAL_WEBHOOK_SECRET,
    onvoPriceStartup: process.env.NUXT_ONVO_PRICE_STARTUP,

    stripePriceSolo: process.env.STRIPE_PRICE_SOLO,
    stripePriceStartup: process.env.STRIPE_PRICE_STARTUP,

    public: {
      siteUrl: process.env.SITE_URL,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      onvoPublishableKey: process.env.ONVO_API_KEY
    }
  }
})