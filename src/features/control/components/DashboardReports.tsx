import { useState } from "react";
import { useTranslation } from "react-i18next";
import { vehicleService, routeService, fuelService, geofenceService, alertService } from "@/lib/demoServices";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DashboardReports = () => {
  const { t } = useTranslation();
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [generating, setGenerating] = useState<string | null>(null);
  const vehicles = vehicleService.getAll();

  const generateRouteReport = () => {
    setGenerating("route");
    try {
      const doc = new jsPDF();
      const routes = routeService.getAll(vehicleFilter ? { vehicleId: vehicleFilter } : undefined);

      doc.setFillColor(26, 39, 68);
      doc.rect(0, 0, 210, 35, "F");
      doc.setTextColor(212, 160, 23);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("ASEGURAR LTDA", 105, 15, { align: "center" });
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text(t("dashboard.routeReport"), 105, 23, { align: "center" });
      doc.setFontSize(8);
      doc.text(`${new Date().toLocaleString("es-CO")}`, 105, 30, { align: "center" });

      doc.setTextColor(0);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const totalKm = routes.reduce((s, r) => s + r.distanceKm, 0);
      const totalFuel = routes.reduce((s, r) => s + r.fuelUsedL, 0);
      const totalStops = routes.reduce((s, r) => s + r.stops, 0);
      doc.text(`${t("dashboard.routes")}: ${routes.length} | Km: ${totalKm} | ${t("dashboard.fuelUsed")}: ${totalFuel} L | ${t("dashboard.stops")}: ${totalStops}`, 14, 45);

      autoTable(doc, {
        startY: 52,
        head: [[t("dashboard.date"), t("dashboard.vehicle"), t("dashboard.origin"), t("dashboard.destination"), "Km", t("dashboard.duration"), "L", t("dashboard.stops")]],
        body: routes.map((r) => [r.date, r.plate, r.origin, r.destination, r.distanceKm, `${Math.floor(r.durationMin / 60)}h ${r.durationMin % 60}m`, r.fuelUsedL, r.stops]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 39, 68], textColor: [212, 160, 23] },
      });

      doc.save("reporte-ruta-asegurar.pdf");
    } finally {
      setGenerating(null);
    }
  };

  const generateOperationReport = () => {
    setGenerating("operation");
    try {
      const doc = new jsPDF();
      const allAlerts = alertService.getAll();
      const geos = geofenceService.getAll();
      const fuelStats = fuelService.getStats(vehicleFilter || undefined);

      doc.setFillColor(26, 39, 68);
      doc.rect(0, 0, 210, 35, "F");
      doc.setTextColor(212, 160, 23);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("ASEGURAR LTDA", 105, 15, { align: "center" });
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text(t("dashboard.operationReport"), 105, 23, { align: "center" });
      doc.setFontSize(8);
      doc.text(`${new Date().toLocaleString("es-CO")}`, 105, 30, { align: "center" });

      doc.setTextColor(0);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${t("dashboard.vehicles")}: ${vehicles.filter((v) => v.status === "activo").length}/${vehicles.length} | ${t("dashboard.geofences")}: ${geos.filter((g) => g.active).length}/${geos.length} | ${t("dashboard.alerts")}: ${allAlerts.length}`, 14, 45);
      doc.text(`${t("dashboard.avgConsumption")}: ${fuelStats.avg} L/100km | ${t("dashboard.maxConsumption")}: ${fuelStats.max} L/100km`, 14, 51);

      autoTable(doc, {
        startY: 58,
        head: [[t("dashboard.vehicle"), t("dashboard.type"), "Msg", "Sev.", t("dashboard.date")]],
        body: allAlerts.map((a) => [a.plate, a.type, a.message, a.severity, new Date(a.timestamp).toLocaleString("es-CO")]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 39, 68], textColor: [212, 160, 23] },
      });

      const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 120;
      autoTable(doc, {
        startY: finalY + 8,
        head: [[t("dashboard.name"), t("dashboard.type"), t("dashboard.status"), t("dashboard.radius")]],
        body: geos.map((g) => [g.name, g.type, g.active ? t("dashboard.active") : t("dashboard.inactive"), `${g.radiusM}m`]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 39, 68], textColor: [212, 160, 23] },
      });

      doc.save("reporte-operacion-asegurar.pdf");
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3 items-center">
        <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)} className="rounded-lg px-3 py-2 text-xs border bg-sidebar border-sidebar-border text-sidebar-foreground">
          <option value="">{t("dashboard.allVehicles")}</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate}</option>)}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl p-6 border bg-sidebar border-sidebar-border">
          <FileText className="w-8 h-8 mb-3 text-gold" />
          <h3 className="font-bold text-sidebar-foreground text-base mb-2 font-heading">{t("dashboard.routeReport")}</h3>
          <p className="text-xs mb-4 text-sidebar-foreground/40">{t("dashboard.routeReportDesc")}</p>
          <Button onClick={generateRouteReport} disabled={generating === "route"} size="sm" className="bg-sidebar-primary text-sidebar-primary-foreground font-heading font-bold text-xs">
            <Download className="w-3.5 h-3.5 mr-1" />
            {generating === "route" ? t("dashboard.generating") : t("dashboard.downloadPdf")}
          </Button>
        </div>

        <div className="rounded-xl p-6 border bg-sidebar border-sidebar-border">
          <FileText className="w-8 h-8 mb-3 text-blue-500" />
          <h3 className="font-bold text-sidebar-foreground text-base mb-2 font-heading">{t("dashboard.operationReport")}</h3>
          <p className="text-xs mb-4 text-sidebar-foreground/40">{t("dashboard.operationReportDesc")}</p>
          <Button onClick={generateOperationReport} disabled={generating === "operation"} size="sm" className="bg-blue-500 text-white font-heading font-bold text-xs">
            <Download className="w-3.5 h-3.5 mr-1" />
            {generating === "operation" ? t("dashboard.generating") : t("dashboard.downloadPdf")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardReports;
