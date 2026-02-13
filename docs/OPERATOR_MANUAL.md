# 📟 MANUAL DEL OPERADOR: TORRE DE CONTROL (CELLVI 2.0)
**Nivel:** Operativo / Supervisor de Flota
**Versión:** 1.0.0 (Enterprise Ready)

## 1. Introducción
Este manual describe el flujo de trabajo estándar para los operadores de la **Torre de Control**. CellVi 2.0 integra telemetría GPS, cadena de frío y cumplimiento legal (RNDC) en una sola interfaz.

---

## 2. Flujo Diario de Operación

### ⚡ Fase 1: Monitoreo Activo (Dashboard Overview)
1.  **Dashboard Principal:** Verifique que el indicador "Pasarela GPS" esté en **ONLINE**.
2.  **Alertas Críticas:** Priorice las alertas de color **ROJO** (Pánico, Desviación Térmica, Jamming detectado).
3.  **Mapa en Vivo:** Use la vista de mapa para confirmar que los activos están en las rutas autorizadas.

### 🌡️ Fase 2: Control de Cadena de Frío
1.  Acceda al módulo **Operación > Cadena de Frío**.
2.  Seleccione la unidad para ver el gráfico de estabilidad térmica.
3.  **Límites Safe-Range:** Verifique que la temperatura se mantenga entre **2°C y 8°C** para productos farmacéuticos.
4.  **Acción ante desviación:** Si la temperatura sale de rango por más de 10 minutos, contacte al conductor inmediatamente.

### 📜 Fase 3: Cumplimiento RNDC (Ministerio de Transporte)
1.  Antes de que un vehículo inicie viaje, acceda a **Control > RNDC**.
2.  Presione **"Sincronizar Manifiesto"**.
3.  Confirme que el estado cambie a **"ÉXITO"** y guarde el número de **Radicado**.
4.  *Nota:* Todo registro está sellado con un Hash Inmutable para auditorías externas.

---

## 3. Manejo de Incidencias (SLA)

| Tipo de Incidencia | Prioridad | Acción Inmediata |
| :--- | :--- | :--- |
| **SOS / Botón de Pánico** | CRÍTICA | Llamada a Policía Nacional + Protocolo de Aseguradora. |
| **Desviación Térmica** | ALTA | Ordenar detención y revisión de sellos de la puerta. |
| **Salida de Geocerca** | MEDIA | Consultar cambio de ruta con el departamento de Logística. |
| **Falla de RNDC** | BAJA | Reintentar sincronización manual desde el panel de Control. |

---

## 4. Mejores Prácticas
*   **No ignore alertas:** Cada alerta ignorada queda registrada en el log de auditoría del usuario.
*   **Verificación Offline:** Use la herramienta de **Evidence Layer** si sospecha que un conductor ha alterado el GPS (Evidence sellada vía NTP).
*   **Inteligencia Predictiva:** Revise semanalmente el gráfico de "Driving Score" para identificar conductores con hábitos de riesgo.

---
**Soporte Técnico:** Contactar vía WhatsApp Button integrado en la plataforma.
**Certificación:** SOC2 / RNDC Compliant.
