import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';

export interface FatigueStatsData {
  total_sessions: number;
  total_alerts: number;
  critical_alerts: number;
  avg_fatigue_score: number;
  total_driving_hours: number;
}

export interface FatigueStatsCardProps {
  stats: FatigueStatsData;
}

const FatigueStatsCard: React.FC<FatigueStatsCardProps> = ({ stats }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Estadísticas de Fatiga (Últimos 30 días)
        </CardTitle>
        <CardDescription>
          Resumen del rendimiento del conductor
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-5">
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Total Sesiones</p>
            <p className="text-2xl font-bold">{stats.total_sessions}</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Total Alertas</p>
            <p className="text-2xl font-bold">{stats.total_alerts}</p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
            <p className="text-xs text-muted-foreground">Alertas Críticas</p>
            <p className="text-2xl font-bold text-red-600">{stats.critical_alerts}</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Score Promedio</p>
            <p className="text-2xl font-bold">{stats.avg_fatigue_score.toFixed(1)}</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Horas Conducción</p>
            <p className="text-2xl font-bold">{stats.total_driving_hours.toFixed(1)}h</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

FatigueStatsCard.displayName = 'FatigueStatsCard';

export default React.memo(FatigueStatsCard);
