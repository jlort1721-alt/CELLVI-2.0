# Estrategia Fase 5: Aplicación Móvil y Operaciones de Campo (PWA)

## 1. Visión General
El éxito de la logística depende de la "Última Milla". Los conductores necesitan una herramienta robusta, simple y que funcione **sin conexión a internet** en zonas remotas.
En lugar de desarrollar una App Nativa (iOS/Android) costosa y separada, transformaremos CELLVI 2.0 en una **Progressive Web App (PWA)** de alto rendimiento.

## 2. Capacidades Clave ("The Driver Experience")
### A. Instalabilidad (Add to Home Screen)
*   La app se instalará como una aplicación nativa.
*   Sin barra de navegación del navegador (Full Screen).
*   Icono propio en el escritorio del móvil.

### B. Modo Offline (Offline-First)
*   **Problema:** Los camiones pierden señal en carretera.
*   **Solución:** Service Workers cachearán la "Ruta del Día" y los mapas base.
*   **Acción:** El conductor puede marcar entregas como "Completadas" sin internet. Los datos se guardan en local (IndexedDB) y se sincronizan (Background Sync) al recuperar conexión.

### C. Notificaciones Push
*   Alertas críticas: "Cambio de Ruta", "Nueva Parada Urgente", "Mantenimiento Requerido".
*   Uso de API estándar `Notification` y `PushManager`.

## 3. Arquitectura Técnica
*   **Plugin:** `vite-plugin-pwa`.
*   **Estrategia de Caché:** `Stale-While-Revalidate` para datos de ruta (mostrar lo último conocido, actualizar en segundo plano). `CacheFirst` para assets (mapas, iconos, fuentes).
*   **UI Móvil:** Diseño "Thumb-Friendly" (Botones grandes, zonas de toque amplias) en el módulo `/driver`.

## 4. Plan de Implementación
1.  Configurar Manifiesto y Metadatos.
2.  Implementar Service Worker con Workbox.
3.  Desarrollar Interfaz de Conductor (`/driver/route`).
4.  Implementar lógica de sincronización offline (Queue de eventos).

---
**KPIs de Éxito:**
*   Tiempo de carga < 2s en 3G.
*   Funcionalidad crítica disponible en "Modo Avión".
