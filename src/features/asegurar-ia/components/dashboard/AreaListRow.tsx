import { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusPulse, ProgressRing } from '../shared/ExecutiveWidgets';
import { Briefcase, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { OrganizationalArea } from '../../lib/orgData';

export interface AreaListRowProps {
  area: OrganizationalArea;
  onSelect: (area: OrganizationalArea) => void;
  resolvedIconMap: Record<string, React.ElementType>;
}

const mapStatus = (s: string): 'operational' | 'warning' | 'critical' =>
  s === 'green' ? 'operational' : s === 'yellow' ? 'warning' : 'critical';

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const AreaListRow = memo(({ area, onSelect, resolvedIconMap }: AreaListRowProps) => {
  const Icon = resolvedIconMap[area.icon] || Briefcase;
  const perf = useMemo(() => {
    if (area.kpis.length === 0) return 0;
    return Math.round(area.kpis.reduce((s, k) => s + (k.value / k.target) * 100, 0) / area.kpis.length);
  }, [area.kpis]);

  return (
    <motion.div variants={itemVariants}>
      <Card
        className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-md transition-all cursor-pointer"
        onClick={() => onSelect(area)}
      >
        <CardContent className="p-3 flex items-center gap-4">
          <div className="w-1 h-12 rounded-full" style={{ backgroundColor: area.color }} />
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${area.color}15` }}>
            <Icon className="w-4 h-4" style={{ color: area.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{area.code}. {area.name}</p>
            <p className="text-xs text-muted-foreground">{area.leader.name} - {area.leader.title}</p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {area.kpis.slice(0, 2).map(kpi => (
              <div key={kpi.id} className="text-right">
                <p className="text-xs text-muted-foreground">{kpi.name}</p>
                <p className="text-sm font-semibold tabular-nums">
                  {kpi.unit === 'COP' ? `$${(kpi.value / 1000000).toFixed(0)}M` :
                   kpi.unit === '%' ? `${kpi.value}%` : kpi.value}
                </p>
              </div>
            ))}
          </div>
          <ProgressRing value={perf} size={40} strokeWidth={3} color={area.color} />
          <StatusPulse status={mapStatus(area.status)} size="sm" />
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </motion.div>
  );
});

AreaListRow.displayName = 'AreaListRow';

export default AreaListRow;
