/**
 * Security utilities for XSS prevention
 */

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} str - Untrusted string to escape
 * @returns {string} Escaped string safe for innerHTML
 */
export function escapeHtml(str) {
    if (str == null) return '';
    const s = String(str);
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}
