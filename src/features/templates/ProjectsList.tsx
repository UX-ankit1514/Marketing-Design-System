import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/common/Icon'
import { deleteProject, getProject, listProjects, newId, saveProject, type ProjectRecord } from '../../lib/storage/db'

type Meta = Omit<ProjectRecord, 'project'>

const when = (t: number) => new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export function ProjectsList() {
  const [items, setItems] = useState<Meta[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)

  const refresh = () =>
    listProjects()
      .then(setItems)
      .catch((e: Error) => setError(e.message))
  useEffect(() => {
    void refresh()
  }, [])

  async function duplicate(id: string) {
    try {
      const rec = await getProject(id)
      if (!rec) return
      const copy = { ...rec.project, id: newId('project'), name: `${rec.project.name} copy`, createdAt: Date.now(), updatedAt: Date.now() }
      await saveProject({ id: copy.id, name: copy.name, templateId: copy.templateId, updatedAt: copy.updatedAt, thumb: rec.thumb, project: copy })
      await refresh()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function remove(id: string) {
    try {
      await deleteProject(id)
      setConfirm(null)
      await refresh()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (error)
    return (
      <div className="msg msg--error" role="alert">
        {error}
      </div>
    )
  if (!items?.length) return null
  return (
    <section aria-labelledby="your-projects">
      <h2 id="your-projects">Your projects</h2>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
        {items.map((p) => (
          <div className="card" key={p.id} data-testid="project-card">
            <Link to={`/edit/${p.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="card__thumb" style={{ display: 'block', minHeight: 80 }}>
                {p.thumb ? <img src={p.thumb} alt="" /> : <span className="card__error" style={{ color: 'var(--dusk-700)', background: 'none' }}>No preview yet</span>}
              </span>
              <span>
                <span className="card__name" style={{ display: 'block' }}>
                  {p.name}
                </span>
                <span className="card__meta">{when(p.updatedAt)}</span>
              </span>
            </Link>
            {confirm === p.id ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="hint">Delete this project?</span>
                <button className="btn btn--danger btn--sm" onClick={() => remove(p.id)}>
                  Delete
                </button>
                <button className="btn btn--tertiary btn--sm" onClick={() => setConfirm(null)}>
                  Keep
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn--tertiary btn--sm" onClick={() => duplicate(p.id)}>
                  <Icon name="copy" /> Duplicate
                </button>
                <button className="btn btn--ghost btn--sm btn--icon" onClick={() => setConfirm(p.id)} aria-label={`Delete ${p.name}`}>
                  <Icon name="trash" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
