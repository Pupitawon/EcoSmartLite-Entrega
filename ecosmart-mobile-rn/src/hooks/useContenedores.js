import { useCallback, useEffect, useRef, useState } from 'react';
import { getContenedores } from '../services/api';

const CADA_MS = 30000; // se vuelve a consultar solo cada 30 s

/** Contenedores del backend, con refresco automático. */
export default function useContenedores() {
  const [contenedores, setContenedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const montado = useRef(true);

  const cargar = useCallback(async () => {
    try {
      const lista = await getContenedores();
      if (!montado.current) return;
      setContenedores(lista);
      setError(null);
    } catch (e) {
      if (montado.current) setError(e.message || 'Error de red');
    } finally {
      if (montado.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    montado.current = true;
    cargar();
    const reloj = setInterval(cargar, CADA_MS);
    return () => {
      montado.current = false;
      clearInterval(reloj);
    };
  }, [cargar]);

  return { contenedores, cargando, error, recargar: cargar };
}
