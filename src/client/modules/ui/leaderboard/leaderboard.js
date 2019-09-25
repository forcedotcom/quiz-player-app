import { LightningElement, api, track, wire } from 'lwc';
import { getScoreAndRanking } from 'services/player';
import { getErrorMessage } from 'utils/error';

export default class Leaderboard extends LightningElement {
    @track player;
    @track errorMessage = '';
    @api nickname; // is passed from parent

    @wire(getScoreAndRanking, { nickname: '$nickname' })
    getScoreAndRanking({ error, data }) {
        if (data) {
            this.player = data;
            this.errorMessage = undefined;
        } else if (error) {
            this.errorMessage = getErrorMessage(error);
            this.player = undefined;
        }
    }

    get playerData() {
        return JSON.stringify(this.player);
    }
}
