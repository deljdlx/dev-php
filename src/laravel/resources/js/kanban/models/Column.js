/**
 * @typedef {Object} ColumnDTO
 * @property {string} id
 * @property {string} name
 * @property {import('./Ticket').default[]} [tickets]
 */

import Ticket from './Ticket';

class Column {
    /** @param {{ id: string, name: string, tickets?: (Ticket[]|any[]) }} param0 */
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

export default Column;
