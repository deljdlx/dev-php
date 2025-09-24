/**
 * @typedef {Object} TicketDTO
 * @property {string} id
 * @property {string} title
 * @property {('blue'|'green'|'orange'|null)} [label]
 * @property {('bug'|'feature'|'docs'|'chore'|null)} [category]
 * @property {string|null} [description]
 * @property {string|null} [author]
 * @property {number} createdAt
 */

class Ticket {
    /** @param {{ id?: string, title: string, label?: 'blue'|'green'|'orange'|null, category?: 'bug'|'feature'|'docs'|'chore'|null, description?: string|null, author?: string|null, createdAt?: number }} param0 */
    constructor({ id, title, label = null, category = null, description = null, author = null, createdAt = Date.now() }) {
        this.id = id ?? (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
        this.title = title;
        this.label = label; // blue|green|orange|null
        this.category = category; // bug|feature|docs|chore|null
        this.description = description ?? null;
        this.author = author ?? null;
        this.createdAt = createdAt;
    }
    /** @returns {TicketDTO} */
    toJSON() { return { id: this.id, title: this.title, label: this.label, category: this.category, description: this.description, author: this.author, createdAt: this.createdAt }; }
    /** @param {TicketDTO} dto */
    static fromJSON(dto) { return new Ticket(dto); }
}

export default Ticket;
