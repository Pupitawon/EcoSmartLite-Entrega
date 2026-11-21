# Súper usuario y administradores — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un súper usuario (por `SUPER_UIDS`) crea, desactiva y reenvía el acceso a administradores guardados en la tabla `administrador` de Supabase.

**Architecture:** Backend Express: tabla nueva, un servicio de roles asíncrono que reemplaza a `esAdmin` síncrono, un servicio que habla con la API REST de Firebase Auth y rutas `/api/administradores`. App Expo: servicio, pantalla de administradores para el súper usuario, pantalla de cambio obligatorio y pantalla de admin desactivado.

**Tech Stack:** Node 24, Express 5, pg, zod, jose, `node:test`; Expo 58 / React Native.

**Spec:** `docs/superpowers/specs/2026-11-21-super-usuario-y-administradores-design.md`

## Global Constraints
- Súper usuarios: `SUPER_UIDS` (UIDs separados por coma). `ADMIN_UIDS` sigue funcionando.
- Datos del admin: nombre completo (2–100), correo (minúsculas, único), teléfono (`+569XXXXXXXX`), RUT opcional (`12345678-K`, dígito verificador).
- Correo con cuenta en Firebase (`EMAIL_EXISTS`) → 409 `correo_con_cuenta`, mensaje: "Ese correo ya tiene una cuenta en EcoSmart; usa otro correo para el administrador." Sin fila.
- La contraseña temporal se devuelve una sola vez (`clave_temporal`) y nunca se guarda ni se registra en logs.
- Errores: `solo_administradores`, `debe_cambiar_clave`, `solo_super_usuario`, `admin_desactivado`, `admin_existe`, `correo_con_cuenta` (403/403/403/403/409/409); error de Firebase → 502 `firebase_error`.
- Textos en español de Chile. Sin cambios en la vista del ciudadano.

## Review Focus
1. Contraseña temporal filtrada: no debe aparecer en `GET /api/administradores`, en la fila de la BD ni en `console.*`. → test en Task 5.
2. Firebase crea la cuenta pero el `INSERT` falla (por ejemplo, carrera con el mismo correo): no debe quedar 500 silencioso; responde 409 `admin_existe`. → test en Task 5.
3. Súper usuario que también está en `ADMIN_UIDS` o en la tabla: nunca queda bloqueado por `debe_cambiar_clave` ni por `activo = false`. → test en Task 3.
4. Un admin desactivado con perfil de ciudadano sigue entrando como ciudadano (no ve `admin_desactivado`). → test en Task 4.
5. Teléfono escrito como `9 1234 5678`, `+56912345678` o `912345678` se normaliza igual; `12345` se rechaza. → test en Task 2.

---

### Task 1: Migración `administrador`

**Files:**
- Create: `ecosmart-backend/sql/07_administradores.sql`
- Modify: `ecosmart-backend/scripts/setupTestDb.js` (agregar el archivo después de `05_ordenes_trabajo.sql`), `ecosmart-backend/sql/04_seguridad_rls.sql` (agregar `'administrador'` a la lista), `ecosmart-backend/README.md` (orden de migraciones + `SUPER_UIDS`), `ecosmart-backend/.env.example` y `.env.test.example` (`SUPER_UIDS=`)

**Interfaces:**
- Produces: tabla `administrador` con las columnas del spec; `correo` con `CHECK (correo = lower(correo))`; `id_auth` y `correo` únicos; RLS activado.

- [ ] **Step 1:** Escribir el SQL idempotente (`CREATE TABLE IF NOT EXISTS`, índices `IF NOT EXISTS`).
- [ ] **Step 2:** Run `node --env-file=.env.test scripts/setupTestDb.js`. Expected: "BD de pruebas lista".
- [ ] **Step 3:** Commit `feat(sql): tabla administrador`.

### Task 2: Servicio de Firebase Auth, contraseña aleatoria y validación

**Files:**
- Create: `ecosmart-backend/src/services/firebaseAuth.js`, `ecosmart-backend/src/services/adminValidacion.js`
- Modify: `ecosmart-backend/src/config/config.js` (`superUids`, `firebaseAuthUrl` = `process.env.FIREBASE_AUTH_URL || 'https://identitytoolkit.googleapis.com/v1'`), `src/controllers/usuarioController.js` (`recuperarClave` usa `enviarCorreoClave`)
- Test: `ecosmart-backend/test/adminValidacion.test.js` (sin BD)

**Interfaces:**
- Produces: `crearCuenta(correo, clave) -> Promise<{ uid }>`; lanza `Error` con `.codigo = 'EMAIL_EXISTS'` o `'FIREBASE'`. `enviarCorreoClave(correo) -> Promise<void>` (PASSWORD_RESET, lanza `.codigo = 'FIREBASE'`). `generarClave() -> string` (16 caracteres, crypto, cumple las 5 reglas de `ecosmart-mobile-rn/src/utils/clave.js`). `adminSchema` (zod estricto `{ nombre_completo, correo, telefono, rut?, modo }`), `normalizarTelefono(s) -> '+569XXXXXXXX' | null`.

- [ ] **Step 1: Tests (fallan)** en `test/adminValidacion.test.js`:
  - `generarClave cumple las reglas`: 50 veces → largo 16, y matchea `/[A-Z]/`, `/[a-z]/`, `/\d/`, `/[^A-Za-z0-9]/`.
  - `normalizarTelefono`: `'9 1234 5678'`, `'+56912345678'`, `'912345678'` → `'+56912345678'`; `'12345'` → `null`.
  - `adminSchema`: válido con `{nombre_completo:'Ana Pérez', correo:'ANA@Mail.cl', telefono:'912345678', modo:'enlace'}` → `correo === 'ana@mail.cl'`, `telefono === '+56912345678'`; `rut:'11.111.111-1'` → `'11111111-1'`; `rut:'11111111-2'` → falla; campo extra → falla; `modo:'otro'` → falla.
- [ ] **Step 2:** `node --env-file=.env.test --test test/adminValidacion.test.js`. Expected: FAIL (módulo no existe).
- [ ] **Step 3:** Implementar. El RUT reutiliza `rutValido`/`normalizarRut` de `usuarioController`.
- [ ] **Step 4:** Mismo comando. Expected: PASS.
- [ ] **Step 5:** Commit `feat(backend): servicio de Firebase Auth y validación de administradores`.

### Task 3: Roles asíncronos y middleware

**Files:**
- Create: `ecosmart-backend/src/services/rolService.js`
- Modify: `ecosmart-backend/src/middleware/adminAuth.js`, `src/routes/ordenRoutes.js`, `src/routes/reporteRoutes.js` (sin cambio de uso, solo que `requireAdmin` ahora es async)
- Test: `ecosmart-backend/test/roles.test.js`

**Interfaces:**
- Produces: `rolDe(uid) -> Promise<{ esAdmin, esSuper, debeCambiarClave, desactivado, admin }>` (`admin` = fila de `administrador` o null). `esSuper(uid) -> boolean`. Middlewares `requireAdmin` (403 `solo_administradores` / 403 `debe_cambiar_clave`; deja `req.rol`) y `requireSuper` (403 `solo_super_usuario`).
- Regla: súper usuario y `ADMIN_UIDS` → `esAdmin: true`, `debeCambiarClave: false`, `desactivado: false` aunque tengan fila.

- [ ] **Step 1: Tests (fallan)** con filas sembradas en `administrador`: activo → admin; `activo=false` → no admin y `desactivado: true`; `debe_cambiar_clave=true` → `GET /api/ordenes` 403 `debe_cambiar_clave`; UID en `SUPER_UIDS` con fila `activo=false, debe_cambiar_clave=true` → `GET /api/ordenes` 200; desconocido → 403 `solo_administradores`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar; `esAdmin` síncrono se elimina (Task 4 actualiza `usuarioController`).
- [ ] **Step 4:** `npm test`. Expected: PASS (incluye `reportes.test.js` y `ordenes.test.js`).
- [ ] **Step 5:** Commit `feat(backend): roles de administrador desde la base`.

### Task 4: `/me` y `clave-cambiada`

**Files:**
- Modify: `ecosmart-backend/src/controllers/usuarioController.js` (`miPerfil`, `actualizarPreferencias`, nuevo `claveCambiada`), `src/routes/usuarioRoutes.js` (`POST /me/clave-cambiada`)
- Test: `ecosmart-backend/test/usuarios.test.js`

**Interfaces:**
- Consumes: `rolDe` (Task 3).
- Produces: `/me` → `usuario` con `es_admin`, `es_super`, `debe_cambiar_clave`; admin sin `usuario` → `{ nombre_completo, correo, telefono, rut, es_admin:true, es_super, debe_cambiar_clave }`; desactivado sin `usuario` → 403 `admin_desactivado`. `POST /me/clave-cambiada` → 200 `{ ok:true }` (404 si no tiene fila).

- [ ] **Step 1: Tests (fallan):** admin de tabla sin perfil → nombre desde `administrador`; `debe_cambiar_clave` visible en `/me`; `clave-cambiada` lo pone en false y luego `/api/ordenes` → 200; desactivado sin perfil → 403 `admin_desactivado`; desactivado **con** perfil de ciudadano → 200 con `es_admin:false`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(backend): perfil del admin con rol y cambio de clave obligatorio`.

### Task 5: Rutas `/api/administradores`

**Files:**
- Create: `ecosmart-backend/src/controllers/administradorController.js`, `src/routes/administradorRoutes.js`
- Modify: `ecosmart-backend/index.js` (montar), `src/middleware/rateLimit.js` (`limiteAdministradores`: 30 por minuto)
- Test: `ecosmart-backend/test/administradores.test.js` (un servidor HTTP local en el puerto 4998 simula Firebase; `process.env.FIREBASE_AUTH_URL = 'http://localhost:4998'` antes de cargar la app)

**Interfaces:**
- Consumes: Tasks 2–3.
- Produces: `GET /` → `{ administradores: [{ id_admin, nombre_completo, correo, telefono, rut, activo, debe_cambiar_clave, fecha_creacion }], definidos_en_servidor: [{ uid, tipo: 'super' | 'admin' }] }`; `POST /` → 201 `{ administrador, clave_temporal? }`; `PATCH /:id` `{ activo: boolean }` → 200 `{ administrador }`; `POST /:id/reenviar` → 200 `{ ok:true }` (409 `admin_desactivado` si está inactivo).

- [ ] **Step 1: Tests (fallan):** no súper → 403 en las 4; sin token → 401; `modo:'enlace'` → 201, sin `clave_temporal`, el mock recibió `signUp` y `sendOobCode`; `modo:'temporal'` → 201 con `clave_temporal` de 16 caracteres, `debe_cambiar_clave:true`, y el `GET` no contiene ese texto; `EMAIL_EXISTS` → 409 `correo_con_cuenta` y no hay fila; mock 500 → 502 `firebase_error` y no hay fila; correo repetido en la tabla → 409 `admin_existe` sin llamar al mock; carrera (dos `POST` iguales a la vez) → uno 201 y otro 409; `PATCH activo:false` → ese admin recibe 403 en `/api/ordenes`; `reenviar` → 200 y `debe_cambiar_clave:false`; `definidos_en_servidor` lista `SUPER_UIDS` y `ADMIN_UIDS`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar. El `INSERT` atrapa `23505` → 409 `admin_existe`.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(backend): el súper usuario gestiona administradores`.

### Task 6: App — servicio y lógica pura

**Files:**
- Create: `ecosmart-mobile-rn/src/services/administradores.js`, `ecosmart-mobile-rn/src/admin/administradoresVista.js`
- Modify: `ecosmart-mobile-rn/src/services/auth.js` (`obtenerPerfil` devuelve `{ desactivado: true }` ante 403 `admin_desactivado`; nueva `marcarClaveCambiada()`)
- Test: `ecosmart-mobile-rn/test/administradores.test.mjs`

**Interfaces:**
- Produces: `listarAdministradores()`, `crearAdministrador(datos)`, `cambiarActivo(id, activo)`, `reenviarCorreo(id)` (lanzan `Error` con el mensaje en español según el código del spec). `estadoAdmin(a) -> { texto: 'Activo' | 'Desactivado' | 'Debe cambiar contraseña', color }` y `telefonoVisible('+56912345678') -> '+56 9 1234 5678'` en `administradoresVista.js` (sin React).

- [ ] **Step 1: Tests (fallan)** de `estadoAdmin` (3 casos) y `telefonoVisible`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(app): servicio de administradores`.

### Task 7: App — pantallas y navegación

**Files:**
- Create: `ecosmart-mobile-rn/src/screens/admin/AdministradoresScreen.js`, `ecosmart-mobile-rn/src/screens/admin/CambiarClaveObligatoriaScreen.js`, `ecosmart-mobile-rn/src/screens/admin/AdminDesactivadoScreen.js`
- Modify: `ecosmart-mobile-rn/src/screens/admin/PerfilAdminScreen.js` (fila "Administradores" si `perfil.es_super`, prop `onAdministradores`), `ecosmart-mobile-rn/App.js`

**Interfaces:**
- Consumes: Task 6. `cambiarClave(actual, nueva)` de `services/auth.js`; `claveValida`, `RequisitosClave`, `Campo` existentes.
- Pantallas: `AdministradoresScreen({ darkMode, onVolver })`; `CambiarClaveObligatoriaScreen({ darkMode, onListo, onSalir })`; `AdminDesactivadoScreen({ darkMode, onSalir })`.

- [ ] **Step 1:** Implementar `AdministradoresScreen` (formulario + casilla "Darle contraseña temporal" + lista con `estadoAdmin`, Desactivar/Reactivar, Reenviar correo; "Definidos en el servidor" sin acciones; tras crear con temporal, recuadro con la clave, botón Copiar y el texto "No se volverá a mostrar").
- [ ] **Step 2:** `CambiarClaveObligatoriaScreen`: actual + nueva + repetir; al guardar `cambiarClave` → `marcarClaveCambiada` → `onListo()`.
- [ ] **Step 3:** App.js: `perfil.desactivado` → `AdminDesactivadoScreen`; `perfil.es_admin && perfil.debe_cambiar_clave` → `CambiarClaveObligatoriaScreen` (al terminar, `debe_cambiar_clave:false` en el perfil); pantalla `'administradores'` dentro de `AdminDataProvider`, ← vuelve a `'perfil'`.
- [ ] **Step 4:** `npm test` y `npx expo export --platform web --output-dir <scratch>`. Expected: pass y "Exported".
- [ ] **Step 5:** Commit `feat(app): pantalla de administradores y cambio obligatorio de contraseña`.
