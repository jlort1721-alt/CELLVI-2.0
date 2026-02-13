# Gobernanza y Ética de Inteligencia Artificial (AI Governance)

## 1. Principios Rectores
CELLVI 2.0 utiliza algoritmos de optimización y predicción para asistir, NO reemplazar, el juicio humano.

### A. Transparencia y Explicabilidad (XAI)
*   **Decisión:** Cuando el sistema asigna una ruta o califica a un conductor.
*   **Evidencia:** El usuario debe poder ver *por qué* se tomó esa decisión.
    *   *Ejemplo:* "Score bajo (60/100) debido a 5 excesos de velocidad >100km/h el martes".
*   **Implementation:** Todos los scores de conductores se guardan con un JSON detallado de los eventos causales.

### B. Human-in-the-Loop (Supervisión Humana)
*   **Regla de Oro:** El operador de tráfico siempre tiene la potestad de **anular, modificar o rechazar** una ruta sugerida por el VRP.
*   **Mecanismo:** El Frontend permite drag-and-drop para reordenar paradas después de la optimización automática.

### C. Privacidad y Datos Sensibles
*   **Anonimización:** Los datos usados para entrenar modelos predictivos globales (Fase 4) se anonimizan (UUIDs rotados, sin nombres de conductores).
*   **Cámaras en Cabina (DMS):** Si se usan cámaras de fatiga, el video solo se guarda en caso de "Evento Crítico" (Micro-sueño detectado). No se graba 24/7 para respetar la privacidad del trabajador.

## 2. Auditoría de Algoritmos (Model Card)
### Modelo: VRP Optimizer (v1.0)
*   **Tipo:** Heurística Determinista (2-Opt).
*   **Sesgos Conocidos:** Tiende a minimizar distancia euclidiana, puede ignorar topografía si no se integra con API de elevación.
*   **Mitigación:** Integración futura con Google Roads API para considerar tráfico real.

### Modelo: Fuel Anomaly Detection (v0.8)
*   **Tipo:** Isolation Forest (Estadístico).
*   **Falsos Positivos:** Puede alertar en pendientes pronunciadas donde el sensor de combustible fluctúa.
*   **Mitigación:** Filtro de suavizado (Rolling Average 2 min) aplicado antes de inferencia.

## 3. Seguridad Adversaria
*   **Riesgo:** Spoofing de GPS para simular cumplimiento de ruta.
*   **Defensa:** Validación cruzada con datos de red celular (GSM Tower Triangulation) y velocidad inercial (Acelerómetro).
