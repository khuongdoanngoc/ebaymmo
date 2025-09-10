export interface IDataTokenDecode {
    'https://hasura.io/jwt/claims': {
        'x-hasura-default-role': string;
        'x-hasura-allowed-roles': string[];
        'X-Hasura-User-Id': string;
    };
    iat: number;
    exp: number;
}
