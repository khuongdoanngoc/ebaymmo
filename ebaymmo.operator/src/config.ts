export const HTTP_URL = import.meta.env.VITE_CODEGEN_HASURA_ENDPOINT;
export const WS_URL = HTTP_URL ? HTTP_URL.replace(/^https:\/\//, 'wss://') : '';
