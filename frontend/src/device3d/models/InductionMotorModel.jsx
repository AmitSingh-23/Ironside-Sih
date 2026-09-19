import React, { useMemo } from 'react';

export default function InductionMotorModel({
  partMaterials = {},
  onPartClick,
  onPartHover,
  onPartLeave
}) {
  const getInteractionProps = (partKey) => ({
    onClick: (e) => {
      e.stopPropagation();
      onPartClick?.(partKey);
    },
    onPointerOver: (e) => {
      e.stopPropagation();
      onPartHover?.(partKey);
    },
    onPointerOut: (e) => {
      e.stopPropagation();
      onPartLeave?.(partKey);
    },
  });

  const getMaterial = (partKey, defaultProps) => {
    if (partMaterials[partKey]) {
      return <primitive object={partMaterials[partKey]} attach="material" />;
    }
    return <meshStandardMaterial {...defaultProps} />;
  };

  // Default materials
  const matHousing = { color: '#1d2c38', roughness: 0.4, metalness: 0.7 };
  const matSteel = { color: '#bfd0dc', roughness: 0.18, metalness: 0.92 };
  const matCopper = { color: '#c86d3b', roughness: 0.3, metalness: 0.85 };
  const matLaminated = { color: '#334858', roughness: 0.5, metalness: 0.65 };
  
  // Stator fins
  const fins = useMemo(() => {
    const finArray = [];
    const numFins = 24;
    for (let i = 0; i < numFins; i++) {
      const angle = (i / numFins) * Math.PI * 2;
      if (angle > Math.PI / 4 && angle < (3 * Math.PI) / 4) continue; // Leave top clear for terminal box
      finArray.push(
        <mesh key={`fin-${i}`} rotation-x={angle} position={[0, 0, 0]}>
          <boxGeometry args={[4, 0.1, 3.4]} />
          {getMaterial('stator-frame', matHousing)}
        </mesh>
      );
    }
    return finArray;
  }, [partMaterials]);

  return (
    <group>
      {/* stator-frame */}
      <group name="stator-frame" {...getInteractionProps('stator-frame')}>
        {/* Main body */}
        <mesh rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[1.5, 1.5, 4, 32]} />
          {getMaterial('stator-frame', matHousing)}
        </mesh>
        
        {/* Fins */}
        {fins}

        {/* Terminal Box */}
        <group position={[0, 1.7, 0]}>
          <mesh>
            <boxGeometry args={[1.2, 0.6, 1.2]} />
            {getMaterial('stator-frame', matHousing)}
          </mesh>
          {/* Box lid */}
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[1.3, 0.1, 1.3]} />
            {getMaterial('stator-frame', matHousing)}
          </mesh>
        </group>

        {/* Feet */}
        <mesh position={[-1.2, -1.6, 0]}>
          <boxGeometry args={[1, 0.2, 2.5]} />
          {getMaterial('stator-frame', matHousing)}
        </mesh>
        <mesh position={[1.2, -1.6, 0]}>
          <boxGeometry args={[1, 0.2, 2.5]} />
          {getMaterial('stator-frame', matHousing)}
        </mesh>
      </group>

      {/* stator-core */}
      <group name="stator-core" {...getInteractionProps('stator-core')}>
        <mesh rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[1.2, 1.2, 3.9, 32]} />
          {getMaterial('stator-core', matLaminated)}
        </mesh>
      </group>

      {/* copper-windings */}
      <group name="copper-windings" {...getInteractionProps('copper-windings')}>
        <mesh position={[2.0, 0, 0]} rotation-y={Math.PI / 2}>
          <torusGeometry args={[0.9, 0.3, 16, 32]} />
          {getMaterial('copper-windings', matCopper)}
        </mesh>
        <mesh position={[-2.0, 0, 0]} rotation-y={Math.PI / 2}>
          <torusGeometry args={[0.9, 0.3, 16, 32]} />
          {getMaterial('copper-windings', matCopper)}
        </mesh>
      </group>

      {/* rotor-core */}
      <group name="rotor-core" {...getInteractionProps('rotor-core')}>
        <mesh rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.8, 0.8, 4.1, 32]} />
          {getMaterial('rotor-core', matLaminated)}
        </mesh>
      </group>

      {/* drive-shaft */}
      <group name="drive-shaft" {...getInteractionProps('drive-shaft')}>
        <mesh rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.3, 0.3, 8.5, 32]} />
          {getMaterial('drive-shaft', matSteel)}
        </mesh>
        {/* Keyway */}
        <mesh position={[3.5, 0.3, 0]}>
          <boxGeometry args={[1, 0.1, 0.1]} />
          {getMaterial('drive-shaft', matSteel)}
        </mesh>
      </group>

      {/* front-shield */}
      <group name="front-shield" {...getInteractionProps('front-shield')}>
        <mesh position={[2.1, 0, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[1.5, 1.5, 0.2, 32]} />
          {getMaterial('front-shield', matHousing)}
        </mesh>
        <mesh position={[2.3, 0, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.8, 1.5, 0.4, 32]} />
          {getMaterial('front-shield', matHousing)}
        </mesh>
      </group>

      {/* front-bearing */}
      <group name="front-bearing" {...getInteractionProps('front-bearing')}>
        <mesh position={[2.6, 0, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.5, 0.5, 0.3, 32]} />
          {getMaterial('front-bearing', matSteel)}
        </mesh>
      </group>

      {/* rear-bearing */}
      <group name="rear-bearing" {...getInteractionProps('rear-bearing')}>
        <mesh position={[-2.1, 0, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.5, 0.5, 0.3, 32]} />
          {getMaterial('rear-bearing', matSteel)}
        </mesh>
      </group>

      {/* cooling-fan */}
      <group name="cooling-fan" {...getInteractionProps('cooling-fan')}>
        <mesh position={[-2.8, 0, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
          {getMaterial('cooling-fan', matHousing)}
        </mesh>
        {/* Blades */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <mesh key={`blade-${i}`} position={[-2.8, 0, 0]} rotation-x={(i * Math.PI) / 4}>
            <boxGeometry args={[0.2, 2.4, 0.1]} />
            {getMaterial('cooling-fan', matHousing)}
          </mesh>
        ))}
      </group>

      {/* fan-cowl */}
      <group name="fan-cowl" {...getInteractionProps('fan-cowl')}>
        <mesh position={[-2.8, 0, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[1.6, 1.6, 1.5, 32, 1, true]} />
          <meshStandardMaterial color="#1d2c38" roughness={0.4} metalness={0.7} side={2} />
        </mesh>
        <mesh position={[-3.5, 0, 0]} rotation-z={Math.PI / 2}>
          <torusGeometry args={[1.6, 0.05, 8, 32]} />
          {getMaterial('fan-cowl', matHousing)}
        </mesh>
      </group>

    </group>
  );
}
