import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Navigation, CheckCircle2 } from 'lucide-react';

export interface EmptyStateProps {
  vehicleCount: number;
  deliveryCount: number;
}

const EmptyState: React.FC<EmptyStateProps> = ({ vehicleCount, deliveryCount }) => {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Navigation className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Listo para Optimizar</h3>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          Haz clic en "Optimizar Rutas" para generar las rutas más eficientes
          usando el algoritmo VRP con {vehicleCount} vehículos y {deliveryCount} entregas.
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          Reducción esperada: 15-25% en distancia
        </div>
      </CardContent>
    </Card>
  );
};

EmptyState.displayName = 'EmptyState';

export default React.memo(EmptyState);
