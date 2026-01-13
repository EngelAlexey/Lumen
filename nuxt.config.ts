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

  i18n: {
    langDir: 'locales', // Ensure this is correct relative to srcDir
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
    // Onvopay Keys
    onvoSecretKey: process.env.NUXT_ONVO_SECRET_KEY || 'onvo_test_secret_key_BIE8hUxosGcUHu-CFEkADz_LXnOY7RGOLleIGgP6E6vTy3UPFr-WrOhMaHE_ZEjrNvI2Cce8MKh03a7NbOLcPQ',
    onvoWebhookSecret: process.env.NUXT_ONVO_WEBHOOK_SECRET || 'YOUR_WEBHOOK_SECRET',
    onvoPriceStartup: process.env.NUXT_ONVO_PRICE_STARTUP || 'cmkbribdj16aak420vzo2s3u8',

    stripePriceSolo: process.env.STRIPE_PRICE_SOLO || 'price_1SoEXdEKONx2SQOvKf2bKkxx',
    stripePriceStartup: process.env.STRIPE_PRICE_STARTUP || 'price_1SoETwEKONx2SQOvVwwEbA6G',

    public: {
      siteUrl: process.env.SITE_URL || 'http://localhost:3000',
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      onvoPublishableKey: process.env.NUXT_ONVO_PUBLISHABLE_KEY || 'onvo_test_publishable_key_vBDowr4uBk4uTvjvMN_3fpMPBCT25fqoDZBnomvqGT8NaLaTxQoXKX_R46O2toV6FeDO88Ncb0rXs-QJZv-ehw'
    }
  }
})