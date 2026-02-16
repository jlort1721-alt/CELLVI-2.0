/**
 * Vision Guard - Detección de Fatiga del Conductor
 * Usando MediaPipe Face Detection (privacy-first, todo local)
 */

export interface FatigueMetrics {
  eyeAspectRatio: number; // 0-1, <0.2 = ojos cerrados
  yawnDetected: boolean;
  headPose: {
    pitch: number; // -90 a 90 grados (cabeza arriba/abajo)
    yaw: number;   // -90 a 90 grados (cabeza izq/der)
    roll: number;  // -90 a 90 grados (inclinación)
  };
  blinkRate: number; // parpadeos por minuto
  microSleepEvents: number; // contador de microsueños
}

export interface FatigueState {
  level: 'green' | 'yellow' | 'red';
  score: number; // 0-100, donde 100 = muy fatigado
  alerts: FatigueAlert[];
  recommendations: string[];
  drivingDuration: number; // minutos conduciendo
  lastBreak: Date | null;
}

export interface FatigueAlert {
  type: 'eyes_closed' | 'yawning' | 'head_nodding' | 'micro_sleep' | 'prolonged_driving';
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  description: string;
}

/**
 * Clase para detección de fatiga
 */
export class VisionGuard {
  private microSleepCount = 0;
  private yawnCount = 0;
  private drivingStartTime: Date | null = null;
  private lastBreakTime: Date | null = null;
  private blinkHistory: Date[] = [];
  private alertHistory: FatigueAlert[] = [];

  /**
   * Calcula Eye Aspect Ratio (EAR)
   * En implementación real, usar MediaPipe landmarks
   */
  private calculateEAR(landmarks: any): number {
    // Fórmula simplificada para demo
    // En producción: usar landmarks reales de MediaPipe
    // EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
    return Math.random() * 0.4 + 0.2; // 0.2 - 0.6 para demo
  }

  /**
   * Detecta bostezos
   */
  private detectYawn(mouthAspectRatio: number): boolean {
    // MAR > 0.6 indica bostezo
    return mouthAspectRatio > 0.6;
  }

  /**
   * Detecta cabeceo (head nodding)
   */
  private detectHeadNodding(pitch: number): boolean {
    // Si la cabeza está inclinada más de 20 grados hacia abajo
    return pitch < -20;
  }

  /**
   * Calcula tasa de parpadeo
   */
  private calculateBlinkRate(): number {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    // Filtrar parpadeos del último minuto
    this.blinkHistory = this.blinkHistory.filter(blink => blink > oneMinuteAgo);

    return this.blinkHistory.length;
  }

  /**
   * Inicia sesión de conducción
   */
  startDriving(): void {
    this.drivingStartTime = new Date();
    this.microSleepCount = 0;
    this.yawnCount = 0;
    this.alertHistory = [];
  }

  /**
   * Registra un descanso
   */
  takeBreak(): void {
    this.lastBreakTime = new Date();
    this.microSleepCount = 0;
    this.yawnCount = 0;
  }

  /**
   * Analiza frame de video (simulado)
   * En producción real, recibe output de MediaPipe
   */
  analyzeFrame(videoFrame?: HTMLVideoElement): FatigueMetrics {
    // Simulación para demo - en producción usar MediaPipe real
    const ear = Math.random() * 0.4 + 0.15; // 0.15 - 0.55
    const mar = Math.random() * 0.5 + 0.2;  // 0.2 - 0.7
    const pitch = Math.random() * 40 - 20;  // -20 a 20
    const yaw = Math.random() * 30 - 15;    // -15 a 15
    const roll = Math.random() * 20 - 10;   // -10 a 10

    // Detectar parpadeo
    if (ear < 0.2) {
      this.blinkHistory.push(new Date());
    }

    // Detectar bostezo
    const yawnDetected = this.detectYawn(mar);
    if (yawnDetected) {
      this.yawnCount++;
    }

    // Detectar microsueño (ojos cerrados > 2 segundos)
    if (ear < 0.15) {
      this.microSleepCount++;
    }

    return {
      eyeAspectRatio: ear,
      yawnDetected,
      headPose: { pitch, yaw, roll },
      blinkRate: this.calculateBlinkRate(),
      microSleepEvents: this.microSleepCount
    };
  }

  /**
   * Evalúa estado de fatiga basado en métricas
   */
  evaluateFatigue(metrics: FatigueMetrics): FatigueState {
    const alerts: FatigueAlert[] = [];
    let score = 0;

    // 1. Ojos cerrados
    if (metrics.eyeAspectRatio < 0.2) {
      score += 30;
      alerts.push({
        type: 'eyes_closed',
        severity: 'high',
        timestamp: new Date(),
        description: 'Ojos cerrados detectados - ¡Atención!'
      });
    }

    // 2. Bostezos
    if (metrics.yawnDetected) {
      score += 15;
      alerts.push({
        type: 'yawning',
        severity: 'medium',
        timestamp: new Date(),
        description: 'Bostezo detectado - Señal de fatiga'
      });
    }

    // 3. Cabeza inclinada (cabeceo)
    if (this.detectHeadNodding(metrics.headPose.pitch)) {
      score += 25;
      alerts.push({
        type: 'head_nodding',
        severity: 'high',
        timestamp: new Date(),
        description: 'Cabeceo detectado - ¡Tome un descanso!'
      });
    }

    // 4. Microsueños
    if (metrics.microSleepEvents > 0) {
      score += 40;
      alerts.push({
        type: 'micro_sleep',
        severity: 'high',
        timestamp: new Date(),
        description: `${metrics.microSleepEvents} microsueño(s) detectado(s) - ¡PELIGRO!`
      });
    }

    // 5. Tiempo de conducción
    const drivingDuration = this.drivingStartTime
      ? (new Date().getTime() - this.drivingStartTime.getTime()) / 60000
      : 0;

    if (drivingDuration > 120) { // 2 horas sin descanso
      score += 20;
      alerts.push({
        type: 'prolonged_driving',
        severity: 'medium',
        timestamp: new Date(),
        description: `${Math.floor(drivingDuration / 60)}h conduciendo - Descanso recomendado`
      });
    }

    // Determinar nivel
    let level: 'green' | 'yellow' | 'red';
    if (score >= 50) {
      level = 'red'; // Crítico
    } else if (score >= 25) {
      level = 'yellow'; // Advertencia
    } else {
      level = 'green'; // OK
    }

    // Recomendaciones
    const recommendations: string[] = [];
    if (level === 'red') {
      recommendations.push('⚠️ DETENGA EL VEHÍCULO INMEDIATAMENTE');
      recommendations.push('Tome un descanso de al menos 15-20 minutos');
      recommendations.push('Considere cambiar de conductor si es posible');
    } else if (level === 'yellow') {
      recommendations.push('⚠️ Señales de fatiga detectadas');
      recommendations.push('Planifique un descanso en los próximos 15 minutos');
      recommendations.push('Mantenga ventanas abiertas para aire fresco');
    } else {
      recommendations.push('✓ Estado normal - Siga conduciendo de forma segura');
      if (drivingDuration > 60) {
        recommendations.push('Considere un descanso preventivo pronto');
      }
    }

    this.alertHistory.push(...alerts);

    return {
      level,
      score,
      alerts,
      recommendations,
      drivingDuration,
      lastBreak: this.lastBreakTime
    };
  }

  /**
   * Obtiene historial de alertas
   */
  getAlertHistory(limit: number = 10): FatigueAlert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Reset del sistema
   */
  reset(): void {
    this.microSleepCount = 0;
    this.yawnCount = 0;
    this.drivingStartTime = null;
    this.lastBreakTime = null;
    this.blinkHistory = [];
    this.alertHistory = [];
  }
}

/**
 * Configuración para MediaPipe (cuando se implemente)
 */
export const mediaPipeConfig = {
  modelAssetPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection',
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  selfieMode: false // true para cámara frontal
};

/**
 * Ejemplo de uso:
 *
 * const guard = new VisionGuard();
 * guard.startDriving();
 *
 * // En un loop de video (cada frame)
 * const metrics = guard.analyzeFrame(videoElement);
 * const state = guard.evaluateFatigue(metrics);
 *
 * if (state.level === 'red') {
 *   // Alerta crítica - detener vehículo
 *   playAlarmSound();
 *   vibrateDevice();
 * }
 */
