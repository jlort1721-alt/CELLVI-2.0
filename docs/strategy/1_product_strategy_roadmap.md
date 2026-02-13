# Estrategia de Producto y Roadmap - CELLVI 2.0
**Autor:** Chief Product Officer (CPO)
**Fecha:** Febrero 2026
**Versión:** 1.0

## 1. Problemas del Mercado y Soluciones

Identificamos brechas críticas en el mercado de telemática B2B en Colombia y LATAM que CELLVI 2.0 resuelve directamente.

| # | Problema del Mercado | Solución CELLVI 2.0 |
|---|----------------------|----------------------|
| 1 | **Datos no confiables:** Los clientes desconfían de la data GPS cruda por ser manipulable. | **The Truth Layer:** Evidencia firmada criptográficamente (SHA-256) desde la ingesta. |
| 2 | **Conectividad intermitente:** Pérdida de visibilidad en zonas rurales/mineras. | **Connectivity Autopilot:** Conmutación automática celular/satelital sin intervención. |
| 3 | **Silos de información:** El GPS no habla con el ERP ni con RISTRA/RUNT. | **API-First & Webhooks:** Integración nativa bidireccional con ecosistema empresarial. |
| 4 | **Falsos positivos de seguridad:** Exceso de alertas "basura" fatiga a los operadores. | **IA Contextual:** Filtrado de alertas basado en patrones históricos y validación de video. |
| 5 | **Fraude de combustible:** Robo "hormiga" indetectable por sistemas tradicionales. | **Algoritmos de Anomalía:** Detección de caídas abruptas correlacionadas con paradas no autorizadas. |
| 6 | **Cumplimiento legal complejo:** Dificultad para cumplir Ley 1581, PESV y RISTRA. | **Compliance Hub:** Módulo dedicado que automatiza la generación de evidencias legales. |
| 7 | **Cadena de frío rota:** Rechazos de carga por falta de evidencia de temperatura. | **Blockchain Cold Chain:** Registro inmutable de temperatura cada 30s. |
| 8 | **Interfaz obsoleta:** UX de "año 2000" difícil de usar para nuevos operadores. | **Modern UI/UX:** Interfaz React reactiva, modo oscuro, atajos de teclado. |
| 9 | **Soporte reactivo:** El proveedor solo aparece cuando algo falla gravemente. | **Soporte Proactivo:** Monitoreo de salud de dispositivos y notificación antes de falla. |
| 10 | **Costos ocultos:** Facturación sorpresa por excesos de consumo o roaming. | **Transparent Billing:** Control de consumo en tiempo real y planes planos. |

---

## 2. Personas y Control de Acceso (RBAC)

Definimos roles granulares para garantizar la seguridad operativa y el principio de menor privilegio.

*   **Super Admin (ASEGURAR):** Acceso total al sistema, gestión de tenants, facturación global.
*   **Fleet Manager (Cliente):** Visibilidad total de su flota, configuración de reglas, usuarios y reportes.
*   **Monitorista / Operador:** Acceso al Command Center, gestión de alertas en tiempo real. *No puede borrar data.*
*   **Conductor:** Acceso solo a App Móvil (mis rutas, mi score, botón de pánico).
*   **Auditor / HSEQ:** Acceso de solo lectura a reportes de cumplimiento, logs de auditoría y evidencia.
*   **Instalador:** Acceso temporal para pruebas de sensores y validación de instalación en campo.

---

## 3. Módulos del Producto

### 3.1. Command Center (Núcleo)
*   **Historia de Usuario:** "Como operador, quiero ver todas las alertas críticas en una sola pantalla para reaccionar en <1 minuto."
*   **Criterios de Aceptación:**
    *   Mapa en tiempo real con clustering.
    *   Panel de incidentes priorizados por severidad.
    *   Feed de video bajo demanda.

### 3.2. Fleet Management
*   **Historia de Usuario:** "Como gerente, quiero ver el costo por kilómetro de cada vehículo para optimizar mantenimiento."
*   **Criterios:**
    *   Hoja de vida del vehículo (virtual).
    *   Gestión de mantenimientos preventivos.
    *   Score de conducción.

### 3.3. Evidence & Compliance (Diferenciador)
*   **Historia de Usuario:** "Como auditor, quiero descargar un certificado de ruta inmutable para presentar ante la aseguradora."
*   **Criterios:**
    *   Sellado de tiempo (Time-stamping).
    *   Exportación de paquetes de evidencia verificables offline.
    *   Integración RISTRA/RUNT.

### 3.4. Security & Anti-Jamming
*   **Historia de Usuario:** "Como jefe de seguridad, quiero saber si un vehículo está siendo jammneado para activar protocolo de recuperación."
*   **Criterios:**
    *   Detección de pérdida de señal GNSS anómala.
    *   Bloqueo de motor preventivo.

### 3.5. Logistics & Routing
*   **Historia de Usuario:** "Como despachador, quiero asignar rutas y geocercas automáticamente según el manifiesto de carga."

---

## 4. Diferenciadores Clave

1.  **Truth Layer:** No solo mostramos puntos en un mapa; garantizamos que esos puntos son reales y no han sido alterados. Usamos criptografía para firmar cada evento crítico.
2.  **Connectivity Autopilot:** El cliente no se preocupa por qué SIM card usar o si hay señal satelital. El sistema elige la mejor ruta de comunicación costo/efectiva automáticamente.
3.  **Policy Engine:** Motor de reglas "If This Then That" para operaciones logísticas. (Ej: "Si temperatura > 5°C Y está en zona roja -> Alerta Crítica + Video").

---

## 5. Requerimientos No Funcionales

*   **Disponibilidad:** 99.9% uptime garantizado por SLA (créditos si falla).
*   **Latencia:** < 2 segundos desde el evento real hasta la pantalla del operador (red celular).
*   **Escalabilidad:** Arquitectura capaz de soportar 100,000 activos concurrentes sin degradación.
*   **Seguridad:** Encriptación AES-256 en reposo y TLS 1.3 en tránsito.
*   **Retención:** Hot storage (3 meses), Warm storage (1 año), Cold storage (5 años para auditoría).

---

## 6. KPIs y Métricas de Éxito

### De Negocio
*   **MRR (Monthly Recurring Revenue):** Crecimiento mensual del 15%.
*   **Churn Rate:** < 2% anual (retención agresiva por valor agregado).
*   **ARPU (Average Revenue Per User):** Aumentar mediante Add-ons (Video, Satélite).

### De Producto
*   **Time-to-React:** Tiempo promedio desde alerta hasta acción del operador (< 2 min).
*   **System Uptime:** Mantener > 99.9%.
*   **False Positive Rate:** Reducir alertas basura a < 5% del total.

---

## 7. Roadmap a 5 Años

### Año 1: Fundamentos y Paridad Competitiva (Market Catch-up + Innovation)
*   **Q1:** Lanzamiento CELLVI 2.0 MVP (Core Tracking, Alertas, Reportes Básicos). Migración clientes legacy.
*   **Q2:** Módulo de Evidencia Digital (Truth Layer v1) y App Móvil Conductores.
*   **Q3:** Integración Hardware de Video IA (Dashcams) y Módulo de Combustible avanzado.
*   **Q4:** API Pública v1 y Marketplace de Integraciones (RISTRA, SAP).

### Año 2: Escala y Diferenciación IA
*   Predictive Maintenance con IA.
*   Computer Vision en Edge para detección de fatiga avanzada.
*   Expansión regional (Ecuador, Perú).

### Año 3: Ecosistema y Plataforma Abierta
*   CELLVI App Store (Developers tiers).
*   Hardware propio / Firmware customizado para ultra-seguridad.

### Años 4-5: Liderazgo y Nuevos Horizontes
*   Integración con V2X (Vehicle-to-Everything) y Smart Cities.
*   Automatización logística autónoma.
