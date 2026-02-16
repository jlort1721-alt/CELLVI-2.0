# 🚀 GUÍA DE DEPLOYMENT FRONTEND - CELLVI 2.0

## PRE-REQUISITOS

✅ Cuenta en Vercel/Netlify/Cloudflare Pages  
✅ Build del frontend completado  
✅ Variables de entorno configuradas  
✅ Backend deployed (Supabase)  

---

## OPCIÓN 1: VERCEL (RECOMENDADO)

### 1.1 Instalación de Vercel CLI

```bash
npm install -g vercel
```

### 1.2 Login a Vercel

```bash
vercel login
```

### 1.3 Configurar Variables de Entorno

Crear archivo `.env.production`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_WOMPI_PUBLIC_KEY=pub_prod_xxxxxx
VITE_APP_URL=https://cellvi.vercel.app
```

### 1.4 Deploy

```bash
# Build production
npm run build

# Deploy
vercel --prod
```

### 1.5 Configuración en Vercel Dashboard

1. Ir a https://vercel.com/dashboard
2. Seleccionar proyecto CELLVI
3. Settings → Environment Variables
4. Agregar todas las variables del `.env.production`
5. Settings → Domains → Agregar dominio custom (opcional)

---

## OPCIÓN 2: NETLIFY

### 2.1 Instalación de Netlify CLI

```bash
npm install -g netlify-cli
```

### 2.2 Login y Deploy

```bash
netlify login
netlify init
netlify deploy --prod
```

### 2.3 netlify.toml

Crear en la raíz:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

---

## OPCIÓN 3: CLOUDFLARE PAGES

### 3.1 Deploy via CLI

```bash
npx wrangler pages deploy dist
```

### 3.2 Configuración

- Framework Preset: Vite
- Build Command: `npm run build`
- Build Output Directory: `dist`

---

## POST-DEPLOYMENT CHECKLIST

- [ ] Verificar que todas las rutas funcionan
- [ ] Probar PWA install en móvil
- [ ] Verificar Service Worker activo
- [ ] Confirmar conexión a Supabase
- [ ] Probar login/registro
- [ ] Verificar WebSockets (Realtime)
- [ ] Probar notificaciones push
- [ ] Revisar Lighthouse score (>90)
- [ ] Configurar dominio custom
- [ ] Configurar SSL/HTTPS
- [ ] Agregar a Google Search Console
- [ ] Configurar analytics (opcional)

---

## OPTIMIZACIONES POST-DEPLOYMENT

### Comprimir Assets

```bash
npm install -D vite-plugin-compression
```

Agregar a `vite.config.ts`:

```typescript
import viteCompression from 'vite-plugin-compression';

plugins: [
  viteCompression({ algorithm: 'gzip' }),
  viteCompression({ algorithm: 'brotliCompress' }),
]
```

### CDN Configuration

Configurar Cloudflare CDN:
- Habilitar Auto Minify (JS, CSS, HTML)
- Habilitar Brotli compression
- Cache TTL: 1 month para assets

---

## MONITOREO POST-DEPLOYMENT

### 1. Vercel Analytics

```bash
npm install @vercel/analytics
```

En `src/main.tsx`:

```typescript
import { inject } from '@vercel/analytics';
inject();
```

### 2. Error Tracking con Sentry

```bash
npm install @sentry/react @sentry/vite-plugin
```

### 3. Web Vitals Monitoring

```bash
npm install web-vitals
```

---

## ROLLBACK EN CASO DE PROBLEMAS

### Vercel

```bash
vercel rollback
```

### Netlify

```bash
netlify deploy --alias previous-version
```

---

## DNS CONFIGURATION (Dominio Custom)

### Ejemplo: cellvi.com

```
Type    Name    Value                   TTL
A       @       76.76.21.21            3600
CNAME   www     cellvi.vercel.app      3600
TXT     @       vercel-verify=xxx      3600
```

---

## SSL/HTTPS

Todos los providers (Vercel, Netlify, Cloudflare) proveen SSL automático via Let's Encrypt.

Para dominio custom:
- Vercel: Automático
- Netlify: Automático
- Cloudflare: Requiere configurar Universal SSL

---

## PERFORMANCE TARGETS

| Métrica | Target | Actual |
|---------|--------|--------|
| First Contentful Paint | <1.8s | TBD |
| Largest Contentful Paint | <2.5s | TBD |
| Total Blocking Time | <200ms | TBD |
| Cumulative Layout Shift | <0.1 | TBD |
| Speed Index | <3.4s | TBD |
| Lighthouse Score | >90 | TBD |

---

**✅ DEPLOYMENT COMPLETADO**

Frontend de CELLVI 2.0 desplegado y funcionando en producción.
