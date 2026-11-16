import { useEffect, useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Flame, Leaf, Moon, Sun } from 'lucide-react-native';
import { temaDe } from '../tema';

const logoClaro = require('../../assets/logos/logo-ecosmart-claro.png');
const logoOscuro = require('../../assets/logos/logo-ecosmart-oscuro.png');

/**
 * Encabezado con racha, EcoPuntos, tema y perfil. Cada elemento muestra un globo pequeño que explica qué es:
 * - Computador: al pasar el cursor por encima; se va al sacarlo.
 * - Celular: al mantener presionado (y al tocar racha o EcoPuntos); se va al tocar en otro lado o a los 3,5 s.
 */
export default function Header({ darkMode, toggleDarkMode, inicial, onPerfil, racha = 0, ecopoints = 0 }) {
  const t = temaDe(darkMode);
  const [abierto, setAbierto] = useState(null); // id del globo visible
  const temporizador = useRef(null);

  const mostrar = (id, conTiempo = false) => {
    clearTimeout(temporizador.current);
    setAbierto(id);
    if (conTiempo) temporizador.current = setTimeout(() => setAbierto(null), 3500);
  };
  const ocultar = (id) => {
    clearTimeout(temporizador.current);
    setAbierto((a) => (a === id ? null : a));
  };

  // En el navegador, tocar o hacer clic en cualquier otro lado cierra el globo.
  useEffect(() => {
    if (Platform.OS !== 'web' || !abierto || typeof document === 'undefined') return undefined;
    const cerrar = () => setAbierto(null);
    document.addEventListener('pointerdown', cerrar);
    return () => document.removeEventListener('pointerdown', cerrar);
  }, [abierto]);
  useEffect(() => () => clearTimeout(temporizador.current), []);

  const textos = {
    racha: racha > 0 ? `Racha: llevas ${racha} ${racha === 1 ? 'día' : 'días'} seguidos reciclando` : 'Racha: recicla hoy para empezar una',
    ecopoints: 'Tus EcoPuntos disponibles',
    tema: darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro',
    perfil: 'Mi perfil',
  };

  // Envuelve un elemento y le agrega el globo.
  // (Es una función y no un componente, para que los botones no se vuelvan a montar en cada render y no se pierda el hover.)
  const con = (id, children) => (
    <View style={{ position: 'relative' }}>
      {children}
      {abierto === id ? (
        <View pointerEvents="none" style={[e.globo, { backgroundColor: darkMode ? '#3f3f46' : '#1c1917' }]}>
          <Text style={e.globoTxt}>{textos[id]}</Text>
        </View>
      ) : null}
    </View>
  );
  const eventos = (id, tocar) => ({
    onHoverIn: () => mostrar(id),
    onHoverOut: () => ocultar(id),
    onLongPress: () => mostrar(id, true),
    ...(tocar ? { onPress: () => mostrar(id, true) } : {}),
  });

  return (
    <View style={[e.header, { backgroundColor: darkMode ? '#09090b' : '#ffffff', borderBottomColor: t.borde }]}>
      <Image source={darkMode ? logoOscuro : logoClaro} style={e.logo} resizeMode="contain" accessibilityLabel="EcoSmart" />
      <View style={e.controles}>
        {con('racha', (
          <Pressable {...eventos('racha', true)} style={e.dato} accessibilityLabel={`Racha de ${racha} días`}>
            <Flame size={18} color={racha > 0 ? '#f97316' : t.textoSuave} fill={racha > 0 ? '#f97316' : 'none'} />
            <Text style={{ color: racha > 0 ? '#f97316' : t.textoSuave, fontWeight: '800', fontSize: 14 }}>{racha}</Text>
          </Pressable>
        ))}
        {con('ecopoints', (
          <Pressable {...eventos('ecopoints', true)} style={e.dato} accessibilityLabel={`${ecopoints} EcoPuntos`}>
            <Leaf size={18} color={t.acento} />
            <Text style={{ color: t.acentoFuerte, fontWeight: '800', fontSize: 14 }}>{ecopoints}</Text>
          </Pressable>
        ))}
        {con('tema', (
          <Pressable onPress={toggleDarkMode} {...eventos('tema', false)} accessibilityLabel="Cambiar tema" style={e.icono}>
            {darkMode ? <Sun size={20} color={t.iconoTema} /> : <Moon size={20} color={t.iconoTema} />}
          </Pressable>
        ))}
        {con('perfil', (
          <Pressable
            onPress={onPerfil}
            {...eventos('perfil', false)}
            accessibilityLabel="Abrir mi perfil"
            style={[
              e.avatar,
              { backgroundColor: darkMode ? '#27272a' : '#d1fae5', borderColor: darkMode ? '#10b981' : '#059669' },
            ]}
          >
            <Text style={{ color: darkMode ? '#34d399' : '#047857', fontWeight: '800', fontSize: 12 }}>
              {inicial || 'U'}
            </Text>
          </Pressable>
        ))}
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
    zIndex: 20, // para que el globo quede por encima del contenido de abajo
  },
  logo: { height: 28, width: 90 },
  controles: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dato: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 4, paddingVertical: 6 },
  icono: { padding: 8, borderRadius: 999 },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  // Globo bajo el elemento, alineado a su borde derecho; ancho fijo para que no se encoja al ancho del icono.
  globo: {
    position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 176,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, zIndex: 50, elevation: 6,
  },
  globoTxt: { color: '#ffffff', fontSize: 12, lineHeight: 16, textAlign: 'center' },
});
