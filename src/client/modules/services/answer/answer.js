import { fetchJson } from 'utils/fetch';
import { getCookie } from 'utils/cookies';

const ANSWERS_REST_URL = '/api/answers';

const COOKIE_PLAYER_ID = 'playerId';

/**
 * Submits an answer to the current question
 * @param {string} answer
 * @returns {Promise<*>} Promise holding the Answer record
 */
export function submitAnswer(answer) {
    const playerId = getCookie(COOKIE_PLAYER_ID);
    const answerData = {
        playerId,
        answer
    };
    return fetchJson(ANSWERS_REST_URL, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(answerData)
    });
}
