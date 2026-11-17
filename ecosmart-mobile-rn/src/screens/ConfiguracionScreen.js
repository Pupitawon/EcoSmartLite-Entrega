import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { ArrowLeft, Bell, ChevronDown, ChevronUp, Lock, LogOut, Moon } from 'lucide-react-native';
import Campo from '../components/Campo';
import RequisitosClave from '../components/RequisitosClave';
import { claveValida } from '../utils/clave';
import { cambiarClave, guardarNotificaciones } from '../services/auth';
import { temaDe } from '../tema';

// 12345678-5 -> 12.345.678-5
const formatearRut = (rut) => (rut ? rut.replace(/^(\d+)-(.)$/, (_, n, dv) => `${n.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`) : '');

/**
 * Configuración (como la de Duolingo): datos de la cuenta, apariencia y Cerrar sesión al final.
 * Cerrar sesión pide confirmación para no salir por accidente.
 * La usan el ciudadano y el administrador: el administrador no tiene RUT ni notificaciones.
 */
export default function ConfiguracionScreen({ perfil, darkMode, toggleDarkMode, onVolver, onSalir, onPerfilActualizado }) {
  const t = temaDe(darkMode);
  const esAdmin = Boolean(perfil?.es_admin);
  const [confirmando, setConfirmando] = useState(false);
  const [notificaciones, setNotificaciones] = useState(perfil?.recibe_notificaciones !== false);
  const [guardandoNotif, setGuardandoNotif] = useState(false);
  const [errorNotif, setErrorNotif] = useState('');

  // Se cambia al instante y se guarda; si el servidor falla, vuelve al valor anterior.
  const cambiarNotificaciones = async (valor) => {
    const anterior = notificaciones;
    setNotificaciones(valor);
    setErrorNotif('');
    setGuardandoNotif(true);
    try {
      const actualizado = await guardarNotificaciones(valor);
      onPerfilActualizado?.(actualizado);
    } catch (err) {
      setNotificaciones(anterior);
      setErrorNotif(err.message);
    } finally {
      setGuardandoNotif(false);
    }
  };
  const [cambiando, setCambiando] = useState(false); // formulario "Cambiar contraseña" desplegado
  const [f, setF] = useState({ actual: '', nueva: '', repetir: '' });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { ok, texto }

  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const guardarClave = async () => {
    setMensaje(null);
    if (!f.actual || !f.nueva || !f.repetir) return setMensaje({ ok: false, texto: 'Completa los tres campos.' });
    if (!claveValida(f.nueva)) return setMensaje({ ok: false, texto: 'La nueva contraseña no cumple todos los requisitos.' });
    if (f.nueva !== f.repetir) return setMensaje({ ok: false, texto: 'Las contraseñas nuevas no coinciden.' });
    if (f.nueva === f.actual) return setMensaje({ ok: false, texto: 'La nueva contraseña debe ser distinta de la actual.' });
    setGuardando(true);
    try {
      await cambiarClave(f.actual, f.nueva);
      setF({ actual: '', nueva: '', repetir: '' });
      setMensaje({ ok: true, texto: 'Contraseña actualizada.' });
    } catch (err) {
      setMensaje({ ok: false, texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  const etiqueta = { color: t.textoSuave, fontWeight: '800', fontSize: 12, letterSpacing: 0.5, marginTop: 22, marginBottom: 10 };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 32 }} style={{ backgroundColor: t.fondoApp }}>
      {/* Barra superior: flecha para regresar al perfil y título */}
      <View style={e.barraSuperior}>
        <Pressable onPress={onVolver} accessibilityLabel="Volver" hitSlop={10} style={e.flecha}>
          <ArrowLeft size={22} color={t.texto} />
        </Pressable>
        <Text style={{ color: t.texto, fontWeight: '800', fontSize: 18 }}>Configuración</Text>
      </View>

      <Text style={[etiqueta, { marginTop: 8 }]}>CUENTA</Text>
      <View style={[e.tarjeta, { backgroundColor: t.superficie, borderColor: t.borde }]}>
        {esAdmin ? (
          <View style={e.dato}>
            <Text style={{ color: t.textoSuave, fontSize: 12 }}>Rol</Text>
            <Text style={{ color: t.texto, fontWeight: '600', fontSize: 15 }}>Administrador · Innova Recicla</Text>
          </View>
        ) : (
          <>
            <View style={e.dato}>
              <Text style={{ color: t.textoSuave, fontSize: 12 }}>Nombre</Text>
              <Text style={{ color: t.texto, fontWeight: '600', fontSize: 15 }}>{perfil?.nombre_completo}</Text>
            </View>
            <View style={[e.divisor, { backgroundColor: t.borde }]} />
            <View style={e.dato}>
              <Text style={{ color: t.textoSuave, fontSize: 12 }}>RUT</Text>
              <Text style={{ color: t.texto, fontWeight: '600', fontSize: 15 }}>{formatearRut(perfil?.rut) || '-'}</Text>
            </View>
          </>
        )}
        <View style={[e.divisor, { backgroundColor: t.borde }]} />
        <View style={e.dato}>
          <Text style={{ color: t.textoSuave, fontSize: 12 }}>Correo</Text>
          <Text style={{ color: t.texto, fontWeight: '600', fontSize: 15 }}>{perfil?.correo}</Text>
        </View>
      </View>

      <Text style={etiqueta}>SEGURIDAD</Text>
      <View style={[e.tarjeta, { backgroundColor: t.superficie, borderColor: t.borde }]}>
        <Pressable
          onPress={() => { setCambiando((v) => !v); setMensaje(null); }}
          accessibilityLabel="Cambiar contraseña"
          style={[e.dato, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}
        >
          <Lock size={20} color={t.texto} />
          <Text style={{ color: t.texto, fontWeight: '600', fontSize: 15, flex: 1 }}>Cambiar contraseña</Text>
          {cambiando ? <ChevronUp size={20} color={t.textoSuave} /> : <ChevronDown size={20} color={t.textoSuave} />}
        </Pressable>
        {cambiando ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 }}>
            <Campo darkMode={darkMode} Icono={Lock} etiqueta="Contraseña actual" value={f.actual} onChangeText={set('actual')} secureTextEntry placeholder="••••••••" />
            <Campo darkMode={darkMode} Icono={Lock} etiqueta="Contraseña nueva" value={f.nueva} onChangeText={set('nueva')} secureTextEntry placeholder="Mínimo 8 caracteres" />
            <RequisitosClave clave={f.nueva} darkMode={darkMode} />
            <Campo darkMode={darkMode} Icono={Lock} etiqueta="Repite la contraseña nueva" value={f.repetir} onChangeText={set('repetir')} secureTextEntry onSubmitEditing={guardarClave} returnKeyType="done" placeholder="••••••••" />
            {mensaje ? (
              <Text style={{ color: mensaje.ok ? t.acentoFuerte : t.error, fontSize: 13, marginBottom: 10 }}>{mensaje.texto}</Text>
            ) : null}
            <Pressable onPress={guardarClave} disabled={guardando} style={[e.guardar, { backgroundColor: t.acento, opacity: guardando ? 0.6 : 1 }]}>
              {guardando ? <ActivityIndicator color="#ffffff" /> : <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Guardar contraseña</Text>}
            </Pressable>
          </View>
        ) : null}
      </View>

      {!esAdmin ? (
        <>
          <Text style={etiqueta}>NOTIFICACIONES</Text>
          <View style={[e.tarjeta, { backgroundColor: t.superficie, borderColor: t.borde }]}>
            <View style={[e.dato, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
              <Bell size={20} color={t.texto} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.texto, fontWeight: '600', fontSize: 15 }}>Recibir notificaciones</Text>
                <Text style={{ color: t.textoSuave, fontSize: 12, marginTop: 2 }}>Avisos de EcoSmart sobre tus puntos y los contenedores</Text>
              </View>
              {guardandoNotif ? <ActivityIndicator size="small" color={t.acento} /> : null}
              <Switch
                value={notificaciones}
                onValueChange={cambiarNotificaciones}
                disabled={guardandoNotif}
                accessibilityLabel="Recibir notificaciones"
                trackColor={{ true: t.acento, false: darkMode ? '#3f3f46' : '#d6d3d1' }}
                thumbColor="#ffffff"
              />
            </View>
            {errorNotif ? (
              <Text style={{ color: t.error, fontSize: 12, paddingHorizontal: 16, paddingBottom: 12 }}>{errorNotif}</Text>
            ) : null}
          </View>
        </>
      ) : null}

      <Text style={etiqueta}>APARIENCIA</Text>
      <View style={[e.tarjeta, { backgroundColor: t.superficie, borderColor: t.borde }]}>
        <View style={[e.dato, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
          <Moon size={20} color={t.texto} />
          <Text style={{ color: t.texto, fontWeight: '600', fontSize: 15, flex: 1 }}>Modo oscuro</Text>
          <Switch
            value={darkMode}
            onValueChange={toggleDarkMode}
            accessibilityLabel="Modo oscuro"
            trackColor={{ true: t.acento, false: darkMode ? '#3f3f46' : '#d6d3d1' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Cerrar sesión, con confirmación para no salir por accidente */}
      <Pressable onPress={() => setConfirmando(true)} accessibilityLabel="Cerrar sesión" style={[e.cerrar, { borderColor: t.error }]}>
        <LogOut size={18} color={t.error} />
        <Text style={{ color: t.error, fontWeight: '800', fontSize: 14, letterSpacing: 0.5 }}>CERRAR SESIÓN</Text>
      </Pressable>

      <Modal visible={confirmando} transparent animationType="fade" onRequestClose={() => setConfirmando(false)}>
        <View style={e.fondoModal}>
          <View style={[e.cajaModal, { backgroundColor: t.superficie, borderColor: t.borde }]}>
            <Text style={{ color: t.texto, fontWeight: '700', fontSize: 17 }}>¿Cerrar sesión?</Text>
            <Text style={{ color: t.textoSuave, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
              Tendrás que volver a iniciar sesión.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18, alignSelf: 'stretch' }}>
              <Pressable onPress={() => setConfirmando(false)} style={[e.botonModal, { borderColor: t.borde }]}>
                <Text style={{ color: t.texto, fontWeight: '600' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => { setConfirmando(false); onSalir(); }}
                style={[e.botonModal, { backgroundColor: t.error, borderColor: t.error }]}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700' }}>Cerrar sesión</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const e = StyleSheet.create({
  barraSuperior: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  flecha: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tarjeta: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  dato: { paddingHorizontal: 16, paddingVertical: 12, gap: 2 },
  guardar: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  divisor: { height: 1 },
  cerrar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 13, marginTop: 32 },
  fondoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  cajaModal: { width: '100%', maxWidth: 340, borderWidth: 1, borderRadius: 20, padding: 20, alignItems: 'center' },
  botonModal: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
});
