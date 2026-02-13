
import { useState } from "react";
import { FileText, CheckSquare, Clock, AlertCircle, Download, ShieldCheck, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const DashboardCompliance = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("docs");

  const deadlines = [
    { id: 1, title: "Renovación SOAT - FLT-001", due: "2026-03-15", status: "warning" },
    { id: 2, title: "Revisión Extintores - Base Sur", due: "2026-02-28", status: "critical" },
    { id: 3, title: "Certificación ISO 27001", due: "2026-06-30", status: "ok" },
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
      <div>
        <h2 className="font-heading font-bold text-sidebar-foreground text-2xl flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-gold" /> Centro de Cumplimiento (Compliance)
        </h2>
        <p className="text-sm text-sidebar-foreground/50">Gestión centralizada de RISTRA, PESV, Ley 1581 y documentación legal.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-sidebar border border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/50 font-bold uppercase mb-1">Score Global</div>
          <div className="text-3xl font-heading font-bold text-green-500">98/100</div>
          <div className="text-[10px] text-green-500 mt-1">▲ 2 pts vs mes anterior</div>
        </div>
        <div className="p-4 rounded-xl bg-sidebar border border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/50 font-bold uppercase mb-1">Doc. Vencidos</div>
          <div className="text-3xl font-heading font-bold text-red-500">1</div>
          <div className="text-[10px] text-red-400 mt-1">Acción inmediata requerida</div>
        </div>
        <div className="p-4 rounded-xl bg-sidebar border border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/50 font-bold uppercase mb-1">Reportes RUNT</div>
          <div className="text-3xl font-heading font-bold text-blue-500">100%</div>
          <div className="text-[10px] text-sidebar-foreground/40 text-blue-400 mt-1">Transmisión exitosa</div>
        </div>
        <div className="p-4 rounded-xl bg-sidebar border border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/50 font-bold uppercase mb-1">Auditoría 1581</div>
          <div className="text-3xl font-heading font-bold text-gold">OK</div>
          <div className="text-[10px] text-sidebar-foreground/40 mt-1">Última rev: Ayer</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-sidebar-border">
            {['Documentación', 'PESV', 'Habeas Data'].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'docs' && tab === 'Documentación' ? 'border-gold text-gold' : 'border-transparent text-sidebar-foreground/60 hover:text-sidebar-foreground'}`}
                onClick={() => setActiveTab(tab === 'Documentación' ? 'docs' : 'other')}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Document List */}
          <div className="bg-sidebar rounded-xl border border-sidebar-border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-sidebar-accent border-b border-sidebar-border text-xs uppercase text-sidebar-foreground/40">
                <tr>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Entidad</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sidebar-border">
                {[
                  { name: "Póliza Responsabilidad Civil", entity: "Seguros Bolívar", status: "Vigente", color: "green" },
                  { name: "Certificado Cámara Comercio", entity: "CCB", status: "Vigente", color: "green" },
                  { name: "Plan Estratégico Seguridad Vial", entity: "MinTransporte", status: "En Revisión", color: "yellow" },
                  { name: "Revisión Técnico-Mecánica VH-004", entity: "CDA El Listón", status: "Vencido", color: "red" },
                ].map((doc, i) => (
                  <tr key={i} className="hover:bg-sidebar-accent/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-sidebar-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sidebar-foreground/40" />
                      {doc.name}
                    </td>
                    <td className="px-4 py-3 text-sidebar-foreground/60">{doc.entity}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-${doc.color}-500/10 text-${doc.color}-500`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full hover:bg-gold/10 hover:text-gold">
                        <Download className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: Upcoming Deadlines */}
        <div className="bg-sidebar rounded-xl border border-sidebar-border p-5 h-fit">
          <h3 className="font-heading font-bold text-sidebar-foreground mb-4 flex items-center justify-between">
            <span>📅 Próximos Vencimientos</span>
          </h3>
          <div className="space-y-4">
            {deadlines.map((d) => (
              <div key={d.id} className="flex items-start gap-3 p-3 rounded-lg bg-sidebar-accent/50 border border-sidebar-border hover:border-sidebar-foreground/30 transition-colors cursor-pointer group">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${d.status === 'critical' ? 'bg-red-500 animate-pulse' : d.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                <div className="flex-1">
                  <div className="text-xs font-bold text-sidebar-foreground group-hover:text-gold transition-colors">{d.title}</div>
                  <div className="text-[10px] text-sidebar-foreground/50 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" /> Vence: {d.due}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-sidebar-foreground/20 group-hover:text-gold mt-1" />
              </div>
            ))}
          </div>

          <Button className="w-full mt-4 bg-gold hover:bg-gold/90 text-sidebar font-bold text-xs">
            Programar Recordatorio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardCompliance;
