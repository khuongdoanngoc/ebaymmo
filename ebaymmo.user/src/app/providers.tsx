'use client';

import { ApolloProvider } from '@apollo/client';
import { StatusModalProvider } from '@/contexts/StatusModalContext';
import { Provider } from 'react-redux';
import store from '@/store';
import { SessionProvider } from 'next-auth/react';
import { client } from '@/libs/apoloCLient';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { UserInfoProvider } from '@/contexts/UserInfoContext';
import { SocketProvider } from '@/contexts/SocketConnectionContext';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ApolloProvider client={client}>
                <Provider store={store}>
                    <UserInfoProvider>
                        <SocketProvider>
                            <StatusModalProvider>
                                <WishlistProvider>{children}</WishlistProvider>
                            </StatusModalProvider>
                        </SocketProvider>
                    </UserInfoProvider>
                </Provider>
            </ApolloProvider>
        </SessionProvider>
    );
}
