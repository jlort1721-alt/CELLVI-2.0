# Protocolo de Auditoría Inmutable y Seguridad - CELLVI 2.0
**Autor:** Ingeniero de Seguridad & Data Architect
**Fecha:** Febrero 2026
**Versión:** 1.0

Este documento detalla el diseño del sistema "Truth Layer" de CELLVI 2.0, garantizando la integridad, autenticidad y no-repudio de la evidencia digital generada por la plataforma.

## 1. Amenazas y Modelo de Riesgo

| Amenaza | Descripción | Mitigación CELLVI |
|---------|-------------|-------------------|
| **Spoofing** | Un actor malicioso simula ser un GPS enviando datos falsos. | Firmas digitales por dispositivo y análisis de coherencia física (Anti-spoofing AI). |
| **Tampering** | Un admin de base de datos modifica un registro histórico (ej: borra un exceso de velocidad). | Hash Chaining (Blockchain privado) y logs de solo apéndice (Append-only). |
| **Repudio** | El conductor niega haber estado en un lugar. | Evidencia criptográfica verificable por terceros. |
| **Fuga de Datos** | Acceso no autorizado a la ubicación de la flota. | Encriptación por tenant y rotación de claves. |

---

## 2. Arquitectura de "The Truth Layer"

Utilizamos una estructura de datos basada en **Merkle Trees** y **Hash Chaining** para crear un registro inmutable.

### 2.1. Estructura del Evento Firmado

Cada evento crítico (Alerta, Parada, Inicio de Viaje) se transforma en un objeto `SignedEvent`:

```json
{
  "header": {
    "version": "1.0",
    "alg": "ES256" // Elliptic Curve Digital Signature Algorithm
  },
  "payload": {
    "id": "evt_123456789",
    "imei": "123456789012345",
    "timestamp": 1707663600,
    "lat": 4.6097,
    "lng": -74.0817,
    "speed": 85,
    "event_type": "SPEEDING_ALERT"
  },
  "proof": {
    "prev_hash": "a1b2c3d4...", // Enlace al evento anterior del mismo dispositivo
    "merkle_root": "e5f6g7h8...", // Raíz del bloque actual (si aplica batching)
    "signature": "30450221..." // Firma digital del payload + prev_hash
  }
}
```

### 2.2. Hash Chaining (La Cadena)

Para cada dispositivo, mantenemos una cadena lineal. El hash del evento `N` depende del hash del evento `N-1`.

> `Hash(Event_N) = SHA256( Payload_N + Signature_N + Hash(Event_N-1) )`

Si alguien modifica el `Event_N-1` en la base de datos, el hash calculado no coincidirá con el `prev_hash` almacenado en `Event_N`, rompiendo la cadena y evidenciando la manipulación.

---

## 3. Gestión de Claves y Firmas

### 3.1. Generación de Claves
*   **Dispositivos HW:** Idealmente, las claves privadas se generan dentro de un **Secure Element (SE)** en el hardware del GPS.
*   **Dispositivos Legacy:** Se genera un par de claves `(Private_Key, Public_Key)` en el momento del aprovisionamiento en servidor seguro (HSMCloud). La `Private_Key` nunca se guarda en texto plano.

### 3.2. Rotación de Claves
*   Las claves de sesión se rotan cada 24 horas o cada 10,000 eventos.
*   Una "Clave Maestra" en Cold Storage autoriza la creación de nuevas claves de sesión.

---

## 4. Verificación de Evidencia (Offline)

CELLVI provee una herramienta "Evidence Verifier" standalone (HTML/JS simple) que permite a auditores externos (aseguradoras, jueces) verificar un paquete de datos exportado sin necesitar acceso a la plataforma.

**Proceso de Verificación:**
1.  El usuario descarga un `.json` o `.zip` con la evidencia del viaje.
2.  Carga el archivo en el Verificador Offline.
3.  El verificador:
    *   Recalcula los hashes de todos los eventos.
    *   Verifica que `prev_hash` coincida secuencialmente.
    *   Verifica la firma digital usando la Clave Pública de ASEGURAR LTDA (publicada en DNS o sitio web).
4.  Resultado: ✅ **Integridad Validada** o ❌ **Evidencia Corrupta/Alterada**.

---

## 5. Implementación Técnica (Pseudocódigo)

### Ingesta y Sellado

```typescript
async function sealEvent(telemetryRaw: any, previousEventHash: string) {
  // 1. Normalizar payload
  const payload = normalize(telemetryRaw);
  
  // 2. Crear string canónico para firmar
  const dataToSign = JSON.stringify(payload) + previousEventHash;
  
  // 3. Generar hash y firma
  const currentHash = crypto.createHash('sha256').update(dataToSign).digest('hex');
  const signature = await kms.sign(dataToSign); // AWS KMS o Vault
  
  // 4. Guardar en DB inmutable
  await db.evidenceLog.create({
    payload,
    prev_hash: previousEventHash,
    hash: currentHash,
    signature: signature
  });
  
  return currentHash; // Para el siguiente evento
}
```

---

## 6. Logs de Auditoría del Sistema

Además de la telemetría, todas las acciones administrativas en la plataforma quedan registradas en el mismo formato inmutable:

*   Inicio de sesión de usuarios.
*   Cambios en políticas o geocercas.
*   Exportación de reportes.
*   Creación/Borrado de usuarios.

Esto asegura cumplimiento total con **Ley 1581 (Habeas Data)** y estándares de seguridad corporativa.
