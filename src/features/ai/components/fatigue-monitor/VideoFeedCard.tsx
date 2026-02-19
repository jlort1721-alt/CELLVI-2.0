import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, TrendingUp } from 'lucide-react';
import type { FatigueMetrics } from '../../lib/visionGuard';

export interface VideoFeedCardProps {
  metrics: FatigueMetrics;
}

const VideoFeedCard: React.FC<VideoFeedCardProps> = ({ metrics }) => {
  return (
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
  );
};

VideoFeedCard.displayName = 'VideoFeedCard';

export default React.memo(VideoFeedCard);
