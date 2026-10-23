import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Lock, User } from 'lucide-react-native';
import Campo from '../components/Campo';
import { iniciarSesion, mensajeError } from '../services/auth';
import { temaDe } from '../tema';

const logoClaro = require('../../assets/logos/logo-claro.png');
const logoOscuro = require('../../assets/logos/logo-oscuro.png');

export default function LoginScreen({ darkMode, onLogin, onGoToRegister }) {
  const t = temaDe(darkMode);
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar() {
    if (!correo.trim() || !clave.trim()) {
      setError('Completa correo y contraseña para continuar.');
      return;
    }
    setError('');
    setCargando(true);
    try {
      const perfil = await iniciarSesion(correo.trim(), clave);
      if (!perfil) {
        setError('Tu cuenta no completó el registro. Regístrate de nuevo con ese correo.');
        return;
      }
      onLogin(perfil);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={e.contenido} keyboardShouldPersistTaps="handled" style={{ backgroundColor: t.fondoApp }}>
      <View style={e.marca}>
        <Image source={darkMode ? logoOscuro : logoClaro} style={e.logo} resizeMode="contain" />
        <Text style={{ fontSize: 24, fontWeight: '800' }}>
          <Text style={{ color: '#10b981' }}>ECO</Text>
          <Text style={{ color: t.texto }}>SMART</Text>
        </Text>
        <Text style={{ fontSize: 12, marginTop: 4, color: t.textoSuave }}>Bienvenido de vuelta</Text>
      </View>

      <View style={[e.tarjeta, { backgroundColor: t.superficie, borderColor: t.borde }]}>
        <Campo
          darkMode={darkMode}
          Icono={User}
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
          Icono={Lock}
          etiqueta="Contraseña"
          value={clave}
          onChangeText={setClave}
          secureTextEntry
          placeholder="••••••••"
        />

        {!!error && <Text style={{ color: t.error, fontSize: 12, fontWeight: '500', marginBottom: 8 }}>{error}</Text>}

        <Pressable
          onPress={enviar}
          disabled={cargando}
          style={[e.boton, { backgroundColor: '#059669', opacity: cargando ? 0.6 : 1 }]}
        >
          {cargando ? <ActivityIndicator color="#fff" /> : <Text style={e.botonTxt}>Iniciar Sesión</Text>}
        </Pressable>

        <Pressable onPress={onGoToRegister} style={{ marginTop: 16 }}>
          <Text style={{ textAlign: 'center', fontSize: 12, color: t.textoSuave }}>
            ¿No tienes cuenta? <Text style={{ fontWeight: '700', color: '#10b981' }}>Regístrate</Text>
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const e = StyleSheet.create({
  contenido: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  marca: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 80, height: 80, marginBottom: 12, borderRadius: 16 },
  tarjeta: { borderWidth: 1, borderRadius: 24, padding: 24 },
  boton: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  botonTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
