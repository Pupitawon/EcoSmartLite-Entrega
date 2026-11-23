import { consejoDelDia, saludoDe } from '../utils/consejos';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Flame, Lightbulb, X } from 'lucide-react-native';
import { obtenerDesafios } from '../services/desafios';
import { consejoDelDia } from '../utils/consejos';
import { temaDe } from '../tema';

/**
 * Tarjeta del mapa con el consejo del día y, si hoy aún no se recicla, un recordatorio (con la racha si hay una).
 * Si el usuario apagó las notificaciones en Configuración, no se muestra.
 */
export default function AvisoReciclaje({ darkMode, racha = 0, saldo, notificaciones = true }) {
  const t = temaDe(darkMode);
  const [reciclo, setReciclo] = useState(null); // null = todavía no se sabe
  const [cerrado, setCerrado] = useState(false);

  // Se vuelve a mirar cuando cambia el saldo (un depósito nuevo apaga el recordatorio).
  useEffect(() => {
    obtenerDesafios()
      .then((d) => setReciclo(!!d.dia.desafios.find((x) => x.id === 'primer_deposito')?.completado))
      .catch(() => setReciclo(null));
  }, [saldo]);

  if (!notificaciones || cerrado) return null;

  const recordar = reciclo === false;
  const saludo = saludoDe();
  const recordatorio = racha > 0
    ? `${saludo}, no olvides reciclar para extender tu racha de ${racha} ${racha === 1 ? 'día' : 'días'}.`
    : `${saludo}, recicla hoy para iniciar una nueva racha.`;

  return (
    <View style={[e.tarjeta, { backgroundColor: t.superficie, borderColor: recordar ? '#f97316' : t.borde }]}>
      <View style={{ flex: 1, gap: 6 }}>
        {recordar ? (
          <View style={e.fila}>
            <Flame size={16} color="#f97316" />
            <Text style={{ color: t.texto, fontSize: 13, fontWeight: '700', flex: 1 }}>{recordatorio}</Text>
          </View>
        ) : null}
        <View style={e.fila}>
          <Lightbulb size={16} color={t.acento} />
          <Text style={{ color: t.textoSuave, fontSize: 12, flex: 1 }}>{consejoDelDia()}</Text>
        </View>
      </View>
      <Pressable onPress={() => setCerrado(true)} accessibilityLabel="Cerrar aviso" style={{ padding: 4 }}>
        <X size={14} color={t.textoSuave} />
      </Pressable>
    </View>
  );
}

const e = StyleSheet.create({
  tarjeta: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
});