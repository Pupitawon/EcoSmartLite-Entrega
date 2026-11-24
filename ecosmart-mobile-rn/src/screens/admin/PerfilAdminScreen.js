import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, ArrowLeft, ChevronRight, ClipboardList, MessageSquareWarning, Settings, ShieldCheck, Users } from 'lucide-react-native';
import { useAdminData } from '../../admin/AdminData';
import { COLOR, resumenAdmin } from '../../admin/utils';
import { temaDe } from '../../tema';

/**
 * "Mi perfil" del administrador, con el mismo aspecto que el del ciudadano (PerfilScreen):
 * en vez de EcoPuntos, liga y racha muestra lo que espera su atención. Cada número lleva a su pestaña.
 */
export default function PerfilAdminScreen({ perfil, darkMode, onVolver, onConfiguracion, onAdministradores, onIrA }) {
  const t = temaDe(darkMode);
  const { alertas, reportes, ordenes, cargado } = useAdminData();
  const r = resumenAdmin({ alertas, reportes, ordenes, cargado });

  const datos = [
    { id: 'alertas', n: r.alertasPendientes, Icono: AlertTriangle, color: COLOR.rojo, uno: 'alerta pendiente', varios: 'alertas pendientes' },
    { id: 'reportes', n: r.reportesPendientes, Icono: MessageSquareWarning, color: COLOR.ambar, uno: 'reporte pendiente', varios: 'reportes pendientes' },
    { id: 'ordenes', n: r.ordenesAbiertas, Icono: ClipboardList, color: COLOR.verde, uno: 'orden abierta', varios: 'órdenes abiertas' },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 32 }} style={{ backgroundColor: t.fondoApp }}>
      {/* Barra superior: flecha para regresar y engranaje para Configuración (igual que el ciudadano) */}
      <View style={e.barraSuperior}>
        <Pressable onPress={onVolver} accessibilityLabel="Volver" hitSlop={10} style={e.flecha}>
          <ArrowLeft size={22} color={t.texto} />
        </Pressable>
        <Text style={{ color: t.texto, fontWeight: '800', fontSize: 18, flex: 1 }}>Mi perfil</Text>
        <Pressable onPress={onConfiguracion} accessibilityLabel="Configuración" hitSlop={10} style={e.flecha}>
          <Settings size={22} color={t.texto} />
        </Pressable>
      </View>

      {/* Datos del administrador; la etiqueta de la organización va donde el ciudadano tiene sus EcoPuntos */}
      <View style={[e.tarjeta, { backgroundColor: t.superficie, borderColor: t.borde }]}>
        <View style={[e.avatar, { backgroundColor: darkMode ? '#27272a' : '#d1fae5', borderColor: t.acento }]}>
          <Text style={{ color: darkMode ? '#34d399' : '#047857', fontWeight: '800', fontSize: 22 }}>
            {perfil?.nombre_completo?.charAt(0).toUpperCase() || 'A'}
          </Text>
        </View>
        <Text style={{ color: t.texto, fontSize: 18, fontWeight: '700', marginTop: 10 }}>{perfil?.nombre_completo || 'Administrador'}</Text>
        <Text style={{ color: t.textoSuave, fontSize: 13 }}>{perfil?.correo}</Text>
        <View style={[e.rol, { backgroundColor: darkMode ? 'rgba(16,185,129,0.12)' : '#ecfdf5' }]}>
          <ShieldCheck size={18} color={t.acentoFuerte} />
          <Text style={{ color: t.acentoFuerte, fontWeight: '800', fontSize: 15 }}>Innova Recicla</Text>
        </View>
      </View>

      {/* Lo que espera su atención */}
      <View style={e.fila}>
        {datos.map(({ id, n, Icono, color, uno, varios }) => (
          <Pressable
            key={id}
            onPress={() => onIrA(id)}
            accessibilityRole="button"
            accessibilityLabel={n === null ? `${varios}: cargando` : `${n} ${n === 1 ? uno : varios}`}
            style={[e.dato, { backgroundColor: t.superficie, borderColor: t.borde }]}
          >
            <Icono size={22} color={color} />
            {/* Sin datos todavía se muestra "—" y no un 0 que haría creer que no hay nada pendiente */}
            <Text style={{ color: t.texto, fontSize: 20, fontWeight: '800' }}>{n === null ? '—' : n}</Text>
            <Text style={{ color: t.textoSuave, fontSize: 12, textAlign: 'center' }}>{n === 1 ? uno : varios}</Text>
          </Pressable>
        ))}
      </View>

      {/* Solo el súper usuario: crear y desactivar administradores */}
      {onAdministradores ? (
        <Pressable
          onPress={onAdministradores}
          accessibilityRole="button"
          accessibilityLabel="Administradores"
          style={[e.filaAccion, { backgroundColor: t.superficie, borderColor: t.borde }]}
        >
          <Users size={20} color={t.acento} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.texto, fontWeight: '700', fontSize: 15 }}>Administradores</Text>
            <Text style={{ color: t.textoSuave, fontSize: 12 }}>Crear, desactivar y reenviar acceso</Text>
          </View>
          <ChevronRight size={20} color={t.textoSuave} />
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const e = StyleSheet.create({
  barraSuperior: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  flecha: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tarjeta: { borderWidth: 1, borderRadius: 20, padding: 18, alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  rol: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 8, marginTop: 14 },
  fila: { flexDirection: 'row', gap: 10, marginTop: 16 },
  dato: { flex: 1, borderWidth: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center', gap: 2 },
  filaAccion: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 16 },
});
