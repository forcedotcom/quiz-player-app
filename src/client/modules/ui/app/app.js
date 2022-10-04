/* eslint-disable no-console */
import { LightningElement } from 'lwc';

import { getErrorMessage } from 'utils/error';
import { getCookie, setCookie, clearCookie } from 'utils/cookies';
import { WebSocketClient } from 'utils/webSocketClient';

import { PHASES, getSession } from 'services/session';
import { getPlayerLeaderboard } from 'services/player';
import { submitAnswer } from 'services/answer';

const COOKIE_QUIZ_SESSION_ID = 'quizSessionId';
const COOKIE_PLAYER_NICKNAME = 'nickname';
const COOKIE_PLAYER_ID = 'playerId';
const COOKIE_ANSWER = 'answer';

export default class App extends LightningElement {
    nickname;
    session;
    errorMessage;
    playerLeaderboard = { score: '-', rank: '-' };
    showFooter = false;
    lastAnswer;
    answerSaved;
    playerId;
    pingTimeout;
    ws;

    PLAYER_APP_VERSION = '4.0.0';

    async connectedCallback() {
        await this.getSession();
        this.nickname = getCookie(COOKIE_PLAYER_NICKNAME);
        this.playerId = getCookie(COOKIE_PLAYER_ID);
        this.lastAnswer = getCookie(COOKIE_ANSWER);
        this.answerSaved = false;
        this.updateLeaderboard();

        // Get WebSocket URL
        const wsUrl =
            (window.location.protocol === 'http:' ? 'ws://' : 'wss://') +
            window.location.host +
            '/websockets';
        // Connect WebSocket
        this.ws = new WebSocketClient(wsUrl);
        this.ws.connect();
        this.ws.addMessageListener((message) => {
            this.handleWsMessage(message);
        });
    }

    disconnectedCallback() {
        this.ws.close();
    }

    async getSession() {
        try {
            // Get session ID from cookie or URL
            let sessionId = getCookie(COOKIE_QUIZ_SESSION_ID);
            if (!sessionId) {
                sessionId = new URLSearchParams(window.location.search).get(
                    'sessionId'
                );
                if (!sessionId) {
                    throw new Error('Failed to retrieve session ID');
                }
                setCookie(COOKIE_QUIZ_SESSION_ID, sessionId);
            }
            // Load session data
            this.session = await getSession(sessionId);
            if (!(this.isQuestionPhase || this.isQuestionResultsPhase)) {
                clearCookie(COOKIE_ANSWER);
            }
        } catch (error) {
            this.errorMessage = getErrorMessage(error);
            clearCookie(COOKIE_QUIZ_SESSION_ID);
        }
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
                    clearCookie(COOKIE_ANSWER);
                    this.lastAnswer = undefined;
                    this.answerSaved = false;
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
        this.playerId = playerId;

        this.updateLeaderboard();
    }

    async handleAnswer(event) {
        this.errorMessage = undefined;
        const { answer } = event.detail;
        setCookie(COOKIE_ANSWER, answer);
        this.lastAnswer = answer;
        try {
            await submitAnswer(answer);
            this.answerSaved = true;
        } catch (error) {
            this.errorMessage = getErrorMessage(error);
        }
    }

    resetGame() {
        clearCookie(COOKIE_QUIZ_SESSION_ID);
        clearCookie(COOKIE_PLAYER_NICKNAME);
        clearCookie(COOKIE_PLAYER_ID);
        clearCookie(COOKIE_ANSWER);
        window.location.reload();
    }

    async updateLeaderboard() {
        // Only load leaderboard if we have the session and player IDs
        if (!this.session?.id || !this.playerId) {
            return;
        }
        try {
            this.playerLeaderboard = await getPlayerLeaderboard(
                this.session.id,
                this.playerId
            );
            this.showFooter = true;
        } catch (error) {
            this.showFooter = false;
            this.errorMessage = getErrorMessage(error);
            // Reset game if player is not found
            if (error?.status === 404) {
                this.resetGame();
            }
        }
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
        return (
            this.lastAnswer && this.lastAnswer === this.session.correctAnswer
        );
    }
}
