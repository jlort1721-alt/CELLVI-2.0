import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { OptimizationResult } from '../lib/routeOptimizer';

// =====================================================
// TYPES
// =====================================================

export interface OptimizedRouteRecord {
  id: string;
  created_by: string | null;
  route_name: string | null;
  optimization_date: string;
  vehicles: any[];
  deliveries: any[];
  routes: any[];
  total_distance: number;
  total_cost: number;
  fuel_consumption: number;
  co2_reduction: number;
  efficiency_gain: number;
  unassigned_deliveries: any[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  notes: string | null;
}

export interface CreateRouteInput {
  route_name?: string;
  optimization_result: OptimizationResult;
  vehicles: any[];
  deliveries: any[];
  notes?: string;
}

export interface UpdateRouteStatusInput {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completed_at?: string;
}

// =====================================================
// HOOKS
// =====================================================

/**
 * Hook para obtener rutas optimizadas del usuario
 */
export function useOptimizedRoutes() {
  return useQuery({
    queryKey: ['optimized-routes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('optimized_routes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OptimizedRouteRecord[];
    },
  });
}

/**
 * Hook para obtener una ruta específica por ID
 */
export function useOptimizedRoute(id: string | null) {
  return useQuery({
    queryKey: ['optimized-route', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('optimized_routes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as OptimizedRouteRecord;
    },
    enabled: !!id,
  });
}

/**
 * Hook para obtener rutas por estado
 */
export function useOptimizedRoutesByStatus(status: OptimizedRouteRecord['status']) {
  return useQuery({
    queryKey: ['optimized-routes', status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('optimized_routes')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OptimizedRouteRecord[];
    },
  });
}

/**
 * Hook para crear una nueva ruta optimizada
 */
export function useCreateOptimizedRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRouteInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('optimized_routes')
        .insert({
          created_by: user.id,
          route_name: input.route_name || `Ruta ${new Date().toLocaleDateString('es-CO')}`,
          vehicles: input.vehicles,
          deliveries: input.deliveries,
          routes: input.optimization_result.routes,
          total_distance: input.optimization_result.metrics.totalDistance,
          total_cost: input.optimization_result.metrics.totalCost,
          fuel_consumption: input.optimization_result.metrics.fuelConsumption,
          co2_reduction: input.optimization_result.metrics.co2Reduction,
          efficiency_gain: input.optimization_result.metrics.efficiencyGain,
          unassigned_deliveries: input.optimization_result.unassignedDeliveries,
          status: 'pending',
          notes: input.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data as OptimizedRouteRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimized-routes'] });
    },
  });
}

/**
 * Hook para actualizar el estado de una ruta
 */
export function useUpdateRouteStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateRouteStatusInput) => {
      const updateData: any = {
        status: input.status,
        updated_at: new Date().toISOString(),
      };

      if (input.status === 'completed' && !input.completed_at) {
        updateData.completed_at = new Date().toISOString();
      } else if (input.completed_at) {
        updateData.completed_at = input.completed_at;
      }

      const { data, error } = await supabase
        .from('optimized_routes')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data as OptimizedRouteRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['optimized-routes'] });
      queryClient.invalidateQueries({ queryKey: ['optimized-route', data.id] });
    },
  });
}

/**
 * Hook para eliminar una ruta
 */
export function useDeleteOptimizedRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('optimized_routes').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimized-routes'] });
    },
  });
}

/**
 * Hook para obtener estadísticas de optimización
 */
export function useOptimizationStats() {
  return useQuery({
    queryKey: ['optimization-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('optimized_routes')
        .select('total_distance, total_cost, fuel_consumption, co2_reduction, efficiency_gain, status')
        .eq('status', 'completed');

      if (error) throw error;

      const routes = data as OptimizedRouteRecord[];

      return {
        totalRoutes: routes.length,
        totalDistance: routes.reduce((sum, r) => sum + r.total_distance, 0),
        totalCost: routes.reduce((sum, r) => sum + r.total_cost, 0),
        totalFuelSaved: routes.reduce((sum, r) => sum + r.fuel_consumption, 0),
        totalCO2Reduced: routes.reduce((sum, r) => sum + r.co2_reduction, 0),
        avgEfficiencyGain:
          routes.length > 0
            ? routes.reduce((sum, r) => sum + r.efficiency_gain, 0) / routes.length
            : 0,
      };
    },
  });
}

/**
 * Hook para obtener las rutas más eficientes
 */
export function useTopEfficientRoutes(limit: number = 10) {
  return useQuery({
    queryKey: ['top-efficient-routes', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('optimized_routes')
        .select('id, route_name, efficiency_gain, total_distance, co2_reduction, optimization_date')
        .eq('status', 'completed')
        .order('efficiency_gain', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}
