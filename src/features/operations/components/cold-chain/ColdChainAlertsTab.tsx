import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import type { ColdChainAlert } from "@/lib/coldChainData";
import { itemVariants } from "./coldChainConfig";
import { AlertRow } from "./ColdChainSubComponents";

// ── Props ─────────────────────────────────────────────────────────────

interface ColdChainAlertsTabProps {
  sortedAlerts: ColdChainAlert[];
  alertCounts: { total: number; critical: number; warning: number; info: number };
  acknowledgeAlert: (id: string) => void;
  acknowledgeAllAlerts: () => void;
}

// ── Component ─────────────────────────────────────────────────────────

const ColdChainAlertsTab = React.memo<ColdChainAlertsTabProps>(({
  sortedAlerts,
  alertCounts,
  acknowledgeAlert,
  acknowledgeAllAlerts,
}) => {
  const { t } = useTranslation();

  return (
    <TabsContent value="alerts" className="mt-5 space-y-5">
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl p-4 border bg-red-500/5 border-red-500/10">
            <div className="text-2xl font-bold font-heading text-red-500 tracking-tighter">{alertCounts.critical}</div>
            <div className="text-[9px] text-sidebar-foreground/30 uppercase tracking-widest font-bold">{t("coldChain.criticalCount")}</div>
          </div>
          <div className="rounded-2xl p-4 border bg-yellow-500/5 border-yellow-500/10">
            <div className="text-2xl font-bold font-heading text-yellow-500 tracking-tighter">{alertCounts.warning}</div>
            <div className="text-[9px] text-sidebar-foreground/30 uppercase tracking-widest font-bold">{t("coldChain.warningCount")}</div>
          </div>
          <div className="rounded-2xl p-4 border bg-blue-400/5 border-blue-400/10">
            <div className="text-2xl font-bold font-heading text-blue-400 tracking-tighter">{alertCounts.info}</div>
            <div className="text-[9px] text-sidebar-foreground/30 uppercase tracking-widest font-bold">{t("coldChain.infoCount")}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={acknowledgeAllAlerts} className="text-[10px] h-8 rounded-xl text-green-500 border-green-500/20 hover:bg-green-500/10">
            <BellOff className="w-3 h-3 mr-1.5" /> {t("coldChain.confirmAll")}
          </Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-3xl border bg-sidebar/40 border-white/5 p-5 shadow-2xl">
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {sortedAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} onAcknowledge={acknowledgeAlert} />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </TabsContent>
  );
});

ColdChainAlertsTab.displayName = "ColdChainAlertsTab";

export default ColdChainAlertsTab;
