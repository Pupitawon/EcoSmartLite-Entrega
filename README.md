# EcoSmartLite

- `ecosmart-backend/`: API en Node.js + Express conectada a Supabase (PostgreSQL). Incluye el panel web en `/panel`. Detalles en [ecosmart-backend/README.md](ecosmart-backend/README.md).
- `ecosmart-mobile-rn/`: app ciudadana en React Native con Expo (Android, iOS y navegador): mapa de contenedores, escaneo de QR, perfil, logros, desafíos y ranking. Login con Firebase.
- `ecosmart-nodo/`: firmware del sensor ESP32 (PlatformIO). Detalles en [ecosmart-nodo/README.md](ecosmart-nodo/README.md).

## Cómo probar el proyecto (para el equipo)

Requisitos: Node.js 22 o superior y Git. Para probar en el celular, la app **Expo Go**.

### 1. Clonar

```bash
git clone https://github.com/Pupitawon/EcoSmartLite-Entrega.git
cd EcoSmartLite-Entrega
```

### 2. Archivos `.env`

Las claves de Supabase y Firebase **no están en el repositorio**. Pídele los dos archivos `.env` al dueño del proyecto (por mensaje privado) y cópialos así:

| Archivo | Contiene |
|---|---|
| `ecosmart-backend/.env` | `DATABASE_URL` de Supabase, `INGEST_API_KEY`, configuración de Firebase, `ADMIN_UIDS` |
| `ecosmart-mobile-rn/.env` | `EXPO_PUBLIC_API_URL` (URL del backend) y las claves web de Firebase |

Las variables que lleva cada uno están en los `.env.example` de cada carpeta.

> Nunca subas los `.env` a GitHub ni los compartas en grupos: `DATABASE_URL` incluye la contraseña de la base de datos.

La base de Supabase es compartida y las migraciones SQL ya están aplicadas, así que no hay que volver a ejecutarlas.

### 3. Levantar el backend

```bash
cd ecosmart-backend
npm install
npm run dev
```

Queda en http://localhost:5000 (panel web en http://localhost:5000/panel).

### 4. Levantar la app (en otra terminal)

```bash
cd ecosmart-mobile-rn
npm install
npx expo start
```

- Presiona `w` para abrirla en el navegador.
- Para el celular, escanea el QR que aparece en la terminal con Expo Go.

### Probar en un celular

Desde el celular, `127.0.0.1` no apunta a tu computador. En `ecosmart-mobile-rn/.env` cambia `EXPO_PUBLIC_API_URL` por la IP de tu computador en la red (por ejemplo `http://192.168.1.20:5000`), con el celular conectado al mismo Wi-Fi, y reinicia `npx expo start`.

## Acceso a los paneles (opcional)

Solo hace falta para ver o administrar los datos directamente:

- **Supabase:** Dashboard → organización → Members → Invite.
- **Firebase:** Consola → Configuración del proyecto → Usuarios y permisos → Agregar miembro.
