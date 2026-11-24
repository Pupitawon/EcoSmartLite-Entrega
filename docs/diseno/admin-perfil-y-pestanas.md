# Admin: Mi perfil, Configuración y pestañas (parte 1 de 2)

## Por qué
El administrador de Innova Recicla usa la app en el celular. Lo primero que necesita es ver los
contenedores inteligentes en el mapa con su nivel de llenado; los reportes ciudadanos van en su propia
pestaña. Su perfil y su configuración deben verse igual que los del ciudadano.
Los avisos con sonido aunque el celular esté bloqueado (push) son la **parte 2**, con su propio diseño.

## Objetivos
- Pestañas del admin: **Mapa · Alertas · Reportes · Órdenes · Datos** (opción A).
- **Mapa** primero: contenedores sobre el mapa, coloreados por llenado; tocar uno abre el detalle que ya existe.
- **Mi perfil** del admin con el mismo aspecto que el del ciudadano; el engranaje abre **Configuración**.

## No objetivos
- Notificaciones push (parte 2).
- Cambios en el backend.
- Cambiar la vista del ciudadano.

## Anti-objetivos
- Que el admin pierda algo que hoy tiene (lista de contenedores, filtros, indicadores, historial de alertas).
- Que el mapa del admin se vea distinto al del ciudadano.

## Enfoques considerados
- **A (elegido):** Mapa reemplaza a Panel; 5 pestañas. Cada pestaña tiene un propósito claro.
- B: alertas como contador dentro del mapa; 4 pestañas. Se pierde el historial de alertas como pantalla propia.
- C: mapa como sexta pestaña. No cabe bien en un celular y repite contenido.

## Diseño

**Navegación**
- Barra inferior: Mapa (inicio) · Alertas · Reportes · Órdenes · Datos.
- Encabezado: avatar "A" → **Mi perfil** (pantalla completa, sin encabezado ni barra, como el ciudadano).
- Mi perfil: flecha ← vuelve a la pestaña donde estaba; engranaje → **Configuración**; en Configuración, ← vuelve a Mi perfil.

**Mapa (reemplaza Panel)**
- Reutiliza `MapaView` del ciudadano (web y nativo), con los mismos colores: verde, amarillo, rojo (≥ umbral) y gris (sin reporte).
- Tocar un contenedor abre la hoja de detalle existente (`abrirDetalle`), desde la que se crea una orden.
- Botón Mapa / Lista arriba: la lista y los filtros son los que hoy tiene Panel.
- Leyenda de colores, igual que en el mapa del ciudadano.

**Datos**
- Recibe arriba los 4 indicadores que tenía Panel (contenedores, en alerta, sin conexión, llenado promedio), sobre los gráficos actuales.

**Mi perfil (admin)**, mismo estilo que `PerfilScreen`:
- Tarjeta: avatar "A", "Administrador", correo y etiqueta "Innova Recicla" en lugar de los EcoPuntos.
- Fila de 3 datos: alertas pendientes · reportes pendientes · órdenes abiertas (no Cerradas). Cada uno lleva a su pestaña.
- No tiene liga, racha ni logros.

**Configuración (admin)**: la del #20, sin cambios de contenido (rol, correo, contraseña, modo oscuro, cerrar sesión).

## Lo que queda al implementador
- Nombres de componentes y archivos; si `PerfilAdminScreen` es un archivo nuevo o una variante de `PerfilScreen` (se prefiere un archivo nuevo, porque los datos son distintos).
- Cómo adaptar los contenedores del panel al formato de pin que espera `MapaView`.

## Cómo se prueba
- `expo export --platform web` compila.
- En el navegador y en Expo Go con una cuenta admin: el mapa abre primero, tocar un pin abre el detalle, la lista funciona, Mi perfil → Configuración → volver.
