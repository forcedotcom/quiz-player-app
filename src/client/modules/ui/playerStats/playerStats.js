import { LightningElement, api, wire } from 'lwc';
import { getPlayerStats } from 'services/player';
import { getErrorMessage } from 'utils/error';

export default class Winner extends LightningElement {
    @api playerId;
    playerStats;
    error;

    @wire(getPlayerStats, { playerId: '$playerId' })
    wiredPlayer({ error, data }) {
        if (data) {
            this.playerStats = data;
            this.error = undefined;
        } else if (error) {
            this.error = getErrorMessage(error);
            this.playerStats = undefined;
        }
    }
}
