# Guía de Estructura y Lógica del Proyecto Lumen

Este documento proporciona una visión general del proyecto para entender cómo está construido, su arquitectura y el flujo de datos.

## 🛠️ Tecnologías Principales (Tech Stack)

El proyecto utiliza una arquitectura moderna "Full Stack" basada en JavaScript/TypeScript:

*   **Frontend Framework**: [Nuxt 4](https://nuxt.com/) (basado en Vue 3). Es el cerebro del proyecto, maneja tanto la interfaz de usuario como el servidor API backend.
*   **Lenguaje**: TypeScript (JavaScript con tipos) para mayor seguridad y menos errores.
*   **Base de Datos & Auth**: [Supabase](https://supabase.com/). Provee la base de datos (PostgreSQL), autenticación de usuarios y actualizaciones en tiempo real via websockets.
*   **Estilos**: [Tailwind CSS](https://tailwindcss.com/) (a través de Nuxt UI). Permite estilizar componentes rápidamente con clases utilitarias.
*   **Estado Global**: [Pinia](https://pinia.vuejs.org/). Maneja la información que necesita estar disponible en toda la app (ej. datos del usuario logueado).
*   **Pagos**: **Onvo**. Se utiliza para procesar pagos y suscripciones, no Stripe (aunque existan referencias, la lógica activa usa Onvo).

---

## 📂 Estructura del Proyecto

El código está dividido en dos grandes áreas dentro de la carpeta raíz: `app` (Frontend) y `server` (Backend).

### 1. Frontend (`app/`)
Aquí vive todo lo que el usuario ve y con lo que interactúa.

*   **`pages/`**: Define las rutas de la web.
    *   `pages/login/index.vue` -> accesibles en `lumen.app/login`
    *   `pages/dashboard/index.vue` -> accesibles en `lumen.app/dashboard`
    *   Nuxt crea el enrutamiento automáticamente basado en estos archivos.
*   **`components/`**: Piezas de UI reutilizables (Botones, Tarjetas, Formularios).
*   **`composables/`**: La **lógica de negocio** reutilizable.
    *   Ej: `useAuth.ts` contiene las funciones para `login`, `register`, `logout`.
    *   Ej: `useTransactions.ts` maneja la lógica de crear y listar transacciones.
*   **`stores/`**: Estado global.
    *   `user.ts`: Mantiene en memoria los datos del usuario y negocio actual para no tener que pedirlos a la base de datos en cada clic.
*   **`middleware/`**: "Porteros" de seguridad.
    *   `module-guard.global.ts`: Verifica automáticamente si un negocio tiene permiso para ver cierta página (ej. si no pagan el módulo "pos", no pueden entrar a `/cash-register`).
*   **`layouts/`**: Plantillas base para las páginas (ej. `default.vue` tiene la barra lateral, `auth.vue` es para login limpio).

### 2. Backend (`server/`)
Aquí vive la lógica que corre en el servidor, segura y oculta al usuario.

*   **`api/`**: Los "Endpoints" o funciones del servidor.
    *   El frontend llama a estas rutas para hacer operaciones sensibles.
    *   Ej: `api/payments/create-subscription.post.ts` crea la orden de pago en Onvo.
*   **`utils/`**: Código compartido del servidor.
    *   Ej: `onvo.ts` es un cliente para comunicarse con la API de Onvo.

---

## 🔄 Flujos y Lógica Principal

### A. Autenticación (Login/Registro)
**Objetivo**: Saber quién es el usuario y cargar sus datos.

1.  **Frontend (`useAuth.ts`)**: El usuario llena el formulario. Se llama a `supabase.auth.signInWithPassword`.
2.  **Supabase**: Verifica credenciales y devuelve un token de sesión.
3.  **Estado (`user.ts` Store)**:
    *   Detecta que el usuario entró (`watch(authEvent)`).
    *   Llama inmediatamente a la API interna `/api/auth/session` o usa el cliente Supabase para traer el perfil completo (`users` table) y su negocio (`businesses` table).
    *   Guarda estos datos en Pinia (`userStore.profile`, `userStore.business`) para que toda la app sepa quién es y de qué negocio.

### B. Pagos y Suscripciones
**Objetivo**: Cobrar al usuario usando Onvo.

1.  **Inicio**: El usuario elige un plan en el frontend.
2.  **Llamada API**: Se envía una petición a `/api/payments/create-subscription` con el plan elegido (`startup`, `solo`, etc.).
3.  **Backend (`create-subscription.post.ts`)**:
    *   Verifica quién es el usuario logueado.
    *   Busca o crea un "Cliente" en Onvo (`onvo.createCustomer`).
    *   Genera un link de pago (`onvo.createCheckoutLink`).
4.  **Redirección**: El frontend recibe el link y redirige al usuario a la página segura de Onvo para pagar.
5.  **Confirmación**:
    *   Al pagar, Onvo notifica a tu servidor mediante un **Webhook** (no visto en detalle, pero debería estar en `server/api/webhooks`).
    *   El servidor actualiza la base de datos (`subscription_status = 'active'`).

### C. Protección de Rutas (Middleware)
**Objetivo**: Que nadie entre donde no debe.

1.  **Navegación**: El usuario intenta ir a `/cash-register`.
2.  **Middleware (`module-guard.global.ts`)**:
    *   Se ejecuta *antes* de cargar la página.
    *   Revisa la configuración del negocio cargada en memoria (`useBusinessConfig`).
    *   Pregunta: "¿Este negocio tiene el módulo `pos` activo?".
    *   **Sí**: Deja pasar.
    *   **No**: Redirige al Dashboard.

---

## 💡 Resumen para el Estudiante de Sistemas

El proyecto sigue una arquitectura **limpia** y **modular**:
*   **Separación de intereses**: La UI está en `pages`, la lógica en `composables`, y el estado en `stores`.
*   **Seguridad**: Las operaciones críticas (pagos) se hacen en el `server`, lo visual en `app`.
*   **Reactividad**: Usa el sistema reactivo de Vue 3 (`ref`, `computed`, `watch`) para que la interfaz responda instantáneamente a cambios de datos.
*   **Escalabilidad**: Al usar TypeScript y composables, es fácil agregar nuevas funciones sin romper las existentes.
