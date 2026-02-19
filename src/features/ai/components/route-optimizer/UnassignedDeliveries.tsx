import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { Delivery } from '../../lib/routeOptimizer';

export interface UnassignedDeliveriesProps {
  deliveries: Delivery[];
  getPriorityColor: (priority: string) => string;
}

const UnassignedDeliveries: React.FC<UnassignedDeliveriesProps> = ({
  deliveries,
  getPriorityColor,
}) => {
  return (
    <Card className="border-yellow-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          Entregas Sin Asignar
        </CardTitle>
        <CardDescription>
          {deliveries.length} entregas no pudieron ser asignadas por restricciones de capacidad o ventana de tiempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {deliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="flex items-center gap-3 p-3 border border-yellow-300 bg-yellow-50 dark:bg-yellow-950 rounded-lg"
            >
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div className="flex-1">
                <p className="font-medium">{delivery.address}</p>
                <p className="text-xs text-muted-foreground">
                  {delivery.weight} kg • {delivery.timeWindow.start} - {delivery.timeWindow.end}
                </p>
              </div>
              <Badge variant={getPriorityColor(delivery.priority) as any}>
                {delivery.priority === 'high' ? 'Alta' : delivery.priority === 'medium' ? 'Media' : 'Baja'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

UnassignedDeliveries.displayName = 'UnassignedDeliveries';

export default React.memo(UnassignedDeliveries);
