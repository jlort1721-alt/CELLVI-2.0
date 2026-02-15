import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Radio, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Inbox } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const GatewayMonitor = () => {
  const [tab, setTab] = useState<"overview" | "queue" | "orphans">("overview");

  const { data: messages } = useQuery({
    queryKey: ["device_messages_raw"],
    queryFn: async () => {
      const { data } = await supabase
        .from("device_messages_raw")
        .select("id, imei, protocol, status, created_at, attempts, error_message, event_count")
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
    // ✅ NO MORE POLLING - Use Realtime subscriptions for live message status updates
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const stats = {
    processed: messages?.filter(m => m.status === "processed").length || 0,
    failed: messages?.filter(m => m.status === "failed").length || 0,
    orphan: messages?.filter(m => m.status === "orphan").length || 0,
    pending: messages?.filter(m => m.status === "pending" || m.status === "processing").length || 0,
    deadLetter: messages?.filter(m => m.status === "dead_letter").length || 0,
    total: messages?.length || 0,
  };

  const protocolCounts = messages?.reduce((acc, m) => {
    acc[m.protocol] = (acc[m.protocol] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const protocolData = Object.entries(protocolCounts).map(([name, value]) => ({ name, value }));
  const COLORS = ["#D4AF37", "#3b82f6", "#22c55e", "#ef4444", "#a855f7", "#f97316"];

  const statusData = [
    { name: "Procesados", value: stats.processed, color: "#22c55e" },
    { name: "Fallidos", value: stats.failed, color: "#ef4444" },
    { name: "Huérfanos", value: stats.orphan, color: "#f97316" },
    { name: "Pendientes", value: stats.pending, color: "#3b82f6" },
    { name: "Dead Letter", value: stats.deadLetter, color: "#6b7280" },
  ].filter(d => d.value > 0);

  const retryQueue = messages?.filter(m => m.status === "failed" || m.status === "pending") || [];
  const orphans = messages?.filter(m => m.status === "orphan") || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-sidebar-foreground text-lg flex items-center gap-2">
            <Radio className="w-5 h-5 text-gold" /> Device Gateway Monitor
          </h2>
          <p className="text-xs text-sidebar-foreground/50">Monitoreo de mensajes, protocolos y cola de reintentos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-sidebar-accent border border-sidebar-border w-fit">
        {(["overview", "queue", "orphans"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${tab === t ? "bg-gold/20 text-gold" : "text-sidebar-foreground/40 hover:text-sidebar-foreground/60"}`}
          >
            {t === "overview" ? "Resumen" : t === "queue" ? `Cola (${retryQueue.length})` : `Huérfanos (${orphans.length})`}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
              <CheckCircle className="w-4 h-4 text-green-500 mb-2" />
              <div className="text-2xl font-bold text-green-500 font-heading">{stats.processed}</div>
              <div className="text-[10px] text-sidebar-foreground/50">Procesados</div>
            </div>
            <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
              <XCircle className="w-4 h-4 text-red-400 mb-2" />
              <div className="text-2xl font-bold text-red-400 font-heading">{stats.failed}</div>
              <div className="text-[10px] text-sidebar-foreground/50">Fallidos</div>
            </div>
            <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
              <AlertTriangle className="w-4 h-4 text-orange-400 mb-2" />
              <div className="text-2xl font-bold text-orange-400 font-heading">{stats.orphan}</div>
              <div className="text-[10px] text-sidebar-foreground/50">Huérfanos</div>
            </div>
            <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
              <Clock className="w-4 h-4 text-blue-400 mb-2" />
              <div className="text-2xl font-bold text-blue-400 font-heading">{stats.pending}</div>
              <div className="text-[10px] text-sidebar-foreground/50">Pendientes</div>
            </div>
            <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
              <Inbox className="w-4 h-4 text-sidebar-foreground/40 mb-2" />
              <div className="text-2xl font-bold text-sidebar-foreground font-heading">{stats.total}</div>
              <div className="text-[10px] text-sidebar-foreground/50">Total mensajes</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Status distribution */}
            <div className="rounded-xl border bg-sidebar border-sidebar-border p-4">
              <h4 className="font-heading font-bold text-sidebar-foreground text-sm mb-3">Estado de Mensajes</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(222,55%,12%)", border: "1px solid hsl(45,95%,55%,0.2)", borderRadius: 8, fontSize: 11, color: "white" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Protocol distribution */}
            <div className="rounded-xl border bg-sidebar border-sidebar-border p-4">
              <h4 className="font-heading font-bold text-sidebar-foreground text-sm mb-3">Mensajes por Protocolo</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={protocolData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} />
                    <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} />
                    <Tooltip contentStyle={{ background: "hsl(222,55%,12%)", border: "1px solid hsl(45,95%,55%,0.2)", borderRadius: 8, fontSize: 11, color: "white" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {protocolData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "queue" && (
        <div className="rounded-xl border bg-sidebar border-sidebar-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-sidebar-foreground/40 border-b border-sidebar-border">
                <th className="text-left py-2 px-3">IMEI</th>
                <th className="text-left py-2 px-3">Protocolo</th>
                <th className="text-left py-2 px-3">Estado</th>
                <th className="text-center py-2 px-3">Intentos</th>
                <th className="text-left py-2 px-3">Error</th>
                <th className="text-left py-2 px-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {retryQueue.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-sidebar-foreground/30">Cola vacía ✓</td></tr>
              ) : retryQueue.map((m) => (
                <tr key={m.id} className="border-b border-sidebar-border/30 hover:bg-sidebar-foreground/[0.02]">
                  <td className="py-2 px-3 font-mono text-sidebar-foreground/60">{m.imei}</td>
                  <td className="py-2 px-3"><span className="px-1.5 py-0.5 rounded bg-gold/10 text-gold text-[10px] font-bold">{m.protocol}</span></td>
                  <td className="py-2 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${m.status === "failed" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"}`}>{m.status}</span>
                  </td>
                  <td className="py-2 px-3 text-center font-mono">{m.attempts}/5</td>
                  <td className="py-2 px-3 text-sidebar-foreground/40 truncate max-w-[200px]">{m.error_message || "—"}</td>
                  <td className="py-2 px-3 text-sidebar-foreground/40">{new Date(m.created_at).toLocaleString("es-CO")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "orphans" && (
        <div className="rounded-xl border bg-sidebar border-sidebar-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-sidebar-foreground/40 border-b border-sidebar-border">
                <th className="text-left py-2 px-3">IMEI</th>
                <th className="text-left py-2 px-3">Protocolo</th>
                <th className="text-center py-2 px-3">Eventos</th>
                <th className="text-left py-2 px-3">Error</th>
                <th className="text-left py-2 px-3">Recibido</th>
              </tr>
            </thead>
            <tbody>
              {orphans.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-sidebar-foreground/30">Sin dispositivos huérfanos</td></tr>
              ) : orphans.map((m) => (
                <tr key={m.id} className="border-b border-sidebar-border/30 hover:bg-sidebar-foreground/[0.02]">
                  <td className="py-2 px-3 font-mono text-orange-400">{m.imei}</td>
                  <td className="py-2 px-3"><span className="px-1.5 py-0.5 rounded bg-gold/10 text-gold text-[10px] font-bold">{m.protocol}</span></td>
                  <td className="py-2 px-3 text-center">{m.event_count}</td>
                  <td className="py-2 px-3 text-sidebar-foreground/40 truncate max-w-[200px]">{m.error_message || "—"}</td>
                  <td className="py-2 px-3 text-sidebar-foreground/40">{new Date(m.created_at).toLocaleString("es-CO")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GatewayMonitor;
