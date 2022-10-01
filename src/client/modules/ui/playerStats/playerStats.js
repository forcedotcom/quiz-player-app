import { LightningElement, api } from 'lwc';
import { getPlayerStats } from 'services/player';
import { getErrorMessage } from 'utils/error';

export default class PlayerStats extends LightningElement {
    @api sessionId;
    @api playerId;
    playerStats;
    error;

    async connectedCallback() {
        try {
            this.playerStats = await getPlayerStats(
                this.sessionId,
                this.playerId
            );
        } catch (error) {
            this.error = getErrorMessage(error);
        }
    }
}
