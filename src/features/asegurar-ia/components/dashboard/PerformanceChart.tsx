import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { organizationalAreas } from '../../lib/orgData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell
} from 'recharts';

const PerformanceChart = memo(() => {
  const chartData = useMemo(() =>
    organizationalAreas
      .map(area => ({
        name: area.name.length > 12 ? area.name.slice(0, 10) + '..' : area.name,
        perf: area.kpis.length > 0
          ? Math.round(area.kpis.reduce((s, k) => s + (k.value / k.target) * 100, 0) / area.kpis.length)
          : 0,
        color: area.color,
      }))
      .sort((a, b) => b.perf - a.perf),
    []
  );

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm">Rendimiento Comparativo por Area</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px]">Tiempo real</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 32 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 10 }} domain={[0, 130]} tickFormatter={(v) => `${v}%`} />
            <RechartsTooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              formatter={(value: number) => [`${value}%`, 'Rendimiento']}
            />
            <Bar dataKey="perf" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

PerformanceChart.displayName = 'PerformanceChart';

export default PerformanceChart;
