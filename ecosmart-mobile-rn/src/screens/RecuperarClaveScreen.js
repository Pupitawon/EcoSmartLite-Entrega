import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, CreditCard, Mail } from 'lucide-react-native';
import Campo from '../components/Campo';
import { mensajeError, recuperarClave } from '../services/auth';
import { temaDe } from '../tema';

const formatearRut = (v) => {
  const limpio = v.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);
  return limpio.length > 1 ? `${limpio.slice(0, -1)}-${limpio.slice(-1)}` : limpio;
};

export default function RecuperarClaveScreen({ darkMode, onBack }) {
  const t = temaDe(darkMode);
  const [correo, setCorreo] = useState('');
  const [rut, setRut] = useState('');
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function enviar() {
    if (!correo.trim() || !rut) {
      setError('Completa tu correo y tu RUT.');
      return;
    }
    setError('');
    setCargando(true);
    try {
      await recuperarClave(correo, rut);
      setEnviado(true);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={e.contenido} keyboardShouldPersistTaps="handled" style={{ backgroundColor: t.fondoApp }}>
      <View style={[e.tarjeta, { backgroundColor: t.superficie, borderColor: t.borde }]}>
        <Pressable onPress={onBack} style={e.volver}>
          <ArrowLeft size={14} color={t.textoSuave} />
          <Text style={{ fontSize: 12, color: t.textoSuave, marginLeft: 4 }}>Volver</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '800', color: t.texto, marginBottom: 6 }}>Recuperar contraseña</Text>

        {enviado ? (
          <>
            <Text style={{ color: '#10b981', fontSize: 13, fontWeight: '500', marginTop: 8, lineHeight: 19 }}>
              Si los datos coinciden con una cuenta, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y también la carpeta de spam.
            </Text>
            <Pressable onPress={onBack} style={[e.boton, { marginTop: 20 }]}>
              <Text style={e.botonTxt}>Volver a iniciar sesión</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 12, color: t.textoSuave, marginBottom: 16, lineHeight: 18 }}>
              Ingresa el correo y el RUT con los que te registraste. Te enviaremos un enlace para crear una contraseña nueva.
            </Text>

            <Campo
              darkMode={darkMode}
              Icono={Mail}
              etiqueta="Correo"
              value={correo}
              onChangeText={setCorreo}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="tucorreo@ejemplo.cl"
            />
            <Campo
              darkMode={darkMode}
              Icono={CreditCard}
              etiqueta="RUT"
              value={rut}
              onChangeText={(v) => setRut(formatearRut(v))}
              autoCapitalize="characters"
              placeholder="12345678-5"
            />

            {!!error && <Text style={{ color: t.error, fontSize: 12, fontWeight: '500', marginBottom: 8 }}>{error}</Text>}

            <Pressable onPress={enviar} disabled={cargando} style={[e.boton, { opacity: cargando ? 0.6 : 1 }]}>
              {cargando ? <ActivityIndicator color="#fff" /> : <Text style={e.botonTxt}>Enviar enlace</Text>}
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const e = StyleSheet.create({
  contenido: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  tarjeta: { borderWidth: 1, borderRadius: 24, padding: 24 },
  volver: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, alignSelf: 'flex-start' },
  boton: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: '#059669' },
  botonTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});