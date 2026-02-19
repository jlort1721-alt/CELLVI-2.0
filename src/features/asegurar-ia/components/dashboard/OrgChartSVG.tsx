import { memo } from 'react';
import { organizationalAreas, type OrganizationalArea } from '../../lib/orgData';

export interface OrgChartSVGProps {
  onSelect: (area: OrganizationalArea) => void;
}

const OrgChartSVG = memo(({ onSelect }: OrgChartSVGProps) => {
  const presidency = organizationalAreas.find(a => a.id === 'presidencia')!;
  const management = organizationalAreas.find(a => a.id === 'gerencia-general')!;
  const operational = organizationalAreas.filter(a => a.id !== 'presidencia' && a.id !== 'gerencia-general');
  const w = 880, nodeW = 100, nodeH = 50;
  const cols = 4;
  const rows = Math.ceil(operational.length / cols);

  return (
    <div className="overflow-x-auto py-4">
      <svg width={w} height={220 + rows * 70} viewBox={`0 0 ${w} ${220 + rows * 70}`} className="mx-auto">
        {/* Presidency */}
        <g onClick={() => onSelect(presidency)} className="cursor-pointer">
          <rect x={w / 2 - nodeW / 2} y={10} width={nodeW} height={nodeH} rx={8} fill={presidency.color} />
          <text x={w / 2} y={32} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">Presidencia</text>
          <text x={w / 2} y={47} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="9">M. Romulo</text>
        </g>
        {/* Line P -> G */}
        <line x1={w / 2} y1={60} x2={w / 2} y2={80} stroke="currentColor" strokeWidth="1.5" className="text-border" />
        {/* Management */}
        <g onClick={() => onSelect(management)} className="cursor-pointer">
          <rect x={w / 2 - nodeW / 2} y={80} width={nodeW} height={nodeH} rx={8} fill={management.color} />
          <text x={w / 2} y={102} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">Ger. General</text>
          <text x={w / 2} y={117} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="9">D. Lopez</text>
        </g>
        {/* Line G -> horizontal */}
        <line x1={w / 2} y1={130} x2={w / 2} y2={150} stroke="currentColor" strokeWidth="1.5" className="text-border" />
        {/* Horizontal bar */}
        {operational.length > 0 && (
          <line
            x1={w / 2 - ((Math.min(cols, operational.length) - 1) * (nodeW + 10)) / 2}
            y1={150}
            x2={w / 2 + ((Math.min(cols, operational.length) - 1) * (nodeW + 10)) / 2}
            y2={150}
            stroke="currentColor" strokeWidth="1.5" className="text-border"
          />
        )}
        {/* Operational area nodes */}
        {operational.map((area, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const colsInRow = Math.min(cols, operational.length - row * cols);
          const rowW = (colsInRow - 1) * (nodeW + 10);
          const sx = w / 2 - rowW / 2;
          const x = sx + col * (nodeW + 10) - nodeW / 2;
          const y = 160 + row * 70;
          const cx = x + nodeW / 2;

          return (
            <g key={area.id} onClick={() => onSelect(area)} className="cursor-pointer">
              {row === 0 && <line x1={cx} y1={150} x2={cx} y2={y} stroke="currentColor" strokeWidth="1" className="text-border" />}
              {row > 0 && <line x1={w / 2} y1={150} x2={cx} y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" className="text-border" opacity={0.5} />}
              <rect x={x} y={y} width={nodeW} height={nodeH} rx={6} fill={area.color} opacity={0.9} />
              <circle cx={x + nodeW - 8} cy={y + 8} r={3} fill={area.status === 'green' ? '#10B981' : area.status === 'yellow' ? '#F59E0B' : '#EF4444'} />
              <text x={cx} y={y + 22} textAnchor="middle" fill="white" fontSize="9" fontWeight="600">
                {area.name.length > 14 ? area.name.slice(0, 12) + '..' : area.name}
              </text>
              <text x={cx} y={y + 37} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8">
                {area.leader.name.split(' ')[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});

OrgChartSVG.displayName = 'OrgChartSVG';

export default OrgChartSVG;
