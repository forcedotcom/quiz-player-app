import { fetchJson } from 'utils/fetch';

export const PHASES = Object.freeze({
    REGISTRATION: 'Registration',
    PRE_QUESTION: 'PreQuestion',
    QUESTION: 'Question',
    QUESTION_RESULTS: 'QuestionResults',
    GAME_RESULTS: 'GameResults'
});

export async function getSession(sessionId) {
    try {
        const session = await fetchJson(`/api/quiz-sessions/${sessionId}`);
        return session;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to retrieve session from ID');
    }
}
