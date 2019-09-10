/**
 * Handles Fetch API JSON responses
 * @param {*} response
 */
const fetchJson = response => {
    return new Promise((resolve, reject) => {
        response.json().then(json => {
            if (!response.ok) {
                reject(json);
            } else {
                resolve(json);
            }
        });
    });
};

export { fetchJson };
