/**
 * Form Store - Centralized form state management
 * Replaces scattered useState declarations for multi-step forms
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==================== CHECKLIST FORM ====================
export interface ChecklistFormData {
  driverId?: string;
  vehicleId?: string;
  items: Record<string, boolean>;
  observations?: string;
  photos?: string[];
  startTime?: number;
  completedTime?: number;
}

interface ChecklistFormState {
  data: ChecklistFormData;
  setDriverId: (id: string) => void;
  setVehicleId: (id: string) => void;
  toggleItem: (itemId: string) => void;
  setObservations: (text: string) => void;
  addPhoto: (url: string) => void;
  removePhoto: (url: string) => void;
  startChecklist: () => void;
  completeChecklist: () => void;
  resetChecklist: () => void;
}

// ==================== RNDC FORM ====================
export interface RNDCFormData {
  vehicleId?: string;
  origin?: string;
  destination?: string;
  cargo?: string;
  weight?: number;
  manifestNumber?: string;
  remitente?: string;
  destinatario?: string;
  fecha?: string;
}

interface RNDCFormState {
  data: RNDCFormData;
  updateField: <K extends keyof RNDCFormData>(field: K, value: RNDCFormData[K]) => void;
  resetForm: () => void;
}

// ==================== MAINTENANCE FORM ====================
export interface MaintenanceFormData {
  vehicleId?: string;
  type?: 'preventive' | 'corrective' | 'inspection';
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate?: string;
  assignedTo?: string;
  parts?: Array<{ id: string; quantity: number }>;
  estimatedCost?: number;
}

interface MaintenanceFormState {
  data: MaintenanceFormData;
  updateField: <K extends keyof MaintenanceFormData>(
    field: K,
    value: MaintenanceFormData[K]
  ) => void;
  addPart: (partId: string, quantity: number) => void;
  removePart: (partId: string) => void;
  resetForm: () => void;
}

// ==================== COMBINED STORE ====================
interface FormStoreState {
  checklist: ChecklistFormState;
  rndc: RNDCFormState;
  maintenance: MaintenanceFormState;
}

export const useFormStore = create<FormStoreState>()(
  persist(
    (set) => ({
      // CHECKLIST FORM
      checklist: {
        data: {
          items: {},
        },
        setDriverId: (id) =>
          set((state) => ({
            checklist: {
              ...state.checklist,
              data: { ...state.checklist.data, driverId: id },
            },
          })),
        setVehicleId: (id) =>
          set((state) => ({
            checklist: {
              ...state.checklist,
              data: { ...state.checklist.data, vehicleId: id },
            },
          })),
        toggleItem: (itemId) =>
          set((state) => ({
            checklist: {
              ...state.checklist,
              data: {
                ...state.checklist.data,
                items: {
                  ...state.checklist.data.items,
                  [itemId]: !state.checklist.data.items[itemId],
                },
              },
            },
          })),
        setObservations: (text) =>
          set((state) => ({
            checklist: {
              ...state.checklist,
              data: { ...state.checklist.data, observations: text },
            },
          })),
        addPhoto: (url) =>
          set((state) => ({
            checklist: {
              ...state.checklist,
              data: {
                ...state.checklist.data,
                photos: [...(state.checklist.data.photos || []), url],
              },
            },
          })),
        removePhoto: (url) =>
          set((state) => ({
            checklist: {
              ...state.checklist,
              data: {
                ...state.checklist.data,
                photos: state.checklist.data.photos?.filter((p) => p !== url) || [],
              },
            },
          })),
        startChecklist: () =>
          set((state) => ({
            checklist: {
              ...state.checklist,
              data: { ...state.checklist.data, startTime: Date.now() },
            },
          })),
        completeChecklist: () =>
          set((state) => ({
            checklist: {
              ...state.checklist,
              data: { ...state.checklist.data, completedTime: Date.now() },
            },
          })),
        resetChecklist: () =>
          set((state) => ({
            checklist: {
              ...state.checklist,
              data: { items: {} },
            },
          })),
      },

      // RNDC FORM
      rndc: {
        data: {},
        updateField: (field, value) =>
          set((state) => ({
            rndc: {
              ...state.rndc,
              data: { ...state.rndc.data, [field]: value },
            },
          })),
        resetForm: () =>
          set((state) => ({
            rndc: {
              ...state.rndc,
              data: {},
            },
          })),
      },

      // MAINTENANCE FORM
      maintenance: {
        data: {},
        updateField: (field, value) =>
          set((state) => ({
            maintenance: {
              ...state.maintenance,
              data: { ...state.maintenance.data, [field]: value },
            },
          })),
        addPart: (partId, quantity) =>
          set((state) => ({
            maintenance: {
              ...state.maintenance,
              data: {
                ...state.maintenance.data,
                parts: [
                  ...(state.maintenance.data.parts || []),
                  { id: partId, quantity },
                ],
              },
            },
          })),
        removePart: (partId) =>
          set((state) => ({
            maintenance: {
              ...state.maintenance,
              data: {
                ...state.maintenance.data,
                parts: state.maintenance.data.parts?.filter((p) => p.id !== partId) || [],
              },
            },
          })),
        resetForm: () =>
          set((state) => ({
            maintenance: {
              ...state.maintenance,
              data: {},
            },
          })),
      },
    }),
    {
      name: 'cellvi-forms-storage',
      partialize: (state) => ({
        // Only persist certain forms to avoid data loss
        checklist: state.checklist.data,
        rndc: state.rndc.data,
        maintenance: state.maintenance.data,
      }),
    }
  )
);
