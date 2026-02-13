# CELLVI 2.0 API Documentation

**Version**: 1.0.0
**Last Updated**: 2026-02-13
**Base URL**: `https://[project-ref].supabase.co/functions/v1`

## Authentication

All API endpoints require authentication via JWT Bearer token.

```bash
Authorization: Bearer <supabase-jwt-token>
```

**How to obtain token**:
```typescript
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;
```

**Token includes**:
- `sub`: User ID (UUID)
- `user_metadata.tenant_id`: Tenant ID (for RLS)
- `role`: User role (`authenticated`, `service_role`)
- `exp`: Expiration timestamp

---

## Edge Functions

### 1. API Gateway - Create Order

**Endpoint**: `POST /api-gateway`
**Action**: `createOrder`
**Rate Limit**: 100 requests/hour per tenant

#### Request

```typescript
POST /api-gateway
Content-Type: application/json
Authorization: Bearer <token>

{
  "action": "createOrder",
  "payload": {
    "client_id": "550e8400-e29b-41d4-a716-446655440000",
    "items": [
      {
        "product_id": "660e8400-e29b-41d4-a716-446655440001",
        "quantity": 10,
        "unit_price": 25000
      }
    ],
    "delivery_address": "Calle 123 #45-67, Bogotá, Colombia",
    "notes": "Entregar en horario de oficina" // optional
  }
}
```

#### Input Schema

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `action` | string | Yes | Must be `"createOrder"` | API action type |
| `payload.client_id` | UUID | Yes | Valid UUID, must belong to tenant | Client identifier |
| `payload.items` | Array | Yes | Min 1, Max 100 items | Order line items |
| `payload.items[].product_id` | UUID | Yes | Valid UUID, product must exist | Product identifier |
| `payload.items[].quantity` | number | Yes | Integer, 1-10,000 | Quantity ordered |
| `payload.items[].unit_price` | number | Yes | Positive, max 1,000,000,000 | Price per unit (COP) |
| `payload.delivery_address` | string | Yes | Min 10, Max 500 chars | Delivery address |
| `payload.notes` | string | No | Max 1,000 chars | Additional notes |

#### Success Response (201 Created)

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "tenant_id": "tenant-uuid",
  "client_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "total_amount": 250000,
  "delivery_address": "Calle 123 #45-67, Bogotá, Colombia",
  "notes": "Entregar en horario de oficina",
  "created_at": "2026-02-13T10:30:00Z",
  "created_by": "user-uuid"
}
```

#### Error Responses

**400 Bad Request - Validation Error**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "items.0.quantity",
      "message": "Expected number, received string"
    },
    {
      "field": "delivery_address",
      "message": "String must contain at least 10 character(s)"
    }
  ]
}
```

**401 Unauthorized**
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authorization token"
}
```

**403 Forbidden**
```json
{
  "error": "Forbidden",
  "message": "Client does not belong to your tenant"
}
```

**429 Too Many Requests**
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 3600 seconds.",
  "retryAfter": 3600
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

### 2. Send Email

**Endpoint**: `POST /send-email`
**Rate Limit**: 100 requests/hour per tenant

#### Request

```typescript
POST /send-email
Content-Type: application/json
Authorization: Bearer <token>

{
  "to": "customer@example.com",
  "subject": "Confirmación de Pedido #12345",
  "body": "Su pedido ha sido confirmado...",
  "template": "order_confirmation", // optional
  "variables": { // optional, used with template
    "order_id": "12345",
    "total": "250000"
  }
}
```

#### Input Schema

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `to` | string | Yes | Valid email, max 254 chars | Recipient email |
| `subject` | string | Yes | Min 1, Max 200 chars | Email subject |
| `body` | string | Conditional | Max 10,000 chars | Email body (if no template) |
| `template` | string | No | One of: `order_confirmation`, `alert_notification`, `password_reset` | Template ID |
| `variables` | object | No | Max 20 key-value pairs | Template variables |

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "msg_abc123xyz",
  "recipient": "customer@example.com"
}
```

#### Error Responses

**400 Bad Request - Invalid Email**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "to",
      "message": "Invalid email"
    }
  ]
}
```

**429 Too Many Requests**
```json
{
  "error": "Too Many Requests",
  "message": "Email rate limit exceeded (100/hour)",
  "retryAfter": 2400
}
```

**503 Service Unavailable**
```json
{
  "error": "Service Unavailable",
  "message": "Email service is temporarily unavailable"
}
```

---

### 3. Upload File (Storage)

**Endpoint**: `POST /upload`
**Rate Limit**: 50 requests/hour per tenant
**Max File Size**: 10 MB

#### Request

```typescript
POST /upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

FormData:
  file: <binary-file>
  bucket: "vehicle-photos" // or "documents", "cold-chain-reports"
  path: "vehicles/abc-123/maintenance-2026-02.pdf" // optional
```

#### Input Schema

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `file` | File | Yes | Max 10 MB, allowed types: jpg, png, pdf, xlsx | File to upload |
| `bucket` | string | Yes | One of: `vehicle-photos`, `documents`, `cold-chain-reports` | Storage bucket |
| `path` | string | No | Max 500 chars, alphanumeric + `/`, `-`, `_`, `.` | Custom file path |

#### Success Response (201 Created)

```json
{
  "success": true,
  "path": "tenant-uuid/vehicles/abc-123/maintenance-2026-02.pdf",
  "url": "https://[project-ref].supabase.co/storage/v1/object/public/documents/tenant-uuid/vehicles/abc-123/maintenance-2026-02.pdf",
  "size": 2048576,
  "mimeType": "application/pdf"
}
```

#### Error Responses

**400 Bad Request - Invalid File Type**
```json
{
  "error": "Invalid file type",
  "message": "Only jpg, png, pdf, xlsx files are allowed",
  "allowedTypes": ["image/jpeg", "image/png", "application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
}
```

**413 Payload Too Large**
```json
{
  "error": "File too large",
  "message": "File size exceeds 10 MB limit",
  "maxSize": 10485760
}
```

---

## Database Functions (via PostgREST)

### 4. Query Vehicles with Pagination

**Endpoint**: `GET /rest/v1/vehicles`
**Method**: Supabase client SDK

#### Request

```typescript
const { data, error, count } = await supabase
  .from('vehicles')
  .select('*', { count: 'exact' })
  .eq('tenant_id', tenantId) // Auto-filtered by RLS
  .range(0, 19) // Page 1: rows 0-19
  .order('created_at', { ascending: false });
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `range` | `(from, to)` | Pagination range (0-indexed) |
| `order` | `(column, direction)` | Sort order |
| `eq` | `(column, value)` | Equality filter |
| `gt`, `lt`, `gte`, `lte` | `(column, value)` | Comparison filters |
| `ilike` | `(column, pattern)` | Case-insensitive LIKE |

#### Success Response (200 OK)

```json
[
  {
    "id": "vehicle-uuid-1",
    "tenant_id": "tenant-uuid",
    "license_plate": "ABC-123",
    "model": "Chevrolet NHR",
    "year": 2023,
    "status": "active",
    "created_at": "2026-01-15T08:00:00Z"
  },
  {
    "id": "vehicle-uuid-2",
    "license_plate": "DEF-456",
    "model": "Chevrolet NQR",
    "year": 2024,
    "status": "maintenance",
    "created_at": "2026-01-10T09:30:00Z"
  }
]
```

**Headers**:
```
Content-Range: 0-19/142  // Range and total count
```

#### Error Responses

**401 Unauthorized**
```json
{
  "code": "PGRST301",
  "details": null,
  "hint": null,
  "message": "JWT expired"
}
```

**403 Forbidden (RLS Violation)**
```json
{
  "code": "42501",
  "details": "Policy violation",
  "hint": "Row-level security prevents access",
  "message": "new row violates row-level security policy"
}
```

---

### 5. Realtime Subscription (WebSocket)

**Endpoint**: WebSocket connection via Supabase client

#### Request

```typescript
const channel = supabase
  .channel('telemetry:vehicle-uuid')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'telemetry_events',
    filter: 'vehicle_id=eq.vehicle-uuid'
  }, (payload) => {
    console.log('New telemetry:', payload.new);
  })
  .subscribe();
```

#### Subscription Options

| Option | Type | Description |
|--------|------|-------------|
| `event` | `'INSERT' \| 'UPDATE' \| 'DELETE' \| '*'` | Event type to listen for |
| `schema` | `'public'` | Database schema |
| `table` | string | Table name |
| `filter` | string | PostgREST filter syntax |

#### Payload Format (INSERT event)

```json
{
  "schema": "public",
  "table": "telemetry_events",
  "commit_timestamp": "2026-02-13T10:35:42Z",
  "eventType": "INSERT",
  "new": {
    "id": "telemetry-uuid",
    "vehicle_id": "vehicle-uuid",
    "ts": "2026-02-13T10:35:40Z",
    "latitude": 4.6097,
    "longitude": -74.0817,
    "speed": 45,
    "temperature": 2.5
  },
  "old": {},
  "errors": null
}
```

#### Error Handling

```typescript
channel.on('error', (error) => {
  console.error('Realtime error:', error);
  // Implement exponential backoff reconnection
});

channel.on('system', (message) => {
  if (message.status === 'channel_error') {
    // Handle channel errors
  }
});
```

---

## Rate Limiting

All endpoints are rate-limited. Headers included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1707825600
```

### Rate Limit Tiers

| Endpoint | Free Tier | Paid Tier |
|----------|-----------|-----------|
| `/api-gateway` | 100/hour | 1,000/hour |
| `/send-email` | 100/hour | 500/hour |
| `/upload` | 50/hour | 200/hour |
| Database queries | 1,000/day | 10,000/day |

---

## Error Codes Reference

| HTTP Code | Meaning | Common Causes |
|-----------|---------|---------------|
| 400 | Bad Request | Validation error, malformed JSON |
| 401 | Unauthorized | Missing/expired/invalid JWT |
| 403 | Forbidden | RLS policy violation, insufficient permissions |
| 404 | Not Found | Resource doesn't exist or not accessible |
| 409 | Conflict | Unique constraint violation, optimistic locking |
| 413 | Payload Too Large | File size exceeds limit |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Database/external service down |

---

## Security Best Practices

### 1. Never Include Sensitive Data in URLs

❌ **Bad**:
```typescript
GET /api/users?api_key=secret123&password=mypassword
```

✅ **Good**:
```typescript
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json
{ "email": "user@example.com" }
```

### 2. Validate All Inputs Client-Side Too

```typescript
// Client-side validation (UX)
const schema = z.object({
  email: z.string().email(),
  quantity: z.number().int().positive().max(10000),
});

try {
  const validated = schema.parse(formData);
  await createOrder(validated);
} catch (error) {
  // Show validation errors to user
}
```

### 3. Handle Errors Gracefully

```typescript
try {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData);

  if (error) {
    if (error.code === '23505') {
      toast.error('El pedido ya existe');
    } else if (error.code === '42501') {
      toast.error('No tienes permiso para crear pedidos');
    } else {
      toast.error('Error al crear pedido');
      console.error(error);
    }
  }
} catch (error) {
  toast.error('Error de red. Verifica tu conexión.');
}
```

### 4. Use Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: (order) => createOrder(order),
  onMutate: async (newOrder) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['orders'] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(['orders']);

    // Optimistically update to new value
    queryClient.setQueryData(['orders'], (old) => [newOrder, ...old]);

    return { previous };
  },
  onError: (err, newOrder, context) => {
    // Rollback on error
    queryClient.setQueryData(['orders'], context.previous);
  },
  onSettled: () => {
    // Refetch after error or success
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  },
});
```

---

## Monitoring and Debugging

### Enable Debug Mode

```typescript
// Client-side
const supabase = createClient(url, key, {
  global: {
    headers: {
      'X-Debug': 'true'
    }
  }
});
```

### Check API Logs

```bash
# Supabase Dashboard → Logs → Edge Functions
# Filter by function name and time range
```

### Performance Monitoring

```typescript
// Track API latency
const start = performance.now();
const { data, error } = await supabase.from('orders').select();
const latency = performance.now() - start;

console.log(`Query took ${latency}ms`);
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-13 | Initial API documentation |
| 0.9.0 | 2026-02-10 | Added rate limiting |
| 0.8.0 | 2026-02-05 | Added Realtime subscriptions |

---

**Support**: For API issues, contact devops@cellvi.com or create a GitHub issue.
**Status Page**: https://status.supabase.com
