// SnapshotStore: read/write JSON snapshots to a storage under a key

export class SnapshotStore {
  constructor(storage, key, logger) {
    this.storage = storage;
    this.key = key;
    this.logger = logger;
  }

  read() {
    try {
      const raw = this.storage?.getItem?.(this.key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      this.logger?.debug?.('SnapshotStore.read parse error', e);
      return null;
    }
  }

  write(snapshot) {
    try {
      this.storage?.setItem?.(this.key, JSON.stringify(snapshot));
    } catch (e) {
      this.logger?.debug?.('SnapshotStore.write error', e);
    }
  }

  clear() {
    try { this.storage?.setItem?.(this.key, ''); } catch {}
  }
}
