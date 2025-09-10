// components/AuthHandler.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

// Define a custom session type that includes accessToken
interface CustomSession {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
    accessToken?: string;
    expires: string;
}

export const AuthHandler = () => {
    const { data: session } = useSession();

    useEffect(() => {
        // Cast session to CustomSession type
        const customSession = session as CustomSession;

        if (customSession?.accessToken) {
            localStorage.setItem('accessToken', customSession.accessToken);
        } else {
            localStorage.removeItem('accessToken');
        }
    }, [session]);

    return null;
};
