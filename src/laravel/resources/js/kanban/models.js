export class Ticket {
    constructor({ id, title, label = null, createdAt = Date.now() }) {
        this.id = id ?? (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
        this.title = title;
        this.label = label; // blue|green|orange|null
        this.createdAt = createdAt;
    }
}

export class Column {
    constructor({ id, name, tickets = [] }) {
        this.id = id; // e.g. todo, doing, review, done
        this.name = name;
        this.tickets = tickets.map(t => t instanceof Ticket ? t : new Ticket(t));
    }
}
