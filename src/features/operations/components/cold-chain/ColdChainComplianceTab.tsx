import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ShieldCheck, ClipboardCheck } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import type { ColdChainUnit, ComplianceRecord } from "@/lib/coldChainData";
import { complianceStatusConfig, itemVariants } from "./coldChainConfig";

// ── Props ─────────────────────────────────────────────────────────────

interface ColdChainComplianceTabProps {
  complianceSummary: { compliant: number; nonCompliant: number; pending: number; total: number; rate: number };
  allComplianceRecords: ComplianceRecord[];
  allUnits: ColdChainUnit[];
}

// ── Component ─────────────────────────────────────────────────────────

const ColdChainComplianceTab = React.memo<ColdChainComplianceTabProps>(({
  complianceSummary,
  allComplianceRecords,
  allUnits,
}) => {
  const { t } = useTranslation();

  return (
    <TabsContent value="compliance" className="mt-5 space-y-5">
      {/* Summary cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl p-4 border bg-green-500/5 border-green-500/10">
          <div className="text-2xl font-bold font-heading text-green-500 tracking-tighter">{complianceSummary.compliant}</div>
          <div className="text-[9px] text-sidebar-foreground/30 uppercase tracking-widest font-bold">{t("coldChain.compliant")}</div>
        </div>
        <div className="rounded-2xl p-4 border bg-red-500/5 border-red-500/10">
          <div className="text-2xl font-bold font-heading text-red-500 tracking-tighter">{complianceSummary.nonCompliant}</div>
          <div className="text-[9px] text-sidebar-foreground/30 uppercase tracking-widest font-bold">{t("coldChain.nonCompliant")}</div>
        </div>
        <div className="rounded-2xl p-4 border bg-yellow-500/5 border-yellow-500/10">
          <div className="text-2xl font-bold font-heading text-yellow-500 tracking-tighter">{complianceSummary.pending}</div>
          <div className="text-[9px] text-sidebar-foreground/30 uppercase tracking-widest font-bold">{t("coldChain.underReview")}</div>
        </div>
        <div className="rounded-2xl p-4 border bg-purple-500/5 border-purple-500/10">
          <div className="text-2xl font-bold font-heading text-purple-400 tracking-tighter">{complianceSummary.rate}%</div>
          <div className="text-[9px] text-sidebar-foreground/30 uppercase tracking-widest font-bold">{t("coldChain.complianceRate")}</div>
        </div>
      </motion.div>

      {/* Compliance records table */}
      <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-5 shadow-2xl">
        <h4 className="text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-2">
          <ClipboardCheck className="w-3.5 h-3.5" /> {t("coldChain.globalComplianceRecords")}
        </h4>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
          {allComplianceRecords.map((record) => {
            const unit = allUnits.find(u => u.id === record.unitId) ?? allUnits[0];
            const statusCfg = complianceStatusConfig[record.status];
            return (
              <div key={record.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all">
                <div className={`p-2 rounded-lg ${statusCfg.bg} shrink-0`}>
                  <ShieldCheck className={`w-4 h-4 ${statusCfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-sidebar-foreground">{unit?.vehiclePlate}</span>
                    <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">{record.standard}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${statusCfg.bg} ${statusCfg.color}`}>{t(statusCfg.labelKey)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[8px] text-sidebar-foreground/30">
                    <span>Trip: {record.tripId}</span>
                    <span>Cert: {record.certNumber}</span>
                    <span>Auditoría: {new Date(record.auditDate).toLocaleDateString("es-CO")}</span>
                    <span>Desviaciones: {record.deviations}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-lg font-bold font-heading tracking-tighter ${record.score >= 90 ? "text-green-500" : record.score >= 70 ? "text-yellow-500" : "text-red-500"}`}>
                    {record.score}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </TabsContent>
  );
});

ColdChainComplianceTab.displayName = "ColdChainComplianceTab";

export default ColdChainComplianceTab;
