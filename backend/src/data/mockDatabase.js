// Data store for IRONside backend (in-memory mock database ready to swap with MongoDB)

const LOCATIONS = ["Electrical Lab", "Mechanical Workshop", "HVAC Block", "Generator Room", "Pump House", "Fabrication Lab"];
const TYPES = ["Induction Motor", "Centrifugal Pump", "Diesel Generator", "HVAC Unit", "Air Compressor", "Conveyor Drive"];

export function seedTelemetry(baseVib, baseCur, baseTemp, baseRpm, n = 24) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const wobble = Math.sin(i / 3) * 0.015 + Math.sin(i / 7) * 0.008;
    out.push({
      t: i,
      time: `${String(9).padStart(2, "0")}:${String(i).padStart(2, "0")}`,
      vibration: +(baseVib + wobble).toFixed(3),
      current: +(baseCur + wobble * 2).toFixed(2),
      temperature: +(baseTemp + wobble * 6).toFixed(1),
      rpm: Math.round(baseRpm + wobble * 40),
    });
  }
  return out;
}

const NAMED_ASSETS = [
  {
    id: "MOTOR-01",
    name: "Workshop Motor 01",
    type: "Induction Motor",
    location: "Electrical Lab",
    edge: "EDGE-01",
    status: "healthy",
    health: 84,
    risk: 16,
    criticality: "high",
    lastMaint: "12 days ago",
    baseline: { vibration: [0.18, 0.30], current: [0.90, 1.05], temperature: [34, 42] },
    telemetry: seedTelemetry(0.23, 0.98, 37.5, 1420),
  },
  {
    id: "MOTOR-02",
    name: "Workshop Motor 02",
    type: "Induction Motor",
    location: "Electrical Lab",
    edge: "EDGE-01",
    status: "healthy",
    health: 91,
    risk: 9,
    criticality: "medium",
    lastMaint: "6 days ago",
    baseline: { vibration: [0.15, 0.28], current: [0.85, 1.0], temperature: [33, 40] },
    telemetry: seedTelemetry(0.19, 0.88, 35.2, 1440),
  },
  {
    id: "PUMP-01",
    name: "Primary Coolant Pump",
    type: "Centrifugal Pump",
    location: "Pump House",
    edge: "EDGE-03",
    status: "attention",
    health: 61,
    risk: 39,
    criticality: "high",
    lastMaint: "28 days ago",
    baseline: { vibration: [0.20, 0.34], current: [1.10, 1.30], temperature: [36, 44] },
    telemetry: seedTelemetry(0.33, 1.24, 42.1, 2100),
  },
  {
    id: "HVAC-01",
    name: "HVAC Block Unit 01",
    type: "HVAC Unit",
    location: "HVAC Block",
    edge: "EDGE-04",
    status: "healthy",
    health: 88,
    risk: 12,
    criticality: "medium",
    lastMaint: "3 days ago",
    baseline: { vibration: [0.10, 0.20], current: [2.1, 2.6], temperature: [28, 34] },
    telemetry: seedTelemetry(0.14, 2.3, 30.5, 980),
  },
  {
    id: "GEN-01",
    name: "Standby Generator 01",
    type: "Diesel Generator",
    location: "Generator Room",
    edge: "EDGE-05",
    status: "attention",
    health: 58,
    risk: 42,
    criticality: "high",
    lastMaint: "41 days ago",
    baseline: { vibration: [0.22, 0.36], current: [3.0, 3.6], temperature: [45, 58] },
    telemetry: seedTelemetry(0.35, 3.5, 55.8, 1800),
  },
];

function genFleet() {
  const out = [];
  const plan = [
    [15, "healthy"],
    [2, "attention"],
    [2, "high-risk"],
  ];
  let n = 6;
  plan.forEach(([count, status]) => {
    for (let i = 0; i < count; i++) {
      const type = TYPES[n % TYPES.length];
      const loc = LOCATIONS[n % LOCATIONS.length];
      const health = status === "healthy" ? 75 + (n % 20) : status === "attention" ? 50 + (n % 15) : 20 + (n % 15);
      const risk = 100 - health;
      out.push({
        id: `AST-${String(n).padStart(2, "0")}`,
        name: `${type} ${String(n).padStart(2, "0")}`,
        type,
        location: loc,
        edge: `EDGE-0${(n % 5) + 1}`,
        status,
        health,
        risk,
        criticality: n % 3 === 0 ? "high" : n % 3 === 1 ? "medium" : "low",
        lastMaint: `${5 + (n % 30)} days ago`,
        baseline: { vibration: [0.15, 0.3], current: [0.9, 1.3], temperature: [32, 44] },
        telemetry: seedTelemetry(0.2 + (100 - health) / 400, 1.0, 36, 1500, 8),
      });
      n++;
    }
  });
  return out;
}

export let assets = [...NAMED_ASSETS, ...genFleet()];

export let alerts = [
  {
    id: "ALT-104",
    severity: "attention",
    assetId: "PUMP-01",
    signal: "Vibration trending above baseline",
    message: "Vibration levels have drifted above learned baseline over the past 6 hours.",
    risk: 39,
    time: "34 min ago",
    status: "open",
  },
  {
    id: "ALT-103",
    severity: "attention",
    assetId: "GEN-01",
    signal: "Temperature deviation",
    message: "Operating temperature is elevated relative to historical pattern for this load state.",
    risk: 42,
    time: "2 hr ago",
    status: "open",
  },
  {
    id: "ALT-098",
    severity: "low",
    assetId: "HVAC-01",
    signal: "Minor current fluctuation",
    message: "Brief current fluctuation observed, within tolerance, logged for pattern tracking.",
    risk: 12,
    time: "1 day ago",
    status: "resolved",
  },
];

export let maintenance = [
  {
    id: "WO-221",
    assetId: "PUMP-01",
    issue: "Vibration deviation increasing",
    priority: "High",
    recommended: "Inspect impeller balance and bearing condition.",
    technician: "R. Sharma",
    due: "2 days",
    status: "assigned",
  },
  {
    id: "WO-219",
    assetId: "GEN-01",
    issue: "Temperature deviation",
    priority: "Medium",
    recommended: "Check coolant levels and ventilation pathway.",
    technician: "Unassigned",
    due: "5 days",
    status: "work_order",
  },
  {
    id: "WO-215",
    assetId: "HVAC-01",
    issue: "Routine filter inspection",
    priority: "Low",
    recommended: "Standard scheduled inspection.",
    technician: "A. Verma",
    due: "Completed",
    status: "completed",
  },
];
