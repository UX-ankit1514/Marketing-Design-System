import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '../../components/common/Icon'
import { Studio } from '../../lib/canvas/studio'
import { resolveSrc } from '../../lib/storage/assets'
import { useEditor } from './editorStore'

export interface StudioHandle {
  thumbnail: () => string | undefined
  fit: () => void
  zoomBy: (f: number) => void
}

const STAGE_PAD = 48 // 24px viewport padding on each side

export function EditorCanvas({ handleRef }: { handleRef: React.RefObject<StudioHandle | null> }) {
  const stage = useRef<HTMLDivElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const studio = useRef<Studio | null>(null)
  const [fitZoom, setFitZoom] = useState(0.5)
  const [manual, setManual] = useState<number | null>(null)
  const [ready, setReady] = useState(false)
  const project = useEditor((s) => s.project)!
  const selectedId = useEditor((s) => s.selectedId)
  const { width, height, background } = project.canvas
  const zoom = manual ?? fitZoom

  // Fit-to-screen: the poster keeps its aspect ratio; only the on-screen scale changes, never the output size.
  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      setFitZoom(Math.max(0.1, Math.min((r.width - STAGE_PAD) / width, (r.height - STAGE_PAD) / height, 1)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [width, height])

  // One Fabric instance for the lifetime of the editor. It owns its own <canvas> so StrictMode remounts are safe.
  useEffect(() => {
    const el = document.createElement('canvas')
    host.current!.appendChild(el)
    const s = new Studio(el, { width, height, background }, resolveSrc, {
      onSelect: (id) => useEditor.getState().select(id),
      onGeometry: (id, patch) => useEditor.getState().patch(id, patch, { coalesce: `geo:${id}` }),
      onTextEdited: (id, text) => useEditor.getState().setText(id, text),
      onErrors: (e) => useEditor.getState().setLayerErrors(e),
    })
    studio.current = s
    s.sync(useEditor.getState().project!.layers).then(() => setReady(true))
    return () => {
      studio.current = null
      s.dispose()
      el.remove()
      setReady(false)
    }
    // The canvas is created once per project; later changes flow through sync().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id])

  useEffect(() => {
    studio.current?.setMeta({ width, height, background })
    studio.current?.setZoom(zoom)
  }, [zoom, width, height, background, ready])

  useEffect(() => {
    void studio.current?.sync(project.layers)
  }, [project.layers])

  // Clicking outside the poster ends in-place text editing (Fabric only notices clicks on its own canvas).
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (host.current && !host.current.contains(e.target as Node)) studio.current?.exitEditing()
    }
    window.addEventListener('pointerdown', onDown, true)
    return () => window.removeEventListener('pointerdown', onDown, true)
  }, [])

  useEffect(() => {
    studio.current?.select(selectedId)
  }, [selectedId, ready])

  useEffect(() => {
    handleRef.current = {
      thumbnail: () => studio.current?.thumbnail(),
      fit: () => setManual(null),
      zoomBy: (f) => setManual((m) => Math.min(4, Math.max(0.1, (m ?? fitZoom) * f))),
    }
  })

  return (
    <div className="stage" data-testid="stage">
      <div className="stage__viewport" ref={stage}>
        <div className="stage__canvas" ref={host} role="group" style={{ width: width * zoom, height: height * zoom }} aria-label={`Poster canvas, ${width} by ${height} pixels`} />
      </div>
      <div className="stage__zoom" role="group" aria-label="Zoom">
        <button className="btn btn--ghost btn--sm btn--icon" onClick={() => handleRef.current?.zoomBy(1 / 1.25)} aria-label="Zoom out">
          <Icon name="minus" />
        </button>
        <span data-testid="zoom-label">{Math.round(zoom * 100)}%</span>
        <button className="btn btn--ghost btn--sm btn--icon" onClick={() => handleRef.current?.zoomBy(1.25)} aria-label="Zoom in">
          <Icon name="plus" />
        </button>
        <button className="btn btn--ghost btn--sm btn--icon" onClick={() => setManual(null)} aria-label="Fit to screen" title="Fit to screen">
          <Icon name="fit" />
        </button>
      </div>
    </div>
  )
}
