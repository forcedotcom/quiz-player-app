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
        const ns = Configuration.getSfNamespacePrefix();
        const soql = `SELECT ${ns}Phase__c FROM ${ns}Quiz_Session__c WHERE Status__c='Active'`;
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
                const phase = record[`${ns}Phase__c`];
                response.json({ phase });
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
        const { phase } = request.body;
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

        // Get question label when phase is Question
        if (phase === 'Question') {
            this.getQuestion()
                .then((question) => {
                    phaseChangeEvent.data.question = question;
                    this.wss.broadcast(phaseChangeEvent);
                    response.sendStatus(200);
                })
                .catch((error) => {
                    console.error('getQuestion', error);
                    response.status(500).json(error);
                });
        }
        // Send correct answer when phase is QuestionResults
        else if (phase === 'QuestionResults') {
            this.getCorrectAnwer()
                .then((correctAnswer) => {
                    phaseChangeEvent.data.correctAnswer = correctAnswer;
                    this.wss.broadcast(phaseChangeEvent);
                    response.sendStatus(200);
                })
                .catch((error) => {
                    console.error('getCorrectAnwer', error);
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
            const ns = Configuration.getSfNamespacePrefix();
            const soql = `SELECT ${ns}Current_Question__r.${ns}Correct_Answer__c FROM ${ns}Quiz_Session__c WHER Status__c='Active'`;
            this.sfdc.query(soql, (error, result) => {
                if (error) {
                    reject(error);
                } else if (result.records.length !== 1) {
                    reject({
                        message: 'Could not retrieve Quiz Session record.'
                    });
                } else {
                    resolve(
                        result.records[0][`${ns}Current_Question__r`][
                            `${ns}Correct_Answer__c`
                        ]
                    );
                }
            });
        });
    }

    /**
     * Gets the current question's label
     * @returns {Promise<String>} Promise holding the question label
     */
    getQuestion() {
        return new Promise((resolve, reject) => {
            const ns = Configuration.getSfNamespacePrefix();
            const soql = `SELECT ${ns}Current_Question__r.${ns}Label__c, 
            ${ns}Current_Question__r.${ns}Answer_A__c, 
            ${ns}Current_Question__r.${ns}Answer_B__c, 
            ${ns}Current_Question__r.${ns}Answer_C__c, 
            ${ns}Current_Question__r.${ns}Answer_D__c 
            FROM ${ns}Quiz_Session__c WHERE Status__c='Active'`;
            this.sfdc.query(soql, (error, result) => {
                if (error) {
                    reject(error);
                } else if (result.records.length !== 1) {
                    reject({
                        message: 'Could not retrieve Quiz Session record.'
                    });
                } else {
                    const questionRecord =
                        result.records[0][`${ns}Current_Question__r`];
                    const question = {
                        label: questionRecord[`${ns}Label__c`],
                        answerA: questionRecord[`${ns}Answer_A__c`],
                        answerB: questionRecord[`${ns}Answer_B__c`],
                        answerC: questionRecord[`${ns}Answer_C__c`],
                        answerD: questionRecord[`${ns}Answer_D__c`]
                    };
                    resolve(question);
                }
            });
        });
    }
};
