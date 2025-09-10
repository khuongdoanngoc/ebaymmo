import {
    ApolloClient,
    HttpLink,
    InMemoryCache,
    concat,
    split,
    ApolloLink
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getSession } from 'next-auth/react';
import { auth } from '@/auth';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// Tạo một HttpLink để kết nối tới endpoint GraphQL
const httpLink = new HttpLink({
    uri:
        process.env.NEXT_PUBLIC_HASURA_ENDPOINT ||
        'http://localhost:8083/v1/graphql', // Lấy endpoint từ biến môi trường
    fetch
});

// Kiểm tra xem có phải đang ở phía trình duyệt (browser) hay không
const isBrowser = typeof window !== 'undefined';

// Tạo authLink để thêm token vào headers khi gửi yêu cầu
const authLink = setContext(async (_, { headers = {} }) => {
    let token;

    if (isBrowser) {
        // Client-side
        const session = await getSession();
        token = session?.user?.accessToken;
    } else {
        // Server-side
        const session = await auth();
        token = session?.user?.accessToken;
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return {
        headers: {
            ...headers
        }
    };
});

// Tạo errorLink để xử lý lỗi từ GraphQL
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
    if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path, extensions }) => {
            console.error(
                `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`
            );
            console.error('Extensions:', extensions);
            console.error('Operation:', operation.operationName);
        });
    }

    if (networkError) {
        console.error(`[Network error]: ${networkError}`);
    }
});

// Khởi tạo cache cho Apollo Client
export const cache = new InMemoryCache();

// WebSocket link cho subscriptions
const wsLink = isBrowser
    ? new GraphQLWsLink(
          createClient({
              url:
                  process.env.NEXT_PUBLIC_HASURA_ENDPOINT?.replace(
                      'https://',
                      'wss://'
                  ) || '',
              connectionParams: async () => {
                  const session = await getSession();
                  return {
                      headers: {
                          Authorization: session?.user?.accessToken
                              ? `Bearer ${session.user.accessToken}`
                              : ''
                      }
                  };
              }
          })
      )
    : null;

// Phân chia traffic giữa WebSocket và HTTP
const splitLink = isBrowser
    ? split(
          ({ query }) => {
              const definition = getMainDefinition(query);
              return (
                  definition.kind === 'OperationDefinition' &&
                  definition.operation === 'subscription'
              );
          },
          wsLink as ApolloLink,
          ApolloLink.from([errorLink, authLink, httpLink])
      )
    : ApolloLink.from([errorLink, authLink, httpLink]);

// Tạo Apollo Client với các cấu hình và liên kết
export const client = new ApolloClient({
    ssrMode: !isBrowser,
    link: splitLink,
    cache,
    connectToDevTools: isBrowser && process.env.NODE_ENV !== 'production'
});
