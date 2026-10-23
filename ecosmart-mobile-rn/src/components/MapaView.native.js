import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { CALAMA, STATUS_META, getPinStatus } from '../tema';

const REGION = { ...CALAMA, latitudeDelta: 0.09, longitudeDelta: 0.09 };

// Pines propios (círculo de color) para que el color sea exacto en iPhone y Android.
export default function MapaView({ pins, darkMode, seleccionado, onSelect }) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={REGION}
      userInterfaceStyle={darkMode ? 'dark' : 'light'}
      toolbarEnabled={false}
    >
      {pins.map((pin) => {
        const color = STATUS_META[getPinStatus(pin)].color;
        const activo = seleccionado?.id_contenedor === pin.id_contenedor;
        return (
          <Marker
            key={`${pin.id_contenedor}-${color}-${activo}`}
            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
            onPress={() => onSelect(pin)}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={[
                estilos.pin,
                { backgroundColor: color, borderColor: darkMode ? '#18181b' : '#ffffff' },
                activo && estilos.pinActivo,
              ]}
            />
          </Marker>
        );
      })}
    </MapView>
  );
}

const estilos = StyleSheet.create({
  pin: { width: 26, height: 26, borderRadius: 13, borderWidth: 3 },
  pinActivo: { width: 34, height: 34, borderRadius: 17, borderWidth: 4 },
});
