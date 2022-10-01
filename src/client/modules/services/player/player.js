import { fetchJson } from 'utils/fetch';

/**
 * Gets a player's leaderboard (score and rank)
 * @param {string} sessionId
 * @param {string} playerId
 */
export function getPlayerLeaderboard(sessionId, playerId) {
    return fetchJson(
        `/api/quiz-sessions/${sessionId}/players/${playerId}/leaderboard`,
        {
            headers: {
                pragma: 'no-cache',
                'Cache-Control': 'no-cache'
            }
        }
    );
}

/**
 * Gets player's stats
 * @param {string} sessionId
 * @param {string} playerId
 */
export function getPlayerStats(sessionId, playerId) {
    return fetchJson(
        `/api/quiz-sessions/${sessionId}/players/${playerId}/stats`
    );
}

/**
 * Registers a player
 * @param {string} sessionId
 * @param {string} nickname
 * @param {string} email
 * @returns {Promise<*>} Promise holding the Player record
 */
export function registerPlayer(sessionId, nickname, email) {
    const userInfo = { nickname, email };
    return fetchJson(`/api/quiz-sessions/${sessionId}/players`, {
        method: 'post',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userInfo)
    });
}
