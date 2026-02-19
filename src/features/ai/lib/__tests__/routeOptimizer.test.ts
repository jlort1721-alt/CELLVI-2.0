/**
 * Tests for Route Optimizer
 */

import { describe, it, expect } from 'vitest';
import {
  optimizeRoutes,
  generateDemoData,
  type Vehicle,
  type Delivery,
} from '../routeOptimizer';

describe('Route Optimizer', () => {
  describe('calculateDistance (via optimizeRoutes)', () => {
    it('should produce non-zero distances for different locations', () => {
      const data = generateDemoData();
      const result = optimizeRoutes(data.vehicles, data.deliveries);

      // The optimizer uses calculateDistance internally; verify distances are computed
      expect(result.metrics.totalDistance).toBeGreaterThan(0);
    });

    it('should return 0 distance when no deliveries', () => {
      const data = generateDemoData();
      const result = optimizeRoutes(data.vehicles, []);

      expect(result.metrics.totalDistance).toBe(0);
    });
  });

  describe('generateDemoData', () => {
    it('should generate valid demo vehicles', () => {
      const data = generateDemoData();

      expect(data.vehicles).toHaveLength(2);
      expect(data.vehicles[0]).toHaveProperty('id');
      expect(data.vehicles[0]).toHaveProperty('plate');
      expect(data.vehicles[0]).toHaveProperty('capacity');
      expect(data.vehicles[0].capacity).toHaveProperty('weight');
      expect(data.vehicles[0].capacity).toHaveProperty('volume');
    });

    it('should generate valid demo deliveries', () => {
      const data = generateDemoData();

      expect(data.deliveries).toHaveLength(5);
      expect(data.deliveries[0]).toHaveProperty('id');
      expect(data.deliveries[0]).toHaveProperty('address');
      expect(data.deliveries[0]).toHaveProperty('lat');
      expect(data.deliveries[0]).toHaveProperty('weight');
      expect(data.deliveries[0]).toHaveProperty('priority');
    });
  });

  describe('optimizeRoutes', () => {
    it('should optimize routes for valid input', () => {
      const data = generateDemoData();
      const result = optimizeRoutes(data.vehicles, data.deliveries);

      expect(result).toHaveProperty('routes');
      expect(result).toHaveProperty('unassignedDeliveries');
      expect(result).toHaveProperty('metrics');
      expect(Array.isArray(result.routes)).toBe(true);
    });

    it('should calculate metrics correctly', () => {
      const data = generateDemoData();
      const result = optimizeRoutes(data.vehicles, data.deliveries);

      expect(result.metrics).toHaveProperty('totalDistance');
      expect(result.metrics).toHaveProperty('totalCost');
      expect(result.metrics).toHaveProperty('fuelConsumption');
      expect(result.metrics).toHaveProperty('co2Reduction');
      expect(result.metrics).toHaveProperty('efficiencyGain');

      expect(result.metrics.totalDistance).toBeGreaterThan(0);
      expect(result.metrics.efficiencyGain).toBeGreaterThanOrEqual(0);
      expect(result.metrics.efficiencyGain).toBeLessThanOrEqual(100);
    });

    it('should respect vehicle capacity constraints', () => {
      const vehicles: Vehicle[] = [
        {
          id: 'V-001',
          plate: 'TEST-001',
          capacity: { weight: 1000, volume: 10 },
          currentLocation: { lat: 4.6097, lng: -74.0817 },
          fuelEfficiency: 8,
          costPerKm: 2.5,
          maxWorkHours: 10,
          driver: 'Test Driver',
        },
      ];

      const deliveries: Delivery[] = [
        {
          id: 'D-001',
          address: 'Calle 100 #15-20',
          lat: 4.6868,
          lng: -74.0547,
          weight: 600,
          volume: 5,
          priority: 'high',
          timeWindow: { start: '08:00', end: '18:00' },
          serviceTime: 15,
        },
        {
          id: 'D-002',
          address: 'Carrera 7 #85-10',
          lat: 4.6629,
          lng: -74.0584,
          weight: 600,
          volume: 5,
          priority: 'medium',
          timeWindow: { start: '08:00', end: '18:00' },
          serviceTime: 15,
        },
      ];

      const result = optimizeRoutes(vehicles, deliveries);

      // One delivery should be unassigned due to capacity
      expect(result.unassignedDeliveries.length).toBeGreaterThan(0);
    });

    it('should handle empty inputs gracefully', () => {
      const result = optimizeRoutes([], []);

      expect(result.routes).toHaveLength(0);
      expect(result.unassignedDeliveries).toHaveLength(0);
      expect(result.metrics.totalDistance).toBe(0);
    });

    it('should prioritize high-priority deliveries', () => {
      const data = generateDemoData();
      const result = optimizeRoutes(data.vehicles, data.deliveries);

      // Check that routes are created
      expect(result.routes.length).toBeGreaterThan(0);

      // Verify first deliveries in routes tend to be high priority
      const firstDeliveries = result.routes.map((route) => {
        const firstDeliveryId = route.sequence[0];
        return route.deliveries.find((d) => d.id === firstDeliveryId);
      });

      const highPriorityFirst = firstDeliveries.filter((d) => d?.priority === 'high').length;
      expect(highPriorityFirst).toBeGreaterThan(0);
    });
  });
});
