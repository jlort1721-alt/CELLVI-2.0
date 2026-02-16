import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Eye,
  AlertTriangle,
  Coffee,
  Play,
  Square,
  Activity,
  Clock,
  Bell,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Video,
} from 'lucide-react';
import { VisionGuard, type FatigueState, type FatigueMetrics } from '../lib/visionGuard';

export default function FatigueMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [fatigueState, setFatigueState] = useState<FatigueState | null>(null);
  const [metrics, setMetrics] = useState<FatigueMetrics | null>(null);
  const visionGuard = useRef(new VisionGuard());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate video analysis
  useEffect(() => {
    if (isMonitoring) {
      intervalRef.current = setInterval(() => {
        // Analyze frame (in production, this would use actual video)
        const currentMetrics = visionGuard.current.analyzeFrame();
        setMetrics(currentMetrics);

        const currentState = visionGuard.current.evaluateFatigue(currentMetrics);
        setFatigueState(currentState);
      }, 1000); // Update every second
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring]);

  const handleStartMonitoring = () => {
    visionGuard.current.startDriving();
    setIsMonitoring(true);
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
    setFatigueState(null);
    setMetrics(null);
  };

  const handleTakeBreak = () => {
    visionGuard.current.takeBreak();
  };

  const getLevelColor = (level: 'green' | 'yellow' | 'red') => {
    switch (level) {
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'red':
        return 'bg-red-500';
    }
  };

  const getLevelText = (level: 'green' | 'yellow' | 'red') => {
    switch (level) {
      case 'green':
        return 'Normal';
      case 'yellow':
        return 'Advertencia';
      case 'red':
        return 'Crítico';
    }
  };

  const getSeverityIcon = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const alertHistory = fatigueState ? visionGuard.current.getAlertHistory(10) : [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary" />
            Vision Guard
          </h1>
          <p className="text-muted-foreground mt-1">
            Detección de fatiga en tiempo real con IA
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isMonitoring ? (
            <Button onClick={handleStartMonitoring} size="lg" className="gap-2">
              <Play className="h-4 w-4" />
              Iniciar Monitoreo
            </Button>
          ) : (
            <>
              <Button onClick={handleTakeBreak} variant="outline" size="lg" className="gap-2">
                <Coffee className="h-4 w-4" />
                Tomar Descanso
              </Button>
              <Button
                onClick={handleStopMonitoring}
                variant="destructive"
                size="lg"
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Detener
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Monitoring Active */}
      {isMonitoring && fatigueState && metrics && (
        <>
          {/* Critical Alert */}
          {fatigueState.level === 'red' && (
            <Alert variant="destructive" className="border-2 animate-pulse">
              <ShieldAlert className="h-5 w-5" />
              <AlertTitle className="text-lg font-bold">¡ALERTA CRÍTICA DE FATIGA!</AlertTitle>
              <AlertDescription className="text-base">
                Se ha detectado fatiga severa. El conductor debe detenerse INMEDIATAMENTE y
                descansar. Nivel de fatiga: {fatigueState.score}/100
              </AlertDescription>
            </Alert>
          )}

          {/* Warning Alert */}
          {fatigueState.level === 'yellow' && (
            <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <AlertTitle className="text-yellow-900 dark:text-yellow-100">
                Advertencia de Fatiga
              </AlertTitle>
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                Se detectan signos de fatiga. Planificar descanso en los próximos 15-30 minutos.
              </AlertDescription>
            </Alert>
          )}

          {/* Status Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className={fatigueState.level === 'green' ? 'border-green-500' : fatigueState.level === 'yellow' ? 'border-yellow-500' : 'border-red-500'}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${getLevelColor(fatigueState.level)} ${fatigueState.level === 'red' ? 'animate-pulse' : ''}`} />
                  <span className="text-2xl font-bold">{getLevelText(fatigueState.level)}</span>
                </div>
                <Progress
                  value={fatigueState.score}
                  className={`mt-2 ${fatigueState.level === 'red' ? 'bg-red-200' : fatigueState.level === 'yellow' ? 'bg-yellow-200' : 'bg-green-200'}`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Score: {fatigueState.score}/100
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiempo Conduciendo</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(fatigueState.drivingDuration)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {fatigueState.drivingDuration > 7200000 ? (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Excede 2 horas
                    </span>
                  ) : (
                    'Dentro del límite'
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {fatigueState.alerts.filter((a) => a.severity === 'high').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Severidad alta
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Microsueños</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.microSleepEvents}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Eventos detectados
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Video Feed and Metrics */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Video Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video en Tiempo Real
                </CardTitle>
                <CardDescription>Análisis facial continuo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center relative overflow-hidden">
                  {/* Simulated video feed */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
                  <div className="relative z-10 text-center">
                    <Video className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Cámara activa - Analizando rostro
                    </p>
                  </div>

                  {/* Face detection overlay */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-green-500 rounded-lg">
                    {/* Eye indicators */}
                    <div className="absolute top-1/3 left-1/4 w-8 h-4 border border-green-500 rounded-full" />
                    <div className="absolute top-1/3 right-1/4 w-8 h-4 border border-green-500 rounded-full" />
                    {/* Mouth indicator */}
                    <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-16 h-4 border border-green-500 rounded-full" />
                  </div>

                  {/* Status badge */}
                  <div className="absolute top-4 right-4">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2" />
                      Activo
                    </Badge>
                  </div>
                </div>

                {/* Real-time Metrics */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">Eye Aspect Ratio</p>
                    <p className="text-lg font-bold">
                      {metrics.eyeAspectRatio.toFixed(3)}
                      <span className="text-sm font-normal ml-2">
                        {metrics.eyeAspectRatio < 0.2 ? (
                          <Badge variant="destructive" className="ml-1">Cerrados</Badge>
                        ) : (
                          <Badge variant="outline" className="ml-1">Abiertos</Badge>
                        )}
                      </span>
                    </p>
                  </div>

                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">Frecuencia Parpadeo</p>
                    <p className="text-lg font-bold">
                      {metrics.blinkRate}/min
                      <span className="text-sm font-normal ml-2">
                        <TrendingUp className="h-3 w-3 inline" />
                      </span>
                    </p>
                  </div>

                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">Bostezo</p>
                    <p className="text-lg font-bold">
                      {metrics.yawnDetected ? (
                        <Badge variant="destructive">Detectado</Badge>
                      ) : (
                        <Badge variant="outline">No detectado</Badge>
                      )}
                    </p>
                  </div>

                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">Posición Cabeza</p>
                    <p className="text-sm font-mono">
                      P: {metrics.headPose.pitch.toFixed(0)}°
                      Y: {metrics.headPose.yaw.toFixed(0)}°
                      R: {metrics.headPose.roll.toFixed(0)}°
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts and Recommendations */}
            <div className="space-y-6">
              {/* Current Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Alertas Recientes
                  </CardTitle>
                  <CardDescription>
                    {fatigueState.alerts.length} alertas en esta sesión
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {fatigueState.alerts.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {fatigueState.alerts.slice(-5).reverse().map((alert, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 border rounded-lg"
                        >
                          {getSeverityIcon(alert.severity)}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{alert.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(alert.timestamp).toLocaleTimeString('es-CO')}
                            </p>
                          </div>
                          <Badge
                            variant={
                              alert.severity === 'high'
                                ? 'destructive'
                                : alert.severity === 'medium'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {alert.severity === 'high' ? 'Alta' : alert.severity === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-600" />
                      <p className="text-sm">No hay alertas activas</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coffee className="h-5 w-5" />
                    Recomendaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {fatigueState.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-secondary rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>

                  {fatigueState.lastBreak && (
                    <div className="mt-4 p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Último descanso</p>
                      <p className="text-sm font-medium">
                        {new Date(fatigueState.lastBreak).toLocaleString('es-CO')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Alert History */}
          {alertHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Alertas</CardTitle>
                <CardDescription>
                  Últimas {alertHistory.length} alertas registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alertHistory.map((alert, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString('es-CO')}
                        </p>
                      </div>
                      <Badge
                        variant={
                          alert.type === 'eyes_closed' || alert.type === 'micro_sleep'
                            ? 'destructive'
                            : 'default'
                        }
                      >
                        {alert.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!isMonitoring && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Eye className="h-24 w-24 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sistema de Detección de Fatiga</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Vision Guard utiliza inteligencia artificial para detectar signos de fatiga en
              conductores en tiempo real, incluyendo:
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Detección de ojos cerrados</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Análisis de bostezos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Monitoreo de cabeceo</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Detección de microsueños</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Haz clic en "Iniciar Monitoreo" para comenzar el análisis
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
