const Configuration = require('../utils/configuration.js');

module.exports = class PlayerRestResource {
    constructor(sfdc) {
        this.sfdc = sfdc;
    }

    isNicknameAvailable(request, response) {
        const { sessionId } = request.params;
        const { nickname } = request.query;
        if (!sessionId) {
            response
                .status(400)
                .json({ message: 'Missing sessionId URI parameter.' });
            return;
        }
        if (!nickname) {
            response
                .status(400)
                .json({ message: 'Missing nickname query parameter.' });
            return;
        }

        const ns = Configuration.getSfNamespacePrefix();
        const cleanNickname = nickname.replace("'", "\\'");
        const soql = `SELECT Id FROM ${ns}Quiz_Player__c WHERE Name='${cleanNickname}' AND ${ns}Session__c='${sessionId}'`;
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
        const { sessionId } = request.params;
        const { email, nickname } = request.body;
        if (!sessionId) {
            response
                .status(400)
                .json({ message: 'Missing sessionId URI parameter.' });
            return;
        }
        if (!nickname) {
            response.status(400).json({ message: 'Missing nickname in body.' });
            return;
        }
        if (Configuration.shouldCollectPlayerEmails() && !email) {
            response.status(400).json({ message: 'Missing email in body.' });
            return;
        }

        const ns = Configuration.getSfNamespacePrefix();
        const playerRecord = { Name: nickname };
        playerRecord[`${ns}Email__c`] = email;
        playerRecord[`${ns}Session__c`] = sessionId;

        this.sfdc
            .sobject(`${ns}Quiz_Player__c`)
            .insert(playerRecord, (error, result) => {
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
                .json({ message: 'Missing playerId URI parameter.' });
            return;
        }

        const ns = Configuration.getSfNamespacePrefix();
        const soql = `SELECT ${ns}Score__c, ${ns}Rank__c FROM ${ns}Quiz_Player__c WHERE Id='${playerId}'`;
        this.sfdc.query(soql, (error, result) => {
            if (error) {
                console.error('getPlayerLeaderboard', error);
                response.sendStatus(500);
            } else if (result.records.length === 0) {
                response.status(404).json({ message: 'Unkown player.' });
            } else {
                const record = result.records[0];
                const leaderboard = {
                    score: record[`${ns}Score__c`],
                    rank: record[`${ns}Rank__c`]
                };
                response.json(leaderboard);
            }
        });
    }

    getPlayerStats(request, response) {
        const { playerId } = request.params;
        if (!playerId) {
            response
                .status(400)
                .json({ message: 'Missing playerId URI parameter.' });
            return;
        }

        const ns = Configuration.getSfNamespacePath();
        this.sfdc.apex.get(
            `${ns}/quiz/player/stats?id=${playerId}`,
            (error, result) => {
                if (error) {
                    console.error(error);
                    response.status(500).json({ message: error.message });
                } else {
                    response.send(result);
                }
            }
        );
    }
};
