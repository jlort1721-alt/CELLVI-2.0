# 🔐 CREDENCIALES DE ACCESO - CELLVI 2.0

**Fecha**: 2026-02-13
**Proyecto**: CELLVI 2.0 - ASEGURAR LTDA

---

## 🌐 URLs de Acceso

### Ambiente Local
- **Landing Page**: http://localhost:8080
- **Plataforma (Dashboard)**: http://localhost:8080/platform
- **Demo Page**: http://localhost:8080/demo

### Supabase Dashboard
- **URL**: https://supabase.com/dashboard/project/jsefxnydbrioualiyzmq
- **Project ID**: jsefxnydbrioualiyzmq
- **Region**: West US (Oregon)

---

## 👤 Usuarios de Demo

### Opción 1: Crear Usuario Nuevo

**Método 1 - Desde la Aplicación**:
1. Ve a http://localhost:8080/platform
2. Haz clic en "Registrarse" o "Sign Up"
3. Completa el formulario con:
   - **Email**: tu-email@ejemplo.com
   - **Password**: (mínimo 6 caracteres)
4. Confirma el email (revisa inbox o spam)
5. Inicia sesión

**Método 2 - Desde Supabase Dashboard**:
1. Ve a https://supabase.com/dashboard/project/jsefxnydbrioualiyzmq
2. En el menú lateral, selecciona "Authentication" → "Users"
3. Click en "Add user" → "Create new user"
4. Ingresa:
   - **Email**: demo@asegurarltda.com
   - **Password**: Asegurar2024!
5. Confirma email automáticamente
6. El usuario estará listo para usar

---

## 🧪 Credenciales de Prueba Sugeridas

### Usuario Admin Demo
```
Email:    admin@asegurarltda.com
Password: Asegurar2024!
Rol:      Administrator
```

### Usuario Operador Demo
```
Email:    operador@asegurarltda.com
Password: Operador2024!
Rol:      Operator
```

### Usuario Cliente Demo
```
Email:    cliente@asegurarltda.com
Password: Cliente2024!
Rol:      Client
```

---

## 🔧 Crear Usuarios Vía SQL (Supabase Dashboard)

Si necesitas crear usuarios directamente en la base de datos:

1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta el siguiente script:

```sql
-- Crear usuario admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@asegurarltda.com',
  crypt('Asegurar2024!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Verificar usuario creado
SELECT email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'admin@asegurarltda.com';
```

---

## 🚨 Solución de Problemas

### Problema 1: No puedo acceder a /platform
**Solución**:
1. Verifica que el servidor esté corriendo: http://localhost:8080
2. Asegúrate de tener un usuario creado
3. Revisa la consola del navegador (F12) para ver errores
4. Verifica las variables de entorno (.env)

### Problema 2: Error "Invalid login credentials"
**Soluciones**:
- Verifica que el email esté confirmado en Supabase Dashboard
- Asegúrate de usar el password correcto (min 6 caracteres)
- Intenta resetear la contraseña desde el login
- Crea un nuevo usuario si es necesario

### Problema 3: Redirección infinita o página en blanco
**Soluciones**:
- Limpia el localStorage del navegador:
  ```javascript
  // En consola del navegador (F12)
  localStorage.clear();
  sessionStorage.clear();
  location.reload();
  ```
- Revisa que `.env` tenga las variables correctas
- Verifica que Supabase esté activo y accesible

---

## 🔑 Variables de Entorno Requeridas

Archivo `.env` debe contener:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://jsefxnydbrioualiyzmq.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzZWZ4bnlkYnJpb3VhbGl5em1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NTY4NDgsImV4cCI6MjA4NjUzMjg0OH0.aiAjLozas7QUm41Uxdz_N2DNMf71zCoFuf1WsAwnaow
```

---

## 🎯 Acceso Rápido (Sin Autenticación)

Si quieres ver la plataforma SIN crear usuario:

### Opción A: Ver Demo Page
```
http://localhost:8080/demo
```
Esta página muestra una demo del dashboard sin necesidad de login.

### Opción B: Modificar Código Temporalmente
En `src/pages/Platform.tsx`, comenta temporalmente la verificación de auth:

```typescript
// Comentar o desactivar el Auth Guard
// <AuthGuard>
  <Platform />
// </AuthGuard>
```

**NOTA**: Esto es solo para desarrollo. No uses esto en producción.

---

## 📊 Datos de Prueba

Una vez que inicies sesión, verás:

### Vehículos Demo (6)
- NAR-123 (Pasto) - Activo 72 km/h
- NAR-456 (Popayán) - Activo 85 km/h
- NAR-789 (La Unión) - Detenido
- PUT-321 (Mocoa) - Alerta 110 km/h
- CAU-654 (Cali) - Apagado
- NAR-987 (Ipiales) - Activo 60 km/h

### Alertas Demo (8)
- Exceso de velocidad
- Combustible bajo
- Salida de geocerca
- Batería baja
- Temperatura fuera de rango
- Mantenimiento preventivo
- Interferencia GNSS

### Conductores Demo (5)
- Carlos Martínez (15 años exp.)
- María López (18 años exp.)
- Andrés Guerrero (12 años exp.)
- Jorge Erazo (14 años exp.)
- Sandra Muñoz (10 años exp.)

---

## 🔒 Seguridad

### Recomendaciones:
- ✅ Usa passwords fuertes (min 12 caracteres)
- ✅ Habilita 2FA en Supabase Dashboard
- ✅ No compartas credenciales de admin
- ✅ Usa diferentes usuarios para diferentes roles
- ✅ Revisa logs de acceso regularmente

### Cambiar Password:
1. En Supabase Dashboard → Authentication → Users
2. Selecciona el usuario
3. Click en "..." → "Reset password"
4. Sigue las instrucciones del email

---

## 📞 Soporte

Si tienes problemas con el acceso:

1. **Verifica el servidor**: `npm run dev` debe estar corriendo
2. **Revisa Supabase**: Dashboard debe mostrar proyecto activo
3. **Limpia caché**: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)
4. **Revisa consola**: F12 → Console para ver errores

---

## ✅ Checklist de Acceso

- [ ] Servidor corriendo en http://localhost:8080
- [ ] Variables de entorno (.env) configuradas
- [ ] Usuario creado en Supabase
- [ ] Email confirmado (si aplica)
- [ ] Password correcto (min 6 caracteres)
- [ ] Navegador actualizado (Chrome, Firefox, Edge)
- [ ] JavaScript habilitado
- [ ] Conexión a internet activa

---

**¡Listo para usar CELLVI 2.0!** 🚀

Para cualquier duda, revisa la documentación en los archivos:
- `RESUMEN_FINAL_PROYECTO.md`
- `RESUMEN_MEJORAS_COMPLETO.md`
- `PLAN_MEJORAS_FRONTEND.md`
