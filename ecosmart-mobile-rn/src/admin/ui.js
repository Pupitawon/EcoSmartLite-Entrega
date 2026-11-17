import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RefreshCw, WifiOff } from 'lucide-react-native';
import { API_URL } from '../config';
import { temaDe } from '../tema';
import { useAdminData } from './AdminData';
import { COLOR, hace, suave } from './utils';

/** Contenedor de cada pantalla de admin: título, scroll y "deslizar para actualizar". */
export function PantallaAdmin({ icono: Icono, titulo, children, mostrarActualizado = true }) {
  const { darkMode, cargando, recargar, actualizado, ahora } = useAdminData();
  const t = temaDe(darkMode);
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.fondoApp }}
      contentContainerStyle={e.contenido}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={cargando && !!actualizado} onRefresh={recargar} tintColor={t.acento} colors={[t.acento]} />}
    >
      <View style={[e.encabezado, { borderBottomColor: t.borde }]}>
        <Icono size={20} color={t.acento} />
        <Text style={[e.titulo, { color: t.texto }]} numberOfLines={1}>{titulo}</Text>
        {mostrarActualizado && actualizado && (
          <Text style={{ marginLeft: 'auto', fontSize: 11, color: t.textoSuave }}>Actualizado {hace(actualizado, ahora)}</Text>
        )}
      </View>
      {children}
    </ScrollView>
  );
}

/** Mensaje mientras carga o si el servidor no responde. Devuelve null cuando ya hay datos. */
export function EstadoCarga() {
  const { darkMode, cargado, error, recargar } = useAdminData();
  const t = temaDe(darkMode);
  if (cargado) return null;
  if (!error) return <Vacio>Cargando datos…</Vacio>;
  return (
    <View style={[e.tarjeta, { borderColor: suave(COLOR.rojo, '66'), backgroundColor: suave(COLOR.rojo, '1a'), flexDirection: 'row', gap: 8 }]}>
      <WifiOff size={16} color={COLOR.rojo} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: t.texto }}>No se pudo conectar con el servidor</Text>
        <Text style={{ fontSize: 12, marginTop: 2, color: t.textoSuave }}>{API_URL || '(sin EXPO_PUBLIC_API_URL)'} · {error}</Text>
        <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
          <Boton icono={RefreshCw} onPress={recargar}>Reintentar</Boton>
        </View>
      </View>
    </View>
  );
}

export function Tarjeta({ children, style, onPress, borde }) {
  const { darkMode } = useAdminData();
  const t = temaDe(darkMode);
  const estilo = [e.tarjeta, { backgroundColor: t.superficie, borderColor: t.borde }, borde && { borderLeftWidth: 3, borderLeftColor: borde }, style];
  if (!onPress) return <View style={estilo}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [...estilo, pressed && { opacity: 0.7 }]}>
      {children}
    </Pressable>
  );
}

export function Vacio({ children }) {
  const { darkMode } = useAdminData();
  const t = temaDe(darkMode);
  return (
    <Tarjeta>
      <Text style={{ fontSize: 12, color: t.textoSuave }}>{children}</Text>
    </Tarjeta>
  );
}

/** Fila de filtros deslizable horizontalmente. */
export function Filtros({ opciones, valor, onCambiar }) {
  const { darkMode } = useAdminData();
  const t = temaDe(darkMode);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {opciones.map((o) => {
        const activo = o.id === valor;
        return (
          <Pressable
            key={o.id}
            onPress={() => onCambiar(o.id)}
            accessibilityState={{ selected: activo }}
            style={[
              e.chip,
              activo ? { backgroundColor: t.acentoFuerte, borderColor: t.acentoFuerte } : { backgroundColor: t.superficie, borderColor: t.campoBorde },
            ]}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: activo ? '#ffffff' : t.textoCampo }}>{o.label}</Text>
            {o.count != null && (
              <Text style={{ fontSize: 10, fontWeight: '700', color: activo ? '#d1fae5' : t.textoSuave }}>{o.count}</Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Botón: variante 'primario' (verde), 'secundario' (gris) o 'peligro' (rojo suave). */
export function Boton({ onPress, children, variante = 'secundario', icono: Icono, grande, accessibilityLabel }) {
  const { darkMode } = useAdminData();
  const t = temaDe(darkMode);
  const v = {
    primario: { fondo: t.acentoFuerte, texto: '#ffffff' },
    secundario: { fondo: darkMode ? '#3f3f46' : '#e7e5e4', texto: darkMode ? '#ffffff' : '#27272a' },
    peligro: { fondo: suave(COLOR.rojo), texto: COLOR.rojo },
  }[variante];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [e.boton, grande && e.botonGrande, { backgroundColor: v.fondo }, pressed && { opacity: 0.75 }]}
    >
      {Icono && <Icono size={grande ? 16 : 13} color={v.texto} />}
      {!!children && <Text style={{ fontSize: grande ? 14 : 12, fontWeight: '700', color: v.texto }}>{children}</Text>}
    </Pressable>
  );
}

export function Seccion({ titulo, color, icono: Icono, children }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {Icono && <Icono size={14} color={color} />}
        <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color }}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

export function Etiqueta({ texto, color, icono: Icono }) {
  return (
    <View style={[e.etiqueta, { backgroundColor: suave(color) }]}>
      {Icono && <Icono size={10} color={color} />}
      <Text style={{ fontSize: 10, fontWeight: '700', color }}>{texto}</Text>
    </View>
  );
}

/** Tarjeta de resumen (número grande + etiqueta). */
export function Indicador({ icono: Icono, valor, etiqueta, color }) {
  const { darkMode } = useAdminData();
  const t = temaDe(darkMode);
  return (
    <View style={[e.indicador, { backgroundColor: t.superficie, borderColor: t.borde }]}>
      <Icono size={16} color={color} />
      <Text style={{ fontSize: 18, fontWeight: '900', color: t.texto }}>{valor}</Text>
      <Text style={{ fontSize: 10, textAlign: 'center', color: t.textoSuave }}>{etiqueta}</Text>
    </View>
  );
}

/** Barra de progreso simple. */
export function Progreso({ pct, color, alto = 4 }) {
  const { darkMode } = useAdminData();
  return (
    <View style={{ height: alto, borderRadius: 99, overflow: 'hidden', backgroundColor: darkMode ? '#27272a' : '#e7e5e4' }}>
      <View style={{ height: '100%', borderRadius: 99, width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }} />
    </View>
  );
}

/** Barra horizontal con etiqueta y número, para los indicadores. */
export function Barra({ etiqueta, n, total, color = COLOR.verde }) {
  const { darkMode } = useAdminData();
  const t = temaDe(darkMode);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text numberOfLines={1} style={{ width: 96, fontSize: 12, color: t.textoSuave }}>{etiqueta}</Text>
      <View style={{ flex: 1 }}>
        <Progreso pct={total ? (n / total) * 100 : 0} color={color} alto={8} />
      </View>
      <Text style={{ width: 28, textAlign: 'right', fontSize: 12, fontWeight: '700', color: t.texto }}>{n}</Text>
    </View>
  );
}

const e = StyleSheet.create({
  contenido: { padding: 16, paddingBottom: 32, gap: 16 },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottomWidth: 1, marginTop: 4 },
  titulo: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  tarjeta: { borderWidth: 1, borderRadius: 12, padding: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  boton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  botonGrande: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  etiqueta: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  indicador: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 10, alignItems: 'center', gap: 4 },
});
