# EcoSmartLite App

Copia de la app EcoSmart (Logros, Mapa, Canjeo, QR) construida con React + Vite + Tailwind CSS, adaptada como EcoSmartLite.

## Requisitos

- Node.js 18 o superior

## Instalación y ejecución

```bash
npm install
npm run dev
```

Luego abre `http://localhost:5174` (puerto fijo distinto al de EcoSmart, para poder correr ambas apps a la vez).

## Build de producción

```bash
npm run build
npm run preview
```

Preview quedará en `http://localhost:4174`.

## Estructura

```
ecosmart-app/
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── src/
    ├── main.jsx          # Punto de entrada de React
    ├── index.css         # Directivas de Tailwind
    └── EcoSmartApp.jsx   # Componente principal con todas las pantallas
```

## Notas

- Toda la app vive en `src/EcoSmartApp.jsx`, dividida en subcomponentes (Home, Logros, Insignias, Mapa, Estación, Perfil, Canjeo, QR).
- La navegación entre pantallas se hace con `useState`; el flujo de escaneo QR suma puntos reales al estado global.
- Usa `lucide-react` para los íconos y clases core de Tailwind para los colores de marca (verde, naranjo, café).
