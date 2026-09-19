import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// COMPONENT DEFINITIONS PER MACHINE TYPE
const MACHINE_CONFIGS = {
  "Induction Motor": {
    title: "INDUSTRIAL AC INDUCTION MOTOR (450 kW)",
    parts: {
      "front-shield": {
        name: "Front Drive-End Bell & Bearing Flange",
        subsystem: "Housing & Structure",
        desc: "Precision cast-iron flange securing drive-end bearing with machined labyrinth grease seal.",
        nominalHealth: 98,
        faultHealth: 98,
        temp: () => "35.2°C",
        vib: () => "0.18 g",
        status: () => "healthy",
        action: () => "Inspect flange bolt torque (48 Nm) during scheduled PM.",
      },
      "front-bearing": {
        name: "Deep Groove Ball Bearing (6308-2Z)",
        subsystem: "Bearing Assembly",
        desc: "Precision rolling element bearing taking drive-end radial and axial shaft loads.",
        nominalHealth: 96,
        faultHealth: 22,
        temp: (a) => (a ? "69.4°C" : "36.5°C"),
        vib: (a) => (a ? "0.84 g" : "0.22 g"),
        status: (a) => (a ? "critical" : "healthy"),
        isFaultTrigger: true,
        action: (a) => (a ? "URGENT: Bearing inner raceway spalling detected. Replace bearing assembly." : "Nominal acoustic and lubrication levels."),
      },
      "stator-frame": {
        name: "Finned Cast Iron Stator Enclosure",
        subsystem: "Stator & Cooling",
        desc: "Heavy-duty ribbed frame with integrated cooling fins, terminal box, and mounting feet.",
        nominalHealth: 95,
        faultHealth: 92,
        temp: (a) => (a ? "51.0°C" : "41.2°C"),
        vib: () => "0.20 g",
        status: () => "healthy",
        action: () => "Check cooling fin ventilation path for debris.",
      },
      "stator-core": {
        name: "Laminated Silicon Steel Stator Core",
        subsystem: "Electromagnetic Circuit",
        desc: "Low-loss insulated laminations creating high-permeability magnetic circuit.",
        nominalHealth: 94,
        faultHealth: 76,
        temp: (a) => (a ? "54.8°C" : "42.0°C"),
        vib: (a) => (a ? "0.33 g" : "0.21 g"),
        status: (a) => (a ? "attention" : "healthy"),
        action: () => "Thermographic survey for eddy current losses.",
      },
      "copper-windings": {
        name: "Class H Copper Stator Windings",
        subsystem: "Electromagnetic Circuit",
        desc: "Three-phase distributed coils vacuum-pressure impregnated with high-temp epoxy resin.",
        nominalHealth: 95,
        faultHealth: 68,
        temp: (a) => (a ? "61.2°C" : "40.0°C"),
        vib: (a) => (a ? "0.36 g" : "0.19 g"),
        status: (a) => (a ? "attention" : "healthy"),
        action: () => "Insulation resistance (Megger) testing recommended.",
      },
      "rotor-core": {
        name: "Squirrel Cage Rotor & Aluminum Bars",
        subsystem: "Rotating Core",
        desc: "Die-cast rotor core dynamically balanced to ISO 1940 G2.5 standard.",
        nominalHealth: 93,
        faultHealth: 81,
        temp: (a) => (a ? "48.0°C" : "38.5°C"),
        vib: (a) => (a ? "0.42 g" : "0.21 g"),
        status: (a) => (a ? "attention" : "healthy"),
        action: () => "Verify rotor dynamic balance during service.",
      },
      "drive-shaft": {
        name: "High-Tensile Alloy Drive Shaft",
        subsystem: "Mechanical Transmission",
        desc: "Hardened steel shaft transmitting torque with precision machined keyway.",
        nominalHealth: 97,
        faultHealth: 94,
        temp: () => "37.0°C",
        vib: (a) => (a ? "0.28 g" : "0.23 g"),
        status: () => "healthy",
        action: () => "Laser alignment check with coupled load.",
      },
      "rear-bearing": {
        name: "Rear Non-Drive Bearing (6208)",
        subsystem: "Bearing Assembly",
        desc: "Deep groove ball bearing supporting non-drive shaft extension.",
        nominalHealth: 94,
        faultHealth: 88,
        temp: (a) => (a ? "39.5°C" : "36.0°C"),
        vib: () => "0.24 g",
        status: () => "healthy",
        action: () => "Routine grease replenishment schedule.",
      },
      "cooling-fan": {
        name: "Bi-directional Cooling Impeller",
        subsystem: "Cooling Subsystem",
        desc: "Aerodynamic nylon fan forcing convective airflow over stator cooling fins.",
        nominalHealth: 99,
        faultHealth: 99,
        temp: () => "31.0°C",
        vib: () => "0.15 g",
        status: () => "healthy",
        action: () => "Visual inspection for blade integrity.",
      },
      "fan-cowl": {
        name: "Ventilated Protective Fan Cowl",
        subsystem: "Cooling Subsystem",
        desc: "Protective sheet metal cowl directing airflow and preventing debris ingress.",
        nominalHealth: 99,
        faultHealth: 99,
        temp: () => "30.5°C",
        vib: () => "0.12 g",
        status: () => "healthy",
        action: () => "Keep intake wire mesh unobstructed.",
      },
    },
  },

  "Centrifugal Pump": {
    title: "CENTRIFUGAL SLURRY / WATER PUMP",
    parts: {
      "volute-casing": {
        name: "Cast Steel Volute Casing & Discharge (O/P)",
        subsystem: "Hydraulic Chamber",
        desc: "Hydrodynamic spiral volute casing converting kinetic velocity into static pressure (O/P).",
        nominalHealth: 96,
        faultHealth: 64,
        temp: (a) => (a ? "48.5°C" : "38.2°C"),
        vib: (a) => (a ? "0.45 g" : "0.21 g"),
        status: (a) => (a ? "attention" : "healthy"),
        action: (a) => (a ? "Inspect volute cutwater for cavitation erosion." : "Discharge pressure nominal at 6.2 bar."),
      },
      "impeller": {
        name: "Enclosed Curved-Vane Bronze Impeller",
        subsystem: "Hydraulic Core",
        desc: "Precision hydrofoil impeller accelerating fluid toward volute discharge.",
        nominalHealth: 95,
        faultHealth: 38,
        temp: (a) => (a ? "56.0°C" : "36.0°C"),
        vib: (a) => (a ? "0.68 g" : "0.24 g"),
        status: (a) => (a ? "critical" : "healthy"),
        isFaultTrigger: true,
        action: (a) => (a ? "CRITICAL: Impeller cavitation erosion detected. Check suction head (NPSH)." : "Fluid dynamic balance nominal."),
      },
      "suction-flange": {
        name: "Axial Suction Inlet Flange (I/P)",
        subsystem: "Hydraulic Chamber",
        desc: "Inlet flange with integrated static pressure sensor tapping (I/P).",
        nominalHealth: 98,
        faultHealth: 90,
        temp: () => "32.4°C",
        vib: () => "0.18 g",
        status: () => "healthy",
        action: () => "Inspect suction strainer differential pressure.",
      },
      "mechanical-seal": {
        name: "Silicon Carbide Mechanical Seal Cartridge",
        subsystem: "Fluid Containment",
        desc: "Balanced dual-face seal preventing high-pressure fluid leakage along the drive shaft.",
        nominalHealth: 94,
        faultHealth: 42,
        temp: (a) => (a ? "64.2°C" : "39.0°C"),
        vib: (a) => (a ? "0.52 g" : "0.20 g"),
        status: (a) => (a ? "critical" : "healthy"),
        isFaultTrigger: true,
        action: (a) => (a ? "Seal face thermal distress. Check barrier fluid flush." : "Barrier fluid pressure nominal."),
      },
      "pump-shaft": {
        name: "Duplex Stainless Pump Shaft",
        subsystem: "Mechanical Drive",
        desc: "Precision machined shaft with ceramic wear sleeve in seal stuffing box.",
        nominalHealth: 97,
        faultHealth: 88,
        temp: () => "37.0°C",
        vib: (a) => (a ? "0.38 g" : "0.19 g"),
        status: () => "healthy",
        action: () => "Verify shaft runout tolerance (<0.02 mm).",
      },
      "bearing-frame": {
        name: "Cast Iron Bearing Housing & Oil Bath",
        subsystem: "Mechanical Support",
        desc: "Rigid bearing pedestal housing paired angular contact thrust bearings with sight glass.",
        nominalHealth: 94,
        faultHealth: 58,
        temp: (a) => (a ? "58.2°C" : "41.0°C"),
        vib: (a) => (a ? "0.49 g" : "0.22 g"),
        status: (a) => (a ? "attention" : "healthy"),
        action: (a) => (a ? "Check oil level and particle contamination." : "Oil sample clear, viscosity nominal."),
      },
    },
  },

  "Diesel Generator": {
    title: "HEAVY INDUSTRIAL DIESEL GENSET",
    parts: {
      "engine-block": {
        name: "V-Cylinder Diesel Engine Block",
        subsystem: "Thermal Prime Mover",
        desc: "Heavy-duty cast iron block with wet cylinder liners and forged steel crankshaft.",
        nominalHealth: 95,
        faultHealth: 74,
        temp: (a) => (a ? "88.0°C" : "78.5°C"),
        vib: (a) => (a ? "0.48 g" : "0.32 g"),
        status: (a) => (a ? "attention" : "healthy"),
        action: () => "Verify engine oil pressure (4.2 bar) and crankcase pressure.",
      },
      "turbocharger": {
        name: "Exhaust Gas Turbocharger & Turbine",
        subsystem: "Air Induction",
        desc: "Twin-scroll radial exhaust gas turbine driving high-pressure centrifugal intake compressor.",
        nominalHealth: 93,
        faultHealth: 32,
        temp: (a) => (a ? "540.0°C" : "420.0°C"),
        vib: (a) => (a ? "0.78 g" : "0.28 g"),
        status: (a) => (a ? "critical" : "healthy"),
        isFaultTrigger: true,
        action: (a) => (a ? "CRITICAL: Turbocharger journal bearing wear & boost loss detected." : "Boost pressure nominal at 2.4 bar."),
      },
      "alternator-stator": {
        name: "Synchronous 4-Pole Alternator Stator",
        subsystem: "Power Generation",
        desc: "2/3 pitch winding synchronous alternator with automatic voltage regulation (AVR).",
        nominalHealth: 96,
        faultHealth: 88,
        temp: (a) => (a ? "62.0°C" : "48.0°C"),
        vib: () => "0.22 g",
        status: () => "healthy",
        action: () => "Verify 415V/50Hz output phase balance.",
      },
      "alternator-rotor": {
        name: "Salient Pole Rotor & Brushless Exciter",
        subsystem: "Power Generation",
        desc: "Rotating field assembly with brushless exciter armature and rotating diode bridge.",
        nominalHealth: 95,
        faultHealth: 85,
        temp: () => "52.0°C",
        vib: (a) => (a ? "0.36 g" : "0.24 g"),
        status: () => "healthy",
        action: () => "Inspect rotating rectifier diodes.",
      },
      "radiator-pack": {
        name: "Aluminum Radiator Matrix & Fan",
        subsystem: "Cooling Circuit",
        desc: "Heavy-duty bar-and-plate coolant radiator with engine-driven pusher fan.",
        nominalHealth: 98,
        faultHealth: 62,
        temp: (a) => (a ? "98.5°C" : "82.0°C"),
        vib: () => "0.20 g",
        status: (a) => (a ? "attention" : "healthy"),
        action: (a) => (a ? "Coolant temperature high. Clean radiator airflow matrix." : "Coolant temperature in range (82°C)."),
      },
      "skid-base": {
        name: "Structural Steel Skid & Anti-Vibration Mounts",
        subsystem: "Structural Platform",
        desc: "Heavy steel channel sub-base with integrated elastomeric vibration isolators.",
        nominalHealth: 99,
        faultHealth: 98,
        temp: () => "32.0°C",
        vib: () => "0.14 g",
        status: () => "healthy",
        action: () => "Verify spring isolator deflection.",
      },
    },
  },

  "HVAC Unit": {
    title: "MODULAR HVAC AIR HANDLING UNIT",
    parts: {
      "compressor": {
        name: "Hermetic Dual Scroll Compressor",
        subsystem: "Refrigeration Circuit",
        desc: "High-efficiency orbiting scroll compressor circulating R410A refrigerant.",
        nominalHealth: 96,
        faultHealth: 36,
        temp: (a) => (a ? "78.4°C" : "45.0°C"),
        vib: (a) => (a ? "0.72 g" : "0.22 g"),
        status: (a) => (a ? "critical" : "healthy"),
        isFaultTrigger: true,
        action: (a) => (a ? "CRITICAL: Compressor scroll tip seal degradation & high discharge superheat." : "Suction and discharge pressures nominal."),
      },
      "condenser-coil": {
        name: "Microchannel Heat Exchanger Coil",
        subsystem: "Heat Rejection",
        desc: "All-aluminum microchannel refrigerant condensing coil with corrosion protection.",
        nominalHealth: 94,
        faultHealth: 82,
        temp: (a) => (a ? "54.0°C" : "42.0°C"),
        vib: () => "0.16 g",
        status: () => "healthy",
        action: () => "Clean condensing coil fin block.",
      },
      "blower-wheel": {
        name: "Direct-Drive Supply Blower Wheel",
        subsystem: "Air Distribution",
        desc: "EC motor driven backward-curved centrifugal fan wheel delivering static pressure.",
        nominalHealth: 97,
        faultHealth: 74,
        temp: () => "34.0°C",
        vib: (a) => (a ? "0.44 g" : "0.18 g"),
        status: (a) => (a ? "attention" : "healthy"),
        action: (a) => (a ? "Blower unbalance warning. Inspect fan wheel for dust buildup." : "Airflow CFM within target."),
      },
      "expansion-valve": {
        name: "Electronic Expansion Valve (EEV)",
        subsystem: "Refrigeration Control",
        desc: "Stepper modulated electronic expansion valve maintaining target evaporator superheat.",
        nominalHealth: 98,
        faultHealth: 78,
        temp: () => "12.0°C",
        vib: () => "0.08 g",
        status: () => "healthy",
        action: () => "Superheat control nominal at 6.5K.",
      },
      "filter-bank": {
        name: "MERV 14 Pleated Air Filter Bank",
        subsystem: "Air Filtration",
        desc: "Deep-pleated synthetic particulate filter cassette with differential pressure sensor.",
        nominalHealth: 95,
        faultHealth: 68,
        temp: () => "24.0°C",
        vib: () => "0.05 g",
        status: (a) => (a ? "attention" : "healthy"),
        action: (a) => (a ? "High filter delta-P. Schedule filter cassette replacement." : "Filter delta-P < 120 Pa (clean)."),
      },
    },
  },

  "Air Compressor": {
    title: "ROTARY SCREW AIR COMPRESSOR",
    parts: {
      "rotary-screws": {
        name: "Twin Helical Screw Rotor Set",
        subsystem: "Compression Airend",
        desc: "Precision ground helical male and female rotors delivering pulse-free compression.",
        nominalHealth: 95,
        faultHealth: 34,
        temp: (a) => (a ? "88.5°C" : "55.0°C"),
        vib: (a) => (a ? "0.76 g" : "0.22 g"),
        status: (a) => (a ? "critical" : "healthy"),
        isFaultTrigger: true,
        action: (a) => (a ? "CRITICAL: Airend rotor profile wear & elevated discharge temperature." : "Airend compression ratio nominal."),
      },
      "intake-valve": {
        name: "Suction Intake Unloader Valve",
        subsystem: "Intake Control",
        desc: "Pneumatic modulating unloader valve matching volume flow to line demand.",
        nominalHealth: 97,
        faultHealth: 88,
        temp: () => "30.0°C",
        vib: () => "0.14 g",
        status: () => "healthy",
        action: () => "Inspect intake valve seals and air filter element.",
      },
      "oil-separator": {
        name: "Air-Oil Separator Vessel",
        subsystem: "Fluid Separation",
        desc: "Coalescing filtration vessel removing coolant oil to <3 ppm carryover.",
        nominalHealth: 94,
        faultHealth: 62,
        temp: (a) => (a ? "72.0°C" : "52.0°C"),
        vib: () => "0.18 g",
        status: (a) => (a ? "attention" : "healthy"),
        action: (a) => (a ? "High separator differential pressure (>0.8 bar). Replace spin-on element." : "Oil carryover nominal."),
      },
      "receiver-tank": {
        name: "Pressure Receiver Tank (10 Bar)",
        subsystem: "Pressure Storage",
        desc: "Welded steel pressure storage vessel with safety valve and automatic condensate trap.",
        nominalHealth: 99,
        faultHealth: 98,
        temp: () => "38.0°C",
        vib: () => "0.08 g",
        status: () => "healthy",
        action: () => "Test pressure relief valve.",
      },
      "aftercooler": {
        name: "Bar-and-Plate Air Aftercooler",
        subsystem: "Thermal Management",
        desc: "Aluminum heat exchanger reducing compressed air temperature to ambient +10K.",
        nominalHealth: 96,
        faultHealth: 78,
        temp: (a) => (a ? "62.0°C" : "44.0°C"),
        vib: () => "0.15 g",
        status: () => "healthy",
        action: () => "Blow clean aftercooler fins.",
      },
    },
  },

  "Conveyor Drive": {
    title: "HEAVY-DUTY CONVEYOR DRIVE PULLEY",
    parts: {
      "drive-pulley": {
        name: "Rubber-Lagged Drive Drum Pulley",
        subsystem: "Drive Traction",
        desc: "Machined heavy steel drive drum with vulcanized diamond pattern rubber traction lagging.",
        nominalHealth: 94,
        faultHealth: 36,
        temp: (a) => (a ? "62.0°C" : "38.0°C"),
        vib: (a) => (a ? "0.74 g" : "0.24 g"),
        status: (a) => (a ? "critical" : "healthy"),
        isFaultTrigger: true,
        action: (a) => (a ? "CRITICAL: Rubber lagging delamination & belt slippage detected." : "Lagging thickness and traction nominal."),
      },
      "helical-gearbox": {
        name: "Helical Bevel Speed Reducer",
        subsystem: "Gear Transmission",
        desc: "Hardened helical gear train providing high reduction torque to the drive drum.",
        nominalHealth: 95,
        faultHealth: 70,
        temp: (a) => (a ? "68.4°C" : "48.0°C"),
        vib: (a) => (a ? "0.52 g" : "0.26 g"),
        status: (a) => (a ? "attention" : "healthy"),
        action: (a) => (a ? "Gear meshing frequency sidebands elevated. Perform oil sample analysis." : "Gearbox oil ISO VG 220 in spec."),
      },
      "pillow-bearings": {
        name: "Pillow Block Plummer Bearings (SN518)",
        subsystem: "Bearing Pedestals",
        desc: "Split cast iron plummer block housing spherical roller bearings with labyrinth seals.",
        nominalHealth: 96,
        faultHealth: 48,
        temp: (a) => (a ? "65.0°C" : "39.5°C"),
        vib: (a) => (a ? "0.64 g" : "0.22 g"),
        status: (a) => (a ? "critical" : "healthy"),
        isFaultTrigger: true,
        action: (a) => (a ? "Bearing outer ring defect. Regrease and schedule spherical roller replacement." : "Grease purging nominal."),
      },
      "snub-roller": {
        name: "Conveyor Snub Tensioner Pulley",
        subsystem: "Belt Tensioning",
        desc: "Secondary redirection roller increasing belt wrap angle around the drive pulley to 210°.",
        nominalHealth: 98,
        faultHealth: 92,
        temp: () => "34.0°C",
        vib: () => "0.16 g",
        status: () => "healthy",
        action: () => "Check snub roller alignment and belt tracking.",
      },
      "drive-motor": {
        name: "Flanged Squirrel Cage Drive Motor",
        subsystem: "Electric Prime Mover",
        desc: "Totally enclosed fan-cooled (TEFC) premium efficiency electric motor mounted to gearbox bellhousing.",
        nominalHealth: 95,
        faultHealth: 88,
        temp: (a) => (a ? "54.0°C" : "42.0°C"),
        vib: () => "0.22 g",
        status: () => "healthy",
        action: () => "Inspect coupling buffer inserts.",
      },
    },
  },
};

// HELPER: Add subtle CAD technical blueprint wireframe lines to any mesh
function addCadLines(mesh, color = 0x2a7f8e, opacity = 0.35) {
  if (!mesh?.geometry) return;
  const edges = new THREE.EdgesGeometry(mesh.geometry, 25);
  const lineMat = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: opacity,
  });
  const lines = new THREE.LineSegments(edges, lineMat);
  mesh.add(lines);
}

export default function ThreeMachineDissection({
  asset = null,
  anomaly = false,
  type = null,
  compact = false,
}) {
  const machineType = asset?.type || type || "Induction Motor";
  const config = MACHINE_CONFIGS[machineType] || MACHINE_CONFIGS["Induction Motor"];
  const partsData = config.parts;

  const defaultPartKey = Object.keys(partsData)[0] || "front-bearing";
  const [selectedPartKey, setSelectedPartKey] = useState(defaultPartKey);
  const [hoveredPartKey, setHoveredPartKey] = useState(null);
  const [isHoveredOverCanvas, setIsHoveredOverCanvas] = useState(false);
  const [autoExplodeOnHover, setAutoExplodeOnHover] = useState(true);
  const [manualFactor, setManualFactor] = useState(0);

  const mountRef = useRef(null);
  const factorRef = useRef(0);
  const targetFactorRef = useRef(0);
  const anomalyRef = useRef(anomaly);
  const hoveredPartRef = useRef(null);

  useEffect(() => {
    anomalyRef.current = anomaly;
    const faultPart = Object.keys(partsData).find((k) => partsData[k].isFaultTrigger);
    if (anomaly && faultPart) {
      setSelectedPartKey(faultPart);
    }
  }, [anomaly, machineType]);

  useEffect(() => {
    hoveredPartRef.current = hoveredPartKey;
  }, [hoveredPartKey]);

  useEffect(() => {
    if (autoExplodeOnHover) {
      targetFactorRef.current = isHoveredOverCanvas ? 1 : manualFactor;
    } else {
      targetFactorRef.current = manualFactor;
    }
  }, [isHoveredOverCanvas, autoExplodeOnHover, manualFactor]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1218);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 10.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // STUDIO LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x70d6ff, 2.2);
    dirLight1.position.set(6, 10, 8);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x2a7f8e, 1.6);
    dirLight2.position.set(-8, -2, -6);
    scene.add(dirLight2);

    const rimLight = new THREE.PointLight(0x00f5d4, 1.8, 25);
    rimLight.position.set(0, 4, -5);
    scene.add(rimLight);

    // TECHNICAL CAD GRID
    const gridHelper = new THREE.GridHelper(20, 20, 0x1e3a4c, 0x112330);
    gridHelper.position.y = -2.1;
    scene.add(gridHelper);

    const machineGroup = new THREE.Group();
    scene.add(machineGroup);

    // HIGH-END INDUSTRIAL PBR MATERIALS (Realistic dark titanium, brushed steel, copper, bronze, slate)
    const darkTitaniumMat = new THREE.MeshStandardMaterial({
      color: 0x1d2c38,
      roughness: 0.4,
      metalness: 0.7,
    });

    const machinedSteelMat = new THREE.MeshStandardMaterial({
      color: 0xbfd0dc,
      roughness: 0.18,
      metalness: 0.92,
    });

    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xc86d3b,
      roughness: 0.3,
      metalness: 0.85,
    });

    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0xb08040,
      roughness: 0.35,
      metalness: 0.8,
    });

    const laminatedCoreMat = new THREE.MeshStandardMaterial({
      color: 0x334858,
      roughness: 0.5,
      metalness: 0.65,
    });

    const tealAccentMat = new THREE.MeshStandardMaterial({
      color: 0x224858,
      roughness: 0.35,
      metalness: 0.55,
    });

    const rubberLaggingMat = new THREE.MeshStandardMaterial({
      color: 0x151f28,
      roughness: 0.85,
      metalness: 0.15,
    });

    const faultMat = new THREE.MeshStandardMaterial({
      color: 0x8b2020,
      emissive: 0xff2222,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.8,
    });

    const partsMap = {};
    let faultGroupRef = null;

    // =========================================================================
    // HIGH-FIDELITY 3D PROCEDURAL CAD MODELS (DETAILED, ALIGNED, REALISTIC)
    // =========================================================================

    if (machineType === "Centrifugal Pump") {
      // 1. VOLUTE CASING & CUTWATER (Spiral Chamber + Discharge O/P)
      const voluteGroup = new THREE.Group();
      voluteGroup.userData = { partKey: "volute-casing" };

      const voluteGeo = new THREE.TorusGeometry(1.5, 0.46, 20, 36);
      voluteGeo.rotateY(Math.PI / 2);
      const voluteMesh = new THREE.Mesh(voluteGeo, darkTitaniumMat);
      addCadLines(voluteMesh);
      voluteGroup.add(voluteMesh);

      // Top Discharge Nozzle (O/P)
      const dischargeGeo = new THREE.CylinderGeometry(0.48, 0.48, 1.2, 24);
      const dischargeMesh = new THREE.Mesh(dischargeGeo, tealAccentMat);
      dischargeMesh.position.set(0, 1.6, 0.75);
      addCadLines(dischargeMesh);
      voluteGroup.add(dischargeMesh);

      const dFlangeGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.18, 24);
      const dFlange = new THREE.Mesh(dFlangeGeo, darkTitaniumMat);
      dFlange.position.set(0, 2.2, 0.75);
      addCadLines(dFlange);
      voluteGroup.add(dFlange);

      machineGroup.add(voluteGroup);
      partsMap["volute-casing"] = { group: voluteGroup, baseOffset: 0, mult: 0 };

      // 2. ENCLOSED BRONZE IMPELLER (Multi-vane with curved hydrofoils)
      const impellerGroup = new THREE.Group();
      impellerGroup.userData = { partKey: "impeller" };

      const impellerHubGeo = new THREE.CylinderGeometry(1.15, 1.15, 0.32, 28);
      impellerHubGeo.rotateZ(Math.PI / 2);
      const impellerMesh = new THREE.Mesh(impellerHubGeo, bronzeMat);
      addCadLines(impellerMesh);
      impellerGroup.add(impellerMesh);

      for (let v = 0; v < 6; v++) {
        const vAngle = (v / 6) * Math.PI * 2;
        const vaneGeo = new THREE.BoxGeometry(0.28, 0.62, 0.08);
        const vane = new THREE.Mesh(vaneGeo, bronzeMat);
        vane.position.set(0, Math.cos(vAngle) * 0.68, Math.sin(vAngle) * 0.68);
        vane.rotation.x = -vAngle + 0.45;
        impellerGroup.add(vane);
      }
      impellerGroup.position.set(0, 0, 0);
      machineGroup.add(impellerGroup);
      partsMap["impeller"] = { group: impellerGroup, baseOffset: 0, mult: -1.8 };
      faultGroupRef = impellerGroup;

      // 3. SUCTION FLANGE (Axial Intake I/P)
      const suctionGroup = new THREE.Group();
      suctionGroup.userData = { partKey: "suction-flange" };

      const suctionGeo = new THREE.CylinderGeometry(0.62, 0.62, 1.1, 28);
      suctionGeo.rotateZ(Math.PI / 2);
      const suctionMesh = new THREE.Mesh(suctionGeo, darkTitaniumMat);
      suctionMesh.position.set(-0.95, 0, 0);
      addCadLines(suctionMesh);
      suctionGroup.add(suctionMesh);

      const sFlangeGeo = new THREE.CylinderGeometry(0.92, 0.92, 0.18, 28);
      sFlangeGeo.rotateZ(Math.PI / 2);
      const sFlange = new THREE.Mesh(sFlangeGeo, darkTitaniumMat);
      sFlange.position.set(-1.5, 0, 0);
      addCadLines(sFlange);
      suctionGroup.add(sFlange);

      machineGroup.add(suctionGroup);
      partsMap["suction-flange"] = { group: suctionGroup, baseOffset: -0.95, mult: -3.4 };

      // 4. MECHANICAL SEAL CARTRIDGE
      const sealGroup = new THREE.Group();
      sealGroup.userData = { partKey: "mechanical-seal" };

      const sealGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.55, 24);
      sealGeo.rotateZ(Math.PI / 2);
      const sealMesh = new THREE.Mesh(sealGeo, machinedSteelMat);
      addCadLines(sealMesh);
      sealGroup.add(sealMesh);
      sealGroup.position.set(0.85, 0, 0);
      machineGroup.add(sealGroup);
      partsMap["mechanical-seal"] = { group: sealGroup, baseOffset: 0.85, mult: 1.6 };

      // 5. PUMP DRIVE SHAFT
      const shaftGroup = new THREE.Group();
      shaftGroup.userData = { partKey: "pump-shaft" };

      const pShaftGeo = new THREE.CylinderGeometry(0.26, 0.26, 5.0, 24);
      pShaftGeo.rotateZ(Math.PI / 2);
      const pShaft = new THREE.Mesh(pShaftGeo, machinedSteelMat);
      addCadLines(pShaft);
      shaftGroup.add(pShaft);
      shaftGroup.position.set(1.3, 0, 0);
      machineGroup.add(shaftGroup);
      partsMap["pump-shaft"] = { group: shaftGroup, baseOffset: 1.3, mult: 2.8 };

      // 6. BEARING FRAME & OIL BATH PEDESTAL
      const frameGroup = new THREE.Group();
      frameGroup.userData = { partKey: "bearing-frame" };

      const pedGeo = new THREE.BoxGeometry(2.2, 1.3, 1.1);
      const pedMesh = new THREE.Mesh(pedGeo, darkTitaniumMat);
      pedMesh.position.set(0, -0.38, 0);
      addCadLines(pedMesh);
      frameGroup.add(pedMesh);

      const footGeo = new THREE.BoxGeometry(2.4, 0.22, 1.4);
      const foot = new THREE.Mesh(footGeo, darkTitaniumMat);
      foot.position.set(0, -1.05, 0);
      addCadLines(foot);
      frameGroup.add(foot);

      frameGroup.position.set(1.9, 0, 0);
      machineGroup.add(frameGroup);
      partsMap["bearing-frame"] = { group: frameGroup, baseOffset: 1.9, mult: 4.2 };
    } else if (machineType === "Diesel Generator") {
      // 1. ENGINE BLOCK & CYLINDER HEADS
      const engineGroup = new THREE.Group();
      engineGroup.userData = { partKey: "engine-block" };

      const blockGeo = new THREE.BoxGeometry(2.8, 2.0, 1.6);
      const blockMesh = new THREE.Mesh(blockGeo, darkTitaniumMat);
      addCadLines(blockMesh);
      engineGroup.add(blockMesh);

      // Valve rocker covers on top
      const valveLGeo = new THREE.BoxGeometry(2.4, 0.35, 0.55);
      const valveL = new THREE.Mesh(valveLGeo, tealAccentMat);
      valveL.position.set(0, 1.15, 0.38);
      addCadLines(valveL);
      engineGroup.add(valveL);

      const valveR = valveL.clone();
      valveR.position.set(0, 1.15, -0.38);
      engineGroup.add(valveR);

      engineGroup.position.set(-1.1, 0, 0);
      machineGroup.add(engineGroup);
      partsMap["engine-block"] = { group: engineGroup, baseOffset: -1.1, mult: -1.2 };

      // 2. TURBOCHARGER & INTERCOOLER
      const turboGroup = new THREE.Group();
      turboGroup.userData = { partKey: "turbocharger" };

      const turboGeo = new THREE.TorusGeometry(0.6, 0.22, 16, 24);
      const turboMesh = new THREE.Mesh(turboGeo, machinedSteelMat);
      addCadLines(turboMesh);
      turboGroup.add(turboMesh);
      turboGroup.position.set(-1.3, 1.35, 0.75);
      machineGroup.add(turboGroup);
      partsMap["turbocharger"] = { group: turboGroup, baseOffset: -1.3, mult: -2.6 };
      faultGroupRef = turboGroup;

      // 3. ALTERNATOR STATOR
      const altGroup = new THREE.Group();
      altGroup.userData = { partKey: "alternator-stator" };

      const altGeo = new THREE.CylinderGeometry(1.4, 1.4, 2.4, 28);
      altGeo.rotateZ(Math.PI / 2);
      const altMesh = new THREE.Mesh(altGeo, tealAccentMat);
      addCadLines(altMesh);
      altGroup.add(altMesh);
      altGroup.position.set(1.3, 0, 0);
      machineGroup.add(altGroup);
      partsMap["alternator-stator"] = { group: altGroup, baseOffset: 1.3, mult: 1.8 };

      // 4. ALTERNATOR ROTOR
      const altRotorGroup = new THREE.Group();
      altRotorGroup.userData = { partKey: "alternator-rotor" };

      const aRotorGeo = new THREE.CylinderGeometry(0.82, 0.82, 2.2, 20);
      aRotorGeo.rotateZ(Math.PI / 2);
      const aRotor = new THREE.Mesh(aRotorGeo, laminatedCoreMat);
      addCadLines(aRotor);
      altRotorGroup.add(aRotor);
      altRotorGroup.position.set(1.3, 0, 0);
      machineGroup.add(altRotorGroup);
      partsMap["alternator-rotor"] = { group: altRotorGroup, baseOffset: 1.3, mult: 3.0 };

      // 5. RADIATOR COOLING PACK
      const radGroup = new THREE.Group();
      radGroup.userData = { partKey: "radiator-pack" };

      const radGeo = new THREE.BoxGeometry(0.55, 2.6, 2.0);
      const radMesh = new THREE.Mesh(radGeo, darkTitaniumMat);
      addCadLines(radMesh);
      radGroup.add(radMesh);
      radGroup.position.set(-3.0, 0.2, 0);
      machineGroup.add(radGroup);
      partsMap["radiator-pack"] = { group: radGroup, baseOffset: -3.0, mult: -4.2 };

      // 6. HEAVY SKID SUB-BASE
      const skidGroup = new THREE.Group();
      skidGroup.userData = { partKey: "skid-base" };

      const skidGeo = new THREE.BoxGeometry(6.4, 0.32, 2.2);
      const skidMesh = new THREE.Mesh(skidGeo, darkTitaniumMat);
      skidMesh.position.set(0, -1.35, 0);
      addCadLines(skidMesh);
      skidGroup.add(skidMesh);
      machineGroup.add(skidGroup);
      partsMap["skid-base"] = { group: skidGroup, baseOffset: 0, mult: 0 };
    } else if (machineType === "HVAC Unit") {
      // 1. SCROLL COMPRESSOR
      const compGroup = new THREE.Group();
      compGroup.userData = { partKey: "compressor" };

      const compGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.1, 24);
      const compMesh = new THREE.Mesh(compGeo, darkTitaniumMat);
      addCadLines(compMesh);
      compGroup.add(compMesh);
      compGroup.position.set(-1.1, 0, 0);
      machineGroup.add(compGroup);
      partsMap["compressor"] = { group: compGroup, baseOffset: -1.1, mult: -1.8 };
      faultGroupRef = compGroup;

      // 2. CONDENSER COIL BLOCK
      const coilGroup = new THREE.Group();
      coilGroup.userData = { partKey: "condenser-coil" };

      const coilGeo = new THREE.BoxGeometry(2.2, 2.0, 0.38);
      const coilMesh = new THREE.Mesh(coilGeo, tealAccentMat);
      addCadLines(coilMesh);
      coilGroup.add(coilMesh);
      coilGroup.position.set(0.55, 0, -0.9);
      machineGroup.add(coilGroup);
      partsMap["condenser-coil"] = { group: coilGroup, baseOffset: 0.55, mult: 1.4 };

      // 3. CENTRIFUGAL BLOWER WHEEL
      const blowerGroup = new THREE.Group();
      blowerGroup.userData = { partKey: "blower-wheel" };

      const blowerGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.75, 20);
      const blowerMesh = new THREE.Mesh(blowerGeo, machinedSteelMat);
      addCadLines(blowerMesh);
      blowerGroup.add(blowerMesh);
      blowerGroup.position.set(1.3, 0, 0.55);
      machineGroup.add(blowerGroup);
      partsMap["blower-wheel"] = { group: blowerGroup, baseOffset: 1.3, mult: 3.0 };

      // 4. EXPANSION VALVE (EEV)
      const valveGroup = new THREE.Group();
      valveGroup.userData = { partKey: "expansion-valve" };

      const valveGeo = new THREE.BoxGeometry(0.38, 0.55, 0.38);
      const valveMesh = new THREE.Mesh(valveGeo, bronzeMat);
      addCadLines(valveMesh);
      valveGroup.add(valveMesh);
      valveGroup.position.set(-0.18, -0.55, 0.75);
      machineGroup.add(valveGroup);
      partsMap["expansion-valve"] = { group: valveGroup, baseOffset: -0.18, mult: 0.8 };

      // 5. AIR FILTER BANK
      const filterGroup = new THREE.Group();
      filterGroup.userData = { partKey: "filter-bank" };

      const filterGeo = new THREE.BoxGeometry(0.28, 1.9, 1.7);
      const filterMesh = new THREE.Mesh(filterGeo, darkTitaniumMat);
      addCadLines(filterMesh);
      filterGroup.add(filterMesh);
      filterGroup.position.set(-2.2, 0, 0);
      machineGroup.add(filterGroup);
      partsMap["filter-bank"] = { group: filterGroup, baseOffset: -2.2, mult: -3.5 };
    } else if (machineType === "Air Compressor") {
      // 1. ROTARY SCREW AIREND (Helical Rotor pair)
      const screwsGroup = new THREE.Group();
      screwsGroup.userData = { partKey: "rotary-screws" };

      const r1Geo = new THREE.CylinderGeometry(0.58, 0.58, 2.5, 24);
      r1Geo.rotateZ(Math.PI / 2);
      const r1Mesh = new THREE.Mesh(r1Geo, machinedSteelMat);
      r1Mesh.position.set(0, 0.4, 0);
      addCadLines(r1Mesh);
      screwsGroup.add(r1Mesh);

      const r2Mesh = r1Mesh.clone();
      r2Mesh.position.set(0, -0.4, 0);
      screwsGroup.add(r2Mesh);

      screwsGroup.position.set(-0.9, 0.2, 0);
      machineGroup.add(screwsGroup);
      partsMap["rotary-screws"] = { group: screwsGroup, baseOffset: -0.9, mult: -2.0 };
      faultGroupRef = screwsGroup;

      // 2. INTAKE REGULATOR VALVE
      const intakeGroup = new THREE.Group();
      intakeGroup.userData = { partKey: "intake-valve" };

      const intakeGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.1, 20);
      const intakeMesh = new THREE.Mesh(intakeGeo, tealAccentMat);
      addCadLines(intakeMesh);
      intakeGroup.add(intakeMesh);
      intakeGroup.position.set(-2.4, 1.1, 0);
      machineGroup.add(intakeGroup);
      partsMap["intake-valve"] = { group: intakeGroup, baseOffset: -2.4, mult: -3.8 };

      // 3. AIR-OIL SEPARATOR VESSEL
      const sepGroup = new THREE.Group();
      sepGroup.userData = { partKey: "oil-separator" };

      const sepGeo = new THREE.CylinderGeometry(0.78, 0.78, 2.2, 24);
      const sepMesh = new THREE.Mesh(sepGeo, darkTitaniumMat);
      addCadLines(sepMesh);
      sepGroup.add(sepMesh);
      sepGroup.position.set(0.9, 0.2, 0);
      machineGroup.add(sepGroup);
      partsMap["oil-separator"] = { group: sepGroup, baseOffset: 0.9, mult: 1.6 };

      // 4. RECEIVER PRESSURE TANK
      const tankGroup = new THREE.Group();
      tankGroup.userData = { partKey: "receiver-tank" };

      const tankGeo = new THREE.CylinderGeometry(1.1, 1.1, 3.8, 28);
      tankGeo.rotateZ(Math.PI / 2);
      const tankMesh = new THREE.Mesh(tankGeo, darkTitaniumMat);
      addCadLines(tankMesh);
      tankGroup.add(tankMesh);
      tankGroup.position.set(0, -1.1, 0);
      machineGroup.add(tankGroup);
      partsMap["receiver-tank"] = { group: tankGroup, baseOffset: 0, mult: 0 };

      // 5. AFTERCOOLER HEAT EXCHANGER
      const coolGroup = new THREE.Group();
      coolGroup.userData = { partKey: "aftercooler" };

      const coolGeo = new THREE.BoxGeometry(0.48, 2.0, 1.6);
      const coolMesh = new THREE.Mesh(coolGeo, copperMat);
      addCadLines(coolMesh);
      coolGroup.add(coolMesh);
      coolGroup.position.set(2.5, 0, 0);
      machineGroup.add(coolGroup);
      partsMap["aftercooler"] = { group: coolGroup, baseOffset: 2.5, mult: 3.8 };
    } else if (machineType === "Conveyor Drive") {
      // 1. DRIVE PULLEY (Machined Drum with Rubber Lagging)
      const pulleyGroup = new THREE.Group();
      pulleyGroup.userData = { partKey: "drive-pulley" };

      const drumGeo = new THREE.CylinderGeometry(1.35, 1.35, 2.8, 32);
      drumGeo.rotateZ(Math.PI / 2);
      const drumMesh = new THREE.Mesh(drumGeo, rubberLaggingMat);
      addCadLines(drumMesh);
      pulleyGroup.add(drumMesh);

      // Steel End Hubs
      const hubGeo = new THREE.CylinderGeometry(0.65, 0.65, 3.0, 24);
      hubGeo.rotateZ(Math.PI / 2);
      const hubMesh = new THREE.Mesh(hubGeo, machinedSteelMat);
      pulleyGroup.add(hubMesh);

      pulleyGroup.position.set(0, 0, 0);
      machineGroup.add(pulleyGroup);
      partsMap["drive-pulley"] = { group: pulleyGroup, baseOffset: 0, mult: 0 };
      faultGroupRef = pulleyGroup;

      // 2. HELICAL BEVEL GEARBOX
      const gearGroup = new THREE.Group();
      gearGroup.userData = { partKey: "helical-gearbox" };

      const gearGeo = new THREE.BoxGeometry(1.6, 1.6, 1.4);
      const gearMesh = new THREE.Mesh(gearGeo, darkTitaniumMat);
      addCadLines(gearMesh);
      gearGroup.add(gearMesh);
      gearGroup.position.set(-2.2, 0, 0);
      machineGroup.add(gearGroup);
      partsMap["helical-gearbox"] = { group: gearGroup, baseOffset: -2.2, mult: -2.4 };

      // 3. ELECTRIC DRIVE MOTOR
      const motorGroup = new THREE.Group();
      motorGroup.userData = { partKey: "drive-motor" };

      const mGeo = new THREE.CylinderGeometry(0.85, 0.85, 1.8, 24);
      mGeo.rotateZ(Math.PI / 2);
      const mMesh = new THREE.Mesh(mGeo, tealAccentMat);
      addCadLines(mMesh);
      motorGroup.add(mMesh);
      motorGroup.position.set(-3.8, 0, 0);
      machineGroup.add(motorGroup);
      partsMap["drive-motor"] = { group: motorGroup, baseOffset: -3.8, mult: -4.2 };

      // 4. PILLOW BLOCK BEARINGS
      const bearingGroup = new THREE.Group();
      bearingGroup.userData = { partKey: "pillow-bearings" };

      const pbGeo = new THREE.BoxGeometry(0.55, 0.9, 0.9);
      const pb1 = new THREE.Mesh(pbGeo, darkTitaniumMat);
      pb1.position.set(-1.6, -0.55, 0);
      addCadLines(pb1);
      bearingGroup.add(pb1);

      const pb2 = pb1.clone();
      pb2.position.set(1.6, -0.55, 0);
      bearingGroup.add(pb2);

      machineGroup.add(bearingGroup);
      partsMap["pillow-bearings"] = { group: bearingGroup, baseOffset: 0, mult: 1.4 };

      // 5. SNUB TENSIONER ROLLER
      const snubGroup = new THREE.Group();
      snubGroup.userData = { partKey: "snub-roller" };

      const snubGeo = new THREE.CylinderGeometry(0.65, 0.65, 2.8, 24);
      snubGeo.rotateZ(Math.PI / 2);
      const snubMesh = new THREE.Mesh(snubGeo, machinedSteelMat);
      addCadLines(snubMesh);
      snubGroup.add(snubMesh);
      snubGroup.position.set(2.2, -0.75, 1.1);
      machineGroup.add(snubGroup);
      partsMap["snub-roller"] = { group: snubGroup, baseOffset: 2.2, mult: 3.6 };
    } else {
      // DEFAULT: INDUCTION MOTOR (Highly detailed with fins, windings, bearings, fan)
      const statorGroup = new THREE.Group();
      statorGroup.userData = { partKey: "stator-frame" };

      const frameGeo = new THREE.CylinderGeometry(1.65, 1.65, 2.6, 32, 1, true);
      frameGeo.rotateZ(Math.PI / 2);
      const frameMesh = new THREE.Mesh(frameGeo, darkTitaniumMat);
      addCadLines(frameMesh);
      statorGroup.add(frameMesh);

      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const finGeo = new THREE.BoxGeometry(2.5, 0.32, 0.08);
        const fin = new THREE.Mesh(finGeo, darkTitaniumMat);
        fin.position.set(0, Math.cos(angle) * 1.72, Math.sin(angle) * 1.72);
        fin.rotation.x = -angle;
        statorGroup.add(fin);
      }

      const jBoxGeo = new THREE.BoxGeometry(0.9, 0.55, 0.85);
      const jBox = new THREE.Mesh(jBoxGeo, darkTitaniumMat);
      jBox.position.set(0, 1.95, 0);
      addCadLines(jBox);
      statorGroup.add(jBox);

      const foot1Geo = new THREE.BoxGeometry(2.2, 0.2, 0.65);
      const foot1 = new THREE.Mesh(foot1Geo, darkTitaniumMat);
      foot1.position.set(0, -1.75, 1.05);
      addCadLines(foot1);
      statorGroup.add(foot1);
      const foot2 = foot1.clone();
      foot2.position.set(0, -1.75, -1.05);
      statorGroup.add(foot2);

      machineGroup.add(statorGroup);
      partsMap["stator-frame"] = { group: statorGroup, baseOffset: 0, mult: 0 };

      const statorCoreGroup = new THREE.Group();
      statorCoreGroup.userData = { partKey: "stator-core" };
      const coreGeo = new THREE.CylinderGeometry(1.5, 1.5, 2.2, 28);
      coreGeo.rotateZ(Math.PI / 2);
      const coreMesh = new THREE.Mesh(coreGeo, laminatedCoreMat);
      addCadLines(coreMesh);
      statorCoreGroup.add(coreMesh);
      machineGroup.add(statorCoreGroup);
      partsMap["stator-core"] = { group: statorCoreGroup, baseOffset: 0, mult: 0 };

      const windingsGroup = new THREE.Group();
      windingsGroup.userData = { partKey: "copper-windings" };
      const windingLeftGeo = new THREE.TorusGeometry(1.12, 0.2, 16, 32);
      windingLeftGeo.rotateY(Math.PI / 2);
      const windingLeft = new THREE.Mesh(windingLeftGeo, copperMat);
      windingLeft.position.set(-1.12, 0, 0);
      windingsGroup.add(windingLeft);
      const windingRight = windingLeft.clone();
      windingRight.position.set(1.12, 0, 0);
      windingsGroup.add(windingRight);
      machineGroup.add(windingsGroup);
      partsMap["copper-windings"] = { group: windingsGroup, baseOffset: 0, mult: 0 };

      const rotorGroup = new THREE.Group();
      rotorGroup.userData = { partKey: "rotor-core" };
      const rotorGeo = new THREE.CylinderGeometry(0.92, 0.92, 1.95, 24);
      rotorGeo.rotateZ(Math.PI / 2);
      const rotorMesh = new THREE.Mesh(rotorGeo, laminatedCoreMat);
      addCadLines(rotorMesh);
      rotorGroup.add(rotorMesh);
      machineGroup.add(rotorGroup);
      partsMap["rotor-core"] = { group: rotorGroup, baseOffset: 0, mult: 1.4 };

      const shaftGroup = new THREE.Group();
      shaftGroup.userData = { partKey: "drive-shaft" };
      const shaftGeo = new THREE.CylinderGeometry(0.3, 0.3, 5.4, 24);
      shaftGeo.rotateZ(Math.PI / 2);
      const shaftMesh = new THREE.Mesh(shaftGeo, machinedSteelMat);
      shaftMesh.position.set(-0.25, 0, 0);
      addCadLines(shaftMesh);
      shaftGroup.add(shaftMesh);
      machineGroup.add(shaftGroup);
      partsMap["drive-shaft"] = { group: shaftGroup, baseOffset: 0, mult: 2.2 };

      const frontBearingGroup = new THREE.Group();
      frontBearingGroup.userData = { partKey: "front-bearing" };
      const outerRingGeo = new THREE.TorusGeometry(0.62, 0.12, 16, 28);
      outerRingGeo.rotateY(Math.PI / 2);
      const outerRing = new THREE.Mesh(outerRingGeo, machinedSteelMat);
      frontBearingGroup.add(outerRing);
      frontBearingGroup.position.set(-1.35, 0, 0);
      machineGroup.add(frontBearingGroup);
      partsMap["front-bearing"] = { group: frontBearingGroup, baseOffset: -1.35, mult: -2.0 };
      faultGroupRef = frontBearingGroup;

      const frontShieldGroup = new THREE.Group();
      frontShieldGroup.userData = { partKey: "front-shield" };
      const fShieldGeo = new THREE.CylinderGeometry(1.68, 1.68, 0.3, 32);
      fShieldGeo.rotateZ(Math.PI / 2);
      const fShieldMesh = new THREE.Mesh(fShieldGeo, darkTitaniumMat);
      addCadLines(fShieldMesh);
      frontShieldGroup.add(fShieldMesh);
      frontShieldGroup.position.set(-1.45, 0, 0);
      machineGroup.add(frontShieldGroup);
      partsMap["front-shield"] = { group: frontShieldGroup, baseOffset: -1.45, mult: -3.4 };

      const rearBearingGroup = frontBearingGroup.clone();
      rearBearingGroup.userData = { partKey: "rear-bearing" };
      rearBearingGroup.position.set(1.35, 0, 0);
      machineGroup.add(rearBearingGroup);
      partsMap["rear-bearing"] = { group: rearBearingGroup, baseOffset: 1.35, mult: 2.4 };

      const rearShieldGroup = new THREE.Group();
      rearShieldGroup.userData = { partKey: "rear-shield-bearing" };
      const rShieldGeo = new THREE.CylinderGeometry(1.68, 1.68, 0.28, 32);
      rShieldGeo.rotateZ(Math.PI / 2);
      const rShieldMesh = new THREE.Mesh(rShieldGeo, darkTitaniumMat);
      addCadLines(rShieldMesh);
      rearShieldGroup.add(rShieldMesh);
      rearShieldGroup.position.set(1.45, 0, 0);
      machineGroup.add(rearShieldGroup);
      partsMap["rear-shield-bearing"] = { group: rearShieldGroup, baseOffset: 1.45, mult: 3.4 };

      const fanGroup = new THREE.Group();
      fanGroup.userData = { partKey: "cooling-fan" };
      const fanHubGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.22, 16);
      fanHubGeo.rotateZ(Math.PI / 2);
      const fanHub = new THREE.Mesh(fanHubGeo, tealAccentMat);
      fanGroup.add(fanHub);
      fanGroup.position.set(1.78, 0, 0);
      machineGroup.add(fanGroup);
      partsMap["cooling-fan"] = { group: fanGroup, baseOffset: 1.78, mult: 4.6 };

      const cowlGroup = new THREE.Group();
      cowlGroup.userData = { partKey: "fan-cowl" };
      const cowlGeo = new THREE.CylinderGeometry(1.7, 1.7, 0.85, 32, 1, true);
      cowlGeo.rotateZ(Math.PI / 2);
      const cowlMesh = new THREE.Mesh(cowlGeo, darkTitaniumMat);
      addCadLines(cowlMesh);
      cowlGroup.add(cowlMesh);
      cowlGroup.position.set(1.95, 0, 0);
      machineGroup.add(cowlGroup);
      partsMap["fan-cowl"] = { group: cowlGroup, baseOffset: 1.95, mult: 5.8 };
    }

    // Set initial stationary view angle
    machineGroup.rotation.y = 0.42;
    machineGroup.rotation.x = 0.16;

    // RAYCASTING SETUP
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-100, -100);

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(machineGroup.children, true);
      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && obj.parent !== machineGroup) {
          obj = obj.parent;
        }
        if (obj.userData?.partKey) {
          setSelectedPartKey(obj.userData.partKey);
        }
      }
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("click", handleClick);

    // MOUSE DRAG ORBIT
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      if (e.button === 0) {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      machineGroup.rotation.y += deltaX * 0.008;
      machineGroup.rotation.x += deltaY * 0.008;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // ANIMATION LOOP
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth Spring interpolation for Dissection Factor
      const target = targetFactorRef.current;
      factorRef.current += (target - factorRef.current) * 0.08;
      const f = factorRef.current;

      // Update positions along X-axis
      Object.keys(partsMap).forEach((key) => {
        const item = partsMap[key];
        if (item?.group) {
          item.group.position.x = item.baseOffset + item.mult * f * 0.45;
        }
      });

      // Keep overall bounding center locked to middle of viewport
      machineGroup.position.x = -0.45 * f;

      // Fault Warning Pulse
      if (anomalyRef.current && faultGroupRef) {
        const pulse = 1.0 + Math.sin(elapsedTime * 6) * 0.6;
        faultGroupRef.traverse((child) => {
          if (child.isMesh && child.material !== faultMat) {
            child.material = faultMat;
          }
          if (child.isMesh) {
            faultMat.emissiveIntensity = pulse * 1.4;
          }
        });
      } else if (faultGroupRef) {
        faultGroupRef.traverse((child) => {
          if (child.isMesh && child.material === faultMat) {
            child.material = darkTitaniumMat;
          }
        });
      }

      // Raycast Hover detection
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(machineGroup.children, true);
      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && obj.parent !== machineGroup) {
          obj = obj.parent;
        }
        const key = obj.userData?.partKey;
        if (key && key !== hoveredPartRef.current) {
          setHoveredPartKey(key);
        }
      } else if (hoveredPartRef.current) {
        setHoveredPartKey(null);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("click", handleClick);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [machineType]);

  const activePartKey = hoveredPartKey || selectedPartKey;
  const activePart = partsData[activePartKey] || Object.values(partsData)[0];
  const isAnomalous = anomaly && activePart?.isFaultTrigger;

  return (
    <div
      style={{
        background: "#0c1720",
        color: "#fff",
        borderRadius: 12,
        border: "1px solid #1a354b",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top Controls Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 18px",
          background: "rgba(16,26,34,0.9)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: anomaly ? "#c94a4a" : "#2a7f8e",
              boxShadow: anomaly ? "0 0 12px #c94a4a" : "0 0 8px #2a7f8e",
            }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.04em" }}>
              {config.title} (STATIONARY 3D DISSECTION)
            </div>
            <div style={{ fontSize: 11, color: "#8ca2b0" }}>
              Hover over model to dissect into parts · Click components to inspect live sensor stats
            </div>
          </div>
        </div>

        {/* Action Toggles */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#9fb3c2", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={autoExplodeOnHover}
              onChange={(e) => setAutoExplodeOnHover(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            Auto-Dissect on Hover
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#7b93a4" }}>Dissection:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={manualFactor}
              onChange={(e) => {
                setManualFactor(parseFloat(e.target.value));
                setAutoExplodeOnHover(false);
              }}
              style={{ width: 85, cursor: "pointer" }}
            />
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1.8fr 1.2fr", minHeight: 440 }}>
        {/* WebGL 3D Canvas Mount */}
        <div
          ref={mountRef}
          onMouseEnter={() => setIsHoveredOverCanvas(true)}
          onMouseLeave={() => setIsHoveredOverCanvas(false)}
          style={{
            position: "relative",
            width: "100%",
            height: 440,
            cursor: "grab",
            background: "radial-gradient(circle at 50% 50%, #152b3c 0%, #0a1218 100%)",
          }}
        >
          {/* Hover Status Tag */}
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 14,
              background: "rgba(10,18,24,0.85)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              gap: 6,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isHoveredOverCanvas || manualFactor > 0.3 ? "#5eead4" : "#94a3b8",
              }}
            />
            <span>{isHoveredOverCanvas || manualFactor > 0.3 ? "3D Dissection: Expanded View" : `3D ${machineType}: Assembled View`}</span>
          </div>

          {/* Quick HUD badge */}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 14,
              background: "rgba(10,18,24,0.85)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 11,
              display: "flex",
              gap: 14,
              pointerEvents: "none",
            }}
            className="mono"
          >
            <div><span style={{ color: "#7b93a4" }}>MACHINE:</span> {machineType}</div>
            <div><span style={{ color: "#7b93a4" }}>TEMP:</span> <strong style={{ color: anomaly ? "#ffa4a4" : "#5eead4" }}>{anomaly ? "69.4°C" : "36.5°C"}</strong></div>
            <div><span style={{ color: "#7b93a4" }}>VIB:</span> <strong style={{ color: anomaly ? "#ffa4a4" : "#5eead4" }}>{anomaly ? "0.84 g" : "0.22 g"}</strong></div>
          </div>
        </div>

        {/* Live Diagnostics Inspector for Selected/Hovered 3D Part */}
        {activePart && (
          <div
            style={{
              background: "#0d1a24",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#2a7f8e", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {activePart.subsystem}
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, margin: "2px 0 0 0", color: "#fff" }}>
                    {activePart.name}
                  </h4>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 4,
                    textTransform: "uppercase",
                    background: isAnomalous ? "rgba(201,74,74,0.2)" : "rgba(46,125,91,0.2)",
                    color: isAnomalous ? "#ffa4a4" : "#6ee7b7",
                    border: `1px solid ${isAnomalous ? "#c94a4a" : "#2e7d5b"}`,
                  }}
                >
                  {activePart.status(anomaly)}
                </span>
              </div>

              <p style={{ fontSize: 12, color: "#9fb3c2", lineHeight: 1.5, margin: "0 0 16px 0" }}>
                {activePart.desc}
              </p>

              {/* Quick Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#8ca2b0", textTransform: "uppercase" }}>Health Index</div>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: isAnomalous ? "#c94a4a" : "#2e7d5b", marginTop: 2 }}>
                    {isAnomalous ? activePart.faultHealth : activePart.nominalHealth}%
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#8ca2b0", textTransform: "uppercase" }}>Vibration RMS</div>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: isAnomalous ? "#c94a4a" : "#5eead4", marginTop: 2 }}>
                    {activePart.vib(anomaly)}
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#8ca2b0", textTransform: "uppercase" }}>Surface Temp</div>
                  <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: isAnomalous ? "#c94a4a" : "#e2e8f0", marginTop: 2 }}>
                    {activePart.temp(anomaly)}
                  </div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#8ca2b0", textTransform: "uppercase" }}>Diagnostic State</div>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: isAnomalous ? "#ffa4a4" : "#5eead4", marginTop: 4 }}>
                    {isAnomalous ? "FAULT ALERT" : "NOMINAL"}
                  </div>
                </div>
              </div>

              {/* Subsystem quick list selector */}
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#7b93a4", textTransform: "uppercase", marginBottom: 6 }}>
                  Select 3D Component:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {Object.keys(partsData).map((k) => (
                    <button
                      key={k}
                      onClick={() => setSelectedPartKey(k)}
                      style={{
                        padding: "4px 8px",
                        fontSize: 10.5,
                        borderRadius: 4,
                        border: `1px solid ${selectedPartKey === k ? "#2a7f8e" : "rgba(255,255,255,0.1)"}`,
                        background: selectedPartKey === k ? "rgba(42,127,142,0.3)" : "rgba(255,255,255,0.03)",
                        color: selectedPartKey === k ? "#5eead4" : "#94a3b8",
                        cursor: "pointer",
                      }}
                    >
                      {partsData[k].name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Recommendation */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14, marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#8ca2b0", textTransform: "uppercase" }}>Recommended Action</div>
                <div style={{ fontSize: 11.5, color: "#e2e8f0", marginTop: 2 }}>{activePart.action(anomaly)}</div>
              </div>
              {isAnomalous && (
                <button
                  onClick={() => alert(`Work order generated for ${activePart.name} on ${asset?.id || "ASSET"}. Maintenance team alerted.`)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 6,
                    border: "none",
                    background: "#c94a4a",
                    color: "#fff",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: "0 4px 12px rgba(201,74,74,0.4)",
                  }}
                >
                  Dispatch Work Order
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
