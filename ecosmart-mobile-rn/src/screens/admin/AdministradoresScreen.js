import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { ArrowLeft, Copy, IdCard, KeyRound, Mail, Phone, Server, User, UserPlus } from 'lucide-react-native';
import Campo from '../../components/Campo';
import { cambiarActivo, crearAdministrador, listarAdministradores, reenviarCorreo } from '../../services/administradores';
import { estadoAdmin, telefonoVisible } from '../../admin/administradoresVista';
import { temaDe } from '../../tema';

const VACIO = { nombre_completo: '', correo: '', telefono: '', rut: '' };

/**
 * Administradores (solo súper usuario): crear uno nuevo y desactivar, reactivar o reenviar el correo.
 * Por defecto Firebase le envía "crea tu contraseña"; con la casilla, se muestra una contraseña temporal una sola vez.
 */
export default function AdministradoresScreen({ darkMode, onVolver }) {
  const t = temaDe(darkMode);
  const [lista, setLista] = useState(null); // { administradores, definidos_en_servidor }
  const [errorLista, setErrorLista] = useState('');
  const [f, setF] = useState(VACIO);
  const [temporal, setTemporal] = useState(false);
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { ok, texto }
  const [clave, setClave] = useState(null); // { correo, clave } — se muestra una sola vez
  const [copiada, setCopiada] = useState(false);
  const [ocupado, setOcupado] = useState(null); // id_admin con una acción en curso

  const cargar = useCallback(async () => {
    setErrorLista('');
    try {
      setLista(await listarAdministradores());
    } catch (err) {
      setErrorLista(err.message);
    }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const crear = async () => {
    setMensaje(null);
    setClave(null);
    if (!f.nombre_completo.trim() || !f.correo.trim() || !f.telefono.trim() || !f.rut.trim()) {
      return setMensaje({ ok: false, texto: 'Completa nombre, correo, teléfono y RUT.' });
    }
    setCreando(true);
    try {
      const r = await crearAdministrador({ ...f, modo: temporal ? 'temporal' : 'enlace' });
      setF(VACIO);
      setTemporal(false);
      if (r.clave_temporal) {
        setCopiada(false);
        setClave({ correo: r.administrador.correo, clave: r.clave_temporal });
        setMensaje({ ok: true, texto: `Administrador creado. Entrégale esta contraseña a ${r.administrador.nombre_completo}.` });
      } else {
        setMensaje({ ok: !r.aviso, texto: r.aviso || `Administrador creado. Le enviamos a ${r.administrador.correo} el correo para crear su contraseña.` });
      }
      cargar();
    } catch (err) {
      setMensaje({ ok: false, texto: err.message });
    } finally {
      setCreando(false);
    }
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(clave.clave);
      setCopiada(true);
    } catch {
      setCopiada(false);
    }
  };

  const accion = async (a, fn, ok) => {
    setOcupado(a.id_admin);
    setMensaje(null);
    try {
      await fn();
      setMensaje({ ok: true, texto: ok });
      cargar();
    } catch (err) {
      setMensaje({ ok: false, texto: err.message });
    } finally {
      setOcupado(null);
    }
  };

  const etiqueta = { color: t.textoSuave, fontWeight: '800', fontSize: 12, letterSpacing: 0.5, marginTop: 22, marginBottom: 10 };

  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 32 }} style={{ backgroundColor: t.fondoApp }} keyboardShouldPersistTaps="handled">
      <View style={e.barraSuperior}>
        <Pressable onPress={onVolver} accessibilityLabel="Volver" hitSlop={10} style={e.flecha}>
          <ArrowLeft size={22} color={t.texto} />
        </Pressable>
        <Text style={{ color: t.texto, fontWeight: '800', fontSize: 18 }}>Administradores</Text>
      </View>

      <Text style={[etiqueta, { marginTop: 8 }]}>NUEVO ADMINISTRADOR</Text>
      <View style={[e.tarjeta, { backgroundColor: t.superficie, borderColor: t.borde, padding: 16 }]}>
        <Campo darkMode={darkMode} Icono={User} etiqueta="Nombre completo" value={f.nombre_completo} onChangeText={set('nombre_completo')} placeholder="Ana Pérez" />
        <Campo darkMode={darkMode} Icono={Mail} etiqueta="Correo" value={f.correo} onChangeText={set('correo')} placeholder="ana@innovarecicla.cl" autoCapitalize="none" keyboardType="email-address" />
        <Campo darkMode={darkMode} Icono={Phone} etiqueta="Teléfono" value={f.telefono} onChangeText={set('telefono')} placeholder="9 1234 5678" keyboardType="phone-pad" />
        <Campo darkMode={darkMode} Icono={IdCard} etiqueta="RUT" value={f.rut} onChangeText={set('rut')} placeholder="12345678-5" autoCapitalize="characters" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <KeyRound size={18} color={t.texto} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.texto, fontWeight: '600', fontSize: 14 }}>Darle contraseña temporal</Text>
            <Text style={{ color: t.textoSuave, fontSize: 12 }}>
              {temporal ? 'Se mostrará una sola vez y deberá cambiarla al entrar.' : 'Si no, le llega un correo para crear su contraseña.'}
            </Text>
          </View>
          <Switch value={temporal} onValueChange={setTemporal} accessibilityLabel="Darle contraseña temporal" trackColor={{ true: t.acento, false: darkMode ? '#3f3f46' : '#d6d3d1' }} thumbColor="#ffffff" />
        </View>
        <Pressable onPress={crear} disabled={creando} style={[e.boton, { backgroundColor: t.acento, opacity: creando ? 0.6 : 1 }]}>
          {creando ? <ActivityIndicator color="#ffffff" /> : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <UserPlus size={18} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>Crear administrador</Text>
            </View>
          )}
        </Pressable>
      </View>

      {mensaje ? <Text style={{ color: mensaje.ok ? t.acentoFuerte : t.error, fontSize: 13, marginTop: 12 }}>{mensaje.texto}</Text> : null}

      {clave ? (
        <View style={[e.tarjeta, { backgroundColor: t.superficie, borderColor: t.ambar || '#f59e0b', padding: 16, marginTop: 12, gap: 8 }]}>
          <Text style={{ color: t.textoSuave, fontSize: 12 }}>Contraseña temporal de {clave.correo}</Text>
          <Text selectable style={{ color: t.texto, fontSize: 20, fontWeight: '800', letterSpacing: 1 }}>{clave.clave}</Text>
          <Text style={{ color: t.error, fontSize: 12, fontWeight: '700' }}>No se volverá a mostrar. Cópiala y entrégasela en persona o por un canal privado.</Text>
          {Platform.OS === 'web' ? (
            <Pressable onPress={copiar} style={[e.botonChico, { borderColor: t.borde }]}>
              <Copy size={16} color={t.texto} />
              <Text style={{ color: t.texto, fontWeight: '700', fontSize: 13 }}>{copiada ? 'Copiada' : 'Copiar'}</Text>
            </Pressable>
          ) : (
            <Text style={{ color: t.textoSuave, fontSize: 12 }}>Mantén presionada la contraseña para copiarla.</Text>
          )}
          <Pressable onPress={() => setClave(null)} style={[e.botonChico, { borderColor: t.borde }]}>
            <Text style={{ color: t.texto, fontWeight: '700', fontSize: 13 }}>Ya la copié, ocultar</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={etiqueta}>ADMINISTRADORES</Text>
      {!lista && !errorLista ? <ActivityIndicator color={t.acento} /> : null}
      {errorLista ? (
        <Pressable onPress={cargar}><Text style={{ color: t.error, fontSize: 13 }}>{errorLista} Toca para reintentar.</Text></Pressable>
      ) : null}
      {lista?.administradores.length === 0 ? <Text style={{ color: t.textoSuave, fontSize: 13 }}>Todavía no hay administradores creados desde la app.</Text> : null}
      {lista?.administradores.map((a) => {
        const est = estadoAdmin(a);
        const enCurso = ocupado === a.id_admin;
        return (
          <View key={a.id_admin} style={[e.tarjeta, { backgroundColor: t.superficie, borderColor: t.borde, padding: 14, marginBottom: 10, gap: 4 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: t.texto, fontWeight: '700', fontSize: 15, flex: 1 }}>{a.nombre_completo}</Text>
              <Text style={{ color: est.color, fontWeight: '800', fontSize: 12 }}>{est.texto}</Text>
            </View>
            <Text style={{ color: t.textoSuave, fontSize: 12 }}>{a.correo} · {telefonoVisible(a.telefono)} · RUT {a.rut}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              {enCurso ? <ActivityIndicator color={t.acento} /> : (
                <>
                  <Pressable
                    onPress={() => accion(a, () => cambiarActivo(a.id_admin, !a.activo), a.activo ? `${a.nombre_completo} quedó desactivado.` : `${a.nombre_completo} quedó activo.`)}
                    style={[e.botonChico, { borderColor: a.activo ? t.error : t.acento }]}
                  >
                    <Text style={{ color: a.activo ? t.error : t.acento, fontWeight: '700', fontSize: 13 }}>{a.activo ? 'Desactivar' : 'Reactivar'}</Text>
                  </Pressable>
                  {a.activo ? (
                    <Pressable onPress={() => accion(a, () => reenviarCorreo(a.id_admin), `Reenviamos el correo a ${a.correo}.`)} style={[e.botonChico, { borderColor: t.borde }]}>
                      <Text style={{ color: t.texto, fontWeight: '700', fontSize: 13 }}>Reenviar correo</Text>
                    </Pressable>
                  ) : null}
                </>
              )}
            </View>
          </View>
        );
      })}

      {lista?.definidos_en_servidor.length ? (
        <>
          <Text style={etiqueta}>DEFINIDOS EN EL SERVIDOR</Text>
          {lista.definidos_en_servidor.map((d) => (
            <View key={d.uid} style={[e.tarjeta, { backgroundColor: t.superficie, borderColor: t.borde, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
              <Server size={18} color={t.textoSuave} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.texto, fontWeight: '700', fontSize: 13 }}>{d.tipo === 'super' ? 'Súper usuario' : 'Administrador (ADMIN_UIDS)'}</Text>
                <Text style={{ color: t.textoSuave, fontSize: 11 }} numberOfLines={1}>UID {d.uid}</Text>
              </View>
            </View>
          ))}
          <Text style={{ color: t.textoSuave, fontSize: 12 }}>Estos se cambian en las variables del servidor, no desde la app.</Text>
        </>
      ) : null}
    </ScrollView>
  );
}

const e = StyleSheet.create({
  barraSuperior: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  flecha: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tarjeta: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  boton: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  botonChico: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
});
