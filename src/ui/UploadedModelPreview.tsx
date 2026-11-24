import { Component, Suspense } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, OrbitControls, Center, useGLTF } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { useLoader } from '@react-three/fiber';

function Asset({url}:{url:string}){const {scene}=useGLTF(url);return <primitive object={scene}/>;}
function StlAsset({url}:{url:string}){const geometry=useLoader(STLLoader,url);return <mesh geometry={geometry}><meshStandardMaterial color="#8b9b99" metalness={0.28} roughness={0.55}/></mesh>;}
class PreviewErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true}}componentDidCatch(_error:Error,_info:ErrorInfo){}render(){return this.state.failed?<div className="preview-error">This file could not be rendered as GLB/GLTF. It remains stored as an original and needs processing review.</div>:this.props.children;}}
export default function UploadedModelPreview({url,fileType}:{url:string;fileType?:string}){const stl=fileType?.toLowerCase()==='stl';return <div className="uploaded-model-canvas"><PreviewErrorBoundary><Canvas camera={{position:[3,2.5,4],fov:42}} dpr={[1,1.5]}><color attach="background" args={['#eef3ef']}/><ambientLight intensity={1.4}/><directionalLight position={[4,6,5]} intensity={2}/><Suspense fallback={null}><Bounds fit clip observe margin={1.25}><Center>{stl?<StlAsset url={url}/>:<Asset url={url}/>}</Center></Bounds><OrbitControls makeDefault enableDamping/></Suspense></Canvas></PreviewErrorBoundary><span>Visual asset preview · orbit to rotate · scroll to zoom · select components to inspect</span></div>;}
