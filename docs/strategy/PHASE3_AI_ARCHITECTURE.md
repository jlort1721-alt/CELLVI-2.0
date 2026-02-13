# Estrategia Fase 3: Inteligencia Artificial y Optimización

Esta fase transforma a CELLVI 2.0 de una herramienta de "Monitoreo Pasivo" a un "Asistente Activo" que toma decisiones.

## 1. Optimización de Rutas (VRP - Vehicle Routing Problem)
**Problema:** Un cliente tiene 50 entregas y 5 vehículos. ¿Cómo asignarlos para minimizar gasolina y tiempo?
**Solución Técnica:**
*   **Motor:** Google OR-Tools (vía Python Microservice) o Mapbox Optimization API.
*   **Input:** Lista de coordenadas + Ventanas de tiempo (Cliente A recibe de 8am-10am).
*   **Output:** Secuencia ordenada de paradas por vehículo.

## 2. Detección de Anomalías (Security AI)
**Problema:** Robos de carga o desvíos no autorizados.
**Solución Técnica:**
*   **Algoritmo:** Geo-Fencing Dinámico + Isolation Forest.
*   **Lógica:** Si un vehículo sale de su "corredor habitual" o se detiene en una zona roja (heatmap histórico de robos), dispara alerta crítica.
*   **Implementación:**
    *   Entrenar modelo offline con histórico de rutas (`vehicle_telemetry`).
    *   Ejecutar inferencia en tiempo real en el worker de ingestión.

## 3. Predicción de Mantenimiento
**Problema:** Roturas mecánicas inesperadas.
**Solución Técnica:**
*   **Variables:** Kilometraje acumulado, Horas motor, Eventos de frenado brusco (G-Force).
*   **Modelo:** Regresión Lineal simple o Random Forest.
*   **Output:** "Probabilidad de fallo de frenos: 85% - Agendar revisión".

## 4. Stack Tecnológico Sugerido
*   **Inferencia Ligera:** TensorFlow.js (en Edge Functions) o ONNX Runtime.
*   **Entrenamiento Pesado:** Python Jobs (AWS Lambda / Google Cloud Run) conectados a Supabase vía API.
*   **Visualización:** Gráficos de dispersión en Dashboard de Mantenimiento.
