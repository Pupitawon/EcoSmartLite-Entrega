import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, Check, Lock } from 'lucide-react-native';
import { obtenerInsignias } from '../services/insignias';
import { colorDe, iconoDe } from '../utils/logrosVista';
import { temaDe } from '../tema';

/**
 * Todos los logros con todos sus niveles (como "Ver más" en los logros de Duolingo).
 * Los niveles los calcula el servidor (GET /api/usuarios/me/insignias, campo `logros`).
 */
export default function LogrosScreen({ perfil, darkMode, onVolver }) {
  const t = temaDe(darkMode);
  const [logros, setLogros] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setLogros((await obtenerInsignias()).logros || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar, perfil?.saldo_ecopoints]);

  const pista = darkMode ? '#27272a' : '#e7e5e4';
  const totalNiveles = (logros || []).reduce((s, l) => s + l.niveles_totales, 0);
  const desbloqueados = (logros || []).reduce((s, l) => s + l.nivel, 0);

  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 32 }} style={{ backgroundColor: t.fondoApp }}>
      <View style={e.barraSuperior}>
        <Pressable onPress={onVolver} accessibilityLabel="Volver" hitSlop={10} style={e.flecha}>
          <ArrowLeft size={22} color={t.texto} />
        </Pressable>
        <Text style={{ color: t.texto, fontWeight: '800', fontSize: 18 }}>Todos los logros</Text>
      </View>

      {cargando && !logros ? <ActivityIndicator style={{ marginTop: 24 }} color={t.acento} /> : null}
      {error ? (
        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ color: t.error, textAlign: 'center', marginBottom: 8 }}>{error}</Text>
          <Pressable onPress={cargar} style={[e.boton, { borderColor: t.acento }]}>
            <Text style={{ color: t.acento, fontWeight: '700' }}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {logros ? (
        <>
          <Text style={{ color: t.textoSuave, fontSize: 13, marginBottom: 14 }}>
            {desbloqueados} de {totalNiveles} niveles desbloqueados en {logros.length} logros.
          </Text>

          {logros.map((l) => {
            const Icono = iconoDe(l);
            const color = colorDe(l, t.acento);
            return (
              <View key={l.id} style={[e.tarjeta, { backgroundColor: t.superficie, borderColor: t.borde }]}>
                <View style={e.cabecera}>
                  <View style={[e.medalla, { backgroundColor: color + '26' }]}>
                    <Icono size={24} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.texto, fontWeight: '700', fontSize: 15 }}>{l.titulo}</Text>
                    <Text style={{ color: t.textoSuave, fontSize: 12 }}>
                      {l.nivel === 0 ? 'Sin nivel todavía' : `Nivel ${l.nivel} de ${l.niveles_totales}`} · {l.valor} {l.unidad}
                    </Text>
                  </View>
                </View>

                {/* Avance hacia el siguiente nivel */}
                {l.meta !== null ? (
                  <View style={{ marginTop: 10 }}>
                    <View style={[e.barra, { backgroundColor: pista }]}>
                      <View style={[e.relleno, { width: `${Math.round(l.avance * 100)}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={{ color: t.textoSuave, fontSize: 11 }}>{l.valor} / {l.meta} {l.unidad} para el nivel {l.nivel + 1}</Text>
                  </View>
                ) : (
                  <Text style={{ color, fontWeight: '700', fontSize: 12, marginTop: 10 }}>¡Nivel máximo alcanzado!</Text>
                )}

                {/* Todos los niveles */}
                <View style={[e.divisor, { backgroundColor: t.borde }]} />
                {l.niveles.map((n) => (
                  <View key={n.nivel} style={e.nivel}>
                    <View style={[e.punto, { backgroundColor: n.alcanzado ? color : pista }]}>
                      {n.alcanzado ? <Check size={14} color="#ffffff" strokeWidth={3} /> : <Lock size={12} color={t.textoSuave} />}
                    </View>
                    <Text style={{ color: n.alcanzado ? t.texto : t.textoSuave, fontSize: 13, flex: 1, fontWeight: n.alcanzado ? '600' : '400' }}>
                      Nivel {n.nivel}: {n.requerido} {l.unidad}
                    </Text>
                    <Text style={{ color: n.alcanzado ? color : t.textoSuave, fontSize: 11, fontWeight: '700' }}>
                      {n.alcanzado ? 'Logrado' : 'Pendiente'}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}
        </>
      ) : null}
    </ScrollView>
  );
}

const e = StyleSheet.create({
  barraSuperior: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  flecha: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tarjeta: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  medalla: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  barra: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 5 },
  relleno: { height: '100%', borderRadius: 4 },
  divisor: { height: 1, marginVertical: 12 },
  nivel: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  punto: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  boton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 8 },
});
