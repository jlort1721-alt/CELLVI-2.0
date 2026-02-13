# Estandarización y Certificación de Hardware - CELLVI 2.0
**Autor:** Hardware CTO
**Fecha:** Febrero 2026
**Versión:** 1.0

Para garantizar la promesa de "The Truth Layer", no podemos aceptar cualquier dato "basura". Este documento establece los requisitos mínimos que debe cumplir un dispositivo IoT para ser homologado en CELLVI 2.0.

## 1. Niveles de Certificación

Clasificamos los dispositivos en 3 niveles (Tiers) según sus capacidades de seguridad y telemetría.

| Nivel | Descripción | Caso de Uso | Requisitos Clave |
|-------|-------------|-------------|-------------------|
| **Tier 1 (Básico)** | Rastreo simple. | Motos, Vehículos particulares, Mascotas. | GPS, GPRS, buffer de 1000 puntos. |
| **Tier 2 (Pro)** | Telemetría operativa. | Flotas de carga, Maquinaria amarilla. | **Tier 1** + CanBus, Detección de Jamming, Batería Backup > 12h. |
| **Tier 3 (Secure)** | Alta seguridad y evidencia. | Valores, Carga crítica, Minería. | **Tier 2** + Firma Criptográfica (HW), Anti-tamper físico, Dual SIM. |

---

## 2. Requerimientos de Firmware

Para que un dispositivo sea "CELLVI Certified", su firmware debe configurarse o personalizarse para:

1.  **Frecuencia Inteligente:**
    *   Motor Encendido: Envío cada 30 segundos O cambio de rumbo > 30 grados.
    *   Motor Apagado: Heartbeat cada 1 hora.
2.  **Protocolo de Buffer:**
    *   Si se pierde la señal GSM, **NUNCA** descartar datos (FIFO). Almacenar en Flash y transmitir al reconectar.
3.  **Encripción:**
    *   Soporte mínimo de TLS 1.2 o, en su defecto, encriptación AES-128 del payload TCP/UDP.

---

## 3. Dispositivos Homologados (Q1 2026)

### Teltonika (Gold Partner)
*   **FMB920 (Tier 1):** Económico, Bluetooth 4.0.
*   **FMC130 (Tier 2):** 4G LTE, Entradas flexibles, CAN adapter soportado.
*   **FMC640 (Tier 3):** Profesional, soporte de tacógrafo, doble SIM.

### Queclink
*   **GV50 (Tier 1):** Mini tracker, fácil instalación.
*   **GV300W (Tier 2):** Robusto, interfaces seriales RS232 (para sensores de combustible).

### Suntech
*   **ST4300 (Tier 2):** Versatilidad y bajo costo.

---

## 4. Estrategia de Sensores Periféricos

CELLVI 2.0 estandariza la ingesta de sensores externos:

1.  **Combustible:** Varillas capacitivas RS232/RS485. Precisión > 98%.
2.  **Temperatura:** Sensores Bluetooth LE (para evitar cables en furgones). BLE 4.0+.
3.  **Identificación:** iButton (Dallas) o RFID/NFC para control de conductor.
4.  **Fatiga:** Cámaras DMS (Driver Monitoring System) con IA en el borde (Edge AI). Envían solo la alerta (JSON) y el clip de video (MP4/H.264), no streaming continuo 24/7 (por costos).

---

## 5. Proceso de Homologación de Nuevo Hardware

Cualquier nuevo dispositivo debe pasar este *Gauntlet*:

1.  **Prueba de Mesa (48h):** Estabilidad de conexión, reconexión post-reinicio.
2.  **Prueba de Túnel:** Comportamiento al perder GNSS y GSM simultáneamente.
3.  **Prueba de Estrés:** Envío de 1 paquete por segundo durante 1 hora.
4.  **Validación de Parser:** Verificar que ningún bit de información (batería, IO, satélites) se pierda en la decodificación.
