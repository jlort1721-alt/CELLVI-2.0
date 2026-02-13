# Manual de Despliegue - CELLVI 2.0

## 1. Requisitos Previos

*   **Node.js** 18+
*   **Cuenta Supabase** (Proyecto creado)
*   **Cuenta Vercel/Netlify** (Para hosting frontend)

## 2. Configuración de Variables de Entorno

En su plataforma de hosting (CI/CD), configure las siguientes variables:

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

> **Nota:** Nunca exponga la `SERVICE_ROLE_KEY` en el frontend.

## 3. Despliegue de Base de Datos

Ejecute las migraciones SQL para estructurar la base de datos:

```bash
# Login en CLI
npx supabase login

# Enlazar proyecto
npx supabase link --project-ref <tu-project-id>

# Aplicar migraciones
npx supabase db push
```

## 4. Despliegue de Edge Functions

Para desplegar la lógica de backend (ej. Escalation Service):

```bash
npx supabase functions deploy escalation-scheduler
npx supabase functions deploy device-gateway
```

## 5. Build de Frontend (Producción)

Para generar los archivos estáticos optimizados:

```bash
npm run build
```

Esto generará la carpeta `dist/`, lista para ser servida por cualquier servidor web estático.

## 6. Verificación Post-Despliegue

1.  Acceder a la URL pública.
2.  Iniciar sesión.
3.  Verificar carga de vehículos en `/dashboard` (Conexión DB OK).
4.  Probar creación de inspección en `/preoperacional` (RLS OK).
