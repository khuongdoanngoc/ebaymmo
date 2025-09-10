require('dotenv').config();

const endpoint = `http://localhost:${process.env.HASURA_PORT}/v1/graphql`;
const secret = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

const COMMON_SCALAR_MAPPING = {
  uuid: 'string',
  date: 'string',
  jsonb: 'Record<string, any>',
  timestamptz: 'string',
  timestamp: 'string',
  citext: 'string',
  numeric: 'number',
};

const codeGenConfig = {
  generates: {
    'src/sdk/sdk.ts': {
      documents: ['src/**/*.graphql'],
      schema: [
        {
          [endpoint]: {
            headers: {
              'x-hasura-admin-secret': secret,
            },
          },
        },
      ],
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-graphql-request',
      ],
      config: {
        gqlImport: 'graphql-request#gql',
        avoidOptionals: {
          object: false,
          field: false,
          inputValue: false,
        },
        scalars: COMMON_SCALAR_MAPPING,
      },
    },
  },
};

module.exports = codeGenConfig;
