import { BoardMetaNormalizer } from './BoardMetaNormalizer';

export class SeedProvider {
  constructor(factoryOrConfig, normalizer = new BoardMetaNormalizer()) {
    this.factory = factoryOrConfig;
    this.normalizer = normalizer;
  }

  defaultBoard() { return this.normalizer.defaultBoard(); }

  seed() {
    let seededFromFactory = null;
    if (typeof this.factory === 'function') {
      try { seededFromFactory = this.factory(); } catch { /* ignore */ }
    } else if (this.factory && typeof this.factory === 'object') {
      seededFromFactory = this.factory;
    }
    if (Array.isArray(seededFromFactory)) {
      return { board: this.defaultBoard(), columns: seededFromFactory };
    } else if (seededFromFactory && typeof seededFromFactory === 'object') {
      const board = this.normalizer.normalize(seededFromFactory.board || this.defaultBoard());
      return { board, columns: seededFromFactory.columns || [] };
    }
    return { board: this.defaultBoard(), columns: [] };
  }
}
