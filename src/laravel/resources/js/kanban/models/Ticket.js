/**
 * @typedef {Object} TicketDTO
 * @property {string} id
 * @property {string} title
 * @property {('blue'|'green'|'orange'|null)} [label]
 * @property {('bug'|'feature'|'docs'|'chore'|null)} [category]
 * @property {string|null} [description]
 * @property {string|null} [author]
 * @property {('xs'|'s'|'m'|'l'|'xl'|null)} [complexity]
 * @property {Record<string,string|null>} [taxonomies]
 * @property {number} createdAt
 */

class Ticket {
    /** @param {{ id?: string, title: string, label?: 'blue'|'green'|'orange'|null, category?: 'bug'|'feature'|'docs'|'chore'|null, description?: string|null, author?: string|null, complexity?: 'xs'|'s'|'m'|'l'|'xl'|null, taxonomies?: Record<string,string|null>, createdAt?: number }} param0 */
    constructor({ id, title, label = null, category = null, description = null, author = null, complexity = null, taxonomies = undefined, createdAt = Date.now() }) {
        this.id = id ?? (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
        this.title = title;
        this.label = label; // legacy shim
        this.category = category; // legacy shim
        this.description = description ?? null;
        this.author = author ?? null;
        this.complexity = complexity ?? null; // legacy shim
        this.taxonomies = taxonomies ?? undefined; // generic bag
        this.createdAt = createdAt;
    }
    /** @returns {TicketDTO} */
    toJSON() {
        const base = { id: this.id, title: this.title, description: this.description, author: this.author, createdAt: this.createdAt };
        // Prefer taxonomies if present; keep legacy fields for compatibility
        const tx = this.taxonomies || { label: this.label ?? null, category: this.category ?? null, complexity: this.complexity ?? null };
        return { ...base, ...tx, taxonomies: tx };
    }
    /** @param {TicketDTO & {taxonomies?: Record<string,string|null>}} dto */
    static fromJSON(dto) {
        // Build taxonomies from explicit bag or legacy fields
        const taxonomies = dto.taxonomies ? { ...dto.taxonomies } : undefined;
        return new Ticket({ ...dto, taxonomies });
    }
}

export default Ticket;
