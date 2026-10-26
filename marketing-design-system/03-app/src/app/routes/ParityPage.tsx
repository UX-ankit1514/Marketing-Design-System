import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ensureFonts } from '../../lib/canvas/fonts'
import { renderStatic } from '../../lib/canvas/staticRender'
import { getTemplate } from '../../lib/templates/registry'

/** Dev/QA page: draws a template 1:1 on a bare canvas so it can be pixel-compared with its Figma reference. */
export default function ParityPage() {
  const { templateId = '' } = useParams()
  const host = useRef<HTMLDivElement>(null)
  const [info, setInfo] = useState<{ state: string; missing: string; failures: string }>({ state: 'loading', missing: '', failures: '' })
  const t = getTemplate(templateId)
  useEffect(() => {
    if (!t || !host.current) return
    // Fabric refuses to init twice on one element (StrictMode runs effects twice), so own the element per run.
    const el = document.createElement('canvas')
    host.current.appendChild(el)
    let disposed = false
    let dispose: (() => void) | undefined
    ;(async () => {
      const missing = await ensureFonts(t.fonts)
      const { canvas, failures } = await renderStatic(t, (s) => s, el)
      dispose = () => void canvas.dispose()
      if (disposed) return dispose()
      setInfo({ state: 'ready', missing: missing.map((f) => f.family).join(','), failures: failures.map((f) => `${f.layerId}:${f.error}`).join('|') })
    })()
    return () => {
      disposed = true
      dispose?.()
      el.remove()
    }
  }, [t])
  if (!t) return <p>Unknown template {templateId}</p>
  return (
    <div ref={host} style={{ background: '#fff', width: t.canvas.width, height: t.canvas.height, overflow: 'hidden' }} data-state={info.state} data-missing-fonts={info.missing} data-failures={info.failures} id="parity-root" />
  )
}
