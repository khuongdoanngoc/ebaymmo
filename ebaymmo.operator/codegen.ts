import type { CodegenConfig } from '@graphql-codegen/cli';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const config: CodegenConfig = {
    overwrite: true,
    schema: {
        [process.env.VITE_CODEGEN_HASURA_ENDPOINT || '']: {
            headers: {
                'x-hasura-admin-secret':
                    process.env.VITE_CODEGEN_HASURA_GRAPHQL_ADMIN_SECRET || ''
            }
        }
    },
    documents: 'src/**/*.graphql',
    generates: {
        'src/generated/graphql.ts': {
            plugins: [
                'typescript',
                'typescript-operations',
                'typescript-react-apollo'
            ],
            config: {
                withHooks: true,
                skipTypename: false
            }
        },
        'src/generated/graphql-request.ts': {
            plugins: [
                'typescript',
                'typescript-operations',
                'typescript-graphql-request'
            ]
        }
    }
};

export default config;
