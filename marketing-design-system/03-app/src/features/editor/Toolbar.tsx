import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Dialog } from '../../components/common/Dialog'
import { Icon } from '../../components/common/Icon'
import { projectToFile } from '../../lib/storage/projectFile'
import { downloadBlob, slug } from '../../lib/export/exportService'
import { canRedo, canUndo, useEditor } from './editorStore'

const STATUS: Record<string, string> = { idle: '', saving: 'Saving…', saved: 'Saved on this computer', error: 'Not saved' }

export function Toolbar({ onPreview, onExport }: { onPreview: () => void; onExport: () => void }) {
  const project = useEditor((s) => s.project)!
  const undoable = useEditor(canUndo)
  const redoable = useEditor(canRedo)
  const status = useEditor((s) => s.saveStatus)
  const [confirmReset, setConfirmReset] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const { undo, redo, rename, resetAll } = useEditor.getState()

  async function saveFile() {
    setFileError(null)
    try {
      const file = await projectToFile(useEditor.getState().project!)
      downloadBlob(new Blob([JSON.stringify(file)], { type: 'application/json' }), `arnifi-${slug(project.name)}.project.json`)
    } catch (e) {
      setFileError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <>
      <div className="toolbar" role="toolbar" aria-label="Editor toolbar">
        <Link to="/" className="btn btn--ghost" title="Back to the template library">
          <Icon name="back" /> Templates
        </Link>
        <span className="toolbar__sep" />
        <label className="sr-only" htmlFor="project-name-input">Project name</label>
        <input id="project-name-input" className="input toolbar__name" value={project.name} maxLength={80} onChange={(e) => rename(e.target.value)} />
        <span className="toolbar__spacer" />
        <span className="save-status" data-s={status} role="status" aria-live="polite" data-testid="save-status">
          {STATUS[status]}
        </span>
        <span className="toolbar__sep" />
        <button className="btn btn--ghost btn--icon" onClick={undo} disabled={!undoable} aria-label="Undo" title="Undo (Ctrl/Cmd+Z)" data-testid="undo">
          <Icon name="undo" />
        </button>
        <button className="btn btn--ghost btn--icon" onClick={redo} disabled={!redoable} aria-label="Redo" title="Redo (Ctrl/Cmd+Shift+Z)" data-testid="redo">
          <Icon name="redo" />
        </button>
        <button className="btn btn--ghost" onClick={() => setConfirmReset(true)} data-testid="reset-template">
          <Icon name="reset" /> Reset template
        </button>
        <button className="btn btn--ghost" onClick={saveFile} title="Download an editable project file you can reopen later">
          <Icon name="save" /> Save file
        </button>
        <span className="toolbar__sep" />
        <button className="btn btn--tertiary" onClick={onPreview} data-testid="preview-button">
          <Icon name="eye" /> Preview
        </button>
        <button className="btn btn--primary" onClick={onExport} data-testid="export-button">
          <Icon name="download" /> Export
        </button>
      </div>

      {confirmReset && (
        <Dialog
          title="Reset to the original template?"
          onClose={() => setConfirmReset(false)}
          footer={
            <>
              <button className="btn btn--tertiary" onClick={() => setConfirmReset(false)}>
                Keep my edits
              </button>
              <button
                className="btn btn--danger"
                data-testid="confirm-reset"
                onClick={() => {
                  resetAll()
                  setConfirmReset(false)
                }}
              >
                Reset template
              </button>
            </>
          }
        >
          <p>All text, image, position and visibility changes in this design go back to the original. Your other projects aren't affected, and you can still undo this.</p>
        </Dialog>
      )}
      {fileError && (
        <Dialog title="Couldn't save the file" onClose={() => setFileError(null)}>
          <div className="msg msg--error" role="alert">{fileError}</div>
        </Dialog>
      )}
    </>
  )
}
