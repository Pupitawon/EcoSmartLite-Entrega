import { Children, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ClipboardPlus, MapPin, X } from 'lucide-react-native';
import { temaDe } from '../tema';
import { useAdminData } from './AdminData';
import { Boton, Etiqueta, Filtros, Progreso } from './ui';
import {
  COLOR,
  COLOR_REPORTE,
  CONEXION,
  ESTADO_REPORTE,
  PRIORIDADES,
  TECNICOS,
  TIPOS_OT,
  TIPO_REPORTE,
  hace,
  material,
  sugerenciaOrden,
  ubicacion,
} from './utils';

/**
 * Hoja inferior del administrador: detalle de un contenedor o formulario de nueva orden de trabajo.
 * Una sola Modal para ambos (en iOS no se pueden abrir dos Modal seguidas sin esperar la animación).
 */
export default function AdminHoja() {
  const { hoja, cerrarHoja, darkMode, porId } = useAdminData();
  const t = temaDe(darkMode);
  const c = hoja ? porId[hoja.id] : null;
  const visible = Boolean(hoja && c);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={cerrarHoja}>
      <View style={e.fondo}>
        <Pressable style={{ flex: 1 }} onPress={cerrarHoja} accessibilityLabel="Cerrar" />
        <View style={[e.hoja, { backgroundColor: t.fondoApp, borderColor: t.borde }]}>
          {visible && (hoja.tipo === 'orden' ? <NuevaOrden c={c} tipoReporte={hoja.tipoReporte} /> : <Detalle c={c} />)}
        </View>
      </View>
    </Modal>
  );
}

function Cabecera({ titulo, subtitulo }) {
  const { cerrarHoja, darkMode } = useAdminData();
  const t = temaDe(darkMode);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: t.texto }}>{titulo}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <MapPin size={12} color={t.textoSuave} />
          <Text style={{ fontSize: 12, color: t.textoSuave }}>{subtitulo}</Text>
        </View>
      </View>
      <Pressable onPress={cerrarHoja} accessibilityLabel="Cerrar" style={[e.cerrar, { backgroundColor: t.superficie }]}>
        <X size={16} color={t.textoCampo} />
      </Pressable>
    </View>
  );
}

function Detalle({ c }) {
  const { cr, alertas, reportes, ahora, darkMode, abrirNuevaOrden, config } = useAdminData();
  const t = temaDe(darkMode);
  const nunca = cr.sinLectura(c);
  const estado = cr.estadoDe(c);
  const conexion = CONEXION[c.estado_conexion];
  const hist = alertas.filter((a) => a.id_contenedor === c.id_contenedor && a.estado_alerta !== 'duplicada').slice(0, 6);
  const reps = reportes.filter((r) => r.id_contenedor === c.id_contenedor).slice(0, 6);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Cabecera titulo={`Contenedor #${c.id_contenedor}`} subtitulo={`${material(c)} · ${ubicacion(c)}`} />

      <Text style={[e.rotulo, { color: t.textoSuave }]}>Último nivel de llenado</Text>
      <Text style={{ fontSize: 36, fontWeight: '900', color: nunca ? COLOR.gris : cr.colorLlenado(c.porcentaje_llenado) }}>
        {nunca ? '—' : `${Math.round(c.porcentaje_llenado)}%`}
      </Text>
      <View style={{ marginTop: 8 }}>
        <Progreso pct={nunca ? 0 : c.porcentaje_llenado} color={cr.colorLlenado(c.porcentaje_llenado)} alto={8} />
      </View>

      <View style={e.datos}>
        <Dato etiqueta="Estado" valor={estado.txt} color={estado.color} t={t} />
        <Dato etiqueta="Última lectura" valor={hace(c.fecha_ultima_lectura, ahora)} t={t} />
        <Dato etiqueta="Reporte" valor={cr.sinReporte(c) ? 'Sin reporte' : 'Al día'} color={cr.sinReporte(c) ? COLOR.ambar : undefined} t={t} />
        <Dato
          etiqueta="Conexión del sensor"
          valor={conexion ? `${conexion.txt}${c.minutos_sin_lectura != null ? ` · ${c.minutos_sin_lectura} min` : ''}` : '—'}
          color={conexion?.color}
          t={t}
        />
        <Dato etiqueta="Umbral de alerta" valor={`${config.umbral_alerta}%`} t={t} />
      </View>

      <Lista titulo="Historial de alertas" vacio="Sin alertas registradas" t={t}>
        {hist.map((a) => (
          <Fila
            key={a.id_alerta}
            t={t}
            izquierda={`${a.estado_alerta === 'pendiente' ? 'Alerta activa' : 'Resuelta'}${a.porcentaje_disparo != null ? ` · ${Math.round(a.porcentaje_disparo)}%` : ''}`}
            derecha={hace(a.fecha_generacion, ahora)}
          />
        ))}
      </Lista>

      <Lista titulo="Reportes ciudadanos" vacio="Sin reportes ciudadanos" t={t}>
        {reps.map((r) => (
          <Fila
            key={r.id_reporte}
            t={t}
            izquierda={TIPO_REPORTE[r.tipo_anomalia] || r.tipo_anomalia}
            etiqueta={<Etiqueta texto={ESTADO_REPORTE[r.estado_revision] || r.estado_revision} color={COLOR_REPORTE[r.estado_revision] || COLOR.gris} />}
            derecha={hace(r.fecha_reporte, ahora)}
          />
        ))}
      </Lista>

      <View style={{ marginTop: 20 }}>
        <Boton grande variante="primario" icono={ClipboardPlus} onPress={() => abrirNuevaOrden(c.id_contenedor)}>
          Crear orden de trabajo
        </Boton>
      </View>
    </ScrollView>
  );
}

function Dato({ etiqueta, valor, color, t }) {
  return (
    <View style={{ width: '50%', paddingRight: 8 }}>
      <Text style={[e.rotulo, { color: t.textoSuave, marginBottom: 0 }]}>{etiqueta}</Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: color || t.texto }}>{valor}</Text>
    </View>
  );
}

function Lista({ titulo, vacio, t, children }) {
  const hijos = Children.toArray(children);
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={[e.rotulo, { color: t.textoSuave }]}>{titulo}</Text>
      <View style={{ borderWidth: 1, borderRadius: 12, borderColor: t.borde, backgroundColor: t.superficie }}>
        {hijos.length ? hijos : <Fila t={t} izquierda={vacio} derecha="—" />}
      </View>
    </View>
  );
}

function Fila({ izquierda, derecha, etiqueta, t }) {
  return (
    <View style={[e.fila, { borderBottomColor: t.borde }]}>
      <Text numberOfLines={1} style={{ fontSize: 12, flexShrink: 1, color: t.texto }}>{izquierda}</Text>
      {etiqueta}
      <Text style={{ fontSize: 11, marginLeft: 'auto', color: t.textoSuave }}>{derecha}</Text>
    </View>
  );
}

function NuevaOrden({ c, tipoReporte }) {
  const { cr, darkMode, crearOrden, cerrarHoja } = useAdminData();
  const t = temaDe(darkMode);
  const inicial = sugerenciaOrden(c, tipoReporte, cr);
  const [tipo, setTipo] = useState(inicial.tipo);
  const [prioridad, setPrioridad] = useState(inicial.prioridad);
  const [tecnico, setTecnico] = useState(TECNICOS[0]);

  // Si se abre para otro contenedor, recalcula la sugerencia.
  useEffect(() => {
    setTipo(inicial.tipo);
    setPrioridad(inicial.prioridad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.id_contenedor, tipoReporte]);

  const opciones = (lista) => lista.map((x) => ({ id: x, label: x }));
  const campo = (titulo, hijos) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', marginBottom: 8, color: t.textoCampo }}>{titulo}</Text>
      {hijos}
    </View>
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Cabecera titulo="Nueva orden de trabajo" subtitulo={`Contenedor #${c.id_contenedor} · ${material(c)}`} />
      {tipoReporte && (
        <Text style={{ fontSize: 12, marginBottom: 12, color: t.textoSuave }}>
          Desde reporte ciudadano: {TIPO_REPORTE[tipoReporte] || tipoReporte}
        </Text>
      )}
      {campo('Tipo de actividad', <Filtros opciones={opciones(TIPOS_OT)} valor={tipo} onCambiar={setTipo} />)}
      {campo('Prioridad', <Filtros opciones={opciones(PRIORIDADES)} valor={prioridad} onCambiar={setPrioridad} />)}
      {campo('Técnico responsable', <Filtros opciones={opciones(TECNICOS)} valor={tecnico} onCambiar={setTecnico} />)}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <View style={{ flex: 1 }}>
          <Boton grande onPress={cerrarHoja}>Cancelar</Boton>
        </View>
        <View style={{ flex: 1 }}>
          <Boton
            grande
            variante="primario"
            icono={ClipboardPlus}
            onPress={() => crearOrden({ id_contenedor: c.id_contenedor, tipo, prioridad, tecnico })}
          >
            Crear orden
          </Boton>
        </View>
      </View>
    </ScrollView>
  );
}

const e = StyleSheet.create({
  fondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  hoja: {
    maxHeight: '85%',
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  cerrar: { padding: 8, borderRadius: 999 },
  rotulo: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  datos: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, rowGap: 12 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
});
