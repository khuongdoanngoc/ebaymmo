import GhostContentAPI from '@tryghost/content-api';

const api = new GhostContentAPI({
    url: process.env.NEXT_PUBLIC_GHOST_API_URL ?? '',
    key: process.env.GHOST_API_KEY ?? '',
    version: 'v5.0',
    makeRequest: async ({
        url,
        method,
        headers,
        params
    }: {
        url: string;
        method: string;
        headers: any;
        params: any;
    }) => {
        const apiUrl = new URL(url);

        Object.keys(params).map((key) =>
            apiUrl.searchParams.set(key, params[key])
        );

        try {
            const response = await fetch(apiUrl.toString(), {
                method,
                headers
            });
            const data = await response.json();

            return { data };
        } catch (error) {
            throw error;
        }
    }
});

export default api;
