import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Cell, ZAxis, Legend
} from "recharts";
import Device3DViewer from "./device3d/Device3DViewer";
import {
  Activity, Thermometer, Zap, Gauge, AlertTriangle, Wrench, Factory, Cpu,
  Database, Wifi, Server, Bell, Settings, ShieldCheck, Search, ChevronRight,
  X, CheckCircle2, Circle, ArrowUp, ArrowDown, LayoutGrid, ListTree, Radio,
  ClipboardList, BarChart3, Boxes, ChevronDown, Play, RotateCcw, MapPin,
  ArrowRight, Dot
} from "lucide-react";

/* ============================================================
   DESIGN TOKENS
   ============================================================ */
const T = {
  navy: "#17324D",
  navyDeep: "#101A22",
  blue: "#245B73",
  teal: "#2A7F8E",
  healthy: "#2E7D5B",
  warning: "#D69E2E",
  critical: "#C94A4A",
  bg: "#F5F7F8",
  surface: "#FFFFFF",
  text: "#17212B",
  textSoft: "#64748B",
  border: "#D9E0E5",
};

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');
    .iron-root { font-family: 'Poppins', ui-sans-serif, system-ui, sans-serif; color:${T.text}; background:${T.bg}; }
    .iron-root * { box-sizing: border-box; }
    .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
    .display { font-family: 'Space Grotesk', 'Inter', sans-serif; }
    .iron-scroll::-webkit-scrollbar { width:6px; height:6px; }
    .iron-scroll::-webkit-scrollbar-thumb { background:${T.border}; border-radius:3px; }
    @keyframes pulseLine { 0%{stroke-dashoffset:120} 100%{stroke-dashoffset:0} }
    @keyframes fadeUp { from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:translateY(0)} }
    @keyframes rotSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes spinFast { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes drift { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.35} }
    @keyframes pingSlow { 0%{transform:scale(1); opacity:0.9;} 100%{transform:scale(2.8); opacity:0;} }
    @keyframes pulseBeacon { 0%,100%{box-shadow: 0 0 0 0 rgba(201,74,74,0.8);} 50%{box-shadow: 0 0 0 12px rgba(201,74,74,0);} }
    .fade-up { animation: fadeUp .5s ease both; }
    .badge { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:600; letter-spacing:.04em; padding:3px 8px; border-radius:4px; text-transform:uppercase; }
    .row-hover:hover { background:#F0F3F5; }
    .focus-ring:focus-visible { outline:2px solid ${T.teal}; outline-offset:2px; }
    @media (prefers-reduced-motion: reduce) { *{animation:none !important; transition:none !important;} }
  `}</style>
);

const statusColor = (s) => ({
  healthy: T.healthy, attention: T.warning, "high-risk": T.critical,
  critical: T.critical, offline: T.textSoft,
}[s] || T.textSoft);

const statusLabel = (s) => ({
  healthy: "Healthy", attention: "Attention", "high-risk": "High Risk",
  critical: "Critical", offline: "Offline",
}[s] || s);

function Badge({ status, children }) {
  const c = statusColor(status);
  return (
    <span className="badge" style={{ background: `${c}17`, color: c, border: `1px solid ${c}33` }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: c, display: "inline-block" }} />
      {children || statusLabel(status)}
    </span>
  );
}

/* ============================================================
   MOCK DATA LAYER (stand-in for /services/assetService etc.
   Shaped to mirror the proposed REST contract so a real backend
   can be swapped in without touching component code.)
   ============================================================ */
const LOCATIONS = ["Electrical Lab", "Mechanical Workshop", "HVAC Block", "Generator Room", "Pump House", "Fabrication Lab"];
const TYPES = ["Induction Motor", "Centrifugal Pump", "Diesel Generator", "HVAC Unit", "Air Compressor", "Conveyor Drive"];

function seedTelemetry(baseVib, baseCur, baseTemp, baseRpm, n = 24) {
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
      pressureIn: +(12.4 + wobble * 0.5).toFixed(2),
      pressureOut: +(48.2 + wobble * 1.5).toFixed(2),
    });
  }
  return out;
}

const NAMED_ASSETS = [
  {
    id: "MOTOR-01", name: "Workshop Motor 01", type: "Induction Motor", location: "Electrical Lab",
    edge: "EDGE-01", status: "healthy", health: 84, risk: 16, criticality: "high",
    lastMaint: "12 days ago", baseline: { vibration: [0.18, 0.30], current: [0.90, 1.05], temperature: [34, 42] },
    telemetry: seedTelemetry(0.23, 0.98, 37.5, 1420),
  },
  { id: "MOTOR-02", name: "Workshop Motor 02", type: "Induction Motor", location: "Electrical Lab",
    edge: "EDGE-01", status: "healthy", health: 91, risk: 9, criticality: "medium",
    lastMaint: "6 days ago", baseline: { vibration: [0.15, 0.28], current: [0.85, 1.0], temperature: [33, 40] },
    telemetry: seedTelemetry(0.19, 0.88, 35.2, 1440) },
  { id: "PUMP-01", name: "Primary Coolant Pump", type: "Centrifugal Pump", location: "Pump House",
    edge: "EDGE-03", status: "attention", health: 61, risk: 39, criticality: "high",
    lastMaint: "28 days ago", baseline: { vibration: [0.20, 0.34], current: [1.10, 1.30], temperature: [36, 44] },
    telemetry: seedTelemetry(0.33, 1.24, 42.1, 2100) },
  { id: "HVAC-01", name: "HVAC Block Unit 01", type: "HVAC Unit", location: "HVAC Block",
    edge: "EDGE-04", status: "healthy", health: 88, risk: 12, criticality: "medium",
    lastMaint: "3 days ago", baseline: { vibration: [0.10, 0.20], current: [2.1, 2.6], temperature: [28, 34] },
    telemetry: seedTelemetry(0.14, 2.3, 30.5, 980) },
  { id: "GEN-01", name: "Standby Generator 01", type: "Diesel Generator", location: "Generator Room",
    edge: "EDGE-05", status: "attention", health: 58, risk: 42, criticality: "high",
    lastMaint: "41 days ago", baseline: { vibration: [0.22, 0.36], current: [3.0, 3.6], temperature: [45, 58] },
    telemetry: seedTelemetry(0.35, 3.5, 55.8, 1800) },
];

function genFleet() {
  const out = [];
  const plan = [ // [count, status]
    [15, "healthy"], [2, "attention"], [2, "high-risk"],
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
        type, location: loc, edge: `EDGE-0${(n % 5) + 1}`,
        status, health, risk,
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

const ALL_ASSETS = [...NAMED_ASSETS, ...genFleet()];

const INITIAL_ALERTS = [
  { id: "ALT-105", severity: "critical", assetId: "DRIVE-02", signal: "Extreme current spike detected", message: "Motor drive current spiked 300% above baseline operating limits. Immediate shutdown recommended.", risk: 95, time: "4 min ago", status: "open" },
  { id: "ALT-106", severity: "high-risk", assetId: "COMP-03", signal: "Pressure loss and thermal runaway", message: "Discharge pressure has dropped alongside an acute rise in casing temperature.", risk: 78, time: "14 min ago", status: "open" },
  { id: "ALT-104", severity: "attention", assetId: "PUMP-01", signal: "Vibration trending above baseline", message: "Vibration levels have drifted above learned baseline over the past 6 hours.", risk: 39, time: "34 min ago", status: "open" },
  { id: "ALT-103", severity: "attention", assetId: "GEN-01", signal: "Temperature deviation", message: "Operating temperature is elevated relative to historical pattern for this load state.", risk: 42, time: "2 hr ago", status: "open" },
  { id: "ALT-098", severity: "low", assetId: "HVAC-01", signal: "Minor current fluctuation", message: "Brief current fluctuation observed, within tolerance, logged for pattern tracking.", risk: 12, time: "1 day ago", status: "resolved" },
];

const INITIAL_MAINTENANCE = [
  { id: "WO-221", assetId: "PUMP-01", issue: "Vibration deviation increasing", priority: "High", recommended: "Inspect impeller balance and bearing condition.", technician: "R. Sharma", due: "2 days", status: "assigned" },
  { id: "WO-219", assetId: "GEN-01", issue: "Temperature deviation", priority: "Medium", recommended: "Check coolant levels and ventilation pathway.", technician: "Unassigned", due: "5 days", status: "work_order" },
  { id: "WO-215", assetId: "HVAC-01", issue: "Routine filter inspection", priority: "Low", recommended: "Standard scheduled inspection.", technician: "A. Verma", due: "Completed", status: "completed" },
];

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "assets", label: "Assets", icon: Boxes },
  { id: "telemetry", label: "Live Telemetry", icon: Radio },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "maintenance", label: "Maintenance", icon: ClipboardList },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "system", label: "System", icon: ListTree },
];

/* ============================================================
   3D EXPLODED MOTOR & MACHINE DISSECTION COMPONENT
   Interactive component inspection, hotspot telemetry, and fault locator
   ============================================================ */

const MOTOR_PARTS = [
  {
    id: "bearing-front",
    name: "Front Deep Groove Ball Bearing",
    category: "Bearing System",
    x: 18,
    y: 50,
    isFaultTrigger: true,
    desc: "Single-row deep groove ball bearing supporting drive-end radial and axial loads.",
    health: (a) => (a ? 24 : 96),
    status: (a) => (a ? "critical" : "healthy"),
    temp: (a) => (a ? "68.4°C" : "36.2°C"),
    vib: (a) => (a ? "0.82 g" : "0.22 g"),
    acoustic: (a) => (a ? "High (4.8 kHz demodulated peak)" : "Nominal (<0.5 kHz)"),
    faultDetail: "Spalling and micro-cracking identified along inner raceway contact zone. Elevated high-frequency vibration envelope.",
    action: "Schedule emergency bearing replacement & check shaft alignment within 24-48 hours.",
  },
  {
    id: "end-shield-front",
    name: "Front Drive-End Shield",
    category: "Housing & Stator",
    x: 10,
    y: 55,
    isFaultTrigger: false,
    desc: "Precision cast-iron flange securing the drive-end bearing and sealing internal windings.",
    health: () => 98,
    status: () => "healthy",
    temp: () => "35.8°C",
    vib: () => "0.19 g",
    acoustic: () => "Nominal",
    faultDetail: "No structural distortion, flange bolt tension nominal at 48 Nm.",
    action: "Inspect mounting bolts during next scheduled service cycle.",
  },
  {
    id: "stator-core",
    name: "Laminated Stator Core",
    category: "Electromagnetic Core",
    x: 32,
    y: 55,
    isFaultTrigger: false,
    desc: "Low-loss silicon steel laminations creating the magnetic stator circuit.",
    health: (a) => (a ? 74 : 94),
    status: (a) => (a ? "attention" : "healthy"),
    temp: (a) => (a ? "54.2°C" : "41.0°C"),
    vib: (a) => (a ? "0.32 g" : "0.20 g"),
    acoustic: () => "Nominal",
    faultDetail: "Minor thermal soak from adjacent bearing assembly; magnetic flux remains stable.",
    action: "Perform infrared thermography verification.",
  },
  {
    id: "copper-windings",
    name: "Stator Copper Windings (Class H)",
    category: "Electromagnetic Core",
    x: 43,
    y: 48,
    isFaultTrigger: false,
    desc: "Three-phase distributed enamel copper coils vacuum-pressure impregnated with epoxy.",
    health: (a) => (a ? 68 : 95),
    status: (a) => (a ? "attention" : "healthy"),
    temp: (a) => (a ? "59.8°C" : "39.5°C"),
    vib: (a) => (a ? "0.35 g" : "0.18 g"),
    acoustic: () => "Nominal",
    faultDetail: "Insulation resistance >150 MΩ; harmonic thermal dissipation slightly elevated.",
    action: "Check phase current balance and verify supply voltage THD.",
  },
  {
    id: "rotor-assembly",
    name: "Squirrel Cage Rotor Assembly",
    category: "Rotating Core",
    x: 58,
    y: 52,
    isFaultTrigger: false,
    desc: "Die-cast aluminum bar rotor dynamically balanced for continuous industrial duty.",
    health: (a) => (a ? 79 : 93),
    status: (a) => (a ? "attention" : "healthy"),
    temp: (a) => (a ? "47.5°C" : "38.2°C"),
    vib: (a) => (a ? "0.41 g" : "0.21 g"),
    acoustic: () => "Nominal",
    faultDetail: "Secondary mechanical vibration transmitted from bearing play; bar integrity intact.",
    action: "Re-verify dynamic balance (ISO G2.5) after bearing replacement.",
  },
  {
    id: "drive-shaft",
    name: "Precision Drive Shaft",
    category: "Rotating Core",
    x: 69,
    y: 50,
    isFaultTrigger: false,
    desc: "High-tensile alloy steel shaft transmitting mechanical torque to driven equipment.",
    health: () => 92,
    status: () => "healthy",
    temp: () => "37.5°C",
    vib: () => "0.24 g",
    acoustic: () => "Nominal",
    faultDetail: "Shaft total indicated runout (TIR) within 0.015 mm tolerance.",
    action: "Verify laser shaft alignment with connected load.",
  },
  {
    id: "rear-shield-bearing",
    name: "Rear Bearing & Non-Drive Shield",
    category: "Bearing System",
    x: 74,
    y: 52,
    isFaultTrigger: false,
    desc: "Non-drive end housing and deep groove bearing with grease reservoir.",
    health: () => 91,
    status: () => "healthy",
    temp: () => "38.4°C",
    vib: () => "0.25 g",
    acoustic: () => "Nominal",
    faultDetail: "Lubricant film thickness and acoustic profile within normal boundaries.",
    action: "Maintain routine re-lubrication schedule.",
  },
  {
    id: "cooling-fan",
    name: "Cooling Fan & Cowl Assembly",
    category: "Cooling Subsystem",
    x: 87,
    y: 52,
    isFaultTrigger: false,
    desc: "Bi-directional centrifugal cooling fan providing forced convective airflow over cooling fins.",
    health: () => 99,
    status: () => "healthy",
    temp: () => "31.2°C",
    vib: () => "0.14 g",
    acoustic: () => "Nominal",
    faultDetail: "Full aerodynamic airflow delivery, intake guard clean and unobstructed.",
    action: "Visual check for debris during routine rounds.",
  },
];

function InteractiveExplodedMotor({ anomaly = false, asset = null, isCompact = false }) {
  const [selectedPartId, setSelectedPartId] = useState(anomaly ? "bearing-front" : "bearing-front");
  const [hoveredPartId, setHoveredPartId] = useState(null);
  const [viewMode, setViewMode] = useState("3d"); // "3d" | "2d"
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "Bearing System" | "Electromagnetic Core" | "Rotating Core"

  // If anomaly status changes dynamically, focus on the faulty part
  useEffect(() => {
    if (anomaly) {
      setSelectedPartId("bearing-front");
    }
  }, [anomaly]);

  const selectedPart = MOTOR_PARTS.find((p) => p.id === selectedPartId) || MOTOR_PARTS[0];
  const activePart = hoveredPartId ? (MOTOR_PARTS.find((p) => p.id === hoveredPartId) || selectedPart) : selectedPart;

  const categories = ["all", "Bearing System", "Electromagnetic Core", "Rotating Core", "Cooling Subsystem"];

  const filteredParts = MOTOR_PARTS.filter(
    (p) => activeFilter === "all" || p.category === activeFilter
  );

  return (
    <div style={{ background: T.navyDeep, color: "#fff", borderRadius: 12, border: `1px solid ${T.navy}`, overflow: "hidden", position: "relative" }}>
      {/* Header controls bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid rgba(255,255,255,0.08)`, flexWrap: "wrap", gap: 10, background: "rgba(16,26,34,0.7)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, background: anomaly ? T.critical : T.teal, boxShadow: anomaly ? `0 0 12px ${T.critical}` : `0 0 8px ${T.teal}` }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 8 }}>
              <span>3D MACHINE DISSECTION & COMPONENT FAULT LOCATOR</span>
              <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: anomaly ? `${T.critical}33` : `${T.healthy}33`, color: anomaly ? "#FFA4A4" : "#6EE7B7", border: `1px solid ${anomaly ? T.critical : T.healthy}` }}>
                {anomaly ? "CRITICAL ANOMALY DETECTED" : "NOMINAL FLEET BASELINE"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#8CA2B0", marginTop: 2 }}>
              Interactive 3D exploded assembly · Click on any component hotspot to inspect sensor diagnostics
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: 2, border: "1px solid rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => setViewMode("3d")}
              style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, borderRadius: 4, border: "none", background: viewMode === "3d" ? T.teal : "transparent", color: "#fff", cursor: "pointer" }}
            >
              3D Exploded View
            </button>
            <button
              onClick={() => setViewMode("2d")}
              style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, borderRadius: 4, border: "none", background: viewMode === "2d" ? T.teal : "transparent", color: "#fff", cursor: "pointer" }}
            >
              2D Schematic
            </button>
          </div>
        </div>
      </div>

      {/* Subsystem filter pill bar */}
      <div style={{ display: "flex", gap: 6, padding: "10px 18px", borderBottom: `1px solid rgba(255,255,255,0.05)`, background: "rgba(10,18,24,0.4)", overflowX: "auto" }}>
        <span style={{ fontSize: 11, color: "#7B93A4", display: "flex", alignItems: "center", marginRight: 6, fontWeight: 600 }}>Filter Layer:</span>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveFilter(c)}
            style={{
              padding: "4px 10px",
              fontSize: 11,
              borderRadius: 999,
              border: `1px solid ${activeFilter === c ? T.teal : "rgba(255,255,255,0.1)"}`,
              background: activeFilter === c ? `${T.teal}28` : "transparent",
              color: activeFilter === c ? "#5EEAD4" : "#A0B2C0",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {c === "all" ? "All Subsystems" : c}
          </button>
        ))}
      </div>

      {/* Main visual view area */}
      <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "1.8fr 1.2fr", gap: 0, minHeight: 380 }}>
        {/* Left side: The 3D Exploded Render with interactive hotspots */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "radial-gradient(circle at 50% 50%, #152B3C 0%, #0C1720 100%)", minHeight: 340, overflow: "hidden" }}>
          {viewMode === "3d" ? (
            <div style={{ position: "relative", width: "100%", maxWidth: 680, display: "flex", justifyContent: "center" }}>
              <img
                src="/motor_exploded.jpg"
                alt="3D Exploded Motor View"
                style={{ width: "100%", height: "auto", borderRadius: 8, display: "block", filter: "contrast(1.05) brightness(0.96)" }}
              />

              {/* Glowing fault ambient aura if anomaly is active */}
              {anomaly && (
                <div
                  style={{
                    position: "absolute",
                    left: "17%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 90,
                    height: 90,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(201,74,74,0.45) 0%, rgba(201,74,74,0) 70%)",
                    pointerEvents: "none",
                    animation: "pulseBeacon 2s infinite ease-in-out",
                  }}
                />
              )}

              {/* Interactive Hotspot Markers */}
              {filteredParts.map((part) => {
                const isSelected = selectedPartId === part.id;
                const isHovered = hoveredPartId === part.id;
                const isFault = anomaly && part.isFaultTrigger;
                const partStatus = part.status(anomaly);
                const pinColor = isFault ? T.critical : partStatus === "attention" ? T.warning : T.teal;

                return (
                  <div
                    key={part.id}
                    onClick={() => setSelectedPartId(part.id)}
                    onMouseEnter={() => setHoveredPartId(part.id)}
                    onMouseLeave={() => setHoveredPartId(null)}
                    style={{
                      position: "absolute",
                      left: `${part.x}%`,
                      top: `${part.y}%`,
                      transform: "translate(-50%, -50%)",
                      cursor: "pointer",
                      zIndex: isSelected ? 30 : 20,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    {/* Hotspot Outer Radar Ring */}
                    <div
                      style={{
                        position: "relative",
                        width: isSelected || isFault ? 28 : 22,
                        height: isSelected || isFault ? 28 : 22,
                        borderRadius: "50%",
                        background: isFault ? `${T.critical}33` : `${pinColor}22`,
                        border: `2px solid ${pinColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: isFault ? `0 0 16px ${T.critical}` : isSelected ? `0 0 10px ${pinColor}` : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: pinColor,
                        }}
                      />
                      {(isFault || isSelected) && (
                        <div
                          style={{
                            position: "absolute",
                            inset: -4,
                            borderRadius: "50%",
                            border: `2px solid ${pinColor}`,
                            animation: "pingSlow 2s cubic-bezier(0, 0, 0.2, 1) infinite",
                          }}
                        />
                      )}
                    </div>

                    {/* Component Label tag */}
                    <div
                      style={{
                        marginTop: 4,
                        background: isSelected ? pinColor : isFault ? T.critical : "rgba(12, 24, 34, 0.85)",
                        color: isSelected ? (pinColor === T.warning ? "#000" : "#fff") : "#fff",
                        border: `1px solid ${pinColor}`,
                        borderRadius: 4,
                        padding: "2px 6px",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                        pointerEvents: "none",
                      }}
                    >
                      {part.id === "bearing-front" && anomaly ? "⚠ BEARING FAULT" : part.name.split(" ")[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ width: "100%", display: "flex", justifyContent: "center", padding: "20px 0" }}>
              <MotorGraphic anomaly={anomaly} size={320} />
            </div>
          )}

          {/* Quick HUD badge at bottom left of 3D viewport */}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 14,
              background: "rgba(12,24,34,0.85)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 11,
              display: "flex",
              gap: 14,
            }}
            className="mono"
          >
            <div><span style={{ color: "#7B93A4" }}>RPM:</span> <strong>{anomaly ? "1380" : "1420"}</strong></div>
            <div><span style={{ color: "#7B93A4" }}>TEMP:</span> <strong style={{ color: anomaly ? "#FFA4A4" : "#5EEAD4" }}>{anomaly ? "68.4°C" : "37.5°C"}</strong></div>
            <div><span style={{ color: "#7B93A4" }}>VIB:</span> <strong style={{ color: anomaly ? "#FFA4A4" : "#5EEAD4" }}>{anomaly ? "0.82 g" : "0.23 g"}</strong></div>
          </div>
        </div>

        {/* Right side: Detailed Component Diagnostic Inspector Drawer */}
        <div style={{ background: "rgba(12,22,30,0.95)", borderLeft: `1px solid rgba(255,255,255,0.08)`, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.teal, letterSpacing: "0.08em", textTransform: "uppercase" }}>{activePart.category}</span>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: "2px 0 0 0", color: "#fff" }}>{activePart.name}</h4>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: 4,
                  textTransform: "uppercase",
                  background: activePart.status(anomaly) === "critical" ? `${T.critical}33` : activePart.status(anomaly) === "attention" ? `${T.warning}33` : `${T.healthy}33`,
                  color: activePart.status(anomaly) === "critical" ? "#FFA4A4" : activePart.status(anomaly) === "attention" ? "#FDE047" : "#6EE7B7",
                  border: `1px solid ${statusColor(activePart.status(anomaly))}`,
                }}
              >
                {activePart.status(anomaly)}
              </span>
            </div>

            <p style={{ fontSize: 12, color: "#9FB3C2", lineHeight: 1.5, margin: "0 0 16px 0" }}>
              {activePart.desc}
            </p>

            {/* Metric gauges grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#8CA2B0", textTransform: "uppercase" }}>Health Index</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: activePart.health(anomaly) < 50 ? T.critical : activePart.health(anomaly) < 80 ? T.warning : T.healthy, marginTop: 2 }}>
                  {activePart.health(anomaly)}%
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${activePart.health(anomaly)}%`, background: activePart.health(anomaly) < 50 ? T.critical : activePart.health(anomaly) < 80 ? T.warning : T.healthy }} />
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#8CA2B0", textTransform: "uppercase" }}>Vibration RMS</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: activePart.status(anomaly) === "critical" ? T.critical : "#5EEAD4", marginTop: 2 }}>
                  {activePart.vib(anomaly)}
                </div>
                <div style={{ fontSize: 10, color: "#7B93A4", marginTop: 4 }}>Baseline: 0.18-0.30 g</div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#8CA2B0", textTransform: "uppercase" }}>Surface Temp</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: activePart.status(anomaly) === "critical" ? T.critical : "#E2E8F0", marginTop: 2 }}>
                  {activePart.temp(anomaly)}
                </div>
                <div style={{ fontSize: 10, color: "#7B93A4", marginTop: 4 }}>Normal: 34-42°C</div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#8CA2B0", textTransform: "uppercase" }}>Estimated RUL</div>
                <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: activePart.status(anomaly) === "critical" ? "#FFA4A4" : "#5EEAD4", marginTop: 4 }}>
                  {activePart.id === "bearing-front" && anomaly ? "48 Hours" : "> 4,000 Hrs"}
                </div>
                <div style={{ fontSize: 10, color: "#7B93A4", marginTop: 2 }}>Remaining Useful Life</div>
              </div>
            </div>

            {/* Diagnostic breakdown box */}
            <div style={{ background: activePart.status(anomaly) === "critical" ? "rgba(201,74,74,0.12)" : "rgba(42,127,142,0.12)", border: `1px solid ${activePart.status(anomaly) === "critical" ? `${T.critical}55` : `${T.teal}44`}`, borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: activePart.status(anomaly) === "critical" ? "#FFA4A4" : "#5EEAD4", textTransform: "uppercase", marginBottom: 4 }}>
                Diagnostic Telemetry Insight
              </div>
              <div style={{ fontSize: 12, color: "#E2E8F0", lineHeight: 1.45 }}>
                {activePart.faultDetail}
              </div>
            </div>
          </div>

          {/* Action recommendation */}
          <div style={{ borderTop: `1px solid rgba(255,255,255,0.08)`, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#8CA2B0", textTransform: "uppercase" }}>Recommended Action</div>
              <div style={{ fontSize: 11.5, color: "#E2E8F0", marginTop: 2 }}>{activePart.action}</div>
            </div>
            {anomaly && activePart.isFaultTrigger && (
              <button
                onClick={() => alert(`Work order generated for ${activePart.name} on ${asset?.id || "MOTOR-01"}. Technician assigned.`)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "none",
                  background: T.critical,
                  color: "#fff",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: `0 4px 12px ${T.critical}66`,
                }}
              >
                Dispatch Work Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MotorGraphic({ anomaly, size = 340 }) {
  const ringColor = anomaly ? T.critical : T.teal;
  return (
    <svg viewBox="0 0 400 400" width={size} height={size} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="motorBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2B4560" />
          <stop offset="100%" stopColor="#17324D" />
        </linearGradient>
        <radialGradient id="glowRing" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={ringColor} stopOpacity="0" />
          <stop offset="100%" stopColor={ringColor} stopOpacity="0.25" />
        </radialGradient>
      </defs>
      {/* outer sensor orbit */}
      <circle cx="200" cy="200" r={172} fill="url(#glowRing)" />
      <circle cx="200" cy="200" r="150" fill="none" stroke={T.border} strokeOpacity="0.25" strokeWidth="1" strokeDasharray="2 6" style={{ animation: "rotSlow 60s linear infinite", transformOrigin: "200px 200px" }} />
      {/* motor housing (STATOR) */}
      <rect x="110" y="120" width="180" height="160" rx="14" fill="url(#motorBody)" stroke={anomaly ? T.critical : "#0C1822"} strokeWidth={anomaly ? "3" : "2"} />
      <text x="200" y="110" fill={anomaly ? T.critical : T.textSoft} fontSize="12" fontWeight="700" textAnchor="middle" letterSpacing="0.1em">STATOR</text>
      
      {/* cooling fins */}
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={122 + i * 20} y="128" width="10" height="144" rx="3" fill="#0F2233" opacity="0.55" />
      ))}
      
      {/* shaft (ROTOR) */}
      <rect x="290" y="188" width="46" height="24" rx="4" fill="#3A5670" stroke={anomaly ? T.critical : "none"} strokeWidth={anomaly ? "2" : "0"} />
      <text x="313" y="180" fill={T.textSoft} fontSize="12" fontWeight="700" textAnchor="middle" letterSpacing="0.1em">ROTOR</text>
      
      <circle cx="345" cy="200" r="14" fill="#4A6A85" stroke="#0C1822" strokeWidth="2"
        style={{ animation: anomaly ? "spinFast 0.6s linear infinite" : "spinFast 3.4s linear infinite", transformOrigin: "345px 200px" }} />
      
      {/* BEARINGS (front and back) */}
      <circle cx="130" cy="200" r="18" fill="#4A6A85" stroke={anomaly ? T.critical : "#0C1822"} strokeWidth={anomaly ? "3" : "2"} />
      <circle cx="270" cy="200" r="18" fill="#4A6A85" stroke={anomaly ? T.critical : "#0C1822"} strokeWidth={anomaly ? "3" : "2"} />
      {anomaly && (
        <>
          <circle cx="130" cy="200" r="24" fill="none" stroke={T.critical} strokeWidth="2" strokeDasharray="4 4" style={{ animation: "spinFast 4s linear infinite", transformOrigin: "130px 200px" }} />
          <circle cx="270" cy="200" r="24" fill="none" stroke={T.critical} strokeWidth="2" strokeDasharray="4 4" style={{ animation: "spinFast 4s linear infinite", transformOrigin: "270px 200px" }} />
          <text x="200" y="240" fill={T.critical} fontSize="14" fontWeight="800" textAnchor="middle">BEARING FAULT DETECTED</text>
        </>
      )}

      {/* junction box */}
      <rect x="176" y="88" width="48" height="34" rx="6" fill="#20374E" stroke="#0C1822" strokeWidth="2" />
      {/* base plate */}
      <rect x="96" y="278" width="208" height="14" rx="3" fill="#0F2233" />
      <rect x="112" y="292" width="16" height="14" fill="#0C1822" />
      <rect x="272" y="292" width="16" height="14" fill="#0C1822" />
      {/* sensor nodes */}
      {[
        { x: 130, y: 132, label: "TEMP", c: T.warning },
        { x: 270, y: 132, label: "VIB", c: ringColor },
        { x: 200, y: 268, label: "CUR", c: T.blue },
      ].map((n, i) => (
        <g key={i} style={{ animation: `drift ${3 + i}s ease-in-out infinite` }}>
          <circle cx={n.x} cy={n.y} r="6" fill={n.c} />
          <circle cx={n.x} cy={n.y} r="11" fill="none" stroke={n.c} strokeWidth="1.5" opacity="0.5">
            {anomaly && n.label === "VIB" && <animate attributeName="r" values="8;20;8" dur="1.1s" repeatCount="indefinite" />}
          </circle>
        </g>
      ))}
      {/* telemetry trace line beneath */}
      <path d="M40 350 L100 350 L112 335 L130 360 L146 330 L162 350 L400 350"
        fill="none" stroke={ringColor} strokeWidth="1.6" opacity="0.55"
        strokeDasharray="4 4" style={{ animation: "pulseLine 3s linear infinite" }} />
    </svg>
  );
}

/* ============================================================
   RADIAL RISK / HEALTH GAUGE
   ============================================================ */
function RadialGauge({ value, max = 100, color, label, sub }) {
  const r = 46, c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width="118" height="118" viewBox="0 0 118 118">
        <circle cx="59" cy="59" r={r} fill="none" stroke={T.border} strokeWidth="9" />
        <circle cx="59" cy="59" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 59 59)"
          style={{ transition: "stroke-dashoffset .6s ease" }} />
        <text x="59" y="55" textAnchor="middle" className="mono" style={{ fontSize: 24, fontWeight: 700, fill: T.text }}>{value}</text>
        <text x="59" y="72" textAnchor="middle" style={{ fontSize: 9, fill: T.textSoft, letterSpacing: "0.05em" }}>/ {max}</text>
      </svg>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: T.textSoft, textTransform: "uppercase" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: T.textSoft }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ============================================================
   SHARED CARD
   ============================================================ */
function Card({ title, eyebrow, action, children, style, bodyStyle }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, ...style }}>
      {(title || action) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
          <div>
            {eyebrow && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: T.textSoft, textTransform: "uppercase", marginBottom: 2 }}>{eyebrow}</div>}
            {title && <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>}
          </div>
          {action}
        </div>
      )}
      <div style={{ padding: 18, ...bodyStyle }}>{children}</div>
    </div>
  );
}

/* ============================================================
   APP SHELL — SIDEBAR + TOPBAR
   ============================================================ */
function Sidebar({ view, setView, onlineDevices = 5 }) {
  return (
    <div style={{ width: 224, flexShrink: 0, background: T.navyDeep, color: "#E7EDF1", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #1E2E3A" }}>
        <div onClick={() => setView("landing")} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }} className="focus-ring" tabIndex={0}>
          <svg width="26" height="26" viewBox="0 0 26 26">
            <circle cx="13" cy="13" r="11" fill="none" stroke={T.teal} strokeWidth="2" />
            <circle cx="13" cy="13" r="4.2" fill={T.teal} />
            <path d="M13 2 L13 6 M13 20 L13 24 M2 13 L6 13 M20 13 L24 13" stroke={T.teal} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="display" style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.01em" }}>IRONside</span>
        </div>
      </div>
      <div style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = view === n.id || (view === "assetDetail" && n.id === "assets");
          return (
            <button key={n.id} onClick={() => setView(n.id)} className="focus-ring"
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 6,
                background: active ? "#1B2C39" : "transparent", border: "none", cursor: "pointer",
                color: active ? "#fff" : "#9FB0BC", fontSize: 13, fontWeight: 600, textAlign: "left",
                borderLeft: active ? `2px solid ${T.teal}` : "2px solid transparent",
              }}>
              <Icon size={16} strokeWidth={2} />
              {n.label}
            </button>
          );
        })}
        <button onClick={() => setView("settings")} className="focus-ring" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 6, background: view === "settings" ? "#1B2C39" : "transparent", border: "none", cursor: "pointer", color: view === "settings" ? "#fff" : "#9FB0BC", borderLeft: view === "settings" ? `2px solid ${T.teal}` : "2px solid transparent", fontSize: 13, fontWeight: 600, textAlign: "left", marginTop: "auto" }}>
          <Settings size={16} /> Settings
        </button>
      </div>
      <div style={{ padding: "14px 18px", borderTop: "1px solid #1E2E3A" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#6E828E", marginBottom: 6 }}>EDGE NETWORK</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: T.healthy, animation: "blink 2s ease-in-out infinite" }} />
          {onlineDevices}/5 DEVICES ONLINE
        </div>
        <div style={{ fontSize: 11, color: "#6E828E", marginTop: 4 }}>All systems operational</div>
      </div>
    </div>
  );
}

function TopBar({ title, subtitle, right }) {
  return (
    <div style={{ padding: "20px 28px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <div>
        <h1 className="display" style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>{title}</h1>
        {subtitle && <div style={{ fontSize: 13, color: T.textSoft, marginTop: 4 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

/* ============================================================
   KPI STRIP
   ============================================================ */
function KpiStrip({ assets, openMaint }) {
  const total = assets.length;
  const healthy = assets.filter((a) => a.status === "healthy").length;
  const attention = assets.filter((a) => a.status === "attention").length;
  const highRisk = assets.filter((a) => a.status === "high-risk").length;
  const items = [
    { n: total, label: "Monitored Assets", sub: "+3 this month", color: T.navy },
    { n: healthy, label: "Healthy", sub: `${Math.round((healthy / total) * 100)}%`, color: T.healthy },
    { n: attention, label: "Attention", sub: "steady", color: T.warning },
    { n: highRisk, label: "High Risk", sub: highRisk > 2 ? "↑ 1 today" : "stable", color: T.critical },
    { n: openMaint, label: "Open Maintenance", sub: "2 due this week", color: T.blue },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, border: `1px solid ${T.border}`, borderRadius: 10, background: T.surface, overflow: "hidden" }}>
      {items.map((it, i) => (
        <div key={i} style={{ padding: "16px 18px", borderLeft: i ? `1px solid ${T.border}` : "none" }}>
          <div className="mono" style={{ fontSize: 30, fontWeight: 700, color: T.text, lineHeight: 1 }}>{it.n}</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: T.textSoft, textTransform: "uppercase", marginTop: 8 }}>{it.label}</div>
          <div style={{ fontSize: 11, color: it.color, marginTop: 3, fontWeight: 600 }}>{it.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   FLEET HEALTH DONUT
   ============================================================ */
function FleetHealthDonut({ assets, onFilter }) {
  const groups = ["healthy", "attention", "high-risk"].map((s) => ({
    key: s, count: assets.filter((a) => a.status === s).length, color: statusColor(s),
  }));
  const total = assets.length;
  let acc = 0;
  const r = 60, c = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <svg width="150" height="150" viewBox="0 0 150 150">
        <circle cx="75" cy="75" r={r} fill="none" stroke={T.border} strokeWidth="16" />
        {groups.map((g, i) => {
          const frac = g.count / total;
          const dash = frac * c;
          const offset = c * (1 - acc);
          acc += frac;
          return (
            <circle key={i} cx="75" cy="75" r={r} fill="none" stroke={g.color} strokeWidth="16"
              strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={offset} transform="rotate(-90 75 75)"
              style={{ cursor: "pointer" }} onClick={() => onFilter(g.key)} />
          );
        })}
        <text x="75" y="70" textAnchor="middle" className="mono" style={{ fontSize: 26, fontWeight: 700 }}>{total}</text>
        <text x="75" y="88" textAnchor="middle" style={{ fontSize: 10, fill: T.textSoft }}>ASSETS</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {groups.map((g) => (
          <button key={g.key} onClick={() => onFilter(g.key)} className="focus-ring"
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <span style={{ width: 9, height: 9, borderRadius: 999, background: g.color }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{statusLabel(g.key)}</span>
            <span className="mono" style={{ fontSize: 12, color: T.textSoft }}>{g.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   RISK × CRITICALITY MATRIX
   ============================================================ */
const CRIT_X = { low: 1, medium: 2, high: 3 };
function RiskMatrix({ assets, onSelect }) {
  const data = assets.map((a) => ({
    x: CRIT_X[a.criticality] + (a.id.charCodeAt(a.id.length - 1) % 10) / 40 - 0.1,
    y: a.risk, id: a.id, name: a.name, status: a.status,
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 10, right: 18, bottom: 10, left: 0 }}>
        <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
        <XAxis type="number" dataKey="x" domain={[0.5, 3.5]} ticks={[1, 2, 3]}
          tickFormatter={(v) => ({ 1: "Low", 2: "Medium", 3: "High" }[v] || "")}
          tick={{ fontSize: 11, fill: T.textSoft }} name="Criticality" />
        <YAxis type="number" dataKey="y" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSoft }} name="Risk" />
        <ReferenceArea x1={2.2} x2={3.5} y1={50} y2={100} fill={T.critical} fillOpacity={0.06} />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => {
          if (!active || !payload?.length) return null;
          const d = payload[0].payload;
          return (
            <div style={{ background: T.navyDeep, color: "#fff", padding: "8px 10px", borderRadius: 6, fontSize: 12 }}>
              <div className="mono" style={{ fontWeight: 700 }}>{d.id}</div>
              <div style={{ color: "#9FB0BC" }}>{d.name}</div>
              <div>Risk: {d.y}/100</div>
            </div>
          );
        }} />
        <Scatter data={data} onClick={(d) => onSelect(d.id)} cursor="pointer">
          {data.map((d, i) => <Cell key={i} fill={statusColor(d.status)} fillOpacity={0.85} />)}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/* ============================================================
   WHAT NEEDS ATTENTION
   ============================================================ */
function AttentionList({ assets, onSelect }) {
  const ranked = [...assets].filter((a) => a.status !== "healthy").sort((a, b) => b.risk - a.risk).slice(0, 4);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {ranked.map((a, i) => (
        <button key={a.id} onClick={() => onSelect(a.id)} className="row-hover focus-ring"
          style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left", background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", cursor: "pointer" }}>
          <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: T.textSoft, width: 24 }}>{String(i + 1).padStart(2, "0")}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{a.id}</span>
              <Badge status={a.status} />
            </div>
            <div style={{ fontSize: 12, color: T.textSoft, marginTop: 2 }}>{a.name} · {a.location}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.textSoft }}>Risk</div>
            <div className="mono" style={{ fontWeight: 700, color: statusColor(a.status) }}>{a.risk}/100</div>
          </div>
          <ChevronRight size={16} color={T.textSoft} />
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   OVERVIEW PAGE
   ============================================================ */
function OverviewPage({ assets, alerts, maintenance, setView, setSelectedAsset, filterStatus, setFilterStatus }) {
  const openMaint = maintenance.filter((m) => m.status !== "completed").length;
  const openAlerts = alerts.filter((a) => a.status === "open").length;
  return (
    <div style={{ padding: "22px 28px 40px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: T.textSoft }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: T.healthy, fontWeight: 700 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: T.healthy, animation: "blink 2s ease-in-out infinite" }} />LIVE MONITORING
        </span>
        <span>Last sync: 10 sec ago</span>
        <span>·</span>
        <span>{openAlerts} open alerts</span>
        <span>·</span>
        <span>5 edge nodes online</span>
      </div>

      <KpiStrip assets={assets} openMaint={openMaint} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }}>
        <Card title="Fleet Health" eyebrow="Distribution">
          <FleetHealthDonut assets={assets} onFilter={(s) => { setFilterStatus(s); setView("assets"); }} />
        </Card>
        <Card title="Risk × Criticality Matrix" eyebrow="Prioritization" action={<span style={{ fontSize: 11, color: T.textSoft }}>click a point to open asset</span>}>
          <RiskMatrix assets={assets} onSelect={(id) => { setSelectedAsset(id); setView("assetDetail"); }} />
        </Card>
      </div>

      <Card title="What Needs Attention" eyebrow="Ranked by risk, criticality & trend">
        <AttentionList assets={assets} onSelect={(id) => { setSelectedAsset(id); setView("assetDetail"); }} />
      </Card>
    </div>
  );
}

/* ============================================================
   ASSET REGISTRY
   ============================================================ */
function AssetsPage({ assets, setView, setSelectedAsset, filterStatus, setFilterStatus }) {
  const [q, setQ] = useState("");
  const filtered = assets.filter((a) =>
    (filterStatus === "all" || a.status === filterStatus) &&
    (a.id.toLowerCase().includes(q.toLowerCase()) || a.name.toLowerCase().includes(q.toLowerCase()) || a.location.toLowerCase().includes(q.toLowerCase()))
  ).sort((a, b) => {
    const isRedA = a.status === "critical" || a.status === "high-risk" || a.status === "attention";
    const isRedB = b.status === "critical" || b.status === "high-risk" || b.status === "attention";
    if (isRedA && !isRedB) return -1;
    if (!isRedA && isRedB) return 1;
    return b.risk - a.risk;
  });
  return (
    <div style={{ padding: "22px 28px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: T.surface, padding: 20, borderRadius: 10, border: `1px solid ${T.border}` }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 14, fontWeight: 700 }}>Fleet Health Distribution</h3>
        <FleetHealthDonut assets={assets} onFilter={setFilterStatus} />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: 10 }} color={T.textSoft} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search asset ID, name, location…"
            className="focus-ring" style={{ width: "100%", padding: "8px 10px 8px 32px", border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 13 }} />
        </div>
        {["all", "healthy", "attention", "high-risk"].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)} className="focus-ring"
            style={{
              padding: "7px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${filterStatus === s ? T.navy : T.border}`,
              background: filterStatus === s ? T.navy : "#fff", color: filterStatus === s ? "#fff" : T.text,
            }}>
            {s === "all" ? "All" : statusLabel(s)}
          </button>
        ))}
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div className="iron-scroll" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#FAFBFC", borderBottom: `1px solid ${T.border}` }}>
                {["Asset", "Type", "Location", "Health", "Risk", "Trend", "Status", "Edge"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: T.textSoft, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="row-hover" onClick={() => { setSelectedAsset(a.id); setView("assetDetail"); }} style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer" }}>
                  <td style={{ padding: "11px 16px" }}>
                    <div className="mono" style={{ fontWeight: 700 }}>{a.id}</div>
                    <div style={{ fontSize: 11.5, color: T.textSoft }}>{a.name}</div>
                  </td>
                  <td style={{ padding: "11px 16px", color: T.textSoft }}>{a.type}</td>
                  <td style={{ padding: "11px 16px", color: T.textSoft }}>{a.location}</td>
                  <td style={{ padding: "11px 16px" }} className="mono">{a.health}</td>
                  <td style={{ padding: "11px 16px" }} className="mono">{a.risk}</td>
                  <td style={{ padding: "11px 16px" }}>
                    {a.risk > 30 ? <ArrowUp size={14} color={T.critical} /> : <ArrowDown size={14} color={T.healthy} />}
                  </td>
                  <td style={{ padding: "11px 16px" }}><Badge status={a.status} /></td>
                  <td style={{ padding: "11px 16px", color: T.textSoft }} className="mono">{a.edge}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 30, textAlign: "center", color: T.textSoft }}>No assets match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ASSET DETAIL
   ============================================================ */
function ContributingBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: T.textSoft, fontWeight: 600 }}>{label}</span>
        <span className="mono" style={{ color: T.textSoft }}>{value}%</span>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: "#EEF1F3" }}>
        <div style={{ width: `${value}%`, height: "100%", borderRadius: 4, background: color, transition: "width .6s ease" }} />
      </div>
    </div>
  );
}

function AssetDetailPage({ asset, onSimulate, onReset, simRunning, timeline, alerts = [], showToast, toggleShutdown }) {
  if (!asset) return null;
  const dev = (cur, [lo, hi]) => {
    const mid = (lo + hi) / 2;
    return Math.round(((cur - mid) / mid) * 100);
  };
  const vibDev = dev(asset.telemetry.at(-1).vibration, asset.baseline.vibration);
  const curDev = dev(asset.telemetry.at(-1).current, asset.baseline.current);
  const isMotor01 = asset.id === "MOTOR-01";

  return (
    <div style={{ padding: "22px 28px 44px", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="mono display" style={{ fontSize: 22, fontWeight: 700, color: asset.isOff ? T.textSoft : "#fff" }}>{asset.id}</span>
            <Badge status={asset.isOff ? "offline" : asset.status} />
          </div>
          <div style={{ fontSize: 13, color: T.textSoft, marginTop: 3 }}>{asset.name} · {asset.type} · {asset.location} {asset.isOff ? "(SHUTDOWN)" : ""}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => {
            if (!asset.isOff && asset.status === "healthy") {
              showToast("Approval Required: A ticket has been raised for admin approval to shut down this healthy machine.");
            } else {
              toggleShutdown(asset.id);
            }
          }} className="focus-ring" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 7, border: `1px solid ${asset.isOff ? T.teal : T.critical}`, background: "#fff", color: asset.isOff ? T.teal : T.critical, cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>
            <ShieldCheck size={14} /> {asset.isOff ? "Turn On Machine" : "Shut Down Machine"}
          </button>
          {isMotor01 && (
            <>
              <button onClick={onReset} className="focus-ring" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>
                <RotateCcw size={14} /> Reset Demo
              </button>
              <button onClick={onSimulate} disabled={simRunning} className="focus-ring"
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 7, border: "none", background: simRunning ? T.textSoft : T.critical, color: "#fff", cursor: simRunning ? "default" : "pointer", fontSize: 12.5, fontWeight: 700 }}>
                <Play size={14} /> {simRunning ? "Simulating…" : "Simulate Anomaly"}
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
        <Card bodyStyle={{ padding: 14 }}><RadialGauge value={asset.health} color={statusColor(asset.status)} label="Health" /></Card>
        <Card bodyStyle={{ padding: 14 }}><RadialGauge value={asset.risk} color={T.critical} label="Risk" /></Card>
        <Card bodyStyle={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: "uppercase" }}>Criticality</div>
          <div style={{ fontSize: 15, fontWeight: 700, textTransform: "capitalize" }}>{asset.criticality}</div>
        </Card>
        <Card bodyStyle={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: "uppercase" }}>Edge Node</div>
          <div className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{asset.edge}</div>
        </Card>
        <Card bodyStyle={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: "uppercase" }}>Last Updated</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>10 sec ago</div>
        </Card>
      </div>

      {asset.type === "Centrifugal Pump" && asset.telemetry.at(-1)?.pressureIn && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          <Card bodyStyle={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Input Pressure (I/P)</div>
            <div className="mono" style={{ fontSize: 18, color: T.blue }}>{asset.telemetry.at(-1).pressureIn} PSI</div>
          </Card>
          <Card bodyStyle={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Output Pressure (O/P)</div>
            <div className="mono" style={{ fontSize: 18, color: T.teal }}>{asset.telemetry.at(-1).pressureOut} PSI</div>
          </Card>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }}>
        <Card title="Telemetry — Vibration & Current" eyebrow="Live sensor trace">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={asset.telemetry}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: T.textSoft }} />
              <YAxis yAxisId="l" tick={{ fontSize: 10, fill: T.textSoft }} width={30} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Line yAxisId="l" type="monotone" dataKey="vibration" stroke={T.critical} strokeWidth={2} dot={false} name="Vibration (g)" />
              <Line yAxisId="l" type="monotone" dataKey="current" stroke={T.blue} strokeWidth={2} dot={false} name="Current (A)" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11, color: T.textSoft, marginTop: 6 }}>Prototype demo dataset · illustrative, not a live sensor feed.</div>
        </Card>

        <Card title="Baseline Comparison" eyebrow="Current vs learned baseline">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Vibration", unit: "g", cur: asset.telemetry.at(-1).vibration, base: asset.baseline.vibration, dev: vibDev },
              { label: "Current", unit: "A", cur: asset.telemetry.at(-1).current, base: asset.baseline.current, dev: curDev },
            ].map((r) => (
              <div key={r.label} style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 600 }}>
                  <span>{r.label}</span>
                  <span className={r.dev > 25 ? "" : ""} style={{ color: r.dev > 25 ? T.critical : T.healthy, fontWeight: 700 }}>{r.dev > 0 ? "+" : ""}{r.dev}%</span>
                </div>
                <div style={{ fontSize: 11, color: T.textSoft, marginTop: 2 }}>Baseline {r.base[0]}–{r.base[1]} {r.unit} · Current <span className="mono">{r.cur} {r.unit}</span></div>
              </div>
            ))}
            <div style={{ fontSize: 12, color: T.textSoft }}>
              {vibDev > 25 || curDev > 25
                ? "Deviation from asset baseline detected — behaviour differs from learned normal operating range."
                : "Current readings are within the asset's learned baseline range."}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Card title="Why Is This Asset At Risk?" eyebrow="Contributing signal indicators (prototype, not SHAP values)">
          <ContributingBar label="Vibration deviation" value={isMotor01 && (asset.status !== "healthy") ? 82 : 24} color={T.critical} />
          <ContributingBar label="Current deviation" value={isMotor01 && (asset.status !== "healthy") ? 58 : 18} color={T.warning} />
          <ContributingBar label="Temperature" value={20} color={T.teal} />
          <ContributingBar label="RPM variation" value={9} color={T.blue} />
        </Card>

        <Card title="Anomaly Timeline" eyebrow="Event sequence">
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {(timeline && timeline.length ? timeline : [{ t: "—", msg: "Normal operation. No deviations logged." }]).map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 14, position: "relative" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 8, height: 8, borderRadius: 999, background: T.teal, marginTop: 4 }} />
                  {i < ((timeline?.length || 1) - 1) && <div style={{ width: 1, flex: 1, background: T.border }} />}
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 11, color: T.textSoft }}>{e.t}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{e.msg}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Interactive 3D Component Inspection & Fault Locator" eyebrow="Real-time WebGL 3D Model">
        <div style={{ padding: "8px 0" }}>
          <Device3DViewer anomaly={asset.status !== "healthy"} asset={asset} alerts={alerts} />
        </div>
      </Card>


      <Card title="Maintenance Intelligence" eyebrow="Recommendation" style={{ borderColor: asset.status === "high-risk" ? `${T.critical}55` : T.border }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: "uppercase" }}>Priority</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: asset.status === "high-risk" ? T.critical : T.warning }}>
              {asset.status === "high-risk" ? "Immediate" : asset.status === "attention" ? "Scheduled" : "None"}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: "uppercase" }}>Recommended Action</div>
            <div style={{ fontSize: 13 }}>
              {asset.status === "healthy"
                ? "No action required. Continue routine monitoring."
                : "Inspect bearing condition and shaft alignment; a potential area of concern based on vibration and current deviation."}
            </div>
          </div>
          {asset.status !== "healthy" && (
            <button className="focus-ring" style={{ padding: "9px 16px", borderRadius: 7, border: "none", background: T.navy, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              Create Work Order
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

function useLiveTelemetryData(asset, range) {
  const [data, setData] = useState([]);
  
  useEffect(() => {
     let points = 24, wobbleMultiplier = 1;
     if (range === "1H") { points = 60; wobbleMultiplier = 1; }
     else if (range === "6H") { points = 36; wobbleMultiplier = 2; }
     else if (range === "24H") { points = 24; wobbleMultiplier = 3; }
     else if (range === "7D") { points = 28; wobbleMultiplier = 5; }
     else if (range === "30D") { points = 30; wobbleMultiplier = 8; }
     
     const baseVib = asset.telemetry[0]?.vibration || 0.2;
     const baseCur = asset.telemetry[0]?.current || 1.0;
     const baseTemp = asset.telemetry[0]?.temperature || 35;
     const baseRpm = asset.telemetry[0]?.rpm || 1500;
     
     const out = [];
     const now = new Date();
     
     // Generate historical data for the selected range
     for (let i = points; i >= 0; i--) {
        const d = new Date(now.getTime());
        if (range === "1H") d.setMinutes(d.getMinutes() - i);
        else if (range === "6H") d.setMinutes(d.getMinutes() - i * 10);
        else if (range === "24H") d.setHours(d.getHours() - i);
        else if (range === "7D") d.setHours(d.getHours() - i * 6);
        else if (range === "30D") d.setDate(d.getDate() - i);
        
        let timeLabel = "";
        if (range === "1H" || range === "6H" || range === "24H") {
          timeLabel = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        } else {
          timeLabel = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`;
        }

        const t = now.getTime() / 100000 - i; 
        const wobble = (Math.sin(t / 3) * 0.015 + Math.sin(t / 7) * 0.008) * wobbleMultiplier;
        
        out.push({
          time: timeLabel,
          vibration: +(baseVib + wobble).toFixed(3),
          current: +(baseCur + wobble * 2).toFixed(2),
          temperature: +(baseTemp + wobble * 6).toFixed(1),
          rpm: Math.round(baseRpm + wobble * 40),
        });
     }
     setData(out);

     // Live ticking interval to append new points in real-time
     const interval = setInterval(() => {
        setData(prev => {
           if (prev.length === 0) return prev;
           
           const newNow = new Date();
           let timeLabel = "";
           if (range === "1H" || range === "6H" || range === "24H") {
             timeLabel = `${String(newNow.getHours()).padStart(2, '0')}:${String(newNow.getMinutes()).padStart(2, '0')}:${String(newNow.getSeconds()).padStart(2, '0')}`;
           } else {
             timeLabel = `${newNow.getMonth()+1}/${newNow.getDate()} ${String(newNow.getHours()).padStart(2, '0')}:${String(newNow.getMinutes()).padStart(2, '0')}`;
           }
           
           const t = newNow.getTime() / 10000;
           const wobble = (Math.sin(t / 3) * 0.015 + Math.sin(t / 7) * 0.008) * wobbleMultiplier;
           
           const newPt = {
             time: timeLabel,
             vibration: +(baseVib + wobble + (Math.random()-0.5)*0.01).toFixed(3),
             current: +(baseCur + wobble * 2 + (Math.random()-0.5)*0.1).toFixed(2),
             temperature: +(baseTemp + wobble * 6 + (Math.random()-0.5)*0.2).toFixed(1),
             rpm: Math.round(baseRpm + wobble * 40 + (Math.random()-0.5)*5),
           };
           
           return [...prev.slice(-points), newPt];
        });
     }, 2000); // 2 second live updates
     
     return () => clearInterval(interval);
  }, [asset, range]);
  
  return data;
}

/* ============================================================
   LIVE TELEMETRY PAGE
   ============================================================ */
function TelemetryPage({ assets }) {
  const [assetId, setAssetId] = useState("MOTOR-01");
  const [range, setRange] = useState("1H");
  const asset = assets.find((a) => a.id === assetId) || assets[0];
  const liveData = useLiveTelemetryData(asset, range);
  const last = liveData.length > 0 ? liveData[liveData.length - 1] : asset.telemetry.at(-1);
  const sensors = [
    { key: "temperature", label: "Temperature", unit: "°C", icon: Thermometer, color: T.warning, base: asset.baseline.temperature },
    { key: "current", label: "Current", unit: "A", icon: Zap, color: T.blue, base: asset.baseline.current },
    { key: "vibration", label: "Vibration", unit: "g", icon: Activity, color: T.critical, base: asset.baseline.vibration },
    { key: "rpm", label: "RPM", unit: "", icon: Gauge, color: T.teal, base: null },
  ];
  return (
    <div style={{ padding: "22px 28px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className="focus-ring mono"
          style={{ padding: "8px 10px", borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 13 }}>
          {assets.slice(0, 8).map((a) => <option key={a.id} value={a.id}>{a.id}</option>)}
        </select>
        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          {["1H", "6H", "24H", "7D", "30D"].map((r) => (
            <button key={r} onClick={() => setRange(r)} className="focus-ring"
              style={{ padding: "7px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer",
                border: `1px solid ${range === r ? T.navy : T.border}`, background: range === r ? T.navy : "#fff", color: range === r ? "#fff" : T.text }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {sensors.map((s) => {
          const Icon = s.icon;
          const above = s.base && (last[s.key] > s.base[1]);
          return (
            <Card key={s.key} bodyStyle={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.textSoft, marginBottom: 8 }}>
                <Icon size={14} /><span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{s.label}</span>
              </div>
              <div className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{last[s.key]}<span style={{ fontSize: 13, color: T.textSoft }}> {s.unit}</span></div>
              {s.base ? (
                <>
                  <div style={{ fontSize: 11, color: T.textSoft, marginTop: 4 }}>Baseline {s.base[0]}–{s.base[1]} {s.unit}</div>
                  <div style={{ marginTop: 6 }}><Badge status={above ? "attention" : "healthy"}>{above ? "Above Baseline" : "Within Baseline"}</Badge></div>
                </>
              ) : <div style={{ fontSize: 11, color: T.textSoft, marginTop: 4 }}>No fixed baseline tracked</div>}
            </Card>
          );
        })}
      </div>

      <Card title={`${asset.id} — Multi-Sensor Trace`} eyebrow={`Range: ${range} (Live Sync)`}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={liveData}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: T.textSoft }} />
            <YAxis tick={{ fontSize: 10, fill: T.textSoft }} width={30} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="vibration" stroke={T.critical} dot={false} strokeWidth={2} name="Vibration (g)" />
            <Line type="monotone" dataKey="current" stroke={T.blue} dot={false} strokeWidth={2} name="Current (A)" />
            <Line type="monotone" dataKey="temperature" stroke={T.warning} dot={false} strokeWidth={2} name="Temp (°C)" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Demo Telemetry Payload" eyebrow="Illustrative packet — ESP32 → backend">
        <pre className="mono" style={{ background: T.navyDeep, color: "#B7D3DF", padding: 14, borderRadius: 8, fontSize: 12, overflowX: "auto" }}>
{`{
  "assetId": "${asset.id}",
  "temperature": ${last.temperature},
  "vibration": ${last.vibration},
  "current": ${last.current},
  "rpm": ${last.rpm}
}`}
        </pre>
      </Card>
    </div>
  );
}

/* ============================================================
   ALERTS
   ============================================================ */
function AlertsPage({ alerts, setAlerts, assets, openWorkOrder }) {
  const [selected, setSelected] = useState(null);
  const bySeverity = { critical: [], attention: [], low: [] };
  alerts.forEach((a) => (bySeverity[a.severity === "attention" ? "attention" : a.severity === "low" ? "low" : "critical"] ||= []).push?.(a));
  const cols = [
    { key: "high-risk", label: "Critical / High", color: T.critical, list: alerts.filter((a) => a.severity !== "attention" && a.severity !== "low" && a.status === "open") },
    { key: "attention", label: "Attention", color: T.warning, list: alerts.filter((a) => a.severity === "attention" && a.status === "open") },
    { key: "resolved", label: "Resolved", color: T.healthy, list: alerts.filter((a) => a.status === "resolved") },
  ];
  const act = (id, patch) => setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, ...patch } : a));

  return (
    <div style={{ padding: "22px 28px 40px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {cols.map((c) => (
          <div key={c.key}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: c.color }} />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.label}</span>
              <span className="mono" style={{ fontSize: 12, color: T.textSoft }}>{c.list.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {c.list.map((a) => {
                const asset = assets.find((x) => x.id === a.assetId);
                return (
                  <div key={a.id} onClick={() => setSelected(a)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${c.color}`, borderRadius: 8, padding: 12, cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="mono" style={{ fontWeight: 700, fontSize: 12.5 }}>{a.assetId}</span>
                      <span style={{ fontSize: 11, color: T.textSoft }}>{a.time}</span>
                    </div>
                    <div style={{ fontSize: 12.5, marginTop: 4 }}>{a.signal}</div>
                    <div style={{ fontSize: 11, color: T.textSoft, marginTop: 4 }}>Risk {a.risk}/100</div>
                  </div>
                );
              })}
              {c.list.length === 0 && <div style={{ fontSize: 12, color: T.textSoft, fontStyle: "italic" }}>Nothing here.</div>}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(16,26,34,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 480, maxWidth: "92vw", background: "#fff", borderRadius: 12, padding: 22, maxHeight: "86vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{selected.id} · {selected.assetId}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 3 }}>{selected.signal}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ marginTop: 14, fontSize: 13, color: T.textSoft, lineHeight: 1.6 }}>{selected.message}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              <div style={{ fontSize: 12 }}><strong>Risk:</strong> {selected.risk}/100</div>
              <div style={{ fontSize: 12 }}><strong>Status:</strong> {selected.status}</div>
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: T.textSoft }}>Recommended: inspect the flagged sensor's mechanical source and compare against asset baseline.</div>
            <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
              <button onClick={() => { act(selected.id, { status: "acknowledged" }); }} className="focus-ring" style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Acknowledge</button>
              <button onClick={() => { openWorkOrder(selected); setSelected(null); }} className="focus-ring" style={{ padding: "8px 12px", borderRadius: 7, border: "none", background: T.navy, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Create Work Order</button>
              <button onClick={() => { act(selected.id, { status: "resolved" }); setSelected(null); }} className="focus-ring" style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${T.healthy}`, color: T.healthy, background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Resolve</button>
              <button onClick={() => { act(selected.id, { status: "resolved", falsePositive: true }); setSelected(null); }} className="focus-ring" style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>Mark False Positive</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MAINTENANCE QUEUE
   ============================================================ */
const MAINT_COLS = [
  { key: "work_order", label: "Work Order" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];
function MaintenancePage({ tasks, setTasks, assets, onComplete }) {
  const advance = (id) => {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      const idx = MAINT_COLS.findIndex((c) => c.key === t.status);
      const next = MAINT_COLS[Math.min(idx + 1, MAINT_COLS.length - 1)].key;
      if (next === "completed" && t.status !== "completed") onComplete?.(t);
      return { ...t, status: next };
    }));
  };
  return (
    <div style={{ padding: "22px 28px 40px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {MAINT_COLS.map((col) => (
          <div key={col.key}>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: T.textSoft, marginBottom: 10 }}>
              {col.label} <span className="mono">({tasks.filter((t) => t.status === col.key).length})</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 80 }}>
              {tasks.filter((t) => t.status === col.key).map((t) => (
                <div key={t.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="mono" style={{ fontWeight: 700, fontSize: 12 }}>{t.assetId}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: t.priority === "High" ? T.critical : t.priority === "Medium" ? T.warning : T.textSoft }}>{t.priority}</span>
                  </div>
                  <div style={{ fontSize: 12.5, marginTop: 5, fontWeight: 600 }}>{t.issue}</div>
                  <div style={{ fontSize: 11.5, color: T.textSoft, marginTop: 4 }}>{t.recommended}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: T.textSoft }}>
                    <span>{t.technician}</span><span>{t.due}</span>
                  </div>
                  {col.key !== "completed" && (
                    <button onClick={() => advance(t.id)} className="focus-ring" style={{ marginTop: 10, width: "100%", padding: "6px", borderRadius: 6, border: `1px solid ${T.border}`, background: "#FAFBFC", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                      Advance →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   LIVE DATA HOOKS FOR ANALYTICS
   ============================================================ */
function useLiveTrendData() {
  const [data, setData] = useState(() => 
    seedTelemetry(0.22, 1.0, 37, 1400, 14).map((d, i) => ({ 
      time: d.time, 
      health: 78 + Math.round(Math.sin(i / 3) * 6), 
      risk: 22 - Math.round(Math.sin(i / 3) * 6) 
    }))
  );

  useEffect(() => {
    let tick = 14;
    const interval = setInterval(() => {
      tick++;
      setData((prev) => {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });
        const wobble = Math.round(Math.sin(tick / 3) * 6 + (Math.random()-0.5)*2);
        return [
          ...prev.slice(1), 
          { time: timeLabel, health: Math.min(100, Math.max(0, 78 + wobble)), risk: Math.min(100, Math.max(0, 22 - wobble)) }
        ];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return data;
}

/* ============================================================
   ANALYTICS
   ============================================================ */
function AnalyticsPage() {
  const trend = useLiveTrendData();
  const anomalyFreq = [
    { day: "D1", count: 4 }, { day: "D2", count: 6 }, { day: "D3", count: 3 },
    { day: "D4", count: 8 }, { day: "D5", count: 5 }, { day: "D6", count: 7 }, { day: "D7", count: 4 }
  ];
  const resolutionTime = [
    { day: "D1", hrs: 3.2 }, { day: "D2", hrs: 2.8 }, { day: "D3", hrs: 4.1 },
    { day: "D4", hrs: 2.2 }, { day: "D5", hrs: 3.6 }, { day: "D6", hrs: 1.9 }, { day: "D7", hrs: 2.5 }
  ];
  return (
    <div style={{ padding: "22px 28px 40px", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ fontSize: 12, color: T.textSoft }}>Illustrative prototype dataset — not measured production performance.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Card title="Fleet Health Trend" eyebrow="30D">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: T.textSoft }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSoft }} width={28} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="health" stroke={T.healthy} fill={`${T.healthy}22`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Risk Trend" eyebrow="30D">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: T.textSoft }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSoft }} width={28} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="risk" stroke={T.critical} fill={`${T.critical}1c`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Anomaly Frequency" eyebrow="7D">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={anomalyFreq}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: T.textSoft }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSoft }} width={24} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="count" fill={T.teal} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Alert Resolution Time (hrs)" eyebrow="7D">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={resolutionTime}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: T.textSoft }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSoft }} width={24} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="hrs" fill={T.blue} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   SYSTEM / ARCHITECTURE
   ============================================================ */
const ARCH_NODES = [
  { id: "asset", label: "Physical Asset", icon: Factory, detail: "The monitored machine — motor, pump, generator or HVAC unit." },
  { id: "sensors", label: "Sensors", icon: Activity, detail: "Vibration, temperature, current and acoustic sensing interfaces." },
  { id: "esp32", label: "ESP32 Edge Node", icon: Cpu, detail: "Edge processing, sensor aggregation and wireless transmission." },
  { id: "net", label: "Wi-Fi / HTTP", icon: Wifi, detail: "Telemetry transport from edge node to backend." },
  { id: "backend", label: "Node.js / Express", icon: Server, detail: "Ingests telemetry, exposes REST API to the frontend." },
  { id: "db", label: "MongoDB", icon: Database, detail: "Stores raw readings, asset metadata and historical baselines." },
  { id: "ml", label: "Python ML", icon: Boxes, detail: "Anomaly detection and risk scoring on incoming telemetry." },
  { id: "alert", label: "Alert & Maintenance", icon: Bell, detail: "Flags deviations and routes recommendations to technicians." },
];
function SystemPage() {
  const [active, setActive] = useState(ARCH_NODES[2]);
  return (
    <div style={{ padding: "22px 28px 40px", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {[
          { l: "ESP32 Edge Network", s: "Operational" }, { l: "API", s: "Operational" },
          { l: "MongoDB", s: "Operational" }, { l: "ML Engine", s: "Operational" }, { l: "Frontend", s: "Operational" },
        ].map((r) => (
          <Card key={r.l} bodyStyle={{ padding: 12 }}>
            <div style={{ fontSize: 11, color: T.textSoft, fontWeight: 700 }}>{r.l}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: T.healthy }} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>{r.s}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Interactive System Architecture" eyebrow="Click a stage for detail">
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center", padding: "10px 0" }}>
          {ARCH_NODES.map((n, i) => {
            const Icon = n.icon;
            const isActive = active.id === n.id;
            return (
              <React.Fragment key={n.id}>
                <button onClick={() => setActive(n)} className="focus-ring"
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 10px", borderRadius: 10, cursor: "pointer",
                    border: `1px solid ${isActive ? T.teal : T.border}`, background: isActive ? `${T.teal}10` : "#fff", minWidth: 108 }}>
                  <Icon size={18} color={isActive ? T.teal : T.navy} />
                  <span style={{ fontSize: 11, fontWeight: 700, textAlign: "center" }}>{n.label}</span>
                </button>
                {i < ARCH_NODES.length - 1 && <ArrowRight size={14} color={T.textSoft} />}
              </React.Fragment>
            );
          })}
        </div>
        <div style={{ marginTop: 12, padding: 14, borderRadius: 8, background: "#FAFBFC", border: `1px solid ${T.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{active.label}</div>
          <div style={{ fontSize: 12.5, color: T.textSoft, marginTop: 4 }}>{active.detail}</div>
        </div>
      </Card>

      <Card title="Closed-Loop Maintenance Intelligence" eyebrow="Feedback loop">
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
          {["Sensor Data", "ML Inference", "Alert", "Technician Action", "Feedback", "Historical Data", "Model Improvement"].map((s, i, arr) => (
            <React.Fragment key={s}>
              <div style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 11.5, fontWeight: 600, background: "#fff" }}>{s}</div>
              {i < arr.length - 1 && <ArrowRight size={13} color={T.textSoft} />}
            </React.Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   LANDING PAGE
   ============================================================ */
function LandingPage({ onEnter }) {
  const [hoverStat, setHoverStat] = useState(false);
  return (
    <div className="iron-root" style={{ background: T.navyDeep, color: "#E7EDF1", minHeight: "100vh" }}>
      <div style={{
        position: "fixed", inset: 0, opacity: 0.05, pointerEvents: "none",
        backgroundImage: `linear-gradient(#7FA8B8 1px, transparent 1px), linear-gradient(90deg, #7FA8B8 1px, transparent 1px)`,
        backgroundSize: "42px 42px",
      }} />
      <nav style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <svg width="24" height="24" viewBox="0 0 26 26">
            <circle cx="13" cy="13" r="11" fill="none" stroke={T.teal} strokeWidth="2" />
            <circle cx="13" cy="13" r="4.2" fill={T.teal} />
            <path d="M13 2 L13 6 M13 20 L13 24 M2 13 L6 13 M20 13 L24 13" stroke={T.teal} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="display" style={{ fontWeight: 700, fontSize: 18 }}>IRONside</span>
        </div>
        <button onClick={onEnter} className="focus-ring" style={{ padding: "9px 16px", borderRadius: 7, border: `1px solid ${T.teal}`, color: T.teal, background: "transparent", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
          ENTER COMMAND CENTER
        </button>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "40px 40px 70px", maxWidth: 1240, margin: "0 auto", gap: 30, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 420px", maxWidth: 560 }} className="fade-up">
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: T.teal, marginBottom: 16 }}>PREDICTIVE MAINTENANCE PLATFORM</div>
          <h1 className="display" style={{ fontSize: 54, lineHeight: 1.06, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
            Know the machine<br />before it fails.
          </h1>
          <p style={{ fontSize: 15.5, color: "#9FB0BC", marginTop: 20, lineHeight: 1.6, maxWidth: 480 }}>
            Continuous multi-sensor monitoring, anomaly detection and maintenance intelligence for critical campus and industrial assets.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
            <button onClick={onEnter} className="focus-ring" style={{ padding: "13px 22px", borderRadius: 8, border: "none", background: T.teal, color: "#06171D", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
              ENTER COMMAND CENTER
            </button>
            <a href="#story" className="focus-ring" style={{ padding: "13px 22px", borderRadius: 8, border: `1px solid #2A4456`, color: "#E7EDF1", fontWeight: 700, fontSize: 13.5, cursor: "pointer", textDecoration: "none" }}>
              EXPLORE SYSTEM
            </a>
          </div>
          <div style={{ display: "flex", gap: 26, marginTop: 40 }}>
            {[["24", "Assets Monitored"], ["5", "Edge Nodes"], ["4", "Sensor Types"]].map(([n, l]) => (
              <div key={l}>
                <div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>{n}</div>
                <div style={{ fontSize: 11, color: "#7A8D99" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div onMouseEnter={() => setHoverStat(true)} onMouseLeave={() => setHoverStat(false)} style={{ flex: "1 1 340px", display: "flex", justifyContent: "center", position: "relative" }} className="fade-up">
          <MotorGraphic anomaly={false} size={380} />
          {hoverStat && (
            <div style={{ position: "absolute", top: 8, right: 8, background: "#0C1822", border: "1px solid #24404F", borderRadius: 8, padding: "10px 14px", fontSize: 11 }} className="mono">
              <div>TEMP 37.5°C</div>
              <div>VIB 0.23 g</div>
              <div>CUR 0.98 A</div>
              <div>RPM 1420</div>
            </div>
          )}
        </div>
      </section>

      {/* SCROLL STORY */}
      <section id="story" style={{ position: "relative", maxWidth: 1000, margin: "0 auto", padding: "20px 40px 100px" }}>
        {[
          { t: "The Machine", d: "A physical industrial asset — motor, pump, generator or HVAC unit — operating on campus." },
          { t: "The Signal", d: "Vibration, temperature, current and acoustic sensors continuously observe its behaviour." },
          { t: "The Intelligence", d: "An ESP32 edge node streams telemetry to a Node.js backend, where a Python ML layer looks for deviation from learned baselines." },
          { t: "The Decision", d: "Anomalies become risk scores and health estimates — plain-language recommendations, not raw numbers." },
          { t: "The Action", d: "Technicians receive prioritized, explainable maintenance guidance and close the loop with feedback." },
        ].map((s, i) => (
          <div key={s.t} style={{ display: "flex", gap: 22, padding: "22px 0", borderBottom: i < 4 ? "1px solid #1E2E3A" : "none" }}>
            <div className="mono" style={{ fontSize: 13, color: T.teal, width: 30, paddingTop: 3 }}>{String(i + 1).padStart(2, "0")}</div>
            <div>
              <div className="display" style={{ fontSize: 19, fontWeight: 700 }}>{s.t}</div>
              <div style={{ fontSize: 13.5, color: "#9FB0BC", marginTop: 5, maxWidth: 560 }}>{s.d}</div>
            </div>
          </div>
        ))}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <button onClick={onEnter} className="focus-ring" style={{ padding: "13px 26px", borderRadius: 8, border: "none", background: T.teal, color: "#06171D", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
            ENTER COMMAND CENTER
          </button>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid #1E2E3A", padding: "22px 40px", fontSize: 11.5, color: "#6E828E", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>IRONside · Predictive Maintenance Platform</div>
        <div>Smart Automation · Hardware + Software</div>
      </footer>
    </div>
  );
}

/* ============================================================
   SETTINGS PAGE
   ============================================================ */
function SettingsPage() {
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [autoWo, setAutoWo] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <div style={{ padding: "30px 28px", maxWidth: 600 }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
        <h2 style={{ fontSize: 18, margin: "0 0 16px" }}>Platform Settings</h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600 }}>Real-time Edge Sync</div>
              <div style={{ fontSize: 12, color: T.textSoft }}>Pull streaming data from registered IoT sensors</div>
            </div>
            <div 
              onClick={() => setSyncEnabled(!syncEnabled)}
              style={{ width: 40, height: 20, background: syncEnabled ? T.teal : T.border, borderRadius: 10, position: "relative", cursor: "pointer", transition: "0.2s" }}
            >
              <div style={{ width: 16, height: 16, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, right: syncEnabled ? 2 : 22, transition: "0.2s" }} />
            </div>
          </div>
          
          <div style={{ height: 1, background: T.border }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600 }}>Automated Work Orders</div>
              <div style={{ fontSize: 12, color: T.textSoft }}>Auto-generate tickets when Risk &gt; 85%</div>
            </div>
            <div 
              onClick={() => setAutoWo(!autoWo)}
              style={{ width: 40, height: 20, background: autoWo ? T.teal : T.border, borderRadius: 10, position: "relative", cursor: "pointer", transition: "0.2s" }}
            >
              <div style={{ width: 16, height: 16, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, right: autoWo ? 2 : 22, transition: "0.2s" }} />
            </div>
          </div>

          <div style={{ height: 1, background: T.border }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600 }}>Critical SMS/Email Notifications</div>
              <div style={{ fontSize: 12, color: T.textSoft }}>Route high-risk alerts to on-call technicians</div>
            </div>
            <div 
              onClick={() => setNotifications(!notifications)}
              style={{ width: 40, height: 20, background: notifications ? T.teal : T.border, borderRadius: 10, position: "relative", cursor: "pointer", transition: "0.2s" }}
            >
              <div style={{ width: 16, height: 16, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, right: notifications ? 2 : 22, transition: "0.2s" }} />
            </div>
          </div>

          <div style={{ height: 1, background: T.border }} />
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600 }}>Anomaly Alert Sensitivity</div>
              <div style={{ fontSize: 12, color: T.textSoft }}>Threshold for flagging baseline deviations</div>
            </div>
            <select style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, background: "#fff" }}>
              <option>High (Prototype Default)</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>

          <div style={{ height: 1, background: T.border }} />
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600 }}>Data Retention Policy</div>
              <div style={{ fontSize: 12, color: T.textSoft }}>History retention for telemetry data</div>
            </div>
            <select style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, background: "#fff" }}>
              <option>30 Days</option>
              <option>90 Days</option>
              <option>1 Year</option>
            </select>
          </div>

          <div style={{ height: 1, background: T.border }} />
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600 }}>ML Baseline Retraining</div>
              <div style={{ fontSize: 12, color: T.textSoft }}>Trigger manual re-evaluation of normal states</div>
            </div>
            <button className="focus-ring" style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${T.teal}`, color: T.teal, background: "transparent", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Retrain Models
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
/* ============================================================
   ROOT APP
   ============================================================ */
export default function IRONside() {
  const [view, setView] = useState("landing");
  const [assets, setAssets] = useState(ALL_ASSETS);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [maintenance, setMaintenance] = useState(INITIAL_MAINTENANCE);
  const [selectedAssetId, setSelectedAssetId] = useState("MOTOR-01");
  const [filterStatus, setFilterStatus] = useState("all");
  const [simRunning, setSimRunning] = useState(false);
  const [timeline, setTimeline] = useState([{ t: "10:10", msg: "Normal operation." }]);
  const [toast, setToast] = useState(null);
  const intervalRef = useRef(null);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const patchAsset = (id, patch) => setAssets((prev) => prev.map((a) => a.id === id ? { ...a, ...patch } : a));

  // Global Real-Time Asset Telemetry
  useEffect(() => {
    if (simRunning) return; // let the demo control it if active
    const timer = setInterval(async () => {
      const now = new Date();
      const timeLabel = now.toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });
      const t = now.getTime() / 2000;
      
      let liveSensorData = null;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/sensor-data`);
        if (response.ok) {
          liveSensorData = await response.json();
        }
      } catch (err) {
        // Backend is unreachable, fallback to local math simulation silently
      }
      
      setAssets(prev => prev.map((a, i) => {
        const last = a.telemetry[a.telemetry.length - 1];
        if (!last) return a;
        
        if (a.isOff) {
          const newPt = { ...last, t: last.t + 1, time: timeLabel, vibration: 0, current: 0, rpm: 0 };
          return { ...a, telemetry: [...a.telemetry.slice(1), newPt] };
        }
        
        // If we fetched live hardware data for this specific asset, inject it directly
        if (liveSensorData && a.id === liveSensorData.assetId) {
          const newPt = {
              t: last.t + 1,
              time: timeLabel,
              vibration: liveSensorData.vibration,
              current: liveSensorData.current,
              temperature: liveSensorData.temperature,
              rpm: liveSensorData.rpm,
              pressureIn: last.pressureIn,
              pressureOut: last.pressureOut
          };
          return {
             ...a,
             status: liveSensorData.status || a.status,
             telemetry: [...a.telemetry.slice(1), newPt]
          };
        }
        
        // Local Wobble Fallback (for assets without hardware backing)
        const wobble = (Math.sin(t + i*0.5) * 0.01 + Math.sin(t*2.1 + i) * 0.008);
        const healthWobble = (Math.random() - 0.5) * 0.5;
        
        const newPt = {
            t: last.t + 1,
            time: timeLabel,
            vibration: Math.max(0, +(last.vibration + wobble + (Math.random()-0.5)*0.01).toFixed(3)),
            current: Math.max(0, +(last.current + wobble*2 + (Math.random()-0.5)*0.1).toFixed(2)),
            temperature: Math.max(0, +(last.temperature + wobble*0.5 + (Math.random()-0.5)*0.2).toFixed(1)),
            rpm: Math.round(Math.max(0, last.rpm + wobble*10 + (Math.random()-0.5)*4)),
            pressureIn: last.pressureIn ? Math.max(0, +(last.pressureIn + wobble*0.1).toFixed(2)) : undefined,
            pressureOut: last.pressureOut ? Math.max(0, +(last.pressureOut + wobble*0.5).toFixed(2)) : undefined,
        };
        
        return {
           ...a,
           health: Math.max(0, Math.min(100, Math.round(a.health + healthWobble))),
           risk: Math.max(0, Math.min(100, Math.round(a.risk - healthWobble))),
           telemetry: [...a.telemetry.slice(1), newPt]
        };
      }));
    }, 1500);

    return () => clearInterval(timer);
  }, [simRunning]);

  const runSimulation = useCallback(() => {
    if (simRunning) return;
    setSimRunning(true);
    setTimeline([{ t: "10:10", msg: "Normal operation." }]);
    let step = 0;
    const steps = [
      { vib: 0.27, cur: 1.02, t: "10:14", msg: "Vibration deviation detected." },
      { vib: 0.31, cur: 1.05, t: "10:18", msg: "Current deviation increasing." },
      { vib: 0.36, cur: 1.08, t: "10:21", msg: "Anomaly confidence increased." },
      { vib: 0.42, cur: 1.12, t: "10:24", msg: "High-risk alert generated." },
    ];
    intervalRef.current = setInterval(() => {
      if (step >= steps.length) {
        clearInterval(intervalRef.current);
        setSimRunning(false);
        // finalize: create alert + maintenance task
        setAlerts((prev) => [{
          id: `ALT-${Math.floor(100 + Math.random() * 800)}`, severity: "high-risk", assetId: "MOTOR-01",
          signal: "Vibration & current deviation above baseline", message: "Vibration and current readings have deviated sharply from the learned baseline over the last 15 minutes.",
          risk: 68, time: "just now", status: "open",
        }, ...prev]);
        setMaintenance((prev) => [{
          id: `WO-${Math.floor(200 + Math.random() * 90)}`, assetId: "MOTOR-01", issue: "Vibration & current deviation increasing",
          priority: "High", recommended: "Inspect bearing condition and shaft alignment.", technician: "Unassigned", due: "Immediate", status: "work_order",
        }, ...prev]);
        showToast("High-risk alert generated for MOTOR-01");
        return;
      }
      const s = steps[step];
      patchAsset("MOTOR-01", {
        status: step < 2 ? "attention" : "high-risk",
        health: Math.max(32, 84 - step * 13),
        risk: Math.min(68, 16 + step * 13),
        telemetry: [...(assets.find(a => a.id === "MOTOR-01")?.telemetry.slice(1) || []), { t: 99 + step, time: s.t, vibration: s.vib, current: s.cur, temperature: 37.5 + step, rpm: 1420 - step * 4 }],
      });
      setTimeline((prev) => [...prev, { t: s.t, msg: s.msg }]);
      step++;
    }, 850);
  }, [simRunning, assets]);

  const resetDemo = () => {
    clearInterval(intervalRef.current);
    setSimRunning(false);
    setAssets((prev) => prev.map((a) => a.id === "MOTOR-01" ? NAMED_ASSETS[0] : a));
    setTimeline([{ t: "10:10", msg: "Normal operation." }]);
    showToast("Demo reset.");
  };

  const openWorkOrder = (alert) => {
    setMaintenance((prev) => [{
      id: `WO-${Math.floor(300 + Math.random() * 90)}`, assetId: alert.assetId, issue: alert.signal,
      priority: alert.risk > 55 ? "High" : "Medium", recommended: "Inspect flagged sensor source and compare to asset baseline.",
      technician: "Unassigned", due: "3 days", status: "work_order",
    }, ...prev]);
    showToast(`Work order created for ${alert.assetId}`);
  };

  const onMaintComplete = (task) => {
    // closed feedback loop: restore asset health if this was the MOTOR-01 demo
    if (task.assetId === "MOTOR-01") {
      patchAsset("MOTOR-01", { status: "healthy", health: 84, risk: 16 });
      setAlerts((prev) => prev.map((a) => a.assetId === "MOTOR-01" && a.status === "open" ? { ...a, status: "resolved" } : a));
      showToast("Maintenance complete — MOTOR-01 health restored.");
    } else {
      showToast("Maintenance task completed.");
    }
  };

  const toggleShutdown = (id) => {
    setAssets((prev) => prev.map((a) => {
      if (a.id === id) {
        const turningOn = a.isOff;
        showToast(turningOn ? "Machine started." : "Machine successfully shut down.");
        return { ...a, isOff: !turningOn };
      }
      return a;
    }));
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  if (view === "landing") return <><GlobalStyle /><LandingPage onEnter={() => setView("overview")} /></>;

  const titles = {
    overview: ["Asset Command Center", "Real-time asset health, anomaly intelligence and maintenance priority."],
    assets: ["Asset Registry", "Search, filter and inspect every monitored asset."],
    assetDetail: [selectedAsset?.id || "", "Digital record of the physical machine."],
    telemetry: ["Live Telemetry", "Multi-sensor monitoring across the edge network."],
    alerts: ["Alert Center", "Triage anomalies by severity and assign action."],
    maintenance: ["Maintenance Queue", "From alert to work order to resolution."],
    analytics: ["Analytics", "Fleet-wide trends across health, risk and maintenance."],
    system: ["System", "Architecture, data pipeline and platform health."],
    settings: ["Settings", "Configure platform preferences and edge synchronization."],
    vision: ["Future Scope", "The roadmap for predictive intelligence."],
    judges: ["Judges Q&A", "Answers to technical and business evaluation criteria."],
  };
  const [title, subtitle] = titles[view] || ["", ""];

  return (
    <div className="iron-root" style={{ height: "100vh", display: "flex", overflow: "hidden" }}>
      <GlobalStyle />
      <Sidebar view={view} setView={setView} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar title={title} subtitle={subtitle} right={
          view === "assetDetail" && (
            <button onClick={() => setView("assets")} className="focus-ring" style={{ fontSize: 12, fontWeight: 600, color: T.textSoft, background: "none", border: "none", cursor: "pointer" }}>← Back to registry</button>
          )
        } />
        <div className="iron-scroll" style={{ flex: 1, overflowY: "auto" }}>
          {view === "overview" && <OverviewPage assets={assets} alerts={alerts} maintenance={maintenance} setView={setView} setSelectedAsset={setSelectedAssetId} filterStatus={filterStatus} setFilterStatus={setFilterStatus} />}
          {view === "assets" && <AssetsPage assets={assets} setView={setView} setSelectedAsset={setSelectedAssetId} filterStatus={filterStatus} setFilterStatus={setFilterStatus} />}
          {view === "assetDetail" && <AssetDetailPage asset={selectedAsset} onSimulate={runSimulation} onReset={resetDemo} simRunning={simRunning} timeline={timeline} alerts={alerts} showToast={showToast} toggleShutdown={toggleShutdown} />}
          {view === "telemetry" && <TelemetryPage assets={assets} />}
          {view === "alerts" && <AlertsPage alerts={alerts} setAlerts={setAlerts} assets={assets} openWorkOrder={openWorkOrder} />}
          {view === "maintenance" && <MaintenancePage tasks={maintenance} setTasks={setMaintenance} assets={assets} onComplete={onMaintComplete} />}
          {view === "analytics" && <AnalyticsPage />}
          {view === "system" && <SystemPage />}
          {view === "settings" && <SettingsPage />}
        </div>
      </div>
      {toast && (
        <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", background: T.navyDeep, color: "#fff", padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", zIndex: 100 }}>
          {toast}
        </div>
      )}
    </div>
  );
}

