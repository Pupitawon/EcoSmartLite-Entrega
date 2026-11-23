// Mensajes educativos de la HU-10: uno por día de la semana (domingo primero).
// En una versión futura irán en la base de datos para que Innova los edite desde la app.
export const CONSEJOS = [
  'Domingo: ordena en casa lo que vas a reciclar esta semana. Separar desde el inicio lo hace más fácil.',
  'Lunes: enjuaga las botellas antes de depositarlas. Sin restos de líquido se reciclan mejor.',
  'Martes: aplasta las botellas de plástico para que ocupen menos espacio en el contenedor.',
  'Miércoles: el vidrio se puede reciclar muchas veces sin perder calidad.',
  'Jueves: no mezcles residuos orgánicos con los reciclables, porque ensucian el material y se pierde.',
  'Viernes: si ves un contenedor lleno, repórtalo desde la app para que Innova Recicla lo vacíe pronto.',
  'Sábado: lo mejor es reducir y reutilizar. Llevar tu propia botella evita residuos desde el inicio.',
];

/** Consejo que toca hoy según el día de la semana (hora local). */
export function consejoDelDia(fecha = new Date()) {
  return CONSEJOS[fecha.getDay()];
}


/** Saludo según la hora local: antes de las 15:00 es de mañana, hasta las 20:00 de tarde y después de noche. */
export function saludoDe(hora = new Date().getHours()) {
  if (hora < 15) return 'Buenos días';
  if (hora < 20) return 'Buenas tardes';
  return 'Buenas noches';
}