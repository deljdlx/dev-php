import '../bootstrap';
import '../../css/kanban.css';
import KanbanState from './models/KanbanState';
import { DemoDataSource } from './datasource';
import createLogger from './utils/createLogger';
import { KanbanView } from './view';

/**
 * Initialize the Kanban with a plain config object.
 * @param {HTMLElement} root
 * @param {{ board: { taxonomies: Record<string,{label:string,options:Array<{key:string,label:string}>}> }, columns: Array<{id:string,name:string,tickets?:any[]}> }} config
 * @param {{ storageKey?: string, persistDebounceMs?: number, loggerName?: string }} [options]
 */
export async function initKanban(root, config, options = {}) {
  if (!root || !config) return null;
  const logger = createLogger(options.loggerName || 'Kanban');
  const storageKey = options.storageKey || 'demo.kanban.v6';
  const dataSource = new DemoDataSource(config, storageKey, logger);
  const state = new KanbanState(dataSource, { logger, persistDebounceMs: options.persistDebounceMs });
  await state.load();
  const view = new KanbanView(root, state, logger);
  return { state, view };
}

export default initKanban;
