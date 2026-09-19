// MongoDB Mongoose Schema for time-series sensor ingestion (optional Mongoose model)
// Ready to plug into MongoDB Atlas or local MongoDB instance

export const SensorReadingSchema = {
  assetId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  deviceId: { type: String, default: "ESP32-NODE-01" },
  sensors: {
    temperature: {
      value: Number,      // DS18B20 in °C
      sensorType: { type: String, default: "DS18B20" },
      status: String      // normal, warning, critical
    },
    vibration: {
      velocity_rms: Number, // MPU6050 mm/s (ISO 10816 standard)
      accel_g: Number,      // Peak acceleration in g
      raw_x: Number,
      raw_y: Number,
      raw_z: Number,
      sensorType: { type: String, default: "MPU6050" },
      status: String
    },
    current: {
      value: Number,      // ACS712 in Amperes (A)
      sensorType: { type: String, default: "ACS712" },
      status: String
    },
    voltage: {
      value: Number,      // Voltage Sensor (V)
      sensorType: { type: String, default: "Voltage Sensor" },
      status: String
    },
    rpm: {
      value: Number,      // Optical Encoder (RPM)
      sensorType: { type: String, default: "Optical Encoder" },
      status: String
    },
    humidity: {
      value: Number,      // DHT22 (%)
      sensorType: { type: String, default: "DHT22" }
    }
  },
  diagnostics: {
    anomalyScore: Number, // 0.0 - 1.0 (Isolation Forest prediction)
    predictedRisk: Number, // 0 - 100% (XGBoost / Random Forest)
    healthScore: Number,   // 0 - 100
    likelyIssue: String,
    faultComponent: String // e.g. "Bearing", "Impeller", "Winding", "Rotor Shaft"
  },
  network: {
    rssi: Number,         // Wi-Fi signal strength in dBm
    ip: String
  }
};
