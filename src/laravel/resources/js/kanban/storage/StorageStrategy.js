/**
 * StorageStrategy interface (duck-typed):
 * - getItem(key): string|null
 * - setItem(key, value): void
 * - removeItem(key): void
 * - has(key): boolean
 */
export class LocalStorageStrategy {
  constructor(area = (typeof window !== 'undefined' ? window.localStorage : null)) {
    this.area = area;
  }
  getItem(key) {
    try { return this.area?.getItem?.(key) ?? null; } catch { return null; }
  }
  setItem(key, value) {
    try { this.area?.setItem?.(key, value); } catch {}
  }
  removeItem(key) {
    try { this.area?.removeItem?.(key); } catch {}
  }
  has(key) {
    try { return this.getItem(key) !== null; } catch { return false; }
  }
}

export class MemoryStorageStrategy {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
  has(key) { return this.map.has(key); }
}

export function createDefaultStorage() {
  try {
    const test = new LocalStorageStrategy();
    const k = '__kv_test__' + Math.random().toString(36).slice(2);
    test.setItem(k, '1');
    const ok = test.getItem(k) === '1';
    test.removeItem(k);
    if (ok) return test;
  } catch {}
  return new MemoryStorageStrategy();
}
