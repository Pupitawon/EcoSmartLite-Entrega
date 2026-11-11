import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LogOut, MapPin } from 'lucide-react-native';
import { temaDe } from '../tema';

// Sprint 1: solo existen el Mapa y salir. Las demás pestañas de la app de Jeremy
// (Inicio, Escanear, Logros, Perfil) corresponden a historias de otros sprints.
const ITEMS = [
  { id: 'mapa', icon: MapPin, label: 'Mapa' },
  { id: 'logout', icon: LogOut, label: 'Salir' },
];

// `items` permite reemplazar las pestañas (ej. las del administrador).
export default function BottomNav({ active, darkMode, onNavigate, items = ITEMS }) {
  const t = temaDe(darkMode);
  const compacta = items.length > 3;
  return (
    <View style={[e.nav, { backgroundColor: t.navFondo, borderTopColor: darkMode ? '#27272a' : '#047857' }]}>
      {items.map(({ id, icon: Icon, label }) => {
        const activo = active === id;
        return (
          <Pressable
            key={id}
            onPress={() => onNavigate(id)}
            accessibilityLabel={label}
            accessibilityState={{ selected: activo }}
            style={[e.item, compacta && e.itemCompacto, activo && { backgroundColor: t.navActivoFondo }]}
          >
            <Icon size={20} color={activo ? t.navActivo : t.navInactivo} strokeWidth={activo ? 2.5 : 2} />
            <Text numberOfLines={1} style={{ fontSize: compacta ? 10 : 11, marginTop: 2, color: activo ? t.navActivo : t.navInactivo, fontWeight: activo ? '700' : '500' }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const e = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
  },
  item: { alignItems: 'center', borderRadius: 16, paddingHorizontal: 28, paddingVertical: 8 },
  itemCompacto: { flex: 1, paddingHorizontal: 2 },
});
