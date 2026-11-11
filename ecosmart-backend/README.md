# EcoSmart · Backend

Node.js 22+ · Express 5 · PostgreSQL (Supabase). Recibe las lecturas de llenado de los contenedores, aplica la regla de alerta y avisa en vivo a la app.

## Puesta en marcha

```bash
npm install
cp .env.example .env        # completa DATABASE_URL e INGEST_API_KEY
```

1. **Migración (una vez):** en Supabase → *SQL Editor*, pega y ejecuta `sql/01_migracion_lecturas.sql`. Es seguro correrla más de una vez. Qué hace:
   - `alerta_llenado.id_alerta` pasa a autogenerado (si todavía no lo era), sin chocar con ids existentes.
   - Agrega `porcentaje_disparo` y `fecha_resolucion` a `alerta_llenado`.
   - **Limpia los duplicados** que generaba el código anterior (una alerta `pendiente` por *cada* lectura ≥ 80 %): deja la más antigua por contenedor y marca las demás como `duplicada`. No borra nada.
   - Crea el índice único que impide más de una alerta `pendiente` por contenedor.
2. **Usuarios (una vez):** pega y ejecuta también `sql/02_migracion_usuarios.sql` (id autogenerado en `usuario` e índice único sobre `id_auth`).
   **Reportes ciudadanos (una vez):** ejecuta `sql/03_migracion_reportes.sql` (id autogenerado en `reporte_anomalia`, columnas `tipo_anomalia` y `fecha_revision`).
3. En `.env` define `FIREBASE_PROJECT_ID` (el Project ID de tu proyecto Firebase).
4. `npm run dev` (o `npm start`) → http://localhost:5000

## Panel de administración (en la app móvil)

Ya no hay panel web: la administración está en `ecosmart-mobile-rn`. Al iniciar sesión con una cuenta de administrador, la app muestra Contenedores, Alertas, Reportes ciudadanos, Órdenes de trabajo e Indicadores, y se actualiza sola cada 15 s.

**Quién es administrador:** las cuentas de Firebase cuyo UID está en `ADMIN_UIDS` (en el `.env`, separados por coma). `GET /api/usuarios/me` devuelve `es_admin: true` para ellas, aunque no tengan perfil de ciudadano. El UID se copia desde Firebase → Authentication → Usuarios.

```env
ADMIN_UIDS=AbCdEf123...,OtroUid456...
```

Las órdenes de trabajo aún no tienen tabla en la base: se guardan en el teléfono del administrador.

## Enviar una lectura (ESP32 / gateway / simulación)

```
POST /api/lecturas
Authorization: Bearer <INGEST_API_KEY>
Content-Type: application/json

{ "id_contenedor": 3, "porcentaje_llenado": 82.5, "fecha_lectura": "2026-10-21T14:05:00Z" }
```

`fecha_lectura` es opcional (ISO 8601); si falta se usa la hora del servidor. Los números van como número JSON, no como texto.

| Código | Significado |
|---|---|
| 201 | Lectura guardada. Responde `alerta_creada`, `alerta_resuelta` y el contenedor actualizado |
| 200 | `recibida: false`: llegó una lectura más antigua que la ya guardada (se ignora) |
| 400 | JSON mal formado |
| 401 | Credencial ausente, inválida o expirada |
| 403 | Token de Firebase válido pero sin permiso para enviar lecturas |
| 404 | El contenedor no existe |
| 422 | Validación: porcentaje fuera de 0–100, tipos incorrectos, campos extra, fecha futura |
| 429 | Demasiadas solicitudes (`RATE_LIMIT_POR_MINUTO`, 600 por IP) |

La ruta antigua `PUT /api/contenedores/:id/nivel` (body `{ "porcentaje_llenado": 82 }`) sigue funcionando y usa **la misma lógica**, pero ahora también exige credencial.

Otras rutas (lectura, públicas): `GET /api/contenedores`, `GET /api/alertas?estado=pendiente|resuelta|duplicada`, `GET /api/alertas/pendientes`, `GET /api/config`, y `GET /api/stream` (Server-Sent Events).

## Registro de usuarios (Firebase)

La app crea la cuenta en Firebase y luego llama al backend con el ID token (`Authorization: Bearer <token>`):

- `POST /api/usuarios/registro` con `{ "rut": "12345678-5", "nombre_completo": "Ana Pérez", "recibe_notificaciones": true }` → 201 (creado) / 200 (ya existía) / 409 RUT en uso / 422 datos inválidos / 401 token inválido.
- `GET /api/usuarios/me` → perfil del usuario autenticado (404 si aún no se registró).
- `POST /api/reportes` con `{ "id_contenedor": 102, "tipo_anomalia": "danado" | "residuos_incorrectos" | "otro", "descripcion": "opcional, máx. 500" }` → 201 / 404 (`perfil_no_encontrado` o `contenedor_no_existe`) / 422 / 401. Se avisa en vivo por `/api/stream` (`event: reporte`).

El administrador lee `GET /api/reportes?estado=pendiente|en_revision|resuelto|descartado` (sin nombre, RUT ni correo de quien reporta) y cambia el estado con `PATCH /api/reportes/:id` `{ "estado_revision": "resuelto" }`. El `PATCH` exige token de Firebase de una cuenta en `ADMIN_UIDS` → 401 sin token, 403 si no es administrador.

El UID (`id_auth`) y el correo salen del token verificado, nunca del cuerpo; el saldo de EcoPoints parte en 0.

## Regla de alerta

- `porcentaje >= UMBRAL_ALERTA` (80) → se crea una alerta `pendiente` **solo si el contenedor no tiene ya una**. La garantía está en la base de datos (índice único parcial), así que dos lecturas simultáneas tampoco duplican.
- `porcentaje < UMBRAL_ALERTA` → la alerta pendiente pasa a `resuelta`. Si luego vuelve a subir, nace una nueva.
- `estado_operativo` conserva la regla anterior: `critico` (≥ umbral), `atencion` (≥ 50), `disponible`.
- **Sin reporte:** un contenedor sin lectura hace más de `SIN_REPORTE_HORAS` (6), o que nunca reportó, se marca `sin_reporte: true`.
- Los `TIMESTAMP` se guardan y se leen en **UTC**.

## Quién puede enviar lecturas

1. **API key** (`INGEST_API_KEY`) en `Authorization: Bearer ...` → pensada para el ESP32 / gateway.
2. **Token de Firebase** (opcional, si defines `FIREBASE_PROJECT_ID`): se verifica firma, proyecto y expiración. Un token válido **no basta**: todos los ciudadanos de la app tienen uno y podrían falsear niveles de llenado. Solo se acepta si trae el claim personalizado `ingest: true` (asígnalo con el Admin SDK a una cuenta de servicio) o si su UID está en `FIREBASE_INGEST_UIDS`.

## Pruebas

Requieren un PostgreSQL **local** con una base vacía llamada `ecosmart_test` (ajusta usuario/clave en `.env.test`):

```bash
createdb ecosmart_test
npm test
```

`npm test` primero reconstruye esa base (esquema base + migración + datos de ejemplo). **Borra todo el esquema `public`**, por eso se niega a correr si `DATABASE_URL` no es de `localhost` y no tiene "test" en el nombre: no puede tocar Supabase por accidente.

## Pendientes de seguridad (fuera de esta entrega)

- `POST /api/usuarios/deposito` no tiene autenticación y toma `ecopoints_otorgados` del cliente: cualquiera puede abonar puntos a cualquier usuario.
- Las rutas `GET` (contenedores, alertas, reportes) siguen siendo públicas, aunque los reportes no incluyen datos personales.
