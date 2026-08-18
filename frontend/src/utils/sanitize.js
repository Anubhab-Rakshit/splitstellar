/**
 * Sanitizes input strings by removing unsafe HTML characters (< and >) and trimming whitespace.
 * @param {string} input 
 * @returns {string}
 */
export function sanitizeInput(input = '') {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>]/g, '').trim();
}
