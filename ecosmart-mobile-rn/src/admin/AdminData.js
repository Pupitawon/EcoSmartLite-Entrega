import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { actualizarReporte, getAlertas, getConfig, getContenedores, getReportes } from '../services/api';
import { COLUMNAS_OT, ESTADO_REPORTE, criterios, material, ubicacion } from './utils';
import AdminHoja from './AdminHoja';

/**
 * Datos del panel de administración (reemplaza al panel web del backend):
 * contenedores, alertas y reportes ciudadanos del backend, y órdenes de trabajo.
 * Se vuelven a consultar solos cada 15 s (y al deslizar hacia abajo en cada pantalla).
 *
 * Las órdenes de trabajo todavía no tienen tabla en la base: se guardan en el teléfono (AsyncStorage).
 */
const AdminDataContext = createContext(null);
const CADA_MS = 15000;
const CLAVE_OT = 'ecosmart_ots';
const CONFIG_POR_DEFECTO = { umbral_alerta: 80, sin_reporte_horas: 6 };

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData debe usarse dentro de <AdminDataProvider>');
  return ctx;
}

export function AdminDataProvider({ children, darkMode, onIrA }) {
  const [contenedores, setContenedores] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [config, setConfig] = useState(CONFIG_POR_DEFECTO);
  const [cargado, setCargado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [actualizado, setActualizado] = useState(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const [ordenes, setOrdenes] = useState([]);
  const [secuencia, setSecuencia] = useState(1000);
  const [hoja, setHoja] = useState(null); // { tipo: 'detalle' | 'orden', id, tipoReporte }
  const [toast, setToast] = useState(null);
  const montado = useRef(true);
  const idsReportes = useRef(null); // para avisar cuando llega un reporte nuevo
  const toastTimer = useRef(null);
  const ordenesLeidas = useRef(false);

  const avisar = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => montado.current && setToast(null), 2600);
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [cfg, cont, alr, rep] = await Promise.all([
        getConfig().catch(() => null), // sin config se usan los valores por defecto
        getContenedores(),
        getAlertas(),
        getReportes().catch(() => null), // si falla, el resto del panel sigue funcionando
      ]);
      if (!montado.current) return;
      if (cfg) setConfig(cfg);
      setContenedores([...cont].sort((a, b) => a.id_contenedor - b.id_contenedor));
      setAlertas(alr);
      if (rep) {
        const nuevos = idsReportes.current ? rep.filter((r) => !idsReportes.current.has(r.id_reporte)) : [];
        idsReportes.current = new Set(rep.map((r) => r.id_reporte));
        setReportes(rep);
        if (nuevos.length === 1) avisar(`Nuevo reporte ciudadano · Contenedor #${nuevos[0].id_contenedor}`);
        else if (nuevos.length > 1) avisar(`${nuevos.length} reportes ciudadanos nuevos`);
      }
      setCargado(true);
      setError(null);
      setActualizado(Date.now());
    } catch (e) {
      if (montado.current) setError(e.message || 'Error de red');
    } finally {
      if (montado.current) {
        setCargando(false);
        setAhora(Date.now());
      }
    }
  }, [avisar]);

  useEffect(() => {
    montado.current = true;
    cargar();
    const reloj = setInterval(cargar, CADA_MS);
    return () => {
      montado.current = false;
      clearInterval(reloj);
      clearTimeout(toastTimer.current);
    };
  }, [cargar]);

  // Órdenes de trabajo guardadas en el teléfono.
  useEffect(() => {
    AsyncStorage.getItem(CLAVE_OT)
      .then((raw) => {
        if (!raw) return;
        const d = JSON.parse(raw);
        if (Array.isArray(d.ordenes)) setOrdenes(d.ordenes);
        if (Number.isFinite(d.secuencia)) setSecuencia(d.secuencia);
      })
      .catch(() => {})
      .finally(() => {
        ordenesLeidas.current = true;
      });
  }, []);
  const guardar = useCallback((lista, sec) => {
    if (!ordenesLeidas.current) return; // no pisar lo guardado antes de leerlo
    AsyncStorage.setItem(CLAVE_OT, JSON.stringify({ ordenes: lista, secuencia: sec })).catch(() => {});
  }, []);

  const cr = useMemo(() => criterios(config, ahora), [config, ahora]);
  const porId = useMemo(() => Object.fromEntries(contenedores.map((c) => [c.id_contenedor, c])), [contenedores]);

  const revisarReporte = useCallback(
    async (id, estado) => {
      try {
        const r = await actualizarReporte(id, estado);
        setReportes((prev) => prev.map((x) => (x.id_reporte === id ? r : x)));
        avisar(`Reporte #${id} → ${ESTADO_REPORTE[estado]}`);
      } catch (e) {
        avisar(`No se pudo actualizar el reporte: ${e.message}`);
      }
    },
    [avisar]
  );

  const crearOrden = useCallback(
    ({ id_contenedor, tipo, prioridad, tecnico }) => {
      const c = porId[id_contenedor];
      const n = secuencia + 1;
      const fecha = new Date().toISOString();
      const orden = {
        id: `OT-${n}`,
        tipo,
        contenedor: id_contenedor,
        lugar: `${material(c)} · ${ubicacion(c)}`,
        prioridad,
        tecnico,
        estado: COLUMNAS_OT[0],
        creada: fecha,
        actualizada: fecha,
      };
      const lista = [orden, ...ordenes];
      setSecuencia(n);
      setOrdenes(lista);
      guardar(lista, n);
      setHoja(null);
      avisar(`${orden.id} creada en Pendiente`);
      onIrA?.('ordenes');
    },
    [porId, secuencia, ordenes, guardar, avisar, onIrA]
  );

  const avanzarOrden = useCallback(
    (id) => {
      const o = ordenes.find((x) => x.id === id);
      const sig = o && COLUMNAS_OT[COLUMNAS_OT.indexOf(o.estado) + 1];
      if (!sig) return;
      const lista = ordenes.map((x) => (x.id === id ? { ...x, estado: sig, actualizada: new Date().toISOString() } : x));
      setOrdenes(lista);
      guardar(lista, secuencia);
      avisar(`${id} → ${sig}`);
    },
    [ordenes, secuencia, guardar, avisar]
  );

  const eliminarOrden = useCallback(
    (id) => {
      const lista = ordenes.filter((x) => x.id !== id);
      setOrdenes(lista);
      guardar(lista, secuencia);
      avisar(`${id} eliminada`);
    },
    [ordenes, secuencia, guardar, avisar]
  );

  const valor = {
    contenedores,
    alertas,
    reportes,
    config,
    cargado,
    cargando,
    error,
    actualizado,
    ahora,
    recargar: cargar,
    cr,
    porId,
    revisarReporte,
    ordenes,
    crearOrden,
    avanzarOrden,
    eliminarOrden,
    hoja,
    abrirDetalle: (id) => setHoja({ tipo: 'detalle', id }),
    abrirNuevaOrden: (id, tipoReporte) => setHoja({ tipo: 'orden', id, tipoReporte }),
    cerrarHoja: () => setHoja(null),
    darkMode,
  };

  return (
    <AdminDataContext.Provider value={valor}>
      <View style={{ flex: 1 }}>
        {children}
        {toast && (
          <View pointerEvents="none" style={e.toastCaja}>
            <View style={e.toast}>
              <Text style={e.toastTxt}>{toast}</Text>
            </View>
          </View>
        )}
      </View>
      <AdminHoja />
    </AdminDataContext.Provider>
  );
}

const e = StyleSheet.create({
  toastCaja: { position: 'absolute', left: 16, right: 16, bottom: 96, alignItems: 'center' },
  toast: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 8,
  },
  toastTxt: { color: '#ffffff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
