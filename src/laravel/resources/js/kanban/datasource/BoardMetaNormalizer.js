// BoardMetaNormalizer: normalizes board metadata (taxonomies, authors, name, backgroundImage)

function warn(msg, extra) {
  try { console.warn('[Kanban config]', msg, extra ?? ''); } catch {}
}

export class BoardMetaNormalizer {
  defaultBoard() {
    return { taxonomies: {}, authors: [] };
  }

  normalize(meta) {
    const src = meta?.taxonomies || {};
    const out = {};
    for (const [k, v] of Object.entries(src)) {
      if (v && typeof v === 'object' && (Array.isArray(v.options) || v.options instanceof Set)) {
        const arr = Array.isArray(v.options) ? v.options : Array.from(v.options);
        const norm = arr.map(o => (typeof o === 'object' && o && 'key' in o) ? o : { key: String(o), label: String(o) });
        out[k] = { label: v.label || k, options: norm };
      } else if (Array.isArray(v) || v instanceof Set) {
        const arr = Array.isArray(v) ? v : Array.from(v);
        const norm = arr.map(o => ({ key: String(o), label: String(o) }));
        out[k] = { label: k, options: norm };
      } else {
        warn(`Taxonomy '${k}' ignored: expected { options } or array, got`, v);
      }
    }
    const authors = Array.isArray(meta?.authors)
      ? meta.authors
          .filter(a => a && typeof a === 'object' && a.id && a.name)
          .map(a => ({ id: String(a.id), name: String(a.name), avatar: a.avatar ? String(a.avatar) : undefined }))
      : [];
    const board = { taxonomies: out, authors };
    if (typeof meta?.name === 'string' && meta.name.trim()) board.name = meta.name.trim();
    if (typeof meta?.backgroundImage === 'string' && meta.backgroundImage) board.backgroundImage = meta.backgroundImage;
    return board;
  }
}
