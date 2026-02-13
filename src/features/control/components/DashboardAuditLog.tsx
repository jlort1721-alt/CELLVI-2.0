import { useState } from "react";
import { Shield, Search, Hash, Clock, Eye, Download, CheckCircle, Lock, Filter, ChevronDown, ExternalLink, AlertTriangle, Link2, GitBranch, Fingerprint, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ── Types ───────────────────────────────── */
type EvidenceType = "speed_violation" | "geofence_exit" | "temp_violation" | "fuel_anomaly" | "engine_block" | "policy_trigger";

const typeConfig: Record<EvidenceType, { label: string; color: string; icon: string }> = {
  speed_violation: { label: "Exceso velocidad", color: "text-red-400", icon: "⚡" },
  geofence_exit: { label: "Salida geocerca", color: "text-orange-400", icon: "📍" },
  temp_violation: { label: "Temp. fuera rango", color: "text-blue-400", icon: "🌡️" },
  fuel_anomaly: { label: "Anomalía combustible", color: "text-purple-400", icon: "⛽" },
  engine_block: { label: "Bloqueo motor", color: "text-red-500", icon: "🚫" },
  policy_trigger: { label: "Regla disparada", color: "text-gold", icon: "⚙️" },
};

interface AuditEntry {
  id: string;
  type: EvidenceType;
  hash: string;
  prevHash: string;
  chainIndex: number;
  timestamp: string;
  source: string;
  vehicle: string;
  description: string;
  verified: boolean;
  chainVerified: boolean;
  sealedAt: string;
  deviceFingerprint: string | null;
  merkleRootId: string | null;
  merkleLeafIndex: number | null;
  accessLog: { user: string; action: string; timestamp: string; ip?: string }[];
  data: Record<string, string | number>;
  policyId?: string;
}

/* ── Demo data with hash chain ─────────── */
const GENESIS = "0000000000000000000000000000000000000000000000000000000000000000";
const auditEntries: AuditEntry[] = [
  {
    id: "ev-001", type: "speed_violation",
    hash: "a3f8c2d1e9b04f7a8c2d1e9b04f7a8c2d1e9b04f7a8c2d1e9b04f7a8c2d1e9b0",
    prevHash: GENESIS, chainIndex: 1,
    timestamp: "2026-02-11T14:15:32.456Z", source: "GNSS+NTP", vehicle: "PUT-321",
    description: "Exceso de velocidad: 110 km/h en zona limitada a 80 km/h", verified: true, chainVerified: true,
    sealedAt: "2026-02-11T14:15:33.001Z", deviceFingerprint: "ec:3a:f2:91:b7:44", merkleRootId: "mr-001", merkleLeafIndex: 0,
    data: { speed: 110, limit: 80, lat: 2.4392, lng: -76.6122, satellites: 12, hdop: 0.8 }, policyId: "p-1",
    accessLog: [
      { user: "sistema", action: "sealed", timestamp: "2026-02-11T14:15:33Z" },
      { user: "operator@asegurar.com", action: "viewed", timestamp: "2026-02-11T14:18:00Z", ip: "190.14.xx.xx" },
      { user: "auditor@seguro.com", action: "verified", timestamp: "2026-02-11T15:00:00Z", ip: "200.69.xx.xx" },
    ],
  },
  {
    id: "ev-002", type: "geofence_exit",
    hash: "b7e4a1c3f5d28e9b04f7a8c2d1e9b04f7a8c2d1e9b04f7a8c2d1e9b04f7a8c2d",
    prevHash: "a3f8c2d1e9b04f7a8c2d1e9b04f7a8c2d1e9b04f7a8c2d1e9b04f7a8c2d1e9b0",
    chainIndex: 2,
    timestamp: "2026-02-10T22:30:15.123Z", source: "GNSS", vehicle: "NAR-123",
    description: "Salida de geocerca Base Pasto sin autorización previa", verified: true, chainVerified: true,
    sealedAt: "2026-02-10T22:30:15.789Z", deviceFingerprint: "ec:3a:f2:91:b7:44", merkleRootId: "mr-001", merkleLeafIndex: 1,
    data: { geofence: "Base Pasto", direction: "exit", lat: 1.2136, lng: -77.2811 }, policyId: "p-2",
    accessLog: [
      { user: "sistema", action: "sealed", timestamp: "2026-02-10T22:30:15Z" },
      { user: "admin@asegurar.com", action: "viewed", timestamp: "2026-02-10T22:35:00Z" },
    ],
  },
  {
    id: "ev-003", type: "temp_violation",
    hash: "c9d3b5a7e1f42c6d04f7a8c2d1e9b04f7a8c2d1e9b04f7a8c2d1e9b04f7a8c2d",
    prevHash: "b7e4a1c3f5d28e9b04f7a8c2d1e9b04f7a8c2d1e9b04f7a8c2d1e9b04f7a8c2d",
    chainIndex: 3,
    timestamp: "2026-02-09T08:00:45.789Z", source: "NTP", vehicle: "NAR-456",
    description: "Temperatura fuera de rango: 9.1°C (máximo: 8°C) durante 12 min continuos", verified: true, chainVerified: true,
    sealedAt: "2026-02-09T08:00:46.234Z", deviceFingerprint: "bf:12:c9:44:a1:03", merkleRootId: "mr-001", merkleLeafIndex: 2,
    data: { temp: 9.1, limit: 8, duration: 12, sensor: "BLE-003" }, policyId: "p-3",
    accessLog: [
      { user: "sistema", action: "sealed", timestamp: "2026-02-09T08:00:46Z" },
      { user: "hseq@asegurar.com", action: "viewed", timestamp: "2026-02-09T08:15:00Z" },
    ],
  },
  {
    id: "ev-004", type: "fuel_anomaly",
    hash: "d2f6e8a4b1c37a9e04f7a8c2d1e9b04f7a8c2d1e9b04f7a8c2d1e9b04f7a8c2d",
    prevHash: "c9d3b5a7e1f42c6d04f7a8c2d1e9b04f7a8c2d1e9b04f7a8c2d1e9b04f7a8c2d",
    chainIndex: 4,
    timestamp: "2026-02-08T16:45:22.001Z", source: "GNSS+NTP", vehicle: "CAU-654",
    description: "Caída abrupta de combustible: -18% en 25 min sin parada registrada", verified: true, chainVerified: true,
    sealedAt: "2026-02-08T16:45:22.567Z", deviceFingerprint: null, merkleRootId: null, merkleLeafIndex: null,
    data: { fuelDrop: 18, duration: 25 },
    accessLog: [
      { user: "sistema", action: "sealed", timestamp: "2026-02-08T16:45:22Z" },
      { user: "gerente@asegurar.com", action: "exported", timestamp: "2026-02-08T17:05:00Z" },
    ],
  },
  {
    id: "ev-005", type: "engine_block",
    hash: "e5a9c7d2f4b38e1a04f7a8c2d1e9b04f7a8c2d1e9b04f7a8c2d1e9b04f7a8c2d",
    prevHash: "d2f6e8a4b1c37a9e04f7a8c2d1e9b04f7a8c2d1e9b04f7a8c2d1e9b04f7a8c2d",
    chainIndex: 5,
    timestamp: "2026-02-09T08:05:50.333Z", source: "COMMAND", vehicle: "NAR-456",
    description: "Bloqueo remoto de motor ejecutado por política de temperatura (p-3)", verified: true, chainVerified: true,
    sealedAt: "2026-02-09T08:05:50.789Z", deviceFingerprint: "bf:12:c9:44:a1:03", merkleRootId: null, merkleLeafIndex: null,
    data: { command: "engine_block", triggered_by: "p-3", lat: 0.8615, lng: -77.6736 }, policyId: "p-3",
    accessLog: [
      { user: "sistema", action: "sealed", timestamp: "2026-02-09T08:05:50Z" },
      { user: "sistema", action: "command_executed", timestamp: "2026-02-09T08:05:51Z" },
    ],
  },
];

/* ── Sub-components ──────────────────────── */
const ChainLink = ({ prevHash, chainIndex }: { prevHash: string; chainIndex: number }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sidebar-foreground/[0.03] border border-sidebar-border">
    <Link2 className="w-3 h-3 text-gold/60" />
    <span className="text-[9px] font-mono text-sidebar-foreground/40">#{chainIndex}</span>
    <span className="text-[9px] text-sidebar-foreground/20">←</span>
    <span className="text-[9px] font-mono text-sidebar-foreground/30">{prevHash === GENESIS ? "GENESIS" : `${prevHash.slice(0, 8)}…`}</span>
  </div>
);

const DeviceBadge = ({ fingerprint }: { fingerprint: string | null }) => {
  if (!fingerprint) return null;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-mono">
      <Fingerprint className="w-2.5 h-2.5" /> {fingerprint}
    </span>
  );
};

const MerkleBadge = ({ rootId, leafIndex }: { rootId: string | null; leafIndex: number | null }) => {
  if (!rootId) return null;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-mono">
      <GitBranch className="w-2.5 h-2.5" /> {rootId.slice(0, 6)} [leaf {leafIndex}]
    </span>
  );
};

const AccessLogTimeline = ({ logs }: { logs: AuditEntry["accessLog"] }) => (
  <div className="space-y-1">
    {logs.map((log, i) => (
      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-foreground/[0.02]">
        <div className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
        <span className="text-[10px] font-mono text-sidebar-foreground/30 w-16">
          {new Date(log.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
        <span className="text-[10px] text-sidebar-foreground/70 font-medium">{log.user}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${log.action === "sealed" ? "bg-gold/10 text-gold" :
            log.action === "exported" ? "bg-purple-500/10 text-purple-400" :
              log.action === "verified" ? "bg-green-500/10 text-green-500" :
                "bg-sidebar-foreground/5 text-sidebar-foreground/50"
          }`}>{log.action}</span>
        {log.ip && <span className="text-[9px] text-sidebar-foreground/20 font-mono">{log.ip}</span>}
      </div>
    ))}
  </div>
);

/* ── Main Component ───────────────────────── */
const DashboardAuditLog = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EvidenceType | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = auditEntries.filter((e) => {
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    if (search && !e.description.toLowerCase().includes(search.toLowerCase()) && !e.vehicle.toLowerCase().includes(search.toLowerCase()) && !e.hash.includes(search)) return false;
    return true;
  });

  const totalAccesses = auditEntries.reduce((s, e) => s + e.accessLog.length, 0);
  const totalExports = auditEntries.reduce((s, e) => s + e.accessLog.filter(l => l.action === "exported").length, 0);
  const chainOk = auditEntries.every(e => e.chainVerified);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-sidebar-foreground text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-gold" /> Truth Layer — Auditoría Inmutable
          </h2>
          <p className="text-xs text-sidebar-foreground/50">Hash chaining SHA-256 + Merkle trees · Cadena de custodia · Verificación offline</p>
        </div>
        <Button size="sm" variant="outline" className="text-[10px] h-8 border-gold/20 text-gold">
          <Download className="w-3 h-3 mr-1" /> Exportar Bundle
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { icon: Lock, color: "text-gold", value: auditEntries.length, label: "Eventos sellados" },
          { icon: Link2, color: "text-emerald-400", value: chainOk ? "OK" : "ROTO", label: "Cadena hash", valueColor: chainOk ? "text-emerald-400" : "text-red-500" },
          { icon: GitBranch, color: "text-blue-400", value: "1", label: "Merkle roots" },
          { icon: CheckCircle, color: "text-green-500", value: "100%", label: "Integridad" },
          { icon: Eye, color: "text-blue-400", value: totalAccesses, label: "Accesos" },
          { icon: AlertTriangle, color: "text-red-400", value: "0", label: "Tamper" },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl p-3 border bg-sidebar border-sidebar-border">
            <kpi.icon className={`w-4 h-4 ${kpi.color} mb-1.5`} />
            <div className={`text-xl font-bold font-heading ${"valueColor" in kpi ? (kpi as { valueColor: string }).valueColor : "text-sidebar-foreground"}`}>{kpi.value}</div>
            <div className="text-[10px] text-sidebar-foreground/50">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Chain visualization */}
      <div className="rounded-xl border bg-sidebar border-sidebar-border p-4">
        <div className="text-[10px] font-bold text-sidebar-foreground/40 mb-3 flex items-center gap-2">
          <Link2 className="w-3.5 h-3.5 text-gold" /> HASH CHAIN — Append-Only Ledger
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          <div className="flex-shrink-0 px-2 py-1 rounded bg-sidebar-foreground/5 border border-sidebar-border text-[9px] font-mono text-sidebar-foreground/30">
            GENESIS
          </div>
          {auditEntries.map((e, i) => (
            <div key={e.id} className="flex items-center gap-1 flex-shrink-0">
              <span className="text-sidebar-foreground/15">→</span>
              <button
                onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                className={`px-2 py-1 rounded border text-[9px] font-mono transition-colors ${expandedId === e.id
                    ? "bg-gold/10 border-gold/30 text-gold"
                    : "bg-sidebar-foreground/5 border-sidebar-border text-sidebar-foreground/50 hover:border-gold/20"
                  }`}
              >
                #{e.chainIndex} {e.hash.slice(0, 6)}…
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-sidebar-foreground/30" />
          <input
            type="text" placeholder="Buscar por vehículo, descripción o hash…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-sidebar-accent border border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/30 outline-none focus:border-gold/40"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-3 h-3 text-sidebar-foreground/30" />
          {(["all", ...Object.keys(typeConfig)] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t as EvidenceType | "all")}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${typeFilter === t ? "bg-gold/20 text-gold" : "text-sidebar-foreground/40 hover:text-sidebar-foreground/60"}`}
            >
              {t === "all" ? "Todos" : typeConfig[t as EvidenceType]?.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border bg-sidebar border-sidebar-border p-12 text-center">
            <Shield className="w-10 h-10 text-sidebar-foreground/10 mx-auto mb-3" />
            <p className="text-sm text-sidebar-foreground/30">No se encontraron registros</p>
          </div>
        ) : filtered.map((entry) => {
          const tc = typeConfig[entry.type];
          const isExpanded = expandedId === entry.id;
          return (
            <div key={entry.id} className={`rounded-xl border bg-sidebar transition-colors ${isExpanded ? "border-gold/30" : "border-sidebar-border hover:border-sidebar-foreground/15"}`}>
              <button onClick={() => setExpandedId(isExpanded ? null : entry.id)} className="w-full text-left p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sidebar-foreground/5 flex items-center justify-center text-sm flex-shrink-0">{tc.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={`text-xs font-bold ${tc.color}`}>{tc.label}</span>
                    <span className="text-[10px] text-sidebar-foreground/30">•</span>
                    <span className="text-xs font-bold text-sidebar-foreground">{entry.vehicle}</span>
                    {entry.policyId && <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold/10 text-gold font-mono">{entry.policyId}</span>}
                    <DeviceBadge fingerprint={entry.deviceFingerprint} />
                    <MerkleBadge rootId={entry.merkleRootId} leafIndex={entry.merkleLeafIndex} />
                  </div>
                  <p className="text-xs text-sidebar-foreground/70 line-clamp-1">{entry.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-sidebar-foreground/30">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(entry.timestamp).toLocaleString("es-CO")}</span>
                    <span className="flex items-center gap-1 font-mono"><Hash className="w-3 h-3" />#{entry.chainIndex} {entry.hash.slice(0, 12)}…</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{entry.accessLog.length}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {entry.chainVerified && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[10px] font-bold">
                      <Link2 className="w-3 h-3" /> Chain OK
                    </span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-sidebar-foreground/30 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-sidebar-border pt-3 space-y-3 animate-in fade-in slide-in-from-top-1">
                  {/* Chain link */}
                  <ChainLink prevHash={entry.prevHash} chainIndex={entry.chainIndex} />

                  {/* Hash */}
                  <div className="rounded-lg bg-sidebar-accent p-3">
                    <div className="text-[10px] text-sidebar-foreground/40 mb-1 font-bold">SHA-256 Hash (chain-linked)</div>
                    <code className="text-[10px] font-mono text-gold break-all">{entry.hash}</code>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-sidebar-foreground/40">
                      <span>Sellado: {new Date(entry.sealedAt).toLocaleString("es-CO")}</span>
                      <span>Fuente: {entry.source}</span>
                    </div>
                  </div>

                  {/* Data payload */}
                  <div>
                    <div className="text-[10px] text-sidebar-foreground/40 font-bold mb-1">Datos del Evento</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(entry.data).map(([key, val]) => (
                        <span key={key} className="px-2 py-1 rounded bg-sidebar-foreground/5 text-[10px] text-sidebar-foreground/60">
                          <span className="text-sidebar-foreground/30">{key}:</span> <span className="font-bold text-sidebar-foreground">{String(val)}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Chain of custody */}
                  <div>
                    <div className="text-[10px] text-sidebar-foreground/40 font-bold mb-2">Cadena de Custodia</div>
                    <AccessLogTimeline logs={entry.accessLog} />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="text-[10px] h-7 border-gold/20 text-gold">
                      <ExternalLink className="w-3 h-3 mr-1" /> Verificar Hash
                    </Button>
                    <Button size="sm" variant="outline" className="text-[10px] h-7 border-sidebar-border text-sidebar-foreground/50">
                      <FileCheck className="w-3 h-3 mr-1" /> Merkle Proof
                    </Button>
                    <Button size="sm" variant="outline" className="text-[10px] h-7 border-sidebar-border text-sidebar-foreground/50">
                      <Download className="w-3 h-3 mr-1" /> Exportar Forense
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardAuditLog;
