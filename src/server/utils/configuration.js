module.exports = class Configuration {
    static isValid() {
        [
            'SF_USERNAME',
            'SF_PASSWORD',
            'SF_TOKEN',
            'SF_LOGIN_URL',
            'SF_API_VERSION',
            'QUIZ_API_KEY'
        ].forEach((varName) => {
            if (!process.env[varName]) {
                console.error(`ERROR: Missing ${varName} environment variable`);
                return false;
            }
        });
        return true;
    }

    static getSfLoginUrl() {
        return process.env.SF_LOGIN_URL;
    }

    static getSfApiVersion() {
        return process.env.SF_API_VERSION;
    }

    static getSfUsername() {
        return process.env.SF_USERNAME;
    }

    static getSfSecuredPassword() {
        return process.env.SF_PASSWORD + process.env.SF_TOKEN;
    }

    static getSfNamespacePrefix() {
        return process.env.SF_NAMESPACE ? `${process.env.SF_NAMESPACE}__` : '';
    }

    static getSfNamespacePath() {
        return process.env.SF_NAMESPACE ? `/${process.env.SF_NAMESPACE}` : '';
    }

    static getQuizApiKey() {
        return process.env.QUIZ_API_KEY;
    }

    static shouldCollectPlayerEmails() {
        const value = process.env.COLLECT_PLAYER_EMAILS
            ? process.env.COLLECT_PLAYER_EMAILS.toUpperCase()
            : null;
        return value === 'TRUE';
    }
};
