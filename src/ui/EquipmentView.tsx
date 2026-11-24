import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Html } from '@react-three/drei';
import { Suspense, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type { Part, Scenario } from '../simulation/types';

type View = 'front'|'top'|'side';

function ComponentNode({part,index,selected,onSelect,removed}:{part:Part;index:number;selected:boolean;onSelect:()=>void;removed:boolean}) {
  const angle=(index/4)*Math.PI*2-Math.PI/2;
  const x=Math.cos(angle)*1.52, z=Math.sin(angle)*1.1;
  return <group position={[x,0.36,z]} onClick={(e)=>{e.stopPropagation();onSelect();}}>
    <mesh position={[0,-0.12,0]} castShadow onClick={(e)=>{e.stopPropagation();onSelect();}}>
      <boxGeometry args={[0.68,0.5,0.48]}/><meshStandardMaterial color={selected?'#f1ad50':part.color} roughness={0.42} metalness={0.48} transparent={removed} opacity={removed?0.25:1}/>
    </mesh>
    <mesh position={[0,0.16,0]} onClick={(e)=>{e.stopPropagation();onSelect();}}><sphereGeometry args={[0.15,16,12]}/><meshStandardMaterial color={selected?'#ffe0a8':'#263238'} metalness={0.35}/></mesh>
    <Html center distanceFactor={5} position={[0,-0.6,0]}><div className={`part-label ${selected?'active':''}`}>{part.name}</div></Html>
  </group>;
}
function CameraPreset({view}:{view:View}) {
  const {camera}=useThree();
  useEffect(()=>{
    const positions:Record<View,[number,number,number]>={front:[0,0.9,5.8],top:[0,6,0.01],side:[5.8,0.9,0]};
    camera.position.set(...positions[view]);
    camera.up.set(0,view==='top'?0:1,view==='top'?-1:0);
    camera.lookAt(0,0,0);camera.updateProjectionMatrix();
  },[camera,view]);
  return null;
}
function Rig({scenario,selected,onSelect,removed,view}:{scenario:Scenario;selected:string|null;onSelect:(id:string)=>void;removed:string[];view:View}) {
  return <>
    <ambientLight intensity={1.2}/><directionalLight position={[4,6,5]} intensity={2.2} castShadow/><pointLight position={[-4,3,-3]} intensity={1.2} color="#76c9c6"/>
    <mesh position={[0,0,0]} castShadow receiveShadow><cylinderGeometry args={[1.05,1.22,0.42,12]}/><meshStandardMaterial color="#34434a" metalness={0.7} roughness={0.3}/></mesh>
    <mesh position={[0,0.38,0]} castShadow><cylinderGeometry args={[0.68,0.78,0.42,12]}/><meshStandardMaterial color="#526168" metalness={0.55} roughness={0.36}/></mesh>
    <mesh position={[0,0.68,0]}><cylinderGeometry args={[0.18,0.18,0.4,16]}/><meshStandardMaterial color="#d9a256" metalness={0.7}/></mesh>
    {scenario.parts.map((p,i)=><ComponentNode key={p.id} part={p} index={i} selected={selected===p.id} onSelect={()=>onSelect(p.id)} removed={removed.includes(p.id)}/>)}
    <ContactShadows position={[0,-0.62,0]} opacity={0.38} blur={2.4} scale={7}/>
    <OrbitControls makeDefault minDistance={3.2} maxDistance={8} enablePan enableDamping/><CameraPreset view={view}/>
  </>;
}
export default function EquipmentView({scenario,selected,onSelect,removed,view,onViewChange}:{scenario:Scenario;selected:string|null;onSelect:(id:string)=>void;removed:string[];view:View;onViewChange:(view:View)=>void}) {
  return <div className="model-canvas" aria-label={`${scenario.equipment} interactive 3D prototype`}>
    <Canvas shadows camera={{position:[0,0.9,5.8],fov:42}} dpr={[1,1.6]}><color attach="background" args={['#f2f5f3']}/><Suspense fallback={null}><Rig scenario={scenario} selected={selected} onSelect={onSelect} removed={removed} view={view}/></Suspense></Canvas>
    <div className="canvas-caption"><span className="live-dot"/> Interactive prototype model <span>·</span> drag to rotate <span>·</span> scroll to zoom</div>
    <div className="orientation-window" aria-label="Model orientation views"><div className="orientation-top"><span>VIEW GRID</span><span className="grid-live"/></div><svg className="orientation-axes" viewBox="0 0 84 46" role="img" aria-label="Three dimensional axes"><defs><pattern id="viewGrid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M 8 0 L 0 0 0 8" fill="none" stroke="#dbe3df" strokeWidth=".65"/></pattern><marker id="arrowX" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5" fill="#df7964"/></marker><marker id="arrowY" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5" fill="#55a986"/></marker><marker id="arrowZ" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5" fill="#648bc3"/></marker></defs><rect x=".5" y=".5" width="83" height="45" rx="3" fill="url(#viewGrid)" stroke="#d5dfda"/><path d="M42 24 L68 24" stroke="#df7964" strokeWidth="1.6" markerEnd="url(#arrowX)"/><path d="M42 24 L42 5" stroke="#55a986" strokeWidth="1.6" markerEnd="url(#arrowY)"/><path d="M42 24 L24 38" stroke="#648bc3" strokeWidth="1.6" markerEnd="url(#arrowZ)"/><text x="72" y="26" fill="#b55c4c" fontSize="6">X</text><text x="40" y="5" fill="#43866a" fontSize="6">Y</text><text x="17" y="42" fill="#5276a5" fontSize="6">Z</text></svg><div className="orientation-buttons">{(['front','top','side'] as const).map(v=><button key={v} className={view===v?'active':''} onClick={()=>onViewChange(v)} aria-pressed={view===v}>{v==='top'?'Upper':v==='side'?'Side':'Front'}</button>)}</div></div>
  </div>;
}
