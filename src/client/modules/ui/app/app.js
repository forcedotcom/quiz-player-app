/* eslint-disable no-console */
import { LightningElement, track, wire } from 'lwc';

import { getErrorMessage } from 'utils/error';
import { getCookie, setCookie } from 'utils/cookies';
import { WebSocketClient } from 'utils/webSocketClient';

import { PHASES, getCurrentSession } from 'services/session';

const COOKIE_PLAYER_NICKNAME = 'nickname';
const COOKIE_PLAYER_ID = 'playerId';

const WEB_SOCKET_PORT = 8081;

export default class App extends LightningElement {
    @track nickname;
    @track session;
    @track errorMessage;

    playerId;
    pingTimeout;
    ws;

    @wire(getCurrentSession)
    getCurrentSession({ error, data }) {
        if (data) {
            this.session = data;
        } else if (error) {
            this.errorMessage = getErrorMessage(error);
        }
    }

    connectedCallback() {
        this.nickname = getCookie(COOKIE_PLAYER_NICKNAME);
        this.playerId = getCookie(COOKIE_PLAYER_ID);

        // Get WebSocket URL
        const wsUrl =
            (window.location.protocol === 'http:' ? 'ws://' : 'wss://') +
            window.location.hostname +
            ':' +
            WEB_SOCKET_PORT;
        // Connect WebSocket
        this.ws = new WebSocketClient(wsUrl);
        this.ws.connect();
        this.ws.addMessageListener(message => {
            this.handleWsMessage(message);
        });
    }

    handleWsMessage(message) {
        if (message.type === 'phaseChangeEvent') {
            this.session = message.data;
        }
    }

    handleRegistered(event) {
        const { nickname, playerId } = event.detail;

        setCookie(COOKIE_PLAYER_NICKNAME, nickname);
        this.nickname = nickname;

        setCookie(COOKIE_PLAYER_ID, playerId);
        this.playerId = playerId;
    }

    handleAnswer(event) {
        const { answer } = event.detail;
        console.log(answer);
    }

    // UI expressions

    get isAuthenticated() {
        return this.nickname !== '';
    }

    get isRegistrationPhase() {
        return this.session.Phase__c === PHASES.REGISTRATION;
    }

    get isPreQuestionPhase() {
        return this.session.Phase__c === PHASES.PRE_QUESTION;
    }

    get isQuestionPhase() {
        return this.session.Phase__c === PHASES.QUESTION;
    }

    get isPostQuestionPhase() {
        return this.session.Phase__c === PHASES.POST_QUESTION;
    }

    get isQuestionResultsPhase() {
        return this.session.Phase__c === PHASES.QUESTION_RESULTS;
    }

    get isGameResultsPhase() {
        return this.session.Phase__c === PHASES.GAME_RESULTS;
    }
}
