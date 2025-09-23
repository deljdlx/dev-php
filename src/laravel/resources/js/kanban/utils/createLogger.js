function createLogger(prefix = 'Kanban') {
  const p = `[${prefix}]`;
  return {
    debug: (...args) => console.debug(p, ...args),
    info: (...args) => console.info(p, ...args),
    warn: (...args) => console.warn(p, ...args),
    error: (...args) => console.error(p, ...args),
  };
}

export default createLogger;
