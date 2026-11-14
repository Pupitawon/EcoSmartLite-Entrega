import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  actualizarReporte,
  avanzarOrden as apiAvanzarOrden,
  crearOrden as apiCrearOrden,
  eliminarOrden as apiEliminarOrden,
  getAlertas,
  getConfig,
  getContenedores,
  getOrdenes,
  getReportes,
} from '../services/api';
import { ESTADO_REPORTE, criterios, material, ubicacion } from './utils';
import AdminHoja from './AdminHoja';

/**
 * Datos del panel de administración (reemplaza al panel web del backend):
 * contenedores, alertas, reportes ciudadanos y órdenes de trabajo, todo desde el backend.
 * Se vuelven a consultar solos cada 15 s (y al deslizar hacia abajo en cada pantalla).
 * Las órdenes de trabajo (tabla orden_trabajo) las comparten todos los administradores.
 */
const AdminDataContext = createContext(null);
const CADA_MS = 15000;
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
  const [ordenesApi, setOrdenes] = useState([]);
  const [hoja, setHoja] = useState(null); // { tipo: 'detalle' | 'orden', id, tipoReporte }
  const [toast, setToast] = useState(null);
  const montado = useRef(true);
  const idsReportes = useRef(null); // para avisar cuando llega un reporte nuevo
  const toastTimer = useRef(null);

  const avisar = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => montado.current && setToast(null), 2600);
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [cfg, cont, alr, rep, ots] = await Promise.all([
        getConfig().catch(() => null), // sin config se usan los valores por defecto
        getContenedores(),
        getAlertas(),
        getReportes().catch(() => null), // si falla, el resto del panel sigue funcionando
        getOrdenes().catch(() => null), // ídem
      ]);
      if (!montado.current) return;
      if (cfg) setConfig(cfg);
      setContenedores([...cont].sort((a, b) => a.id_contenedor - b.id_contenedor));
      setAlertas(alr);
      if (ots) setOrdenes(ots);
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

  const cr = useMemo(() => criterios(config, ahora), [config, ahora]);
  const porId = useMemo(() => Object.fromEntries(contenedores.map((c) => [c.id_contenedor, c])), [contenedores]);
  // El lugar se arma con los datos actuales del contenedor (el backend guarda solo su id).
  const ordenes = useMemo(
    () => ordenesApi.map((o) => ({ ...o, lugar: `${material(porId[o.contenedor])} · ${ubicacion(porId[o.contenedor])}` })),
    [ordenesApi, porId]
  );

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
    async ({ id_contenedor, tipo, prioridad, tecnico }) => {
      try {
        const orden = await apiCrearOrden({ id_contenedor, tipo, prioridad, tecnico });
        setOrdenes((prev) => [orden, ...prev.filter((x) => x.id_orden !== orden.id_orden)]);
        setHoja(null);
        avisar(`${orden.id} creada en ${orden.estado}`);
        onIrA?.('ordenes');
      } catch (e) {
        avisar(`No se pudo crear la orden: ${e.message}`);
      }
    },
    [avisar, onIrA]
  );

  const avanzarOrden = useCallback(
    async (id) => {
      const o = ordenesApi.find((x) => x.id === id);
      if (!o) return;
      try {
        const nueva = await apiAvanzarOrden(o.id_orden);
        setOrdenes((prev) => prev.map((x) => (x.id_orden === nueva.id_orden ? nueva : x)));
        avisar(`${id} → ${nueva.estado}`);
      } catch (e) {
        avisar(`No se pudo avanzar ${id}: ${e.message}`);
        cargar(); // otro administrador pudo cambiarla: se trae el estado real
      }
    },
    [ordenesApi, avisar, cargar]
  );

  const eliminarOrden = useCallback(
    async (id) => {
      const o = ordenesApi.find((x) => x.id === id);
      if (!o) return;
      try {
        await apiEliminarOrden(o.id_orden);
        setOrdenes((prev) => prev.filter((x) => x.id_orden !== o.id_orden));
        avisar(`${id} eliminada`);
      } catch (e) {
        avisar(`No se pudo eliminar ${id}: ${e.message}`);
      }
    },
    [ordenesApi, avisar]
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
