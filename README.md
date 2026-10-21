# EcoSmartLite

- `ecosmart-backend/`: API en Node.js + Express conectada a Supabase (PostgreSQL). Detalles en [ecosmart-backend/README.md](ecosmart-backend/README.md).
- `ecosmart-mobile/`: app en React + Vite (y Android con Capacitor) con login de Firebase. Detalles en [ecosmart-mobile/README.md](ecosmart-mobile/README.md).

## Cómo probar el proyecto (para el equipo)

Requisitos: Node.js 18 o superior y Git.

### 1. Clonar

```bash
git clone https://github.com/Pupitawon/EcoSmartLite-Entrega.git
cd EcoSmartLite-Entrega
```

### 2. Archivos `.env`

Las claves de Supabase y Firebase **no están en el repositorio**. Pídele los dos archivos `.env` al dueño del proyecto (por mensaje privado) y cópialos así:

| Archivo | Contiene |
|---|---|
| `ecosmart-backend/.env` | `DATABASE_URL` de Supabase, `INGEST_API_KEY`, configuración de Firebase |
| `ecosmart-mobile/.env` | `VITE_API_URL` (URL del backend) y las claves web de Firebase |

Las variables que lleva cada uno están en los `.env.example` de cada carpeta.

> Nunca subas los `.env` a GitHub ni los compartas en grupos: `DATABASE_URL` incluye la contraseña de la base de datos.

La base de Supabase es compartida y las migraciones SQL ya están aplicadas, así que no hay que volver a ejecutarlas.

### 3. Levantar el backend

```bash
cd ecosmart-backend
npm install
npm run dev
```

Queda en http://localhost:5000.

### 4. Levantar la app (en otra terminal)

```bash
cd ecosmart-mobile
npm install
npm run dev
```

Abre la URL que muestra Vite (http://localhost:5174).

### Probar en un celular Android

Desde el celular, `localhost` no apunta a tu computador. En `ecosmart-mobile/.env` cambia `VITE_API_URL` por la IP de tu computador en la red (por ejemplo `http://192.168.1.20:5000`), con el celular conectado al mismo Wi-Fi.

## Acceso a los paneles (opcional)

Solo hace falta para ver o administrar los datos directamente:

- **Supabase:** Dashboard → organización → Members → Invite.
- **Firebase:** Consola → Configuración del proyecto → Usuarios y permisos → Agregar miembro.
