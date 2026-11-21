import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { KeyRound, Lock, LogOut } from 'lucide-react-native';
import Campo from '../../components/Campo';
import RequisitosClave from '../../components/RequisitosClave';
import { claveValida } from '../../utils/clave';
import { cambiarClave, marcarClaveCambiada } from '../../services/auth';
import { temaDe } from '../../tema';

/**
 * Primer inicio de sesión de un admin creado con contraseña temporal: debe crear la suya antes de usar el panel.
 * El servidor también lo bloquea (403 debe_cambiar_clave) hasta que la app avisa con marcarClaveCambiada.
 */
export default function CambiarClaveObligatoriaScreen({ darkMode, onListo, onSalir }) {
  const t = temaDe(darkMode);
  const [f, setF] = useState({ actual: '', nueva: '', repetir: '' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const guardar = async () => {
    setError('');
    if (!f.actual || !f.nueva || !f.repetir) return setError('Completa los tres campos.');
    if (!claveValida(f.nueva)) return setError('La nueva contraseña no cumple todos los requisitos.');
    if (f.nueva !== f.repetir) return setError('Las contraseñas nuevas no coinciden.');
    if (f.nueva === f.actual) return setError('La nueva contraseña debe ser distinta de la temporal.');
    setGuardando(true);
    try {
      await cambiarClave(f.actual, f.nueva);
      await marcarClaveCambiada();
      onListo();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 48 }} style={{ backgroundColor: t.fondoApp }} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <KeyRound size={40} color={t.acento} />
        <Text style={{ color: t.texto, fontWeight: '800', fontSize: 20, marginTop: 10 }}>Crea tu contraseña</Text>
        <Text style={{ color: t.textoSuave, fontSize: 13, textAlign: 'center', marginTop: 6 }}>
          Entraste con una contraseña temporal. Antes de usar el panel, reemplázala por una que solo tú conozcas.
        </Text>
      </View>
      <Campo darkMode={darkMode} Icono={Lock} etiqueta="Contraseña temporal" value={f.actual} onChangeText={set('actual')} secureTextEntry placeholder="La que te entregaron" />
      <Campo darkMode={darkMode} Icono={Lock} etiqueta="Contraseña nueva" value={f.nueva} onChangeText={set('nueva')} secureTextEntry placeholder="Mínimo 8 caracteres" />
      <RequisitosClave clave={f.nueva} darkMode={darkMode} />
      <Campo darkMode={darkMode} Icono={Lock} etiqueta="Repite la contraseña nueva" value={f.repetir} onChangeText={set('repetir')} secureTextEntry onSubmitEditing={guardar} returnKeyType="done" placeholder="••••••••" />
      {error ? <Text style={{ color: t.error, fontSize: 13, marginBottom: 10 }}>{error}</Text> : null}
      <Pressable onPress={guardar} disabled={guardando} style={{ backgroundColor: t.acento, borderRadius: 12, paddingVertical: 12, alignItems: 'center', opacity: guardando ? 0.6 : 1 }}>
        {guardando ? <ActivityIndicator color="#ffffff" /> : <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Guardar y entrar</Text>}
      </Pressable>
      <Pressable onPress={onSalir} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
        <LogOut size={16} color={t.textoSuave} />
        <Text style={{ color: t.textoSuave, fontWeight: '700', fontSize: 13 }}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}
