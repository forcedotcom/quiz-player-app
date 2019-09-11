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

        this.sfdc.apex.post('/quiz/answers', request.body, (error, result) => {
            if (error) {
                response.status(500).json({ message: error.message });
            } else {
                response.sendStatus(200);
            }
        });
    }
};
