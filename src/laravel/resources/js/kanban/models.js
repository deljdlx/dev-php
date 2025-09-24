/**
 * @typedef {Object} TicketDTO
 * @property {string} id
 * @property {string} title
 * @property {('blue'|'green'|'orange'|null)} [label]
 * @property {('bug'|'feature'|'docs'|'chore'|null)} [category]
 * @property {number} createdAt
 */

export class Ticket {
    /** @param {{ id?: string, title: string, label?: 'blue'|'green'|'orange'|null, category?: 'bug'|'feature'|'docs'|'chore'|null, createdAt?: number }} param0 */
    constructor({ id, title, label = null, category = null, createdAt = Date.now() }) {
        this.id = id ?? (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
        this.title = title;
        this.label = label; // blue|green|orange|null
        this.category = category; // bug|feature|docs|chore|null
        this.createdAt = createdAt;
    }
    /** @returns {TicketDTO} */
    toJSON() { return { id: this.id, title: this.title, label: this.label, category: this.category, createdAt: this.createdAt }; }
    /** @param {TicketDTO} dto */
    static fromJSON(dto) { return new Ticket(dto); }
}

/**
 * @typedef {Object} ColumnDTO
 * @property {string} id
 * @property {string} name
 * @property {TicketDTO[]} [tickets]
 */

export class Column {
    /** @param {{ id: string, name: string, tickets?: (Ticket[]|TicketDTO[]) }} param0 */
    constructor({ id, name, tickets = [] }) {
        this.id = id; // e.g. todo, doing, review, done
        this.name = name;
        this.tickets = tickets.map(t => t instanceof Ticket ? t : new Ticket(t));
    }
    /** @returns {ColumnDTO} */
    toJSON() { return { id: this.id, name: this.name, tickets: this.tickets.map(t => t.toJSON()) }; }
    /** @param {ColumnDTO} dto */
    static fromJSON(dto) { return new Column({ id: dto.id, name: dto.name, tickets: (dto.tickets||[]).map(Ticket.fromJSON) }); }
}
