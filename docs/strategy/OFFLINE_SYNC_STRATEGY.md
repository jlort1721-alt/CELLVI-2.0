# Estrategia de Sincronización Offline "Field-Proof"

Este documento define la arquitectura para garantizar operatividad total en zonas sin conectividad (Zona Muerta), superando las limitaciones del caché optimista.

## 1. Arquitectura de Datos Local (Client-Side)
En lugar de confiar en la memoria RAM (React Query Cache), utilizaremos **Persistencia Durable** en el dispositivo móvil.

*   **Motor:** `IndexedDB` (vía `idb-keyval` o adaptador de TanStack Persister).
*   **Esquema Local:**
    *   `inspect_drafts`: Borradores en progreso.
    *   `outbox_queue`: Inspecciones finalizadas pendientes de envío.
    *   `sync_metadata`: Marcas de tiempo de última sincronización.

## 2. Patrón "Outbox" (Cola de Salida)
Cuando el usuario da clic en "Enviar" sin red:
1.  **NO** se llama a la API.
2.  El objeto JSON se guarda en `outbox_queue` con estado `PENDING`.
3.  La UI muestra: "Guardado en Dispositivo (Pendiente de Nube)".
4.  Un `ServiceWorker` o `SyncManager` (hook de React) escucha el evento `navigator.onLine`.

## 3. Resolución de Conflictos (Concurrency Control)
¿Qué pasa si dos conductores editan el mismo vehículo?

### Estrategia: "Last-Write-Wins" con Auditoría
Dado que las inspecciones son eventos puntuales en el tiempo (Logs), rara vez se editan *hacia atrás*.
*   **Regla:** Si `server_updated_at > local_updated_at`, gana el servidor.
*   **Excepción:** Si es una *Nueva Inspección* (INSERT), siempre se acepta, generando un UUID nuevo si hay colisión (extremadamente raro con v4).

### Flujo de Sync (Pseudo-código)
```typescript
async function syncOutbox() {
  const pendingItems = await db.outbox.getAll();
  
  for (const item of pendingItems) {
    try {
      // Intento de envío idempotente
      const response = await api.post('/inspections', item.payload, {
        headers: { 'Idempotency-Key': item.id } 
      });
      
      // Si éxito:
      await db.outbox.delete(item.id);
      
    } catch (error) {
      if (error.status === 409) { // Conflicto
         // Mover a "Conflictos Manuales" para revisión humana
         await db.conflicts.add(item);
         await db.outbox.delete(item.id);
      } else {
         // Reintentar luego (Backoff)
         await db.outbox.update(item.id, { retries: item.retries + 1 });
      }
    }
  }
}
```

## 4. Manejo de Adjuntos (Fotos)
Las fotos en campo pueden pesar 5MB+. Subirlas en Base64 falla.
*   **Estrategia:** Blob Storage Local.
*   Al capturar foto: Guardar `Blob` en IndexedDB.
*   Al sincronizar:
    1.  Subir foto a Supabase Storage (`multipart/form-data`).
    2.  Obtener URL pública/privada.
    3.  Reemplazar `blob_local` por `url_remota` en el JSON de la inspección.
    4.  Enviar JSON final.

## 5. Pruebas de Certificación (QA Offline)
*   **Caso A:** "Modo Avión Completo". Llenar, firmar, cerrar app. Reabrir. (Debe persistir).
*   **Caso B:** "Falso Positivo de Red". Conexión inestable (packet loss 50%). El sistema debe reintentar sin duplicar.
*   **Caso C:** "Storage Lleno". Manejo elegante de `QuotaExceededError`.

---
**Estado de Implementación:**
*   Backend: Listo (Soporta Idempotencia).
*   Frontend: Requiere integrar adaptador `PersistQueryClient` en `App.tsx`.
