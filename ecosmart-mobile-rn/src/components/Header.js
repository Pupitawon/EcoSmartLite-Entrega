import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { temaDe } from '../tema';

const logoClaro = require('../../assets/logos/logo-ecosmart-claro.png');
const logoOscuro = require('../../assets/logos/logo-ecosmart-oscuro.png');

export default function Header({ darkMode, toggleDarkMode, inicial }) {
  const t = temaDe(darkMode);
  return (
    <View style={[e.header, { backgroundColor: darkMode ? '#09090b' : '#ffffff', borderBottomColor: t.borde }]}>
      <Image source={darkMode ? logoOscuro : logoClaro} style={e.logo} resizeMode="contain" accessibilityLabel="EcoSmart" />
      <View style={e.controles}>
        <Pressable onPress={toggleDarkMode} accessibilityLabel="Cambiar tema" style={e.icono}>
          {darkMode ? <Sun size={20} color={t.iconoTema} /> : <Moon size={20} color={t.iconoTema} />}
        </Pressable>
        <View
          style={[
            e.avatar,
            { backgroundColor: darkMode ? '#27272a' : '#d1fae5', borderColor: darkMode ? '#10b981' : '#059669' },
          ]}
        >
          <Text style={{ color: darkMode ? '#34d399' : '#047857', fontWeight: '800', fontSize: 12 }}>
            {inicial || 'U'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const e = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  logo: { height: 28, width: 90 },
  controles: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icono: { padding: 8, borderRadius: 999 },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
