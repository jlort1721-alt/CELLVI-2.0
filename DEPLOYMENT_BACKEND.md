# 🚀 GUÍA DE DEPLOYMENT BACKEND - CELLVI 2.0

## PRE-REQUISITOS

✅ Cuenta Supabase activa
✅ Supabase CLI instalado (`npm install -g supabase`)
✅ Cuenta Wompi (https://comercios.wompi.co)
✅ Git repository configurado

## PASO 1: CONFIGURAR VARIABLES DE ENTORNO

### 1.1 Variables de Wompi (Obtener de Wompi Dashboard)

```bash
# Producción
supabase secrets set WOMPI_PUBLIC_KEY="pub_prod_xxxxxxxxxxxxxxxx"
supabase secrets set WOMPI_PRIVATE_KEY="prv_prod_xxxxxxxxxxxxxxxx"
supabase secrets set WOMPI_EVENT_SECRET="prod_events_xxxxxxxxxxxxxxxx"

# URL de la aplicación
supabase secrets set APP_URL="https://cellvi.com"

# Desarrollo (opcional)
supabase secrets set DEV_ORIGIN="http://localhost:8080"
```

### 1.2 Verificar secrets

```bash
supabase secrets list
```

Debe mostrar:
```
WOMPI_PUBLIC_KEY
WOMPI_PRIVATE_KEY
WOMPI_EVENT_SECRET
APP_URL
DEV_ORIGIN
SUPABASE_URL (auto)
SUPABASE_SERVICE_ROLE_KEY (auto)
```

## PASO 2: APLICAR MIGRACIONES SQL

```bash
# Conectar a tu proyecto
supabase link --project-ref your-project-ref

# Aplicar migraciones
supabase db push

# Verificar que las tablas existen
supabase db status
```

**Migraciones que se aplicarán**:
1. `20260216000001_webhook_system.sql` - Webhooks (3 tablas)
2. `20260216000002_colombian_payments.sql` - Payments (3 tablas)

**Verificación**: Debe mostrar todas las tablas sin errores

## PASO 3: DEPLOY EDGE FUNCTIONS

### 3.1 Deploy API Gateway

```bash
cd supabase/functions
supabase functions deploy api-gateway --no-verify-jwt

# Verificar
curl https://your-project.supabase.co/functions/v1/api-gateway/billing/plans \
  -H "x-api-key: your-test-api-key"
```

### 3.2 Deploy Wompi Payments

```bash
supabase functions deploy wompi-payments --no-verify-jwt

# Verificar
curl https://your-project.supabase.co/functions/v1/wompi-payments/webhook \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### 3.3 Deploy Neural Chat

```bash
supabase functions deploy neural-chat

# Verificar (requiere JWT)
curl https://your-project.supabase.co/functions/v1/neural-chat \
  -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

### 3.4 Deploy RNDC Sync

```bash
supabase functions deploy rndc-sync

# Verificar (requiere JWT)
curl https://your-project.supabase.co/functions/v1/rndc-sync \
  -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"trip_id": "test"}'
```

### 3.5 Verificar todos los deployments

```bash
supabase functions list
```

Debe mostrar:
```
api-gateway (deployed)
wompi-payments (deployed)
neural-chat (deployed)
rndc-sync (deployed)
```

## PASO 4: CONFIGURAR WOMPI WEBHOOKS

1. Ir a https://comercios.wompi.co/settings/webhooks
2. Agregar nueva URL de webhook:
   ```
   https://your-project.supabase.co/functions/v1/wompi-payments/webhook
   ```
3. Seleccionar eventos:
   - ✅ transaction.updated
   - ✅ transaction.approved
   - ✅ transaction.declined
   - ✅ transaction.voided
4. Guardar
5. Hacer transacción de prueba con Wompi Sandbox

## PASO 5: CREAR TENANT DE PRUEBA

```sql
-- Ejecutar en Supabase SQL Editor
INSERT INTO tenants (name, status, api_key)
VALUES (
  'Empresa de Prueba',
  'active',
  encode(gen_random_bytes(32), 'hex')
)
RETURNING *;
```

Copiar el `api_key` generado para pruebas.

## PASO 6: CORRER INTEGRATION TESTS

```bash
cd supabase/functions/api-gateway

# Configurar variables de test
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Correr tests
deno test --allow-net --allow-env __tests__/integration.test.ts
```

**Resultado esperado**: 25 tests passed, 0 failed

## PASO 7: TESTING MANUAL

### 7.1 Test API Gateway

```bash
# Listar vehículos
curl https://your-project.supabase.co/functions/v1/api-gateway/vehicles \
  -H "x-api-key: YOUR_API_KEY"

# Crear vehículo
curl https://your-project.supabase.co/functions/v1/api-gateway/vehicles \
  -X POST \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "plate": "ABC123",
    "brand": "Chevrolet",
    "model": "NPR",
    "year": 2023,
    "vehicle_type": "truck",
    "status": "active"
  }'
```

### 7.2 Test Billing

```bash
# Listar planes
curl https://your-project.supabase.co/functions/v1/api-gateway/billing/plans \
  -H "x-api-key: YOUR_API_KEY"

# Ver usage
curl https://your-project.supabase.co/functions/v1/api-gateway/billing/usage \
  -H "x-api-key: YOUR_API_KEY"
```

### 7.3 Test Wompi (Sandbox)

```bash
# Crear pago PSE de prueba
curl https://your-project.supabase.co/functions/v1/wompi-payments \
  -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "currency": "COP",
    "payment_method": "pse",
    "customer_email": "test@example.com",
    "pse_bank_code": "1007",
    "pse_user_type": "NATURAL",
    "pse_user_legal_id": "1234567890",
    "pse_user_legal_id_type": "CC"
  }'
```

## PASO 8: MONITOREO POST-DEPLOYMENT

### 8.1 Verificar Logs

```bash
# Ver logs en tiempo real
supabase functions logs api-gateway --follow

# Ver logs de Wompi
supabase functions logs wompi-payments --follow
```

### 8.2 Dashboard de Supabase

1. Ir a https://supabase.com/dashboard
2. Seleccionar proyecto
3. Verificar:
   - ✅ Database > Tables (debe ver 40+ tablas)
   - ✅ Edge Functions (4 functions deployed)
   - ✅ Logs (sin errores críticos)
   - ✅ API > Settings (verificar API keys)

### 8.3 Métricas a Monitorear

- Response times (target: <100ms)
- Error rate (target: <1%)
- Webhook deliveries (success rate >95%)
- Database connections
- Storage usage

## CHECKLIST FINAL

- [ ] Variables de entorno configuradas
- [ ] Migraciones aplicadas (2)
- [ ] Edge Functions deployed (4)
- [ ] Wompi webhook configurado
- [ ] Tenant de prueba creado
- [ ] Integration tests passing (25/25)
- [ ] Tests manuales exitosos
- [ ] Logs sin errores críticos
- [ ] Monitoreo configurado

## ROLLBACK (En caso de problemas)

```bash
# Revertir edge function específica
supabase functions deploy api-gateway --version PREVIOUS_VERSION

# Revertir migración
supabase db reset

# Ver versiones disponibles
supabase db branches list
```

## SOPORTE

- Documentación Supabase: https://supabase.com/docs
- Documentación Wompi: https://docs.wompi.co
- Logs: `supabase functions logs FUNCTION_NAME`
- Status: https://status.supabase.com

---

**✅ DEPLOYMENT COMPLETADO**

Una vez completados todos los pasos, el backend de CELLVI 2.0 estará **100% funcional en producción**.
