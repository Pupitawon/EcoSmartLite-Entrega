import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Clock, Trophy } from 'lucide-react-native';
import { obtenerRanking } from '../services/ranking';
import { temaDe } from '../tema';

const MEDALLAS = { 1: '#eab308', 2: '#94a3b8', 3: '#b45309' };

/**
 * Ranking del mes: los 10 que más botellas han reciclado (nombre corto, para no exponer a nadie).
 * Tu fila va resaltada; si quedaste fuera del top, aparece al final con tu posición.
 * Lo calcula el servidor (GET /api/usuarios/me/ranking) y se vuelve a pedir cuando cambia el saldo.
 */
export default function RankingScreen({ perfil, darkMode }) {
  const t = temaDe(darkMode);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await obtenerRanking());
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar, perfil?.saldo_ecopoints]);

  const fila = (f, separada) => (
    <View
      key={`${f.posicion}-${f.nombre}`}
      style={[
        e.fila,
        { borderColor: f.yo ? t.acento : t.borde, backgroundColor: f.yo ? (darkMode ? 'rgba(16,185,129,0.12)' : '#ecfdf5') : t.superficie },
        separada && { marginTop: 14 },
      ]}
    >
      <View style={[e.puesto, MEDALLAS[f.posicion] ? { backgroundColor: MEDALLAS[f.posicion] } : { backgroundColor: darkMode ? '#27272a' : '#e7e5e4' }]}>
        <Text style={{ fontWeight: '800', fontSize: 13, color: MEDALLAS[f.posicion] ? '#ffffff' : t.textoSuave }}>{f.posicion}</Text>
      </View>
      <Text style={{ flex: 1, color: t.texto, fontWeight: f.yo ? '800' : '600', fontSize: 15 }} numberOfLines={1}>
        {f.nombre}{f.yo ? ' (tú)' : ''}
      </Text>
      <Text style={{ color: t.acento, fontWeight: '800', fontSize: 14 }}>{f.botellas} {f.botellas === 1 ? 'botella' : 'botellas'}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }} style={{ backgroundColor: t.fondoApp }}>
      {cargando && !datos ? <ActivityIndicator style={{ marginTop: 40 }} color={t.acento} /> : null}

      {error ? (
        <View style={{ margin: 24, alignItems: 'center' }}>
          <Text style={{ color: t.error, textAlign: 'center', marginBottom: 8 }}>{error}</Text>
          <Pressable onPress={cargar} style={[e.boton, { borderColor: t.acento }]}>
            <Text style={{ color: t.acento, fontWeight: '700' }}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {datos ? (
        <>
          <View style={[e.cabecera, { backgroundColor: darkMode ? '#064e3b' : '#059669' }]}>
            <Trophy size={34} color="#fde68a" />
            <Text style={e.titulo}>{datos.titulo}</Text>
            <View style={e.reloj}>
              <Clock size={14} color="#d1fae5" />
              <Text style={{ color: '#d1fae5', fontWeight: '700', fontSize: 12 }}>
                {datos.dias_restantes === 0 ? 'ÚLTIMO DÍA' : `${datos.dias_restantes} ${datos.dias_restantes === 1 ? 'DÍA' : 'DÍAS'}`}
              </Text>
            </View>
          </View>

          <View style={{ padding: 24, paddingTop: 20 }}>
            {datos.top.length === 0 ? (
              <Text style={{ color: t.textoSuave, textAlign: 'center', marginTop: 12 }}>
                Aún nadie ha reciclado este mes. ¡Haz tu primer depósito y lidera el ranking!
              </Text>
            ) : (
              <>
                {datos.top.map((f) => fila(f, false))}
                {datos.yo ? fila(datos.yo, true) : null}
              </>
            )}
            {!datos.en_ranking && datos.top.length > 0 ? (
              <Text style={{ color: t.textoSuave, textAlign: 'center', marginTop: 16, fontSize: 13 }}>
                Recicla una botella este mes para entrar al ranking.
              </Text>
            ) : null}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const e = StyleSheet.create({
  cabecera: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 24, alignItems: 'center' },
  titulo: { color: '#ffffff', fontSize: 24, fontWeight: '800', marginTop: 8, marginBottom: 6, textTransform: 'capitalize' },
  reloj: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 },
  puesto: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  boton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
});
