/**
 * Beginner-friendly contracts (no runtime code). Import in JSDoc only:
 *   @typedef {import('../types/contracts').ModalService} ModalService
 *
 * These typedefs help understand what each service exposes.
 */

/**
 * @typedef {Object} ModalService
 * @property {(options: { title?: string, body?: HTMLElement|string, footer?: HTMLElement|string, onClose?: () => void }) => { close: () => void }} open
 */

/**
 * @typedef {Object} Logger
 * @property {(msg: string, data?: any) => void} [debug]
 * @property {(msg: string, data?: any) => void} [info]
 * @property {(msg: string, data?: any) => void} [error]
 */

/**
 * DataSource expected by KanbanState. Replace with your own (API, localStorage, ...).
 * @typedef {Object} DataSource
 * @property {() => Promise<any[]>} getColumns - Returns full columns when meta endpoints are not available.
 * @property {() => Promise<Array<{ id: string, name: string }>>} [getColumnsMeta]
 * @property {(columnId: string) => Promise<any[]>} [getTicketsByColumnId]
 * @property {(board: any) => Promise<void>} [setBoardMeta]
 * @property {(columns: any[]) => Promise<void>} save
 */

export {}; // ensure this is a module (no globals)
