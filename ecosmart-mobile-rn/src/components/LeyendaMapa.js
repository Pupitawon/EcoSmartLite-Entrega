import { StyleSheet, Text, View } from 'react-native';
import { STATUS_META, temaDe } from '../tema';

/** Leyenda de colores de los pines, abajo a la izquierda del mapa. La usan el ciudadano y el admin. */
export default function LeyendaMapa({ darkMode }) {
  const t = temaDe(darkMode);
  return (
    <View style={[e.leyenda, { backgroundColor: darkMode ? 'rgba(9,9,11,0.85)' : 'rgba(255,255,255,0.92)', borderColor: t.borde }]}>
      {['low', 'medium', 'full', 'unknown'].map((k, i) => (
        <View key={k} style={e.leyendaFila}>
          <View style={[e.punto, { backgroundColor: STATUS_META[k].color }]} />
          <Text style={{ fontSize: 10, fontWeight: '500', color: t.textoCampo }}>
            {['Verde', 'Amarillo', 'Rojo', 'Gris'][i]} · {STATUS_META[k].label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const e = StyleSheet.create({
  leyenda: { zIndex: 10, position: 'absolute', left: 12, bottom: 12, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  leyendaFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  punto: { width: 10, height: 10, borderRadius: 5 },
});
