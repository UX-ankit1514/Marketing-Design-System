import { useMemo, useState } from 'react'
import { AppHeader } from '../../components/layout/AppHeader'
import { Icon } from '../../components/common/Icon'
import { templateIssues, templates } from '../../lib/templates/registry'
import type { Template } from '../../types/template'
import { UploadTemplate } from '../upload/UploadTemplate'
import { NewProjectDialog } from './NewProjectDialog'
import { ProjectsList } from './ProjectsList'
import { TemplateCard } from './TemplateCard'

export default function TemplateLibrary() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('All')
  const [chosen, setChosen] = useState<Template | null>(null)
  const [uploading, setUploading] = useState(false)

  const categories = useMemo(() => ['All', ...Array.from(new Set(templates.map((t) => t.category)))], [])
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter((t) => (category === 'All' || t.category === category) && (!q || [t.name, t.category, t.format, ...t.tags].some((s) => s.toLowerCase().includes(q))))
  }, [query, category])

  return (
    <div className="library">
      <AppHeader>
        <button className="btn btn--secondary" onClick={() => setUploading(true)}>
          <Icon name="upload" /> Upload template
        </button>
      </AppHeader>

      <div className="library__hero">
        <div>
          <h1 className="library__title">Create New Design</h1>
          <p className="library__lead">Pick an approved Arnifi template, change the words and pictures, and download a finished post. No design tools needed.</p>
        </div>
        <button className="btn btn--primary btn--lg" onClick={() => setUploading(true)}>
          <Icon name="upload" /> Upload template
        </button>
      </div>

      <main className="library__section">
        <ProjectsList />

        <h2>Templates{templates.length ? ` (${templates.length})` : ''}</h2>
        <div className="filters" role="group" aria-label="Filter templates">
          <div className="search">
            <Icon name="search" />
            <input className="input" type="search" placeholder="Search templates" aria-label="Search templates" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {categories.map((c) => (
            <button key={c} className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>

        {templateIssues.length > 0 && (
          <div className="msg msg--error" role="alert" style={{ marginBottom: 16 }}>
            {templateIssues.length} template file(s) failed validation and are hidden: {templateIssues.map((i) => `${i.file} (${i.error})`).join('; ')}
          </div>
        )}

        {shown.length ? (
          <div className="grid">
            {shown.map((t) => (
              <TemplateCard key={t.id} template={t} onUse={setChosen} />
            ))}
          </div>
        ) : (
          <div className="empty">{templates.length ? 'No templates match your search.' : 'No templates are installed.'}</div>
        )}
      </main>

      {chosen && <NewProjectDialog template={chosen} onClose={() => setChosen(null)} />}
      {uploading && <UploadTemplate onClose={() => setUploading(false)} />}
    </div>
  )
}
