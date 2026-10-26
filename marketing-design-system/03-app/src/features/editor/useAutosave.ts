import { useEffect, useRef } from 'react'
import { saveProject } from '../../lib/storage/db'
import type { StudioHandle } from './EditorCanvas'
import { useEditor } from './editorStore'

/** Saves the working copy shortly after every change, and again when the tab is hidden or closed. */
export function useAutosave(handle: React.RefObject<StudioHandle | null>) {
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => {
    let last = useEditor.getState().project
    const save = async () => {
      const { project, setSaveStatus } = useEditor.getState()
      if (!project) return
      setSaveStatus('saving')
      try {
        await saveProject({ id: project.id, name: project.name, templateId: project.templateId, updatedAt: project.updatedAt, thumb: handle.current?.thumbnail(), project })
        useEditor.getState().setSaveStatus('saved')
      } catch (e) {
        useEditor.getState().setSaveStatus('error', e instanceof Error ? e.message : String(e))
      }
    }
    const unsub = useEditor.subscribe((s) => {
      if (s.project && s.project !== last && s.project.id === last?.id) {
        last = s.project
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => void save(), 600)
      } else if (s.project && s.project.id !== last?.id) {
        last = s.project
      }
    })
    const flush = () => {
      if (timer.current) {
        window.clearTimeout(timer.current)
        timer.current = undefined
        void save()
      }
    }
    document.addEventListener('visibilitychange', flush)
    window.addEventListener('pagehide', flush)
    return () => {
      unsub()
      flush()
      document.removeEventListener('visibilitychange', flush)
      window.removeEventListener('pagehide', flush)
    }
  }, [handle])
  return { retry: () => useEditor.getState().setSaveStatus('idle') }
}
