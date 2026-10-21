import { useCallback, useEffect, useRef, useState } from "react";
import { abrirStream, getAlertas, getConfig, getContenedores } from "../services/api.js";

const CONFIG_POR_DEFECTO = { umbral_alerta: 80, sin_reporte_horas: 6 };

/** Señal "contenedor sin reporte": nunca reportó, o pasó más del límite sin lectura. */
export function estaSinReporte(c, ahora, horas) {
  if (!c.fecha_ultima_lectura) return true;
  return ahora - new Date(c.fecha_ultima_lectura).getTime() > horas * 3_600_000;
}

/** "hace 5 min", "hace 2 h"... */
export function hace(iso, ahora) {
  if (!iso) return "Nunca reportó";
  const s = Math.max(0, (ahora - new Date(iso).getTime()) / 1000);
  if (s < 60) return "hace instantes";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} d`;
}

// Si llegan datos repetidos (carga completa vs evento en vivo), se queda con la lectura más nueva.
const tiempo = (c) => (c?.fecha_ultima_lectura ? new Date(c.fecha_ultima_lectura).getTime() : 0);
const elMasReciente = (actual, entrante) => (actual && tiempo(actual) > tiempo(entrante) ? actual : entrante);

/**
 * Contenedores con su última lectura, actualizados solos cuando llega una lectura nueva.
 * conexion: "cargando" | "en_vivo" | "reconectando"
 */
export default function useContenedoresEnVivo() {
  const [porId, setPorId] = useState({});
  const [alertas, setAlertas] = useState([]);
  const [config, setConfig] = useState(CONFIG_POR_DEFECTO);
  const [conexion, setConexion] = useState("cargando");
  const [cargado, setCargado] = useState(false);
  const [error, setError] = useState(null);
  const [actualizados, setActualizados] = useState({});
  const [ahora, setAhora] = useState(() => Date.now());
  const montado = useRef(true);
  const aperturas = useRef(0);

  const cargar = useCallback(async () => {
    try {
      const [cfg, lista, alr] = await Promise.all([
        getConfig().catch(() => null), // sin config se usan los valores por defecto
        getContenedores(),
        getAlertas(),
      ]);
      if (!montado.current) return;
      if (cfg) setConfig(cfg);
      setPorId((prev) => {
        const sig = {};
        for (const c of lista) sig[c.id_contenedor] = elMasReciente(prev[c.id_contenedor], c);
        return sig;
      });
      setAlertas(alr);
      setCargado(true);
      setError(null);
    } catch (e) {
      if (montado.current) setError(e.message || "Error de red");
    }
  }, []);

  const marcar = useCallback((id) => {
    setActualizados((p) => ({ ...p, [id]: true }));
    setTimeout(() => {
      if (!montado.current) return;
      setActualizados((p) => {
        const { [id]: _quitado, ...resto } = p;
        return resto;
      });
    }, 1800);
  }, []);

  // Carga inicial + reloj para que "hace X min" y "Sin reporte" avancen solos.
  useEffect(() => {
    montado.current = true;
    cargar();
    const reloj = setInterval(() => setAhora(Date.now()), 30_000);
    return () => {
      montado.current = false;
      clearInterval(reloj);
    };
  }, [cargar]);

  // Conexión en vivo.
  useEffect(() => {
    return abrirStream({
      onEstado: (estado) => {
        if (!montado.current) return;
        setConexion(estado);
        if (estado === "en_vivo") {
          aperturas.current += 1;
          // Al RECONECTAR se vuelve a cargar todo para recuperar lo que llegó mientras estuvo caída.
          if (aperturas.current > 1) cargar();
        }
      },
      onLectura: ({ contenedor, alerta_creada, alerta_resuelta }) => {
        if (!montado.current) return;
        setPorId((prev) => ({
          ...prev,
          [contenedor.id_contenedor]: elMasReciente(prev[contenedor.id_contenedor], contenedor),
        }));
        marcar(contenedor.id_contenedor);
        if (alerta_creada || alerta_resuelta) {
          getAlertas()
            .then((a) => montado.current && setAlertas(a))
            .catch(() => {});
        }
      },
    });
  }, [cargar, marcar]);

  const contenedores = Object.values(porId).sort((a, b) => a.id_contenedor - b.id_contenedor);
  return { contenedores, alertas, config, conexion, cargado, error, actualizados, ahora, recargar: cargar };
}
