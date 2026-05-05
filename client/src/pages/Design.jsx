import { Suspense, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import Mannequin from '../components/Mannequin'
import DesignPanel from '../components/DesignPanel'

async function generateDesign(prompt) {
  const res = await fetch('/api/generate-design', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  const { image } = await res.json()
  return `data:image/png;base64,${image}`
}

async function reconstructBody(file) {
  const fd = new FormData()
  fd.append('image', file)
  const res = await fetch('/api/reconstruct-body', { method: 'POST', body: fd })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

export default function Design() {
  const navigate = useNavigate()
  const [shirtColor, setShirtColor] = useState('#ffffff')
  const [designSrc, setDesignSrc] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [bodyModelUrl, setBodyModelUrl] = useState(null)
  const [isReconstructing, setIsReconstructing] = useState(false)
  const [reconstructError, setReconstructError] = useState('')

  const handleGenerate = async (prompt) => {
    setIsGenerating(true)
    try {
      const src = await generateDesign(prompt)
      setDesignSrc(src)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleBodyUpload = async (file) => {
    setReconstructError('')
    setIsReconstructing(true)
    try {
      if (bodyModelUrl) URL.revokeObjectURL(bodyModelUrl)
      const url = await reconstructBody(file)
      setBodyModelUrl(url)
    } catch (e) {
      setReconstructError(e.message || 'Body reconstruction failed.')
    } finally {
      setIsReconstructing(false)
    }
  }

  return (
    <div className="app">
      <header>
        <button className="btn-back" onClick={() => navigate('/')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="landing-logo" style={{ gap: 6 }}>
          <span className="logo-llama" style={{ fontSize: 18 }}>🦙</span>
          <span className="logo-text" style={{ fontSize: 15 }}>PrintLlama</span>
        </span>
        <span className="badge">FLUX · LHM · HuggingFace</span>
      </header>

      <div className="main">
        <div className="canvas-wrap">
          <Canvas
            shadows
            camera={{ position: [0, 0.2, 3.8], fov: 42 }}
            gl={{ antialias: true }}
          >
            <Suspense fallback={null}>
              <ambientLight intensity={0.7} />
              <directionalLight
                position={[3, 5, 3]}
                intensity={1.4}
                castShadow
                shadow-mapSize={[1024, 1024]}
              />
              <directionalLight position={[-2, 2, -2]} intensity={0.4} />

              <Mannequin color={shirtColor} designSrc={designSrc} bodyModelUrl={bodyModelUrl} />

              <ContactShadows
                position={[0, -1.15, 0]}
                opacity={0.3}
                scale={4}
                blur={2.5}
                far={2}
              />

              <OrbitControls
                target={[0, 0.1, 0]}
                enablePan={false}
                minDistance={2}
                maxDistance={7}
                minPolarAngle={Math.PI / 8}
                maxPolarAngle={Math.PI - Math.PI / 8}
              />

              <Environment preset="studio" />
            </Suspense>
          </Canvas>

          <p className="canvas-hint">Drag to rotate · Scroll to zoom</p>
        </div>

        <DesignPanel
          shirtColor={shirtColor}
          onColorChange={setShirtColor}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          designSrc={designSrc}
          onBodyUpload={handleBodyUpload}
          isReconstructing={isReconstructing}
          reconstructError={reconstructError}
          bodyModelUrl={bodyModelUrl}
        />
      </div>
    </div>
  )
}
