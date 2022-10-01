import { fetchJson } from 'utils/fetch';

export class isNicknameAvailable {
    connected = false;
    sessionId;
    nickname;

    constructor(dataCallback) {
        this.dataCallback = dataCallback;
    }

    connect() {
        this.connected = true;
        this.getData();
    }

    disconnect() {
        this.connected = false;
    }

    update(config) {
        if (
            this.sessionId !== config.sessionId ||
            this.nickname !== config.nickname
        ) {
            this.sessionId = config.sessionId;
            this.nickname = config.nickname;
            this.getData();
        }
    }

    async getData() {
        if (
            this.connected &&
            this.sessionId !== undefined &&
            this.nickname !== undefined
        ) {
            let data, error;
            // Call players API to check if nickname is available (cache disabled)
            try {
                const encodedNickname = new URLSearchParams({
                    nickname: this.nickname
                }).toString();
                data = await fetchJson(
                    `/api/quiz-sessions/${this.sessionId}/players?${encodedNickname}`,
                    {
                        headers: {
                            pragma: 'no-cache',
                            'Cache-Control': 'no-cache'
                        }
                    }
                );
            } catch (err) {
                error = err;
            }
            this.dataCallback({ data, error });
        }
    }
}
