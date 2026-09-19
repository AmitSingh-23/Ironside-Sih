import React, { useMemo } from 'react';

export default function DieselGeneratorModel({
  partMaterials = {},
  onPartClick,
  onPartHover,
  onPartLeave
}) {
  const defaultMaterials = useMemo(() => ({
    titanium: <meshStandardMaterial color="#1d2c38" roughness={0.4} metalness={0.7} />,
    steel: <meshStandardMaterial color="#bfd0dc" roughness={0.18} metalness={0.92} />,
    copper: <meshStandardMaterial color="#c86d3b" roughness={0.3} metalness={0.85} />,
    bronze: <meshStandardMaterial color="#b08040" roughness={0.35} metalness={0.8} />,
    laminated: <meshStandardMaterial color="#334858" roughness={0.5} metalness={0.65} />,
    teal: <meshStandardMaterial color="#224858" roughness={0.35} metalness={0.55} />,
    rubber: <meshStandardMaterial color="#151f28" roughness={0.85} metalness={0.15} />
  }), []);

  const getMat = (key, defaultMat) => partMaterials[key] || defaultMat;

  const createEventHandler = (handler, key) => (e) => {
    if (handler) {
      e.stopPropagation();
      handler(key);
    }
  };

  const getEvents = (key) => ({
    onClick: createEventHandler(onPartClick, key),
    onPointerOver: createEventHandler(onPartHover, key),
    onPointerOut: createEventHandler(onPartLeave, key)
  });

  return (
    <group>
      {/* skid-base */}
      <group name="skid-base" {...getEvents('skid-base')}>
        {/* Main base channels */}
        <mesh position={[0, -1.25, 0]}>
          <boxGeometry args={[8.5, 0.4, 3]} />
          {getMat('skid-base', defaultMaterials.teal)}
        </mesh>
        {/* Inner cross members */}
        <mesh position={[-2, -1.25, 0]}>
          <boxGeometry args={[0.3, 0.4, 2.8]} />
          {getMat('skid-base', defaultMaterials.titanium)}
        </mesh>
        <mesh position={[2, -1.25, 0]}>
          <boxGeometry args={[0.3, 0.4, 2.8]} />
          {getMat('skid-base', defaultMaterials.titanium)}
        </mesh>
        {/* Rubber isolator pads */}
        {[-3.8, 3.8].map((x) =>
          [-1.3, 1.3].map((z) => (
            <mesh key={`pad-${x}-${z}`} position={[x, -1.55, z]}>
              <boxGeometry args={[0.4, 0.2, 0.4]} />
              {defaultMaterials.rubber}
            </mesh>
          ))
        )}
      </group>

      {/* radiator-pack */}
      <group name="radiator-pack" position={[-3.5, 0.4, 0]} {...getEvents('radiator-pack')}>
        {/* Radiator housing */}
        <mesh position={[-0.2, 0, 0]}>
          <boxGeometry args={[0.4, 2.8, 2.8]} />
          {getMat('radiator-pack', defaultMaterials.titanium)}
        </mesh>
        {/* Radiator cooling matrix */}
        <mesh position={[-0.2, 0, 0]}>
          <boxGeometry args={[0.45, 2.6, 2.6]} />
          {getMat('radiator-pack', defaultMaterials.laminated)}
        </mesh>
        {/* Fan cowl / shroud */}
        <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1.3, 1.3, 0.2, 32]} />
          {getMat('radiator-pack', defaultMaterials.titanium)}
        </mesh>
        {/* Fan hub and blades (abstracted) */}
        <mesh position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1.2, 1.2, 0.1, 8]} />
          {getMat('radiator-pack', defaultMaterials.steel)}
        </mesh>
      </group>

      {/* engine-block */}
      <group name="engine-block" position={[-1.2, 0.2, 0]} {...getEvents('engine-block')}>
        {/* Main block body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3.2, 1.8, 1.5]} />
          {getMat('engine-block', defaultMaterials.steel)}
        </mesh>
        {/* Oil pan */}
        <mesh position={[0, -1.1, 0]}>
          <boxGeometry args={[2.8, 0.5, 1.2]} />
          {getMat('engine-block', defaultMaterials.titanium)}
        </mesh>
        {/* V-Cylinder banks (left and right) */}
        <mesh position={[0, 1.1, 0.5]} rotation={[Math.PI / 6, 0, 0]}>
          <boxGeometry args={[3.0, 0.8, 0.6]} />
          {getMat('engine-block', defaultMaterials.titanium)}
        </mesh>
        <mesh position={[0, 1.1, -0.5]} rotation={[-Math.PI / 6, 0, 0]}>
          <boxGeometry args={[3.0, 0.8, 0.6]} />
          {getMat('engine-block', defaultMaterials.titanium)}
        </mesh>
        {/* Exhaust manifold */}
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 2.8, 16]} rotation={[0, 0, Math.PI / 2]} />
          {getMat('engine-block', defaultMaterials.bronze)}
        </mesh>
      </group>

      {/* turbocharger */}
      <group name="turbocharger" position={[-0.4, 2.1, 0]} {...getEvents('turbocharger')}>
        {/* Snail housing / compressor */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.25, 0.15, 16, 32]} />
          {getMat('turbocharger', defaultMaterials.bronze)}
        </mesh>
        {/* Turbine housing */}
        <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.25, 0.3, 16]} />
          {getMat('turbocharger', defaultMaterials.steel)}
        </mesh>
        {/* Intake pipe going down */}
        <mesh position={[-0.2, -0.4, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
          {getMat('turbocharger', defaultMaterials.titanium)}
        </mesh>
      </group>

      {/* alternator-stator */}
      <group name="alternator-stator" position={[2.2, 0.2, 0]} {...getEvents('alternator-stator')}>
        {/* Main stator housing */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1.3, 1.3, 2.6, 32]} />
          {getMat('alternator-stator', defaultMaterials.teal)}
        </mesh>
        {/* Drive end bell (coupling side) */}
        <mesh position={[-1.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1.3, 0.8, 0.2, 32]} />
          {getMat('alternator-stator', defaultMaterials.titanium)}
        </mesh>
        {/* Non-drive end bell */}
        <mesh position={[1.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.8, 1.3, 0.2, 32]} />
          {getMat('alternator-stator', defaultMaterials.titanium)}
        </mesh>
        {/* Top terminal/control box */}
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[1.2, 0.6, 1.0]} />
          {getMat('alternator-stator', defaultMaterials.titanium)}
        </mesh>
      </group>

      {/* alternator-rotor */}
      <group name="alternator-rotor" position={[2.2, 0.2, 0]} {...getEvents('alternator-rotor')}>
        {/* Exposed coupling shaft connecting to engine */}
        <mesh position={[-1.65, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.6, 0.6, 0.4, 32]} />
          {getMat('alternator-rotor', defaultMaterials.steel)}
        </mesh>
        {/* Inner rotating core (copper windings visible through gaps) */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1.2, 1.2, 2.7, 32]} />
          {getMat('alternator-rotor', defaultMaterials.copper)}
        </mesh>
        {/* Exciter rotor on the non-drive end */}
        <mesh position={[1.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          {getMat('alternator-rotor', defaultMaterials.steel)}
        </mesh>
      </group>
    </group>
  );
}
