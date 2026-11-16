import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, Clock, Target } from 'lucide-react-native';
import { obtenerDesafios } from '../services/desafios';
import { temaDe } from '../tema';

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

/**
 * Desafíos: el del mes (con hitos, como el "Desafío de noviembre" de Duolingo) y los del día.
 * Los calcula el servidor (GET /api/usuarios/me/desafios) con los depósitos del usuario.
 * Se vuelve a pedir cuando cambia el saldo, porque un depósito nuevo avanza los desafíos.
 */
export default function DesafiosScreen({ perfil, darkMode }) {
  const t = temaDe(darkMode);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await obtenerDesafios());
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar, perfil?.saldo_ecopoints]);

  const pista = darkMode ? '#27272a' : '#e7e5e4';
  const mes = datos?.mes;
  const avanceMes = mes ? Math.min(mes.valor / mes.meta, 1) : 0;

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

      {mes ? (
        <>
          {/* Desafío del mes */}
          <View style={[e.cabecera, { backgroundColor: darkMode ? '#064e3b' : '#059669' }]}>
            <Text style={e.tituloMes}>{mes.titulo}</Text>
            <View style={e.fila}>
              <Clock size={14} color="#d1fae5" />
              <Text style={{ color: '#d1fae5', fontWeight: '700', fontSize: 12 }}>
                {mes.dias_restantes === 0 ? 'ÚLTIMO DÍA' : `${mes.dias_restantes} ${mes.dias_restantes === 1 ? 'DÍA' : 'DÍAS'}`}
              </Text>
            </View>

            <View style={[e.tarjetaMes, { backgroundColor: darkMode ? '#18181b' : '#ffffff' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: t.texto, fontWeight: '700', fontSize: 15, flex: 1 }}>Recicla {mes.meta} botellas este mes</Text>
                <Text style={{ color: t.acento, fontWeight: '800', fontSize: 15 }}>{mes.valor} / {mes.meta}</Text>
              </View>
              <View style={e.zonaHitos}>
                <View style={[e.pista, { backgroundColor: pista }]}>
                  <View style={[e.relleno, { width: `${Math.round(avanceMes * 100)}%`, backgroundColor: t.acento }]} />
                </View>
                {mes.hitos.map((h) => (
                  <View
                    key={h.valor}
                    style={[
                      e.hito,
                      {
                        left: `${(h.valor / mes.meta) * 100}%`,
                        backgroundColor: h.alcanzado ? t.acento : (darkMode ? '#3f3f46' : '#d6d3d1'),
                        borderColor: darkMode ? '#18181b' : '#ffffff',
                      },
                    ]}
                  >
                    {h.alcanzado ? <Check size={14} color="#ffffff" strokeWidth={3} /> : <Text style={e.hitoNumero}>{h.valor}</Text>}
                  </View>
                ))}
              </View>
              <Text style={{ color: t.textoSuave, fontSize: 12 }}>
                {mes.completado ? '¡Completaste el desafío del mes!' : `Te ${mes.meta - mes.valor === 1 ? 'falta' : 'faltan'} ${plural(mes.meta - mes.valor, 'botella', 'botellas')}.`}
              </Text>
            </View>
          </View>

          {/* Desafíos del día */}
          <View style={{ padding: 24, paddingTop: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: t.textoSuave, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 }}>DESAFÍOS DEL DÍA</Text>
              <View style={e.fila}>
                <Clock size={13} color={t.textoSuave} />
                <Text style={{ color: t.textoSuave, fontWeight: '700', fontSize: 12 }}>{datos.dia.horas_restantes} H</Text>
              </View>
            </View>

            {datos.dia.desafios.map((d) => (
              <View key={d.id} style={[e.desafio, { backgroundColor: t.superficie, borderColor: t.borde }]}>
                <View style={[e.icono, { backgroundColor: d.completado ? t.acento : (darkMode ? 'rgba(16,185,129,0.12)' : '#ecfdf5') }]}>
                  {d.completado ? <Check size={20} color="#ffffff" strokeWidth={3} /> : <Target size={20} color={t.acento} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.texto, fontWeight: '700', fontSize: 14 }}>{d.titulo}</Text>
                  <View style={[e.pistaFina, { backgroundColor: pista }]}>
                    <View style={[e.relleno, { width: `${Math.round((d.valor / d.meta) * 100)}%`, backgroundColor: t.acento }]} />
                  </View>
                  <Text style={{ color: t.textoSuave, fontSize: 12 }}>{d.valor} / {d.meta} {d.unidad}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const e = StyleSheet.create({
  cabecera: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 24 },
  tituloMes: { color: '#ffffff', fontSize: 26, fontWeight: '800', marginBottom: 6 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tarjetaMes: { borderRadius: 20, padding: 16, marginTop: 16, gap: 8 },
  zonaHitos: { height: 34, justifyContent: 'center', marginHorizontal: 14, marginVertical: 2 },
  pista: { height: 12, borderRadius: 6, overflow: 'hidden' },
  relleno: { height: '100%', borderRadius: 6 },
  hito: {
    position: 'absolute', width: 28, height: 28, borderRadius: 14, borderWidth: 3, marginLeft: -14,
    alignItems: 'center', justifyContent: 'center',
  },
  hitoNumero: { color: '#ffffff', fontWeight: '800', fontSize: 11 },
  desafio: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 10 },
  icono: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pistaFina: { height: 8, borderRadius: 4, overflow: 'hidden', marginVertical: 7 },
  boton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 8 },
});
