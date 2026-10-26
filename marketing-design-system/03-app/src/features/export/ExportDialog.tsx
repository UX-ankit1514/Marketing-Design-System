import { useEffect, useState } from 'react'
import { Dialog } from '../../components/common/Dialog'
import { Icon } from '../../components/common/Icon'
import { downloadBlob, exportFileName, exportProject, type ExportFormat } from '../../lib/export/exportService'
import type { Project } from '../../types/project'

interface Props {
  project: Project
  title: 'Preview' | 'Export'
  onClose: () => void
}

/** Clean render of the poster (no handles, hidden layers gone) at its true pixel size, with PNG/JPG download. */
export function ExportDialog({ project, title, onClose }: Props) {
  const [format, setFormat] = useState<ExportFormat>('png')
  const [quality, setQuality] = useState(92)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    let url: string | undefined
    let cancelled = false
    exportProject(project, 'png')
      .then((r) => {
        if (cancelled) return
        url = URL.createObjectURL(r.blob)
        setPreviewUrl(url)
        setWarnings(r.missingFonts.length ? [`These fonts aren't installed, so the text may not match the original exactly: ${r.missingFonts.join(', ')}.`] : [])
      })
      .catch((e: Error) => !cancelled && setPreviewError(e.message))
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [project])

  async function download() {
    setBusy(true)
    setError(null)
    setDone(null)
    try {
      const r = await exportProject(project, format, quality / 100)
      downloadBlob(r.blob, r.fileName)
      setDone(`${r.fileName} (${r.width}×${r.height}px, ${(r.blob.size / 1048576).toFixed(2)} MB) was downloaded.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      title={title === 'Export' ? 'Export your design' : 'Preview'}
      onClose={onClose}
      wide
      busy={busy}
      footer={
        <>
          <button className="btn btn--tertiary" onClick={onClose} disabled={busy}>
            Back to editing
          </button>
          <button className="btn btn--primary" onClick={download} disabled={busy || !!previewError} data-testid="download-button" data-autofocus={title === 'Export' ? true : undefined}>
            <Icon name="download" /> {busy ? 'Preparing…' : error ? 'Try again' : `Download ${format.toUpperCase()}`}
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 260px', gap: 24 }}>
        <div className="preview" data-testid="preview">
          {previewUrl ? <img src={previewUrl} alt={`Preview of ${project.name}`} /> : previewError ? <div className="msg msg--error" role="alert">{previewError}</div> : <span className="hint">Preparing preview…</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <span className="label" id="fmt-label">Format</span>
            <div className="seg" role="group" aria-labelledby="fmt-label">
              <button aria-pressed={format === 'png'} onClick={() => setFormat('png')}>PNG</button>
              <button aria-pressed={format === 'jpg'} onClick={() => setFormat('jpg')}>JPG</button>
            </div>
            <span className="hint">{format === 'png' ? 'Lossless. Best for text and logos.' : 'Smaller file. Best for photos.'}</span>
          </div>
          {format === 'jpg' && (
            <div className="field">
              <label htmlFor="jpg-quality">JPG quality</label>
              <div className="slider">
                <input id="jpg-quality" type="range" min={60} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} />
                <span className="hint" style={{ textAlign: 'right' }}>{quality}%</span>
              </div>
            </div>
          )}
          <div className="field">
            <span className="label">Output size</span>
            <strong data-testid="output-size">{project.canvas.width} × {project.canvas.height} px</strong>
            <span className="hint">The original size of the template, at any screen size.</span>
          </div>
          <div className="field">
            <span className="label">File name</span>
            <span style={{ wordBreak: 'break-all', fontSize: 13 }}>{exportFileName(project, format)}</span>
          </div>
          {warnings.map((w) => <div key={w} className="msg msg--warn"><Icon name="warn" />{w}</div>)}
          {error && <div className="msg msg--error" role="alert" data-testid="export-error"><Icon name="warn" /><span>Export failed. {error}</span></div>}
          {done && <div className="msg msg--info" role="status" data-testid="export-done"><Icon name="check" />{done}</div>}
        </div>
      </div>
    </Dialog>
  )
}
