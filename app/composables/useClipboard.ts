export const useClipboard = () => {
    const toast = useToast()

    const copy = async (text: string, successMessage: string = 'Copiado al portapapeles') => {
        if (!text) return

        try {
            // Priority 1: Modern API (Secure Contexts)
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text)
                toast.add({ title: 'Éxito', description: successMessage, color: 'success' })
                return
            }

            // Priority 2: Deprecated execCommand (Insecure Contexts / Old Browsers)
            const textArea = document.createElement("textarea")
            textArea.value = text

            // Ensure it's not visible but part of DOM
            textArea.style.position = "fixed"
            textArea.style.left = "-9999px"
            textArea.style.top = "0"
            document.body.appendChild(textArea)

            textArea.focus()
            textArea.select()

            const successful = document.execCommand('copy')
            document.body.removeChild(textArea)

            if (successful) {
                toast.add({ title: 'Éxito', description: successMessage, color: 'success' })
            } else {
                throw new Error('Fallback copy failed')
            }

        } catch (err) {
            console.error('Copy failed:', err)
            toast.add({
                title: 'No se pudo copiar',
                description: 'Por favor selecciona el texto y cópialo manualmente (Ctrl+C)',
                color: 'warning'
            })
        }
    }

    return { copy }
}
