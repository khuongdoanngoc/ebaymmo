import { jwtDecode } from 'jwt-decode';

import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { RefreshTokenOperatorDocument } from '../generated/graphql';

interface JWTPayload {
    exp: number;
    iat: number;
    role?: string;
    roles?: string[];
    permissions?: string[];
    'https://hasura.io/jwt/claims'?: {
        'x-hasura-default-role'?: string;
        'x-hasura-allowed-roles'?: string[];
        'X-Hasura-User-Id'?: string;
    };
    [key: string]: any;
}

// Token keys in localStorage
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Theo dõi trạng thái refresh token
let isRefreshing = false;
const pendingRequests: Array<() => void> = [];

// Xử lý các requests đang chờ
export const resolvePendingRequests = () => {
    pendingRequests.forEach((callback) => callback());
    pendingRequests.length = 0;
};

// Thêm request vào hàng đợi
export const addPendingRequest = (callback: () => void) => {
    pendingRequests.push(callback);
};

// Lấy access token từ localStorage
export const getAccessToken = (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
};

// Lấy refresh token từ localStorage
export const getRefreshToken = (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// Lưu tokens
export const saveTokens = (accessToken: string, refreshToken?: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
};

// Xóa tokens khi đăng xuất
export const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Kiểm tra nếu người dùng đã đăng nhập
export const isLoggedIn = (): boolean => {
    return !!getAccessToken();
};

// Đăng xuất người dùng
export const logout = () => {
    clearTokens();
    window.location.href = '/login';
};

// Kiểm tra xem có đang refresh token hay không
export const isRefreshingToken = (): boolean => {
    return isRefreshing;
};

// Đặt trạng thái refreshing
export const setRefreshing = (status: boolean) => {
    isRefreshing = status;
};

// Hàm xử lý refresh token khi token hết hạn
export const handleTokenExpiration = async (
    client: ApolloClient<NormalizedCacheObject>
): Promise<boolean> => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        logout();
        return false;
    }

    try {
        const { data } = await client.mutate({
            mutation: RefreshTokenOperatorDocument,
            variables: { refreshToken }
        });

        if (data?.refreshTokenOperator) {
            const { accessToken, refreshToken: newRefreshToken } =
                data.refreshTokenOperator;
            saveTokens(accessToken, newRefreshToken || undefined);
            return true;
        } else {
            logout();
            return false;
        }
    } catch (error) {
        logout();
        return false;
    }
};

// Kiểm tra token hết hạn và quyền hạn
export const validateToken = (
    token?: string
): { valid: boolean; reason?: string } => {
    if (!token) return { valid: false, reason: 'missing-token' };

    try {
        const decoded = jwtDecode<JWTPayload>(token);

        // Kiểm tra hết hạn
        if (Date.now() >= decoded.exp * 1000) {
            return { valid: false, reason: 'expired-token' };
        }

        // Kiểm tra role - bao gồm cả cấu trúc Hasura
        const hasOperatorRole =
            decoded.role === 'operator' ||
            decoded.roles?.includes('operator') ||
            decoded['https://hasura.io/jwt/claims']?.[
                'x-hasura-default-role'
            ] === 'operator' ||
            decoded['https://hasura.io/jwt/claims']?.[
                'x-hasura-allowed-roles'
            ]?.includes('operator');

        if (!hasOperatorRole) {
            return { valid: false, reason: 'insufficient-permissions' };
        }

        return { valid: true };
    } catch (error) {
        console.error('Invalid token:', error);
        return { valid: false, reason: 'invalid-token' };
    }
};

// Add this function to check if a token is expired
export const isTokenExpired = (token: string): boolean => {
    try {
        const decoded = jwtDecode<{ exp: number }>(token);
        // exp is in seconds, Date.now() is in milliseconds
        return Date.now() >= decoded.exp * 1000;
    } catch (error) {
        console.error('Error decoding token:', error);
        // If we can't decode the token, consider it expired for safety
        return true;
    }
};
