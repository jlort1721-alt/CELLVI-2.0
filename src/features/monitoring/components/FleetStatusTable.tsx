import { memo, useState, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Fuel, ArrowUpDown, Download, MapPin, Eye, Send, ChevronDown } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/uiStore";

interface Vehicle {
  id: string;
  plate: string;
  driver?: string;
  status: string;
  speed?: number;
  fuel?: number;
  signal?: number;
}

type SortField = "plate" | "status" | "speed" | "fuel" | "signal";
type StatusFilter = "all" | "activo" | "detenido" | "alerta" | "apagado";

const statusColor: Record<string, string> = {
  activo: "bg-green-500",
  detenido: "bg-yellow-500",
  alerta: "bg-red-500",
  apagado: "bg-gray-500",
};

const statusLabelKey: Record<string, string> = {
  activo: "fleetTable.active",
  detenido: "fleetTable.stopped",
  alerta: "fleetTable.alert",
  apagado: "fleetTable.off",
};

const VehicleRow = memo(({ vehicle, onViewMap, onViewDetail }: {
  vehicle: Vehicle;
  onViewMap: (id: string) => void;
  onViewDetail: (id: string) => void;
}) => {
  const { t } = useTranslation();
  const color = statusColor[vehicle.status] ?? "bg-gray-500";

  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-sidebar-foreground/[0.03] transition-colors group border border-transparent hover:border-sidebar-border/30">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-2 h-2 rounded-full flex-shrink-0 relative">
          {vehicle.status === "activo" && <div className="absolute inset-0 rounded-full animate-ping opacity-75 bg-green-500" />}
          <div className={`relative w-full h-full rounded-full ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-sidebar-foreground font-bold">{vehicle.plate}</span>
            {vehicle.speed !== undefined && vehicle.speed > 0 && (
              <span className="text-[9px] text-blue-400 font-mono">{vehicle.speed} km/h</span>
            )}
          </div>
          <span className="text-[10px] text-sidebar-foreground/30 block truncate">{vehicle.driver}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {vehicle.fuel !== undefined && (
          <div className="flex flex-col items-end">
            <Fuel className={`w-3 h-3 ${vehicle.fuel > 50 ? "text-green-500" : vehicle.fuel > 30 ? "text-yellow-500" : "text-red-500"}`} />
            <span className="text-[9px] text-sidebar-foreground/40">{vehicle.fuel}%</span>
          </div>
        )}
        {vehicle.signal !== undefined && (
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((bar) => (
              <div
                key={bar}
                className={`w-0.5 rounded-full ${bar <= vehicle.signal! ? "bg-blue-500" : "bg-sidebar-border"}`}
                style={{ height: `${bar * 2 + 4}px` }}
              />
            ))}
          </div>
        )}
        {/* Inline actions on hover */}
        <div className="hidden group-hover:flex items-center gap-1 ml-2">
          <button type="button" onClick={() => onViewMap(vehicle.id)} className="p-1 rounded hover:bg-blue-500/10 text-blue-400" title={t("fleetTable.viewOnMap")}>
            <MapPin className="w-3 h-3" />
          </button>
          <button type="button" onClick={() => onViewDetail(vehicle.id)} className="p-1 rounded hover:bg-gold/10 text-gold" title={t("fleetTable.viewDetail")}>
            <Eye className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
});
VehicleRow.displayName = "VehicleRow";

export const FleetStatusTable = memo(({ vehicles, activeCount, loadingVehicles }: {
  vehicles: Vehicle[];
  activeCount: number;
  loadingVehicles: boolean;
}) => {
  const [sortField, setSortField] = useState<SortField>("status");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const setActiveModule = useUIStore((s) => s.setActiveModule);
  const { t } = useTranslation();

  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }, [sortField]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return vehicles ?? [];
    return (vehicles ?? []).filter((v) => v.status === statusFilter);
  }, [vehicles, statusFilter]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortField) {
        case "plate": return a.plate.localeCompare(b.plate) * dir;
        case "status": {
          const order: Record<string, number> = { alerta: 0, activo: 1, detenido: 2, apagado: 3 };
          return ((order[a.status] ?? 4) - (order[b.status] ?? 4)) * dir;
        }
        case "speed": return ((a.speed ?? 0) - (b.speed ?? 0)) * dir;
        case "fuel": return ((a.fuel ?? 0) - (b.fuel ?? 0)) * dir;
        case "signal": return ((a.signal ?? 0) - (b.signal ?? 0)) * dir;
        default: return 0;
      }
    });
  }, [filtered, sortField, sortDir]);

  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  const handleExportCSV = useCallback(() => {
    const headers = ["Placa", "Conductor", "Estado", "Velocidad", "Combustible", "Señal"];
    const rows = sorted.map((v) => [v.plate, v.driver ?? "", v.status, v.speed ?? "", v.fuel ?? "", v.signal ?? ""]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flota_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sorted]);

  const handleViewMap = useCallback((_id: string) => {
    setActiveModule("map");
  }, [setActiveModule]);

  const handleViewDetail = useCallback((_id: string) => {
    setActiveModule("asset-detail");
  }, [setActiveModule]);

  // Status counts
  const counts = useMemo(() => {
    const all = vehicles ?? [];
    return {
      all: all.length,
      activo: all.filter((v) => v.status === "activo").length,
      detenido: all.filter((v) => v.status === "detenido").length,
      alerta: all.filter((v) => v.status === "alerta").length,
      apagado: all.filter((v) => v.status === "apagado").length,
    };
  }, [vehicles]);

  return (
    <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="font-heading font-bold text-sidebar-foreground text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-gold" /> {t("fleetTable.title")}
        </h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleExportCSV} className="h-6 px-2 text-[9px] text-sidebar-foreground/40" title="Exportar CSV">
            <Download className="w-3 h-3 mr-1" /> CSV
          </Button>
          <span className="text-[10px] text-sidebar-foreground/40">{t("fleetTable.activeCount", { count: activeCount })}</span>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 mb-2 flex-shrink-0">
        {(["all", "activo", "detenido", "alerta", "apagado"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors ${statusFilter === s ? "bg-gold/15 text-gold" : "text-sidebar-foreground/30 hover:text-sidebar-foreground/50"}`}
          >
            {s === "all" ? t("fleetTable.all", "Todos") : t(statusLabelKey[s])} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Sort headers */}
      <div className="flex items-center gap-2 px-2.5 mb-1 flex-shrink-0 text-[8px] text-sidebar-foreground/25 uppercase font-bold tracking-wider">
        {([["plate", "fleetTable.plate"], ["status", "fleetTable.status"], ["speed", "fleetTable.speed"], ["fuel", "fleetTable.fuelShort"], ["signal", "fleetTable.signal"]] as [SortField, string][]).map(([field, labelKey]) => (
          <button
            key={field}
            type="button"
            onClick={() => toggleSort(field)}
            className={`flex items-center gap-0.5 hover:text-sidebar-foreground/50 ${sortField === field ? "text-gold" : ""}`}
          >
            {t(labelKey)}
            {sortField === field && <ChevronDown className={`w-2 h-2 transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`} />}
          </button>
        ))}
      </div>

      {/* Virtualized vehicle list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1">
        {loadingVehicles ? (
          <div className="text-xs text-center py-10 text-muted-foreground">{t("fleetTable.loading")}</div>
        ) : sorted.length === 0 ? (
          <div className="text-xs text-center py-10 text-sidebar-foreground/20">{t("fleetTable.noVehicles")}</div>
        ) : (
          <div style={{ height: `${virtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualItem) => (
              <div
                key={sorted[virtualItem.index].id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <VehicleRow
                  vehicle={sorted[virtualItem.index]}
                  onViewMap={handleViewMap}
                  onViewDetail={handleViewDetail}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-sidebar-border mt-2 flex justify-between text-[10px] text-sidebar-foreground/40">
        <span>{t("fleetTable.total", { count: vehicles?.length ?? 0 })}</span>
        <span>{t("fleetTable.showing", { count: sorted.length })}</span>
        <span>{t("fleetTable.activeLabel", { count: activeCount })}</span>
      </div>
    </div>
  );
});
FleetStatusTable.displayName = "FleetStatusTable";
