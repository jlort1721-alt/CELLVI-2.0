import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, CheckCircle, Clock, AlertTriangle, Shield, User, Zap } from 'lucide-react';
import type { EscalationEvent } from '../types/agentTypes';
import { Button } from '@/components/ui/button';

const STATUS_ORDER: Record<string, number> = { pending: 0, acknowledged: 1, resolved: 2 };

const severityColors: Record<string, string> = {
  speed_anomaly: 'text-orange-500',
  temp_anomaly: 'text-blue-400',
  gnss_spoofing: 'text-red-500',
  fuel_anomaly: 'text-yellow-500',
  route_deviation: 'text-purple-400',
  geofence_violation: 'text-cyan-400',
};

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const EscalationItem = memo(({ escalation, onAcknowledge, onResolve }: {
  escalation: EscalationEvent;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}) => {
  const { t } = useTranslation();
  const anomalyColor = severityColors[escalation.anomalyType] || 'text-sidebar-foreground/60';

  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      escalation.status === 'pending'
        ? 'border-red-500/20 bg-red-500/5 shadow-lg shadow-red-500/5'
        : escalation.status === 'acknowledged'
        ? 'border-yellow-500/20 bg-yellow-500/5'
        : 'border-green-500/20 bg-green-500/5 opacity-60'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${escalation.status === 'pending' ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
            <ArrowUpRight className={`w-4 h-4 ${escalation.status === 'pending' ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sidebar-foreground">{escalation.vehiclePlate}</span>
              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/5 ${anomalyColor}`}>
                {escalation.anomalyType.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[9px] text-sidebar-foreground/30">
              <Clock className="w-2.5 h-2.5" /> {getTimeAgo(escalation.timestamp)}
              <User className="w-2.5 h-2.5 ml-1" /> {escalation.assignedTo}
            </div>
          </div>
        </div>
        {/* Confidence */}
        <div className="text-right">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-gold" />
            <span className="text-xs font-bold text-gold font-mono">{(escalation.aiConfidence * 100).toFixed(0)}%</span>
          </div>
          <span className="text-[7px] text-sidebar-foreground/20 uppercase font-bold tracking-widest">Confianza IA</span>
        </div>
      </div>

      {/* Reason */}
      <p className="text-[10px] text-sidebar-foreground/50 mb-2 leading-relaxed">{escalation.reason}</p>

      {/* AI Recommendation */}
      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/10 mb-3">
        <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-[8px] font-bold uppercase text-purple-400 tracking-widest">Recomendación IA</span>
          <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">{escalation.recommendation}</p>
        </div>
      </div>

      {/* Actions */}
      {escalation.status === 'pending' && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onAcknowledge(escalation.id)}
            className="h-7 text-[9px] bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 rounded-xl"
            variant="outline"
          >
            <AlertTriangle className="w-3 h-3 mr-1" /> Tomar Control
          </Button>
          <Button
            size="sm"
            onClick={() => onResolve(escalation.id)}
            className="h-7 text-[9px] bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 rounded-xl"
            variant="outline"
          >
            <CheckCircle className="w-3 h-3 mr-1" /> Resolver
          </Button>
        </div>
      )}
      {escalation.status === 'acknowledged' && (
        <Button
          size="sm"
          onClick={() => onResolve(escalation.id)}
          className="h-7 text-[9px] bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 rounded-xl"
          variant="outline"
        >
          <CheckCircle className="w-3 h-3 mr-1" /> Marcar como Resuelto
        </Button>
      )}
    </div>
  );
});
EscalationItem.displayName = 'EscalationItem';

const EscalationManager = memo(({ escalations, onAcknowledge, onResolve }: {
  escalations: EscalationEvent[];
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}) => {
  const pending = useMemo(() => escalations.filter((e) => e.status === 'pending'), [escalations]);
  const acknowledged = useMemo(() => escalations.filter((e) => e.status === 'acknowledged'), [escalations]);
  const resolved = useMemo(() => escalations.filter((e) => e.status === 'resolved'), [escalations]);

  return (
    <div className="rounded-3xl border bg-sidebar/40 backdrop-blur-xl border-white/5 p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest flex items-center gap-2">
          <ArrowUpRight className="w-3.5 h-3.5" /> Cola de Escalación — IA → Humano
        </h4>
        <div className="flex items-center gap-2">
          {pending.length > 0 && (
            <span className="text-[8px] font-bold bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full animate-pulse">
              {pending.length} pendientes
            </span>
          )}
          {acknowledged.length > 0 && (
            <span className="text-[8px] font-bold bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full">
              {acknowledged.length} en proceso
            </span>
          )}
          {resolved.length > 0 && (
            <span className="text-[8px] font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
              {resolved.length} resueltas
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {escalations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-sidebar-foreground/20">
            <CheckCircle className="w-8 h-8 mb-3 text-green-500/30" />
            <span className="text-[11px]">Sin escalaciones pendientes</span>
            <span className="text-[9px] text-sidebar-foreground/15 mt-1">El agente IA está gestionando todo automáticamente</span>
          </div>
        ) : (
          escalations
            .sort((a, b) => (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0))
            .map((escalation) => (
              <EscalationItem
                key={escalation.id}
                escalation={escalation}
                onAcknowledge={onAcknowledge}
                onResolve={onResolve}
              />
            ))
        )}
      </div>
    </div>
  );
});
EscalationManager.displayName = 'EscalationManager';

export default EscalationManager;
