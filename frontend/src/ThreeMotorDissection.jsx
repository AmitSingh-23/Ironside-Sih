import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const PART_DATA = {
  "front-shield": {
    name: "Front Drive-End Shield",
    subsystem: "Housing & Structure",
    desc: "Cast iron end-bell with machined bearing seating and labyrinth seal.",
    nominalHealth: 98,
    faultHealth: 98,
    temp: (a) => "35.2°C",
    vib: (a) => "0.18 g",
    status: (a) => "healthy",
    action: (a) => "Inspect mounting bolts during next scheduled PM.",
  },
  "front-bearing": {
    name: "Front Deep Groove Ball Bearing (6308-2Z)",
    subsystem: "Bearing System",
    desc: "High-precision ball bearing handling drive-end radial load and shaft centering.",
    nominalHealth: 96,
    faultHealth: 22,
    temp: (a) => (a ? "69.4°C" : "36.5°C"),
    vib: (a) => (a ? "0.84 g" : "0.22 g"),
    status: (a) => (a ? "critical" : "healthy"),
    isFaultTrigger: true,
    action: (a) => (a ? "URGENT: Replace bearing assembly. Outer ring spalling detected." : "Relubricate at next 500h interval."),
  },
  "stator-frame": {
    name: "Cast Iron Stator Housing & Fins",
    subsystem: "Housing & Stator",
    desc: "Heavy-duty finned enclosure with integrated terminal box and mounting feet.",
    nominalHealth: 95,
    faultHealth: 92,
    temp: (a) => (a ? "51.0°C" : "41.2°C"),
    vib: (a) => "0.20 g",
    status: (a) => "healthy",
    action: (a) => "Verify cooling fin clearance and clean debris.",
  },
  "stator-core": {
    name: "Laminated Silicon Steel Core",
    subsystem: "Electromagnetic Core",
    desc: "Low-loss magnetic core containing axial slots for 3-phase windings.",
    nominalHealth: 94,
    faultHealth: 76,
    temp: (a) => (a ? "54.8°C" : "42.0°C"),
    vib: (a) => (a ? "0.33 g" : "0.21 g"),
    status: (a) => (a ? "attention" : "healthy"),
    action: (a) => "Thermographic survey to check eddy current losses.",
  },
  "copper-windings": {
    name: "Copper Stator Windings (Class H)",
    subsystem: "Electromagnetic Core",
    desc: "Enameled copper coils vacuum-impregnated with high-temperature epoxy.",
    nominalHealth: 95,
    faultHealth: 68,
    temp: (a) => (a ? "61.2°C" : "40.0°C"),
    vib: (a) => (a ? "0.36 g" : "0.19 g"),
    status: (a) => (a ? "attention" : "healthy"),
    action: (a) => "Surge and insulation resistance megger testing.",
  },
  "rotor-core": {
    name: "Squirrel Cage Rotor & Bars",
    subsystem: "Rotating Assembly",
    desc: "Die-cast aluminum bar rotor with short-circuit end rings dynamically balanced to ISO G2.5.",
    nominalHealth: 93,
    faultHealth: 81,
    temp: (a) => (a ? "48.0°C" : "38.5°C"),
    vib: (a) => (a ? "0.42 g" : "0.21 g"),
    status: (a) => (a ? "attention" : "healthy"),
    action: (a) => "Verify rotor balance during bearing changeover.",
  },
  "drive-shaft": {
    name: "Precision Alloy Drive Shaft",
    subsystem: "Rotating Assembly",
    desc: "High-tensile forged steel shaft transmitting torque to driven equipment.",
    nominalHealth: 97,
    faultHealth: 94,
    temp: (a) => "37.0°C",
    vib: (a) => (a ? "0.28 g" : "0.23 g"),
    status: (a) => "healthy",
    action: (a) => "Laser alignment inspection with coupled load.",
  },
  "rear-bearing": {
    name: "Rear Bearing & Shield (6208)",
    subsystem: "Bearing System",
    desc: "Non-drive end support bearing with internal preload wave spring.",
    nominalHealth: 94,
    faultHealth: 88,
    temp: (a) => (a ? "39.5°C" : "36.0°C"),
    vib: (a) => "0.24 g",
    status: (a) => "healthy",
    action: (a) => "Normal lubrication cycle.",
  },
  "cooling-fan": {
    name: "Bi-directional Cooling Fan",
    subsystem: "Cooling Subsystem",
    desc: "Aerodynamic nylon impeller forcing airflow across external stator fins.",
    nominalHealth: 99,
    faultHealth: 99,
    temp: (a) => "31.0°C",
    vib: (a) => "0.15 g",
    status: (a) => "healthy",
    action: (a) => "Inspect fan blades for physical damage.",
  },
  "fan-cowl": {
    name: "Sheet Steel Fan Cowl & Guard",
    subsystem: "Cooling Subsystem",
    desc: "Protective cowl directing cooling airflow and preventing foreign object ingress.",
    nominalHealth: 99,
    faultHealth: 99,
    temp: (a) => "30.5°C",
    vib: (a) => "0.12 g",
    status: (a) => "healthy",
    action: (a) => "Keep ventilation mesh unobstructed.",
  },
};

export default function ThreeMotorDissection({
  anomaly = false,
  asset = null,
  compact = false,
}) {
  const mountRef = useRef(null);
  const [selectedPartKey, setSelectedPartKey] = useState(
    anomaly ? "front-bearing" : "front-bearing"
  );
  const [hoveredPartKey, setHoveredPartKey] = useState(null);
  const [isHoveredOverCanvas, setIsHoveredOverCanvas] = useState(false);
  const [autoExplodeOnHover, setAutoExplodeOnHover] = useState(true);
  const [manualFactor, setManualFactor] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  const factorRef = useRef(0);
  const targetFactorRef = useRef(0);
  const anomalyRef = useRef(anomaly);
  const hoveredPartRef = useRef(null);
  const selectedPartRef = useRef("front-bearing");

  useEffect(() => {
    anomalyRef.current = anomaly;
    if (anomaly) {
      setSelectedPartKey("front-bearing");
      selectedPartRef.current = "front-bearing";
    }
  }, [anomaly]);

  useEffect(() => {
    selectedPartRef.current = selectedPartKey;
  }, [selectedPartKey]);

  useEffect(() => {
    hoveredPartRef.current = hoveredPartKey;
  }, [hoveredPartKey]);

  // Update target factor when hover or manual slider changes
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

    // SCENE, CAMERA, RENDERER
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1218);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 11.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x70d6ff, 2.4);
    dirLight1.position.set(6, 10, 8);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x2a7f8e, 1.8);
    dirLight2.position.set(-8, -2, -6);
    scene.add(dirLight2);

    const rimLight = new THREE.PointLight(0x00f5d4, 2.0, 30);
    rimLight.position.set(0, 4, -5);
    scene.add(rimLight);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(20, 20, 0x1e3a4c, 0x112330);
    gridHelper.position.y = -2.1;
    scene.add(gridHelper);

    // 3D MOTOR ASSEMBLY GROUP
    const motorGroup = new THREE.Group();
    scene.add(motorGroup);

    // Materials
    const castIronMat = new THREE.MeshStandardMaterial({
      color: 0x223a4d,
      roughness: 0.45,
      metalness: 0.65,
    });

    const polishedSteelMat = new THREE.MeshStandardMaterial({
      color: 0xd6e2ea,
      roughness: 0.18,
      metalness: 0.92,
    });

    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xc86d3b,
      roughness: 0.3,
      metalness: 0.85,
    });

    const rotorCoreMat = new THREE.MeshStandardMaterial({
      color: 0x3d5466,
      roughness: 0.45,
      metalness: 0.7,
    });

    const tealAccentMat = new THREE.MeshStandardMaterial({
      color: 0x2a7f8e,
      roughness: 0.3,
      metalness: 0.5,
    });

    const darkAlloyMat = new THREE.MeshStandardMaterial({
      color: 0x172836,
      roughness: 0.55,
      metalness: 0.7,
    });

    const faultMat = new THREE.MeshStandardMaterial({
      color: 0xc94a4a,
      emissive: 0xff2222,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.8,
    });

    // Object map for explosion offsets
    const partsMap = {};

    // 1. STATOR HOUSING & FINS (Base anchor X = 0, length = 2.6)
    const statorGroup = new THREE.Group();
    statorGroup.userData = { partKey: "stator-frame" };

    // Outer cylindrical frame
    const frameGeo = new THREE.CylinderGeometry(1.65, 1.65, 2.6, 32, 1, true);
    frameGeo.rotateZ(Math.PI / 2);
    const frameMesh = new THREE.Mesh(frameGeo, castIronMat);
    statorGroup.add(frameMesh);

    // Radial Cooling Fins
    const finCount = 12;
    for (let i = 0; i < finCount; i++) {
      const angle = (i / finCount) * Math.PI * 2;
      const finGeo = new THREE.BoxGeometry(2.5, 0.32, 0.08);
      const fin = new THREE.Mesh(finGeo, castIronMat);
      fin.position.set(0, Math.cos(angle) * 1.72, Math.sin(angle) * 1.72);
      fin.rotation.x = -angle;
      statorGroup.add(fin);
    }

    // Top Junction Box
    const jBoxGeo = new THREE.BoxGeometry(0.9, 0.55, 0.85);
    const jBox = new THREE.Mesh(jBoxGeo, castIronMat);
    jBox.position.set(0, 1.95, 0);
    statorGroup.add(jBox);

    const jLidGeo = new THREE.BoxGeometry(1.0, 0.1, 0.95);
    const jLid = new THREE.Mesh(jLidGeo, tealAccentMat);
    jLid.position.set(0, 2.25, 0);
    statorGroup.add(jLid);

    // Bottom Mounting Feet
    const foot1Geo = new THREE.BoxGeometry(2.2, 0.2, 0.65);
    const foot1 = new THREE.Mesh(foot1Geo, darkAlloyMat);
    foot1.position.set(0, -1.75, 1.05);
    statorGroup.add(foot1);

    const foot2 = foot1.clone();
    foot2.position.set(0, -1.75, -1.05);
    statorGroup.add(foot2);

    motorGroup.add(statorGroup);
    partsMap["stator-frame"] = { group: statorGroup, baseOffset: 0, mult: 0 };

    // 2. STATOR CORE (Inside frame at X = 0)
    const statorCoreGroup = new THREE.Group();
    statorCoreGroup.userData = { partKey: "stator-core" };
    const coreGeo = new THREE.CylinderGeometry(1.5, 1.5, 2.2, 28);
    coreGeo.rotateZ(Math.PI / 2);
    const coreMesh = new THREE.Mesh(coreGeo, rotorCoreMat);
    statorCoreGroup.add(coreMesh);
    motorGroup.add(statorCoreGroup);
    partsMap["stator-core"] = { group: statorCoreGroup, baseOffset: 0, mult: 0 };

    // 3. COPPER WINDINGS (Flush at ends of stator core)
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

    motorGroup.add(windingsGroup);
    partsMap["copper-windings"] = { group: windingsGroup, baseOffset: 0, mult: 0 };

    // 4. ROTOR ASSEMBLY (Slides right when exploded)
    const rotorGroup = new THREE.Group();
    rotorGroup.userData = { partKey: "rotor-core" };
    const rotorGeo = new THREE.CylinderGeometry(0.92, 0.92, 1.95, 24);
    rotorGeo.rotateZ(Math.PI / 2);
    const rotorMesh = new THREE.Mesh(rotorGeo, rotorCoreMat);
    rotorGroup.add(rotorMesh);

    // Aluminum rotor bars
    for (let b = 0; b < 12; b++) {
      const bAngle = (b / 12) * Math.PI * 2;
      const barGeo = new THREE.BoxGeometry(1.9, 0.07, 0.07);
      const bar = new THREE.Mesh(barGeo, polishedSteelMat);
      bar.position.set(0, Math.cos(bAngle) * 0.91, Math.sin(bAngle) * 0.91);
      rotorGroup.add(bar);
    }
    motorGroup.add(rotorGroup);
    partsMap["rotor-core"] = { group: rotorGroup, baseOffset: 0, mult: 1.4 };

    // 5. DRIVE SHAFT
    const shaftGroup = new THREE.Group();
    shaftGroup.userData = { partKey: "drive-shaft" };
    const shaftGeo = new THREE.CylinderGeometry(0.3, 0.3, 5.4, 24);
    shaftGeo.rotateZ(Math.PI / 2);
    const shaftMesh = new THREE.Mesh(shaftGeo, polishedSteelMat);
    shaftMesh.position.set(-0.25, 0, 0);
    shaftGroup.add(shaftMesh);

    // Keyway notch
    const keywayGeo = new THREE.BoxGeometry(0.7, 0.1, 0.1);
    const keyway = new THREE.Mesh(keywayGeo, darkAlloyMat);
    keyway.position.set(-2.4, 0.25, 0);
    shaftGroup.add(keyway);

    motorGroup.add(shaftGroup);
    partsMap["drive-shaft"] = { group: shaftGroup, baseOffset: 0, mult: 2.2 };

    // 6. FRONT BEARING (Inside front end shield at X = -1.35)
    const frontBearingGroup = new THREE.Group();
    frontBearingGroup.userData = { partKey: "front-bearing" };

    const outerRingGeo = new THREE.TorusGeometry(0.62, 0.12, 16, 28);
    outerRingGeo.rotateY(Math.PI / 2);
    const outerRing = new THREE.Mesh(outerRingGeo, polishedSteelMat);
    frontBearingGroup.add(outerRing);

    for (let i = 0; i < 8; i++) {
      const bAngle = (i / 8) * Math.PI * 2;
      const ballGeo = new THREE.SphereGeometry(0.1, 12, 12);
      const ball = new THREE.Mesh(ballGeo, polishedSteelMat);
      ball.position.set(0, Math.cos(bAngle) * 0.62, Math.sin(bAngle) * 0.62);
      frontBearingGroup.add(ball);
    }
    frontBearingGroup.position.set(-1.35, 0, 0);
    motorGroup.add(frontBearingGroup);
    partsMap["front-bearing"] = { group: frontBearingGroup, baseOffset: -1.35, mult: -2.0 };

    // 7. FRONT END SHIELD (Flush against front flange at X = -1.45)
    const frontShieldGroup = new THREE.Group();
    frontShieldGroup.userData = { partKey: "front-shield" };
    const fShieldGeo = new THREE.CylinderGeometry(1.68, 1.68, 0.3, 32);
    fShieldGeo.rotateZ(Math.PI / 2);
    const fShieldMesh = new THREE.Mesh(fShieldGeo, castIronMat);
    frontShieldGroup.add(fShieldMesh);

    // Flange ribs
    for (let r = 0; r < 6; r++) {
      const rAngle = (r / 6) * Math.PI * 2;
      const ribGeo = new THREE.BoxGeometry(0.28, 1.1, 0.08);
      const rib = new THREE.Mesh(ribGeo, castIronMat);
      rib.position.set(0.08, Math.cos(rAngle) * 0.72, Math.sin(rAngle) * 0.72);
      rib.rotation.x = -rAngle;
      frontShieldGroup.add(rib);
    }
    frontShieldGroup.position.set(-1.45, 0, 0);
    motorGroup.add(frontShieldGroup);
    partsMap["front-shield"] = { group: frontShieldGroup, baseOffset: -1.45, mult: -3.4 };

    // 8. REAR BEARING (At X = 1.35)
    const rearBearingGroup = frontBearingGroup.clone();
    rearBearingGroup.userData = { partKey: "rear-bearing" };
    rearBearingGroup.position.set(1.35, 0, 0);
    motorGroup.add(rearBearingGroup);
    partsMap["rear-bearing"] = { group: rearBearingGroup, baseOffset: 1.35, mult: 2.4 };

    // 9. REAR END SHIELD (Flush against rear flange at X = 1.45)
    const rearShieldGroup = new THREE.Group();
    rearShieldGroup.userData = { partKey: "rear-shield-bearing" };
    const rShieldGeo = new THREE.CylinderGeometry(1.68, 1.68, 0.28, 32);
    rShieldGeo.rotateZ(Math.PI / 2);
    const rShieldMesh = new THREE.Mesh(rShieldGeo, castIronMat);
    rearShieldGroup.add(rShieldMesh);
    rearShieldGroup.position.set(1.45, 0, 0);
    motorGroup.add(rearShieldGroup);
    partsMap["rear-shield-bearing"] = { group: rearShieldGroup, baseOffset: 1.45, mult: 3.4 };

    // 10. COOLING FAN (At X = 1.78)
    const fanGroup = new THREE.Group();
    fanGroup.userData = { partKey: "cooling-fan" };
    const fanHubGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.22, 16);
    fanHubGeo.rotateZ(Math.PI / 2);
    const fanHub = new THREE.Mesh(fanHubGeo, tealAccentMat);
    fanGroup.add(fanHub);

    for (let f = 0; f < 8; f++) {
      const fAngle = (f / 8) * Math.PI * 2;
      const bladeGeo = new THREE.BoxGeometry(0.18, 0.8, 0.08);
      const blade = new THREE.Mesh(bladeGeo, tealAccentMat);
      blade.position.set(0, Math.cos(fAngle) * 0.8, Math.sin(fAngle) * 0.8);
      blade.rotation.x = -fAngle + 0.35;
      fanGroup.add(blade);
    }
    fanGroup.position.set(1.78, 0, 0);
    motorGroup.add(fanGroup);
    partsMap["cooling-fan"] = { group: fanGroup, baseOffset: 1.78, mult: 4.6 };

    // 11. FAN COWL / COVER (At X = 1.95)
    const cowlGroup = new THREE.Group();
    cowlGroup.userData = { partKey: "fan-cowl" };
    const cowlGeo = new THREE.CylinderGeometry(1.7, 1.7, 0.85, 32, 1, true);
    cowlGeo.rotateZ(Math.PI / 2);
    const cowlMesh = new THREE.Mesh(cowlGeo, darkAlloyMat);
    cowlGroup.add(cowlMesh);

    const cowlEndGeo = new THREE.CircleGeometry(1.7, 32);
    cowlEndGeo.rotateY(Math.PI / 2);
    const cowlEnd = new THREE.Mesh(cowlEndGeo, darkAlloyMat);
    cowlEnd.position.set(0.42, 0, 0);
    cowlGroup.add(cowlEnd);

    cowlGroup.position.set(1.95, 0, 0);
    motorGroup.add(cowlGroup);
    partsMap["fan-cowl"] = { group: cowlGroup, baseOffset: 1.95, mult: 5.8 };

    // Set initial stationary view angle
    motorGroup.rotation.y = 0.42;
    motorGroup.rotation.x = 0.16;

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
      const intersects = raycaster.intersectObjects(motorGroup.children, true);
      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && obj.parent !== motorGroup) {
          obj = obj.parent;
        }
        if (obj.userData?.partKey) {
          setSelectedPartKey(obj.userData.partKey);
        }
      }
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("click", handleClick);

    // ORBIT CONTROLS VIA MOUSE DRAG
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

      motorGroup.rotation.y += deltaX * 0.008;
      motorGroup.rotation.x += deltaY * 0.008;

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

      // Update positions of all component meshes along X-axis
      Object.keys(partsMap).forEach((key) => {
        const item = partsMap[key];
        if (item?.group) {
          item.group.position.x = item.baseOffset + item.mult * f * 0.45;
        }
      });

      // Keep overall exploded bounding center locked to middle of viewport
      motorGroup.position.x = -0.45 * f;

      // Slow continuous rotation when idle
      if (!isDragging && isRotating) {
        motorGroup.rotation.y += 0.003;
      }

      // Bearing Anomaly Warning Pulse
      if (anomalyRef.current) {
        const pulse = 1.0 + Math.sin(elapsedTime * 6) * 0.6;
        frontBearingGroup.traverse((child) => {
          if (child.isMesh) {
            child.material = faultMat;
            faultMat.emissiveIntensity = pulse * 1.5;
          }
        });
      } else {
        frontBearingGroup.traverse((child) => {
          if (child.isMesh && child.material === faultMat) {
            child.material = polishedSteelMat;
          }
        });
      }

      // Raycast Hover detection
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(motorGroup.children, true);
      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && obj.parent !== motorGroup) {
          obj = obj.parent;
        }
        const key = obj.userData?.partKey;
        if (key && key !== hoveredPartRef.current) {
          setHoveredPartKey(key);
        }
      } else if (hoveredPartRef.current) {
        setHoveredPartKey(null);
      }

      // Continuous fan blade spinning
      fanGroup.rotation.x += 0.04;

      renderer.render(scene, camera);
    };

    animate();

    // RESIZE HANDLER
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
  }, []);

  const activePartKey = hoveredPartKey || selectedPartKey;
  const activePart = PART_DATA[activePartKey] || PART_DATA["front-bearing"];
  const isAnomalous = anomaly && activePart.isFaultTrigger;

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
              INTERACTIVE 3D EXPLODING MOTOR (WEBGL)
            </div>
            <div style={{ fontSize: 11, color: "#8ca2b0" }}>
              Hover over 3D model to dissect · Click & drag to rotate · Click components to inspect
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

          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#9fb3c2", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isRotating}
              onChange={(e) => setIsRotating(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            Slow Rotate
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
            <span>{isHoveredOverCanvas || manualFactor > 0.3 ? "3D Dissection: Expanded View" : "3D Motor: Compact Assembled View"}</span>
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
            <div><span style={{ color: "#7b93a4" }}>SPEED:</span> 1420 RPM</div>
            <div><span style={{ color: "#7b93a4" }}>TEMP:</span> <strong style={{ color: anomaly ? "#ffa4a4" : "#5eead4" }}>{anomaly ? "69.4°C" : "36.5°C"}</strong></div>
            <div><span style={{ color: "#7b93a4" }}>VIB:</span> <strong style={{ color: anomaly ? "#ffa4a4" : "#5eead4" }}>{anomaly ? "0.84 g" : "0.22 g"}</strong></div>
          </div>
        </div>

        {/* Live Diagnostics Inspector for Selected/Hovered 3D Part */}
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
                  {isAnomalous ? "BEARING FAULT" : "NOMINAL"}
                </div>
              </div>
            </div>

            {/* Subsystem quick list selector */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#7b93a4", textTransform: "uppercase", marginBottom: 6 }}>
                Select Part to Focus in 3D:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {Object.keys(PART_DATA).map((k) => (
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
                    {PART_DATA[k].name.split(" ")[0]}
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
                onClick={() => alert(`Work order generated for ${activePart.name}. Maintenance team alerted.`)}
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
      </div>
    </div>
  );
}
