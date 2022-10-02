const Configuration = require('../utils/configuration.js');

module.exports = class AnswerRestResource {
    constructor(sfdc) {
        this.sfdc = sfdc;
    }

    submitAnswer(request, response) {
        const { playerId, answer } = request.body;
        if (!(playerId && answer)) {
            response.status(400).json({ message: 'Missing parameter.' });
            return;
        }

        const ns = Configuration.getSfNamespacePath();
        this.sfdc.apex.post(`${ns}/quiz/answers`, request.body, (error) => {
            if (error) {
                console.error(error);
                response.status(500).json({ message: error.message });
            } else {
                response.sendStatus(200);
            }
        });
    }
};
