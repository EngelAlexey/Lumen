export default defineNuxtPlugin(() => {
    const supabase = useSupabaseClient()

    const heartbeat = async () => {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
            console.error('💔 El corazón de la sesión se detuvo:', error)
        } else if (data.session) {
            console.log('💓 Latido: Sesión renovada/verificada correctamente')
        }
    }

    setInterval(() => {
        heartbeat()
    }, 5 * 60 * 1000)

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log('👀 Pestaña activa: Forzando verificación...')
            heartbeat()
        }
    })

    window.addEventListener('online', () => {
        console.log('🌐 Conexión recuperada: Refrescando sesión...')
        heartbeat()
    })
})