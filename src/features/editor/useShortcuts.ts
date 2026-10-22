import { useEffect } from 'react'
import type { StudioHandle } from './EditorCanvas'
import { useEditor } from './editorStore'

const typing = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
}

export function useShortcuts(handle: React.RefObject<StudioHandle | null>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      const s = useEditor.getState()
      if (mod && e.key.toLowerCase() === 'z') {
        if (typing(e.target) && (e.target as HTMLElement).tagName !== 'BODY') return // let fields keep their own undo
        e.preventDefault()
        if (e.shiftKey) s.redo()
        else s.undo()
        return
      }
      if (mod && e.key.toLowerCase() === 'y') {
        if (typing(e.target)) return
        e.preventDefault()
        s.redo()
        return
      }
      if (typing(e.target)) return
      if (mod && (e.key === '0' || e.key === '=' || e.key === '+' || e.key === '-')) {
        e.preventDefault()
        if (e.key === '0') handle.current?.fit()
        else handle.current?.zoomBy(e.key === '-' ? 1 / 1.25 : 1.25)
        return
      }
      const id = s.selectedId
      const layer = s.project?.layers.find((l) => l.id === id)
      if (e.key === 'Escape') return s.select(null)
      if (!layer) return
      if (e.key.startsWith('Arrow')) {
        e.preventDefault()
        const d = e.shiftKey ? 10 : 1
        const dx = e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0
        const dy = e.key === 'ArrowUp' ? -d : e.key === 'ArrowDown' ? d : 0
        s.patch(layer.id, { x: layer.x + dx, y: layer.y + dy }, { coalesce: `nudge:${layer.id}` })
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (layer.flags.includes('added')) {
          e.preventDefault()
          s.deleteAdded(layer.id)
        } else if (layer.type !== 'text' && layer.role !== 'photo') {
          e.preventDefault()
          s.setRemoved(layer.id, true)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handle, enabled])
}
