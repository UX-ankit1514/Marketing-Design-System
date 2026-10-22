import { getAsset } from './db'

const urls = new Map<string, Promise<string>>()

/** `idb:<id>` -> object URL (cached). Template assets are plain paths and pass straight through. */
export function resolveSrc(src: string): Promise<string> | string {
  if (!src.startsWith('idb:')) return src
  const id = src.slice(4)
  let p = urls.get(id)
  if (!p) {
    p = getAsset(id).then((rec) => {
      if (!rec) throw new Error('An uploaded image is missing from this browser. Re-upload it from the properties panel.')
      return URL.createObjectURL(rec.blob)
    })
    urls.set(id, p)
    p.catch(() => urls.delete(id))
  }
  return p
}

/** Registers a freshly uploaded blob so it can be shown immediately. */
export function primeAsset(id: string, blob: Blob) {
  urls.set(id, Promise.resolve(URL.createObjectURL(blob)))
}
