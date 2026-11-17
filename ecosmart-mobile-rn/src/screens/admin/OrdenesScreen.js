import { useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { ArrowRight, CheckCircle2, ClipboardList, Trash2, User } from 'lucide-react-native';
import { temaDe } from '../../tema';
import { useAdminData } from '../../admin/AdminData';
import { Boton, Etiqueta, Filtros, PantallaAdmin, Tarjeta, Vacio } from '../../admin/ui';
import { COLOR, COLOR_PRIORIDAD, COLUMNAS_OT, hace } from '../../admin/utils';

/**
 * Órdenes de trabajo: Pendiente → Asignada → En terreno → Ejecutada → Verificada → Cerrada.
 * Se crean desde un contenedor, una alerta o un reporte ciudadano.
 */
export default function OrdenesScreen() {
  const { ordenes, avanzarOrden, eliminarOrden, ahora, darkMode } = useAdminData();
  const t = temaDe(darkMode);
  const [columna, setColumna] = useState('abiertas');

  const abiertas = ordenes.filter((o) => o.estado !== 'Cerrada');
  const lista = columna === 'abiertas' ? abiertas : columna === 'todas' ? ordenes : ordenes.filter((o) => o.estado === columna);

  const confirmarEliminar = (id) => {
    const texto = `¿Eliminar ${id}? No se puede deshacer.`;
    if (Platform.OS === 'web') {
      if (window.confirm(texto)) eliminarOrden(id); // Alert con botones no existe en la web
      return;
    }
    Alert.alert('Eliminar orden', texto, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => eliminarOrden(id) },
    ]);
  };

  return (
    <PantallaAdmin icono={ClipboardList} titulo="Órdenes de trabajo" mostrarActualizado={false}>
      <Filtros
        valor={columna}
        onCambiar={setColumna}
        opciones={[
          { id: 'abiertas', label: 'Abiertas', count: abiertas.length },
          ...COLUMNAS_OT.map((c) => ({ id: c, label: c, count: ordenes.filter((o) => o.estado === c).length })),
          { id: 'todas', label: 'Todas', count: ordenes.length },
        ]}
      />

      {lista.length === 0 ? (
        <Vacio>
          {ordenes.length
            ? 'No hay órdenes en este estado.'
            : 'Aún no hay órdenes. Créalas desde un contenedor, una alerta o un reporte ciudadano.'}
        </Vacio>
      ) : (
        <View style={{ gap: 8 }}>
          {lista.map((o) => {
            const idx = COLUMNAS_OT.indexOf(o.estado);
            const sig = COLUMNAS_OT[idx + 1];
            return (
              <Tarjeta key={o.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 11, color: t.textoSuave }}>{o.id} · Contenedor #{o.contenedor}</Text>
                  <View style={{ marginLeft: 'auto' }}>
                    <Etiqueta texto={o.prioridad} color={COLOR_PRIORIDAD[o.prioridad] || COLOR.gris} />
                  </View>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', marginTop: 4, color: t.texto }}>{o.tipo}</Text>
                <Text numberOfLines={1} style={{ fontSize: 11, color: t.textoSuave }}>{o.lugar}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <User size={11} color={COLOR.gris} />
                  <Text style={{ fontSize: 11, color: t.textoSuave }}>{o.tecnico}</Text>
                  {o.actualizada && <Text style={{ fontSize: 10, marginLeft: 'auto', color: t.textoSuave }}>{hace(o.actualizada, ahora)}</Text>}
                </View>

                {/* Avance del flujo */}
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 10 }}>
                  {COLUMNAS_OT.map((c, i) => (
                    <View key={c} style={{ flex: 1, height: 4, borderRadius: 99, backgroundColor: i <= idx ? COLOR.verde : t.borde }} />
                  ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: t.textoSuave }}>
                    {o.estado} · {idx + 1}/{COLUMNAS_OT.length}
                  </Text>
                  <View style={{ marginLeft: 'auto', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <Boton variante="peligro" icono={Trash2} accessibilityLabel={`Eliminar ${o.id}`} onPress={() => confirmarEliminar(o.id)} />
                    {sig ? (
                      <Boton variante="primario" icono={ArrowRight} onPress={() => avanzarOrden(o.id)}>{sig}</Boton>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={14} color={COLOR.verde} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: COLOR.verde }}>Completa</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Tarjeta>
            );
          })}
        </View>
      )}
    </PantallaAdmin>
  );
}
