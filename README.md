# Lumen - Sistema de Control Financiero Operativo

**Lumen** es una plataforma SaaS B2B de Seguridad Operativa y Financiera diseñada específicamente para MiPyMES en economías emergentes con alta digitalización bancaria informal.

## 🚀 Características Principales

- **Auditoría en Tiempo Real**: Digitaliza el ciclo de vida de cada transacción
- **Control de Estados**: Flujo estricto Pendiente → Entregado → Pagado
- **Multi-Canal**: Soporta efectivo, tarjetas, Sinpe Móvil y transferencias
- **Trazabilidad Completa**: Registro inmutable de todas las operaciones
- **Cierre Rápido**: Reduce el cierre de caja de 2 horas a 5 minutos

## 🛠️ Stack Tecnológico

- **Frontend**: Nuxt 3 (Vue.js + SSR)
- **Backend/Database**: Supabase (PostgreSQL + Auth + Real-time)
- **Styling**: Vanilla CSS con diseño moderno y premium
- **Deployment**: Vercel / Netlify (recomendado)

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Cuenta de Supabase (gratuita en [supabase.com](https://supabase.com))

## ⚙️ Configuración Inicial

### 1. Instalar Dependencias

Las dependencias ya están instaladas. Si necesitas reinstalarlas:

```powershell
npm install
```

### 2. Configurar Supabase

**IMPORTANTE**: Debes crear un archivo `.env` en la raíz del proyecto con tus credenciales de Supabase:

```env
# Supabase Configuration
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-clave-anonima-aqui

# Application Settings
APP_NAME=Lumen
APP_ENV=development
```

**Cómo obtener las credenciales:**

1. Crea un proyecto en [Supabase](https://app.supabase.com)
2. Ve a Settings → API
3. Copia el "Project URL" → pégalo en `SUPABASE_URL`
4. Copia el "anon/public key" → pégalo en `SUPABASE_KEY`

### 3. Crear la Base de Datos

Ejecuta el script SQL de migración en el SQL Editor de Supabase:

1. Abre tu proyecto en Supabase Dashboard
2. Ve a SQL Editor
3. Copia y pega el contenido de `supabase/migrations/001_initial_schema.sql`
4. Ejecuta la consulta

Esto creará todas las tablas necesarias: users, businesses, transactions, products, cash_sessions, etc.

### 4. Iniciar el Servidor de Desarrollo

```powershell
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

## 📁 Estructura del Proyecto

```
Lumen/
├── app/
│   ├── app.vue                 # Componente raíz
│   ├── layouts/
│   │   └── default.vue         # Layout principal con sidebar
│   └── pages/
│       ├── index.vue           # Página de bienvenida
│       ├── login.vue           # Autenticación
│       └── dashboard.vue       # Dashboard principal
├── assets/
│   └── css/
│       └── main.css            # Sistema de diseño CSS
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Schema de base de datos
├── nuxt.config.ts              # Configuración de Nuxt
└── package.json                # Dependencias
```

## 🎨 Sistema de Diseño

El proyecto utiliza un sistema de diseño moderno con:

- **Tipografía**: Inter (Google Fonts)
- **Colores**: Paleta HSL moderna (evita colores genéricos)
- **Componentes**: Botones, tarjetas, badges, forms
- **Animaciones**: Transiciones suaves y micro-interacciones
- **Responsivo**: Mobile-first design

## 🔒 Seguridad

El proyecto implementa:

- **Row Level Security (RLS)** en todas las tablas
- **Políticas de acceso** basadas en roles
- **Audit logs** inmutables para trazabilidad completa
- **Triggers automáticos** para integridad de datos

## 📊 Próximos Pasos

1. **Crear usuario de prueba** en Supabase Auth
2. **Implementar módulos de negocio**:
   - Retail (punto de venta, inventario)
   - Gastronomía (mesas, pedidos)
   - Servicios (clientes, entregas)
3. **Integrar pasarelas de pago** (Sinpe Móvil API, procesadores de tarjetas)
4. **Dashboard avanzado** con gráficos y métricas en tiempo real

## 🚀 Despliegue

Para preparar la aplicación para producción:

```powershell
npm run build
npm run preview
```

Puedes desplegar en:
- **Vercel**: `vercel deploy`
- **Netlify**: Conecta tu repositorio Git

## 📝 Licencia

Proyecto privado - MiPyMES Solutions

---

**¿Necesitas ayuda?** Consulta la documentación de [Nuxt 3](https://nuxt.com/docs) y [Supabase](https://supabase.com/docs)
