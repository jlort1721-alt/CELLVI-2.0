import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  coldChainUnits,
  coldChainAlerts,
  complianceRecords,
  coldChainEvents,
  generateTempHistory,
  getColdChainStats,
  type ColdChainUnit,
  type ColdChainAlert,
  type TempReading,
  type UnitStatus,
  type CargoClassification,
} from "@/lib/coldChainData";

export type SortField = "plate" | "temp" | "status" | "compliance" | "eta";
export type SortDirection = "asc" | "desc";
export type TabView = "overview" | "alerts" | "compliance" | "analytics";

interface ColdChainFilters {
  search: string;
  status: UnitStatus | "all";
  classification: CargoClassification | "all";
}

interface ColdChainState {
  selectedUnit: ColdChainUnit | null;
  activeTab: TabView;
  filters: ColdChainFilters;
  sortField: SortField;
  sortDir: SortDirection;
  alerts: ColdChainAlert[];
  isLiveMode: boolean;
  lastSync: Date;
}

const OFFLINE_CACHE_KEY = "cellvi-cold-chain-state";

const loadCachedState = (): Partial<ColdChainState> | null => {
  try {
    const cached = localStorage.getItem(OFFLINE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...parsed, lastSync: new Date(parsed.lastSync) };
    }
  } catch {
    // ignore parse errors
  }
  return null;
};

const saveCacheState = (state: Partial<ColdChainState>) => {
  try {
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify({
      activeTab: state.activeTab,
      filters: state.filters,
      sortField: state.sortField,
      sortDir: state.sortDir,
      isLiveMode: state.isLiveMode,
      lastSync: state.lastSync?.toISOString(),
      selectedUnitId: state.selectedUnit?.id,
    }));
  } catch {
    // ignore storage errors
  }
};

export const useColdChain = () => {
  const cached = useRef(loadCachedState());

  const [selectedUnit, setSelectedUnit] = useState<ColdChainUnit | null>(
    cached.current?.selectedUnit
      ?? coldChainUnits.find(u => u.id === (cached.current as Record<string, unknown>)?.selectedUnitId)
      ?? coldChainUnits[0]
      ?? null
  );
  const [activeTab, setActiveTab] = useState<TabView>(
    (cached.current?.activeTab as TabView) ?? "overview"
  );
  const [filters, setFilters] = useState<ColdChainFilters>(
    cached.current?.filters ?? { search: "", status: "all", classification: "all" }
  );
  const [sortField, setSortField] = useState<SortField>(
    (cached.current?.sortField as SortField) ?? "status"
  );
  const [sortDir, setSortDir] = useState<SortDirection>(
    (cached.current?.sortDir as SortDirection) ?? "desc"
  );
  const [alerts, setAlerts] = useState<ColdChainAlert[]>(coldChainAlerts);
  const [isLiveMode, setIsLiveMode] = useState(cached.current?.isLiveMode ?? true);
  const [lastSync, setLastSync] = useState(new Date());

  // Persist state for offline recovery
  useEffect(() => {
    saveCacheState({ selectedUnit, activeTab, filters, sortField, sortDir, isLiveMode, lastSync });
  }, [selectedUnit, activeTab, filters, sortField, sortDir, isLiveMode, lastSync]);

  // Simulate live data refresh
  useEffect(() => {
    if (!isLiveMode) return;
    const interval = setInterval(() => {
      setLastSync(new Date());
    }, 30_000);
    return () => clearInterval(interval);
  }, [isLiveMode]);

  // Stats
  const stats = useMemo(() => getColdChainStats(), []);

  // Filtered & sorted units
  const filteredUnits = useMemo(() => {
    let result = [...coldChainUnits];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(u =>
        u.vehiclePlate.toLowerCase().includes(q) ||
        u.cargoType.toLowerCase().includes(q) ||
        u.driverName.toLowerCase().includes(q) ||
        u.origin.toLowerCase().includes(q) ||
        u.destination.toLowerCase().includes(q) ||
        u.sensorId.toLowerCase().includes(q)
      );
    }

    if (filters.status !== "all") {
      result = result.filter(u => u.status === filters.status);
    }
    if (filters.classification !== "all") {
      result = result.filter(u => u.cargoClassification === filters.classification);
    }

    const statusPriority: Record<string, number> = { critical: 0, warning: 1, normal: 2, offline: 3 };

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "plate": cmp = a.vehiclePlate.localeCompare(b.vehiclePlate); break;
        case "temp": cmp = a.currentTemp - b.currentTemp; break;
        case "status": cmp = (statusPriority[a.status] ?? 4) - (statusPriority[b.status] ?? 4); break;
        case "compliance": cmp = a.complianceScore - b.complianceScore; break;
        case "eta": cmp = new Date(a.eta).getTime() - new Date(b.eta).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [filters, sortField, sortDir]);

  // Temp history for selected unit
  const tempHistory = useMemo<TempReading[]>(() => {
    if (!selectedUnit) return [];
    return generateTempHistory(selectedUnit);
  }, [selectedUnit]);

  // Chart data
  const chartData = useMemo(() => {
    if (!selectedUnit) return [];
    return tempHistory.map(r => ({
      time: new Date(r.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
      temp: r.temp,
      humidity: r.humidity,
      doorOpen: r.doorOpen ? (selectedUnit.targetTempMax + 2) : null,
      battery: r.batteryLevel,
      signal: r.signalStrength,
    }));
  }, [tempHistory, selectedUnit]);

  // Unit alerts
  const unitAlerts = useMemo(() => {
    if (!selectedUnit) return [];
    return alerts.filter(a => a.unitId === selectedUnit.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [alerts, selectedUnit]);

  // Unit events
  const unitEvents = useMemo(() => {
    if (!selectedUnit) return [];
    return coldChainEvents.filter(e => e.unitId === selectedUnit.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [selectedUnit]);

  // Unit compliance
  const unitCompliance = useMemo(() => {
    if (!selectedUnit) return [];
    return complianceRecords.filter(c => c.unitId === selectedUnit.id);
  }, [selectedUnit]);

  // Active (unacknowledged) alert counts by severity
  const alertCounts = useMemo(() => {
    const active = alerts.filter(a => !a.acknowledged);
    return {
      total: active.length,
      critical: active.filter(a => a.severity === "critical").length,
      warning: active.filter(a => a.severity === "warning").length,
      info: active.filter(a => a.severity === "info").length,
    };
  }, [alerts]);

  // Compliance summary
  const complianceSummary = useMemo(() => {
    const compliant = complianceRecords.filter(c => c.status === "compliant").length;
    const nonCompliant = complianceRecords.filter(c => c.status === "non_compliant").length;
    const pending = complianceRecords.filter(c => c.status === "pending_review").length;
    const total = complianceRecords.length;
    return { compliant, nonCompliant, pending, total, rate: total > 0 ? parseFloat(((compliant / total) * 100).toFixed(1)) : 0 };
  }, []);

  // Actions
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
  }, []);

  const acknowledgeAllAlerts = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
  }, []);

  const updateSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const updateStatusFilter = useCallback((status: UnitStatus | "all") => {
    setFilters(prev => ({ ...prev, status }));
  }, []);

  const updateClassificationFilter = useCallback((classification: CargoClassification | "all") => {
    setFilters(prev => ({ ...prev, classification }));
  }, []);

  const toggleSort = useCallback((field: SortField) => {
    setSortField(prev => {
      if (prev === field) {
        setSortDir(d => d === "asc" ? "desc" : "asc");
        return prev;
      }
      setSortDir("asc");
      return field;
    });
  }, []);

  const refreshData = useCallback(() => {
    setLastSync(new Date());
  }, []);

  return {
    // State
    selectedUnit,
    activeTab,
    filters,
    sortField,
    sortDir,
    alerts,
    isLiveMode,
    lastSync,

    // Computed
    stats,
    filteredUnits,
    tempHistory,
    chartData,
    unitAlerts,
    unitEvents,
    unitCompliance,
    alertCounts,
    complianceSummary,
    allComplianceRecords: complianceRecords,
    allEvents: coldChainEvents,

    // Actions
    setSelectedUnit,
    setActiveTab,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    updateSearch,
    updateStatusFilter,
    updateClassificationFilter,
    toggleSort,
    setIsLiveMode,
    refreshData,
  };
};
