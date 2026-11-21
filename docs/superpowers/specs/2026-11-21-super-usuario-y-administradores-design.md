# Súper usuario y administradores en Supabase

## Por qué
Hoy un administrador existe solo si su UID de Firebase está en la variable `ADMIN_UIDS` de Render:
agregar o quitar uno exige editar el servidor y redesplegar, y en la base de datos no queda rastro.
Se quiere un **súper usuario** que agregue y desactive administradores desde la app, y que cada
administrador quede registrado en Supabase con su rol y sus datos.

## Objetivos
- Súper usuario definido por UID en `SUPER_UIDS` (variable de entorno, como hoy `ADMIN_UIDS`). Es también admin.
- Tabla `administrador` en Supabase con los administradores y sus datos.
- Desde la app, el súper usuario crea un admin con **nombre completo, correo, teléfono y RUT (opcional)**.
- Al crearlo, el backend crea una cuenta **nueva** de Firebase y:
  - **por defecto** Firebase le envía al nuevo admin el correo "crea tu contraseña" (mismo correo de restablecimiento que ya usa la app);
  - **como respaldo**, el súper usuario puede pedir una **contraseña temporal**: se le muestra una sola vez y el admin debe cambiarla en su primer inicio de sesión.
- El súper usuario ve la lista, puede **desactivar/reactivar** y **reenviar el correo**.

## No objetivos
- Que una misma cuenta use la vista de ciudadano y la de admin (sigue siendo una u otra).
- Convertir en admin una cuenta que ya existe (ciudadano u otra): se rechaza.
- Crear perfil de ciudadano (`usuario`) para los admins.
- Borrar cuentas de Firebase. Desactivar solo quita el rol.
- Gestionar súper usuarios desde la app (solo por variable de entorno).

## Anti-objetivos
- Que alguien que no es súper usuario pueda crear, ver o cambiar administradores.
- Que la contraseña temporal quede guardada en algún lado (base, logs) o se pueda volver a ver.
- Que un ciudadano pierda su cuenta o sus EcoPuntos porque alguien lo nombró admin.
- Dejar sin acceso a los admins actuales al desplegar.

## Restricciones
- El backend no tiene Firebase Admin SDK. Puede **crear cuentas** con la API REST de Firebase Auth
  (`accounts:signUp`) y **enviar el correo de restablecimiento** (`accounts:sendOobCode`, PASSWORD_RESET),
  ambos con `FIREBASE_WEB_API_KEY`, que ya usa "Recuperar contraseña". No puede buscar usuarios por correo.
- Los ciudadanos no tienen correo verificado (la app no lo pide).
- Expo 58, backend Express 5 + `pg`, tests con `node --test` y la BD local `ecosmart_test`.

## Enfoques considerados
- **Por correo, con cuenta nueva creada por el backend (elegido):** enlace por defecto, contraseña temporal de respaldo; si el correo ya tiene cuenta, se rechaza con aviso.
- Por correo con vinculación "pendiente" de cuentas existentes: descartado; los ciudadanos no verifican su correo, haría falta un paso de verificación y el ciudadano perdería su vista y sus EcoPuntos.
- Por UID copiado desde Firebase: obliga a entrar a la consola de Firebase cada vez.
- Elegir de la lista de ciudadanos: solo sirve para quien ya tiene cuenta con RUT y la convierte en admin.

## Diseño

### Base de datos (`sql/07_administradores.sql`, idempotente; se aplica también en Supabase)
Tabla `administrador`:
| Columna | Tipo | Notas |
| --- | --- | --- |
| `id_admin` | integer identity, PK | |
| `id_auth` | varchar, único, not null | UID de Firebase de la cuenta creada |
| `correo` | varchar, único (en minúsculas) | |
| `nombre_completo` | varchar(100) | |
| `telefono` | varchar(20) | se guarda como `+569XXXXXXXX` |
| `rut` | varchar, null | opcional, validado con dígito verificador, formato `12345678-K`; no es único contra `usuario` |
| `activo` | boolean, default true | |
| `debe_cambiar_clave` | boolean, default false | true solo si se creó con contraseña temporal |
| `creado_por` | varchar | UID del súper usuario |
| `fecha_creacion` | timestamp (UTC) | |
| `fecha_actualizacion` | timestamp (UTC) | |

RLS activado sin políticas (igual que el resto).

### Quién es qué (backend)
- `esSuper(uid)` = uid en `SUPER_UIDS`.
- `rolDe(uid)` (asíncrona, consulta la BD) devuelve `{ esAdmin, esSuper, debeCambiarClave, desactivado }`:
  admin = súper **o** uid en `ADMIN_UIDS` (se mantiene para no dejar fuera a los actuales) **o** fila en `administrador` con `activo = true`.
- `requireAdmin`: 403 `solo_administradores` si no es admin; 403 `debe_cambiar_clave` si tiene el flag (el servidor también bloquea, no solo la app).
- `requireSuper`: 403 `solo_super_usuario`.
- **Decisión:** `POST /api/usuarios/me/clave-cambiada` confía en el aviso de la app (no se puede comprobar el cambio sin Admin SDK). El riesgo es bajo: solo el súper usuario vio la temporal.

### API
- `GET /api/usuarios/me`:
  - agrega `es_super` y `debe_cambiar_clave`;
  - un admin sin perfil de ciudadano recibe su `nombre_completo`, `telefono` y `rut` desde `administrador`;
  - **un admin desactivado** (fila con `activo = false`, sin perfil de ciudadano) recibe 403 `admin_desactivado`; la app muestra "Tu acceso de administrador fue desactivado" y el botón Cerrar sesión.
- `POST /api/usuarios/me/clave-cambiada` (admin con `debe_cambiar_clave`) → pone el flag en false.
- Solo súper usuario (`requireFirebaseUser` + `requireSuper`, con límite de solicitudes):
  - `GET /api/administradores` → filas de la tabla (sin contraseñas) + los UID de `ADMIN_UIDS` y `SUPER_UIDS` marcados como "definidos en el servidor" (solo lectura).
  - `POST /api/administradores` `{ nombre_completo, correo, telefono, rut?, modo: 'enlace' | 'temporal' }`:
    1. Valida (zod, estricto). Correo ya en `administrador` → 409 `admin_existe` (si está desactivado, el mensaje sugiere reactivarlo).
    2. `accounts:signUp` con una contraseña aleatoria que cumple las 5 reglas de la app (`modo: 'temporal'`: esa es la temporal).
       - `EMAIL_EXISTS` → 409 `correo_con_cuenta`: "Ese correo ya tiene una cuenta en EcoSmart; usa otro correo para el administrador." No se crea nada.
       - Otro error de Firebase → 502, no se crea nada.
    3. Inserta la fila con el UID devuelto.
    4. `modo: 'enlace'` → `sendOobCode` PASSWORD_RESET. `modo: 'temporal'` → responde `clave_temporal` **una sola vez** y guarda `debe_cambiar_clave = true`.
  - `PATCH /api/administradores/:id` `{ activo }` → desactivar/reactivar (efecto inmediato).
  - `POST /api/administradores/:id/reenviar` → vuelve a enviar "crea tu contraseña"; solo para filas activas; pone `debe_cambiar_clave = false` (al usar el enlace define su propia contraseña).

### App
- **Mi perfil del súper usuario:** fila "Administradores" → `AdministradoresScreen`:
  formulario (nombre, correo, teléfono, RUT opcional, casilla "Darle contraseña temporal") y lista con estado
  (Activo / Desactivado / Definido en el servidor) y acciones (Desactivar/Reactivar, Reenviar correo).
- Tras crear con contraseña temporal: la muestra en un recuadro con botón Copiar y el aviso "no se volverá a mostrar".
- **Cambio obligatorio:** si `/me` trae `debe_cambiar_clave`, la app muestra solo la pantalla "Crea tu contraseña"
  (actual + nueva + repetir, reglas `claveValida`); al guardar llama a `clave-cambiada` y entra al panel.
- **Admin desactivado:** pantalla con el aviso y Cerrar sesión.

### Migración de los admins actuales
Los UID de `ADMIN_UIDS` siguen funcionando. Para pasarlos a la tabla, el súper usuario los crea desde la app
con un correo nuevo, o se les deja en `ADMIN_UIDS` hasta que dejen de usarse. No se siembran filas (no se conoce su correo ni su nombre).

## Lo que queda al implementador
- Nombres de funciones y archivos; dónde vive la llamada a Firebase REST (un `services/firebaseAuth.js`).
- Generador de contraseña aleatoria (crypto) que cumpla las 5 reglas.
- Límite de solicitudes, formato del teléfono al escribirlo, mensajes en español.

## Cómo se prueba
- Backend (`node --test`, BD local, `fetch` a Firebase simulado): 401/403 para no súper; creación con enlace y con temporal; `EMAIL_EXISTS` → 409 sin fila; error de Firebase → 502 sin fila; la temporal no aparece en el GET; `debe_cambiar_clave` bloquea `requireAdmin` hasta `clave-cambiada`; desactivar quita el acceso al instante y `/me` responde `admin_desactivado`; reenviar limpia el flag.
- App: `npm test` para lógica pura y `expo export` compila; recorrido manual con la cuenta del súper usuario en la vista previa.
