import { assets, alerts, maintenance } from "../data/mockDatabase.js";

// POST /api/telemetry or /api/sensors/ingest
// Receives multi-sensor packets directly from ESP32 edge devices
export const ingestTelemetry = (req, res) => {
  const {
    assetId,
    // Sensors from flowchart
    temperature,    // DS18B20 (°C)
    vibration,      // MPU6050 (Velocity mm/s or peak g)
    vibration_x,
    vibration_y,
    vibration_z,
    current,        // ACS712 (Amperes A)
    voltage,        // Voltage Sensor (Volts V)
    rpm,            // Optical Encoder (RPM)
    humidity,       // DHT22 (%)
    rssi,           // Wi-Fi signal strength
    deviceId = "ESP32-NODE-01",
  } = req.body;

  if (!assetId) {
    return res.status(400).json({
      success: false,
      message: "assetId is required (e.g., MOTOR-01, PUMP-01, GEN-01)",
    });
  }

  const asset = assets.find((a) => a.id.toLowerCase() === assetId.toLowerCase());
  if (!asset) {
    return res.status(404).json({
      success: false,
      message: `Asset ${assetId} not found in registry`,
    });
  }

  const now = new Date();
  const timeString = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  // Default fallbacks based on previous reading
  const last = asset.telemetry.at(-1) || {};
  const currentVib = vibration !== undefined ? +vibration : (last.vibration || 0.23);
  const currentTemp = temperature !== undefined ? +temperature : (last.temperature || 37.5);
  const currentCur = current !== undefined ? +current : (last.current || 1.0);
  const currentRpm = rpm !== undefined ? Math.round(+rpm) : (last.rpm || 1420);
  const currentVolt = voltage !== undefined ? +voltage : (last.voltage || 415);
  const currentHum = humidity !== undefined ? +humidity : (last.humidity || 45);

  const reading = {
    t: asset.telemetry.length,
    time: timeString,
    vibration: currentVib,
    vibration_x: vibration_x !== undefined ? +vibration_x : +(currentVib * 0.7).toFixed(3),
    vibration_y: vibration_y !== undefined ? +vibration_y : +(currentVib * 0.5).toFixed(3),
    vibration_z: vibration_z !== undefined ? +vibration_z : +(currentVib * 0.4).toFixed(3),
    temperature: currentTemp,
    current: currentCur,
    voltage: currentVolt,
    rpm: currentRpm,
    humidity: currentHum,
    rssi: rssi || -62,
    sensorChips: {
      temperature: "DS18B20",
      vibration: "MPU6050",
      current: "ACS712",
      voltage: "Voltage Sensor",
      rpm: "Optical Encoder",
      humidity: "DHT22",
    },
  };

  // Keep rolling buffer of 50 data points
  asset.telemetry.push(reading);
  if (asset.telemetry.length > 50) {
    asset.telemetry.shift();
  }

  // Anomaly evaluation against baseline
  const isVibHigh = asset.baseline?.vibration && currentVib > asset.baseline.vibration[1];
  const isCurHigh = asset.baseline?.current && currentCur > asset.baseline.current[1];
  const isTempHigh = asset.baseline?.temperature && currentTemp > asset.baseline.temperature[1];

  let anomalyDetected = false;
  let likelyFault = "Normal Operation";
  let faultComponent = null;

  if (isVibHigh && isCurHigh) {
    anomalyDetected = true;
    asset.status = "high-risk";
    asset.risk = Math.min(95, Math.max(75, asset.risk + 12));
    asset.health = Math.max(15, 100 - asset.risk);
    likelyFault = "Bearing Race Wear & Rotor Misalignment";
    faultComponent = "Drive-End Bearing";

    // Auto-create alert if none exists
    const hasOpenAlert = alerts.some((al) => al.assetId === asset.id && al.status === "open");
    if (!hasOpenAlert) {
      alerts.unshift({
        id: `ALT-${Math.floor(100 + Math.random() * 899)}`,
        severity: "critical",
        assetId: asset.id,
        signal: `MPU6050 & ACS712 Baseline Breach (${currentVib} mm/s, ${currentCur} A)`,
        message: `High risk mechanical deviation detected on ${asset.name}. Drive-end bearing failure predicted with 87% confidence.`,
        risk: asset.risk,
        time: "just now",
        status: "open",
        faultComponent,
      });
    }
  } else if (isVibHigh || isCurHigh || isTempHigh) {
    anomalyDetected = true;
    if (asset.status !== "high-risk") {
      asset.status = "attention";
      asset.risk = Math.min(65, Math.max(35, asset.risk + 6));
      asset.health = Math.max(35, 100 - asset.risk);
      likelyFault = isVibHigh ? "Early Bearing Degradation" : isTempHigh ? "Cooling Inefficiency" : "Stator Load Deviation";
      faultComponent = isVibHigh ? "Drive-End Bearing" : isTempHigh ? "Stator Windings" : "Electrical Terminal";
    }
  }

  res.status(201).json({
    success: true,
    message: "ESP32 multi-sensor telemetry ingested successfully",
    assetId: asset.id,
    anomalyDetected,
    diagnostics: {
      status: asset.status,
      healthScore: asset.health,
      riskScore: asset.risk,
      likelyFault,
      faultComponent,
      iso10816Severity: currentVib > 4.5 ? "Zone D (Unacceptable)" : currentVib > 2.8 ? "Zone C (Restricted)" : "Zone A/B (Satisfactory)",
    },
    reading,
  });
};

// GET /api/telemetry/:assetId
export const getTelemetryByAsset = (req, res) => {
  const { assetId } = req.params;
  const asset = assets.find((a) => a.id.toLowerCase() === assetId.toLowerCase());

  if (!asset) {
    return res.status(404).json({ success: false, message: `Asset ${assetId} not found` });
  }

  res.json({
    success: true,
    assetId: asset.id,
    latest: asset.telemetry.at(-1),
    baseline: asset.baseline,
    sensorChips: {
      temperature: "DS18B20",
      vibration: "MPU6050",
      current: "ACS712",
      voltage: "Voltage Sensor",
      rpm: "Optical Encoder",
      humidity: "DHT22",
    },
    telemetry: asset.telemetry,
  });
};
