/**
 * Offline Forms Persistence
 * Auto-saves form data to IndexedDB during editing to prevent data loss
 */

const DB_NAME = 'CELLVI_OFFLINE_FORMS';
const STORE_NAME = 'form_drafts';
const DB_VERSION = 1;

export interface FormDraft {
  id: string; // Unique form identifier (e.g., 'checklist-vehicle-123')
  formType: 'checklist' | 'rndc' | 'maintenance' | 'trip' | 'inspection';
  data: Record<string, unknown>;
  lastSaved: number; // Timestamp
  userId?: string;
  metadata?: {
    vehicleId?: string;
    step?: number;
    completionPercent?: number;
  };
}

let dbInstance: IDBDatabase | null = null;

/**
 * Open IndexedDB connection
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('formType', 'formType', { unique: false });
        store.createIndex('lastSaved', 'lastSaved', { unique: false });
        store.createIndex('userId', 'userId', { unique: false });
      }
    };
  });
};

/**
 * Save form draft to IndexedDB
 */
export const saveFormDraft = async (
  id: string,
  formType: FormDraft['formType'],
  data: Record<string, unknown>,
  userId?: string,
  metadata?: FormDraft['metadata']
): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const draft: FormDraft = {
    id,
    formType,
    data,
    lastSaved: Date.now(),
    userId,
    metadata,
  };

  return new Promise((resolve, reject) => {
    const request = store.put(draft);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get form draft from IndexedDB
 */
export const getFormDraft = async (id: string): Promise<FormDraft | null> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Delete form draft after successful submission
 */
export const deleteFormDraft = async (id: string): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get all drafts for a specific form type
 */
export const getAllDrafts = async (
  formType?: FormDraft['formType']
): Promise<FormDraft[]> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = formType
      ? store.index('formType').getAll(formType)
      : store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Clean up old drafts (older than N days)
 */
export const cleanupOldDrafts = async (daysOld: number = 30): Promise<number> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  return new Promise((resolve, reject) => {
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

      if (cursor) {
        const draft = cursor.value as FormDraft;

        if (draft.lastSaved < cutoffTime) {
          cursor.delete();
          deletedCount++;
        }

        cursor.continue();
      } else {
        resolve(deletedCount);
      }
    };

    request.onerror = () => reject(request.error);
  });
};

/**
 * Auto-save hook - debounces saves to avoid excessive writes
 */
export class FormAutoSaver {
  private formId: string;
  private formType: FormDraft['formType'];
  private userId?: string;
  private metadata?: FormDraft['metadata'];
  private debounceTimer: NodeJS.Timeout | null = null;
  private debounceMs: number;

  constructor(
    formId: string,
    formType: FormDraft['formType'],
    userId?: string,
    metadata?: FormDraft['metadata'],
    debounceMs: number = 1000
  ) {
    this.formId = formId;
    this.formType = formType;
    this.userId = userId;
    this.metadata = metadata;
    this.debounceMs = debounceMs;
  }

  /**
   * Save form data with debouncing
   */
  save(data: Record<string, unknown>): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      saveFormDraft(this.formId, this.formType, data, this.userId, this.metadata)
        .then(() => {
          console.log(`[AutoSave] Form ${this.formId} saved at ${new Date().toISOString()}`);
        })
        .catch((error) => {
          console.error(`[AutoSave] Failed to save form ${this.formId}:`, error);
        });
    }, this.debounceMs);
  }

  /**
   * Force immediate save (e.g., on blur or navigation)
   */
  saveNow(data: Record<string, unknown>): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    return saveFormDraft(this.formId, this.formType, data, this.userId, this.metadata);
  }

  /**
   * Clear saved draft
   */
  clear(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    return deleteFormDraft(this.formId);
  }

  /**
   * Load existing draft
   */
  async load(): Promise<FormDraft | null> {
    return getFormDraft(this.formId);
  }
}

/**
 * React hook for auto-saving forms
 */
export const useFormAutoSave = (
  formId: string,
  formType: FormDraft['formType'],
  userId?: string,
  metadata?: FormDraft['metadata']
) => {
  const autoSaver = new FormAutoSaver(formId, formType, userId, metadata);

  return {
    save: (data: Record<string, unknown>) => autoSaver.save(data),
    saveNow: (data: Record<string, unknown>) => autoSaver.saveNow(data),
    clear: () => autoSaver.clear(),
    load: () => autoSaver.load(),
  };
};
