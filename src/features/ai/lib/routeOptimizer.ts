/**
 * Route Genius - Optimización de Rutas con IA
 * Algoritmo de optimización VRP (Vehicle Routing Problem)
 */

export interface Delivery {
  id: string;
  address: string;
  lat: number;
  lng: number;
  weight: number; // kg
  volume: number; // m³
  timeWindow: {
    start: string; // HH:mm
    end: string;
  };
  priority: 'high' | 'medium' | 'low';
  serviceTime: number; // minutos
}

export interface Vehicle {
  id: string;
  plate: string;
  capacity: {
    weight: number; // kg
    volume: number; // m³
  };
  currentLocation: {
    lat: number;
    lng: number;
  };
  fuelEfficiency: number; // km/galón
  costPerKm: number; // COP
  maxWorkHours: number;
  driver: string;
}

export interface OptimizedRoute {
  vehicleId: string;
  deliveries: Delivery[];
  totalDistance: number; // km
  totalTime: number; // minutos
  estimatedFuel: number; // galones
  estimatedCost: number; // COP
  sequence: string[]; // IDs de entregas en orden
}

export interface OptimizationResult {
  routes: OptimizedRoute[];
  metrics: {
    totalDistance: number;
    totalTime: number;
    totalCost: number;
    fuelConsumption: number;
    co2Reduction: number; // vs rutas no optimizadas
    efficiencyGain: number; // % de mejora
  };
  unassignedDeliveries: Delivery[];
}

/**
 * Calcula la distancia entre dos puntos usando fórmula de Haversine
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Algoritmo Greedy Nearest Neighbor (baseline)
 * Para producción real, usar Google OR-Tools o similar
 */
function nearestNeighborRoute(
  vehicle: Vehicle,
  deliveries: Delivery[],
  startLat: number,
  startLng: number
): OptimizedRoute {
  const route: Delivery[] = [];
  const remaining = [...deliveries];
  let currentLat = startLat;
  let currentLng = startLng;
  let totalDistance = 0;
  let totalTime = 0;
  let totalWeight = 0;
  let totalVolume = 0;

  while (remaining.length > 0) {
    // Encontrar la entrega más cercana que quepa en el vehículo
    let nearestIndex = -1;
    let minDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const delivery = remaining[i];

      // Verificar capacidad
      if (totalWeight + delivery.weight > vehicle.capacity.weight ||
          totalVolume + delivery.volume > vehicle.capacity.volume) {
        continue;
      }

      const distance = calculateDistance(
        currentLat,
        currentLng,
        delivery.lat,
        delivery.lng
      );

      // Priorizar entregas de alta prioridad
      const priorityWeight = delivery.priority === 'high' ? 0.7 :
                             delivery.priority === 'medium' ? 0.85 : 1.0;
      const adjustedDistance = distance * priorityWeight;

      if (adjustedDistance < minDistance) {
        minDistance = adjustedDistance;
        nearestIndex = i;
      }
    }

    // Si no hay más entregas que quepan, terminar
    if (nearestIndex === -1) break;

    const nextDelivery = remaining.splice(nearestIndex, 1)[0];
    route.push(nextDelivery);

    const distance = calculateDistance(currentLat, currentLng, nextDelivery.lat, nextDelivery.lng);
    totalDistance += distance;
    totalTime += (distance / 40) * 60 + nextDelivery.serviceTime; // 40 km/h promedio + tiempo servicio
    totalWeight += nextDelivery.weight;
    totalVolume += nextDelivery.volume;

    currentLat = nextDelivery.lat;
    currentLng = nextDelivery.lng;
  }

  const estimatedFuel = totalDistance / vehicle.fuelEfficiency;
  const estimatedCost = totalDistance * vehicle.costPerKm;

  return {
    vehicleId: vehicle.id,
    deliveries: route,
    totalDistance,
    totalTime,
    estimatedFuel,
    estimatedCost,
    sequence: route.map(d => d.id)
  };
}

/**
 * Optimiza rutas para múltiples vehículos y entregas
 */
export function optimizeRoutes(
  vehicles: Vehicle[],
  deliveries: Delivery[]
): OptimizationResult {
  const routes: OptimizedRoute[] = [];
  const unassigned: Delivery[] = [];
  const remainingDeliveries = [...deliveries];

  // Ordenar vehículos por capacidad (más grandes primero)
  const sortedVehicles = [...vehicles].sort((a, b) =>
    (b.capacity.weight + b.capacity.volume) - (a.capacity.weight + a.capacity.volume)
  );

  // Asignar rutas a cada vehículo
  for (const vehicle of sortedVehicles) {
    if (remainingDeliveries.length === 0) break;

    const route = nearestNeighborRoute(
      vehicle,
      remainingDeliveries,
      vehicle.currentLocation.lat,
      vehicle.currentLocation.lng
    );

    if (route.deliveries.length > 0) {
      routes.push(route);

      // Remover entregas asignadas
      route.deliveries.forEach(delivery => {
        const index = remainingDeliveries.findIndex(d => d.id === delivery.id);
        if (index !== -1) {
          remainingDeliveries.splice(index, 1);
        }
      });
    }
  }

  // Entregas no asignadas
  unassigned.push(...remainingDeliveries);

  // Calcular métricas totales
  const totalDistance = routes.reduce((sum, r) => sum + r.totalDistance, 0);
  const totalTime = routes.reduce((sum, r) => sum + r.totalTime, 0);
  const totalCost = routes.reduce((sum, r) => sum + r.estimatedCost, 0);
  const fuelConsumption = routes.reduce((sum, r) => sum + r.estimatedFuel, 0);

  // Estimación de mejora vs rutas no optimizadas (baseline: +25% distancia)
  const unoptimizedDistance = totalDistance * 1.25;
  const efficiencyGain = ((unoptimizedDistance - totalDistance) / unoptimizedDistance) * 100;
  const co2Reduction = (unoptimizedDistance - totalDistance) * 2.3; // kg CO2 por km

  return {
    routes,
    metrics: {
      totalDistance,
      totalTime,
      totalCost,
      fuelConsumption,
      co2Reduction,
      efficiencyGain
    },
    unassignedDeliveries: unassigned
  };
}

/**
 * Genera datos demo para testing
 */
export function generateDemoData(): { vehicles: Vehicle[]; deliveries: Delivery[] } {
  const vehicles: Vehicle[] = [
    {
      id: 'v1',
      plate: 'NAR-123',
      capacity: { weight: 5000, volume: 15 },
      currentLocation: { lat: 1.2136, lng: -77.2811 }, // Pasto
      fuelEfficiency: 8, // km/galón
      costPerKm: 1200,
      maxWorkHours: 10,
      driver: 'Carlos Martínez'
    },
    {
      id: 'v2',
      plate: 'NAR-456',
      capacity: { weight: 8000, volume: 25 },
      currentLocation: { lat: 1.2136, lng: -77.2811 },
      fuelEfficiency: 6,
      costPerKm: 1500,
      maxWorkHours: 10,
      driver: 'María López'
    }
  ];

  const deliveries: Delivery[] = [
    {
      id: 'd1',
      address: 'Calle 18 # 25-40, Pasto',
      lat: 1.2144,
      lng: -77.2794,
      weight: 500,
      volume: 2,
      timeWindow: { start: '08:00', end: '12:00' },
      priority: 'high',
      serviceTime: 15
    },
    {
      id: 'd2',
      address: 'Carrera 27 # 14-20, Pasto',
      lat: 1.2103,
      lng: -77.2825,
      weight: 800,
      volume: 3,
      timeWindow: { start: '09:00', end: '14:00' },
      priority: 'medium',
      serviceTime: 20
    },
    {
      id: 'd3',
      address: 'Avenida Panamericana Km 2, Pasto',
      lat: 1.2089,
      lng: -77.2931,
      weight: 1200,
      volume: 4,
      timeWindow: { start: '10:00', end: '16:00' },
      priority: 'low',
      serviceTime: 25
    },
    {
      id: 'd4',
      address: 'Centro Comercial Unicentro, Pasto',
      lat: 1.2175,
      lng: -77.2753,
      weight: 600,
      volume: 2.5,
      timeWindow: { start: '08:00', end: '18:00' },
      priority: 'high',
      serviceTime: 15
    },
    {
      id: 'd5',
      address: 'Terminal de Transportes, Pasto',
      lat: 1.2192,
      lng: -77.2683,
      weight: 400,
      volume: 1.5,
      timeWindow: { start: '11:00', end: '15:00' },
      priority: 'medium',
      serviceTime: 10
    }
  ];

  return { vehicles, deliveries };
}
