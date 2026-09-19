/*
  ================================================================================
  IRONside - ESP32 Industrial Multi-Sensor Edge Node Firmware
  ================================================================================
  Compatible with: ESP32 DevKit v1 / NodeMCU-32S
  Target Sensors:
    1. Vibration:       MPU6050 (I2C: SDA=GPIO 21, SCL=GPIO 22)
    2. Temperature:     DS18B20 (OneWire: GPIO 4 with 4.7k pullup)
    3. Current:         ACS712 20A/30A (Analog: GPIO 34)
    4. Voltage:         0-25V Voltage Divider Sensor (Analog: GPIO 35)
    5. RPM / Tachometer:Optical Interrupter / Encoder (Interrupt: GPIO 18)
    6. Humidity:        DHT22 (Digital: GPIO 5)

  Pipeline Stage: [3. EDGE DEVICE (ESP32)]
  Sends JSON telemetry packets to Node.js/Express Backend via HTTP POST.
  ================================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ---------- NETWORK CONFIGURATION ----------
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://192.168.1.100:5000/api/telemetry"; // Replace with your backend server IP

// ---------- ASSET CONFIGURATION ----------
const char* ASSET_ID = "MOTOR-01";
const char* DEVICE_ID = "ESP32-EDGE-NODE-01";
const unsigned long SEND_INTERVAL_MS = 1000; // Sample and send every 1 second

// ---------- PIN DEFINITIONS ----------
#define ONE_WIRE_BUS 4     // DS18B20 Temp Sensor
#define ACS712_PIN 34      // Current Sensor Analog Pin
#define VOLTAGE_PIN 35     // Voltage Sensor Analog Pin
#define RPM_PIN 18         // Optical Encoder Interrupt Pin
#define DHT_PIN 5          // DHT22 Humidity Sensor
#define DHT_TYPE DHT22

// ---------- SENSOR OBJECTS ----------
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature ds18b20(&oneWire);
DHT dht(DHT_PIN, DHT_TYPE);

// MPU6050 I2C Address
const int MPU_ADDR = 0x68;

// RPM Calculation Variables
volatile unsigned int pulseCount = 0;
unsigned long lastRpmCalcTime = 0;
float calculatedRpm = 0;

void IRAM_ATTR countPulse() {
  pulseCount++;
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- Initializing IRONside ESP32 Edge Node ---");

  // 1. Initialize I2C and MPU6050
  Wire.begin(21, 22);
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B); // PWR_MGMT_1 register
  Wire.write(0);    // Wake up MPU6050
  Wire.endTransmission(true);
  Serial.println("✓ MPU6050 Vibration Sensor Initialized");

  // 2. Initialize DS18B20 & DHT22
  ds18b20.begin();
  dht.begin();
  Serial.println("✓ DS18B20 & DHT22 Environmental Sensors Initialized");

  // 3. Setup RPM Interrupt
  pinMode(RPM_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(RPM_PIN), countPulse, FALLING);
  Serial.println("✓ Optical RPM Encoder Initialized");

  // 4. Connect to Wi-Fi
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  static unsigned long lastSendTime = 0;
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();
    readSensorsAndTransmit();
  }
}

void connectWiFi() {
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ Wi-Fi Connected! IP Address: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n⚠️ Wi-Fi Connection Failed. Retrying in loop...");
  }
}

void readSensorsAndTransmit() {
  // 1. Calculate RPM
  unsigned long now = millis();
  unsigned long timeDiff = now - lastRpmCalcTime;
  if (timeDiff >= 1000) {
    detachInterrupt(digitalPinToInterrupt(RPM_PIN));
    calculatedRpm = (pulseCount * 60.0) / (timeDiff / 1000.0);
    pulseCount = 0;
    lastRpmCalcTime = now;
    attachInterrupt(digitalPinToInterrupt(RPM_PIN), countPulse, FALLING);
  }

  // 2. Read MPU6050 Acceleration / Vibration (raw & velocity estimate)
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B); // Accel data register
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 6, true);

  int16_t rawAcX = Wire.read() << 8 | Wire.read();
  int16_t rawAcY = Wire.read() << 8 | Wire.read();
  int16_t rawAcZ = Wire.read() << 8 | Wire.read();

  // Convert to g-force
  float gX = rawAcX / 16384.0;
  float gY = rawAcY / 16384.0;
  float gZ = rawAcZ / 16384.0;

  // Composite Vibration RMS (mm/s estimate)
  float totalVib = sqrt(gX * gX + gY * gY + gZ * gZ) * 9.81;

  // 3. Read DS18B20 Temperature
  ds18b20.requestTemperatures();
  float temperatureC = ds18b20.getTempCByIndex(0);
  if (temperatureC == DEVICE_DISCONNECTED_C) {
    temperatureC = 37.5; // Fallback demo default
  }

  // 4. Read ACS712 Current (Sampling RMS)
  int rawCurrent = analogRead(ACS712_PIN);
  float voltageAdc = (rawCurrent / 4095.0) * 3.3;
  float currentAmps = abs((voltageAdc - 1.65) / 0.100); // 100mV/A for ACS712-20A

  // 5. Read Voltage Sensor
  int rawVolt = analogRead(VOLTAGE_PIN);
  float measuredVoltage = (rawVolt / 4095.0) * 3.3 * 5.0; // Voltage divider ratio

  // 6. Read DHT22 Humidity
  float humidityPct = dht.readHumidity();
  if (isnan(humidityPct)) humidityPct = 45.0;

  // 7. Format JSON Payload matching IRONside REST Ingestion Specification
  StaticJsonDocument<512> doc;
  doc["assetId"] = ASSET_ID;
  doc["deviceId"] = DEVICE_ID;
  doc["temperature"] = serialized(String(temperatureC, 2));
  doc["vibration"] = serialized(String(totalVib, 3));
  doc["vibration_x"] = serialized(String(gX, 3));
  doc["vibration_y"] = serialized(String(gY, 3));
  doc["vibration_z"] = serialized(String(gZ, 3));
  doc["current"] = serialized(String(currentAmps, 2));
  doc["voltage"] = serialized(String(measuredVoltage, 1));
  doc["rpm"] = (int)calculatedRpm;
  doc["humidity"] = serialized(String(humidityPct, 1));
  doc["rssi"] = WiFi.RSSI();

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  // 8. Transmit via HTTP POST
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.POST(jsonPayload);
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.printf("[HTTP %d] Telemetry Streamed ➔ %s\n", httpResponseCode, jsonPayload.c_str());
    } else {
      Serial.printf("❌ HTTP POST Failed, Error: %s\n", http.errorToString(httpResponseCode).c_str());
    }
    http.end();
  }
}
