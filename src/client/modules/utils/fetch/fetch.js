/**
 * Perform fetch operations with JSON responses
 * @param {string} url
 * @param {Object} options fetch options
 * @returns {Promise<*>} Promise holding JSON parsed data or null if response holds no JSON
 */
export async function fetchJson(url, options) {
    const response = await fetch(url, options);
    let errorMessage = `Unkwown error HTTP ${response.status}`;
    if (
        response.headers.get('Content-Type') ===
        'application/json; charset=utf-8'
    ) {
        let json = await response.json();
        if (response.ok) {
            return json;
        }
        if (json?.message) {
            errorMessage = json.message;
        }
    }
    // Safely handle non JSON responses
    else if (response.ok) {
        return null;
    }
    throw new Error(errorMessage, { status: response.status });
}
