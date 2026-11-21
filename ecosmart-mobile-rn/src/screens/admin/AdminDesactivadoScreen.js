import { Pressable, Text, View } from 'react-native';
import { LogOut, ShieldOff } from 'lucide-react-native';
import { temaDe } from '../../tema';

/** Cuenta de administrador desactivada por el súper usuario (y sin perfil de ciudadano). */
export default function AdminDesactivadoScreen({ darkMode, onSalir }) {
  const t = temaDe(darkMode);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: t.fondoApp }}>
      <ShieldOff size={44} color={t.error} />
      <Text style={{ color: t.texto, fontWeight: '800', fontSize: 20, marginTop: 12, textAlign: 'center' }}>Tu acceso de administrador fue desactivado</Text>
      <Text style={{ color: t.textoSuave, fontSize: 13, marginTop: 8, textAlign: 'center' }}>
        Si crees que es un error, contacta al súper usuario de Innova Recicla.
      </Text>
      <Pressable onPress={onSalir} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, borderWidth: 1, borderColor: t.error, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12 }}>
        <LogOut size={18} color={t.error} />
        <Text style={{ color: t.error, fontWeight: '800', fontSize: 14 }}>CERRAR SESIÓN</Text>
      </Pressable>
    </View>
  );
}
