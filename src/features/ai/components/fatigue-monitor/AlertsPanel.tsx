import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { FatigueAlert } from '../../lib/visionGuard';

export interface AlertsPanelProps {
  alerts: FatigueAlert[];
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

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Alertas Recientes
        </CardTitle>
        <CardDescription>
          {alerts.length} alertas en esta sesión
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alerts.slice(-5).reverse().map((alert, idx) => (
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
  );
};

AlertsPanel.displayName = 'AlertsPanel';

export default React.memo(AlertsPanel);
