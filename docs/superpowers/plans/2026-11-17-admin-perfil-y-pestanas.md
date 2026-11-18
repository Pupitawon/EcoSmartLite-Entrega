# Admin: Mi perfil, Configuración y pestañas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El admin abre la app en un Mapa de contenedores, tiene un "Mi perfil" con el estilo del ciudadano y llega a Configuración desde el engranaje.

**Architecture:** Solo app (`ecosmart-mobile-rn`, Expo SDK 58). Se reutilizan `MapaView` y la leyenda del mapa del ciudadano. La lista de Panel pasa a ser un componente que usa la pestaña Mapa en el modo "Lista". Los datos salen de `useAdminData()`, sin cambios en el backend. La lógica pura (pin y resumen) va en módulos sin React, probados con `node --test`.

**Tech Stack:** React Native 0.88 / Expo 58, react-native-maps (nativo), react-leaflet (web), lucide-react-native, Node 24 `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-17-admin-perfil-y-pestanas-design.md`

## Global Constraints
- Pestañas del admin, en este orden: Mapa · Alertas · Reportes · Órdenes · Datos. Mapa es la de inicio.
- Mismos colores de pin que el ciudadano (`STATUS_META` / `getPinStatus` de `src/tema.js`).
- Sin cambios en el backend ni en la vista del ciudadano (solo refactors sin cambio visible).
- El admin no pierde nada: lista, búsqueda, filtros, 4 indicadores e historial de alertas siguen existiendo.
- Textos en español de Chile, igual que el resto de la app.

## Review Focus
1. Contenedor sin `latitud`/`longitud`: no debe aparecer en el mapa ni romperlo, pero sí en la Lista. → test en Task 1.
2. Cero contenedores o backend caído en el modo Mapa: se muestra `EstadoCarga`/vacío, no un mapa en blanco sin explicación. → Task 4, paso de verificación.
3. Contadores del perfil: los reportes "pendientes" son solo `estado_revision === 'pendiente'` (no `en_revision`), y las órdenes abiertas son todas menos `Cerrada`. → test en Task 1.
4. Volver: Configuración ← vuelve a Mi perfil, y Mi perfil ← vuelve a la pestaña de origen, aunque esa fuera Datos. → Task 6, verificación.
5. Leyenda y pines legibles en modo claro y oscuro. → Task 4, verificación.

---

### Task 1: Lógica pura (pin y resumen del admin) con tests

**Files:**
- Create: `ecosmart-mobile-rn/src/utils/pines.js`
- Modify: `ecosmart-mobile-rn/src/screens/MapaScreen.js:12-36` (borrar el `aPin` local y usar `pinesDe`)
- Modify: `ecosmart-mobile-rn/src/admin/utils.js` (agregar `resumenAdmin`)
- Modify: `ecosmart-mobile-rn/package.json` (script `"test": "node --test test/"`)
- Test: `ecosmart-mobile-rn/test/admin.test.mjs`

**Interfaces:**
- Produces: `aPin(c) -> Pin` (mismo objeto que hoy en MapaScreen: `id_contenedor, name, category, lat, lng, fill, address, sinReporte, ultimaLectura`); `pinesDe(contenedores) -> Pin[]` (descarta los sin lat/lng); `resumenAdmin({ alertas, reportes, ordenes }) -> { alertasPendientes, reportesPendientes, ordenesAbiertas }`.
- `pines.js` y `utils.js` no importan React ni React Native (deben cargar en Node).

- [ ] **Step 1: Write the failing tests** en `test/admin.test.mjs`:
  - `pinesDe descarta contenedores sin coordenadas`: con `[{id_contenedor:1, latitud:-22.4, longitud:-68.9, porcentaje_llenado:81.6, sin_reporte:false}, {id_contenedor:2, latitud:null, longitud:-68.9, porcentaje_llenado:10}]` → largo 1, `[0].fill === 82`, `[0].name === 'Contenedor #1'`.
  - `resumenAdmin cuenta solo lo pendiente`: alertas `[{estado_alerta:'pendiente'},{estado_alerta:'resuelta'}]`, reportes `[{estado_revision:'pendiente'},{estado_revision:'en_revision'},{estado_revision:'resuelto'}]`, ordenes `[{estado:'Pendiente'},{estado:'En terreno'},{estado:'Cerrada'}]` → `{alertasPendientes:1, reportesPendientes:1, ordenesAbiertas:2}`.
  - `resumenAdmin con listas vacías o undefined` → los tres en 0.
- [ ] **Step 2:** Run `npm test` en `ecosmart-mobile-rn`. Expected: FAIL (módulo `src/utils/pines.js` no existe).
- [ ] **Step 3:** Implementar `pines.js` (mover el `aPin` de MapaScreen tal cual) y `resumenAdmin` en `admin/utils.js`; MapaScreen usa `pinesDe(contenedores)` dentro de su `useMemo`.
- [ ] **Step 4:** Run `npm test`. Expected: 3 pass.
- [ ] **Step 5:** Commit `feat(app): pines y resumen del admin como funciones probadas`.

### Task 2: Leyenda del mapa como componente

**Files:**
- Create: `ecosmart-mobile-rn/src/components/LeyendaMapa.js`
- Modify: `ecosmart-mobile-rn/src/screens/MapaScreen.js:97-108` y los estilos `leyenda`, `leyendaFila`, `punto`

**Interfaces:**
- Produces: `<LeyendaMapa darkMode={bool} />`, posicionada absoluta abajo a la izquierda (mismos estilos que hoy).

- [ ] **Step 1:** Mover el bloque de la leyenda y sus 3 estilos a `LeyendaMapa`; MapaScreen la muestra en el mismo lugar y con la misma condición (`!seleccionado`).
- [ ] **Step 2:** Run `npx expo export --platform web --output-dir <scratch>`. Expected: "Exported" sin errores.
- [ ] **Step 3:** Commit `refactor(app): leyenda del mapa reutilizable`.

### Task 3: Lista de contenedores separada y los 4 indicadores en Datos

**Files:**
- Rename/Modify: `src/screens/admin/ContenedoresScreen.js` → `src/admin/ListaContenedores.js` (sin `PantallaAdmin` ni la fila de 4 `Indicador`)
- Modify: `src/screens/admin/IndicadoresScreen.js` (la fila de 4 `Indicador` arriba de los gráficos, con los mismos cálculos: total, `cr.enAlerta`, `cr.sinConexion`, promedio de los con lectura)

**Interfaces:**
- Produces: `<ListaContenedores />` (usa `useAdminData()`; mantiene búsqueda, `Filtros` y filas que llaman `abrirDetalle(id)`).

- [ ] **Step 1:** Hacer los dos cambios. `App.js` todavía importa `ContenedoresScreen`; ese import se cambia en Task 6, así que entre Task 3 y Task 6 la app no compila y la compilación se verifica al final de Task 6.
- [ ] **Step 2:** Commit `refactor(app): lista de contenedores reutilizable; indicadores pasan a Datos`.

### Task 4: Pestaña Mapa del admin

**Files:**
- Create: `ecosmart-mobile-rn/src/screens/admin/MapaAdminScreen.js`

**Interfaces:**
- Consumes: `pinesDe` (Task 1), `LeyendaMapa` (Task 2), `ListaContenedores` (Task 3), `MapaView` (`pins, darkMode, seleccionado, onSelect, posicion, centrar`), `useAdminData()` → `contenedores, cargado, darkMode, abrirDetalle`; `EstadoCarga`, `Filtros` de `admin/ui`.
- Produces: `export default function MapaAdminScreen()`.

- [ ] **Step 1:** Implementar: arriba un `Filtros` con opciones `[{valor:'mapa', etiqueta:'Mapa'}, {valor:'lista', etiqueta:'Lista'}]` (estado local, inicial `'mapa'`). Modo mapa: `EstadoCarga`, y si `cargado` el `MapaView` a pantalla completa con `pins = pinesDe(contenedores)`, `onSelect={(p) => abrirDetalle(p.id_contenedor)}`, `seleccionado={null}`, `posicion={null}`, más `<LeyendaMapa />`; si no hay pines, el mensaje "No hay contenedores con ubicación." Modo lista: `<ListaContenedores />` dentro de `PantallaAdmin`.
- [ ] **Step 2:** (Compila junto con Task 6.)
- [ ] **Step 3:** Commit `feat(app): pestaña Mapa del administrador`.

### Task 5: Mi perfil del admin

**Files:**
- Create: `ecosmart-mobile-rn/src/screens/admin/PerfilAdminScreen.js`

**Interfaces:**
- Consumes: `resumenAdmin` (Task 1); `useAdminData()` → `alertas, reportes, ordenes, darkMode`; `temaDe`.
- Produces: `PerfilAdminScreen({ perfil, darkMode, onVolver, onConfiguracion, onIrA })`, donde `onIrA(id)` recibe `'alertas' | 'reportes' | 'ordenes'`.

- [ ] **Step 1:** Implementar copiando la estructura y los estilos de `PerfilScreen` (barra con ← "Mi perfil" ⚙, tarjeta con avatar de 60 px "A", nombre `perfil.nombre_completo || 'Administrador'`, correo y una etiqueta con el texto "Innova Recicla" en el lugar del saldo). Debajo, la fila de 3 `dato` (`AlertTriangle` rojo, `MessageSquareWarning` ámbar, `ClipboardList` verde), con los textos "alertas pendientes", "reportes pendientes" y "órdenes abiertas" (en singular cuando el número es 1). Cada `dato` es `Pressable` y llama `onIrA`. No incluye liga, racha ni logros.
- [ ] **Step 2:** Commit `feat(app): Mi perfil del administrador`.

### Task 6: Navegación en App.js

**Files:**
- Modify: `ecosmart-mobile-rn/App.js:33-49` (pestañas), `:58` (`adminPrevia`), `:105-140` (rama admin)

**Interfaces:**
- Consumes: `MapaAdminScreen` (Task 4), `PerfilAdminScreen` (Task 5).

- [ ] **Step 1:** `ADMIN_ITEMS[0] = { id: 'mapa', icon: MapPin, label: 'Mapa' }`; `ADMIN_PANTALLAS.mapa = MapaAdminScreen` (borrar `contenedores`); `inicioDe` del admin → `'mapa'`; `adminPrevia` inicial `'mapa'`. En la rama admin: `pantalla === 'perfil'` muestra `PerfilAdminScreen` (`onVolver` → `adminPrevia`, `onConfiguracion` → `'configuracion'`, `onIrA` → `setPantalla`); `'configuracion'` muestra `ConfiguracionScreen` con `onVolver` → `'perfil'`. El avatar del Header guarda la pestaña actual en `adminPrevia` y va a `'perfil'`. Todo sigue dentro de `AdminDataProvider`.
- [ ] **Step 2:** `npx expo export --platform web --output-dir <scratch>` y `npm test`. Expected: "Exported" sin errores y 3 pass.
- [ ] **Step 3:** En el navegador, sin sesión: la pantalla de login carga sin errores en la consola. Con una cuenta de admin (la entrega el usuario): Mapa abre primero; tocar un pin abre el detalle; Mapa/Lista funciona; ⚙ → Configuración ← vuelve a Mi perfil ← vuelve a la pestaña de origen (probarlo desde Datos); en modo claro y oscuro.
- [ ] **Step 4:** Commit `feat(app): navegación del admin con Mapa y Mi perfil` y abrir el PR.
