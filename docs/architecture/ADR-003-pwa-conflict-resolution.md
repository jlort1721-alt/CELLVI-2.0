# ADR-003: PWA Offline Conflict Resolution Strategy

**Status**: Accepted
**Date**: 2026-02-13
**Deciders**: Engineering Team, Product Team
**Technical Story**: Enable offline-first capabilities, handle network partitions gracefully

## Context

CELLVI 2.0 operates in environments with unreliable connectivity:
- Rural delivery routes with poor cellular coverage
- Underground parking garages (GPS/network blackout)
- International shipping (roaming limitations)
- Fleet operations in remote areas

**User Requirements**:
1. View cached data offline (read-only mode)
2. Queue mutations for later sync (create/update)
3. Resolve conflicts when multiple users edit same entity
4. Never lose user data due to network failures

**Constraint**: Multi-tenant system requires conflict resolution that preserves data integrity across tenants

## Decision

**Selected**: Last-Write-Wins (LWW) with Optimistic UI + Client-Side Timestamps

**Strategy**:
1. **Offline Reads**: Service Worker serves cached data
2. **Offline Writes**: Queue mutations in IndexedDB
3. **Sync on Reconnect**: Process queue, send to server
4. **Conflict Detection**: Compare client timestamp vs server `updated_at`
5. **Resolution**: Server timestamp wins (last write wins)
6. **User Notification**: Toast message shows sync status

## Architecture

### Sync Queue Store

```typescript
// src/stores/syncStatusStore.ts

export interface SyncOperation {
  id: string;                          // UUID
  type: 'create' | 'update' | 'delete';
  entity: string;                      // 'orders', 'alerts', 'vehicles'
  data: Record<string, unknown>;       // Mutation payload
  timestamp: number;                   // Client timestamp (epoch ms)
  status: 'pending' | 'syncing' | 'success' | 'error';
  retryCount: number;
  error?: string;
  tenant_id: string;                   // Multi-tenant isolation
}

export const useSyncStatusStore = create<SyncStatusState>((set, get) => ({
  isOnline: navigator.onLine,
  pendingOperations: [],

  addOperation: (operation: SyncOperation) => {
    set((state) => ({
      pendingOperations: [...state.pendingOperations, operation],
    }));

    // Optimistic UI update
    queryClient.setQueryData(queryKeys[operation.entity].lists(), (old) => {
      if (operation.type === 'create') return [operation.data, ...(old || [])];
      if (operation.type === 'update') {
        return (old || []).map((item) =>
          item.id === operation.data.id ? { ...item, ...operation.data } : item
        );
      }
      if (operation.type === 'delete') {
        return (old || []).filter((item) => item.id !== operation.data.id);
      }
    });
  },

  syncPendingOperations: async () => {
    const { pendingOperations } = get();

    for (const op of pendingOperations) {
      try {
        set((state) => ({
          pendingOperations: state.pendingOperations.map((o) =>
            o.id === op.id ? { ...o, status: 'syncing' } : o
          ),
        }));

        const response = await supabase
          .from(op.entity)
          [op.type === 'create' ? 'insert' : op.type === 'update' ? 'update' : 'delete'](
            op.type === 'delete' ? { id: op.data.id } : op.data
          );

        if (response.error) throw response.error;

        // Success
        set((state) => ({
          pendingOperations: state.pendingOperations.filter((o) => o.id !== op.id),
        }));

      } catch (error) {
        // Conflict or error
        set((state) => ({
          pendingOperations: state.pendingOperations.map((o) =>
            o.id === op.id ? {
              ...o,
              status: 'error',
              error: error.message,
              retryCount: o.retryCount + 1,
            } : o
          ),
        }));

        // Max retries exceeded
        if (op.retryCount >= 3) {
          toast.error(`Error sincronizando ${op.entity}: ${error.message}`);
        }
      }
    }
  },
}));
```

### Conflict Detection

```typescript
// Server-side: Edge Function validation
export async function handleUpdate(
  supabase: SupabaseClient,
  entity: string,
  id: string,
  updates: Record<string, unknown>,
  clientTimestamp: number
) {
  // Fetch current server version
  const { data: current, error } = await supabase
    .from(entity)
    .select('updated_at')
    .eq('id', id)
    .single();

  if (error) throw error;

  const serverTimestamp = new Date(current.updated_at).getTime();

  // Conflict detection: Client timestamp older than server
  if (clientTimestamp < serverTimestamp) {
    return {
      conflict: true,
      message: 'Entity was modified by another user',
      serverVersion: current,
      clientVersion: updates,
    };
  }

  // No conflict: Apply update
  const { data, error: updateError } = await supabase
    .from(entity)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (updateError) throw updateError;

  return { conflict: false, data };
}
```

### Service Worker Caching

```typescript
// public/sw.js

const CACHE_NAME = 'cellvi-v1';
const OFFLINE_URLS = [
  '/',
  '/login',
  '/admin/dashboard',
  '/manifest.json',
  '/offline.html',
];

// Network-first with cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        const clonedResponse = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clonedResponse);
        });
        return response;
      })
      .catch(() => {
        // Offline: Serve from cache
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('/offline.html');
        });
      })
  );
});
```

## Conflict Resolution Examples

### Scenario 1: Simple Update (No Conflict)

**Timeline**:
1. User A (offline): Updates `order.delivery_address` at `t=100`
2. User A (online): Syncs mutation at `t=150`
3. Server: Last `updated_at` was `t=50` → No conflict → ✅ Accept

**Result**: Server applies update, returns `updated_at=150`

### Scenario 2: Conflicting Updates (LWW)

**Timeline**:
1. User A (offline): Updates `order.status = "delivered"` at `t=100`
2. User B (online): Updates `order.status = "cancelled"` at `t=120`
3. Server: Applies User B's update (later timestamp)
4. User A (online): Syncs at `t=150`, server detects conflict (`t=100 < t=120`)

**Result**:
- Server rejects User A's update
- Client receives conflict response
- Toast: "El pedido fue modificado por otro usuario. Recargando..."
- Client invalidates cache, refetches latest data
- User A sees `status = "cancelled"` (User B's version)

### Scenario 3: Delete Conflict

**Timeline**:
1. User A (offline): Updates `vehicle.maintenance_notes` at `t=100`
2. User B (online): Deletes `vehicle` at `t=110`
3. User A (online): Syncs update at `t=130`

**Result**:
- Server returns `404 Not Found` (vehicle deleted)
- Client shows toast: "El vehículo ya no existe"
- Client removes from local cache

## Decision Matrix

| Scenario | Strategy | Rationale |
|----------|----------|-----------|
| **Same user, sequential edits** | Last write wins | User's most recent intent |
| **Different users, same field** | Last write wins | Simple, predictable |
| **Different users, different fields** | Merge (future) | Preserve both changes |
| **Delete vs Update** | Delete wins | Deletion is intentional |
| **Stale read (>5 min offline)** | Reject, force refresh | Prevent outdated updates |

## Consequences

### Positive

✅ **Simple**: Easy to understand and implement
✅ **Fast**: No complex CRDT logic or vector clocks
✅ **Predictable**: Users know latest edit wins
✅ **Offline-First**: Queue mutations, sync later
✅ **No Data Loss**: Optimistic UI + retry logic

### Negative

⚠️ **Lost Updates**: User A's changes overwritten by User B
⚠️ **No Branching**: Can't merge concurrent edits to different fields
⚠️ **User Confusion**: "My changes disappeared" (conflict not visible)

### Mitigations

1. **Toast Notifications**: Explicit message when conflict detected
2. **Audit Logs**: Track all updates (including overwritten ones)
3. **Version History**: Future feature to restore previous versions
4. **Collaborative Editing**: For critical entities, use real-time locks (future)

## Alternatives Considered

### 1. Operational Transform (OT) - Rejected

Used by: Google Docs, Figma

**Pros**: True collaborative editing, merge concurrent changes
**Cons**: Extremely complex (1000+ LOC), requires central coordination server
**Verdict**: ❌ Over-engineering for fleet management (not a text editor)

### 2. Conflict-Free Replicated Data Types (CRDTs) - Rejected

Used by: Redis, Riak, Apple Notes

**Pros**: Automatic conflict resolution, eventual consistency
**Cons**: Large payload size, complex merge logic, not natively supported by Postgres
**Verdict**: ❌ Requires database redesign, overkill for current use case

### 3. Pessimistic Locking - Rejected

**Implementation**: Lock row when user opens edit modal

**Pros**: Prevents conflicts entirely
**Cons**: Doesn't work offline, lock expiration issues, poor UX
**Verdict**: ❌ Violates offline-first requirement

### 4. Version Vectors - Considered

**Pros**: Detects concurrent edits, enables multi-master replication
**Cons**: Requires `version_vector` column, complex merge UI
**Verdict**: ⏳ Deferred to Phase 6 (future enhancement)

## User Experience

### Sync Status Indicator

```tsx
// src/components/SyncStatus.tsx
export function SyncStatus() {
  const { isOnline, pendingOperations } = useSyncStatusStore();

  if (pendingOperations.length === 0 && isOnline) {
    return <Badge variant="success">Sincronizado</Badge>;
  }

  if (!isOnline) {
    return <Badge variant="warning">Sin conexión - {pendingOperations.length} pendientes</Badge>;
  }

  return <Badge variant="info">Sincronizando {pendingOperations.length}...</Badge>;
}
```

### Conflict Resolution UI

```tsx
// When conflict detected
toast.error(
  <div>
    <p>Conflicto detectado: Este pedido fue modificado por otro usuario.</p>
    <button onClick={refetch}>Ver última versión</button>
    <button onClick={forceUpdate}>Sobrescribir cambios</button>
  </div>,
  { duration: 10000 }
);
```

## Monitoring

### Metrics

```sql
-- Conflict rate
SELECT
  entity,
  COUNT(*) as total_updates,
  SUM(CASE WHEN conflict = true THEN 1 ELSE 0 END) as conflicts,
  ROUND(100.0 * SUM(CASE WHEN conflict = true THEN 1 ELSE 0 END) / COUNT(*), 2) as conflict_rate
FROM sync_logs
WHERE created_at > now() - INTERVAL '7 days'
GROUP BY entity;
```

### Alerts

- Conflict rate > 5% → Investigate multi-user workflows
- Pending operations > 50 → Check sync loop health
- Retry count > 3 → Server errors or validation failures

## Testing Strategy

### Unit Tests

```typescript
describe('Conflict Resolution', () => {
  it('should reject stale updates', async () => {
    // Server has t=200
    const result = await handleUpdate(supabase, 'orders', 'order-1', { status: 'delivered' }, 100);
    expect(result.conflict).toBe(true);
  });

  it('should accept fresh updates', async () => {
    // Client has t=300, server has t=200
    const result = await handleUpdate(supabase, 'orders', 'order-1', { status: 'delivered' }, 300);
    expect(result.conflict).toBe(false);
  });
});
```

### Integration Tests

```typescript
test('Offline queue syncs on reconnect', async () => {
  // 1. Go offline
  await page.evaluate(() => { navigator.onLine = false; });

  // 2. Create order (queued)
  await page.click('[data-testid="create-order"]');
  expect(await page.locator('[data-testid="pending-ops"]').innerText()).toBe('1 pendiente');

  // 3. Go online
  await page.evaluate(() => { navigator.onLine = true; });
  await page.waitForTimeout(2000); // Sync delay

  // 4. Verify sync
  expect(await page.locator('[data-testid="pending-ops"]').innerText()).toBe('0 pendiente');
});
```

## Rollback Plan

If conflict resolution causes data corruption:

1. **Immediate**: Disable offline writes (`ENABLE_OFFLINE_QUEUE=false`)
2. **Temporary**: Force online-only mode (block mutations when offline)
3. **Investigation**: Query `sync_logs` table for failed operations
4. **Recovery**: Restore from Supabase point-in-time backup (7-day retention)

## Future Enhancements

1. **Field-Level Merging**: Merge updates to different fields (avoid full-row LWW)
2. **Three-Way Merge UI**: Show base → client → server diffs, let user choose
3. **Real-Time Locks**: For critical entities (orders in "processing" state)
4. **Background Sync**: Use Background Sync API for reliable offline→online sync
5. **IndexedDB Persistence**: Store full entity cache for instant offline reads

## References

- [Offline First Principles](https://offlinefirst.org/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Conflict Resolution Strategies](https://martin.kleppmann.com/2020/07/06/crdt-hard-parts-hydra.html)
- [IndexedDB Best Practices](https://web.dev/indexeddb-best-practices/)

---

**Last Updated**: 2026-02-13
**Next Review**: 2026-05-13 (quarterly)
