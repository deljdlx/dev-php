// Lightweight User models to represent board authors without changing external API

export class User {
  constructor({ id, name, avatar } = {}) {
    this.id = String(id);
    this.name = String(name ?? '');
    this.avatar = (avatar != null) ? String(avatar) : undefined;
  }

  toJSON() {
    return { id: this.id, name: this.name, ...(this.avatar ? { avatar: this.avatar } : {}) };
  }
}

export class Users {
  constructor(list) {
    const arr = Array.isArray(list) ? list : [];
    this._list = arr.map(u => (u instanceof User ? u : new User(u)));
    this._byId = new Map(this._list.map(u => [u.id, u]));
  }

  all() { return this._list.slice(); }
  getById(id) { return this._byId.get(String(id)) || null; }
  getName(id) { return this.getById(id)?.name || null; }
  toJSON() { return this._list.map(u => u.toJSON()); }
}
