import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog } from '../../components/common/Dialog'
import { Icon } from '../../components/common/Icon'
import { createProjectFromImage, readImageSize } from '../../lib/templates/instantiate'
import { saveProject } from '../../lib/storage/db'
import { projectFromText } from '../../lib/storage/projectFile'
import { classifyFile, imageProblem, SUPPORTED_TEXT } from '../../lib/upload/validate'
import type { Project } from '../../types/project'

type Picked =
  | { kind: 'image'; file: File; w: number; h: number }
  | { kind: 'project'; project: Project }

export function UploadTemplate({ onClose }: { onClose: () => void }) {
  const nav = useNavigate()
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [picked, setPicked] = useState<Picked | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function pick(file: File | undefined) {
    if (!file) return
    setError(null)
    setPicked(null)
    const kind = classifyFile(file)
    try {
      if (kind === 'unsupported') throw new Error(`"${file.name}" isn't a supported file. Supported: ${SUPPORTED_TEXT}`)
      if (kind === 'image') {
        const problem = imageProblem(file)
        if (problem) throw new Error(problem)
        const { width, height } = await readImageSize(file)
        setPicked({ kind: 'image', file, w: width, h: height })
        setName(file.name.replace(/\.[^.]+$/, ''))
      } else {
        const project = await projectFromText(await file.text())
        setPicked({ kind: 'project', project })
        setName(project.name)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  async function create() {
    if (!picked) return
    setBusy(true)
    setError(null)
    try {
      let p: Project
      if (picked.kind === 'image') p = await createProjectFromImage(picked.file, name)
      else p = { ...picked.project, name: name.trim() || picked.project.name, updatedAt: Date.now() }
      await saveProject({ id: p.id, name: p.name, templateId: p.templateId, updatedAt: p.updatedAt, project: p })
      nav(`/edit/${p.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  return (
    <Dialog
      title="Upload a template"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button className="btn btn--tertiary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={create} disabled={busy || !picked || !name.trim()}>
            {busy ? 'Opening…' : 'Open in editor'}
          </button>
        </>
      }
    >
      <div
        className="dropzone"
        data-over={over}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          void pick(e.dataTransfer.files[0])
        }}
      >
        <Icon name="upload" style={{ width: 28, height: 28 }} />
        <strong>Drop a file here</strong>
        <span className="hint">{SUPPORTED_TEXT}</span>
        <button className="btn btn--tertiary btn--sm" onClick={() => input.current?.click()}>
          Choose a file
        </button>
        <input ref={input} type="file" accept=".png,.jpg,.jpeg,.webp,.json,image/png,image/jpeg,image/webp,application/json" className="sr-only" aria-label="Choose a template file" data-testid="upload-input" onChange={(e) => void pick(e.target.files?.[0])} />
      </div>

      {error && (
        <div className="msg msg--error" role="alert" data-testid="upload-error">
          {error}
        </div>
      )}

      {picked?.kind === 'image' && (
        <div className="msg msg--info" role="status">
          Image detected ({picked.w}×{picked.h}px). It becomes a flat background: you can add text, images and logos on top, but text that is part of the picture can't be edited.
        </div>
      )}
      {picked?.kind === 'project' && (
        <div className="msg msg--info" role="status">
          Project file detected. All of its layers stay editable.
        </div>
      )}
      {picked && (
        <div className="field">
          <label htmlFor="upload-name">Project name</label>
          <input id="upload-name" className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </div>
      )}
    </Dialog>
  )
}
