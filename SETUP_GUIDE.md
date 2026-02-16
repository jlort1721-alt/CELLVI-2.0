# 🚀 GUÍA DE CONFIGURACIÓN - CELLVI 2.0

Esta guía te ayudará a configurar completamente CELLVI 2.0 con todas las integraciones de APIs.

---

## 📋 PRERREQUISITOS

Antes de comenzar, asegúrate de tener:

- [ ] Node.js 18+ instalado
- [ ] npm o yarn instalado
- [ ] Git instalado
- [ ] Cuenta de Supabase creada
- [ ] Cuenta de Anthropic (para Claude API)
- [ ] Cuenta de OpenAI (para embeddings)

---

## 1️⃣ CONFIGURACIÓN DE SUPABASE

### Paso 1: Crear Proyecto en Supabase

1. Ve a https://app.supabase.com
2. Clic en "New Project"
3. Completa:
   - **Name:** CELLVI-2.0-Production
   - **Database Password:** [Elige una contraseña segura]
   - **Region:** South America (São Paulo) - más cercano a Colombia
4. Clic en "Create new project"
5. Espera 2-3 minutos mientras se crea el proyecto

### Paso 2: Aplicar Migración de Base de Datos

**Opción A: Usando Supabase CLI (Recomendado)**

```bash
# 1. Instalar Supabase CLI
npm install -g supabase

# 2. Login a Supabase
supabase login

# 3. Vincular proyecto (reemplaza con tu project-ref)
supabase link --project-ref YOUR_PROJECT_REF

# 4. Aplicar migración
supabase db push

# 5. Verificar que se aplicó correctamente
supabase db diff
```

**Opción B: Usando SQL Editor (Manual)**

1. Ve a tu proyecto en Supabase
2. Clic en "SQL Editor" en el sidebar
3. Clic en "New query"
4. Copia y pega el contenido de `supabase/migrations/20260215_ai_modules_schema.sql`
5. Clic en "Run" (botón verde)
6. Verifica que todas las tablas se crearon en "Table Editor"

### Paso 3: Obtener Credenciales

1. Ve a: https://app.supabase.com/project/YOUR_PROJECT/settings/api
2. Copia los siguientes valores:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon/public key:** `eyJhbGciOiJIUzI1NiIsInR5c...`
   - **service_role key:** (solo si lo necesitas para admin)

### Paso 4: Configurar Variables de Entorno

```bash
# 1. Copiar archivo de ejemplo
cp .env.example .env

# 2. Editar .env y agregar tus credenciales
nano .env  # o usa tu editor favorito
```

Agrega:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

---

## 2️⃣ CONFIGURACIÓN DE CLAUDE API (Anthropic)

### Paso 1: Crear Cuenta en Anthropic

1. Ve a https://console.anthropic.com
2. Crea una cuenta o inicia sesión
3. Ve a "API Keys" en el menú lateral
4. Clic en "Create Key"
5. Dale un nombre: "CELLVI-Production"
6. Copia la API key (empieza con `sk-ant-api03-...`)

### Paso 2: Configurar en .env

```env
VITE_ANTHROPIC_API_KEY=sk-ant-api03-tu-key-aqui
```

### Paso 3: Verificar Límites y Créditos

1. Ve a "Billing" en Anthropic Console
2. Agrega un método de pago si no lo has hecho
3. Revisa tus límites de rate:
   - Claude 3 Sonnet: ~50 requests/min
   - Tokens: varies por plan

**Importante:** Claude API es de pago por uso. Estima:
- ~$0.003 por 1,000 tokens de input
- ~$0.015 por 1,000 tokens de output
- Conversación típica de chatbot: ~$0.02-0.05

---

## 3️⃣ CONFIGURACIÓN DE OPENAI API

### Paso 1: Crear API Key

1. Ve a https://platform.openai.com/api-keys
2. Clic en "Create new secret key"
3. Dale un nombre: "CELLVI-Embeddings"
4. Copia la key (empieza con `sk-...`)

### Paso 2: Configurar en .env

```env
VITE_OPENAI_API_KEY=sk-tu-key-aqui
```

### Paso 3: Configurar Límites (Opcional pero Recomendado)

1. Ve a https://platform.openai.com/account/limits
2. Establece límites mensuales de gasto
   - Recomendado para inicio: $50/mes
3. Configura alertas de uso

**Costos Estimados:**
- Embeddings (text-embedding-3-small): ~$0.00002 por 1,000 tokens
- Para knowledge base de 100 documentos: ~$0.10
- Búsquedas son casi gratuitas (solo embedding de la query)

---

## 4️⃣ CONFIGURACIÓN DE MEDIAPIPE (Vision Guard)

### Opción 1: Usar CDN Público (Recomendado para inicio)

```env
VITE_MEDIAPIPE_USE_CDN=true
VITE_MEDIAPIPE_BASE_URL=https://cdn.jsdelivr.net/npm/@mediapipe/face_detection
```

✅ **Ventajas:** Gratis, rápido, no requiere configuración
❌ **Desventajas:** Depende de servicio externo

### Opción 2: Self-Hosted (Para producción)

```bash
# 1. Instalar MediaPipe
npm install @mediapipe/face_detection

# 2. Copiar assets a public/
cp -r node_modules/@mediapipe/face_detection/* public/mediapipe/

# 3. Configurar en .env
VITE_MEDIAPIPE_USE_CDN=false
VITE_MEDIAPIPE_BASE_URL=/mediapipe
```

---

## 5️⃣ VERIFICACIÓN DE CONFIGURACIÓN

### Test 1: Verificar Supabase

```bash
# Desde tu proyecto
npm run test:supabase
```

O manualmente en la consola del navegador:
```javascript
import { supabase } from './src/lib/supabase';

// Test de conexión
const { data, error } = await supabase
  .from('chatbot_knowledge_base')
  .select('count')
  .single();

console.log('Supabase conectado:', !error);
```

### Test 2: Verificar Claude API

```bash
curl https://api.anthropic.com/v1/messages \
  --header "x-api-key: $VITE_ANTHROPIC_API_KEY" \
  --header "anthropic-version: 2023-06-01" \
  --header "content-type: application/json" \
  --data '{
    "model": "claude-3-sonnet-20240229",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Test 3: Verificar OpenAI API

```bash
curl https://api.openai.com/v1/embeddings \
  -H "Authorization: Bearer $VITE_OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "test",
    "model": "text-embedding-3-small"
  }'
```

---

## 6️⃣ EJECUTAR LA APLICACIÓN

```bash
# 1. Instalar dependencias (si no lo has hecho)
npm install

# 2. Aplicar migración de Supabase (si no lo hiciste)
supabase db push

# 3. Iniciar en modo desarrollo
npm run dev

# 4. Abrir en navegador
# http://localhost:5173
```

---

## 7️⃣ DEPLOYMENT A PRODUCCIÓN

### Paso 1: Build de Producción

```bash
npm run build
```

### Paso 2: Variables de Entorno en Hosting

Si usas **Vercel, Netlify, o similar:**

1. Ve a Settings > Environment Variables
2. Agrega todas las variables de `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ANTHROPIC_API_KEY`
   - `VITE_OPENAI_API_KEY`
   - etc.

3. Asegúrate de marcar `VITE_APP_ENV=production`

### Paso 3: Deploy

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod

# O push a main si tienes CI/CD configurado
git push origin main
```

---

## 🔒 SEGURIDAD

### Variables de Entorno Sensibles

❌ **NUNCA commitees `.env` a Git**
✅ Solo commitea `.env.example` (sin valores reales)

### API Keys

- ✅ Usa API keys diferentes para dev/staging/production
- ✅ Rotaciona las keys periódicamente (cada 3-6 meses)
- ✅ Configura límites de rate y presupuesto

### Supabase RLS

Las políticas de Row Level Security ya están configuradas:
- Users solo ven sus propios datos
- Admins/Managers pueden ver datos de equipo
- Knowledge base es público (read-only)

---

## 📊 MONITOREO

### Supabase Dashboard

- **Logs:** https://app.supabase.com/project/YOUR_PROJECT/logs/postgres-logs
- **Auth:** https://app.supabase.com/project/YOUR_PROJECT/auth/users
- **Database:** https://app.supabase.com/project/YOUR_PROJECT/editor

### API Usage

- **Anthropic:** https://console.anthropic.com/settings/usage
- **OpenAI:** https://platform.openai.com/usage

---

## 🆘 TROUBLESHOOTING

### Error: "Supabase is not configured"

✅ Verifica que `.env` existe y tiene `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
✅ Reinicia el servidor de desarrollo (`npm run dev`)

### Error: "Anthropic API 401 Unauthorized"

✅ Verifica que la API key es correcta
✅ Asegúrate de que tiene el prefijo correcto: `sk-ant-api03-...`
✅ Verifica que tienes créditos en tu cuenta

### Error: "Table does not exist"

✅ Aplica la migración: `supabase db push`
✅ Verifica en Supabase Dashboard que las tablas existen

### Modo Demo funciona pero no persiste datos

✅ Esto es normal si `VITE_USE_MOCK_DATA=true`
✅ Cambia a `VITE_USE_MOCK_DATA=false` para usar Supabase

---

## ✅ CHECKLIST FINAL

Antes de ir a producción, verifica:

- [ ] Migración de Supabase aplicada correctamente
- [ ] Todas las API keys configuradas y funcionando
- [ ] Build de producción exitoso (`npm run build`)
- [ ] Variables de entorno en hosting configuradas
- [ ] RLS policies funcionando
- [ ] Backups de base de datos configurados
- [ ] Monitoreo de errores activo (Sentry, etc.)
- [ ] Límites de API y presupuestos configurados
- [ ] SSL/HTTPS habilitado
- [ ] DNS configurado correctamente

---

## 📞 SOPORTE

Si necesitas ayuda:

1. Revisa esta guía completa
2. Consulta la documentación oficial:
   - Supabase: https://supabase.com/docs
   - Anthropic: https://docs.anthropic.com
   - OpenAI: https://platform.openai.com/docs

3. Contacta al equipo de desarrollo

---

**¡Listo! Tu CELLVI 2.0 está completamente configurado y listo para producción!** 🚀
