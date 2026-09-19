import React, { useMemo } from 'react';
import * as THREE from 'three';

export default function ConveyorDriveModel({
  partMaterials = {},
  onPartClick,
  onPartHover,
  onPartLeave
}) {
  const materials = useMemo(() => ({
    titanium: new THREE.MeshStandardMaterial({ color: '#1d2c38', roughness: 0.4, metalness: 0.7 }),
    steel: new THREE.MeshStandardMaterial({ color: '#bfd0dc', roughness: 0.18, metalness: 0.92 }),
    copper: new THREE.MeshStandardMaterial({ color: '#c86d3b', roughness: 0.3, metalness: 0.85 }),
    bronze: new THREE.MeshStandardMaterial({ color: '#b08040', roughness: 0.35, metalness: 0.8 }),
    core: new THREE.MeshStandardMaterial({ color: '#334858', roughness: 0.5, metalness: 0.65 }),
    teal: new THREE.MeshStandardMaterial({ color: '#224858', roughness: 0.35, metalness: 0.55 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#151f28', roughness: 0.85, metalness: 0.15 })
  }), []);

  const getMaterial = (part, defaultMat) => partMaterials[part] || defaultMat;

  const eventHandlers = (part) => ({
    onClick: (e) => { e.stopPropagation(); onPartClick?.(part); },
    onPointerOver: (e) => { e.stopPropagation(); onPartHover?.(part); },
    onPointerOut: (e) => { e.stopPropagation(); onPartLeave?.(part); }
  });

  return (
    <group>
      {/* drive-pulley */}
      <group name="drive-pulley" {...eventHandlers('drive-pulley')}>
        {/* Main drum lagging */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={getMaterial('drive-pulley', materials.rubber)}>
          <cylinderGeometry args={[1.25, 1.25, 3, 32]} />
        </mesh>
        {/* Central shaft */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={getMaterial('drive-pulley', materials.steel)}>
          <cylinderGeometry args={[0.2, 0.2, 5.6, 16]} />
        </mesh>
        {/* Side plates */}
        <mesh position={[0, 0, 1.5]} rotation={[Math.PI / 2, 0, 0]} material={getMaterial('drive-pulley', materials.steel)}>
          <cylinderGeometry args={[1.26, 1.26, 0.05, 32]} />
        </mesh>
        <mesh position={[0, 0, -1.5]} rotation={[Math.PI / 2, 0, 0]} material={getMaterial('drive-pulley', materials.steel)}>
          <cylinderGeometry args={[1.26, 1.26, 0.05, 32]} />
        </mesh>
      </group>

      {/* snub-roller */}
      <group name="snub-roller" position={[1.2, -1.2, 0]} {...eventHandlers('snub-roller')}>
        {/* Roller body */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={getMaterial('snub-roller', materials.steel)}>
          <cylinderGeometry args={[0.5, 0.5, 3.2, 32]} />
        </mesh>
        {/* Shaft */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={getMaterial('snub-roller', materials.steel)}>
          <cylinderGeometry args={[0.15, 0.15, 4.2, 16]} />
        </mesh>
      </group>

      {/* pillow-bearings */}
      <group name="pillow-bearings" {...eventHandlers('pillow-bearings')}>
        {/* Drive pulley front bearing */}
        <mesh position={[0, -0.4, 1.9]} material={getMaterial('pillow-bearings', materials.teal)}>
          <boxGeometry args={[0.8, 0.8, 0.4]} />
        </mesh>
        <mesh position={[0, 0, 1.9]} rotation={[Math.PI / 2, 0, 0]} material={getMaterial('pillow-bearings', materials.teal)}>
          <cylinderGeometry args={[0.4, 0.4, 0.4, 16]} />
        </mesh>

        {/* Drive pulley rear bearing */}
        <mesh position={[0, -0.4, -1.9]} material={getMaterial('pillow-bearings', materials.teal)}>
          <boxGeometry args={[0.8, 0.8, 0.4]} />
        </mesh>
        <mesh position={[0, 0, -1.9]} rotation={[Math.PI / 2, 0, 0]} material={getMaterial('pillow-bearings', materials.teal)}>
          <cylinderGeometry args={[0.4, 0.4, 0.4, 16]} />
        </mesh>

        {/* Snub roller front bearing */}
        <mesh position={[1.2, -1.5, 1.9]} material={getMaterial('pillow-bearings', materials.teal)}>
          <boxGeometry args={[0.6, 0.6, 0.3]} />
        </mesh>
        <mesh position={[1.2, -1.2, 1.9]} rotation={[Math.PI / 2, 0, 0]} material={getMaterial('pillow-bearings', materials.teal)}>
          <cylinderGeometry args={[0.3, 0.3, 0.3, 16]} />
        </mesh>

        {/* Snub roller rear bearing */}
        <mesh position={[1.2, -1.5, -1.9]} material={getMaterial('pillow-bearings', materials.teal)}>
          <boxGeometry args={[0.6, 0.6, 0.3]} />
        </mesh>
        <mesh position={[1.2, -1.2, -1.9]} rotation={[Math.PI / 2, 0, 0]} material={getMaterial('pillow-bearings', materials.teal)}>
          <cylinderGeometry args={[0.3, 0.3, 0.3, 16]} />
        </mesh>
      </group>

      {/* helical-gearbox */}
      <group name="helical-gearbox" position={[0, 0, 2.6]} {...eventHandlers('helical-gearbox')}>
        {/* Main gearbox housing */}
        <mesh position={[0, -0.2, 0]} material={getMaterial('helical-gearbox', materials.titanium)}>
          <boxGeometry args={[1.0, 1.2, 0.8]} />
        </mesh>
        {/* Flange to drum shaft */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={getMaterial('helical-gearbox', materials.titanium)}>
          <cylinderGeometry args={[0.4, 0.4, 0.85, 32]} />
        </mesh>
      </group>

      {/* drive-motor */}
      <group name="drive-motor" position={[-1.2, 0, 2.6]} {...eventHandlers('drive-motor')}>
        {/* Motor main body */}
        <mesh rotation={[0, 0, Math.PI / 2]} material={getMaterial('drive-motor', materials.teal)}>
          <cylinderGeometry args={[0.5, 0.5, 1.4, 32]} />
        </mesh>
        {/* Motor cooling fins */}
        <mesh rotation={[0, 0, Math.PI / 2]} material={getMaterial('drive-motor', materials.core)}>
          <cylinderGeometry args={[0.52, 0.52, 1.0, 32]} />
        </mesh>
        {/* Flange connecting to gearbox */}
        <mesh position={[0.75, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={getMaterial('drive-motor', materials.bronze)}>
          <cylinderGeometry args={[0.6, 0.6, 0.1, 32]} />
        </mesh>
        {/* Shaft between motor and gearbox */}
        <mesh position={[0.85, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={getMaterial('drive-motor', materials.steel)}>
          <cylinderGeometry args={[0.15, 0.15, 0.3, 16]} />
        </mesh>
        {/* Motor fan cover */}
        <mesh position={[-0.75, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={getMaterial('drive-motor', materials.titanium)}>
          <cylinderGeometry args={[0.45, 0.45, 0.2, 32]} />
        </mesh>
      </group>
    </group>
  );
}
