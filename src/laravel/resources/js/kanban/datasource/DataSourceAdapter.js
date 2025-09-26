import Column from '../models/Column';
import { DemoRepository } from './DemoRepository';

// Keeps public API compatible with existing callers
export class DemoDataSourceAdapter {
  constructor(factoryOrConfig, storageKey = 'demo.kanban.v1', logger = null, storage) {
    this.repo = new DemoRepository({ factoryOrConfig, storageKey, logger, storage });
    this.logger = logger;
  }

  async getColumns() {
    // Legacy: return Column model instances
    const dtos = this.repo.getColumnsDTO();
    this.logger?.debug?.('getColumns ->', dtos);
    return dtos.map(c => Column.fromJSON(c));
  }

  async getBoardMeta() {
    const meta = this.repo.getBoardMeta();
    return meta;
  }

  async getColumnsMeta() {
    return this.repo.getColumnsMeta();
  }

  async getTicketsByColumnId(columnId) {
    return this.repo.getTicketsByColumnId(columnId);
  }

  async save(columns) {
    // Accepts Column models or DTOs
    this.repo.saveColumns(columns);
  }

  async setBoardMeta(board) {
    this.repo.setBoardMeta(board);
  }
}
