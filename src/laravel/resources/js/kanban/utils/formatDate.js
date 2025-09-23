/**
 * Format a timestamp into a localized, short date string.
 * Falls back gracefully on invalid inputs.
 *
 * @param {number|string|Date} value - epoch ms, parseable date string, or Date
 * @param {{ locale?: string, options?: Intl.DateTimeFormatOptions }} [opts]
 * @returns {string}
 */
function formatTicketDate(value, opts = {}) {
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    const locale = opts.locale || (typeof navigator !== 'undefined' ? navigator.language : undefined);
    const options = opts.options || { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Intl.DateTimeFormat(locale, options).format(d);
  } catch (_) {
    return '';
  }
}

export default formatTicketDate;
