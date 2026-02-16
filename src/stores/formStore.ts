/**
 * Centralized Form State Store
 * 
 * Reduces useState proliferation by providing a global store for form state
 * Supports:
 * - Multi-step forms
 * - Form persistence
 * - Reset functionality
 * - Type-safe form data
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FormState {
  // Preoperational checklist form
  checklistData: {
    vehicleId?: string;
    driverId?: string;
    items: Record<string, boolean>;
    observations?: string;
    photos?: string[];
    currentStep: number;
  };

  // Trip planning form
  tripData: {
    origin?: string;
    destination?: string;
    vehicleId?: string;
    driverId?: string;
    scheduledStart?: string;
    estimatedDuration?: number;
    cargo?: string;
    currentStep: number;
  };

  // Maintenance form
  maintenanceData: {
    vehicleId?: string;
    type?: string;
    description?: string;
    scheduledDate?: string;
    assignedTo?: string;
    parts?: Array<{ id: string; quantity: number }>;
    currentStep: number;
  };

  // Actions
  setChecklistData: (data: Partial<FormState['checklistData']>) => void;
  resetChecklistData: () => void;

  setTripData: (data: Partial<FormState['tripData']>) => void;
  resetTripData: () => void;

  setMaintenanceData: (data: Partial<FormState['maintenanceData']>) => void;
  resetMaintenanceData: () => void;

  // Reset all forms
  resetAll: () => void;
}

const initialChecklistData: FormState['checklistData'] = {
  items: {},
  currentStep: 0,
};

const initialTripData: FormState['tripData'] = {
  currentStep: 0,
};

const initialMaintenanceData: FormState['maintenanceData'] = {
  parts: [],
  currentStep: 0,
};

export const useFormStore = create<FormState>()(
  persist(
    (set) => ({
      // Initial state
      checklistData: initialChecklistData,
      tripData: initialTripData,
      maintenanceData: initialMaintenanceData,

      // Checklist actions
      setChecklistData: (data) =>
        set((state) => ({
          checklistData: { ...state.checklistData, ...data },
        })),
      resetChecklistData: () =>
        set({ checklistData: initialChecklistData }),

      // Trip actions
      setTripData: (data) =>
        set((state) => ({
          tripData: { ...state.tripData, ...data },
        })),
      resetTripData: () =>
        set({ tripData: initialTripData }),

      // Maintenance actions
      setMaintenanceData: (data) =>
        set((state) => ({
          maintenanceData: { ...state.maintenanceData, ...data },
        })),
      resetMaintenanceData: () =>
        set({ maintenanceData: initialMaintenanceData }),

      // Reset all
      resetAll: () =>
        set({
          checklistData: initialChecklistData,
          tripData: initialTripData,
          maintenanceData: initialMaintenanceData,
        }),
    }),
    {
      name: 'cellvi-form-storage',
      // Only persist form data, not temporary UI state
      partialize: (state) => ({
        checklistData: state.checklistData,
        tripData: state.tripData,
        maintenanceData: state.maintenanceData,
      }),
    }
  )
);
