import { useEffect, useRef, useState } from 'react'

const COLOR_GROUPS = [
  {
    id: 'neutrals',
    name: 'Neutrals',
    locked: false,
    colors: [
      { hex: '#ffffff', label: 'White' },
      { hex: '#f0f0f0', label: 'Off-White' },
      { hex: '#888899', label: 'Slate' },
      { hex: '#1a1a1a', label: 'Black' },
    ],
  },
  {
    id: 'blues',
    name: 'Blues',
    locked: false,
    colors: [
      { hex: '#0369a1', label: 'Sky' },
      { hex: '#1d4ed8', label: 'Navy' },
      { hex: '#312e81', label: 'Indigo' },
      { hex: '#0891b2', label: 'Teal' },
    ],
  },
  {
    id: 'earthy',
    name: 'Earthy',
    locked: false,
    colors: [
      { hex: '#15803d', label: 'Forest' },
      { hex: '#c2410c', label: 'Rust' },
      { hex: '#92400e', label: 'Brown' },
      { hex: '#d97706', label: 'Amber' },
    ],
  },
  {
    id: 'vivid',
    name: 'Vivid',
    locked: false,
    colors: [
      { hex: '#b91c1c', label: 'Red' },
      { hex: '#7c3aed', label: 'Purple' },
      { hex: '#f59e0b', label: 'Gold' },
      { hex: '#ec4899', label: 'Pink' },
    ],
  },
  {
    id: 'pastel',
    name: 'Pastel',
    locked: true,
    colors: [
      { hex: '#bfdbfe', label: 'Baby Blue' },
      { hex: '#bbf7d0', label: 'Mint' },
      { hex: '#fde68a', label: 'Cream' },
      { hex: '#fbcfe8', label: 'Blush' },
    ],
  },
  {
    id: 'neon',
    name: 'Neon',
    locked: true,
    colors: [
      { hex: '#00ff88', label: 'Neon Green' },
      { hex: '#ff006e', label: 'Neon Pink' },
      { hex: '#3a86ff', label: 'Electric Blue' },
      { hex: '#ffbe0b', label: 'Neon Yellow' },
    ],
  },
]

const PRINT_SPECS = [
  'White/transparent background for clean separation',
  'Bold outlines for crisp screen printing',
  'CMYK-optimised colour palette',
  'Centred composition, ~30×30 cm print area',
]

function ColorGroup({ group, shirtColor, onColorChange, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const [unlocked, setUnlocked] = useState(false)

  const isLocked = group.locked && !unlocked

  return (
    <div className={`color-group ${isLocked ? 'color-group--locked' : ''}`}>
      <button className="color-group-header" onClick={() => setOpen((v) => !v)}>
        <span className="color-group-name">{group.name}</span>
        <div className="color-group-header-right">
          {group.locked && !unlocked && (
            <span className="lock-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 11V7A5 5 0 0 0 7 7v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
              </svg>
            </span>
          )}
          <span className={`group-chevron ${open ? 'open' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
      </button>

      {open && (
        <div className="color-group-body">
          {isLocked ? (
            <div className="locked-overlay">
              <div className="locked-swatches">
                {group.colors.map((c) => (
                  <div
                    key={c.hex}
                    className="swatch swatch--blurred"
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
              <button className="btn-unlock" onClick={() => setUnlocked(true)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M17 11V7A5 5 0 0 0 7 7v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
                </svg>
                Unlock palette
              </button>
            </div>
          ) : (
            <div className="color-grid">
              {group.colors.map(({ hex, label }) => (
                <button
                  key={hex}
                  className={`swatch ${shirtColor === hex ? 'active' : ''}`}
                  style={{
                    background: hex,
                    border: hex === '#ffffff' || hex === '#f0f0f0' || hex === '#fde68a' || hex === '#bfdbfe'
                      ? '2px solid #2a2a38'
                      : undefined,
                  }}
                  title={label}
                  onClick={() => onColorChange(hex)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function DesignPanel({
  shirtColor, onColorChange,
  onGenerate, isGenerating, designSrc,
  onBodyUpload, isReconstructing, reconstructError, bodyModelUrl,
}) {
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState('')
  const [hexInput, setHexInput] = useState(shirtColor)
  const [photoPreview, setPhotoPreview] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => { setHexInput(shirtColor) }, [shirtColor])

  const handleHexChange = (raw) => {
    setHexInput(raw)
    const val = raw.startsWith('#') ? raw : `#${raw}`
    if (/^#[0-9a-fA-F]{6}$/.test(val)) onColorChange(val)
  }

  const handleGenerate = async () => {
    setError('')
    if (!prompt.trim()) return
    try {
      await onGenerate(prompt)
    } catch (e) {
      setError(e.message || 'Generation failed. Check your API key and try again.')
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoPreview(URL.createObjectURL(file))
    onBodyUpload(file)
  }

  return (
    <aside className="panel">
      {/* Photo upload */}
      <div className="panel-section">
        <div className="panel-label">Your photo</div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Uploaded photo"
              style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 6 }}
            />
          )}
          <button
            className="btn-generate"
            style={{ marginTop: 0 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isReconstructing}
          >
            {isReconstructing ? (
              <>
                <span className="spinner" />
                Reconstructing…
              </>
            ) : bodyModelUrl ? (
              'Replace photo'
            ) : (
              'Upload photo'
            )}
          </button>
          {reconstructError && <div className="error-msg">{reconstructError}</div>}
          {!bodyModelUrl && !isReconstructing && (
            <p className="prompt-hint" style={{ marginTop: 0 }}>
              Upload a photo to generate your personal 3D avatar via LHM. Without a photo, a generic mannequin is shown.
            </p>
          )}
        </div>
      </div>

      {/* Shirt colour */}
      <div className="panel-section">
        <div className="panel-label">Shirt colour</div>

        {COLOR_GROUPS.map((g, i) => (
          <ColorGroup
            key={g.id}
            group={g}
            shirtColor={shirtColor}
            onColorChange={onColorChange}
            defaultOpen={i < 2}
          />
        ))}

        <div className="color-picker-row" style={{ marginTop: 12 }}>
          <label>Custom</label>
          <input
            type="color"
            value={shirtColor}
            onChange={(e) => { onColorChange(e.target.value); setHexInput(e.target.value) }}
          />
          <input
            className="hex-input"
            type="text"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            onBlur={() => setHexInput(shirtColor)}
            maxLength={7}
            spellCheck={false}
            placeholder="#ffffff"
          />
        </div>
      </div>

      {/* Design generation */}
      <div className="panel-section">
        <div className="panel-label">Generate design</div>
        <textarea
          className="prompt-area"
          placeholder="e.g. a fierce roaring bear with geometric patterns, streetwear style"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKey}
          rows={4}
        />
        <p className="prompt-hint">
          Describe your design — t-shirt printing constraints are added automatically. ⌘↵ to generate.
        </p>

        <button
          className="btn-generate"
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
        >
          {isGenerating ? (
            <>
              <span className="spinner" />
              Generating…
            </>
          ) : (
            'Generate design'
          )}
        </button>

        {error && <div className="error-msg">{error}</div>}
      </div>

      {/* Preview */}
      <div className="panel-section">
        <div className="panel-label">Design preview</div>
        <div className="design-preview">
          {designSrc ? (
            <img src={designSrc} alt="Generated design" />
          ) : (
            <div className="preview-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9l4-4 4 4 4-4 4 4" />
                <circle cx="8.5" cy="13.5" r="1.5" />
              </svg>
              Design will appear here
            </div>
          )}
        </div>
      </div>

      {/* Print specs */}
      <div className="panel-section">
        <div className="panel-label">Print optimisations</div>
        <div className="spec-list">
          {PRINT_SPECS.map((s) => (
            <div key={s} className="spec-item">
              <span className="spec-dot" />
              {s}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
