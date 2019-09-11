module.exports = class PlayerRestResource {
    constructor(sfdc) {
        this.sfdc = sfdc;
    }

    isNicknameAvailable(request, response) {
        const { nickname } = request.query;
        if (!nickname) {
            response
                .status(400)
                .send({ message: 'Missing nickname parameter.' });
            return;
        }

        const soql = `SELECT Id FROM Quiz_Player__c WHERE Name='${nickname}'`;
        this.sfdc.query(soql, (error, result) => {
            if (error) {
                console.error('isNicknameAvailable', error);
                response.sendStatus(500);
            } else {
                response.send({
                    nickname,
                    isAvailable: result.records.length === 0
                });
            }
        });
    }

    registerPlayer(request, response) {
        const { nickname } = request.body;
        if (!nickname) {
            response
                .status(400)
                .send({ message: 'Missing nickname parameter.' });
            return;
        }

        this.sfdc
            .sobject('Quiz_Player__c')
            .insert({ Name: nickname }, (error, result) => {
                if (error || !result.success) {
                    if (
                        error.errorCode &&
                        error.fields &&
                        error.errorCode ===
                            'FIELD_CUSTOM_VALIDATION_EXCEPTION' &&
                        error.fields.includes('Name')
                    ) {
                        response.status(409).send({
                            message: `Nickname '${nickname}' is already in use.`
                        });
                    } else {
                        console.error('registerPlayer ', error);
                        response
                            .status(500)
                            .send({ message: 'Failed to register player.' });
                    }
                } else {
                    response.send(result);
                }
            });
    }
};
