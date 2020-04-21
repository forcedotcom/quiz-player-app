import { LightningElement, api, wire } from 'lwc';
import { getPlayerStats } from 'services/player';
import { getErrorMessage } from 'utils/error';

export default class Winner extends LightningElement {
    @api playerId;
    playerStats;
    error;
    isTop5 = false;
    emailHyperlink = '';

    @wire(getPlayerStats, { playerId: '$playerId' })
    wiredPlayer({ error, data }) {
        if (data) {
            this.playerStats = data;
            if (this.playerStats.rank <= 5) {
                this.isTop5 = true;
                this.emailHyperlink =
                    'mailto:jerry.thomas@salesforce.com?subject=Cert%20Voucher%20for%20LevelUpSFDev&body=';
                this.emailHyperlink += encodeURIComponent(
                    `My name is ${this.playerStats.name} and my unique code is ${this.playerStats.playerUniqueId}`
                );
            }
            this.error = undefined;
        } else if (error) {
            this.error = getErrorMessage(error);
            this.playerStats = undefined;
        }
    }
}
