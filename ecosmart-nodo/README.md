# ecosmart-nodo

Firmware del nodo sensor EcoSmart (ESP32 + AJ-SR04M).

1. Copia `include/secrets.h.example` como `include/secrets.h` y completa Wi-Fi, URL, API key e id de contenedor.
2. Ajusta `DIST_VACIO_CM`, `DIST_LLENO_CM` e `INTERVALO_MIN` en `src/main.cpp`.
3. Compila y sube con PlatformIO (VS Code). Monitor serie a 115200.

`secrets.h` esta en `.gitignore`: nunca lo subas al repositorio.
