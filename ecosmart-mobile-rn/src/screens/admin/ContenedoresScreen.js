import { Boxes } from 'lucide-react-native';
import ListaContenedores from '../../admin/ListaContenedores';
import { PantallaAdmin } from '../../admin/ui';

/**
 * Pestaña de inicio del administrador: la lista de contenedores con búsqueda y filtros.
 * El mapa se ve al tocar un contenedor, en su detalle (con "Abrir en Google Maps" y "Editar ubicación").
 */
export default function ContenedoresScreen() {
  return (
    <PantallaAdmin icono={Boxes} titulo="Contenedores">
      <ListaContenedores />
    </PantallaAdmin>
  );
}
