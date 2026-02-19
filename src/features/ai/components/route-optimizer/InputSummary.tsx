import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Package, AlertCircle } from 'lucide-react';
import type { Vehicle, Delivery } from '../../lib/routeOptimizer';

export interface InputSummaryProps {
  vehicles: Vehicle[];
  deliveries: Delivery[];
}

const InputSummary: React.FC<InputSummaryProps> = ({ vehicles, deliveries }) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vehículos Disponibles</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{vehicles.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Capacidad total: {vehicles.reduce((sum, v) => sum + v.capacity.weight, 0)} kg
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entregas Pendientes</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{deliveries.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Peso total: {deliveries.reduce((sum, d) => sum + d.weight, 0)} kg
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entregas Prioritarias</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {deliveries.filter((d) => d.priority === 'high').length}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Alta prioridad
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

InputSummary.displayName = 'InputSummary';

export default React.memo(InputSummary);
