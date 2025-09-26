/**
 * @typedef {Object} TicketDTO
 * @property {string} id
 * @property {string} title
 * @property {('blue'|'green'|'orange'|null)} [label]
 * @property {('bug'|'feature'|'docs'|'chore'|null)} [category]
 * @property {string|null} [description]
 * @property {string|null} [author]   // legacy display name
 * @property {string|null} [authorId] // entity id reference
 * @property {('xs'|'s'|'m'|'l'|'xl'|null)} [complexity]
 * @property {Record<string,string|null>} [taxonomies]
 * @property {number} createdAt
 */

class Ticket {
    /** @param {{ id?: string, title: string, label?: 'blue'|'green'|'orange'|null, category?: 'bug'|'feature'|'docs'|'chore'|null, description?: string|null, author?: string|null, authorId?: string|null, complexity?: 'xs'|'s'|'m'|'l'|'xl'|null, taxonomies?: Record<string,string|null>, createdAt?: number }} param0 */
    constructor({ id, title, label = null, category = null, description = null, author = null, authorId = null, complexity = null, taxonomies = undefined, createdAt = Date.now() }) {
        this.id = id ?? (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
        this.title = title;
        this.label = label; // legacy shim
        this.category = category; // legacy shim
        this.description = description ?? null;
    this.author = author ?? null; // legacy
    this.authorId = authorId ?? null; // entity ref
        this.complexity = complexity ?? null; // legacy shim
        this.taxonomies = taxonomies ?? undefined; // generic bag
        this.createdAt = createdAt;
    }
    /** @returns {TicketDTO} */
    toJSON() {
    const base = { id: this.id, title: this.title, description: this.description, author: this.author, authorId: this.authorId, createdAt: this.createdAt };
    // Prefer taxonomies bag; fall back to legacy shim if needed
    const tx = this.taxonomies || { label: this.label ?? null, category: this.category ?? null, complexity: this.complexity ?? null };
    return { ...base, taxonomies: tx };
    }
    /** @param {TicketDTO & {taxonomies?: Record<string,string|null>}} dto */
    static fromJSON(dto) {
        // Build taxonomies from explicit bag or legacy fields
        const taxonomies = dto.taxonomies ? { ...dto.taxonomies } : undefined;
        return new Ticket({ ...dto, taxonomies });
    }
}

export default Ticket;
