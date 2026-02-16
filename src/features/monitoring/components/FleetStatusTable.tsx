import { memo } from "react";
import { Shield, Fuel } from "lucide-react";

interface Vehicle {
  id: string;
  plate: string;
  driver?: string;
  status: string;
  speed?: number;
  fuel?: number;
  signal?: number;
}

interface FleetStatusTableProps {
  vehicles: Vehicle[];
  activeCount: number;
  loadingVehicles: boolean;
}

const VehicleRow = memo(({ vehicle }: { vehicle: Vehicle }) => {
  const statusColor = vehicle.status === 'activo' ? 'bg-green-500' : vehicle.status === 'detenido' ? 'bg-yellow-500' : vehicle.status === 'alerta' ? 'bg-red-500' : 'bg-gray-500';

  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-sidebar-foreground/[0.03] transition-colors cursor-pointer group border border-transparent hover:border-sidebar-border/30">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-2 h-2 rounded-full flex-shrink-0 relative">
          {vehicle.status === 'activo' && <div className="absolute inset-0 rounded-full animate-ping opacity-75 bg-green-500" />}
          <div className={`relative w-full h-full rounded-full ${statusColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-sidebar-foreground font-bold">{vehicle.plate}</span>
            {vehicle.speed && vehicle.speed > 0 && (
              <span className="text-[9px] text-blue-400 font-mono">{vehicle.speed} km/h</span>
            )}
          </div>
          <span className="text-[10px] text-sidebar-foreground/30 block truncate">{vehicle.driver}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {vehicle.fuel !== undefined && (
          <div className="flex flex-col items-end">
            <Fuel className={`w-3 h-3 ${vehicle.fuel > 50 ? 'text-green-500' : vehicle.fuel > 30 ? 'text-yellow-500' : 'text-red-500'}`} />
            <span className="text-[9px] text-sidebar-foreground/40">{vehicle.fuel}%</span>
          </div>
        )}
        {vehicle.signal !== undefined && (
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((bar) => (
              <div
                key={bar}
                className={`w-0.5 rounded-full ${
                  bar <= vehicle.signal! ? 'bg-blue-500' : 'bg-sidebar-border'
                }`}
                style={{ height: `${bar * 2 + 4}px` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
VehicleRow.displayName = "VehicleRow";

export const FleetStatusTable = memo(({ vehicles, activeCount, loadingVehicles }: FleetStatusTableProps) => {
  return (
    <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="font-heading font-bold text-sidebar-foreground text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-gold" /> Estado de Flota
        </h3>
        <span className="text-[10px] text-sidebar-foreground/40">{activeCount} activos</span>
      </div>

      <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
        {loadingVehicles ? (
          <div className="text-xs text-center py-10 text-muted-foreground">Cargando flota...</div>
        ) : (
          vehicles?.map((v) => <VehicleRow key={v.id} vehicle={v} />)
        )}
      </div>

      <div className="pt-3 border-t border-sidebar-border mt-2 flex justify-between text-[10px] text-sidebar-foreground/40">
        <span>Total: {vehicles?.length || 0}</span>
        <span>Activos: {activeCount}</span>
      </div>
    </div>
  );
});
FleetStatusTable.displayName = "FleetStatusTable";
