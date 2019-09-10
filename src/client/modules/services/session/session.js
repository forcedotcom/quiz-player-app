import { register, ValueChangedEvent } from '@lwc/wire-service';
import { fetchJson } from 'utils/fetch';

export const PHASES = Object.freeze({
    REGISTRATION: 'Registration',
    PRE_QUESTION: 'Pre-question',
    QUESTION: 'Question',
    POST_QUESTION: 'Post-question',
    RESULTS: 'Results'
});

export function getCurrentSession(config) {
    return new Promise((resolve, reject) => {
        const observer = {
            next: data => resolve(data),
            error: error => reject(error)
        };
        getData(config, observer);
    });
}

function getData(config, observer) {
    fetch('/api/quiz-sessions')
        .then(fetchJson)
        .then(jsonResponse => {
            observer.next(jsonResponse);
        })
        .catch(error => {
            observer.error(error);
        });
}

register(getCurrentSession, eventTarget => {
    let config;
    eventTarget.dispatchEvent(
        new ValueChangedEvent({ data: undefined, error: undefined })
    );

    const observer = {
        next: data =>
            eventTarget.dispatchEvent(
                new ValueChangedEvent({ data, error: undefined })
            ),
        error: error =>
            eventTarget.dispatchEvent(
                new ValueChangedEvent({ data: undefined, error })
            )
    };

    eventTarget.addEventListener('config', newConfig => {
        config = newConfig;
        getData(config, observer);
    });
    /*
    // Prevent duplicate initial REST call
    eventTarget.addEventListener('connect', () => {
        getData(config, observer);
    });
*/
});
