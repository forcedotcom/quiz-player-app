module.exports = class PlayerRestResource {
    constructor(sfdc) {
        this.sfdc = sfdc;
    }

    isNicknameAvailable(request, response) {
        const { nickname } = request.query;
        if (!nickname) {
            response
                .status(400)
                .json({ message: 'Missing nickname parameter.' });
            return;
        }

        const soql = `SELECT Id FROM Quiz_Player__c WHERE Name='${nickname}'`;
        this.sfdc.query(soql, (error, result) => {
            if (error) {
                console.error('isNicknameAvailable', error);
                response.sendStatus(500);
            } else {
                response.json({
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
                .json({ message: 'Missing nickname parameter.' });
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
                        response.status(409).json({
                            message: `Nickname '${nickname}' is already in use.`
                        });
                    } else {
                        console.error('registerPlayer ', error);
                        response
                            .status(500)
                            .json({ message: 'Failed to register player.' });
                    }
                } else {
                    response.json(result);
                }
            });
    }

    getPlayerLeaderboard(request, response) {
        const { playerId } = request.params;
        if (!playerId) {
            response
                .status(400)
                .json({ message: 'Missing playerId parameter.' });
            return;
        }

        const soql = `SELECT Score__c, Ranking__c FROM Quiz_Player__c WHERE Id='${playerId}'`;
        this.sfdc.query(soql, (error, result) => {
            if (error) {
                console.error('getPlayerLeaderboard', error);
                response.sendStatus(500);
            } else if (result.records.length === 0) {
                response.status(404).json({ message: 'Unkown player.' });
            } else {
                response.json(result.records[0]);
            }
        });
    }

    getPlayerStats(request, response) {
        const { playerId } = request.params;
        if (!playerId) {
            response
                .status(400)
                .json({ message: 'Missing playerId parameter.' });
            return;
        }

        this.sfdc.apex.get(
            `/quiz/player/stats?id=${playerId}`,
            (error, result) => {
                if (error) {
                    response.status(500).json({ message: error.message });
                } else {
                    response.send(result);
                }
            }
        );
    }
};
