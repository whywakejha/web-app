import { Component, Suspense, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'

const SKIN = '#d4b8a0'

function Mat({ color, roughness = 0.88, metalness = 0 }) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
}

/* ─── User's reconstructed body from LHM ─── */
function UserBodyGLB({ bodyModelUrl, designTex }) {
  const { scene } = useGLTF(bodyModelUrl)
  const cloned = useMemo(() => scene.clone(true), [scene])

  useEffect(() => {
    cloned.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true
        node.receiveShadow = true
      }
    })
  }, [cloned])

  const [center, height] = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned)
    const c = new THREE.Vector3()
    box.getCenter(c)
    const h = box.max.y - box.min.y
    return [c, h]
  }, [cloned])

  const s = 1.4 / (height || 1)

  return (
    <group
      scale={[s, s, s]}
      position={[-center.x * s, -center.y * s + 0.1, -center.z * s]}
    >
      <primitive object={cloned} />
      {designTex && (
        <mesh position={[0, 0.15, 0.38]}>
          <planeGeometry args={[0.44, 0.44]} />
          <meshBasicMaterial map={designTex} transparent alphaTest={0.05} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

/* ─── Generic GLB mannequin (when mannequin.glb is present in public/models/) ─── */
function MannequinGLB({ color, designTex }) {
  const { scene } = useGLTF('/models/mannequin.glb')
  const cloned = useMemo(() => scene.clone(true), [scene])
  const matColor = useMemo(() => new THREE.Color(color), [color])

  useEffect(() => {
    cloned.traverse((node) => {
      if (node.isMesh) {
        node.material = new THREE.MeshStandardMaterial({
          color: matColor,
          roughness: 0.86,
          metalness: 0.02,
        })
        node.castShadow = true
        node.receiveShadow = true
      }
    })
  }, [cloned, matColor])

  const [center, height] = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned)
    const c = new THREE.Vector3()
    box.getCenter(c)
    const h = box.max.y - box.min.y
    return [c, h]
  }, [cloned])

  const s = 1.4 / (height || 1)

  return (
    <group
      scale={[s, s, s]}
      position={[-center.x * s, -center.y * s + 0.1, -center.z * s]}
    >
      <primitive object={cloned} />
      {designTex && (
        <mesh position={[0, 0.15, 0.38]}>
          <planeGeometry args={[0.44, 0.44]} />
          <meshBasicMaterial map={designTex} transparent alphaTest={0.05} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

/* ─── Geometric primitive fallback ─── */
function MannequinPrimitive({ color, designTex }) {
  const shirtColor = useMemo(() => new THREE.Color(color), [color])

  return (
    <group scale={[0.52, 0.52, 0.52]} position={[0, -0.58, 0]}>
      <mesh position={[0, 2.18, 0]} castShadow>
        <sphereGeometry args={[0.22, 24, 24]} />
        <Mat color={SKIN} />
      </mesh>
      <mesh position={[0, 1.88, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.10, 0.24, 14]} />
        <Mat color={SKIN} />
      </mesh>
      <mesh position={[0, 1.10, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.35, 1.08, 20]} />
        <Mat color={shirtColor} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.68, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.26, 0.09, 16]} />
        <Mat color={shirtColor} roughness={0.9} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.55, 1.58, 0]} castShadow>
          <sphereGeometry args={[0.13, 14, 14]} />
          <Mat color={shirtColor} roughness={0.9} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.75, 1.44, 0]} rotation={[0, 0, side * -0.38]} castShadow>
          <cylinderGeometry args={[0.115, 0.10, 0.46, 14]} />
          <Mat color={shirtColor} roughness={0.9} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.82, 1.14, 0]} rotation={[0, 0, side * -0.14]} castShadow>
          <cylinderGeometry args={[0.085, 0.075, 0.52, 12]} />
          <Mat color={SKIN} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.86, 0.86, 0]} castShadow>
          <sphereGeometry args={[0.085, 12, 12]} />
          <Mat color={SKIN} />
        </mesh>
      ))}
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.34, 0.52, 18]} />
        <Mat color="#1e1e28" roughness={0.92} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.165, -0.10, 0]} castShadow>
          <cylinderGeometry args={[0.155, 0.14, 0.70, 14]} />
          <Mat color="#161620" roughness={0.95} />
        </mesh>
      ))}
      {designTex && (
        <mesh position={[0, 1.12, 0.40]}>
          <planeGeometry args={[0.50, 0.50]} />
          <meshBasicMaterial map={designTex} transparent alphaTest={0.05} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

/* ─── Error boundary to catch failed GLB loads ─── */
class GLBErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}

/* ─── Main export ─── */
export default function Mannequin({ color = '#ffffff', designSrc, bodyModelUrl }) {
  const [designTex, setDesignTex] = useState(null)

  useEffect(() => {
    if (!designSrc) { setDesignTex(null); return }
    const loader = new THREE.TextureLoader()
    loader.load(designSrc, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      setDesignTex(tex)
    })
  }, [designSrc])

  const primitive = <MannequinPrimitive color={color} designTex={designTex} />

  if (bodyModelUrl) {
    return (
      <GLBErrorBoundary fallback={primitive}>
        <Suspense fallback={primitive}>
          <UserBodyGLB bodyModelUrl={bodyModelUrl} designTex={designTex} />
        </Suspense>
      </GLBErrorBoundary>
    )
  }

  return (
    <GLBErrorBoundary fallback={primitive}>
      <Suspense fallback={primitive}>
        <MannequinGLB color={color} designTex={designTex} />
      </Suspense>
    </GLBErrorBoundary>
  )
}
