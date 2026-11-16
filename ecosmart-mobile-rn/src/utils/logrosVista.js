import { Award, Droplets, Flame, Recycle } from 'lucide-react-native';

// Icono y color de cada logro (los ids vienen del servidor: depositante, racha, botellas).
export const ICONOS = { recycle: Recycle, flame: Flame, botella: Droplets };
export const COLORES = { recycle: '#10b981', flame: '#f97316', botella: '#3b82f6' };
export const iconoDe = (l) => ICONOS[l.icono] || Award;
export const colorDe = (l, porDefecto) => COLORES[l.icono] || porDefecto;
