import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { parseProject } from '../validation'
import type { Project } from '../../types/project'

export interface ProjectRecord {
  id: string
  name: string
  templateId: string
  updatedAt: number
  /** Small preview (data URL) for the "Your projects" list. */
  thumb?: string
  project: Project
}

export interface AssetRecord {
  id: string
  name: string
  type: string
  blob: Blob
  createdAt: number
}

interface StudioDB extends DBSchema {
  projects: { key: string; value: ProjectRecord; indexes: { 'by-updated': number } }
  assets: { key: string; value: AssetRecord }
}

let dbPromise: Promise<IDBPDatabase<StudioDB>> | undefined

function db() {
  dbPromise ??= openDB<StudioDB>('arnifi-marketing-studio', 1, {
    upgrade(d) {
      d.createObjectStore('projects', { keyPath: 'id' }).createIndex('by-updated', 'updatedAt')
      d.createObjectStore('assets', { keyPath: 'id' })
    },
  })
  return dbPromise
}

/** Wraps any storage failure in a message a person can act on. */
export class StorageError extends Error {
  constructor(action: string, cause: unknown) {
    const why = cause instanceof DOMException && cause.name === 'QuotaExceededError' ? 'The browser storage is full.' : cause instanceof Error ? cause.message : String(cause)
    super(`Couldn't ${action}. ${why}`)
    this.name = 'StorageError'
  }
}

async function guard<T>(action: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    throw new StorageError(action, e)
  }
}

export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`

export const saveProject = (rec: ProjectRecord) => guard('save your project', async () => void (await (await db()).put('projects', rec)))

export const getProject = (id: string) =>
  guard('open your project', async () => {
    const rec = await (await db()).get('projects', id)
    if (!rec) return undefined
    const p = parseProject(rec.project)
    if (!p.ok) throw new Error(`Saved project is damaged (${p.error}).`)
    return { ...rec, project: p.value }
  })

export const listProjects = () =>
  guard('list your projects', async () => {
    const all = await (await db()).getAllFromIndex('projects', 'by-updated')
    return all.reverse().map(({ project: _p, ...meta }) => meta)
  })

export const deleteProject = (id: string) => guard('delete the project', async () => void (await (await db()).delete('projects', id)))

export const putAsset = (file: Blob, name: string) =>
  guard('store the image', async () => {
    const id = newId('asset')
    await (await db()).put('assets', { id, name, type: file.type, blob: file, createdAt: Date.now() })
    return id
  })

export const getAsset = (id: string) => guard('read the image', async () => (await db()).get('assets', id))
