import React, { useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useToast } from '@/hooks/use-toast';
import {
  optimizeRoutes,
  generateDemoData,
  type OptimizationResult,
  type Vehicle,
  type Delivery,
} from '../lib/routeOptimizer';
import {
  useCreateOptimizedRoute,
  useOptimizedRoutes,
  useOptimizationStats,
} from '../hooks/useRouteOptimization';
import { env } from '@/config/env';
import {
  OptimizerHeader,
  OptimizationHistory,
  InputSummary,
  OptimizationMetrics,
  RouteMap,
  RouteDetails,
  UnassignedDeliveries,
  EmptyState,
} from './route-optimizer';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function RouteOptimizerPanel() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<number>(0);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  // Demo data
  const demoData = generateDemoData();
  const [vehicles] = useState<Vehicle[]>(demoData.vehicles);
  const [deliveries] = useState<Delivery[]>(demoData.deliveries);

  // Supabase hooks (only used when not in demo mode)
  const useMockData = env.features.useMockData;
  const createOptimizedRoute = useCreateOptimizedRoute();
  const { data: savedRoutes, isLoading: loadingHistory } = useOptimizedRoutes();
  const { data: stats } = useOptimizationStats();

  const handleOptimize = useCallback(async () => {
    setIsOptimizing(true);

    try {
      // Simulate optimization delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const optimizationResult = optimizeRoutes(vehicles, deliveries);
      setResult(optimizationResult);

      // Save to Supabase if not in demo mode
      if (!useMockData) {
        await createOptimizedRoute.mutateAsync({
          route_name: `Optimización ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
          optimization_result: optimizationResult,
          vehicles,
          deliveries,
        });

        toast({
          title: '✅ Optimización guardada',
          description: 'La ruta optimizada se guardó exitosamente en Supabase',
        });
      } else {
        toast({
          title: '🔧 Modo Demo',
          description: 'Optimización completada (no persistida - modo demo)',
          variant: 'default',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'Error al optimizar o guardar la ruta',
        variant: 'destructive',
      });
      console.error('Optimization error:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [vehicles, deliveries, useMockData, createOptimizedRoute, toast]);

  const handleToggleHistory = useCallback(() => {
    setShowHistory((prev) => !prev);
  }, []);

  const handleSelectedRouteChange = useCallback((index: number) => {
    setSelectedRoute(index);
  }, []);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  const formatDistance = useCallback((km: number) => {
    return `${km.toFixed(2)} km`;
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <OptimizerHeader
        useMockData={useMockData}
        isOptimizing={isOptimizing}
        showHistory={showHistory}
        onToggleHistory={handleToggleHistory}
        onOptimize={handleOptimize}
      />

      {/* History and Stats Section */}
      {!useMockData && showHistory && (
        <OptimizationHistory
          stats={stats}
          savedRoutes={savedRoutes}
          loadingHistory={loadingHistory}
          formatDistance={formatDistance}
        />
      )}

      {/* Input Summary */}
      <InputSummary vehicles={vehicles} deliveries={deliveries} />

      {/* Results */}
      {result && (
        <>
          <OptimizationMetrics
            metrics={result.metrics}
            formatDistance={formatDistance}
            formatCurrency={formatCurrency}
          />

          <RouteMap
            result={result}
            deliveries={deliveries}
            getPriorityColor={getPriorityColor}
          />

          <RouteDetails
            result={result}
            vehicles={vehicles}
            selectedRoute={selectedRoute}
            onSelectedRouteChange={handleSelectedRouteChange}
            formatDistance={formatDistance}
            getPriorityColor={getPriorityColor}
          />

          {result.unassignedDeliveries.length > 0 && (
            <UnassignedDeliveries
              deliveries={result.unassignedDeliveries}
              getPriorityColor={getPriorityColor}
            />
          )}
        </>
      )}

      {/* Empty State */}
      {!result && !isOptimizing && (
        <EmptyState
          vehicleCount={vehicles.length}
          deliveryCount={deliveries.length}
        />
      )}
    </div>
  );
}
