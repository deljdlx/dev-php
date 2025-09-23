/**
 * @typedef {Object} TicketDTO
 * @property {string} id
 * @property {string} title
 * @property {('blue'|'green'|'orange'|null)} [label]
 * @property {number} createdAt
 */

class Ticket {
    /** @param {{ id?: string, title: string, label?: 'blue'|'green'|'orange'|null, createdAt?: number }} param0 */
    constructor({ id, title, label = null, createdAt = Date.now() }) {
        this.id = id ?? (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
        this.title = title;
        this.label = label; // blue|green|orange|null
        this.createdAt = createdAt;
    }
    /** @returns {TicketDTO} */
    toJSON() { return { id: this.id, title: this.title, label: this.label, createdAt: this.createdAt }; }
    /** @param {TicketDTO} dto */
    static fromJSON(dto) { return new Ticket(dto); }
}

export default Ticket;
