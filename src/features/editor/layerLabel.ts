import type { Layer } from '../../types/layer'

/** Text layers are named after what they currently say, like in a design tool. */
export const layerLabel = (l: Layer) => (l.type === 'text' ? l.text.replace(/\s+/g, ' ').trim().slice(0, 32) || '(empty text)' : l.name)
