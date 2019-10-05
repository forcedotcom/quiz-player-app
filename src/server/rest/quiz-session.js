const Configuration = require('../utils/configuration.js');

module.exports = class QuizSessionRestResource {
    /**
     * @param {*} sfdc Salesforce client
     * @param {*} wss WebSocket server
     */
    constructor(sfdc, wss) {
        this.sfdc = sfdc;
        this.wss = wss;
    }

    /**
     * Get current quiz session
     * @param {*} request
     * @param {*} response
     */
    getSession(request, response) {
        const soql = `SELECT Phase__c, Current_Question__c FROM Quiz_Session__c`;
        this.sfdc.query(soql, (error, result) => {
            if (error) {
                console.error('getSession', error);
                response.status(500).json(error);
            } else if (result.records.length === 0) {
                response.status(404).json({
                    message: 'Could not retrieve Quiz Session record.'
                });
            } else {
                response.json(result.records[0]);
            }
        });
    }

    /**
     * Updates current quiz session
     * @param {*} request
     * @param {*} response
     */
    updateSession(request, response) {
        // Check API key header
        const apiKey = request.get('Api-Key');
        if (!apiKey) {
            response.status(400).json({ message: 'Missing Quiz API Key.' });
            return;
        }
        if (apiKey !== Configuration.getQuizApiKey()) {
            response.status(403).json({ message: 'Invalid Quiz API Key.' });
            return;
        }
        // Check parameters
        const { Phase__c } = request.body;
        if (!Phase__c) {
            response
                .status(400)
                .json({ message: 'Missing Phase__c parameter.' });
            return;
        }
        // Broadcast phase change via WSS
        const message = {
            type: 'phaseChangeEvent',
            data: {
                Phase__c
            }
        };
        this.wss.broadcast(JSON.stringify(message));
        response.sendStatus(200);
    }
};
