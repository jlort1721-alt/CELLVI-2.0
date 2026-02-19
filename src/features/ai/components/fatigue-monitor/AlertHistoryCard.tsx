import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { FatigueAlert } from '../../lib/visionGuard';

export interface AlertHistoryCardProps {
  alertHistory: FatigueAlert[];
}

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

const AlertHistoryCard: React.FC<AlertHistoryCardProps> = ({ alertHistory }) => {
  if (alertHistory.length === 0) {
    return null;
  }

  return (
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
  );
};

AlertHistoryCard.displayName = 'AlertHistoryCard';

export default React.memo(AlertHistoryCard);
