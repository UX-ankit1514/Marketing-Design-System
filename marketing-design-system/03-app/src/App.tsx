import { lazy, Suspense } from 'react'
import { createBrowserRouter, Link, RouterProvider } from 'react-router-dom'
import TemplateLibrary from './features/templates/TemplateLibrary'

const Editor = lazy(() => import('./features/editor/EditorPage'))
const Parity = lazy(() => import('./app/routes/ParityPage'))

const NotFound = () => (
  <div style={{ padding: 48 }}>
    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32 }}>That page doesn't exist</h1>
    <p style={{ margin: '12px 0 24px' }}>The link may be old or mistyped.</p>
    <Link className="btn btn--primary" to="/">Back to templates</Link>
  </div>
)

const router = createBrowserRouter([
  { path: '/', element: <TemplateLibrary /> },
  { path: '/edit/:projectId', element: <Suspense fallback={<div style={{ padding: 32 }}>Opening the editor…</div>}><Editor /></Suspense> },
  { path: '/dev/parity/:templateId', element: <Suspense fallback={null}><Parity /></Suspense> },
  { path: '*', element: <NotFound /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
