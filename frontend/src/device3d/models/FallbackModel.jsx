import React from "react";

/**
 * FallbackModel — generic industrial equipment placeholder
 * Used when a device type has no dedicated model component.
 * Shows a generic cabinet/enclosure shape with labeled panels.
 */
export default function FallbackModel({ partMaterials = {}, onPartClick, onPartHover, onPartLeave }) {
  const darkTitanium = { color: "#1d2c38", roughness: 0.4, metalness: 0.7 };
  const tealAccent = { color: "#224858", roughness: 0.35, metalness: 0.55 };

  const wrap = (partKey) => ({
    name: partKey,
    onClick: (e) => { e.stopPropagation(); onPartClick?.(partKey); },
    onPointerOver: (e) => { e.stopPropagation(); onPartHover?.(partKey); },
    onPointerOut: (e) => { e.stopPropagation(); onPartLeave?.(partKey); },
  });

  return (
    <group>
      {/* Main enclosure cabinet */}
      <group {...wrap("enclosure")}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3, 3.5, 2]} />
          {partMaterials["enclosure"] ? (
            <primitive object={partMaterials["enclosure"]} attach="material" />
          ) : (
            <meshStandardMaterial {...darkTitanium} />
          )}
        </mesh>
        {/* Door panel lines */}
        <mesh position={[0, 0, 1.01]}>
          <boxGeometry args={[2.6, 3.1, 0.02]} />
          <meshStandardMaterial {...tealAccent} />
        </mesh>
        {/* Handle */}
        <mesh position={[1.1, 0, 1.05]}>
          <boxGeometry args={[0.08, 0.5, 0.06]} />
          <meshStandardMaterial color="#bfd0dc" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Base plate */}
      <group {...wrap("base")}>
        <mesh position={[0, -1.95, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.4, 0.2, 2.4]} />
          {partMaterials["base"] ? (
            <primitive object={partMaterials["base"]} attach="material" />
          ) : (
            <meshStandardMaterial color="#0f1820" roughness={0.6} metalness={0.5} />
          )}
        </mesh>
      </group>

      {/* Status indicator light */}
      <mesh position={[0, 1.9, 1.02]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#2a7f8e" emissive="#2a7f8e" emissiveIntensity={0.5} />
      </mesh>

      {/* Ventilation slots */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0, 0.4 + i * 0.35, -1.01]}>
          <boxGeometry args={[2.0, 0.06, 0.02]} />
          <meshStandardMaterial color="#0a1218" />
        </mesh>
      ))}
    </group>
  );
}
