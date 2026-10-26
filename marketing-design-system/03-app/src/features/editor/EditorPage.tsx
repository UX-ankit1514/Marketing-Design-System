import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppHeader } from '../../components/layout/AppHeader'
import { Icon } from '../../components/common/Icon'
import { ensureFonts } from '../../lib/canvas/fonts'
import { getProject } from '../../lib/storage/db'
import { ExportDialog } from '../export/ExportDialog'
import { EditorCanvas, type StudioHandle } from './EditorCanvas'
import { useEditor } from './editorStore'
import { LayersPanel } from './LayersPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { Toolbar } from './Toolbar'
import { useAutosave } from './useAutosave'
import { useShortcuts } from './useShortcuts'

type Phase = { state: 'loading' } | { state: 'ready' } | { state: 'missing' } | { state: 'error'; message: string }

export default function EditorPage() {
  const { projectId = '' } = useParams()
  const [phase, setPhase] = useState<Phase>({ state: 'loading' })
  const [dialog, setDialog] = useState<'Preview' | 'Export' | null>(null)
  const handle = useRef<StudioHandle | null>(null)
  const project = useEditor((s) => s.project)
  const missingFonts = useEditor((s) => s.missingFonts)
  const saveError = useEditor((s) => s.saveError)
  const status = useEditor((s) => s.saveStatus)
  const layerErrors = useEditor((s) => s.layerErrors)

  useEffect(() => {
    let cancelled = false
    setPhase({ state: 'loading' })
    getProject(projectId)
      .then(async (rec) => {
        if (cancelled) return
        if (!rec) return setPhase({ state: 'missing' })
        // Fonts must be loaded before the canvas measures any text, or wrapping and heights come out wrong.
        const missing = await ensureFonts(rec.project.fonts)
        if (cancelled) return
        useEditor.getState().load(rec.project)
        useEditor.getState().setMissingFonts(missing.map((f) => f.family))
        setPhase({ state: 'ready' })
      })
      .catch((e: Error) => !cancelled && setPhase({ state: 'error', message: e.message }))
    return () => {
      cancelled = true
    }
  }, [projectId])

  const ready = phase.state === 'ready' && project?.id === projectId
  useAutosave(handle)
  useShortcuts(handle, ready && !dialog)

  useEffect(() => {
    document.title = ready && project ? `${project.name} · Arnifi Marketing Studio` : 'Arnifi Marketing Studio'
  }, [ready, project?.name])

  if (phase.state === 'loading') return <div style={{ padding: 32 }}>Opening your design…</div>
  if (phase.state === 'missing' || phase.state === 'error') {
    return (
      <div className="library">
        <AppHeader />
        <div className="library__section" style={{ paddingTop: 48, maxWidth: 560 }}>
          <div className="msg msg--error" role="alert">
            {phase.state === 'missing' ? "We couldn't find that project in this browser. Projects are saved per browser, so it may have been deleted or created on another computer." : phase.message}
          </div>
          <p style={{ marginTop: 16 }}>
            <Link className="btn btn--primary" to="/">Back to templates</Link>
          </p>
        </div>
      </div>
    )
  }
  if (!ready || !project) return null

  return (
    <div className="editor" data-testid="editor">
      <Toolbar onPreview={() => setDialog('Preview')} onExport={() => setDialog('Export')} />
      <div className="desktop-note" role="note">
        <strong>Editing works best on a laptop or desktop.</strong>
        <span>This screen is too narrow to edit a poster comfortably. Open Arnifi Marketing Studio on a larger screen to change this design.</span>
        <Link className="btn btn--primary" to="/">Back to templates</Link>
      </div>
      <div className="workspace">
        <LayersPanel />
        <div style={{ position: 'relative', minWidth: 0, minHeight: 0, display: 'grid' }}>
          <div className="stage__banner" style={{ display: 'grid', gap: 8 }}>
            {missingFonts.length > 0 && (
              <div className="msg msg--warn" role="alert">
                <Icon name="warn" />
                <span>Font not available: {missingFonts.join(', ')}. Text may not match the original exactly.</span>
              </div>
            )}
            {Object.keys(layerErrors).length > 0 && (
              <div className="msg msg--error" role="alert" data-testid="missing-image-banner">
                <Icon name="warn" />
                <span>
                  {Object.keys(layerErrors).length} image{Object.keys(layerErrors).length > 1 ? 's' : ''} couldn't be loaded and {Object.keys(layerErrors).length > 1 ? 'are' : 'is'} shown as a red dashed box. Select it and use “Replace image”.
                </span>
              </div>
            )}
            {status === 'error' && (
              <div className="msg msg--error" role="alert" data-testid="save-error">
                <Icon name="warn" />
                <span>
                  Your latest changes weren't saved. {saveError} <button className="btn btn--sm btn--tertiary" onClick={() => useEditor.getState().touchProject()}>Try again</button>
                </span>
              </div>
            )}
          </div>
          <EditorCanvas handleRef={handle} />
        </div>
        <PropertiesPanel />
      </div>
      {dialog && <ExportDialog title={dialog} project={project} onClose={() => setDialog(null)} />}
    </div>
  )
}
