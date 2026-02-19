import { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusPulse, ProgressRing } from '../shared/ExecutiveWidgets';
import { Briefcase, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { OrganizationalArea } from '../../lib/orgData';

const iconMap: Record<string, React.ElementType> = {};

// We receive the iconMap from outside to avoid duplicating it
export interface AreaGridCardProps {
  area: OrganizationalArea;
  onSelect: (area: OrganizationalArea) => void;
  index: number;
  resolvedIconMap: Record<string, React.ElementType>;
}

const mapStatus = (s: string): 'operational' | 'warning' | 'critical' =>
  s === 'green' ? 'operational' : s === 'yellow' ? 'warning' : 'critical';

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const AreaGridCard = memo(({ area, onSelect, resolvedIconMap }: AreaGridCardProps) => {
  const Icon = resolvedIconMap[area.icon] || Briefcase;
  const perf = useMemo(() => {
    if (area.kpis.length === 0) return 0;
    return Math.round(area.kpis.reduce((s, k) => s + (k.value / k.target) * 100, 0) / area.kpis.length);
  }, [area.kpis]);

  return (
    <motion.div variants={itemVariants}>
      <Card
        className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
        onClick={() => onSelect(area)}
      >
        <div
          className="absolute top-0 left-0 w-1 h-full group-hover:w-1.5 transition-all duration-300"
          style={{ backgroundColor: area.color }}
        />
        <CardContent className="p-4 pl-5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${area.color}15` }}>
              <Icon className="w-5 h-5" style={{ color: area.color }} />
            </div>
            <StatusPulse status={mapStatus(area.status)} size="sm" />
          </div>

          <h3 className="font-bold text-sm mb-0.5">{area.code}. {area.name}</h3>
          <p className="text-[11px] text-muted-foreground mb-3 line-clamp-1">{area.description}</p>

          {/* Leader */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: `linear-gradient(135deg, ${area.color}, ${area.color}99)` }}
            >
              {area.leader.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="text-xs font-medium leading-tight">{area.leader.name}</p>
              <p className="text-[10px] text-muted-foreground">{area.leader.title}</p>
            </div>
          </div>

          {/* Top 2 KPIs */}
          <div className="space-y-1.5 mb-3">
            {area.kpis.slice(0, 2).map(kpi => (
              <div key={kpi.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate mr-2">{kpi.name}</span>
                <span className="font-semibold tabular-nums whitespace-nowrap">
                  {kpi.unit === 'COP' ? `$${(kpi.value / 1000000).toFixed(0)}M` :
                   kpi.unit === '%' ? `${kpi.value}%` : kpi.value}
                </span>
              </div>
            ))}
          </div>

          {/* Footer with ProgressRing */}
          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <ProgressRing value={perf} size={36} strokeWidth={3} color={area.color} />
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: area.color }}
            >
              Abrir <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

AreaGridCard.displayName = 'AreaGridCard';

export default AreaGridCard;
