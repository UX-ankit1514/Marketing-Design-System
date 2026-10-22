import { useState } from 'react'
import { thumbnailUrl } from '../../lib/templates/registry'
import type { Template } from '../../types/template'

interface Props {
  template: Template
  onUse: (t: Template) => void
}

export function TemplateCard({ template: t, onUse }: Props) {
  const [broken, setBroken] = useState(false)
  const ratio = `${t.canvas.width} / ${t.canvas.height}`
  return (
    <article className="card" data-testid="template-card" data-template-id={t.id}>
      {/* Mouse-only shortcut: the labelled "Use template" button below is the accessible control. */}
      <button className="card" style={{ gap: 0 }} onClick={() => onUse(t)} tabIndex={-1} aria-hidden="true">
        <span className="card__thumb" style={{ aspectRatio: ratio, display: 'block' }}>
          {broken ? (
            <span className="card__error" role="img" aria-label="Preview missing">
              <strong>Preview missing</strong>
              <span>The image for “{t.name}” couldn't be loaded. You can still open this template.</span>
            </span>
          ) : (
            <img src={thumbnailUrl(t.id)} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />
          )}
        </span>
      </button>
      <div>
        <div className="card__name">{t.name}</div>
        <div className="card__meta">
          <span className="badge">{t.category}</span>
          <span>
            {t.format} · {t.canvas.width}×{t.canvas.height}
          </span>
        </div>
      </div>
      <button className="btn btn--secondary btn--sm" onClick={() => onUse(t)} aria-label={`Use template: ${t.name}, ${t.format}, ${t.canvas.width} by ${t.canvas.height}`}>
        Use template
      </button>
    </article>
  )
}
