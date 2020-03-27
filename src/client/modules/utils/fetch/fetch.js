/**
 * Handles Fetch API JSON responses
 * @param {*} response
 * @returns {Promise<*>} Promise holding JSON parsed data or null if response holds no JSON
 */
const fetchJson = (response) => {
    return new Promise((resolve, reject) => {
        if (
            response.headers.get('Content-Type') ===
            'application/json; charset=utf-8'
        ) {
            response.json().then((json) => {
                if (!response.ok) {
                    if (!json) {
                        json = {};
                    }
                    json.status = response.status;
                    reject(json);
                } else {
                    resolve(json);
                }
            });
        } else {
            // Safely handle non JSON responses
            if (!response.ok) {
                reject(null);
            } else {
                resolve(null);
            }
        }
    });
};

export { fetchJson };
