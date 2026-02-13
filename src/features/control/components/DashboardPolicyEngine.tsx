import { useState } from "react";
import { policies, conditionTypes, actionTypes, type Policy, type PolicyStatus, type ConditionType, type ActionType } from "@/lib/policyData";
import { Shield, Plus, Play, Pause, Pencil, Trash2, Zap, Clock, X, ChevronDown, ArrowRight, GripVertical, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statusBadge: Record<PolicyStatus, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-green-500/10", text: "text-green-500", label: "Activa" },
  inactive: { bg: "bg-gray-500/10", text: "text-gray-400", label: "Inactiva" },
  draft: { bg: "bg-yellow-500/10", text: "text-yellow-500", label: "Borrador" },
};

const categoryBadge: Record<string, { bg: string; text: string }> = {
  safety: { bg: "bg-red-500/10", text: "text-red-400" },
  compliance: { bg: "bg-blue-500/10", text: "text-blue-400" },
  operational: { bg: "bg-purple-500/10", text: "text-purple-400" },
  custom: { bg: "bg-gold/10", text: "text-gold" },
};

/* ── Condition Builder Row ─────────────────────────── */
const ConditionRow = ({ condition, index, onRemove, onChange }: {
  condition: { type: ConditionType; operator: string; value: string; label: string };
  index: number; onRemove: () => void;
  onChange: (field: string, val: string) => void;
}) => (
  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10 group">
    <GripVertical className="w-3 h-3 text-sidebar-foreground/20 cursor-grab" />
    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">SI</span>
    <select
      value={condition.type}
      onChange={(e) => onChange("type", e.target.value)}
      className="text-[11px] bg-transparent border-none text-sidebar-foreground outline-none cursor-pointer"
    >
      {conditionTypes.map((ct) => (
        <option key={ct.value} value={ct.value}>{ct.icon} {ct.label}</option>
      ))}
    </select>
    <select
      value={condition.operator}
      onChange={(e) => onChange("operator", e.target.value)}
      className="text-[11px] bg-sidebar-accent rounded px-1.5 py-0.5 border border-sidebar-border text-sidebar-foreground outline-none w-16"
    >
      {[">", "<", "==", "!=", "enter", "exit"].map((op) => (
        <option key={op} value={op}>{op}</option>
      ))}
    </select>
    <Input
      value={condition.value}
      onChange={(e) => onChange("value", e.target.value)}
      className="text-[11px] h-6 w-20 bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
    />
    <button onClick={onRemove} className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-opacity">
      <X className="w-3 h-3 text-red-400" />
    </button>
  </div>
);

/* ── Action Builder Row ───────────────────────────── */
const ActionRow = ({ action, onRemove }: {
  action: { type: ActionType; label: string }; onRemove: () => void;
}) => (
  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gold/5 border border-gold/10 group">
    <GripVertical className="w-3 h-3 text-sidebar-foreground/20 cursor-grab" />
    <span className="text-[10px] font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded">ENTONCES</span>
    <span className="text-xs text-sidebar-foreground">{actionTypes.find((a) => a.value === action.type)?.icon} {action.label}</span>
    <button onClick={onRemove} className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-opacity ml-auto">
      <X className="w-3 h-3 text-red-400" />
    </button>
  </div>
);

/* ── Main Policy Engine ───────────────────────────── */
const DashboardPolicyEngine = () => {
  const [policyList, setPolicyList] = useState<Policy[]>(policies);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderName, setBuilderName] = useState("");
  const [builderDesc, setBuilderDesc] = useState("");
  const [builderCategory, setBuilderCategory] = useState<"safety" | "compliance" | "operational" | "custom">("safety");
  const [builderLogic, setBuilderLogic] = useState<"AND" | "OR">("AND");
  const [builderConditions, setBuilderConditions] = useState<Array<{ type: ConditionType; operator: ">" | "<" | "==" | "!=" | "enter" | "exit"; value: string; label: string }>>([
    { type: "speed", operator: ">", value: "80", label: "Velocidad > 80 km/h" },
  ]);
  const [builderActions, setBuilderActions] = useState<Array<{ type: ActionType; config: Record<string, string>; label: string }>>([
    { type: "alert", config: { severity: "high" }, label: "Alerta alta" },
  ]);

  const toggleStatus = (id: string) => {
    setPolicyList((prev) =>
      prev.map((p) => p.id === id ? { ...p, status: p.status === "active" ? "inactive" : "active" as PolicyStatus } : p)
    );
  };

  const deletePolicy = (id: string) => {
    setPolicyList((prev) => prev.filter((p) => p.id !== id));
    if (selectedPolicy?.id === id) setSelectedPolicy(null);
  };

  const addCondition = () => {
    setBuilderConditions((prev) => [...prev, { type: "speed", operator: ">" as const, value: "", label: "" }]);
  };

  const addAction = (type: ActionType) => {
    const at = actionTypes.find((a) => a.value === type);
    setBuilderActions((prev) => [...prev, { type, config: {}, label: at?.label || type }]);
  };

  const saveRule = () => {
    const newPolicy: Policy = {
      id: `p-${Date.now()}`,
      name: builderName,
      description: builderDesc,
      conditions: builderConditions.map((c) => ({ ...c, label: `${conditionTypes.find((ct) => ct.value === c.type)?.label} ${c.operator} ${c.value}` })),
      actions: builderActions,
      logic: builderLogic,
      status: "draft",
      category: builderCategory,
      triggerCount: 0,
      lastTriggered: null,
      createdAt: new Date().toISOString().split("T")[0],
      createdBy: "Operador",
    };
    setPolicyList((prev) => [newPolicy, ...prev]);
    setShowBuilder(false);
    setBuilderName("");
    setBuilderDesc("");
    setBuilderConditions([{ type: "speed", operator: ">", value: "80", label: "" }]);
    setBuilderActions([{ type: "alert", config: {}, label: "Alerta alta" }]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-sidebar-foreground text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-gold" /> Policy Engine
          </h2>
          <p className="text-xs text-sidebar-foreground/50">Constructor visual de reglas SI → ENTONCES para automatización operacional</p>
        </div>
        <Button size="sm" onClick={() => setShowBuilder(true)} className="bg-gold-gradient text-navy font-heading font-bold text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Nueva Regla
        </Button>
      </div>

      {/* ── Visual Builder ─────────────────────────── */}
      {showBuilder && (
        <div className="rounded-xl border-2 border-gold/30 bg-sidebar p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sidebar-foreground text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold" /> Constructor de Regla
            </h3>
            <button onClick={() => setShowBuilder(false)}>
              <X className="w-4 h-4 text-sidebar-foreground/40" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <Input placeholder="Nombre de la regla" value={builderName} onChange={(e) => setBuilderName(e.target.value)} className="text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground" />
            <div className="flex gap-2">
              <select value={builderCategory} onChange={(e) => setBuilderCategory(e.target.value as "safety" | "compliance" | "operational" | "custom")} className="flex-1 text-xs rounded-lg bg-sidebar-accent border border-sidebar-border text-sidebar-foreground px-3">
                <option value="safety">🛡️ Seguridad</option>
                <option value="compliance">📋 Cumplimiento</option>
                <option value="operational">⚙️ Operacional</option>
                <option value="custom">✨ Personalizada</option>
              </select>
              <select value={builderLogic} onChange={(e) => setBuilderLogic(e.target.value as "AND" | "OR")} className="w-20 text-xs rounded-lg bg-sidebar-accent border border-sidebar-border text-sidebar-foreground px-2">
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
            </div>
          </div>
          <Input placeholder="Descripción (opcional)" value={builderDesc} onChange={(e) => setBuilderDesc(e.target.value)} className="text-xs bg-sidebar-accent border-sidebar-border text-sidebar-foreground" />

          {/* Conditions */}
          <div>
            <div className="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-2">Condiciones</div>
            <div className="space-y-1.5">
              {builderConditions.map((c, i) => (
                <ConditionRow
                  key={i}
                  condition={c}
                  index={i}
                  onRemove={() => setBuilderConditions((prev) => prev.filter((_, j) => j !== i))}
                  onChange={(field, val) => setBuilderConditions((prev) => prev.map((cc, j) => j === i ? { ...cc, [field]: val } : cc))}
                />
              ))}
            </div>
            <button onClick={addCondition} className="mt-2 text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Agregar condición
            </button>
          </div>

          {/* Arrow divider */}
          <div className="flex items-center gap-2 px-4">
            <div className="flex-1 h-px bg-sidebar-border" />
            <ArrowRight className="w-5 h-5 text-gold" />
            <div className="flex-1 h-px bg-sidebar-border" />
          </div>

          {/* Actions */}
          <div>
            <div className="text-[10px] text-gold uppercase font-bold tracking-wider mb-2">Acciones</div>
            <div className="space-y-1.5">
              {builderActions.map((a, i) => (
                <ActionRow key={i} action={a} onRemove={() => setBuilderActions((prev) => prev.filter((_, j) => j !== i))} />
              ))}
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {actionTypes.map((at) => (
                <button
                  key={at.value}
                  onClick={() => addAction(at.value)}
                  className="px-2 py-1 rounded text-[10px] bg-sidebar-foreground/5 text-sidebar-foreground/50 hover:bg-gold/10 hover:text-gold transition-colors"
                >
                  {at.icon} {at.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end gap-2 pt-2 border-t border-sidebar-border">
            <Button size="sm" variant="outline" onClick={() => setShowBuilder(false)} className="text-[10px] h-8 border-sidebar-border text-sidebar-foreground/60">
              Cancelar
            </Button>
            <Button size="sm" onClick={saveRule} disabled={!builderName.trim()} className="bg-gold-gradient text-navy font-heading font-bold text-[10px] h-8">
              <Save className="w-3 h-3 mr-1" /> Guardar como Borrador
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <Zap className="w-5 h-5 text-gold mb-2" />
          <div className="text-2xl font-bold text-sidebar-foreground font-heading">{policyList.length}</div>
          <div className="text-xs text-sidebar-foreground/50">Reglas totales</div>
        </div>
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <Play className="w-5 h-5 text-green-500 mb-2" />
          <div className="text-2xl font-bold text-green-500 font-heading">{policyList.filter((p) => p.status === "active").length}</div>
          <div className="text-xs text-sidebar-foreground/50">Activas</div>
        </div>
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <Shield className="w-5 h-5 text-blue-400 mb-2" />
          <div className="text-2xl font-bold text-sidebar-foreground font-heading">{policyList.reduce((s, p) => s + p.triggerCount, 0)}</div>
          <div className="text-xs text-sidebar-foreground/50">Disparos totales</div>
        </div>
        <div className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <Clock className="w-5 h-5 text-purple-400 mb-2" />
          <div className="text-2xl font-bold text-sidebar-foreground font-heading">{policyList.filter((p) => p.status === "draft").length}</div>
          <div className="text-xs text-sidebar-foreground/50">Borradores</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Policy list */}
        <div className="lg:col-span-2 space-y-3">
          {policyList.map((policy) => {
            const sBadge = statusBadge[policy.status];
            const cBadge = categoryBadge[policy.category];
            return (
              <div
                key={policy.id}
                onClick={() => setSelectedPolicy(policy)}
                className={`rounded-xl p-4 border transition-colors cursor-pointer ${selectedPolicy?.id === policy.id ? "border-gold bg-gold/5" : "border-sidebar-border bg-sidebar hover:border-sidebar-foreground/20"
                  }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-heading font-bold text-sidebar-foreground text-sm">{policy.name}</h4>
                    <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">{policy.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sBadge.bg} ${sBadge.text}`}>{sBadge.label}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cBadge.bg} ${cBadge.text}`}>{policy.category}</span>
                  </div>
                </div>

                {/* Visual flow */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {policy.conditions.map((c, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-medium">
                      SI {c.label}
                    </span>
                  ))}
                  {policy.conditions.length > 1 && (
                    <span className="px-1.5 py-0.5 rounded bg-sidebar-foreground/10 text-sidebar-foreground/60 text-[10px] font-bold">{policy.logic}</span>
                  )}
                  <span className="text-sidebar-foreground/30 text-[10px]">→</span>
                  {policy.actions.map((a, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-gold/10 text-gold text-[10px] font-medium">
                      {a.label}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3 text-[10px] text-sidebar-foreground/40">
                    <span>⚡ {policy.triggerCount} disparos</span>
                    {policy.lastTriggered && (
                      <span>🕐 Último: {new Date(policy.lastTriggered).toLocaleDateString("es-CO")}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); toggleStatus(policy.id); }} className="p-1 rounded hover:bg-sidebar-foreground/10">
                      {policy.status === "active" ? <Pause className="w-3.5 h-3.5 text-yellow-500" /> : <Play className="w-3.5 h-3.5 text-green-500" />}
                    </button>
                    <button className="p-1 rounded hover:bg-sidebar-foreground/10">
                      <Pencil className="w-3.5 h-3.5 text-sidebar-foreground/50" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deletePolicy(policy.id); }} className="p-1 rounded hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="rounded-xl border bg-sidebar border-sidebar-border p-4">
          {selectedPolicy ? (
            <div className="space-y-4">
              <h3 className="font-heading font-bold text-sidebar-foreground text-sm">Detalle de Regla</h3>
              <div>
                <div className="text-[10px] text-sidebar-foreground/40 mb-1">Condiciones ({selectedPolicy.logic})</div>
                {selectedPolicy.conditions.map((c, i) => {
                  const ct = conditionTypes.find((t) => t.value === c.type);
                  return (
                    <div key={i} className="flex items-center gap-2 p-2 rounded bg-blue-500/5 border border-blue-500/10 mb-1.5">
                      <span>{ct?.icon}</span>
                      <span className="text-xs text-sidebar-foreground">{c.label}</span>
                    </div>
                  );
                })}
              </div>
              <div>
                <div className="text-[10px] text-sidebar-foreground/40 mb-1">Acciones</div>
                {selectedPolicy.actions.map((a, i) => {
                  const at = actionTypes.find((t) => t.value === a.type);
                  return (
                    <div key={i} className="flex items-center gap-2 p-2 rounded bg-gold/5 border border-gold/10 mb-1.5">
                      <span>{at?.icon}</span>
                      <span className="text-xs text-sidebar-foreground">{a.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] space-y-1 text-sidebar-foreground/50">
                <div>Creada: {selectedPolicy.createdAt} por {selectedPolicy.createdBy}</div>
                <div>Disparos: {selectedPolicy.triggerCount}</div>
                {selectedPolicy.lastTriggered && <div>Último: {new Date(selectedPolicy.lastTriggered).toLocaleString("es-CO")}</div>}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-sidebar-foreground/30 text-xs">
              Selecciona una regla para ver su detalle
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPolicyEngine;
