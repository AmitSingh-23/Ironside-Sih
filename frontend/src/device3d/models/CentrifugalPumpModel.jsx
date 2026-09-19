import React, { useMemo } from 'react';

export default function CentrifugalPumpModel({
  partMaterials = {},
  onPartClick,
  onPartHover,
  onPartLeave
}) {
  // Default materials based on the provided color scheme
  const defaultMaterials = useMemo(() => ({
    'suction-flange': <meshStandardMaterial color="#1d2c38" roughness={0.4} metalness={0.7} />,
    'volute-casing': <meshStandardMaterial color="#1d2c38" roughness={0.4} metalness={0.7} />,
    'impeller': <meshStandardMaterial color="#b08040" roughness={0.35} metalness={0.8} />,
    'mechanical-seal': <meshStandardMaterial color="#bfd0dc" roughness={0.18} metalness={0.92} />,
    'pump-shaft': <meshStandardMaterial color="#bfd0dc" roughness={0.18} metalness={0.92} />,
    'bearing-frame': <meshStandardMaterial color="#224858" roughness={0.35} metalness={0.55} />
  }), []);

  const getMaterial = (partKey) => partMaterials[partKey] || defaultMaterials[partKey];

  const handleEvent = (handler, partKey) => (e) => {
    if (handler) {
      e.stopPropagation();
      handler(partKey);
    }
  };

  return (
    <group position={[0, 0, 0]} dispose={null}>
      
      {/* 1. SUCTION FLANGE */}
      <group
        name="suction-flange"
        onClick={handleEvent(onPartClick, 'suction-flange')}
        onPointerOver={handleEvent(onPartHover, 'suction-flange')}
        onPointerOut={handleEvent(onPartLeave, 'suction-flange')}
      >
        {/* Suction Pipe */}
        <mesh position={[1.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.6, 0.6, 1.0, 32]} />
          {getMaterial('suction-flange')}
        </mesh>
        {/* Flange Disc */}
        <mesh position={[1.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1.0, 1.0, 0.15, 32]} />
          {getMaterial('suction-flange')}
        </mesh>
        {/* Flange opening (inner dark hole for realism) */}
        <mesh position={[1.68, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.45, 0.45, 0.02, 32]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      </group>

      {/* 2. VOLUTE CASING */}
      <group
        name="volute-casing"
        onClick={handleEvent(onPartClick, 'volute-casing')}
        onPointerOver={handleEvent(onPartHover, 'volute-casing')}
        onPointerOut={handleEvent(onPartLeave, 'volute-casing')}
      >
        {/* Main snail-shell body */}
        <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1.5, 1.5, 0.8, 32]} />
          {getMaterial('volute-casing')}
        </mesh>
        {/* Backplate of the casing */}
        <mesh position={[-0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1.2, 1.2, 0.2, 32]} />
          {getMaterial('volute-casing')}
        </mesh>
        {/* Discharge Nozzle (pointing up along Y axis) */}
        <mesh position={[0.2, 1.2, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 1.5, 32]} />
          {getMaterial('volute-casing')}
        </mesh>
        {/* Discharge Flange */}
        <mesh position={[0.2, 1.9, 0]}>
          <cylinderGeometry args={[0.9, 0.9, 0.1, 32]} />
          {getMaterial('volute-casing')}
        </mesh>
        {/* Discharge opening */}
        <mesh position={[0.2, 1.96, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.02, 32]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      </group>

      {/* 3. IMPELLER */}
      <group
        name="impeller"
        onClick={handleEvent(onPartClick, 'impeller')}
        onPointerOver={handleEvent(onPartHover, 'impeller')}
        onPointerOut={handleEvent(onPartLeave, 'impeller')}
      >
        {/* Impeller Backplate */}
        <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1.2, 1.2, 0.1, 32]} />
          {getMaterial('impeller')}
        </mesh>
        {/* Impeller Hub */}
        <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.25, 0.3, 32]} />
          {getMaterial('impeller')}
        </mesh>
        {/* Radial Vanes */}
        {[...Array(6)].map((_, i) => (
          <group key={`vane-${i}`} rotation={[i * (Math.PI / 3), 0, 0]}>
            <mesh position={[0.15, 0.7, 0]}>
              <boxGeometry args={[0.1, 1.0, 0.05]} />
              {getMaterial('impeller')}
            </mesh>
          </group>
        ))}
      </group>

      {/* 4. MECHANICAL SEAL */}
      <group
        name="mechanical-seal"
        onClick={handleEvent(onPartClick, 'mechanical-seal')}
        onPointerOver={handleEvent(onPartHover, 'mechanical-seal')}
        onPointerOut={handleEvent(onPartLeave, 'mechanical-seal')}
      >
        {/* Seal Cartridge */}
        <mesh position={[-0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.45, 0.45, 0.3, 32]} />
          {getMaterial('mechanical-seal')}
        </mesh>
        {/* Gland Plate */}
        <mesh position={[-0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.6, 0.6, 0.1, 32]} />
          {getMaterial('mechanical-seal')}
        </mesh>
      </group>

      {/* 5. BEARING FRAME */}
      <group
        name="bearing-frame"
        onClick={handleEvent(onPartClick, 'bearing-frame')}
        onPointerOver={handleEvent(onPartHover, 'bearing-frame')}
        onPointerOut={handleEvent(onPartLeave, 'bearing-frame')}
      >
        {/* Main Pedestal Housing */}
        <mesh position={[-1.4, 0, 0]}>
          <boxGeometry args={[1.6, 1.2, 1.2]} />
          {getMaterial('bearing-frame')}
        </mesh>
        {/* Top cover/cooling fins detail */}
        <mesh position={[-1.4, 0.65, 0]}>
          <boxGeometry args={[1.4, 0.1, 1.0]} />
          {getMaterial('bearing-frame')}
        </mesh>
        {/* Inboard Bearing Housing */}
        <mesh position={[-0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.2, 32]} />
          {getMaterial('bearing-frame')}
        </mesh>
        {/* Outboard Bearing Housing */}
        <mesh position={[-2.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.2, 32]} />
          {getMaterial('bearing-frame')}
        </mesh>
        {/* Pedestal Base / Feet */}
        <mesh position={[-1.4, -0.65, 0]}>
          <boxGeometry args={[1.6, 0.2, 1.6]} />
          {getMaterial('bearing-frame')}
        </mesh>
      </group>

      {/* 6. PUMP SHAFT */}
      <group
        name="pump-shaft"
        onClick={handleEvent(onPartClick, 'pump-shaft')}
        onPointerOver={handleEvent(onPartHover, 'pump-shaft')}
        onPointerOut={handleEvent(onPartLeave, 'pump-shaft')}
      >
        {/* Full shaft spanning the machine */}
        <mesh position={[-1.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 4.0, 32]} />
          {getMaterial('pump-shaft')}
        </mesh>
        {/* Keyway indication at the drive end (coupling side) */}
        <mesh position={[-2.8, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.6, 0.1, 0.1]} />
          <meshStandardMaterial color="#000000" roughness={0.5} />
        </mesh>
      </group>

    </group>
  );
}
