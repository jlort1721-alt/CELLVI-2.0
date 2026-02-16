# 🚀 Instrucciones de Deployment a Vercel

## Estado Actual

✅ **GitHub:** Actualizado con últimos cambios (commit `8f8b2af`)
⚠️ **Vercel:** Requiere configuración manual (CLI no permite setup automatizado)

---

## Método 1: Deployment desde GitHub (RECOMENDADO) ⭐

Este es el método más simple y habilita auto-deployment en cada push.

### Pasos:

1. **Ir a Vercel Dashboard:**
   - Visita: https://vercel.com/new
   - Login con tu cuenta: `jlort1721-alt`

2. **Import Git Repository:**
   - Selecciona "Import Git Repository"
   - Autoriza GitHub si es necesario
   - Selecciona el repositorio: `jlort1721-alt/CELLVI-2.0`

3. **Configurar Proyecto:**
   ```
   Project Name: cellvi-2-0 (o el nombre que prefieras)
   Framework Preset: Vite
   Root Directory: ./
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Variables de Entorno (CRÍTICO):**

   Agregar las siguientes variables en la sección "Environment Variables":

   ```bash
   VITE_SUPABASE_URL=https://zmqcfnjltbupucswrfek.supabase.co
   VITE_SUPABASE_ANON_KEY=[tu_clave_anon_de_supabase]
   ```

   ⚠️ **IMPORTANTE:** Sin estas variables, la app mostrará pantalla blanca.

5. **Deploy:**
   - Click en "Deploy"
   - Esperar ~2-3 minutos
   - Vercel generará una URL de producción (ej: `cellvi-2-0.vercel.app`)

6. **Configurar Dominio Custom (Opcional):**
   - En el dashboard del proyecto → Settings → Domains
   - Agregar tu dominio personalizado

---

## Método 2: Deployment Manual via CLI

Si prefieres usar CLI (requiere sesión interactiva):

### Paso 1: Link del Proyecto

Ejecuta en terminal **INTERACTIVA** (no en Claude Code):

```bash
cd "/Users/ADMIN/Documents/CELLVI 2.0/CELLVI-2.0"
vercel link --scope jlort1721-alts-projects
```

Responde las preguntas:
- Setup and deploy? **Y**
- Which scope? **jlort1721-alts-projects**
- Link to existing project? **N** (primera vez) o **Y** (si ya existe)
- Project name? **cellvi-2-0**

### Paso 2: Deploy a Producción

```bash
vercel --prod
```

---

## Método 3: Deployment via GitHub Actions (Avanzado)

Si quieres CI/CD automatizado, crea `.github/workflows/vercel-deploy.yml`:

```yaml
name: Vercel Production Deployment

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

Requiere configurar `VERCEL_TOKEN` en GitHub Secrets.

---

## Verificación Post-Deployment

Una vez deployado, verifica:

### 1. **Health Check:**
```bash
curl -I https://tu-proyecto.vercel.app
```

Debe retornar `200 OK`.

### 2. **Supabase Connection:**
- Abre la consola del navegador en tu app
- Verifica que no haya error "supabaseKey is required"

### 3. **Rutas Públicas:**
Verifica que estas rutas funcionen:
- `/` - Landing
- `/demo` - Dashboard Demo
- `/auth` - Login
- `/verify` - Blockchain Verificador
- `/api` - API Docs

### 4. **Rutas Protegidas:**
- `/platform` - Debe redirigir a `/auth` si no autenticado

### 5. **Lighthouse Audit:**
```bash
npx lighthouse https://tu-proyecto.vercel.app --view
```

Target: Performance Score > 90

---

## Variables de Entorno Requeridas

⚠️ **CRÍTICO** - La app NO funcionará sin estas variables:

```bash
# Supabase
VITE_SUPABASE_URL=https://zmqcfnjltbupucswrfek.supabase.co
VITE_SUPABASE_ANON_KEY=<tu_clave_anon>

# Opcional - Analytics
VITE_LOGROCKET_APP_ID=<tu_app_id>
```

**Dónde obtener VITE_SUPABASE_ANON_KEY:**
1. Ir a https://supabase.com/dashboard/project/zmqcfnjltbupucswrfek/settings/api
2. Copiar "Project API keys" → "anon" → "public"

---

## Troubleshooting

### ❌ Pantalla Blanca
**Causa:** Variables de entorno no configuradas
**Solución:** Agregar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel

### ❌ 404 en rutas
**Causa:** Rewrites no configurados
**Solución:** Verificar que `vercel.json` existe con rewrites (ya está incluido)

### ❌ Build Failed
**Causa:** Dependencias faltantes o errores de TypeScript
**Solución:** Ejecutar `npm run build` localmente primero para verificar

### ❌ Slow Build Time
**Causa:** Dependencias pesadas
**Solución:** Ya optimizado con code splitting (17 chunks)

---

## Configuración Actual del Proyecto

**Archivos de Configuración:**
- ✅ `vercel.json` - Rewrites y headers de seguridad
- ✅ `vite.config.ts` - Build optimizado con chunks manuales
- ✅ `tsconfig.json` - TypeScript configurado
- ✅ `.gitignore` - Excluye node_modules, dist, .env

**Build Output:**
```
dist/
├── index.html (entry point)
├── assets/
│   ├── index-[hash].js (main bundle ~500KB)
│   ├── vendor-react-[hash].js (React ~130KB)
│   ├── vendor-recharts-[hash].js (Charts ~200KB)
│   ├── vendor-leaflet-[hash].js (Maps ~180KB)
│   └── ... (otros chunks)
└── manifest.json (PWA)
```

---

## Auto-Deployment

Una vez configurado el proyecto en Vercel con GitHub Integration:

✅ **Cada push a `main` = Auto-deployment a producción**
✅ **Pull Requests = Preview deployments automáticos**
✅ **Rollback fácil desde el dashboard**

---

## Soporte

- Vercel Docs: https://vercel.com/docs
- Deployment Issues: https://vercel.com/support
- CELLVI 2.0 GitHub: https://github.com/jlort1721-alt/CELLVI-2.0

---

**Última actualización:** 2026-02-16
**Commit actual:** `8f8b2af` - fix: Add optional chaining to prevent undefined errors
**Estado:** ✅ Ready for deployment
