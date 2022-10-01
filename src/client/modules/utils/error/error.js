/**
 * Extract a single error message from an error array
 * @param {Array|Object} e single error or array of errors
 */
const getErrorMessage = (oneOrMoreErrors) => {
    const errors = Array.isArray(oneOrMoreErrors)
        ? oneOrMoreErrors
        : [oneOrMoreErrors];
    return (
        errors
            .filter((error) => !!error)
            // Extract an error message
            .map((error) => {
                // Basic string error
                if (typeof error === 'string') {
                    return error;
                }
                // UI API read errors
                else if (Array.isArray(error?.body)) {
                    return error.body.map((e) => e.message);
                }
                // UI API DML, Apex and network errors
                else if (typeof error?.body?.message === 'string') {
                    return error.body.message;
                }
                // JS errors
                else if (typeof error.message === 'string') {
                    return error.message;
                }
                // Unknown error shape so try HTTP status text
                return error.statusText;
            })
            // Flatten
            .reduce((prev, curr) => prev.concat(curr), [])
            // Remove empty strings
            .filter((message) => !!message)
    );
};

export { getErrorMessage };
