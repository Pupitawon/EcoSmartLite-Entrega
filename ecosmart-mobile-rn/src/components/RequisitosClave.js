import { Text, View } from 'react-native';
import { Check, Circle } from 'lucide-react-native';
import { evaluarClave } from '../utils/clave';
import { temaDe } from '../tema';

/** Lista de requisitos de la contraseña; cada uno se marca con un check verde al cumplirse. */
export default function RequisitosClave({ clave, darkMode }) {
  const t = temaDe(darkMode);
  return (
    <View style={{ marginBottom: 12, gap: 4 }}>
      {evaluarClave(clave).map((r) => (
        <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {r.ok ? <Check size={14} color={t.acento} strokeWidth={3} /> : <Circle size={14} color={t.textoSuave} />}
          <Text style={{ color: r.ok ? t.acentoFuerte : t.textoSuave, fontSize: 12 }}>{r.texto}</Text>
        </View>
      ))}
    </View>
  );
}
