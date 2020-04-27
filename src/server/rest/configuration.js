const Configuration = require('../utils/configuration.js');

module.exports = class ConfigurationRestResource {
    /**
     * Gets the app configuration
     * @returns Object holding the app configuration
     */
    getConfiguration(request, response) {
        const config = {
            shouldCollectPlayerEmails: Configuration.shouldCollectPlayerEmails()
        };
        response.json(config);
    }
};
