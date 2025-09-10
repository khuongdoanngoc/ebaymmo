import {
    ApolloClient,
    InMemoryCache,
    HttpLink,
    ApolloLink,
    fromPromise,
    split
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import {
    getAccessToken,
    getRefreshToken,
    isTokenExpired,
    logout,
    saveTokens
} from '../utils/auth';
import { RefreshTokenOperatorDocument } from '@/generated/graphql';
import { jwtDecode } from 'jwt-decode';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { HTTP_URL, WS_URL } from '@/config';
// API URLs

declare global {
    interface Window {
        APP_CONFIG?: {
            API_ENDPOINT: string;
            GRAPHQL_WS_ENDPOINT: string;
        };
    }
}

// Client riêng chỉ để refresh token (không có errorLink để tránh vòng lặp vô hạn)
const refreshClient = new ApolloClient({
    link: new HttpLink({ uri: HTTP_URL }),
    cache: new InMemoryCache()
});
let pendingRequests: Function[] = [];
// Xử lý hàng đợi request
const processQueue = (accessToken: string | null) => {
    pendingRequests.forEach((callback) => callback(accessToken));
    pendingRequests = [];
};
// Kiểm tra token có hợp lệ và có role operator không
const isValidOperatorToken = (token: string): boolean => {
    try {
        // Kiểm tra nếu token không đúng định dạng base64url
        if (!token || token.trim() === '' || !token.includes('.')) {
            console.error('Token không đúng định dạng JWT');
            return false;
        }
        // Decode token
        const decoded: any = jwtDecode(token);
        // Kiểm tra role operator trong cấu trúc Hasura JWT
        const hasOperatorRole =
            decoded['https://hasura.io/jwt/claims'] &&
            (decoded['https://hasura.io/jwt/claims'][
                'x-hasura-default-role'
            ] === 'operator' ||
                (decoded['https://hasura.io/jwt/claims'][
                    'x-hasura-allowed-roles'
                ] &&
                    decoded['https://hasura.io/jwt/claims'][
                        'x-hasura-allowed-roles'
                    ].includes('operator')));
        return hasOperatorRole;
    } catch (error) {
        console.error('Token không hợp lệ:', error);
        return false;
    }
};
// Link xác thực
const authLink = new ApolloLink((operation, forward) => {
    const token = getAccessToken() ?? '';
    // Kiểm tra token có hợp lệ không
    if (token) {
        // Nếu token không hợp lệ hoặc không có role operator, logout
        if (!isValidOperatorToken(token)) {
            console.log(
                'Token không hợp lệ hoặc không có quyền operator, đăng xuất'
            );
            logout();
            operation.setContext(({ headers = {} }) => ({
                headers: {
                    ...headers
                }
            }));
            return forward(operation);
        }
        // Nếu token hết hạn, thử refresh
        if (isTokenExpired(token)) {
            // Chuyển đổi Promise thành Observable
            return fromPromise(
                new Promise((resolve) => {
                    const refreshToken = getRefreshToken();
                    if (!refreshToken) {
                        console.log('Không có refresh token, đăng xuất');
                        logout();
                        // Vẫn tiếp tục request nhưng không có token
                        operation.setContext(({ headers = {} }) => ({
                            headers: {
                                ...headers
                            }
                        }));
                        resolve(forward(operation));
                        return;
                    }
                    // Sử dụng refreshClient thay vì client chính
                    refreshClient
                        .mutate({
                            mutation: RefreshTokenOperatorDocument,
                            variables: { refreshToken }
                        })
                        .then(({ data }) => {
                            if (data?.refreshTokenOperator) {
                                const {
                                    accessToken,
                                    refreshToken: newRefreshToken
                                } = data.refreshTokenOperator;
                                // Lưu token mới
                                saveTokens(
                                    accessToken,
                                    newRefreshToken || undefined
                                );
                                console.log('Token đã được refresh thành công');
                                // Cập nhật token cho request hiện tại
                                operation.setContext(({ headers = {} }) => ({
                                    headers: {
                                        ...headers,
                                        Authorization: `Bearer ${accessToken}`
                                    }
                                }));
                                // Xử lý các request đang đợi
                                if (pendingRequests.length > 0) {
                                    processQueue(accessToken);
                                }
                            } else {
                                console.log(
                                    'Refresh token thất bại, đăng xuất'
                                );
                                logout();
                                // Tiếp tục không có token
                                operation.setContext(({ headers = {} }) => ({
                                    headers: {
                                        ...headers
                                    }
                                }));
                            }
                            // Tiếp tục request dù refresh thành công hay thất bại
                            resolve(forward(operation));
                        })
                        .catch((error) => {
                            console.error('Lỗi khi refresh token:', error);
                            logout();
                            // Tiếp tục không có token
                            operation.setContext(({ headers = {} }) => ({
                                headers: {
                                    ...headers
                                }
                            }));
                            resolve(forward(operation));
                        });
                })
            ).flatMap(() => forward(operation));
        }
    }
    // Trường hợp token còn hạn và hợp lệ, tiếp tục bình thường
    operation.setContext(({ headers = {} }) => ({
        headers: {
            ...headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    }));
    return forward(operation);
});
// Link xử lý lỗi
const errorLink = onError(
    ({ graphQLErrors, networkError, operation, forward }) => {
        if (graphQLErrors) {
            graphQLErrors.forEach(({ message, locations, path }) => {
                console.error(
                    `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`
                );
                // Kiểm tra lỗi JWT không hợp lệ
                if (
                    message.includes('Could not verify JWT') ||
                    message.includes('Not valid base64url') ||
                    message.includes('JSONDecodeError')
                ) {
                    console.log('JWT không hợp lệ, đăng xuất người dùng');
                    logout();
                }
            });
        }
        if (networkError) {
            console.error(`[Network error]: ${networkError}`);
        }
        return forward(operation);
    }
);
// HTTP link
const httpLink = new HttpLink({
    uri: HTTP_URL
});
// WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(
    createClient({
        url: WS_URL,
        connectionParams: () => {
            const token = getAccessToken();
            return {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            };
        }
    })
);
// Split links based on operation type
const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        );
    },
    wsLink,
    httpLink
);
// Client setup with combined links
const client = new ApolloClient({
    link: ApolloLink.from([errorLink, authLink, splitLink]),
    cache: new InMemoryCache()
});
export default client;
