/**
 * Perform fetch operations with JSON responses
 * @param {string} url
 * @param {Object} options fetch options
 * @returns {Promise<*>} Promise holding JSON parsed data or null if response holds no JSON
 */
export async function fetchJson(url, options) {
    const response = await fetch(url, options);
    if (
        response.headers.get('Content-Type') ===
        'application/json; charset=utf-8'
    ) {
        let json = await response.json();
        if (response.ok) {
            return json;
        }
        let message = json?.message
            ? json.message
            : `Unkwown error HTTP ${response.status}`;
        throw new Error(message);
    }
    // Safely handle non JSON responses
    if (response.ok) {
        return null;
    }
    throw new Error(`Unkwown error HTTP ${response.status}`);
}
