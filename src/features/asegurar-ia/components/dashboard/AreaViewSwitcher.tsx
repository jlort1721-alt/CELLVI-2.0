import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionDivider } from '../shared/ExecutiveWidgets';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OrganizationalArea } from '../../lib/orgData';
import AreaGridCard from './AreaGridCard';
import AreaListRow from './AreaListRow';
import OrgChartSVG from './OrgChartSVG';

type ViewMode = 'grid' | 'list' | 'orgchart';

export interface AreaViewSwitcherProps {
  viewMode: ViewMode;
  filteredAreas: OrganizationalArea[];
  onSelectArea: (area: OrganizationalArea) => void;
  iconMap: Record<string, React.ElementType>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const AreaViewSwitcher = memo(({ viewMode, filteredAreas, onSelectArea, iconMap }: AreaViewSwitcherProps) => (
  <AnimatePresence mode="wait">
    {viewMode === 'grid' && (
      <motion.div
        key="grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
      >
        {filteredAreas.map((area, i) => (
          <AreaGridCard key={area.id} area={area} onSelect={onSelectArea} index={i} resolvedIconMap={iconMap} />
        ))}
        {filteredAreas.length === 0 && (
          <motion.div variants={itemVariants} className="col-span-full flex flex-col items-center py-16 text-muted-foreground">
            <Search className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-semibold">No se encontraron areas</p>
          </motion.div>
        )}
      </motion.div>
    )}

    {viewMode === 'list' && (
      <motion.div
        key="list"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="space-y-2"
      >
        {filteredAreas.map(area => (
          <AreaListRow key={area.id} area={area} onSelect={onSelectArea} resolvedIconMap={iconMap} />
        ))}
      </motion.div>
    )}

    {viewMode === 'orgchart' && (
      <motion.div
        key="orgchart"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <SectionDivider
              title="Organigrama de ASEGURAR LTDA"
              action={<Badge variant="outline" className="text-[10px]">Estructura jerarquica</Badge>}
            />
          </CardHeader>
          <CardContent>
            <OrgChartSVG onSelect={onSelectArea} />
          </CardContent>
        </Card>
      </motion.div>
    )}
  </AnimatePresence>
));

AreaViewSwitcher.displayName = 'AreaViewSwitcher';

export default AreaViewSwitcher;
