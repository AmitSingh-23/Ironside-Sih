import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { DEVICE_REGISTRY } from "./deviceRegistry";

/* =====================================================
   LAZY MODEL IMPORTS — one per device type
   ===================================================== */
import InductionMotorModel from "./models/InductionMotorModel";
import CentrifugalPumpModel from "./models/CentrifugalPumpModel";
import DieselGeneratorModel from "./models/DieselGeneratorModel";
import HVACUnitModel from "./models/HVACUnitModel";
import AirCompressorModel from "./models/AirCompressorModel";
import ConveyorDriveModel from "./models/ConveyorDriveModel";
import FallbackModel from "./models/FallbackModel";

const MODEL_COMPONENTS = {
  "Induction Motor": InductionMotorModel,
  "Centrifugal Pump": CentrifugalPumpModel,
  "Diesel Generator": DieselGeneratorModel,
  "HVAC Unit": HVACUnitModel,
  "Air Compressor": AirCompressorModel,
  "Conveyor Drive": ConveyorDriveModel,
};

/* =====================================================
   DESIGN TOKENS (matching App.jsx)
   ===================================================== */
const T = {
  navy: "#17324D",
  navyDeep: "#101A22",
  teal: "#2A7F8E",
  healthy: "#2E7D5B",
  warning: "#D69E2E",
  critical: "#C94A4A",
  textSoft: "#64748B",
  border: "#D9E0E5",
};


/* =====================================================
   CAMERA TWEEN CONTROLLER — smooth "Focus Fault" zoom
   ===================================================== */
function CameraController({ focusTarget, controlsRef }) {
  const { camera } = useThree();
  const tweenRef = useRef(null);

  useEffect(() => {
    if (!focusTarget || !controlsRef.current) return;

    const target = new THREE.Vector3(...focusTarget);
    const direction = new THREE.Vector3().subVectors(camera.position, controlsRef.current.target).normalize();
    const newPos = target.clone().add(direction.multiplyScalar(4.5));

    tweenRef.current = {
      startPos: camera.position.clone(),
      startTarget: controlsRef.current.target.clone(),
      endPos: newPos,
      endTarget: target,
      progress: 0,
    };
  }, [focusTarget]);

  useFrame((_, delta) => {
    if (!tweenRef.current || !controlsRef.current) return;
    const tw = tweenRef.current;
    tw.progress = Math.min(1, tw.progress + delta * 1.8);
    const ease = 1 - Math.pow(1 - tw.progress, 3); // cubic ease-out

    camera.position.lerpVectors(tw.startPos, tw.endPos, ease);
    controlsRef.current.target.lerpVectors(tw.startTarget, tw.endTarget, ease);
    controlsRef.current.update();

    if (tw.progress >= 1) tweenRef.current = null;
  });

  return null;
}

/* =====================================================
   UNIFIED MATERIAL APPLIER — safely overrides materials
   for hovered, selected, and faulted parts without mutating them
   ===================================================== */
function UnifiedMaterialApplier({ faultParts, selectedPart, hoveredPart, groupRef }) {
  const faultMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x8b2020, emissive: 0xff2222, emissiveIntensity: 1.0,
    roughness: 0.25, metalness: 0.7, transparent: true, opacity: 0.92, depthTest: false, depthWrite: false
  }), []);

  // Both Hover and Selected use YELLOW as requested
  const highlightMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xd69e2e, emissive: 0xd69e2e, emissiveIntensity: 0.6,
    roughness: 0.3, metalness: 0.5, transparent: true, opacity: 0.95
  }), []);

  // Base state is BLUE as requested
  const blueMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x1e3a8a, emissive: 0x172554, emissiveIntensity: 0.2,
    roughness: 0.6, metalness: 0.6
  }), []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    
    const t = clock.getElapsedTime();
    faultMat.emissiveIntensity = 0.3 + Math.abs(Math.sin(t * 2.8)) * 1.1;
    highlightMat.emissiveIntensity = 0.4 + Math.abs(Math.sin(t * 4)) * 0.4;

    const meshesToOverride = new Map();

    // 1. Mark faults (lowest priority override)
    if (faultParts && faultParts.length > 0) {
      faultParts.forEach(partKey => {
         groupRef.current.traverse(child => {
            if (child.name === partKey) {
               child.traverse(mesh => { if (mesh.isMesh) meshesToOverride.set(mesh, faultMat); });
            }
         });
      });
    }

    // 2. Mark selected (overrides fault)
    if (selectedPart) {
       groupRef.current.traverse(child => {
          if (child.name === selectedPart) {
             child.traverse(mesh => { if (mesh.isMesh) meshesToOverride.set(mesh, highlightMat); });
          }
       });
    }

    // 3. Mark hovered (highest priority)
    if (hoveredPart) {
       groupRef.current.traverse(child => {
          if (child.name === hoveredPart) {
             child.traverse(mesh => { if (mesh.isMesh) meshesToOverride.set(mesh, highlightMat); });
          }
       });
    }

    // Apply materials globally to everything
    groupRef.current.traverse(child => {
       if (child.isMesh) {
          const targetMat = meshesToOverride.get(child) || blueMat;
          if (child.material !== targetMat) {
             child.material = targetMat;
          }
       }
    });
  });

  return null;
}

/* =====================================================
   EXPLODE CONTROLLER — dissects model on hover
   ===================================================== */
function ExplodeController({ isExploded, groupRef, partsData }) {
  const origPositions = useRef(new Map());
  const targetPositions = useRef(new Map());

  useEffect(() => {
    if (!groupRef.current) return;
    
    // Calculate target positions once
    if (origPositions.current.size === 0) {
      groupRef.current.traverse((node) => {
        if (node.isGroup && partsData && partsData[node.name]) {
          const box = new THREE.Box3().setFromObject(node);
          const center = new THREE.Vector3();
          box.getCenter(center);
          
          origPositions.current.set(node, node.position.clone());
          
          const dir = center.clone().normalize();
          // If the center is roughly at origin, move it up
          if (center.lengthSq() < 0.1) {
             dir.set(0, 1, 0);
          }
          
          // Explode distance: 1.5 units
          const target = node.position.clone().add(dir.multiplyScalar(1.5));
          targetPositions.current.set(node, target);
        }
      });
    }
  }, [groupRef, partsData]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    origPositions.current.forEach((origPos, node) => {
       const targetPos = isExploded 
         ? targetPositions.current.get(node)
         : origPos;
       node.position.lerp(targetPos, delta * 6);
    });
  });

  return null;
}

/* =====================================================
   3D SCENE CONTENT — model + lighting + grid + controls
   ===================================================== */
function SceneContent({
  machineType,
  anomaly,
  faultParts,
  selectedPart,
  hoveredPart,
  onPartClick,
  onPartHover,
  onPartLeave,
  focusTarget,
  cameraDistance,
  cameraY,
  isExploded,
  partsData,
  controlsRef
}) {
  const modelGroupRef = useRef();

  const ModelComponent = MODEL_COMPONENTS[machineType] || FallbackModel;

  const memoizedModel = useMemo(() => {
    return (
      <ModelComponent
        onPartClick={onPartClick}
        onPartHover={onPartHover}
        onPartLeave={onPartLeave}
      />
    );
  }, [ModelComponent, onPartClick, onPartHover, onPartLeave]);

  return (
    <>
      {/* Studio Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 10, 8]} intensity={2.0} color="#70d6ff" castShadow />
      <directionalLight position={[-8, -2, -6]} intensity={1.4} color="#2a7f8e" />
      <pointLight position={[0, 4, -5]} intensity={1.5} color="#00f5d4" distance={25} />
      <pointLight position={[-4, 2, 4]} intensity={0.8} color="#ffffff" distance={20} />

      {/* Technical grid floor */}
      <gridHelper args={[20, 20, "#1e3a4c", "#112330"]} position={[0, -2.5, 0]} />

      {/* Camera controls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        enableZoom={false}
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={25}
        maxPolarAngle={Math.PI * 0.85}
        target={[0, 0, 0]}
      />

      {/* Camera tween for Focus Fault */}
      <CameraController focusTarget={focusTarget} controlsRef={controlsRef} />

      {/* The actual machine model */}
      <Suspense fallback={null}>
        <group ref={modelGroupRef}>
          {memoizedModel}
        </group>
      </Suspense>

      {/* Explode animation */}
      <ExplodeController isExploded={isExploded} groupRef={modelGroupRef} partsData={partsData} />

      {/* Visual highlights and faults applier */}
      <UnifiedMaterialApplier 
        faultParts={faultParts} 
        selectedPart={selectedPart} 
        hoveredPart={hoveredPart} 
        groupRef={modelGroupRef} 
      />
    </>
  );
}

/* =====================================================
   FAULT DETAIL PANEL — right-side inspector
   ===================================================== */
function FaultDetailPanel({
  part,
  partKey,
  isAnomaly,
  asset,
  alerts,
  onClose,
  onFocusFault,
}) {
  if (!part) return null;

  const isFault = isAnomaly && part.isFaultTarget;
  const health = isFault ? part.faultHealth : part.nominalHealth;
  const temp = isFault ? part.temp.fault : part.temp.healthy;
  const vib = isFault ? part.vib.fault : part.vib.healthy;
  const action = isFault ? part.action.fault : part.action.healthy;
  const healthColor = health < 50 ? T.critical : health < 80 ? T.warning : T.healthy;
  const statusText = health < 50 ? "CRITICAL" : health < 80 ? "ATTENTION" : "HEALTHY";
  const statusBg = health < 50 ? `${T.critical}33` : health < 80 ? `${T.warning}33` : `${T.healthy}33`;
  const statusCol = health < 50 ? "#FFA4A4" : health < 80 ? "#FDE047" : "#6EE7B7";

  // Find related alerts for this asset
  const relatedAlerts = alerts?.filter((a) => a.assetId === asset?.id && a.status === "open") || [];

  return (
    <div
      style={{
        background: "rgba(12,22,30,0.97)",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflowY: "auto",
        minWidth: 280,
        maxWidth: 340,
      }}
    >
      <div>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.teal, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {part.subsystem}
            </span>
            <h4 style={{ fontSize: 15, fontWeight: 700, margin: "2px 0 0 0", color: "#fff", lineHeight: 1.3 }}>{part.name}</h4>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span
              style={{
                fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                textTransform: "uppercase", background: statusBg, color: statusCol,
                border: `1px solid ${healthColor}`,
              }}
            >
              {statusText}
            </span>
            <button
              onClick={onClose}
              style={{
                background: "none", border: "none", color: "#7B93A4", cursor: "pointer",
                fontSize: 18, lineHeight: 1, padding: "0 2px",
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: 12, color: "#9FB3C2", lineHeight: 1.5, margin: "0 0 14px 0" }}>
          {part.desc}
        </p>

        {/* Metric Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          <MetricBox label="Health Index" value={`${health}%`} color={healthColor} history={part.history?.health} />
          <MetricBox label="Vibration RMS" value={vib} color={isFault ? T.critical : "#5EEAD4"} history={part.history?.vib} />
          <MetricBox label="Surface Temp" value={temp} color={isFault ? T.critical : "#E2E8F0"} history={part.history?.temp} />
          <MetricBox
            label="Est. RUL"
            value={isFault ? "48 Hours" : "> 4,000 Hrs"}
            color={isFault ? "#FFA4A4" : "#5EEAD4"}
          />
        </div>

        {/* Fault codes */}
        {part.faultCodes?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#7B93A4", textTransform: "uppercase", marginBottom: 4 }}>
              Fault Codes
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {part.faultCodes.map((fc) => (
                <span
                  key={fc}
                  style={{
                    fontSize: 10, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                    padding: "2px 6px", borderRadius: 3,
                    background: isFault ? `${T.critical}22` : "rgba(255,255,255,0.06)",
                    color: isFault ? "#FFA4A4" : "#8CA2B0",
                    border: `1px solid ${isFault ? `${T.critical}44` : "rgba(255,255,255,0.1)"}`,
                  }}
                >
                  {fc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Diagnostic detail */}
        <div
          style={{
            background: isFault ? "rgba(201,74,74,0.12)" : "rgba(42,127,142,0.12)",
            border: `1px solid ${isFault ? `${T.critical}55` : `${T.teal}44`}`,
            borderRadius: 8, padding: "10px 12px", marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: isFault ? "#FFA4A4" : "#5EEAD4", textTransform: "uppercase", marginBottom: 4 }}>
            {isFault ? "Fault Analysis" : "Diagnostic Status"}
          </div>
          <div style={{ fontSize: 12, color: "#E2E8F0", lineHeight: 1.45 }}>
            {isFault && part.faultDetail ? part.faultDetail : action}
          </div>
        </div>

        {/* Related alerts from real data */}
        {relatedAlerts.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#7B93A4", textTransform: "uppercase", marginBottom: 6 }}>
              Active Alerts ({asset?.id})
            </div>
            {relatedAlerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6, padding: "8px 10px", marginBottom: 4,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: "#E2E8F0" }}>{alert.signal}</div>
                <div style={{ fontSize: 10, color: "#7B93A4", marginTop: 2 }}>
                  {alert.id} · {alert.time} · Risk: {alert.risk}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#8CA2B0", textTransform: "uppercase", marginBottom: 4 }}>
          Recommended Action
        </div>
        <div style={{ fontSize: 11.5, color: "#E2E8F0", marginBottom: 10 }}>{action}</div>
        <div style={{ display: "flex", gap: 6 }}>
          {isFault && (
            <button
              onClick={onFocusFault}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 6, border: "none",
                background: T.teal, color: "#fff", fontSize: 11, fontWeight: 700,
                cursor: "pointer", boxShadow: `0 3px 10px ${T.teal}44`,
              }}
            >
              🎯 Focus Camera
            </button>
          )}
          {isFault && (
            <button
              onClick={() => alert(`Work order generated for ${part.name} on ${asset?.id || "—"}`)}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 6, border: "none",
                background: T.critical, color: "#fff", fontSize: 11, fontWeight: 700,
                cursor: "pointer", boxShadow: `0 3px 10px ${T.critical}44`,
              }}
            >
              🔧 Dispatch W/O
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Sparkline({ data, color }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = (max - min) || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '24px', marginTop: '6px', overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function MetricBox({ label, value, color, bar, history }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 6, padding: "8px 10px",
        display: "flex", flexDirection: "column"
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 600, color: "#8CA2B0", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      {bar !== undefined && !history && (
        <div style={{ height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${bar}%`, background: color, borderRadius: 2 }} />
        </div>
      )}
      {history && <Sparkline data={history} color={color} />}
    </div>
  );
}

/* =====================================================
   SIMULATED TELEMETRY HOOK — adds subtle fluctuations
   ===================================================== */
function useSimulatedTelemetry(basePartsData) {
  const [telemetry, setTelemetry] = useState(() => {
     const initial = {};
     Object.keys(basePartsData).forEach(key => {
       initial[key] = {
         ...basePartsData[key],
         history: {
           health: Array(20).fill(basePartsData[key].nominalHealth),
           vib: Array(20).fill(parseFloat(basePartsData[key].vib?.healthy) || 0),
           temp: Array(20).fill(parseFloat(basePartsData[key].temp?.healthy) || 0)
         }
       };
     });
     return initial;
  });

  useEffect(() => {
    let tick = 0;
    const interval = setInterval(() => {
      tick += 1;
      setTelemetry((prev) => {
        const next = {};
        Object.keys(prev).forEach((key, index) => {
          const part = { ...prev[key] };
          
          const isFault = basePartsData[key].isFaultTarget;
          part.isFaultTarget = isFault;
          
          // Phase shift based on index (slow down the sin wave because tick updates 4x faster)
          const phase = index * 1.5;
          const sine = Math.sin(tick * 0.025 + phase);
          
          // Fluctuate health smoothly
          const hBase = basePartsData[key].nominalHealth;
          const hFaultBase = basePartsData[key].faultHealth;
          const hDelta = sine > 0.8 ? 1 : sine < -0.8 ? -1 : 0;
          
          part.nominalHealth = Math.min(100, Math.max(0, hBase + hDelta));
          part.faultHealth = Math.min(100, Math.max(0, hFaultBase + hDelta));
          
          const mutateStr = (str, delta) => {
             const match = str.match(/([0-9.]+)(.*)/);
             if (match) {
                 const val = parseFloat(match[1]);
                 return (val + delta).toFixed(1) + match[2];
             }
             return str;
          };
          const tDelta = sine * 0.2;
          part.temp = {
            healthy: mutateStr(basePartsData[key].temp.healthy, tDelta),
            fault: mutateStr(basePartsData[key].temp.fault, tDelta),
          };
          
          const mutateVib = (str, delta) => {
             const match = str.match(/([0-9.]+)(.*)/);
             if (match) {
                 const val = parseFloat(match[1]);
                 return Math.max(0, val + delta).toFixed(2) + match[2];
             }
             return str;
          };
          // scale cos to tick * 0.035
          const vDelta = Math.cos(tick * 0.035 + phase) * 0.02;
          part.vib = {
            healthy: mutateVib(basePartsData[key].vib.healthy, vDelta),
            fault: mutateVib(basePartsData[key].vib.fault, vDelta),
          };

          // Update history (keep last 20 points)
          const newHealthHist = [...part.history.health.slice(1), part.nominalHealth];
          const newVibHist = [...part.history.vib.slice(1), parseFloat(part.vib.healthy) || 0];
          const newTempHist = [...part.history.temp.slice(1), parseFloat(part.temp.healthy) || 0];
          
          part.history = {
            health: newHealthHist,
            vib: newVibHist,
            temp: newTempHist
          };
          
          next[key] = part;
        });
        return next;
      });
    }, 250); // 250ms updates for smoother real-time fluttering

    return () => clearInterval(interval);
  }, [basePartsData]);

  return telemetry;
}

/* =====================================================
   MAIN EXPORTED COMPONENT — Device3DViewer
   ===================================================== */
export default function Device3DViewer({ asset, anomaly = false, alerts = [], compact = false }) {
  const machineType = asset?.type || "Induction Motor";
  const config = DEVICE_REGISTRY[machineType];
  const partsData = config?.parts || {};
  
  const [selectedPartKey, setSelectedPartKey] = useState(null);

  const livePartsData = useSimulatedTelemetry(partsData);

  // Determine faulted parts
  const faultParts = useMemo(() => {
    if (!anomaly) return [];
    return Object.keys(partsData).filter((key) => partsData[key].isFaultTarget);
  }, [anomaly, machineType, partsData]);

  const controlsRef = useRef();

  const handleZoom = useCallback((direction) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const camera = controls.object;
    const target = controls.target;

    const zoomFactor = direction === "in" ? 0.75 : 1.33;
    const offset = new THREE.Vector3().subVectors(camera.position, target);
    offset.multiplyScalar(zoomFactor);

    const distance = offset.length();
    if (distance < 3) offset.setLength(3);
    if (distance > 25) offset.setLength(25);

    camera.position.copy(target).add(offset);
    controls.update();
  }, []);
  const [hoveredPartKey, setHoveredPartKey] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const [isExploded, setIsExploded] = useState(false);

  // Auto-select first fault part when anomaly activates
  useEffect(() => {
    if (anomaly && faultParts.length > 0) {
      setSelectedPartKey(faultParts[0]);
    }
  }, [anomaly, faultParts]);

  const handlePartClick = useCallback((partKey) => {
    setSelectedPartKey((prev) => (prev === partKey ? null : partKey));
  }, []);

  const handlePartLeave = useCallback(() => {
    setHoveredPartKey(null);
  }, []);

  const handleFocusFault = useCallback(() => {
    // This triggers a camera tween. The model components should set position data
    // For now, we use a rough center-of-model target
    setFocusTarget([0, 0, 0]);
    // Reset after a brief delay so it can be re-triggered
    setTimeout(() => setFocusTarget(null), 100);
  }, []);

  const selectedPart = selectedPartKey ? livePartsData[selectedPartKey] : null;
  const cameraDistance = config?.cameraDistance || 10;
  const cameraY = config?.cameraY || 1.4;

  return (
    <div
      style={{
        background: T.navyDeep,
        color: "#fff",
        borderRadius: 12,
        border: `1px solid ${T.navy}`,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(16,26,34,0.7)",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 10, height: 10, borderRadius: 999,
              background: anomaly ? T.critical : T.teal,
              boxShadow: anomaly ? `0 0 12px ${T.critical}` : `0 0 8px ${T.teal}`,
            }}
          />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 8 }}>
              <span>3D COMPONENT INSPECTION & FAULT LOCATOR</span>
              <span
                style={{
                  fontSize: 10, padding: "2px 7px", borderRadius: 4,
                  background: anomaly ? `${T.critical}33` : `${T.healthy}33`,
                  color: anomaly ? "#FFA4A4" : "#6EE7B7",
                  border: `1px solid ${anomaly ? T.critical : T.healthy}`,
                }}
              >
                {anomaly ? "FAULT ACTIVE" : "NOMINAL"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#8CA2B0", marginTop: 1 }}>
              {config?.title || machineType} · Orbit / Pan / Zoom · Click component to inspect
            </div>
          </div>
        </div>

        {/* Part selector pills */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {Object.entries(livePartsData).map(([key, part]) => {
            const isActive = selectedPartKey === key;
            const isFault = anomaly && part.isFaultTarget;
            const pillColor = isFault ? T.critical : isActive ? T.teal : "rgba(255,255,255,0.1)";

            return (
              <button
                key={key}
                onClick={() => setSelectedPartKey(key)}
                style={{
                  padding: "3px 8px",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 999,
                  border: `1px solid ${pillColor}`,
                  background: isActive ? `${pillColor}33` : "transparent",
                  color: isFault ? "#FFA4A4" : isActive ? "#5EEAD4" : "#A0B2C0",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  animation: isFault ? "blink 1.5s ease-in-out infinite" : "none",
                }}
              >
                {isFault ? "⚠ " : ""}{part.name.split(" ").slice(0, 2).join(" ")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main viewport */}
      <div style={{ display: "flex", minHeight: compact ? 340 : 420 }}>
        {/* 3D Canvas */}
        <div 
          style={{ flex: 1, position: "relative" }}
          onPointerEnter={() => setIsExploded(true)}
          onPointerLeave={() => { setIsExploded(false); setHoveredPartKey(null); }}
        >
          <Canvas
            camera={{ position: [0, cameraY, cameraDistance], fov: 38 }}
            shadows
            dpr={[1, 2]}
            style={{ background: "#0a1218" }}
            gl={{ antialias: true }}
          >
            <SceneContent
              machineType={machineType}
              anomaly={anomaly}
              faultParts={faultParts}
              selectedPart={selectedPartKey}
              hoveredPart={hoveredPartKey}
              onPartClick={handlePartClick}
              onPartHover={setHoveredPartKey}
              onPartLeave={handlePartLeave}
              focusTarget={focusTarget}
              cameraDistance={cameraDistance}
              cameraY={cameraY}
              isExploded={isExploded}
              partsData={livePartsData}
              controlsRef={controlsRef}
            />
          </Canvas>

          {/* Manual Zoom Controls */}
          <div style={{ position: "absolute", top: 12, right: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            <button
              onClick={() => handleZoom("in")}
              className="focus-ring"
              style={{
                width: 32, height: 32,
                background: "rgba(12,24,34,0.85)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 6,
                color: "#fff",
                fontSize: 20,
                fontWeight: 300,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(4px)"
              }}
            >
              +
            </button>
            <button
              onClick={() => handleZoom("out")}
              className="focus-ring"
              style={{
                width: 32, height: 32,
                background: "rgba(12,24,34,0.85)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 6,
                color: "#fff",
                fontSize: 20,
                fontWeight: 300,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(4px)"
              }}
            >
              −
            </button>
          </div>

          {/* Bottom-left HUD */}
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 12,
              background: "rgba(12,24,34,0.88)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 11,
              display: "flex",
              gap: 12,
              fontFamily: "'JetBrains Mono', monospace",
              color: "#fff",
            }}
          >
            <div>
              <span style={{ color: "#7B93A4" }}>TYPE:</span>{" "}
              <strong>{machineType}</strong>
            </div>
            <div>
              <span style={{ color: "#7B93A4" }}>STATUS:</span>{" "}
              <strong style={{ color: anomaly ? "#FFA4A4" : "#5EEAD4" }}>{anomaly ? "FAULT" : "OK"}</strong>
            </div>
            <div>
              <span style={{ color: "#7B93A4" }}>PARTS:</span>{" "}
              <strong>{Object.keys(partsData).length}</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#5EEAD4", animation: "blink 1s infinite" }} />
              <span style={{ color: "#5EEAD4", fontWeight: 700 }}>LIVE</span>
            </div>
          </div>

          {/* Hovered part tooltip */}
          {hoveredPartKey && livePartsData[hoveredPartKey] && (
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "rgba(12,24,34,0.92)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 6,
                padding: "12px",
                fontSize: 11,
                color: "#E2E8F0",
                width: 240,
                pointerEvents: "none",
                zIndex: 10,
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", marginBottom: 2 }}>{livePartsData[hoveredPartKey].name}</div>
              <div style={{ color: T.teal, fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>{livePartsData[hoveredPartKey].subsystem}</div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                 {(() => {
                    const part = livePartsData[hoveredPartKey];
                    const isFault = anomaly && part.isFaultTarget;
                    const health = isFault ? part.faultHealth : part.nominalHealth;
                    const temp = isFault ? part.temp.fault : part.temp.healthy;
                    const vib = isFault ? part.vib.fault : part.vib.healthy;
                    const healthColor = health < 50 ? T.critical : health < 80 ? T.warning : T.healthy;
                    return (
                      <>
                        <div style={{ background: "rgba(255,255,255,0.05)", padding: 6, borderRadius: 4 }}>
                           <div style={{ fontSize: 9, color: "#8CA2B0" }}>HEALTH</div>
                           <div style={{ fontSize: 13, fontWeight: 700, color: healthColor }}>{health}%</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.05)", padding: 6, borderRadius: 4 }}>
                           <div style={{ fontSize: 9, color: "#8CA2B0" }}>TEMP</div>
                           <div style={{ fontSize: 13, fontWeight: 700, color: isFault ? T.critical : "#E2E8F0" }}>{temp}</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.05)", padding: 6, borderRadius: 4 }}>
                           <div style={{ fontSize: 9, color: "#8CA2B0" }}>VIBRATION</div>
                           <div style={{ fontSize: 13, fontWeight: 700, color: isFault ? T.critical : "#5EEAD4" }}>{vib}</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.05)", padding: 6, borderRadius: 4 }}>
                           <div style={{ fontSize: 9, color: "#8CA2B0" }}>RUL</div>
                           <div style={{ fontSize: 13, fontWeight: 700, color: isFault ? "#FFA4A4" : "#5EEAD4" }}>{isFault ? "48 Hrs" : ">4k Hrs"}</div>
                        </div>
                      </>
                    )
                 })()}
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel (conditional) */}
        {selectedPart && (
          <FaultDetailPanel
            part={selectedPart}
            partKey={selectedPartKey}
            isAnomaly={anomaly}
            asset={asset}
            alerts={alerts}
            onClose={() => setSelectedPartKey(null)}
            onFocusFault={handleFocusFault}
          />
        )}
      </div>
    </div>
  );
}
