import { getSdk } from '@/generated/graphql-request';
import { GraphQLClient } from 'graphql-request';

const adminSDK = getSdk(
    new GraphQLClient(process.env.CODEGEN_HASURA_ENDPOINT!, {
        headers: {
            'X-Hasura-Admin-Secret':
                process.env.CODEGEN_HASURA_GRAPHQL_ADMIN_SECRET!
        }
    })
);

export default adminSDK;
