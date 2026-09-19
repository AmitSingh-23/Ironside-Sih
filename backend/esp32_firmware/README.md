# ESP32 Multi-Sensor Edge Node Setup Guide

This firmware turns an **ESP32** into an industrial edge node that captures real-time data from 6 physical sensor channels and streams it to your IRONside Node.js backend.

---

## 🔌 Hardware Pinout & Wiring

| Sensor | Parameter Monitored | ESP32 Pin | Protocol / Interface | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **MPU6050** | 3-Axis Vibration & Velocity (mm/s) | **SDA: GPIO 21**<br>**SCL: GPIO 22** | I2C (Address `0x68`) | Mount directly on machine bearing housing |
| **DS18B20** | Surface Temperature (°C) | **DATA: GPIO 4** | OneWire | Connect 4.7kΩ pullup resistor between VCC & DATA |
| **ACS712** | Motor Phase Current (A) | **OUT: GPIO 34** | Analog ADC | 20A / 30A Hall-effect module |
| **Voltage Sensor** | Terminal Voltage (V) | **OUT: GPIO 35** | Analog ADC | 0–25V resistive voltage divider |
| **Optical Encoder** | Shaft Speed (RPM) | **SIGNAL: GPIO 18** | Hardware Interrupt | Slotted disc or reflective optical tape on shaft |
| **DHT22** | Ambient Air Temp & Humidity (%) | **DATA: GPIO 5** | Digital GPIO | Measures ambient environment |

---

## 🛠️ Flashing with Arduino IDE

1. **Install Arduino IDE Libraries**:
   - `ArduinoJson` (by Benoit Blanchon)
   - `DallasTemperature` (by Miles Burton)
   - `OneWire` (by Paul Stoffregen)
   - `DHT sensor library` (by Adafruit)

2. **Configure Wi-Fi & Backend Endpoint**:
   Open `esp32_sensor_node.ino` and update:
   ```cpp
   const char* ssid = "YOUR_WIFI_NAME";
   const char* password = "YOUR_WIFI_PASSWORD";
   const char* serverUrl = "http://<YOUR_LAPTOP_IP>:5000/api/telemetry";
   const char* ASSET_ID = "MOTOR-01"; // or "PUMP-01", "GEN-01"
   ```

3. **Select Board**: `Tools` ➔ `Board` ➔ `ESP32 Dev Module`.
4. **Upload**: Connect ESP32 via USB and click **Upload**.
5. **Open Serial Monitor** (`115200 baud`) to see live JSON packets streaming directly to your backend!
