import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, Award, ChevronRight, Droplets, Flame, Gem, Leaf, Lock, Recycle, Settings } from 'lucide-react-native';
import { obtenerInsignias } from '../services/insignias';
import { ligaDe } from '../utils/ligas';
import { colorDe, iconoDe } from '../utils/logrosVista';
import { horaLocal, temaDe } from '../tema';

const veces = (n) => `${n} ${n === 1 ? 'depósito' : 'depósitos'}`;
const dias = (n) => `${n} ${n === 1 ? 'día' : 'días'}`;

/**
 * Perfil del ciudadano: saldo de EcoPuntos, racha, avance hacia la siguiente insignia y colección de insignias.
 * Los datos los calcula el servidor (GET /api/usuarios/me/insignias); aquí solo se muestran.
 * Se vuelve a pedir cuando cambia el saldo, porque un depósito nuevo puede desbloquear una insignia.
 */
export default function PerfilScreen({ perfil, darkMode, onVolver, onConfiguracion, onVerLogros }) {
  const t = temaDe(darkMode);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await obtenerInsignias());
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar, perfil?.saldo_ecopoints]);

  const liga = ligaDe(datos?.depositos ?? 0);
  const sig = datos?.siguiente;
  // Avance hacia la siguiente insignia: depósitos hechos sobre el umbral que se pide.
  const avance = sig ? Math.min(datos.depositos / sig.umbral_depositos, 1) : 1;

  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 32 }} style={{ backgroundColor: t.fondoApp }}>
      {/* Barra superior: flecha para regresar y título */}
      <View style={e.barraSuperior}>
        <Pressable onPress={onVolver} accessibilityLabel="Volver" hitSlop={10} style={e.flecha}>
          <ArrowLeft size={22} color={t.texto} />
        </Pressable>
        <Text style={{ color: t.texto, fontWeight: '800', fontSize: 18, flex: 1 }}>Mi perfil</Text>
        <Pressable onPress={onConfiguracion} accessibilityLabel="Configuración" hitSlop={10} style={e.flecha}>
          <Settings size={22} color={t.texto} />
        </Pressable>
      </View>

      {/* Datos del usuario y saldo */}
      <View style={[e.tarjeta, { backgroundColor: t.superficie, borderColor: t.borde }]}>
        <View style={[e.avatar, { backgroundColor: darkMode ? '#27272a' : '#d1fae5', borderColor: t.acento }]}>
          <Text style={{ color: darkMode ? '#34d399' : '#047857', fontWeight: '800', fontSize: 22 }}>
            {perfil?.nombre_completo?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={{ color: t.texto, fontSize: 18, fontWeight: '700', marginTop: 10 }}>{perfil?.nombre_completo}</Text>
        <Text style={{ color: t.textoSuave, fontSize: 13 }}>{perfil?.correo}</Text>
        <View style={[e.saldo, { backgroundColor: darkMode ? 'rgba(16,185,129,0.12)' : '#ecfdf5' }]}>
          <Leaf size={18} color={t.acentoFuerte} />
          <Text style={{ color: t.acentoFuerte, fontWeight: '800', fontSize: 20 }}>{perfil?.saldo_ecopoints ?? 0}</Text>
          <Text style={{ color: t.textoSuave, fontSize: 13 }}>EcoPuntos</Text>
        </View>
      </View>

      {cargando && !datos ? <ActivityIndicator style={{ marginTop: 24 }} color={t.acento} /> : null}

      {error ? (
        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ color: t.error, textAlign: 'center', marginBottom: 8 }}>{error}</Text>
          <Pressable onPress={cargar} style={[e.boton, { borderColor: t.acento }]}>
            <Text style={{ color: t.acento, fontWeight: '700' }}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {datos ? (
        <>
          {/* Resumen: liga del reciclador con progreso hacia la siguiente */}
          <View style={[e.tarjeta, { backgroundColor: t.superficie, borderColor: liga.actual.color, marginTop: 16, alignItems: 'stretch' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={[e.gema, { backgroundColor: liga.actual.color + '26', borderColor: liga.actual.color }]}>
                <Gem size={30} color={liga.actual.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.textoSuave, fontSize: 12 }}>Liga {liga.posicion} de {liga.total}</Text>
                <Text style={{ color: t.texto, fontSize: 22, fontWeight: '800' }}>Liga {liga.actual.nombre}</Text>
              </View>
            </View>
            <View style={[e.barra, { backgroundColor: darkMode ? '#27272a' : '#e7e5e4' }]}>
              <View style={[e.barraRelleno, { width: `${Math.round(liga.avance * 100)}%`, backgroundColor: liga.actual.color }]} />
            </View>
            <Text style={{ color: t.textoSuave, fontSize: 12 }}>
              {liga.siguiente
                ? `${liga.faltan === 1 ? 'Falta' : 'Faltan'} ${veces(liga.faltan)} para la Liga ${liga.siguiente.nombre} (${datos.depositos} de ${liga.siguiente.desde}).`
                : '¡Llegaste a la liga más alta!'}
            </Text>
          </View>

          {/* Racha y depósitos */}
          <View style={e.fila}>
            <View style={[e.dato, { backgroundColor: t.superficie, borderColor: t.borde }]}>
              <Flame size={22} color={datos.racha.actual > 0 ? '#f97316' : t.textoSuave} />
              <Text style={{ color: t.texto, fontSize: 20, fontWeight: '800' }}>{datos.racha.actual}</Text>
              <Text style={{ color: t.textoSuave, fontSize: 12, textAlign: 'center' }}>
                {datos.racha.actual === 1 ? 'día de racha' : 'días de racha'}
              </Text>
            </View>
            <View style={[e.dato, { backgroundColor: t.superficie, borderColor: t.borde }]}>
              <Recycle size={22} color={t.acento} />
              <Text style={{ color: t.texto, fontSize: 20, fontWeight: '800' }}>{datos.depositos}</Text>
              <Text style={{ color: t.textoSuave, fontSize: 12, textAlign: 'center' }}>
                {datos.depositos === 1 ? 'depósito' : 'depósitos'}
              </Text>
            </View>
            <View style={[e.dato, { backgroundColor: t.superficie, borderColor: t.borde }]}>
              <Droplets size={22} color="#3b82f6" />
              <Text style={{ color: t.texto, fontSize: 20, fontWeight: '800' }}>{datos.botellas ?? 0}</Text>
              <Text style={{ color: t.textoSuave, fontSize: 12, textAlign: 'center' }}>
                {datos.botellas === 1 ? 'botella' : 'botellas'}
              </Text>
            </View>
          </View>
          <Text style={{ color: t.textoSuave, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
            {datos.racha.actual > 0
              ? `Tu mejor racha: ${dias(datos.racha.maxima)}. Recicla hoy para mantenerla.`
              : datos.racha.maxima > 0
                ? `Tu mejor racha fue de ${dias(datos.racha.maxima)}. Recicla hoy para empezar otra.`
                : 'Haz tu primer depósito para empezar una racha.'}
          </Text>

          {/* Logros con niveles (calculados en el servidor) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 10 }}>
            <Text style={{ color: t.texto, fontWeight: '700', fontSize: 15 }}>Logros</Text>
            <Pressable onPress={onVerLogros} accessibilityLabel="Ver todos los logros" hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: t.acento, fontWeight: '700', fontSize: 13 }}>Ver todos</Text>
              <ChevronRight size={16} color={t.acento} />
            </Pressable>
          </View>
          {(datos.logros || []).map((l) => {
            const Icono = iconoDe(l);
            const color = colorDe(l, t.acento);
            return (
              <View key={l.id} style={[e.insignia, { backgroundColor: t.superficie, borderColor: t.borde }]}>
                <View style={[e.medalla, { backgroundColor: color + '26' }]}>
                  <Icono size={24} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: t.texto, fontWeight: '700', fontSize: 14 }}>{l.titulo}</Text>
                    <Text style={{ color, fontWeight: '800', fontSize: 12 }}>
                      {l.nivel === 0 ? 'Sin nivel' : `Nivel ${l.nivel}${l.nivel === l.niveles_totales ? ' (máx.)' : ''}`}
                    </Text>
                  </View>
                  <View style={[e.barra, { backgroundColor: darkMode ? '#27272a' : '#e7e5e4', marginVertical: 6 }]}>
                    <View style={[e.barraRelleno, { width: `${Math.round(l.avance * 100)}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={{ color: t.textoSuave, fontSize: 11 }}>
                    {l.meta === null ? `${l.valor} ${l.unidad}. ¡Nivel máximo!` : `${l.valor} / ${l.meta} ${l.unidad}`}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Insignias del catálogo (solo si hay alguna configurada) */}
          {datos.insignias_totales > 0 ? (
            <>
          <View style={[e.tarjeta, { backgroundColor: t.superficie, borderColor: t.borde, marginTop: 20, alignItems: 'stretch' }]}>
            <Text style={{ color: t.texto, fontWeight: '700', fontSize: 14 }}>
              {sig ? `Siguiente insignia: ${sig.nombre}` : 'Tienes todas las insignias disponibles'}
            </Text>
            <View style={[e.barra, { backgroundColor: darkMode ? '#27272a' : '#e7e5e4' }]}>
              <View style={[e.barraRelleno, { width: `${Math.round(avance * 100)}%`, backgroundColor: t.acento }]} />
            </View>
            <Text style={{ color: t.textoSuave, fontSize: 12 }}>
              {sig ? `Te ${sig.faltan === 1 ? 'falta' : 'faltan'} ${veces(sig.faltan)} (${datos.depositos} de ${sig.umbral_depositos}).` : '¡Gracias por reciclar!'}
            </Text>
          </View>

          {/* Colección de insignias */}
          <Text style={{ color: t.texto, fontWeight: '700', fontSize: 15, marginTop: 24, marginBottom: 10 }}>Mis insignias</Text>
          {datos.insignias.length === 0 ? (
            <Text style={{ color: t.textoSuave, fontSize: 13 }}>Aún no hay insignias configuradas.</Text>
          ) : (
            datos.insignias.map((i) => (
              <View
                key={i.id_insignia}
                style={[
                  e.insignia,
                  { backgroundColor: t.superficie, borderColor: i.desbloqueada ? t.acento : t.borde, opacity: i.desbloqueada ? 1 : 0.6 },
                ]}
              >
                <View style={[e.medalla, { backgroundColor: i.desbloqueada ? (darkMode ? 'rgba(245,158,11,0.15)' : '#fef3c7') : (darkMode ? '#27272a' : '#f5f5f4') }]}>
                  {i.desbloqueada ? <Award size={24} color={t.ambar} /> : <Lock size={20} color={t.textoSuave} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.texto, fontWeight: '700', fontSize: 14 }}>{i.nombre}</Text>
                  {i.descripcion ? <Text style={{ color: t.textoSuave, fontSize: 12 }}>{i.descripcion}</Text> : null}
                  <Text style={{ color: i.desbloqueada ? t.acentoFuerte : t.textoSuave, fontSize: 11, marginTop: 2 }}>
                    {i.desbloqueada ? `Desbloqueada el ${horaLocal(i.fecha_desbloqueo)}` : `Se desbloquea con ${veces(i.umbral_depositos)}`}
                  </Text>
                </View>
              </View>
            ))
          )}
            </>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

const e = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: 20, padding: 18, alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  saldo: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 8, marginTop: 14 },
  gema: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  fila: { flexDirection: 'row', gap: 10, marginTop: 16 },
  dato: { flex: 1, borderWidth: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center', gap: 2 },
  barra: { height: 10, borderRadius: 5, overflow: 'hidden', marginVertical: 10 },
  barraRelleno: { height: 10, borderRadius: 5 },
  insignia: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 10 },
  medalla: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  barraSuperior: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  flecha: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  boton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 8 },
});
