import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Boxes } from 'lucide-react-native';
import MapaView from '../../components/MapaView';
import LeyendaMapa from '../../components/LeyendaMapa';
import { pinesDe } from '../../utils/pines';
import { temaDe } from '../../tema';
import { useAdminData } from '../../admin/AdminData';
import ListaContenedores from '../../admin/ListaContenedores';
import { EstadoCarga, Filtros, PantallaAdmin } from '../../admin/ui';
import { avisoConexion } from '../../admin/utils';

const MODOS = [
  { id: 'mapa', label: 'Mapa' },
  { id: 'lista', label: 'Lista' },
];

/**
 * Pestaña de inicio del administrador: los contenedores en el mapa, con el mismo color que ve el ciudadano.
 * Tocar un contenedor abre su detalle (desde ahí se crea una orden). "Lista" muestra la búsqueda y los filtros.
 */
export default function MapaAdminScreen() {
  const { contenedores, cargado, error, darkMode, abrirDetalle } = useAdminData();
  const t = temaDe(darkMode);
  const [modo, setModo] = useState('mapa');
  const pins = useMemo(() => pinesDe(contenedores), [contenedores]);
  const aviso = avisoConexion({ cargado, error });

  if (modo === 'lista') {
    return (
      <PantallaAdmin icono={Boxes} titulo="Contenedores">
        <Filtros opciones={MODOS} valor={modo} onCambiar={setModo} />
        <ListaContenedores />
      </PantallaAdmin>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.fondoApp }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
        <Filtros opciones={MODOS} valor={modo} onCambiar={setModo} />
        <EstadoCarga />
      </View>
      {cargado && (
        <View style={{ flex: 1, position: 'relative' }}>
          <MapaView
            pins={pins}
            darkMode={darkMode}
            seleccionado={null}
            onSelect={(p) => abrirDetalle(p.id_contenedor)}
            posicion={null}
            centrar={0}
          />
          <LeyendaMapa darkMode={darkMode} />
          {aviso && (
            <View style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 11, padding: 10, borderRadius: 12, backgroundColor: t.superficie, borderWidth: 1, borderColor: t.error }}>
              <Text style={{ fontSize: 12, color: t.error, textAlign: 'center' }}>{aviso}</Text>
            </View>
          )}
          {pins.length === 0 && !aviso && (
            <View style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 10, padding: 12, borderRadius: 12, backgroundColor: t.superficie }}>
              <Text style={{ fontSize: 12, color: t.textoSuave, textAlign: 'center' }}>No hay contenedores con ubicación.</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
