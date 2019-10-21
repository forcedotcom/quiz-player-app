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
        const soql = `SELECT Phase__c FROM Quiz_Session__c`;
        this.sfdc.query(soql, (error, result) => {
            if (error) {
                console.error('getSession', error);
                response.status(500).json(error);
            } else if (result.records.length !== 1) {
                const message = 'Could not retrieve Quiz Session record.';
                console.error('getSession', message);
                response.status(404).json({ message });
            } else {
                const record = result.records[0];
                response.json({ phase: record.Phase__c });
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
        const phase = request.body.Phase__c;
        if (!phase) {
            response
                .status(400)
                .json({ message: 'Missing Phase__c parameter.' });
            return;
        }
        // Broadcast phase change via WSS
        const phaseChangeEvent = {
            type: 'phaseChangeEvent',
            data: {
                phase
            }
        };

        // Send correct answer when phase is QuestionResults
        if (phase === 'QuestionResults') {
            this.getCorrectAnwer()
                .then(correctAnswer => {
                    phaseChangeEvent.data.correctAnswer = correctAnswer;
                    this.wss.broadcast(phaseChangeEvent);
                    response.sendStatus(200);
                })
                .catch(error => {
                    console.error('updateSession', error);
                    response.status(500).json(error);
                });
        } else {
            this.wss.broadcast(phaseChangeEvent);
            response.sendStatus(200);
        }
    }

    /**
     * Gets the correct answer to the current question
     * @returns {Promise<String>} Promise holding the correct answer
     */
    getCorrectAnwer() {
        return new Promise((resolve, reject) => {
            const soql = `SELECT Current_Question__r.Correct_Answer__c FROM Quiz_Session__c`;
            this.sfdc.query(soql, (error, result) => {
                if (error) {
                    reject(error);
                } else if (result.records.length !== 1) {
                    reject({
                        message: 'Could not retrieve Quiz Session record.'
                    });
                } else {
                    resolve(
                        result.records[0].Current_Question__r.Correct_Answer__c
                    );
                }
            });
        });
    }
};
