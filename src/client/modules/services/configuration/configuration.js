import { fetchJson } from 'utils/fetch';

export async function getConfiguration() {
    return fetchJson('/api/configuration', {
        headers: {
            pragma: 'no-cache',
            'Cache-Control': 'no-cache'
        }
    });
}
