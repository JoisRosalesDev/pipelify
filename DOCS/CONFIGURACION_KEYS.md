# Guía de Obtención de API Keys y Configuración de Producción — Pipelify

Esta guía detalla paso a paso cómo obtener y generar cada una de las variables de entorno requeridas para desplegar **Pipelify** en un entorno distribuido listo para producción (Vercel + Render + Upstash + Supabase/Neon).

---

## 📋 Resumen de Variables Requeridas

| Variable | Proveedor / Origen | Ejemplo / Formato |
| :--- | :--- | :--- |
| `DATABASE_URL` | Supabase / Neon / Aiven | `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres` |
| `ASYNC_DATABASE_URL` | Supabase / Neon / Aiven | `postgresql+asyncpg://postgres:[PASSWORD]@[HOST]:5432/postgres` |
| `UPSTASH_REDIS_URL` | Upstash Console | `rediss://default:[TOKEN]@[HOST].upstash.io:6379` |
| `JWT_SECRET_KEY` | Generación Local (CLI) | String hexadecimal de 64 caracteres |
| `JWT_ALGORITHM` | Estándar de Encriptación | `HS256` |
| `CORS_ORIGINS` | Dominio Vercel / Frontend | `https://pipelify.vercel.app,http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Dominio Render (HTTP API) | `https://pipelify-api.onrender.com` |
| `NEXT_PUBLIC_WS_URL` | Dominio Render (WebSockets) | `wss://pipelify-api.onrender.com` |
| `NEXT_PUBLIC_APP_URL` | Dominio Vercel | `https://pipelify.vercel.app` |

---

## 1. 🔴 Base de Datos PostgreSQL (`DATABASE_URL` & `ASYNC_DATABASE_URL`)

Pipelify requiere PostgreSQL 15+ con soporte para tipos de columna `JSONB` y `UUID`.

### Opción Recomendada: Supabase
1. Inicia sesión en [supabase.com](https://supabase.com/).
2. Haz clic en **New Project**, asigna un nombre (ej. `pipelify-db`) y define una contraseña segura para la base de datos.
3. Selecciona la región geográfica más cercana a tu servicio de backend (Render).
4. Una vez creado el proyecto, ve a **Project Settings** (icono de engranaje) -> **Database**.
5. En la sección **Connection string**, selecciona el tab **URI**:
   - Para Prisma / Migraciones (`DATABASE_URL`): Copia la URI de **Session Pooler** (puerto 5432 o 6543):
     ```env
     DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
     ```
   - Para FastAPI / Asyncpg (`ASYNC_DATABASE_URL`): Reemplaza el esquema inicial `postgresql://` por `postgresql+asyncpg://`:
     ```env
     ASYNC_DATABASE_URL="postgresql+asyncpg://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
     ```

---

## 2. ⚡ Message Broker & Cache (`UPSTASH_REDIS_URL`)

Upstash proporciona Redis Serverless con soporte nativo para TLS/SSL y Pub/Sub dinámico.

1. Inicia sesión en [console.upstash.com](https://console.upstash.com/).
2. Haz clic en **Create Database**.
3. Configura:
   - **Name:** `pipelify-redis`
   - **Type:** Redis
   - **Region:** La misma región que tu base de datos y backend (ej. `us-east-1`).
   - **Tolerancia a fallos:** Habilitar TLS.
4. En el panel principal de la base de datos creada, desplázate hasta la sección **Details** -> **Connect your database**.
5. Selecciona la pestaña **redis-py** o **UPSTASH_REDIS_REST_URL** y copia la URL completa de conexión TLS (empieza por `rediss://` con doble "s" para cifrado SSL):
   ```env
   UPSTASH_REDIS_URL="rediss://default:abc123xyz...@us1-example-12345.upstash.io:6379"
   ```

---

## 3. 🔐 Clave Secreta JWT (`JWT_SECRET_KEY`)

Para autenticar las conexiones WebSocket (`wss://...`) sin comprometer la seguridad.

### Cómo Generarla:

Abre tu terminal y ejecuta cualquiera de los siguientes comandos:

- **Opción A (OpenSSL en Linux/macOS/Git Bash):**
  ```bash
  openssl rand -hex 32
  ```
- **Opción B (Python en PowerShell/CMD):**
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```

Copia la cadena resultante de 64 caracteres e insértala en tu entorno:
```env
JWT_SECRET_KEY="4a8d9e2b1c3f5a7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d"
JWT_ALGORITHM="HS256"
```

---

## 4. 🌐 URLs de Vercel y Render (`CORS_ORIGINS`, `NEXT_PUBLIC_*`)

### Paso A: Obtener URL del Backend en Render
1. En [render.com](https://render.com/), crea tu **Web Service** apuntando al repositorio de FastAPI.
2. Copia la URL pública asignada (ej. `https://pipelify-api.onrender.com`).
3. Define en Vercel:
   - `NEXT_PUBLIC_API_URL="https://pipelify-api.onrender.com"`
   - `NEXT_PUBLIC_WS_URL="wss://pipelify-api.onrender.com"` *(Nota: cambia `https://` por `wss://`)*

### Paso B: Obtener URL del Frontend en Vercel
1. En [vercel.com](https://vercel.com/), crea tu proyecto importando el repositorio Next.js.
2. Copia el dominio asignado (ej. `https://pipelify.vercel.app`).
3. Define en Render:
   - `CORS_ORIGINS="https://pipelify.vercel.app"`
   - `NEXT_PUBLIC_APP_URL="https://pipelify.vercel.app"`

---

## 🚀 Verificación de Conectividad en Producción

Una vez configuradas las variables en los paneles de Vercel y Render:

1. Ejecuta el test de salud del Backend:
   ```bash
   curl -i https://pipelify-api.onrender.com/health
   # Respuesta esperada: {"status": "ok", "service": "pipelify-backend"}
   ```
2. Realiza un despacho de prueba desde la interfaz en Vercel. La consola en tiempo real debe indicar:
   `[FastAPI WS] Conexión WebSocket aceptada exitosamente`.
