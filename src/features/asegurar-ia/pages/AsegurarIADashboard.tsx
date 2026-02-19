import { useState, useMemo, useCallback } from 'react';
import { organizationalAreas, type OrganizationalArea } from '../lib/orgData';
import {
  Crown, Briefcase, Network, Shield, ClipboardList,
  Monitor, DollarSign, Users, TrendingUp, Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Sub-components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ExecutiveKPIRow from '../components/dashboard/ExecutiveKPIRow';
import SearchAndFilters from '../components/dashboard/SearchAndFilters';
import AreaViewSwitcher from '../components/dashboard/AreaViewSwitcher';
import PerformanceChart from '../components/dashboard/PerformanceChart';
import AICommandPanel from '../components/dashboard/AICommandPanel';
import ExecutiveSummary from '../components/dashboard/ExecutiveSummary';
import SelectedAreaDetail from '../components/dashboard/SelectedAreaDetail';

const iconMap: Record<string, React.ElementType> = {
  Crown, Briefcase, Network, Shield, ClipboardList,
  Monitor, DollarSign, Users, TrendingUp, Code
};

type ViewMode = 'grid' | 'list' | 'orgchart';
type StatusFilter = 'all' | 'green' | 'yellow' | 'red';

// ─── MAIN DASHBOARD ─────────────────────────────────────
export default function AsegurarIADashboard() {
  const [selectedArea, setSelectedArea] = useState<OrganizationalArea | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredAreas = useMemo(() => {
    let areas = organizationalAreas;
    if (statusFilter !== 'all') areas = areas.filter(a => a.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      areas = areas.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.leader.name.toLowerCase().includes(q) ||
        a.code.toString().includes(q)
      );
    }
    return areas;
  }, [searchQuery, statusFilter]);

  const totalKPIs = useMemo(() => organizationalAreas.reduce((acc, a) => acc + a.kpis.length, 0), []);
  const avgPerformance = useMemo(() => {
    const total = organizationalAreas.reduce((acc, area) => {
      const p = area.kpis.length > 0 ? area.kpis.reduce((s, k) => s + (k.value / k.target) * 100, 0) / area.kpis.length : 0;
      return acc + p;
    }, 0);
    return Math.round((total / organizationalAreas.length) * 10) / 10;
  }, []);
  const healthyAreas = useMemo(() => organizationalAreas.filter(a => a.status === 'green').length, []);

  const handleSelectArea = useCallback((area: OrganizationalArea) => setSelectedArea(area), []);
  const handleBack = useCallback(() => setSelectedArea(null), []);
  const handleViewModeChange = useCallback((mode: ViewMode) => setViewMode(mode), []);
  const handleSearchChange = useCallback((value: string) => setSearchQuery(value), []);
  const handleStatusFilterChange = useCallback((filter: StatusFilter) => setStatusFilter(filter), []);

  // ═══ SELECTED AREA DETAIL VIEW ═══════════════════════
  if (selectedArea) {
    return (
      <SelectedAreaDetail
        selectedArea={selectedArea}
        onBack={handleBack}
        iconMap={iconMap}
      />
    );
  }

  // ═══ MAIN EXECUTIVE DASHBOARD ════════════════════════
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="main"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <DashboardHeader viewMode={viewMode} onViewModeChange={handleViewModeChange} />

        {/* 4 Executive KPI Cards */}
        <ExecutiveKPIRow
          totalAreas={organizationalAreas.length}
          healthyAreas={healthyAreas}
          totalKPIs={totalKPIs}
          avgPerformance={avgPerformance}
        />

        {/* Search & Filters */}
        <SearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          filteredCount={filteredAreas.length}
          totalCount={organizationalAreas.length}
        />

        {/* Area Views */}
        <AreaViewSwitcher
          viewMode={viewMode}
          filteredAreas={filteredAreas}
          onSelectArea={handleSelectArea}
          iconMap={iconMap}
        />

        {/* Performance Comparison */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <PerformanceChart />
        </motion.div>

        {/* AI Command Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <AICommandPanel />
        </motion.div>

        {/* Metrics Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <ExecutiveSummary />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
