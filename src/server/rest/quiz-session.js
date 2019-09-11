module.exports = class QuizSessionRestResource {
    /**
     * @param {*} sfdc
     */
    constructor(sfdc) {
        this.sfdc = sfdc;
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
};
