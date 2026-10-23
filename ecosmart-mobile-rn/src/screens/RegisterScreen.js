import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, CreditCard, Lock, Mail, User } from 'lucide-react-native';
import Campo from '../components/Campo';
import { mensajeError, registrar } from '../services/auth';
import { temaDe } from '../tema';

const capitalizar = (v) => v.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

const formatearRut = (v) => {
  const limpio = v.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);
  return limpio.length > 1 ? `${limpio.slice(0, -1)}-${limpio.slice(-1)}` : limpio;
};

export default function RegisterScreen({ darkMode, onRegistered, onBack }) {
  const t = temaDe(darkMode);
  const [f, setF] = useState({ nombre: '', rut: '', correo: '', clave: '', clave2: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
    const set = (k) => (v) => setF((p) => ({ ...p, [k]: k === 'rut' ? formatearRut(v) : k === 'nombre' ? capitalizar(v) : v }));

  async function enviar() {
    if (f.nombre.trim().length < 2 || !f.rut || !f.correo.trim() || !f.clave) return setError('Completa todos los campos.');
    if (f.clave.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (f.clave !== f.clave2) return setError('Las contraseñas no coinciden.');
    setError('');
    setCargando(true);
    try {
          const perfil = await registrar({ correo: f.correo.trim(), clave: f.clave, rut: f.rut, nombre_completo: capitalizar(f.nombre.trim()) });
      onRegistered(perfil);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled" style={{ backgroundColor: t.fondoApp }}>
      <View style={[e.tarjeta, { backgroundColor: t.superficie, borderColor: t.borde }]}>
        <Pressable onPress={onBack} style={e.volver}>
          <ArrowLeft size={14} color={t.textoSuave} />
          <Text style={{ fontSize: 12, color: t.textoSuave, marginLeft: 4 }}>Volver</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '800', color: t.texto, marginBottom: 16 }}>Crear cuenta</Text>

        <Campo darkMode={darkMode} Icono={User} etiqueta="Nombre completo" value={f.nombre} onChangeText={set('nombre')} autoCapitalize="words" autoComplete="name" placeholder="Ana Pérez" />
        <Campo darkMode={darkMode} Icono={CreditCard} etiqueta="RUT" value={f.rut} onChangeText={set('rut')} autoCapitalize="characters" placeholder="12345678-5" />
        <Campo darkMode={darkMode} Icono={Mail} etiqueta="Correo" value={f.correo} onChangeText={set('correo')} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="tucorreo@ejemplo.cl" />
        <Campo darkMode={darkMode} Icono={Lock} etiqueta="Contraseña" value={f.clave} onChangeText={set('clave')} secureTextEntry placeholder="Mínimo 6 caracteres" />
        <Campo darkMode={darkMode} Icono={Lock} etiqueta="Repite la contraseña" value={f.clave2} onChangeText={set('clave2')} secureTextEntry placeholder="••••••••" />

        {!!error && <Text style={{ color: t.error, fontSize: 12, fontWeight: '500', marginBottom: 8 }}>{error}</Text>}

        <Pressable onPress={enviar} disabled={cargando} style={[e.boton, { opacity: cargando ? 0.6 : 1 }]}>
          {cargando ? <ActivityIndicator color="#fff" /> : <Text style={e.botonTxt}>Registrarme</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const e = StyleSheet.create({
  tarjeta: { borderWidth: 1, borderRadius: 24, padding: 24 },
  volver: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, alignSelf: 'flex-start' },
  boton: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: '#059669' },
  botonTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
