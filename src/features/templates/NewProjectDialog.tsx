import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog } from '../../components/common/Dialog'
import { createProjectFromTemplate } from '../../lib/templates/instantiate'
import { saveProject } from '../../lib/storage/db'
import { thumbnailUrl } from '../../lib/templates/registry'
import type { Template } from '../../types/template'

export function NewProjectDialog({ template, onClose }: { template: Template; onClose: () => void }) {
  const nav = useNavigate()
  const [name, setName] = useState(template.name)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function create() {
    setBusy(true)
    setError(null)
    try {
      const p = createProjectFromTemplate(template, name)
      await saveProject({ id: p.id, name: p.name, templateId: p.templateId, updatedAt: p.updatedAt, project: p })
      nav(`/edit/${p.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <Dialog
      title="Name your design"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button className="btn btn--tertiary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={create} disabled={busy || !name.trim()}>
            {busy ? 'Creating…' : 'Create design'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 16 }}>
        <img src={thumbnailUrl(template.id)} alt="" width={96} style={{ borderRadius: 4, border: '1px solid var(--border-default)', alignSelf: 'flex-start', aspectRatio: `${template.canvas.width}/${template.canvas.height}`, objectFit: 'cover' }} />
        <form
          style={{ flex: 1 }}
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) void create()
          }}
        >
          <div className="field">
            <label htmlFor="project-name">Project name</label>
            <input id="project-name" className="input" data-autofocus value={name} maxLength={80} onChange={(e) => setName(e.target.value)} onFocus={(e) => e.currentTarget.select()} />
            <span className="hint">
              Starts from “{template.name}” · {template.format}, {template.canvas.width}×{template.canvas.height}px. The original template is never changed.
            </span>
          </div>
        </form>
      </div>
      {error && (
        <div className="msg msg--error" role="alert">
          {error}
        </div>
      )}
    </Dialog>
  )
}
