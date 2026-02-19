import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, LayoutGrid, List, GitBranch } from 'lucide-react';
import { motion } from 'framer-motion';

type ViewMode = 'grid' | 'list' | 'orgchart';

export interface DashboardHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const viewModeOptions: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
  { mode: 'grid', icon: LayoutGrid, label: 'Tarjetas' },
  { mode: 'list', icon: List, label: 'Lista' },
  { mode: 'orgchart', icon: GitBranch, label: 'Organigrama' },
];

const DashboardHeader = memo(({ viewMode, onViewModeChange }: DashboardHeaderProps) => (
  <motion.div
    initial={{ opacity: 0, y: -12 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col md:flex-row md:items-end justify-between gap-4"
  >
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 shadow-sm">
          <Sparkles className="w-7 h-7 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Asegurar IA</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Dashboard Ejecutivo Organizacional - Control Integral de Operaciones
          </p>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {viewModeOptions.map(({ mode, icon: ModeIcon, label }) => (
        <Button
          key={mode}
          variant={viewMode === mode ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange(mode)}
          className={viewMode === mode ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'border-border/50'}
        >
          <ModeIcon className="w-4 h-4" />
          <span className="hidden sm:inline ml-1.5 text-xs">{label}</span>
        </Button>
      ))}
    </div>
  </motion.div>
));

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;
