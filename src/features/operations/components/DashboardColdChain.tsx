import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Thermometer, AlertTriangle, CheckCircle, XCircle,
  Download, FileCheck, ShieldCheck, Bell, Battery, Truck, Award,
  Wifi, WifiOff, RefreshCw, Eye, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useColdChain, type TabView } from "@/features/operations/hooks/useColdChain";
import { statusConfig, containerVariants, itemVariants } from "./cold-chain/coldChainConfig";
import { KPICard } from "./cold-chain/ColdChainSubComponents";
import ColdChainOverviewTab from "./cold-chain/ColdChainOverviewTab";
import ColdChainAlertsTab from "./cold-chain/ColdChainAlertsTab";
import ColdChainComplianceTab from "./cold-chain/ColdChainComplianceTab";
import ColdChainAnalyticsTab from "./cold-chain/ColdChainAnalyticsTab";

// ── Main Component ────────────────────────────────────────────────────

const DashboardColdChain = () => {
  const {
    selectedUnit, activeTab, filters, sortField, sortDir, alerts, isLiveMode, lastSync,
    stats, filteredUnits, chartData, unitAlerts, unitEvents, unitCompliance,
    alertCounts, complianceSummary, allUnits, allComplianceRecords,
    setSelectedUnit, setActiveTab, acknowledgeAlert, acknowledgeAllAlerts,
    updateSearch, updateStatusFilter, updateClassificationFilter, toggleSort,
    setIsLiveMode, refreshData,
  } = useColdChain();
  const { t, i18n } = useTranslation();

  // Chart data for analytics: compliance by standard
  const complianceByStandard = useMemo(() => {
    const standards = ["GDP", "HACCP", "WHO-PQS", "INVIMA", "RNDC"] as const;
    return standards.map(std => {
      const records = allComplianceRecords.filter(r => r.standard === std);
      const avg = records.length > 0 ? records.reduce((s, r) => s + r.score, 0) / records.length : 0;
      return { standard: std, score: parseFloat(avg.toFixed(1)), count: records.length };
    }).filter(s => s.count > 0);
  }, [allComplianceRecords]);

  // Pie chart data for status distribution
  const statusDistribution = useMemo(() => [
    { name: t("coldChain.statusNormal"), value: stats.normal, fill: "#22c55e" },
    { name: t("coldChain.statusWarning"), value: stats.warning, fill: "#eab308" },
    { name: t("coldChain.statusCritical"), value: stats.critical, fill: "#ef4444" },
    ...(stats.offline > 0 ? [{ name: t("coldChain.statusOffline"), value: stats.offline, fill: "#6b7280" }] : []),
  ], [stats, t]);

  // Deviations per unit for analytics
  const deviationsPerUnit = useMemo(() =>
    filteredUnits.map(u => ({
      plate: u.vehiclePlate,
      deviations: u.totalDeviations24h,
      compliance: u.complianceScore,
    })),
  [filteredUnits]);

  // Pre-sorted alerts for Alerts tab (avoids re-sorting on every render)
  const sortedAlerts = useMemo(() =>
    [...alerts].sort((a, b) => {
      if (a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1;
      const sev = { critical: 0, warning: 1, info: 2 };
      if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }),
  [alerts]);

  if (!selectedUnit) {
    return (
      <div className="flex items-center justify-center h-64 text-sidebar-foreground/50 text-sm">
        {t("coldChain.noUnitsAvailable")}
      </div>
    );
  }

  const selectedCfg = statusConfig[selectedUnit.status];

  return (
    <motion.div className="space-y-5" initial="hidden" animate="visible" variants={containerVariants}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-sidebar-foreground text-2xl flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/10">
              <Thermometer className="w-6 h-6 text-blue-400" />
            </div>
            {t("coldChain.title")}
          </h2>
          <p className="text-[11px] text-sidebar-foreground/40 mt-1 flex items-center gap-2">
            {t("coldChain.subtitle")}
            <span className="flex items-center gap-1 text-[9px] font-bold">
              {isLiveMode ? (
                <span className="flex items-center gap-1 text-green-500"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> {t("coldChain.live")}</span>
              ) : (
                <span className="flex items-center gap-1 text-sidebar-foreground/30"><WifiOff className="w-3 h-3" /> {t("coldChain.offline")}</span>
              )}
            </span>
            <span className="text-[8px] text-sidebar-foreground/20">
              {t("coldChain.sync")}: {lastSync.toLocaleTimeString(i18n.language === "en" ? "en-US" : "es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm" variant="ghost"
            onClick={() => setIsLiveMode(!isLiveMode)}
            className={`h-8 px-3 text-[10px] rounded-xl ${isLiveMode ? "text-green-500 bg-green-500/5 hover:bg-green-500/10" : "text-sidebar-foreground/40 hover:bg-white/5"}`}
          >
            {isLiveMode ? <Wifi className="w-3 h-3 mr-1.5" /> : <WifiOff className="w-3 h-3 mr-1.5" />}
            {isLiveMode ? t("coldChain.live") : t("coldChain.paused")}
          </Button>
          <Button size="sm" variant="ghost" onClick={refreshData} className="h-8 px-3 text-[10px] text-sidebar-foreground/40 hover:bg-white/5 rounded-xl">
            <RefreshCw className="w-3 h-3 mr-1.5" /> {t("coldChain.sync")}
          </Button>
          <Button size="sm" variant="outline" className="text-[10px] h-8 bg-gold/5 border-gold/20 text-gold hover:bg-gold/10 rounded-xl px-3">
            <Download className="w-3 h-3 mr-1.5" /> {t("coldChain.exportRndc")}
          </Button>
          <Button size="sm" variant="outline" className="text-[10px] h-8 bg-purple-500/5 border-purple-500/20 text-purple-400 hover:bg-purple-500/10 rounded-xl px-3">
            <FileCheck className="w-3 h-3 mr-1.5" /> {t("coldChain.reportGdp")}
          </Button>
        </div>
      </motion.div>

      {/* ── KPI Row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        <KPICard icon={Truck} label={t("coldChain.activeUnits")} value={stats.total} color="text-blue-400" trend="up" />
        <KPICard icon={CheckCircle} label={t("coldChain.inNormalRange")} value={stats.normal} color="text-green-500" trend="up" />
        <KPICard icon={AlertTriangle} label={t("coldChain.inWarning")} value={stats.warning} color="text-yellow-500" trend={stats.warning > 0 ? "down" : "neutral"} />
        <KPICard icon={XCircle} label={t("coldChain.criticalStatus")} value={stats.critical} color="text-red-500" trend={stats.critical > 0 ? "down" : "neutral"} />
        <KPICard icon={ShieldCheck} label={t("coldChain.slaCompliance")} value={`${stats.slaFulfillment}%`} color="text-gold" trend="up" subValue={`${stats.pharmaUnits} pharma`} />
        <KPICard icon={Award} label={t("coldChain.complianceAvg")} value={`${stats.avgCompliance}%`} color="text-purple-400" trend={stats.avgCompliance >= 90 ? "up" : "down"} />
        <KPICard icon={Bell} label={t("coldChain.activeAlerts")} value={alertCounts.total} color="text-orange-400" subValue={`${alertCounts.critical} ${t("coldChain.criticalLabel")}`} />
        <KPICard icon={Battery} label={t("coldChain.avgBattery")} value={`${stats.avgBattery}%`} color="text-cyan-400" trend={stats.avgBattery > 70 ? "up" : "down"} />
      </div>

      {/* ── Tabs Navigation ────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabView)} className="w-full">
        <motion.div variants={itemVariants}>
          <TabsList className="bg-sidebar/60 border border-white/5 p-1 rounded-xl h-auto gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold rounded-lg text-[10px] font-bold uppercase tracking-wider px-4 py-2">
              <Eye className="w-3 h-3 mr-1.5" /> {t("coldChain.tabOverview")}
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-red-500/10 data-[state=active]:text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider px-4 py-2 relative">
              <Bell className="w-3 h-3 mr-1.5" /> {t("coldChain.tabAlerts")}
              {alertCounts.total > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {alertCounts.total}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-400 rounded-lg text-[10px] font-bold uppercase tracking-wider px-4 py-2">
              <ShieldCheck className="w-3 h-3 mr-1.5" /> {t("coldChain.tabCompliance")}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-wider px-4 py-2">
              <BarChart3 className="w-3 h-3 mr-1.5" /> {t("coldChain.tabAnalytics")}
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <ColdChainOverviewTab
          filteredUnits={filteredUnits}
          selectedUnit={selectedUnit}
          selectedCfg={selectedCfg}
          filters={filters}
          sortField={sortField}
          sortDir={sortDir}
          stats={stats}
          chartData={chartData}
          unitAlerts={unitAlerts}
          unitEvents={unitEvents}
          unitCompliance={unitCompliance}
          setSelectedUnit={setSelectedUnit}
          updateSearch={updateSearch}
          updateStatusFilter={updateStatusFilter}
          updateClassificationFilter={updateClassificationFilter}
          toggleSort={toggleSort}
          acknowledgeAlert={acknowledgeAlert}
        />

        <ColdChainAlertsTab
          sortedAlerts={sortedAlerts}
          alertCounts={alertCounts}
          acknowledgeAlert={acknowledgeAlert}
          acknowledgeAllAlerts={acknowledgeAllAlerts}
        />

        <ColdChainComplianceTab
          complianceSummary={complianceSummary}
          allComplianceRecords={allComplianceRecords}
          allUnits={allUnits}
        />

        <ColdChainAnalyticsTab
          statusDistribution={statusDistribution}
          complianceByStandard={complianceByStandard}
          deviationsPerUnit={deviationsPerUnit}
          filteredUnits={filteredUnits}
          setSelectedUnit={setSelectedUnit}
          setActiveTab={setActiveTab}
        />
      </Tabs>
    </motion.div>
  );
};

export default DashboardColdChain;
