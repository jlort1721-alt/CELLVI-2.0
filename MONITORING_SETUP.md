# 📊 MONITORING SETUP - CELLVI 2.0

## RESUMEN

Sistema de monitoreo completo para CELLVI 2.0 usando:
- **Sentry** - Error tracking & performance
- **Vercel Analytics** - Web vitals & performance
- **Supabase Logs** - Backend monitoring
- **Custom Dashboard** - Métricas de negocio

---

## 1. SENTRY (ERROR TRACKING)

### 1.1 Instalación

```bash
npm install @sentry/react @sentry/vite-plugin
```

### 1.2 Configuración

Crear `src/lib/sentry.ts`:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://your-dsn@sentry.io/project-id",
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ["localhost", /^https:\/\/.*\.supabase\.co/],
    }),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1, // 10% de transacciones
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

En `src/main.tsx`:

```typescript
import './lib/sentry';
```

### 1.3 Performance Monitoring

```typescript
// Track slow queries
const transaction = Sentry.startTransaction({
  op: "query",
  name: "Fetch Vehicles",
});

try {
  const vehicles = await fetchVehicles();
  transaction.setStatus("ok");
} catch (e) {
  transaction.setStatus("error");
  Sentry.captureException(e);
} finally {
  transaction.finish();
}
```

---

## 2. VERCEL ANALYTICS

### 2.1 Instalación

```bash
npm install @vercel/analytics @vercel/speed-insights
```

### 2.2 Integración

En `src/main.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Analytics />
    <SpeedInsights />
  </>
);
```

### 2.3 Web Vitals Custom

```typescript
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

function sendToAnalytics({ name, delta, value, id }: any) {
  // Send to your analytics endpoint
  console.log({ name, delta, value, id });
}

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);
onFCP(sendToAnalytics);
onTTFB(sendToAnalytics);
```

---

## 3. SUPABASE MONITORING

### 3.1 Edge Functions Logs

```bash
# Ver logs en tiempo real
supabase functions logs api-gateway --follow

# Filtrar errores
supabase functions logs api-gateway --filter "level=error"
```

### 3.2 Database Monitoring

En Supabase Dashboard:
- **Logs** → Ver queries lentas
- **Database** → Performance metrics
- **API** → Request analytics

### 3.3 Alertas Automáticas

Configurar en Supabase:
- Query duration > 1s
- Error rate > 5%
- Database connections > 80%

---

## 4. CUSTOM MONITORING DASHBOARD

### 4.1 Métricas Clave

```typescript
// src/hooks/useSystemMetrics.ts
export function useSystemMetrics() {
  return useQuery({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      const [vehicles, devices, alerts, users] = await Promise.all([
        supabase.from('vehicles').select('*', { count: 'exact', head: true }),
        supabase.from('devices').select('*', { count: 'exact', head: true }),
        supabase.from('alerts').select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ]);

      return {
        totalVehicles: vehicles.count,
        activeDevices: devices.count,
        pendingAlerts: alerts.count,
        totalUsers: users.count,
        timestamp: new Date(),
      };
    },
    refetchInterval: 60000, // Cada minuto
  });
}
```

### 4.2 Dashboard Component

```typescript
export function MonitoringDashboard() {
  const { data: metrics } = useSystemMetrics();

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard
        title="Vehículos Activos"
        value={metrics?.totalVehicles}
        icon={Car}
      />
      <MetricCard
        title="Dispositivos Conectados"
        value={metrics?.activeDevices}
        icon={Cpu}
      />
      <MetricCard
        title="Alertas Pendientes"
        value={metrics?.pendingAlerts}
        icon={AlertTriangle}
        critical={metrics?.pendingAlerts > 10}
      />
      <MetricCard
        title="Usuarios Activos"
        value={metrics?.totalUsers}
        icon={Users}
      />
    </div>
  );
}
```

---

## 5. ALERTAS & NOTIFICATIONS

### 5.1 Slack Integration

```typescript
async function sendSlackAlert(message: string) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: message,
      username: 'CELLVI Monitor',
      icon_emoji: ':rotating_light:',
    }),
  });
}

// Usar en Edge Functions
if (errorRate > 5) {
  await sendSlackAlert(`⚠️ Error rate alto: ${errorRate}%`);
}
```

### 5.2 Email Alerts

```typescript
// Using Supabase Edge Functions
import { Resend } from 'resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

await resend.emails.send({
  from: 'alerts@cellvi.com',
  to: 'admin@cellvi.com',
  subject: 'Sistema de Alertas - CELLVI',
  html: `<p>Se detectaron ${alertCount} alertas críticas</p>`,
});
```

---

## 6. UPTIME MONITORING

### 6.1 UptimeRobot (Gratuito)

1. Crear cuenta en https://uptimerobot.com
2. Agregar monitores:
   - `https://cellvi.vercel.app` (HTTP)
   - `https://your-project.supabase.co/rest/v1/` (API)
   - `https://your-project.supabase.co/functions/v1/api-gateway` (Edge Function)

### 6.2 Configuración

- Check interval: 5 minutos
- Alert contacts: Email, Slack, SMS
- Public status page: Opcional

---

## 7. LOGS AGGREGATION

### 7.1 Estructura de Logs

```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    }));
  },
  error: (message: string, error?: Error, meta?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...meta,
    }));
    
    Sentry.captureException(error);
  },
};
```

### 7.2 Búsqueda de Logs

```bash
# Vercel Logs
vercel logs --app cellvi --since 1h

# Supabase Logs
supabase logs --filter "level=error" --tail 100
```

---

## 8. PERFORMANCE BUDGETS

### 8.1 Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://cellvi.vercel.app
            https://cellvi.vercel.app/platform
          budgetPath: ./budget.json
```

### 8.2 budget.json

```json
{
  "performance": 90,
  "accessibility": 95,
  "best-practices": 90,
  "seo": 90,
  "pwa": 90
}
```

---

## 9. DASHBOARD DE MONITOREO

Acceder a:

1. **Sentry**: https://sentry.io/organizations/cellvi/
2. **Vercel Analytics**: https://vercel.com/cellvi/analytics
3. **Supabase Logs**: https://supabase.com/dashboard/project/_/logs
4. **UptimeRobot**: https://uptimerobot.com/dashboard

---

## 10. MÉTRICAS A MONITOREAR

### Frontend
- ✅ Page Load Time (LCP < 2.5s)
- ✅ First Input Delay (FID < 100ms)
- ✅ Cumulative Layout Shift (CLS < 0.1)
- ✅ Error Rate (< 0.1%)
- ✅ Bounce Rate

### Backend
- ✅ API Response Time (< 200ms)
- ✅ Error Rate (< 1%)
- ✅ Database Query Time (< 100ms)
- ✅ Edge Function Cold Starts
- ✅ Webhook Success Rate (> 95%)

### Business
- ✅ Active Vehicles
- ✅ Active Devices
- ✅ Pending Alerts
- ✅ Total Users
- ✅ Daily API Calls

---

## CHECKLIST POST-SETUP

- [ ] Sentry configurado y recibiendo errores
- [ ] Vercel Analytics activo
- [ ] Supabase logs verificados
- [ ] UptimeRobot monitoreando endpoints
- [ ] Slack alerts configurados
- [ ] Email alerts configurados
- [ ] Dashboard de métricas personalizado
- [ ] Performance budgets definidos
- [ ] Lighthouse CI en GitHub Actions

---

**✅ MONITORING COMPLETADO**

Sistema de monitoreo completo para garantizar 99.9% uptime y detectar problemas proactivamente.
