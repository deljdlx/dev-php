const ALLOWED = ['blue','green','orange'];

function sanitizeLabel(label) {
  if (!label) return null;
  return ALLOWED.includes(label) ? label : null;
}

export default sanitizeLabel;
