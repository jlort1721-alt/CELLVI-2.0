import { memo } from "react";
import { Zap, Clock } from "lucide-react";

interface Alert {
  id: string;
  msg: string;
  time: string;
  severity: string;
}

interface AlertsTimelineProps {
  alerts: Alert[];
  loadingAlerts: boolean;
}

const AlertRow = memo(({ alert, isLast }: { alert: Alert; isLast: boolean }) => {
  const severityColor: Record<string, string> = {
    critical: "bg-red-500", high: "bg-orange-500", medium: "bg-yellow-500", low: "bg-blue-400", info: "bg-sidebar-foreground/20",
  };

  return (
    <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-sidebar-foreground/[0.03] transition-colors group cursor-pointer border border-transparent hover:border-sidebar-border/50">
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${severityColor[alert.severity] || "bg-gray-400"}`} />
        {!isLast && <div className="w-px h-full bg-sidebar-border/50 min-h-[20px]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-sidebar-foreground font-medium">{alert.msg}</div>
        <div className="text-[10px] text-sidebar-foreground/30 mt-0.5 flex items-center gap-2">
          <Clock className="w-3 h-3" /> {alert.time}
        </div>
      </div>
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${alert.severity === "critical" || alert.severity === "high"
          ? "bg-red-500/10 text-red-400"
          : "bg-sidebar-foreground/5 text-sidebar-foreground/40"
        }`}>
        Gestionar
      </span>
    </div>
  );
});
AlertRow.displayName = "AlertRow";

export const AlertsTimeline = memo(({ alerts, loadingAlerts }: AlertsTimelineProps) => {
  return (
    <div className="lg:col-span-2 rounded-xl p-4 border bg-sidebar border-sidebar-border h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="font-heading font-bold text-sidebar-foreground text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-gold" /> Actividad en Tiempo Real
        </h3>
        <span className="flex items-center gap-1 text-[10px] text-green-500 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
        </span>
      </div>

      <div className="space-y-1 overflow-y-auto flex-1 pr-2">
        {loadingAlerts ? (
          <div className="text-xs text-sidebar-foreground/40 text-center py-10">Cargando eventos...</div>
        ) : alerts?.length === 0 ? (
          <div className="text-xs text-sidebar-foreground/40 text-center py-10">Sin alertas recientes</div>
        ) : (
          alerts?.map((item, i) => <AlertRow key={item.id} alert={item} isLast={i === alerts.length - 1} />)
        )}
      </div>
    </div>
  );
});
AlertsTimeline.displayName = "AlertsTimeline";
