import { Text, TextInput, View } from 'react-native';
import { temaDe } from '../tema';

export default function Campo({ darkMode, Icono, etiqueta, ...props }) {
  const t = temaDe(darkMode);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', marginBottom: 6, color: t.textoCampo }}>{etiqueta}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 12,
          backgroundColor: t.campo,
          borderColor: t.campoBorde,
        }}
      >
        {Icono && <Icono size={16} color="#a8a29e" />}
        <TextInput
          {...props}
          placeholderTextColor="#78716c"
          style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 11, fontSize: 14, color: t.texto, outlineStyle: 'none' }}
        />
      </View>
    </View>
  );
}
