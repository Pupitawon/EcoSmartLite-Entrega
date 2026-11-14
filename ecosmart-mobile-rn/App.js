import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/firebase';
import { cerrarSesion, obtenerPerfil } from './src/services/auth';
import { temaDe } from './src/tema';
import Header from './src/components/Header';
import BottomNav from './src/components/BottomNav';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import RecuperarClaveScreen from './src/screens/RecuperarClaveScreen';
import MapaScreen from './src/screens/MapaScreen';
import EstacionScreen from './src/screens/EstacionScreen';
import EscanearScreen from './src/screens/EscanearScreen';
import { AlertTriangle, Boxes, ChartColumn, ClipboardList, LogOut, MessageSquareWarning } from 'lucide-react-native';
import { AdminDataProvider } from './src/admin/AdminData';
import ContenedoresScreen from './src/screens/admin/ContenedoresScreen';
import AlertasScreen from './src/screens/admin/AlertasScreen';
import ReportesScreen from './src/screens/admin/ReportesScreen';
import OrdenesScreen from './src/screens/admin/OrdenesScreen';
import IndicadoresScreen from './src/screens/admin/IndicadoresScreen';

// Pestañas del administrador (Innova Recicla). Reemplazan al antiguo panel web del backend.
const ADMIN_ITEMS = [
  { id: 'contenedores', icon: Boxes, label: 'Panel' },
  { id: 'alertas', icon: AlertTriangle, label: 'Alertas' },
  { id: 'reportes', icon: MessageSquareWarning, label: 'Reportes' },
  { id: 'ordenes', icon: ClipboardList, label: 'Órdenes' },
  { id: 'indicadores', icon: ChartColumn, label: 'Datos' },
  { id: 'logout', icon: LogOut, label: 'Salir' },
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
  const [pantalla, setPantalla] = useState('login'); // login | registro | mapa | estacion | escanear | (admin) contenedores, alertas…
  const [perfil, setPerfil] = useState(null);
  const [estacion, setEstacion] = useState(null);
  const [iniciando, setIniciando] = useState(true);
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

  // Fija el viewport en el navegador para que el celular no amplíe la página
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'viewport');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover');
  }, []);

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
      <AdminDataProvider darkMode={darkMode} onIrA={setPantalla}>
        <Header darkMode={darkMode} toggleDarkMode={() => setDarkMode((d) => !d)} inicial="A" />
        <View style={{ flex: 1 }}>
          <Pantalla />
        </View>
        <BottomNav
          items={ADMIN_ITEMS}
          active={ADMIN_PANTALLAS[pantalla] ? pantalla : 'contenedores'}
          darkMode={darkMode}
          onNavigate={(id) => (id === 'logout' ? salir() : setPantalla(id))}
        />
      </AdminDataProvider>
    );
  } else {
    contenido = (
      <>
        <Header darkMode={darkMode} toggleDarkMode={() => setDarkMode((d) => !d)} inicial={perfil.nombre_completo?.charAt(0).toUpperCase()} />
        <View style={{ flex: 1 }}>
          {pantalla === 'estacion' ? (
            <EstacionScreen station={estacion} darkMode={darkMode} onBack={() => setPantalla('mapa')} />
          ) : pantalla === 'escanear' ? (
            <EscanearScreen
              darkMode={darkMode}
              saldo={perfil.saldo_ecopoints}
              onDeposito={(d) => setPerfil((p) => ({ ...p, saldo_ecopoints: d.saldo_ecopoints }))}
            />
          ) : (
            <MapaScreen darkMode={darkMode} onViewStation={(s) => { setEstacion(s); setPantalla('estacion'); }} />
          )}
        </View>
        <BottomNav
          active={pantalla === 'escanear' ? 'escanear' : 'mapa'}
          darkMode={darkMode}
          onNavigate={(id) => {
            if (id === 'logout') {
              salir();
            } else if (id === 'escanear') {
              setPantalla('escanear');
            } else {
              setPantalla('mapa');
            }
          }}
        />
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