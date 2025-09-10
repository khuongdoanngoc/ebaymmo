import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { jwtDecode } from 'jwt-decode';
import { getSdk } from '@/generated/graphql-request';
import { GraphQLClient } from 'graphql-request';

const authSDK = getSdk(
    new GraphQLClient(process.env.NEXT_PUBLIC_HASURA_ENDPOINT!)
);

// Type declarations
declare module 'next-auth' {
    interface Session {
        user: {
            accessToken?: string;
            refreshToken?: string;
            provider?: string;
            name?: string;
            username?: string;
            email: string;
            image?: string;
            id: string;
            avatar?: string;
            role?: string;
            sellerSince?: string;
            emailVerified: boolean | null;
        };
    }

    interface JWT {
        accessToken?: string;
        refreshToken?: string;
        provider?: string;
        name?: string;
        username?: string;
        email?: string;
        avatar?: string;
        role?: string;
        sellerSince?: string;
        sub?: string;
        exp?: number;
    }

    interface User {
        id?: string;
        email?: string | null;
        name?: string | null;
        username?: string;
        avatar?: string | null;
        role?: string;
        accessToken?: string;
        refreshToken: string;
        provider: string;
        sellerSince?: string;
    }
}
// Hàm hỗ trợ để tạo SDK với header động
const getAuthSDKWithToken = (token: string) => {
    const clientWithToken = new GraphQLClient(
        process.env.NEXT_PUBLIC_HASURA_ENDPOINT!,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
    return getSdk(clientWithToken);
};

// Utility function to check token expiration
const isTokenExpired = (token?: string): boolean => {
    if (!token) return true;

    try {
        const decoded = jwtDecode<{ exp: number }>(token);
        return Date.now() >= decoded.exp * 1000;
    } catch (error) {
        console.error('Invalid token:', error);
        return true;
    }
};

// NextAuth configuration
export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },

            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Missing credentials');
                }

                const { email, password } = credentials as {
                    email: string;
                    password: string;
                };

                try {
                    const { login } = await authSDK.Login({
                        email,
                        password
                    });

                    if (!login?.accessToken) {
                        throw new Error('Invalid credentials');
                    }

                    const sdkWithToken = getAuthSDKWithToken(login.accessToken);
                    const userData = await sdkWithToken.GetUserInfo({ email });

                    const user = userData?.users?.[0];
                    if (!user) {
                        throw new Error('User not found');
                    }

                    return {
                        id: user.userId,
                        email: user.email,
                        username: user.username,
                        avatar: user.images,
                        role: user.role,
                        sellerSince: user.sellerSince,
                        accessToken: login.accessToken,
                        refreshToken: login.refreshToken,
                        provider: 'credentials'
                    };
                } catch (error) {
                    console.error('Authorize error:', error);
                    throw new Error(
                        error instanceof Error
                            ? error.message
                            : 'Authentication failed'
                    );
                }
            }
        }),
        GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            authorization: {
                params: {
                    prompt: 'consent',
                    access_type: 'offline',
                    response_type: 'code'
                }
            }
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60 // 30 days
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            const currentTime = Date.now();
            const LOGIN_TIMEOUT = 300000; // 5 phút

            // Helper function to update last login
            const updateLastLogin = async (accessToken: string) => {
                try {
                    const sdkWithToken = getSdk(
                        new GraphQLClient(
                            process.env.NEXT_PUBLIC_HASURA_ENDPOINT!,
                            {
                                headers: {
                                    Authorization: `Bearer ${accessToken}`
                                }
                            }
                        )
                    );

                    await sdkWithToken.editUserLastLogin({
                        now: new Date().toISOString()
                    });
                } catch (error) {
                    console.error('Failed to update last login:', error);
                }
            };

            if (
                account?.provider === 'google' &&
                account?.id_token &&
                profile
            ) {
                try {
                    const decoded = jwtDecode<{ iat: number }>(
                        account.id_token
                    );
                    const issuedAt = decoded.iat * 1000;
                    if (currentTime - issuedAt > LOGIN_TIMEOUT) {
                        console.error('Google login timeout exceeded');
                        return false;
                    }

                    if (!profile.email || !profile.name || !profile.sub) {
                        throw new Error(
                            'Google profile is missing required fields'
                        );
                    }

                    if (!account.access_token) {
                        throw new Error('Google access token is missing');
                    }

                    const { googleLogin } = await authSDK.GoogleLogin({
                        profile: {
                            email: profile.email,
                            name: profile.name,
                            sub: profile.sub,
                            images: profile.picture
                        },
                        accessToken: account.access_token
                    });

                    if (
                        !googleLogin?.accessToken ||
                        !googleLogin?.refreshToken
                    ) {
                        throw new Error('Google login failed: Missing tokens');
                    }
                    // Tạo SDK với token để lấy thông tin user
                    const sdkWithToken = getAuthSDKWithToken(
                        googleLogin.accessToken
                    );
                    const userData = await sdkWithToken.GetUserInfo({
                        email: profile.email
                    });

                    const googleUser = userData?.users?.[0];
                    if (!googleUser) {
                        throw new Error('Google user not found in Hasura');
                    }

                    user.id = googleUser.userId;
                    user.email = googleUser.email;
                    user.username = googleUser.username;
                    user.avatar = googleUser.images || profile.picture;
                    user.role = googleUser.role;
                    user.sellerSince = googleUser.sellerSince;
                    user.accessToken = googleLogin.accessToken;
                    user.refreshToken = googleLogin.refreshToken;
                    user.provider = 'google';
                    user.name = profile.name;

                    // Cập nhật lastLogin sau khi đăng nhập thành công
                    await updateLastLogin(googleLogin.accessToken);

                    return true;
                } catch (error) {
                    console.error('Google sign-in error:', error);
                    return false;
                }
            }

            if (account?.provider === 'credentials' && user.accessToken) {
                try {
                    const decoded = jwtDecode<{ iat: number }>(
                        user.accessToken
                    );
                    const issuedAt = decoded.iat * 1000;

                    if (currentTime - issuedAt > LOGIN_TIMEOUT) {
                        console.error('Credentials login timeout exceeded');
                        return false;
                    }

                    // Cập nhật lastLogin sau khi đăng nhập thành công
                    await updateLastLogin(user.accessToken);

                    return !!user.accessToken;
                } catch (error) {
                    console.error('Error decoding credentials token:', error);
                    return false;
                }
            }

            return !!user.email;
        },

        async jwt({ token, user, account, trigger, session }) {
            // Initial sign in
            if (user && account) {
                return {
                    ...token,
                    accessToken: user.accessToken as string,
                    refreshToken: user.refreshToken as string,
                    provider: user.provider as string,
                    name: user.name as string,
                    username: user.username as string,
                    email: user.email as string,
                    avatar: user.avatar as string,
                    role: user.role as string,
                    sub: user.id as string,
                    sellerSince: user.sellerSince as string
                };
            }

            // Handle updates
            if (trigger === 'update' && session?.user) {
                return {
                    ...token,
                    avatar: session.user.avatar,
                    image: session.user.image
                };
            }

            // Refresh token if expired
            if (
                token.accessToken &&
                isTokenExpired(token.accessToken as string)
            ) {
                try {
                    // Tạo SDK với token hiện tại để làm mới token
                    const sdkWithToken = getAuthSDKWithToken(
                        token.accessToken as string
                    );
                    const { refreshToken } = await sdkWithToken.RefreshToken({
                        refreshToken: token.refreshToken as string
                    });

                    if (!refreshToken?.accessToken) {
                        throw new Error('Refresh token failed');
                    }

                    return {
                        ...token,
                        accessToken: refreshToken.accessToken,
                        refreshToken: refreshToken.refreshToken
                    };
                } catch (error) {
                    console.error('Token refresh error:', error);
                    return { ...token, error: 'RefreshAccessTokenError' };
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (token.error) {
                throw new Error('Token refresh failed');
            }

            session.user = {
                accessToken: token.accessToken as string,
                refreshToken: token.refreshToken as string,
                provider: token.provider as string,
                name: token.username as string,
                username: token.username as string,
                email: token.email as string,
                image: token.avatar as string,
                id: token.sub as string,
                avatar: token.avatar as string,
                role: token.role as string,
                sellerSince: token.sellerSince as string,
                emailVerified: null
            };
            return session;
        },
        async redirect({ url, baseUrl }) {
            // Lấy callbackUrl từ URL nếu có (ví dụ: /login?callbackUrl=/account-management)
            const urlObj = new URL(
                url.startsWith('http') ? url : `${baseUrl}${url}`
            );
            const callbackUrl = urlObj.searchParams.get('callbackUrl');

            // Nếu có callbackUrl, kiểm tra và redirect đến đó
            if (callbackUrl) {
                // Nếu callbackUrl là relative URL
                if (callbackUrl.startsWith('/')) {
                    return `${baseUrl}${callbackUrl}`;
                }
                // Nếu callbackUrl là absolute URL và cùng origin
                const callbackUrlObj = new URL(
                    callbackUrl.startsWith('http')
                        ? callbackUrl
                        : `${baseUrl}${callbackUrl}`
                );
                if (callbackUrlObj.origin === baseUrl) {
                    return callbackUrl;
                }
            }

            // Nếu không có callbackUrl hoặc callbackUrl không hợp lệ, xử lý như mặc định
            if (url.startsWith('/')) return `${baseUrl}${url}`;
            if (new URL(url).origin === baseUrl) return url;
            return baseUrl; // Mặc định về trang chủ
        }
    },
    pages: {
        signIn: '/login',
        error: '/auth/error'
    },
    debug: process.env.NODE_ENV === 'development'
});
