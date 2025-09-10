'use client';

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode
} from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

// Create context with default values
const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    const token = localStorage.getItem('accessToken');
    // Get token from session
    useEffect(() => {
        if (token) {
            setAccessToken(token as string);
        }
    }, [token]);

    // Initialize socket connection
    const initializeSocket = useCallback(() => {
        if (!accessToken) return;

        const socketConnection = io('wss://shop3-chat.crbgroup.live', {
            query: { accessToken },
            extraHeaders: {
                Authorization: `Bearer ${accessToken}`
            },
            withCredentials: false // Thêm credentials
        });

        socketConnection.on('connect', () => {
            console.log('connected to socket');
            setIsConnected(true);
        });

        socketConnection.on('disconnect', () => {
            setIsConnected(false);
        });

        setSocket(socketConnection);

        return () => {
            socketConnection.disconnect();
        };
    }, [accessToken]);

    // Initialize socket when accessToken is available
    useEffect(() => {
        if (accessToken) {
            const cleanup = initializeSocket();
            return cleanup;
        }
    }, [accessToken, initializeSocket]);

    // Context value
    const value = {
        socket,
        isConnected
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

// Hook to use SocketContext
export const useSocketContext = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error(
            'useSocketContext must be used within a SocketProvider'
        );
    }
    return context;
};
