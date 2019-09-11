import { register, ValueChangedEvent } from '@lwc/wire-service';
import { fetchJson } from 'utils/fetch';

const PLAYERS_REST_URL = '/api/players';

export function isNicknameAvailable(config) {
    return new Promise((resolve, reject) => {
        const observer = {
            next: data => resolve(data),
            error: error => reject(error)
        };
        getData(config, observer);
    });
}

function getData(config, observer) {
    const nickname = config && config.nickname ? config.nickname : null;
    if (nickname === null) {
        observer.next({ nickname: '', isAvailable: true });
        return;
    }

    // Call players API to check if nickname is available (cache disabled)
    fetch(`${PLAYERS_REST_URL}?nickname=${nickname}`, {
        headers: {
            pragma: 'no-cache',
            'cache-control': 'no-cache'
        }
    })
        .then(fetchJson)
        .then(jsonResponse => {
            observer.next(jsonResponse);
        })
        .catch(error => {
            observer.error(error);
        });
}

register(isNicknameAvailable, eventTarget => {
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

    eventTarget.addEventListener('connect', () => {
        getData(config, observer);
    });
});

/**
 * Registers a player
 * @param {string} nickname
 * @returns {Promise<*>} Promise holding the Player record
 */
export function registerPlayer(nickname) {
    return fetch(PLAYERS_REST_URL, {
        method: 'post',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nickname })
    }).then(fetchJson);
}
