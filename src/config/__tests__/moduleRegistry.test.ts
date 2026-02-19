/**
 * Module Registry Tests
 * Tests for src/config/moduleRegistry.tsx
 */

import { describe, it, expect } from 'vitest';
import { MODULE_REGISTRY, getModuleLabel } from '../moduleRegistry';

/** All 27 expected module keys. */
const EXPECTED_KEYS = [
  // Monitoring & Overview
  'overview',
  'map',
  'alerts',
  'evidence-verifier',
  'gateway-monitor',
  // Fleet Management
  'routes',
  'geofences',
  'drivers',
  'asset-detail',
  'predictive',
  'rndc',
  // Operations
  'fuel',
  'cold-chain',
  'connectivity',
  // Control & Security
  'policy-engine',
  'gnss-security',
  'evidence',
  'audit-log',
  'reports',
  // Compliance & Admin
  'compliance',
  'billing',
  'admin',
  // AI Features
  'asegurar-ia',
  'route-genius',
  'vision-guard',
  'neuro-core',
  'ai-command-center',
];

// ── Registry Structure ─────────────────────────────────────────────────────

describe('MODULE_REGISTRY structure', () => {
  it('should contain exactly 27 module keys', () => {
    const keys = Object.keys(MODULE_REGISTRY);
    expect(keys).toHaveLength(27);
  });

  it.each(EXPECTED_KEYS)('should contain the "%s" module key', (key) => {
    expect(MODULE_REGISTRY).toHaveProperty(key);
  });
});

// ── Module Properties ──────────────────────────────────────────────────────

describe('module properties', () => {
  it.each(Object.keys(MODULE_REGISTRY))('"%s" should have a component property', (key) => {
    expect(MODULE_REGISTRY[key].component).toBeDefined();
  });

  it.each(Object.keys(MODULE_REGISTRY))('"%s" should have a non-empty label string', (key) => {
    expect(typeof MODULE_REGISTRY[key].label).toBe('string');
    expect(MODULE_REGISTRY[key].label.length).toBeGreaterThan(0);
  });
});

// ── getModuleLabel ─────────────────────────────────────────────────────────

describe('getModuleLabel', () => {
  it('should return "Vista General" for the "overview" key', () => {
    expect(getModuleLabel('overview')).toBe('Vista General');
  });

  it('should return "Mapa de Flota" for the "map" key', () => {
    expect(getModuleLabel('map')).toBe('Mapa de Flota');
  });

  it('should return "Alertas" for the "alerts" key', () => {
    expect(getModuleLabel('alerts')).toBe('Alertas');
  });

  it('should return "Cadena de Frio" for the "cold-chain" key', () => {
    expect(getModuleLabel('cold-chain')).toBe('Cadena de Frío');
  });

  it('should return "Asegurar IA" for the "asegurar-ia" key', () => {
    expect(getModuleLabel('asegurar-ia')).toBe('Asegurar IA');
  });

  it('should return "Vista General" for an unknown key', () => {
    expect(getModuleLabel('nonexistent-module')).toBe('Vista General');
  });

  it('should return "Vista General" for empty string key', () => {
    expect(getModuleLabel('')).toBe('Vista General');
  });
});

// ── No Duplicate Labels ────────────────────────────────────────────────────

describe('label uniqueness', () => {
  it('should have no duplicate labels across modules', () => {
    const labels = Object.values(MODULE_REGISTRY).map((m) => m.label);
    const unique = new Set(labels);
    expect(unique.size).toBe(labels.length);
  });
});
