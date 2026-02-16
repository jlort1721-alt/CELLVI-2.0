# 🚀 Instrucciones de Deployment - CELLVI 2.0

**Fecha**: 16 de Febrero 2026
**Estado**: Listo para producción
**Última actualización**: Commit 562c9d8

---

## ✅ Estado Actual del Proyecto

### Lo que YA está listo:

- [x] **Código pusheado a GitHub** - Branch `main` actualizado
- [x] **Build de producción** - Funcionando correctamente (17s, 4.5 MB)
- [x] **E2E Tests** - 4/4 pasando al 100% en Chromium
- [x] **Optimizaciones completas** - DashboardAdmin dividido, skeleton loaders, push notifications
- [x] **Documentación completa** - Deployment, security, monitoring

### Lo que FALTA (requiere intervención manual):

- [ ] **Deployment a Vercel/Netlify** - Requiere autenticación manual
- [ ] **Lighthouse en producción** - Se ejecutará post-deployment
- [ ] **Configuración de variables de entorno** - En plataforma de deployment

---

## 🎯 Opciones de Deployment

### Opción 1: Vercel (Recomendado) ⭐

**Por qué Vercel:**
- Integración perfecta con React/Vite
- Auto-deploy desde GitHub
- CDN global automático
- SSL gratis
- Preview deployments por cada PR

**Pasos para deployment:**

```bash
# 1. Login a Vercel (requiere navegador)
vercel login

# 2. Link el proyecto
vercel link

# 3. Configurar variables de entorno en el dashboard de Vercel:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - (otras variables según .env.example)

# 4. Deploy a producción
vercel --prod

# 5. Nota: El deployment aparecerá en:
# https://cellvi-2-0.vercel.app (o tu dominio custom)
```

**Variables de entorno requeridas:**
- `VITE_SUPABASE_URL`: URL de tu proyecto Supabase
- `VITE_SUPABASE_ANON_KEY`: Anon key de Supabase
- `VITE_VAPID_PUBLIC_KEY`: Clave pública VAPID para push notifications (opcional)

**Configuración automática desde GitHub:**

1. Ve a [https://vercel.com/new](https://vercel.com/new)
2. Importa el repositorio: `jlort1721-alt/CELLVI-2.0`
3. Configura las variables de entorno
4. Click "Deploy"
5. ✅ Vercel automáticamente:
   - Detecta `vercel.json` y configura el framework
   - Ejecuta `npm run build`
   - Deploya a producción
   - Configura auto-deploy en cada push a `main`

---

### Opción 2: Netlify

**Por qué Netlify:**
- Excelente para static sites
- CI/CD integrado
- Deploy previews automáticos
- Forms y functions gratis

**Pasos para deployment:**

```bash
# 1. Instalar Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Inicializar proyecto
netlify init

# 4. Deploy
netlify deploy --prod --build
```

**Configuración desde GitHub:**

1. Ve a [https://app.netlify.com/start](https://app.netlify.com/start)
2. Conecta con GitHub
3. Selecciona el repo `CELLVI-2.0`
4. Configura:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Agregar variables de entorno en Settings → Environment
6. Deploy!

---

### Opción 3: Cloudflare Pages

**Por qué Cloudflare:**
- Edge network global ultrarrápido
- Gratis para proyectos unlimited
- Workers integration

**Pasos:**

1. Ve a [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. Pages → Create a project
3. Conecta GitHub repo
4. Framework preset: `Vite`
5. Build command: `npm run build`
6. Build output: `dist`
7. Deploy!

---

## 🔧 Post-Deployment Checklist

Una vez deployado a producción, ejecutar:

### 1. Verificar que el sitio carga correctamente

```bash
# Reemplazar con tu URL de producción
curl -I https://cellvi-2-0.vercel.app

# Debería retornar 200 OK
```

### 2. Ejecutar Lighthouse en producción

```bash
# Lighthouse performance audit
lighthouse https://cellvi-2-0.vercel.app \
  --output=html \
  --output=json \
  --output-path=./lighthouse-production \
  --only-categories=performance,accessibility,best-practices,seo \
  --view

# Objetivo: Score >90 en performance
```

### 3. Ejecutar E2E tests contra producción

```bash
# Actualizar playwright.config.ts base URL
# use: { baseURL: 'https://cellvi-2-0.vercel.app' }

npx playwright test --project=chromium
```

### 4. Verificar PWA funciona

- Abrir en Chrome
- DevTools → Application → Service Workers
- Verificar que SW está activo
- Probar "Install app" prompt

### 5. Verificar Analytics

Si configuraste Vercel Analytics:
- Ve a Vercel Dashboard → Analytics
- Verifica que está rastreando visitas

Si configuraste Sentry:
```bash
# Trigger error de prueba
# (remover en producción)
console.error('Test error for Sentry');
```

---

## 📊 Métricas Esperadas en Producción

### Lighthouse Scores (Objetivo)

| Métrica | Target | Justificación |
|---------|--------|---------------|
| **Performance** | >90 | Bundle optimizado, lazy loading |
| **Accessibility** | >90 | Skeleton loaders, ARIA labels |
| **Best Practices** | >95 | Headers de seguridad, HTTPS |
| **SEO** | >90 | Meta tags, sitemap |

### Core Web Vitals

| Métrica | Target | Actual Estimado |
|---------|--------|-----------------|
| **LCP** | <2.5s | ~1.8s |
| **FID** | <100ms | ~50ms |
| **CLS** | <0.1 | ~0.05 |

### Bundle Performance

- Initial load: ~1.1 MB (gzipped)
- Time to Interactive: <3.5s
- First Contentful Paint: <1.8s

---

## 🔐 Variables de Entorno

**CRÍTICO**: Configurar estas variables en la plataforma de deployment ANTES del primer deploy:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Push Notifications (opcional)
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key

# Google Maps (si se usa)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Analytics (opcional)
VITE_SENTRY_DSN=your-sentry-dsn
VITE_GA_TRACKING_ID=your-google-analytics-id
```

**Dónde configurarlas:**

**Vercel:**
- Dashboard → Project Settings → Environment Variables
- O usa `vercel env add VARIABLE_NAME`

**Netlify:**
- Site settings → Build & deploy → Environment → Environment variables

**Cloudflare:**
- Workers & Pages → Settings → Environment variables

---

## 🚨 Troubleshooting

### Problema: Build falla en deployment

**Solución:**
```bash
# Verificar localmente que el build funciona
npm run build

# Verificar versión de Node en deployment
# Agregar .nvmrc con versión correcta
echo "20.19.6" > .nvmrc
git add .nvmrc && git commit -m "Add .nvmrc" && git push
```

### Problema: Variables de entorno no se cargan

**Solución:**
- Verifica que las variables empiecen con `VITE_` (requerido por Vite)
- Reinicia el deployment después de agregar variables
- En desarrollo, usa archivo `.env.local` (NO commitear)

### Problema: Service Worker no se actualiza

**Solución:**
```bash
# Incrementar versión en package.json
npm version patch

# Force reload en navegador
# Chrome: Shift + Ctrl + R (Windows) o Shift + Cmd + R (Mac)

# O desregistrar SW manualmente
# DevTools → Application → Service Workers → Unregister
```

### Problema: Lighthouse NO_FCP en producción

**Solución:**
```bash
# Ejecutar Lighthouse sin --headless
lighthouse https://your-url.com --view

# O usar PageSpeed Insights
https://pagespeed.web.dev/?url=https://your-url.com
```

---

## ⚡ Optimizaciones Post-Deployment

Una vez en producción, considerar:

### 1. Lazy load Three.js (Ahorra 796 KB)
```typescript
// DashboardOverview.tsx
const DigitalTwinViewer = lazy(() =>
  import('@/features/digital-twin/DigitalTwinViewer')
);
```

### 2. Lazy load PDF Export (Ahorra 568 KB)
```typescript
// ReportsPage.tsx
const generatePDF = async () => {
  const { default: html2canvas } = await import('html2canvas');
  const { default: jsPDF } = await import('jspdf');
  // ...
};
```

### 3. Optimizar imágenes a WebP
```bash
# Convertir JPGs a WebP
npx @squoosh/cli --webp '{"quality":80}' public/*.jpg
```

**Impacto esperado**: Reducción de ~1.5 MB en bundle inicial

---

## 📝 Comandos Útiles

```bash
# Ver status de deployment
vercel ls

# Ver logs de producción
vercel logs cellvi-2-0 --prod

# Rollback a deployment anterior
vercel rollback

# Crear alias/dominio custom
vercel alias set cellvi-2-0.vercel.app cellvi.com

# Ver builds en Netlify
netlify status
netlify deploy --prod

# Ver analytics
vercel analytics cellvi-2-0
```

---

## 🎉 Resultado Esperado

Después de seguir estos pasos:

✅ **Sitio en producción**: https://cellvi-2-0.vercel.app
✅ **Auto-deploy**: Cada push a `main` → deploy automático
✅ **SSL/HTTPS**: Configurado automáticamente
✅ **CDN Global**: Latencia <100ms worldwide
✅ **Lighthouse >90**: Performance optimizado
✅ **PWA Funcional**: Installable, offline-ready
✅ **Monitoring**: Errors rastreados en Sentry

---

## 📞 Soporte

**Documentación relacionada:**
- [DEPLOYMENT_FRONTEND.md](./DEPLOYMENT_FRONTEND.md) - Guía detallada
- [DEPLOYMENT_BACKEND.md](./DEPLOYMENT_BACKEND.md) - Deployment de Supabase Functions
- [MONITORING_SETUP.md](./MONITORING_SETUP.md) - Configurar analytics
- [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) - Security best practices

**Enlaces útiles:**
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com/)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse)

---

**Última verificación**: 16 de Febrero 2026
**Build hash**: 562c9d8
**Status**: ✅ Ready for production deployment
