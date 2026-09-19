import React from 'react';

export default function AirCompressorModel({
  onPartClick = () => {},
  onPartHover = () => {},
  onPartLeave = () => {},
  ...props
}) {
  const colors = {
    titanium: { color: "#1d2c38", roughness: 0.4, metalness: 0.7 },
    steel: { color: "#bfd0dc", roughness: 0.18, metalness: 0.92 },
    copper: { color: "#c86d3b", roughness: 0.3, metalness: 0.85 },
    bronze: { color: "#b08040", roughness: 0.35, metalness: 0.8 },
    core: { color: "#334858", roughness: 0.5, metalness: 0.65 },
    teal: { color: "#224858", roughness: 0.35, metalness: 0.55 },
    rubber: { color: "#151f28", roughness: 0.85, metalness: 0.15 }
  };

  const interact = (key) => ({
    onClick: (e) => { e.stopPropagation(); onPartClick(key); },
    onPointerOver: (e) => { e.stopPropagation(); onPartHover(key); },
    onPointerOut: (e) => { e.stopPropagation(); onPartLeave(key); }
  });

  return (
    <group {...props}>
      {/* receiver-tank: Horizontal pressure vessel with legs */}
      <group name="receiver-tank" position={[0, -1, 0]} {...interact('receiver-tank')}>
        {/* Tank Body */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.8, 0.8, 5, 32]} />
          <meshStandardMaterial {...colors.steel} />
        </mesh>
        {/* End Caps */}
        <mesh position={[-2.5, 0, 0]}>
          <sphereGeometry args={[0.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial {...colors.steel} />
        </mesh>
        <mesh position={[2.5, 0, 0]} rotation={[0, 0, Math.PI]}>
          <sphereGeometry args={[0.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial {...colors.steel} />
        </mesh>
        {/* Saddle Legs */}
        <mesh position={[-1.5, -0.6, 0]}>
          <boxGeometry args={[0.4, 0.6, 1]} />
          <meshStandardMaterial {...colors.titanium} />
        </mesh>
        <mesh position={[1.5, -0.6, 0]}>
          <boxGeometry args={[0.4, 0.6, 1]} />
          <meshStandardMaterial {...colors.titanium} />
        </mesh>
      </group>

      {/* rotary-screws: Twin helical screw airend */}
      <group name="rotary-screws" position={[-1, 0.5, 0]} {...interact('rotary-screws')}>
        {/* Main Airend Housing */}
        <mesh>
          <boxGeometry args={[1.2, 0.8, 1]} />
          <meshStandardMaterial {...colors.teal} />
        </mesh>
        {/* Screw cylinders protruding slightly to indicate twin screws */}
        <mesh position={[0, 0, 0.5]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 1.25, 16]} />
          <meshStandardMaterial {...colors.titanium} />
        </mesh>
        <mesh position={[0, 0, -0.5]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 1.25, 16]} />
          <meshStandardMaterial {...colors.titanium} />
        </mesh>
      </group>

      {/* intake-valve: Suction unloader valve at the intake */}
      <group name="intake-valve" position={[-1, 1.1, 0]} {...interact('intake-valve')}>
        <mesh>
          <cylinderGeometry args={[0.25, 0.25, 0.4, 16]} />
          <meshStandardMaterial {...colors.bronze} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.2, 16]} />
          <meshStandardMaterial {...colors.titanium} />
        </mesh>
      </group>

      {/* oil-separator: Vertical vessel for air-oil separation */}
      <group name="oil-separator" position={[0.8, 0.8, 0]} {...interact('oil-separator')}>
        <mesh>
          <cylinderGeometry args={[0.4, 0.4, 1.6, 32]} />
          <meshStandardMaterial {...colors.steel} />
        </mesh>
        {/* Top Dome */}
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial {...colors.steel} />
        </mesh>
        {/* Bottom Dome */}
        <mesh position={[0, -0.8, 0]} rotation={[0, 0, Math.PI]}>
          <sphereGeometry args={[0.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial {...colors.steel} />
        </mesh>
      </group>

      {/* aftercooler: Heat exchanger panel */}
      <group name="aftercooler" position={[2.2, 0.5, 0]} {...interact('aftercooler')}>
        {/* Main Panel */}
        <mesh>
          <boxGeometry args={[0.4, 1.4, 1.2]} />
          <meshStandardMaterial {...colors.titanium} />
        </mesh>
        {/* Core Fins */}
        <mesh position={[0.21, 0, 0]}>
          <boxGeometry args={[0.05, 1.3, 1.1]} />
          <meshStandardMaterial {...colors.core} />
        </mesh>
        {/* Fan Shroud */}
        <mesh position={[-0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
          <meshStandardMaterial {...colors.rubber} />
        </mesh>
      </group>
    </group>
  );
}
