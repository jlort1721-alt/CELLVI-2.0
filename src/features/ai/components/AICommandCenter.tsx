import { memo, useRef, useEffect, useMemo, useCallback } from 'react';
import { Brain, Cpu, HardDrive, Wifi, Zap, Activity, AlertTriangle, CheckCircle, Clock, ArrowUpRight, Shield, Search, BarChart3, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAIAgent } from '../hooks/useAIAgent';
import AgentMetricsPanel from './AgentMetricsPanel';
import EscalationManager from './EscalationManager';
import type { AIDecisionLog, DeviceStatus } from '../types/agentTypes';

// Decision type config
const decisionTypeConfig: Record<string, { color: string; label: string }> = {
  anomaly_detected: { color: 'text-red-400', label: 'ANOMALÍA' },
  alert_auto_resolved: { color: 'text-green-500', label: 'AUTO-RESUELTO' },
  escalation_triggered: { color: 'text-orange-500', label: 'ESCALACIÓN' },
  pattern_identified: { color: 'text-purple-400', label: 'PATRÓN' },
  recommendation_generated: { color: 'text-blue-400', label: 'RECOMENDACIÓN' },
  correlation_found: { color: 'text-cyan-400', label: 'CORRELACIÓN' },
  geofence_violation: { color: 'text-yellow-500', label: 'GEOCERCA' },
  predictive_maintenance: { color: 'text-amber-400', label: 'PREDICTIVO' },
};

const resultConfig: Record<string, { color: string; bg: string }> = {
  success: { color: 'text-green-500', bg: 'bg-green-500/10' },
  pending: { color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  failed: { color: 'text-red-500', bg: 'bg-red-500/10' },
  escalated: { color: 'text-orange-500', bg: 'bg-orange-500/10' },
};

const statusColors: Record<string, string> = {
  ok: '#22c55e',
  warning: '#eab308',
  alert: '#ef4444',
  offline: '#6b7280',
};

// Canvas-based device grid for rendering 10K+ devices
const DeviceGrid = memo(({ devices }: { devices: DeviceStatus[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const cols = Math.ceil(Math.sqrt(devices.length * (width / height)));
    const rows = Math.ceil(devices.length / cols);
    const cellW = width / cols;
    const cellH = height / rows;
    const size = Math.max(1.5, Math.min(cellW, cellH) - 0.5);

    devices.forEach((device, i) => {
      const x = (i % cols) * cellW;
      const y = Math.floor(i / cols) * cellH;
      ctx.fillStyle = statusColors[device.status] || '#6b7280';
      ctx.fillRect(x, y, size, size);
    });
  }, [devices]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded-xl"
      style={{ imageRendering: 'pixelated' }}
    />
  );
});
DeviceGrid.displayName = 'DeviceGrid';

// Virtualized decision log feed
const DecisionLogFeed = memo(({ decisions }: { decisions: AIDecisionLog[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: decisions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 15,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto font-mono text-[10px] bg-sidebar-accent/50 rounded-xl border border-white/5 p-2">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((item) => {
          const d = decisions[item.index];
          const typeCfg = decisionTypeConfig[d.type] || { color: 'text-sidebar-foreground/40', label: d.type };
          const resCfg = resultConfig[d.result] || resultConfig.pending;

          return (
            <div
              key={item.key}
              ref={virtualizer.measureElement}
              data-index={item.index}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${item.start}px)` }}
              className={`flex items-start gap-2 py-1.5 px-2 rounded-lg transition-colors ${item.index === 0 ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}
            >
              <span className="text-sidebar-foreground/30 shrink-0 w-12">{new Date(d.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              <span className={`shrink-0 w-24 text-[8px] font-bold uppercase ${typeCfg.color}`}>{typeCfg.label}</span>
              <span className={`shrink-0 text-[8px] font-bold px-1 py-0.5 rounded ${resCfg.bg} ${resCfg.color}`}>
                {(d.confidence * 100).toFixed(0)}%
              </span>
              <span className="text-sidebar-foreground/40 flex-1 truncate">{d.description}</span>
              {d.vehiclePlate && <span className="text-sidebar-foreground/30 shrink-0">{d.vehiclePlate}</span>}
              <span className="text-sidebar-foreground/20 shrink-0 w-10 text-right">{d.processingTimeMs}ms</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
DecisionLogFeed.displayName = 'DecisionLogFeed';

// Main AI Command Center
const AICommandCenter = memo(() => {
  const { agentState, decisionLog, metrics, anomalies, escalations, devices, acknowledgeEscalation, resolveEscalation } = useAIAgent();

  // Device status counts
  const deviceCounts = useMemo(() => {
    const counts = { ok: 0, warning: 0, alert: 0, offline: 0 };
    devices.forEach((d) => { counts[d.status]++; });
    return counts;
  }, [devices]);

  // Anomaly distribution for chart
  const anomalyDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    anomalies.forEach((a) => { counts[a.type] = (counts[a.type] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({
      type: type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
    }));
  }, [anomalies]);

  return (
    <div className="space-y-5">
      {/* Agent Status Bar */}
      <div className="rounded-2xl border bg-sidebar/40 backdrop-blur-xl border-white/5 p-4 shadow-2xl">
        <div className="flex flex-wrap items-center gap-6">
          {/* Status indicator */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                <Brain className="w-5 h-5 text-green-500" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 animate-pulse border-2 border-sidebar" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-heading font-bold text-sidebar-foreground">CELLVI NeuroCore</span>
                <span className="text-[8px] font-bold uppercase tracking-widest bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                  {agentState.status.toUpperCase()}
                </span>
              </div>
              <span className="text-[9px] text-sidebar-foreground/30">Agente Autónomo de Control — v2.5.4</span>
            </div>
          </div>

          <div className="flex-1" />

          {/* Live metrics */}
          {[
            { icon: Wifi, label: 'Dispositivos', value: agentState.devicesMonitored.toLocaleString('es-CO'), color: 'text-blue-400' },
            { icon: Activity, label: 'Eventos/s', value: agentState.telemetryEventsPerSec.toString(), color: 'text-green-500' },
            { icon: Zap, label: 'Alertas/s', value: agentState.alertsProcessedPerSec.toString(), color: 'text-orange-500' },
            { icon: Clock, label: 'Uptime', value: agentState.uptime, color: 'text-gold' },
          ].map((m) => (
            <div key={m.label} className="flex items-center gap-2">
              <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
              <div>
                <div className={`text-sm font-bold font-heading ${m.color}`}>{m.value}</div>
                <div className="text-[7px] uppercase tracking-widest text-sidebar-foreground/25 font-bold">{m.label}</div>
              </div>
            </div>
          ))}

          {/* CPU & Memory bars */}
          <div className="flex items-center gap-4">
            <div className="w-20">
              <div className="flex items-center justify-between text-[7px] text-sidebar-foreground/30 font-bold mb-1">
                <span className="flex items-center gap-1"><Cpu className="w-2.5 h-2.5" /> CPU</span>
                <span>{agentState.cpuLoad}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${agentState.cpuLoad > 70 ? 'bg-red-500' : agentState.cpuLoad > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${agentState.cpuLoad}%` }} />
              </div>
            </div>
            <div className="w-20">
              <div className="flex items-center justify-between text-[7px] text-sidebar-foreground/30 font-bold mb-1">
                <span className="flex items-center gap-1"><HardDrive className="w-2.5 h-2.5" /> MEM</span>
                <span>{agentState.memoryUsage}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${agentState.memoryUsage > 70 ? 'bg-red-500' : agentState.memoryUsage > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${agentState.memoryUsage}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Panel */}
      <AgentMetricsPanel metrics={metrics} />

      {/* Main Grid: Decision Log + Device Grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Decision Log Feed */}
        <div className="lg:col-span-2 rounded-3xl border bg-sidebar/40 backdrop-blur-xl border-white/5 p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Feed de Decisiones en Tiempo Real
            </h4>
            <div className="flex items-center gap-2 text-[8px] text-sidebar-foreground/30">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {decisionLog.length} entradas
            </div>
          </div>
          <div className="h-[380px]">
            <DecisionLogFeed decisions={decisionLog} />
          </div>
        </div>

        {/* Device Status Grid */}
        <div className="rounded-3xl border bg-sidebar/40 backdrop-blur-xl border-white/5 p-5 shadow-2xl">
          <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Shield className="w-3.5 h-3.5" /> Mapa de {devices.length.toLocaleString('es-CO')} Dispositivos
          </h4>
          <div className="h-[280px] mb-4">
            <DeviceGrid devices={devices} />
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { status: 'ok', label: 'Operativos', count: deviceCounts.ok, color: 'bg-green-500' },
              { status: 'warning', label: 'Advertencia', count: deviceCounts.warning, color: 'bg-yellow-500' },
              { status: 'alert', label: 'Alerta', count: deviceCounts.alert, color: 'bg-red-500' },
              { status: 'offline', label: 'Desconectados', count: deviceCounts.offline, color: 'bg-gray-500' },
            ].map((s) => (
              <div key={s.status} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/5">
                <div className={`w-2.5 h-2.5 rounded-sm ${s.color}`} />
                <span className="text-[9px] text-sidebar-foreground/40 flex-1">{s.label}</span>
                <span className="text-[9px] font-bold text-sidebar-foreground/60 font-mono">{s.count.toLocaleString('es-CO')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Hourly Alert Volume */}
        <div className="rounded-3xl border bg-sidebar/40 backdrop-blur-xl border-white/5 p-5 shadow-2xl">
          <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest flex items-center gap-2 mb-4">
            <BarChart3 className="w-3.5 h-3.5" /> Volumen de Alertas por Hora (24h)
          </h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.hourlyAlertVolume}>
                <defs>
                  <linearGradient id="aiAlertGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }} interval={3} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 10 }} />
                <Area type="monotone" dataKey="count" stroke="#f97316" fill="url(#aiAlertGrad)" strokeWidth={2} name="Alertas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Anomaly Distribution */}
        <div className="rounded-3xl border bg-sidebar/40 backdrop-blur-xl border-white/5 p-5 shadow-2xl">
          <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Search className="w-3.5 h-3.5" /> Distribución de Anomalías Detectadas
          </h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={anomalyDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 10 }} />
                <Bar dataKey="count" fill="#a855f7" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Escalation Manager */}
      <EscalationManager
        escalations={escalations}
        onAcknowledge={acknowledgeEscalation}
        onResolve={resolveEscalation}
      />
    </div>
  );
});
AICommandCenter.displayName = 'AICommandCenter';

export default AICommandCenter;
