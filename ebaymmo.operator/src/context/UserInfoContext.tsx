'use client';

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode
} from 'react';
//import { useSession } from 'next-auth/react';
import { useUserInfoSubscription } from '@/generated/graphql';
import { jwtDecode } from 'jwt-decode';
import { IDataTokenDecode } from '@/types/global.type';

// Define the shape of user info data
export interface UserInfo {
    balance: number | null;
    images: string | null;
    email: string | null;
    fullName: string | null;
    username: string | null;
    createAt: string | null;
    userId: string | null;
    twoFactorEnabled: boolean | null;
}

// Define the shape of the context
interface UserInfoContextType {
    userInfo: UserInfo | null;
    loading: boolean;
    error: any;
}

// Create the context with default values
const UserInfoContext = createContext<UserInfoContextType>({
    userInfo: null,
    loading: false,
    error: null
});

// Provider component
export function UserInfoProvider({ children }: { children: ReactNode }) {
    //const { data: session } = useSession();
    const token = localStorage.getItem('accessToken');
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    // Get userId from session token
    const userId = token
        ? jwtDecode<IDataTokenDecode>(token)['https://hasura.io/jwt/claims'][
              'X-Hasura-User-Id'
          ]
        : null;

    //console.log(userId);    // Subscribe to user info updates
    const { data, loading, error } = useUserInfoSubscription({
        variables: {
            userId: userId || ''
        },
        skip: !userId
    });

    // Update state when subscription data changes
    useEffect(() => {
        if (data?.usersByPk) {
            setUserInfo({
                balance: data.usersByPk.balance,
                images: data.usersByPk.images || null,
                email: data.usersByPk.email || null,
                fullName: data.usersByPk.fullName || null,
                username: data.usersByPk.username || null,
                createAt: data.usersByPk.createAt || null,
                userId: data.usersByPk.userId || null,
                twoFactorEnabled: data.usersByPk.twoFactorEnabled || null // Placeholder since the property does not exist
            });
        }
    }, [data]);

    // Provide the context value
    return (
        <UserInfoContext.Provider value={{ userInfo, loading, error }}>
            {children}
        </UserInfoContext.Provider>
    );
}

// Custom hook to use the context
export function useUserInfo() {
    const context = useContext(UserInfoContext);
    if (!context) {
        throw new Error('useUserInfo must be used within a UserInfoProvider');
    }
    return context;
}
