import { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { temaDe } from '../tema';

export default function Campo({ darkMode, Icono, etiqueta, ...props }) {
  const t = temaDe(darkMode);
  const [visible, setVisible] = useState(false); // solo se usa en campos de contraseña
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
          secureTextEntry={props.secureTextEntry && !visible}
          placeholderTextColor="#78716c"
          style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 11, fontSize: Platform.OS === 'web' ? 16 : 14, color: t.texto, outlineStyle: 'none' }}
        />
        {props.secureTextEntry ? (
          <Pressable onPress={() => setVisible((v) => !v)} accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} hitSlop={10}>
            {visible ? <EyeOff size={18} color="#a8a29e" /> : <Eye size={18} color="#a8a29e" />}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}