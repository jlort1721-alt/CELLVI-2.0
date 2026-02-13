# Estrategia API & Integración - CELLVI 2.0
**Autor:** Head of Engineering
**Fecha:** Febrero 2026
**Versión:** 1.0

## 1. Filosofía "API-First"

CELLVI 2.0 no es solo una plataforma visual; es un motor de datos telemáticos. Cualquier funcionalidad disponible en el Frontend (Dashboard) DEBE estar disponible primero vía API. Esto permite a nuestros clientes grandes (Enterprise) integrar CELLVI en sus propios ERPs (SAP, Oracle, Odoo) sin depender de nuestra interfaz.

---

## 2. Estándares de Diseño

*   **Protocolo:** RESTful sobre HTTPS.
*   **Formato de Datos:** JSON (snake_case para propiedades).
*   **Autenticación:**
    *   **Clientes:** API Keys (X-API-KEY) para scripts servidor-servidor.
    *   **Usuarios:** Bearer Token (JWT) vía OAuth2.
*   **Versionamiento:** En URL (e.g., `https://api.cellvi.com/v1/...`).
*   **Rate Limiting:**
    *   Standard: 100 req/min.
    *   Enterprise: 1000 req/min.
    *   Burst: Permitido por 10s.

---

## 3. Webhooks & Eventos en Tiempo Real

Para evitar que los clientes hagan polling (`GET /vehicles` cada 5 segundos), implementamos un sistema robusto de Webhooks.

### 3.1. Suscripción a Eventos
Los clientes pueden registrar URLs para recibir notificaciones `POST` inmediatas:

| Evento | Trigger | Payload Ejemplo |
|--------|---------|-----------------|
| `alert.created` | Exceso de velocidad, SOS, Choque | `{ "type": "speeding", "lat": 4.5, "speed": 120 }` |
| `geofence.enter` | Vehículo entra a zona segura | `{ "geo_id": "fabrica", "time": "2026-02-12T..." }` |
| `sensor.threshold` | Temperatura < -10°C | `{ "sensor": "frigo_1", "value": -12.5 }` |

### 3.2. Seguridad de Webhooks
*   **Firma HMAC-SHA256:** Cada request incluye un header `X-Cellvi-Signature`. El cliente usa su `webhook_secret` para verificar que CELLVI es quien envía los datos.
*   **Reintentos:** Exponential backoff (1s, 5s, 30s, 5m) si el servidor del cliente responde 5xx.

---

## 4. Endpoints Principales (Roadmap v1)

### Fleet API
*   `GET /fleet/vehicles`: Listado con última posición conocida.
*   `GET /fleet/vehicles/{id}/history`: Histórico de viajes (GeoJSON).
*   `POST /fleet/commands`: Enviar comando remoto (apagar motor, abrir candado).

### Compliance API
*   `GET /compliance/runt/certificates`: Descargar PDFs de transmisión al RUNT.
*   `GET /compliance/evidence/{trip_id}`: Descargar paquete de "Verdad Inmutable".

---

## 5. Integraciones Nativas (Marketplace)

CELLVI 2.0 incluirá adaptadores pre-construidos ("Connectors") para:

1.  **Sistemas de Carga:**
    *   Integración con RISTRA (MinTransporte).
    *   Integración con SICE-TAC.
2.  **ERPs Logísticos:**
    *   SAP TM (Transportation Management).
    *   Oracle NetSuite.
3.  **Seguridad Pública:**
    *   Red de Apoyo Policía Nacional (via XML/SOAP legacy bridge).

---

## 6. Documentación para Desarrolladores

Usaremos **OpenAPI 3.0 (Swagger)** para generar documentación interactiva:
*   Portal de desarrolladores: `developers.cellvi.com`
*   SDKs oficiales: Python, Node.js, PHP.
*   Mock Server: Para que los clientes prueben antes de comprar.
