// Stateless serializers for Columns and Tickets

export const ColumnSerializer = {
  toDTO(col) {
    if (!col) return null;
    if (typeof col.toJSON === 'function') return col.toJSON();
    return { id: col.id, name: col.name, tickets: Array.isArray(col.tickets) ? col.tickets : [] };
  },
  fromDTO(dto) {
    if (!dto) return null;
    return { id: String(dto.id), name: String(dto.name), tickets: Array.isArray(dto.tickets) ? dto.tickets : [] };
  }
};

export const TicketSerializer = {
  toDTO(t) {
    if (!t) return null;
    if (typeof t.toJSON === 'function') return t.toJSON();
    return { ...t };
  }
};
