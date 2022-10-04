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
    async getSession(request, response) {
        const { sessionId } = request.params;
        if (!sessionId) {
            response
                .status(400)
                .json({ message: 'Missing sessionId parameter.' });
            return;
        }
        // Get session data
        try {
            const session = await this.#getSessionData(sessionId);

            // Get question label when phase is Question
            if (session.phase === 'Question') {
                session.question = await this.#getQuestion(sessionId);
            }
            // Get correct answer when phase is QuestionResults
            else if (session.phase === 'QuestionResults') {
                session.correctAnswer = await this.#getCorrectAnwer();
            }

            response.json(session);
        } catch (error) {
            response.status(500).json(error);
        }
    }

    /**
     * Updates current quiz session
     * @param {*} request
     * @param {*} response
     */
    async updateSession(request, response) {
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
        const { sessionId } = request.params;
        if (!sessionId) {
            response
                .status(400)
                .json({ message: 'Missing sessionId parameter.' });
            return;
        }
        const { phase } = request.body;
        if (!phase) {
            response.status(400).json({ message: 'Missing phase parameter.' });
            return;
        }

        // Prepare phase change event
        const phaseChangeEvent = {
            type: 'phaseChangeEvent',
            data: {
                id: sessionId,
                phase
            }
        };

        try {
            // Get question label when phase is Question
            if (phase === 'Question') {
                phaseChangeEvent.data.question = await this.#getQuestion(
                    sessionId
                );
            }
            // Get correct answer when phase is QuestionResults
            else if (phase === 'QuestionResults') {
                phaseChangeEvent.data.correctAnswer =
                    await this.#getCorrectAnwer();
            }

            // Broadcast phase change event
            this.wss.broadcast(phaseChangeEvent);
            response.sendStatus(200);
        } catch (error) {
            console.error(error);
            response.status(500).json(error);
        }
    }

    async #getSessionData(sessionId) {
        return new Promise((resolve, reject) => {
            const ns = Configuration.getSfNamespacePrefix();
            const soql = `SELECT Id, ${ns}Phase__c FROM ${ns}Quiz_Session__c WHERE Id='${sessionId}'`;
            this.sfdc.query(soql, (error, result) => {
                if (error) {
                    console.error(error);
                    reject(error);
                } else if (result.records.length !== 1) {
                    const message = 'Could not retrieve Quiz Session record.';
                    console.error(message);
                    reject({ message });
                } else {
                    const record = result.records[0];
                    const id = record.Id;
                    const phase = record[`${ns}Phase__c`];
                    resolve({ id, phase });
                }
            });
        });
    }

    /**
     * Gets the correct answer to the current question
     * @returns {Promise<String>} Promise holding the correct answer
     */
    #getCorrectAnwer() {
        return new Promise((resolve, reject) => {
            const ns = Configuration.getSfNamespacePrefix();
            const soql = `SELECT ${ns}Current_Question__r.${ns}Correct_Answer__c FROM ${ns}Quiz_Session__c`;
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
     * @param sessionId
     * @returns {Promise<String>} Promise holding the question label
     */
    #getQuestion(sessionId) {
        return new Promise((resolve, reject) => {
            const ns = Configuration.getSfNamespacePrefix();
            const soql = `SELECT ${ns}Current_Question__r.${ns}Label__c, 
            ${ns}Current_Question__r.${ns}Answer_A__c, 
            ${ns}Current_Question__r.${ns}Answer_B__c, 
            ${ns}Current_Question__r.${ns}Answer_C__c, 
            ${ns}Current_Question__r.${ns}Answer_D__c 
            FROM ${ns}Quiz_Session__c
            WHERE Id='${sessionId}'`;
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
