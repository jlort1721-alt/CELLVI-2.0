import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MetricRow, SectionDivider } from '../shared/ExecutiveWidgets';
import { organizationalAreas } from '../../lib/orgData';

const ExecutiveSummary = memo(() => (
  <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
    <CardHeader className="pb-2">
      <SectionDivider
        title="Resumen Ejecutivo por Area"
        action={<Badge variant="outline" className="text-[10px]">{organizationalAreas.length} areas activas</Badge>}
      />
    </CardHeader>
    <CardContent>
      {organizationalAreas.map(area => {
        const perf = area.kpis.length > 0
          ? Math.round(area.kpis.reduce((s, k) => s + (k.value / k.target) * 100, 0) / area.kpis.length)
          : 0;
        const avgChange = area.kpis.length > 0
          ? Math.round(area.kpis.reduce((s, k) => s + k.change, 0) / area.kpis.length * 10) / 10
          : 0;
        return (
          <MetricRow
            key={area.id}
            label={`${area.code}. ${area.name}`}
            value={`${perf}%`}
            change={avgChange}
            target="100%"
            color={area.color}
          />
        );
      })}
    </CardContent>
  </Card>
));

ExecutiveSummary.displayName = 'ExecutiveSummary';

export default ExecutiveSummary;
