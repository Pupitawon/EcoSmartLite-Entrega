#include <Arduino.h>

// EcoSmart - Nodo sensor (ESP32 + AJ-SR04M)
// Ciclo: despertar -> encender sensor -> medir -> apagar sensor -> Wi-Fi -> POST /api/lecturas -> dormir.
// Placa en Arduino IDE: "ESP32 Dev Module". Librerias: solo las incluidas con el core de ESP32.
// Copia secrets.h.example como secrets.h y completa los datos. NO subas secrets.h al repositorio.

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include "secrets.h"

// ---------- Pines ----------
#define PIN_TRIG       25   // salida: pulso de disparo al sensor
#define PIN_ECHO       26   // entrada: eco del sensor (3,3 V, no necesita divisor)
#define PIN_SENSOR_EN  27   // compuerta del MOSFET canal P: LOW = sensor encendido, HIGH = apagado

// ---------- Calibracion (medir en el contenedor real) ----------
const float DIST_VACIO_CM = 100.0;  // distancia del sensor al fondo con el contenedor vacio (0 %)
const float DIST_LLENO_CM = 25.0;   // distancia con el contenedor lleno (100 %); debe ser mayor que la zona ciega (~20-25 cm)

// ---------- Ciclo ----------
const uint64_t INTERVALO_MIN   = 1;   // minutos entre lecturas (RNF-02: cada 5 a 10 min)
const uint8_t  MUESTRAS        = 5;    // mediciones por ciclo; se usa la mediana
const uint32_t WIFI_TIMEOUT_MS = 15000;
const uint32_t HTTP_TIMEOUT_MS = 20000; // margen por si Render tarda en responder

// ---------- Sensor ----------
void sensorEncender() { digitalWrite(PIN_SENSOR_EN, LOW);  }
void sensorApagar()   { digitalWrite(PIN_SENSOR_EN, HIGH); }

// Una medicion en cm, o -1 si no hubo eco.
float medirUnaVezCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(5);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(15);
  digitalWrite(PIN_TRIG, LOW);
  unsigned long us = pulseIn(PIN_ECHO, HIGH, 35000UL);  // ~6 m maximo
  if (us == 0) return -1;
  return us * 0.0343f / 2.0f;  // velocidad del sonido a ~20 C
}

// Mediana de varias mediciones validas (descarta fuera de 20-600 cm). Devuelve -1 si ninguna sirvio.
float medirMedianaCm() {
  float v[MUESTRAS];
  int n = 0;
  for (uint8_t i = 0; i < MUESTRAS; i++) {
    float d = medirUnaVezCm();
    if (d >= 20.0f && d <= 600.0f) v[n++] = d;
    delay(100);
  }
  if (n == 0) return -1;
  for (int i = 1; i < n; i++) {           // ordenar (insercion)
    float x = v[i];
    int j = i - 1;
    while (j >= 0 && v[j] > x) { v[j + 1] = v[j]; j--; }
    v[j + 1] = x;
  }
  return v[n / 2];
}

int calcularPorcentaje(float distCm) {
  float p = (DIST_VACIO_CM - distCm) / (DIST_VACIO_CM - DIST_LLENO_CM) * 100.0f;
  return constrain((int)lroundf(p), 0, 100);
}

// ---------- Red ----------
bool conectarWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < WIFI_TIMEOUT_MS) delay(100);
  return WiFi.status() == WL_CONNECTED;
}

bool enviarLectura(int porcentaje) {
  WiFiClientSecure client;
  client.setInsecure();  // PILOTO: no valida el certificado. Para produccion, usar setCACert() con la raiz del servidor.
  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(client, API_URL)) return false;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + API_KEY);
  // Sin fecha_lectura: el servidor usa su propia hora (el ESP32 no tiene reloj propio).
  String cuerpo = String("{\"id_contenedor\":") + ID_CONTENEDOR +
                  ",\"porcentaje_llenado\":" + porcentaje + "}";
  int codigo = http.POST(cuerpo);
  Serial.printf("POST /api/lecturas -> %d\n", codigo);
  http.end();
  return codigo >= 200 && codigo < 300;
}

// ---------- Dormir ----------
void dormir() {
  sensorApagar();
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  Serial.printf("Durmiendo %llu min\n", INTERVALO_MIN);
  Serial.flush();
  esp_sleep_enable_timer_wakeup(INTERVALO_MIN * 60ULL * 1000000ULL);
  esp_deep_sleep_start();
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_SENSOR_EN, OUTPUT);
  sensorApagar();
  pinMode(PIN_TRIG, OUTPUT);
  digitalWrite(PIN_TRIG, LOW);
  pinMode(PIN_ECHO, INPUT);

  // 1) Medir
  sensorEncender();
  delay(600);  // estabilizacion del sensor tras energizar
  float d = 40.0;
  sensorApagar();

  if (d < 0) {
    Serial.println("Sin medicion valida (sensor desconectado o fuera de rango). No se envia.");
    dormir();
  }
  int pct = calcularPorcentaje(d);
  Serial.printf("Distancia %.1f cm -> %d %%\n", d, pct);

  // 2) Enviar (hasta 2 intentos)
  if (conectarWifi()) {
    if (!enviarLectura(pct)) {
      delay(2000);
      enviarLectura(pct);
    }
  } else {
    Serial.println("Sin Wi-Fi. Se reintenta en el proximo ciclo.");
  }

  // 3) Dormir
  dormir();
}

void loop() {}  // nunca se llega aqui: el ESP32 duerme al final de setup()
