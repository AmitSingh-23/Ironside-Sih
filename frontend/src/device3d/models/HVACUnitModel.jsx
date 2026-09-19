import React, { useMemo } from 'react';

export default function HVACUnitModel({ partMaterials = {}, onPartClick, onPartHover, onPartLeave }) {
  const handlePointerOver = (e, partKey) => {
    e.stopPropagation();
    if (onPartHover) onPartHover(partKey);
  };

  const handlePointerOut = (e, partKey) => {
    e.stopPropagation();
    if (onPartLeave) onPartLeave(partKey);
  };

  const handleClick = (e, partKey) => {
    e.stopPropagation();
    if (onPartClick) onPartClick(partKey);
  };

  // Default materials
  const defaultMaterials = {
    housing: <meshStandardMaterial color="#1d2c38" roughness={0.4} metalness={0.7} transparent opacity={0.25} />,
    brushedSteel: <meshStandardMaterial color="#bfd0dc" roughness={0.18} metalness={0.92} />,
    copper: <meshStandardMaterial color="#c86d3b" roughness={0.3} metalness={0.85} />,
    rubber: <meshStandardMaterial color="#151f28" roughness={0.85} metalness={0.15} />,
    tealAccent: <meshStandardMaterial color="#224858" roughness={0.35} metalness={0.55} />,
    laminatedCore: <meshStandardMaterial color="#334858" roughness={0.5} metalness={0.65} />,
  };

  // Helper to resolve material
  const resolveMaterial = (partKey, fallback) => {
    if (partMaterials[partKey]) {
      // If a material object is provided, we can pass it via primitive or directly if it's a JSX element.
      // Usually partMaterials is passed as an object of THREE.Material instances.
      return <primitive object={partMaterials[partKey]} attach="material" />;
    }
    return fallback;
  };

  return (
    <group position={[0, 0, 0]}>
      {/* Outer Cabinet Framing (Context) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[5.2, 3.2, 3.2]} />
        {defaultMaterials.housing}
      </mesh>

      <mesh position={[0, -1.6, 0]}>
        <boxGeometry args={[5.4, 0.2, 3.4]} />
        {defaultMaterials.brushedSteel}
      </mesh>

      {/* filter-bank */}
      <group
        name="filter-bank"
        position={[-2.4, 0, 0]}
        onPointerOver={(e) => handlePointerOver(e, 'filter-bank')}
        onPointerOut={(e) => handlePointerOut(e, 'filter-bank')}
        onClick={(e) => handleClick(e, 'filter-bank')}
      >
        {/* Frame */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.3, 2.8, 2.8]} />
          {resolveMaterial('filter-bank', defaultMaterials.brushedSteel)}
        </mesh>
        {/* Pleated filter ridges */}
        {Array.from({ length: 11 }).map((_, i) => (
          <mesh key={i} position={[0.05, 1.2 - i * 0.24, 0]}>
            <boxGeometry args={[0.22, 0.1, 2.6]} />
            {resolveMaterial('filter-bank', <meshStandardMaterial color="#eeeeee" roughness={0.9} />)}
          </mesh>
        ))}
      </group>

      {/* compressor */}
      <group
        name="compressor"
        position={[-1.0, -1.0, -0.6]}
        onPointerOver={(e) => handlePointerOver(e, 'compressor')}
        onPointerOut={(e) => handlePointerOut(e, 'compressor')}
        onClick={(e) => handleClick(e, 'compressor')}
      >
        {/* Base plate */}
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[1.2, 0.1, 1.2]} />
          {resolveMaterial('compressor', defaultMaterials.rubber)}
        </mesh>
        {/* Compressor body */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 1.5, 32]} />
          {resolveMaterial('compressor', defaultMaterials.tealAccent)}
        </mesh>
        {/* Top dome */}
        <mesh position={[0, 1.15, 0]}>
          <sphereGeometry args={[0.45, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          {resolveMaterial('compressor', defaultMaterials.tealAccent)}
        </mesh>
        {/* Connection pipes */}
        <mesh position={[0.3, 0.5, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.3, 16]} />
          {resolveMaterial('compressor', defaultMaterials.copper)}
        </mesh>
        <mesh position={[-0.3, 0.2, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.3, 16]} />
          {resolveMaterial('compressor', defaultMaterials.copper)}
        </mesh>
      </group>

      {/* condenser-coil */}
      <group
        name="condenser-coil"
        position={[-0.5, 0.1, 1.1]}
        onPointerOver={(e) => handlePointerOver(e, 'condenser-coil')}
        onPointerOut={(e) => handlePointerOut(e, 'condenser-coil')}
        onClick={(e) => handleClick(e, 'condenser-coil')}
      >
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.5, 2.5, 0.3]} />
          {resolveMaterial('condenser-coil', defaultMaterials.laminatedCore)}
        </mesh>
        {/* Fin details */}
        {Array.from({ length: 15 }).map((_, i) => (
          <mesh key={i} position={[-1.1 + i * 0.157, 0, 0.05]}>
            <boxGeometry args={[0.05, 2.4, 0.25]} />
            {resolveMaterial('condenser-coil', defaultMaterials.brushedSteel)}
          </mesh>
        ))}
      </group>

      {/* expansion-valve */}
      <group
        name="expansion-valve"
        position={[0.6, -1.2, 0.4]}
        onPointerOver={(e) => handlePointerOver(e, 'expansion-valve')}
        onPointerOut={(e) => handlePointerOut(e, 'expansion-valve')}
        onClick={(e) => handleClick(e, 'expansion-valve')}
      >
        {/* Valve body */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.3, 16]} />
          {resolveMaterial('expansion-valve', <meshStandardMaterial color="#b08040" roughness={0.35} metalness={0.8} />)}
        </mesh>
        {/* Valve actuator / cap */}
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
          {resolveMaterial('expansion-valve', defaultMaterials.brushedSteel)}
        </mesh>
        {/* Piping */}
        <mesh position={[-0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 16]} />
          {resolveMaterial('expansion-valve', defaultMaterials.copper)}
        </mesh>
        <mesh position={[0.2, -0.1, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 16]} />
          {resolveMaterial('expansion-valve', defaultMaterials.copper)}
        </mesh>
      </group>

      {/* blower-wheel */}
      <group
        name="blower-wheel"
        position={[1.5, 0.2, -0.2]}
        onPointerOver={(e) => handlePointerOver(e, 'blower-wheel')}
        onPointerOut={(e) => handlePointerOut(e, 'blower-wheel')}
        onClick={(e) => handleClick(e, 'blower-wheel')}
      >
        {/* Blower housing sides */}
        <mesh position={[0, 0, 0.6]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.05, 32]} />
          {resolveMaterial('blower-wheel', defaultMaterials.brushedSteel)}
        </mesh>
        <mesh position={[0, 0, -0.6]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.05, 32]} />
          {resolveMaterial('blower-wheel', defaultMaterials.brushedSteel)}
        </mesh>
        {/* Blower housing wrap */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 1.2, 32, 1, true, 0, Math.PI * 1.5]} />
          {resolveMaterial('blower-wheel', defaultMaterials.brushedSteel)}
        </mesh>
        <mesh position={[0.6, -1.2, 0]}>
          <boxGeometry args={[1.2, 0.05, 1.2]} />
          {resolveMaterial('blower-wheel', defaultMaterials.brushedSteel)}
        </mesh>

        {/* Centrifugal fan / wheel */}
        <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 1.0, 32]} />
          {resolveMaterial('blower-wheel', defaultMaterials.tealAccent)}
        </mesh>
        {/* Fan blades */}
        {Array.from({ length: 16 }).map((_, i) => (
          <mesh key={i} position={[0, -0.1, 0]} rotation={[Math.PI / 2, i * (Math.PI / 8), 0]}>
            <boxGeometry args={[0.1, 1.0, 1.6]} />
            {resolveMaterial('blower-wheel', defaultMaterials.laminatedCore)}
          </mesh>
        ))}
      </group>
    </group>
  );
}
