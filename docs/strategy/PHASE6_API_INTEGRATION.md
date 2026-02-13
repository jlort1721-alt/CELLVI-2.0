# Estrategia Fase 6: API Gateway & Integración Externa (Enterprise Connect)

## 1. Visión General
En el ecosistema logístico, CELLVI 2.0 no es una isla. Debe conectarse con:
*   **ERPs Corporativos:** SAP, Oracle, Microsoft Dynamics (para importar pedidos).
*   **eCommerce:** Shopify, VTEX, Magento (para generar envíos automáticos).
*   **Clientes Finales:** Webhooks para notificar "Tu pedido está cerca".

Transformaremos nuestra arquitectura interna en una **API Pública Segura y Documentada**.

## 2. Arquitectura de Integración
Usaremos **Supabase Edge Functions** como fachada (API Gateway) para proteger la base de datos directa.

### A. Endpoints Públicos (REST RESTful)
*   `POST /v1/orders/create`: Crear un envío desde un sistema externo.
*   `GET /v1/tracking/:tracking_number`: Consultar estado sin autenticación de usuario (solo Token de Rastreo).
*   `POST /v1/webhooks/subscribe`: Registrar una URL para recibir eventos.

### B. Seguridad (API Keys)
*   Implementación de `API Keys` por Tenant.
*   Rate Limiting (100 req/min) usando Redis o Edge Config para evitar DDOS.
*   Validación de Schema con `Zod` en el Edge.

## 3. Webhooks (Event-Driven)
Cuando un evento ocurre en CELLVI (ej: "Entrega Completada"), el sistema disparará un POST a la URL del cliente.
*   **Eventos:** `ORDER_CREATED`, `DRIVER_ASSIGNED`, `NEARBY`, `DELIVERED`, `EXCEPTION`.
*   **Retry Policy:** Exponential Backoff si el servidor del cliente falla.

## 4. Documentación (Developer Experience)
*   **OpenAPI 3.0 (Swagger):** Especificación estándar.
*   **Portal de Desarrolladores:** Página `/developers` con guías y ejemplos `curl`.

## 5. Plan de Implementación
1.  Diseñar especificación OpenAPI (`docs/api/openapi.yaml`).
2.  Crear Edge Function `api-gateway` para enrutar y validar API Keys.
3.  Implementar sistema de Webhooks (Tabla `webhook_subscriptions` + Edge Function `webhook-dispatcher`).
4.  Publicar Portal de Desarrolladores.

---
**KPI de Éxito:**
*   Tiempo de integración de un cliente nuevo < 2 horas.
*   Latencia de Webhooks < 5 segundos desde el evento real.
