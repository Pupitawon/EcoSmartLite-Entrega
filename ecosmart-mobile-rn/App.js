import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/firebase';
import { cerrarSesion, obtenerPerfil } from './src/services/auth';
import { obtenerInsignias } from './src/services/insignias';
import { temaDe } from './src/tema';
import Header from './src/components/Header';
import BottomNav from './src/components/BottomNav';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import RecuperarClaveScreen from './src/screens/RecuperarClaveScreen';
import MapaScreen from './src/screens/MapaScreen';
import EstacionScreen from './src/screens/EstacionScreen';
import EscanearScreen from './src/screens/EscanearScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import ConfiguracionScreen from './src/screens/ConfiguracionScreen';
import LogrosScreen from './src/screens/LogrosScreen';
import RankingScreen from './src/screens/RankingScreen';
import DesafiosScreen from './src/screens/DesafiosScreen';

import { AlertTriangle, Boxes, ChartColumn, ClipboardList, MessageSquareWarning } from 'lucide-react-native';
import { AdminDataProvider } from './src/admin/AdminData';
import ContenedoresScreen from './src/screens/admin/ContenedoresScreen';
import AlertasScreen from './src/screens/admin/AlertasScreen';
import ReportesScreen from './src/screens/admin/ReportesScreen';
import OrdenesScreen from './src/screens/admin/OrdenesScreen';
import IndicadoresScreen from './src/screens/admin/IndicadoresScreen';

// Pestañas del administrador (Innova Recicla). Reemplazan al antiguo panel web del backend.
// Cerrar sesión está en Configuración (avatar del encabezado), con confirmación.
const ADMIN_ITEMS = [
  { id: 'contenedores', icon: Boxes, label: 'Panel' },
  { id: 'alertas', icon: AlertTriangle, label: 'Alertas' },
  { id: 'reportes', icon: MessageSquareWarning, label: 'Reportes' },
  { id: 'ordenes', icon: ClipboardList, label: 'Órdenes' },
  { id: 'indicadores', icon: ChartColumn, label: 'Datos' },
];
const ADMIN_PANTALLAS = {
  contenedores: ContenedoresScreen,
  alertas: AlertasScreen,
  reportes: ReportesScreen,
  ordenes: OrdenesScreen,
  indicadores: IndicadoresScreen,
};

const inicioDe = (p) => (p?.es_admin ? 'contenedores' : 'mapa');

export default function App() {
  const [darkMode, setDarkMode] = useState(true); // como la app de Jeremy
  const [pantalla, setPantalla] = useState('login'); // login | registro | recuperar | mapa | estacion | escanear | desafios | ranking | perfil | (admin) contenedores, alertas…
  const [perfil, setPerfil] = useState(null);
  const [estacion, setEstacion] = useState(null);
  const [iniciando, setIniciando] = useState(true);
  const [racha, setRacha] = useState(0); // días seguidos reciclando, para la barra superior
  const [adminPrevia, setAdminPrevia] = useState('contenedores'); // pestaña a la que vuelve el admin al salir de Configuración
  const t = temaDe(darkMode);

  // Restaura la sesión guardada (solo la primera vez que Firebase informa el estado).
  useEffect(() => {
    if (!auth) { setIniciando(false); return undefined; }
    let primera = true;
    const baja = onAuthStateChanged(auth, async (usuario) => {
      if (!primera) return;
      primera = false;
      baja?.();
      if (usuario) {
        try {
          const p = await obtenerPerfil();
          if (p) { setPerfil(p); setPantalla(inicioDe(p)); }
        } catch { /* sin conexión: queda en el login */ }
      }
      setIniciando(false);
    });
    return baja;
  }, []);

  // Racha de la barra superior: se pide al entrar y cada vez que cambia el saldo (un depósito nuevo puede extenderla).
  useEffect(() => {
    if (!perfil) { setRacha(0); return; }
    obtenerInsignias().then((d) => setRacha(d.racha?.actual ?? 0)).catch(() => {});
  }, [perfil?.id_usuario, perfil?.saldo_ecopoints]);

  const entrar = (p) => { setPerfil(p); setPantalla(inicioDe(p)); };
  const salir = () => { cerrarSesion().catch(() => {}); setPerfil(null); setEstacion(null); setPantalla('login'); };

  let contenido;
  if (!auth) {
    contenido = (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: t.error }}>Falta configurar Firebase (variables EXPO_PUBLIC_FIREBASE_* en .env).</Text>
      </View>
    );
  } else if (iniciando) {
    contenido = <ActivityIndicator style={{ flex: 1 }} color="#10b981" />;
  } else if (!perfil) {
    contenido = pantalla === 'registro'
      ? <RegisterScreen darkMode={darkMode} onRegistered={entrar} onBack={() => setPantalla('login')} />
      : pantalla === 'recuperar'
        ? <RecuperarClaveScreen darkMode={darkMode} onBack={() => setPantalla('login')} />
        : <LoginScreen darkMode={darkMode} onLogin={entrar} onGoToRegister={() => setPantalla('registro')} onGoToRecuperar={() => setPantalla('recuperar')} />;
  } else if (perfil.es_admin) {
    // Administrador: el backend lo reconoce por su UID (ADMIN_UIDS) y lo indica en /api/usuarios/me.
    const Pantalla = ADMIN_PANTALLAS[pantalla] || ContenedoresScreen;
    contenido = (
      // El proveedor sigue montado en Configuración para no perder ni recargar los datos del panel.
      <AdminDataProvider darkMode={darkMode} onIrA={setPantalla}>
        {pantalla === 'configuracion' ? (
          <ConfiguracionScreen
            perfil={perfil}
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode((d) => !d)}
            onVolver={() => setPantalla(adminPrevia)}
            onSalir={salir}
          />
        ) : (
          <>
            <Header
              darkMode={darkMode}
              toggleDarkMode={() => setDarkMode((d) => !d)}
              inicial="A"
              admin
              onPerfil={() => { setAdminPrevia(ADMIN_PANTALLAS[pantalla] ? pantalla : 'contenedores'); setPantalla('configuracion'); }}
            />
            <View style={{ flex: 1 }}>
              <Pantalla />
            </View>
            <BottomNav
              items={ADMIN_ITEMS}
              active={ADMIN_PANTALLAS[pantalla] ? pantalla : 'contenedores'}
              darkMode={darkMode}
              onNavigate={setPantalla}
            />
          </>
        )}
      </AdminDataProvider>
    );
  } else {
    contenido = (
      <>
        {!['perfil', 'configuracion', 'logros'].includes(pantalla) ? <Header darkMode={darkMode} toggleDarkMode={() => setDarkMode((d) => !d)} inicial={perfil.nombre_completo?.charAt(0).toUpperCase()} racha={racha} ecopoints={perfil.saldo_ecopoints ?? 0} onPerfil={() => setPantalla('perfil')} /> : null}
        <View style={{ flex: 1 }}>
          {pantalla === 'estacion' ? (
            <EstacionScreen station={estacion} darkMode={darkMode} onBack={() => setPantalla('mapa')} />
          ) : pantalla === 'escanear' ? (
            <EscanearScreen
              darkMode={darkMode}
              saldo={perfil.saldo_ecopoints}
              onDeposito={(d) => setPerfil((p) => ({ ...p, saldo_ecopoints: d.saldo_ecopoints }))}
            />
          ) : pantalla === 'desafios' ? (
            <DesafiosScreen perfil={perfil} darkMode={darkMode} />
          ) : pantalla === 'ranking' ? (
            <RankingScreen perfil={perfil} darkMode={darkMode} />
          ) : pantalla === 'perfil' ? (
            <PerfilScreen perfil={perfil} darkMode={darkMode} onVolver={() => setPantalla('mapa')} onConfiguracion={() => setPantalla('configuracion')} onVerLogros={() => setPantalla('logros')} />
          ) : pantalla === 'logros' ? (
            <LogrosScreen perfil={perfil} darkMode={darkMode} onVolver={() => setPantalla('perfil')} />
          ) : pantalla === 'configuracion' ? (
            <ConfiguracionScreen
              perfil={perfil}
              darkMode={darkMode}
              toggleDarkMode={() => setDarkMode((d) => !d)}
              onVolver={() => setPantalla('perfil')}
              onSalir={salir}
              onPerfilActualizado={(p) => setPerfil((x) => ({ ...x, recibe_notificaciones: p.recibe_notificaciones }))}
            />
          ) : (
            <MapaScreen darkMode={darkMode} onViewStation={(s) => { setEstacion(s); setPantalla('estacion'); }} />
          )}
        </View>
        {/* El perfil y la configuración ocupan toda la pantalla (como en Duolingo): sin encabezado ni barra inferior. */}
        {!['perfil', 'configuracion', 'logros'].includes(pantalla) ? (
        <BottomNav 
          active={['escanear', 'desafios', 'ranking'].includes(pantalla) ? pantalla : 'mapa'} 
          darkMode={darkMode} 
          onNavigate={(id) => {
            setPantalla(['escanear', 'desafios', 'ranking'].includes(id) ? id : 'mapa');
          }} 
        />
        ) : null}
      </>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <SafeAreaView style={[e.fondo, { backgroundColor: darkMode ? '#18181b' : '#f5f5f4' }]}>
        {/* En el navegador se muestra con forma de celular, igual que la app de Jeremy. */}
        <View style={[e.marco, { backgroundColor: t.fondoApp }]}>{contenido}</View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const e = StyleSheet.create({
  fondo: { flex: 1, alignItems: 'center', ...(Platform.OS === 'web' ? { height: '100dvh' } : {}) },
  marco: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 440 : undefined, overflow: 'hidden' },
});