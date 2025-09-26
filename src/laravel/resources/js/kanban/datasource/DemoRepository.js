import { SnapshotStore } from './SnapshotStore';
import { BoardMetaNormalizer } from './BoardMetaNormalizer';
import { SeedProvider } from './SeedProvider';
import { ColumnSerializer } from './Serializers';

export class DemoRepository {
  constructor({ storage, storageKey, logger, factoryOrConfig }) {
    this.logger = logger;
    this.store = new SnapshotStore(storage, storageKey, logger);
    this.normalizer = new BoardMetaNormalizer();
    this.seeder = new SeedProvider(factoryOrConfig, this.normalizer);
  }

  ensureSeed() {
    const existing = this.store.read();
    if (existing && Array.isArray(existing.columns)) {
      const normalizedBoard = this.normalizer.normalize(existing.board || this.normalizer.defaultBoard());
      const dto = { board: normalizedBoard, columns: existing.columns };
      this.store.write(dto);
      return dto;
    }
    const seeded = this.seeder.seed();
    const dto = {
      board: seeded.board,
      columns: (seeded.columns || []).map(c => ColumnSerializer.toDTO(c))
    };
    this.store.write(dto);
    this.logger?.debug?.('Seeded board + columns from factory');
    return dto;
  }

  getBoardMeta() {
    const data = this.ensureSeed();
    const meta = data.board || this.normalizer.defaultBoard();
    this.logger?.debug?.('getBoardMeta ->', meta);
    return meta;
  }

  setBoardMeta(board) {
    const existing = this.store.read() || {};
    const dto = {
      board: board ? this.normalizer.normalize(board) : existing.board,
      columns: existing.columns || [],
    };
    this.store.write(dto);
    this.logger?.debug?.('setBoardMeta', dto.board);
  }

  getColumnsMeta() {
    const data = this.ensureSeed();
    const meta = data.columns.map(c => ({ id: c.id, name: c.name }));
    this.logger?.debug?.('getColumnsMeta ->', meta);
    return meta;
  }

  getTicketsByColumnId(columnId) {
    const data = this.ensureSeed();
    const col = data.columns.find(c => c.id === columnId);
    this.logger?.debug?.('getTicketsByColumnId', columnId, '->', col?.tickets);
    return Array.isArray(col?.tickets) ? col.tickets : [];
  }

  getColumnsDTO() {
    const data = this.ensureSeed();
    this.logger?.debug?.('getColumnsDTO ->', data.columns);
    return data.columns;
  }

  saveColumns(columnsDTO) {
    const existing = this.store.read() || {};
    const dto = {
      board: existing.board || this.normalizer.defaultBoard(),
      columns: (columnsDTO || []).map(c => ColumnSerializer.toDTO(c)),
    };
    this.store.write(dto);
    this.logger?.debug?.('save board+columns', dto);
  }
}
