#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <algorithm>
#include "secrets.h"

// EcoSmart - Nodo sensor (ESP32 + AJ-SR04M)
// Ciclo: despertar -> medir -> Wi-Fi -> POST /api/lecturas -> dormir.
// Cableado: sensor 5V -> 3V3, GND -> GND, Trig -> D25, Echo -> D26.
// secrets.h (Wi-Fi, URL, API key, id del contenedor) NO debe subirse al repositorio.

// ---------- Pines ----------
constexpr uint8_t PIN_TRIG = 25;  // salida: pulso de disparo
constexpr uint8_t PIN_ECHO = 26;  // entrada: eco (3,3 V, sin divisor)

// ---------- Calibracion (medir en el contenedor real) ----------
constexpr float DIST_VACIO_CM = 100.0f;  // sensor al fondo, contenedor vacio (0 %)
constexpr float DIST_LLENO_CM = 25.0f;   // contenedor lleno (100 %); mayor que la zona ciega
static_assert(DIST_VACIO_CM > DIST_LLENO_CM, "DIST_VACIO_CM debe ser mayor que DIST_LLENO_CM");

// ---------- Sensor ----------
constexpr float    DIST_MIN_VALIDA_CM = 20.0f;   // zona ciega del AJ-SR04M
constexpr float    DIST_MAX_VALIDA_CM = 600.0f;
constexpr float    CM_POR_US          = 0.0343f / 2.0f;  // sonido a ~20 C, ida y vuelta
constexpr uint32_t ECHO_TIMEOUT_US    = 35000;   // ~6 m
constexpr uint8_t  MUESTRAS           = 5;       // mediciones por ciclo (se usa la mediana)
constexpr uint32_t PAUSA_MUESTRAS_MS  = 100;
constexpr uint32_t ARRANQUE_SENSOR_MS = 300;

// ---------- Ciclo y red ----------
constexpr uint64_t INTERVALO_MIN   = 1;      // piloto: 10 (RNF-02: cada 5 a 10 min)
constexpr uint32_t WIFI_TIMEOUT_MS = 15000;
constexpr uint32_t HTTP_TIMEOUT_MS = 20000;  // margen por si Render tarda en responder
constexpr uint8_t  INTENTOS_ENVIO  = 2;

// Una medicion en cm, o -1 si no hubo eco.
float medirUnaVezCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(5);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(15);
  digitalWrite(PIN_TRIG, LOW);
  const unsigned long us = pulseIn(PIN_ECHO, HIGH, ECHO_TIMEOUT_US);
  return us == 0 ? -1.0f : us * CM_POR_US;
}

// Mediana de las mediciones validas, o -1 si ninguna sirvio.
float medirMedianaCm() {
  float v[MUESTRAS];
  uint8_t n = 0;
  for (uint8_t i = 0; i < MUESTRAS; i++) {
    const float d = medirUnaVezCm();
    if (d >= DIST_MIN_VALIDA_CM && d <= DIST_MAX_VALIDA_CM) v[n++] = d;
    delay(PAUSA_MUESTRAS_MS);
  }
  if (n == 0) return -1.0f;
  std::sort(v, v + n);
  return v[n / 2];
}

int calcularPorcentaje(float distCm) {
  const float p = (DIST_VACIO_CM - distCm) / (DIST_VACIO_CM - DIST_LLENO_CM) * 100.0f;
  return constrain(static_cast<int>(lroundf(p)), 0, 100);
}

bool conectarWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  const uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < WIFI_TIMEOUT_MS) delay(100);
  return WiFi.status() == WL_CONNECTED;
}

bool enviarLectura(int porcentaje) {
  WiFiClientSecure client;
  client.setInsecure();  // PILOTO: no valida el certificado. Produccion: setCACert().
  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(client, API_URL)) return false;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + API_KEY);
  // Sin fecha_lectura: el servidor usa su propia hora (el ESP32 no tiene reloj).
  const String cuerpo = String("{\"id_contenedor\":") + ID_CONTENEDOR +
                        ",\"porcentaje_llenado\":" + porcentaje + "}";
  const int codigo = http.POST(cuerpo);
  Serial.printf("POST /api/lecturas -> %d\n", codigo);
  http.end();
  return codigo >= 200 && codigo < 300;
}

[[noreturn]] void dormir() {
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  Serial.printf("Durmiendo %llu min\n", INTERVALO_MIN);
  Serial.flush();
  esp_sleep_enable_timer_wakeup(INTERVALO_MIN * 60ULL * 1000000ULL);
  esp_deep_sleep_start();
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  digitalWrite(PIN_TRIG, LOW);
  pinMode(PIN_ECHO, INPUT);

  // 1) Medir
  delay(ARRANQUE_SENSOR_MS);
  const float distancia = medirMedianaCm();
  if (distancia < 0) {
    Serial.println("Sin medicion valida (revise cables o distancia fuera de rango). No se envia.");
    dormir();
  }
  const int porcentaje = calcularPorcentaje(distancia);
  Serial.printf("Distancia %.1f cm -> %d %%\n", distancia, porcentaje);

  // 2) Enviar
  if (conectarWifi()) {
    Serial.printf("Wi-Fi OK, RSSI %d dBm\n", WiFi.RSSI());
    for (uint8_t i = 0; i < INTENTOS_ENVIO && !enviarLectura(porcentaje); i++) delay(2000);
  } else {
    Serial.println("Sin Wi-Fi. Se reintenta en el proximo ciclo.");
  }

  // 3) Dormir
  dormir();
}

void loop() {}  // no se llega aqui: el ESP32 duerme al final de setup()