/* eslint-disable no-console */
import { LightningElement, track, wire } from 'lwc';

import { getErrorMessage } from 'utils/error';
import { getCookie, setCookie, clearCookie } from 'utils/cookies';
import { WebSocketClient } from 'utils/webSocketClient';

import { PHASES, getCurrentSession } from 'services/session';
import { getPlayerLeaderboard } from 'services/player';
import { submitAnswer } from 'services/answer';

const COOKIE_PLAYER_NICKNAME = 'nickname';
const COOKIE_PLAYER_ID = 'playerId';

export default class App extends LightningElement {
    @track nickname;
    @track session;
    @track errorMessage;
    @track playerLeaderboard = { Score__c: '-', Ranking__c: '-' };
    @track showFooter = false;
    @track lastAnswer;

    playerId;
    pingTimeout;
    ws;

    @wire(getCurrentSession)
    getCurrentSession({ error, data }) {
        if (data) {
            this.session = data;
        } else if (error) {
            if (error.status && error.status === 404) {
                this.resetGame();
            }
            this.errorMessage = getErrorMessage(error);
        }
    }

    connectedCallback() {
        this.nickname = getCookie(COOKIE_PLAYER_NICKNAME);
        const playerId = getCookie(COOKIE_PLAYER_ID);
        if (playerId) {
            this.setPlayer(playerId);
        }

        // Get WebSocket URL
        const wsUrl =
            (window.location.protocol === 'http:' ? 'ws://' : 'wss://') +
            window.location.host;
        // Connect WebSocket
        this.ws = new WebSocketClient(wsUrl);
        this.ws.connect();
        this.ws.addMessageListener(message => {
            this.handleWsMessage(message);
        });
    }

    handleWsMessage(message) {
        this.errorMessage = undefined;
        if (message.type === 'phaseChangeEvent') {
            this.session = message.data;
            // eslint-disable-next-line default-case
            switch (this.session.phase) {
                case PHASES.REGISTRATION:
                    this.resetGame();
                    break;
                case PHASES.QUESTION:
                    // Clear last answer
                    this.lastAnswer = undefined;
                    break;
                case PHASES.QUESTION_RESULTS:
                    // Refresh leaderboard
                    this.updateLeaderboard();
                    break;
            }
        }
    }

    handleRegistered(event) {
        const { nickname, playerId } = event.detail;

        setCookie(COOKIE_PLAYER_NICKNAME, nickname);
        this.nickname = nickname;

        setCookie(COOKIE_PLAYER_ID, playerId);
        this.setPlayer(playerId);
    }

    handleAnswer(event) {
        this.errorMessage = undefined;
        const { answer } = event.detail;
        this.lastAnswer = answer;
        submitAnswer(answer).catch(error => {
            this.errorMessage = getErrorMessage(error);
        });
    }

    resetGame() {
        clearCookie(COOKIE_PLAYER_NICKNAME);
        clearCookie(COOKIE_PLAYER_ID);
        window.location.reload();
    }

    setPlayer(playerId) {
        this.playerId = playerId;
        this.updateLeaderboard();
    }

    updateLeaderboard() {
        getPlayerLeaderboard({ playerId: this.playerId })
            .then(data => {
                this.playerLeaderboard = data;
                this.showFooter = true;
            })
            .catch(error => {
                this.showFooter = false;
                if (error.status && error.status === 404) {
                    this.resetGame();
                }
                this.errorMessage = getErrorMessage(error);
            });
    }

    // UI expressions

    get isAuthenticated() {
        return this.nickname !== '';
    }

    get isRegistrationPhase() {
        return this.session.phase === PHASES.REGISTRATION;
    }

    get isPreQuestionPhase() {
        return this.session.phase === PHASES.PRE_QUESTION;
    }

    get isQuestionPhase() {
        return this.session.phase === PHASES.QUESTION;
    }

    get isQuestionResultsPhase() {
        return this.session.phase === PHASES.QUESTION_RESULTS;
    }

    get isGameResultsPhase() {
        return this.session.phase === PHASES.GAME_RESULTS;
    }

    get isCorrectAnswer() {
        return this.lastAnswer === this.session.correctAnswer;
    }
}
