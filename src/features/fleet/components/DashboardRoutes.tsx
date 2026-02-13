import { useState } from "react";
import { useTranslation } from "react-i18next";
import { routeService, vehicleService } from "@/lib/demoServices";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, MapPin } from "lucide-react";

const DashboardRoutes = () => {
  const { t } = useTranslation();
  const [vehicleFilter, setVehicleFilter] = useState("");
  const vehicles = vehicleService.getAll();
  const routes = routeService.getAll(vehicleFilter ? { vehicleId: vehicleFilter } : undefined);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const detail = selectedRoute ? routeService.getById(selectedRoute) : null;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <select
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          className="rounded-lg px-3 py-2 text-xs border bg-sidebar border-sidebar-border text-sidebar-foreground"
        >
          <option value="">{t("dashboard.allVehicles")}</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.plate} — {v.driver}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border overflow-hidden bg-sidebar border-sidebar-border">
        <Table>
          <TableHeader>
            <TableRow className="border-sidebar-border">
              <TableHead className="text-gold text-xs">{t("dashboard.date")}</TableHead>
              <TableHead className="text-gold text-xs">{t("dashboard.vehicle")}</TableHead>
              <TableHead className="text-gold text-xs">{t("dashboard.origin")}</TableHead>
              <TableHead className="text-gold text-xs">{t("dashboard.destination")}</TableHead>
              <TableHead className="text-gold text-xs">{t("dashboard.distance")}</TableHead>
              <TableHead className="text-gold text-xs">{t("dashboard.duration")}</TableHead>
              <TableHead className="text-gold text-xs">{t("dashboard.stops")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.map((r) => (
              <TableRow
                key={r.id}
                className="cursor-pointer border-sidebar-border/30"
                onClick={() => setSelectedRoute(selectedRoute === r.id ? null : r.id)}
              >
                <TableCell className="text-sidebar-foreground text-xs">{r.date}</TableCell>
                <TableCell className="text-sidebar-foreground text-xs font-bold">{r.plate}</TableCell>
                <TableCell className="text-sidebar-foreground/60 text-xs">{r.origin}</TableCell>
                <TableCell className="text-sidebar-foreground/60 text-xs">{r.destination}</TableCell>
                <TableCell className="text-sidebar-foreground text-xs">{r.distanceKm} km</TableCell>
                <TableCell className="text-sidebar-foreground/60 text-xs">{Math.floor(r.durationMin / 60)}h {r.durationMin % 60}m</TableCell>
                <TableCell className="text-sidebar-foreground/60 text-xs">{r.stops}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {detail && (
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <h3 className="font-bold text-sidebar-foreground text-sm mb-4 font-heading">
            {t("dashboard.timeline")}: {detail.plate} — {detail.origin} → {detail.destination}
          </h3>
          <div className="space-y-3 ml-4 border-l-2 border-gold/30">
            {detail.events.map((ev, i) => (
              <div key={i} className="relative pl-6 pb-2">
                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full" style={{
                  background: ev.type === "speeding" || ev.type === "fuel_drop" ? "#ef4444" : ev.type === "start" || ev.type === "end" ? "#22c55e" : "hsl(45,95%,55%)"
                }} />
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-sidebar-foreground/30" />
                  <span className="text-[10px] font-bold text-sidebar-foreground/50">{ev.time}</span>
                  <MapPin className="w-3 h-3 text-sidebar-foreground/20" />
                </div>
                <div className="text-xs text-sidebar-foreground mt-0.5">{ev.description}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-4 text-[10px] text-sidebar-foreground/40">
            <span>{t("dashboard.fuelUsed")}: {detail.fuelUsedL} L</span>
            <span>{t("dashboard.efficiency")}: {(detail.fuelUsedL / detail.distanceKm * 100).toFixed(1)} L/100km</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardRoutes;
