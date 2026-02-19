import { memo } from 'react';
import { ExecutiveKPI } from '../shared/ExecutiveWidgets';
import { Building2, Activity, TrendingUp, Cpu } from 'lucide-react';

export interface ExecutiveKPIRowProps {
  totalAreas: number;
  healthyAreas: number;
  totalKPIs: number;
  avgPerformance: number;
}

const ExecutiveKPIRow = memo(({ totalAreas, healthyAreas, totalKPIs, avgPerformance }: ExecutiveKPIRowProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <ExecutiveKPI
      title="Areas Operativas"
      value={totalAreas}
      subtitle={`${healthyAreas} en estado optimo`}
      trend={5.2}
      icon={Building2}
      accentColor="#8B5CF6"
      sparklineData={[7, 8, 8, 9, 9, 10, 10]}
      status="good"
      delay={0}
    />
    <ExecutiveKPI
      title="KPIs Monitoreados"
      value={totalKPIs}
      subtitle={`${Math.round(totalKPIs / totalAreas)} por area`}
      trend={8.3}
      icon={Activity}
      accentColor="#3B82F6"
      sparklineData={[22, 24, 25, 27, 28, 29, 30]}
      status="good"
      delay={0.1}
    />
    <ExecutiveKPI
      title="Rendimiento Global"
      value={`${avgPerformance}%`}
      subtitle="Promedio todas las areas"
      trend={5.2}
      icon={TrendingUp}
      accentColor="#10B981"
      sparklineData={[88, 90, 91, 93, 94, 96, avgPerformance]}
      status={avgPerformance >= 95 ? 'good' : avgPerformance >= 85 ? 'warning' : 'critical'}
      delay={0.2}
    />
    <ExecutiveKPI
      title="Salud IA"
      value={`${Math.round((healthyAreas / totalAreas) * 100)}%`}
      subtitle={`${healthyAreas}/${totalAreas} areas saludables`}
      trend={3.1}
      icon={Cpu}
      accentColor="#d4af37"
      sparklineData={[82, 85, 87, 89, 91, 93, 95]}
      status="good"
      delay={0.3}
    />
  </div>
));

ExecutiveKPIRow.displayName = 'ExecutiveKPIRow';

export default ExecutiveKPIRow;
