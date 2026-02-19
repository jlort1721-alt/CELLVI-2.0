import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

type StatusFilter = 'all' | 'green' | 'yellow' | 'red';

export interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  filteredCount: number;
  totalCount: number;
}

const filterOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'green', label: 'Optimo' },
  { value: 'yellow', label: 'Atencion' },
  { value: 'red', label: 'Critico' },
];

const SearchAndFilters = memo(({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  filteredCount,
  totalCount,
}: SearchAndFiltersProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
  >
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Buscar area por nombre, lider o codigo..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-9 h-9 bg-card/60 border-border/50 text-sm"
      />
    </div>
    <div className="flex items-center gap-1.5">
      <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1" />
      {filterOptions.map(({ value, label }) => (
        <Button
          key={value}
          variant={statusFilter === value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onStatusFilterChange(value)}
          className="text-xs h-7"
        >
          {label}
        </Button>
      ))}
    </div>
    <Badge variant="outline" className="text-[10px] h-7 px-2 self-center whitespace-nowrap">
      {filteredCount} de {totalCount} areas
    </Badge>
  </motion.div>
));

SearchAndFilters.displayName = 'SearchAndFilters';

export default SearchAndFilters;
