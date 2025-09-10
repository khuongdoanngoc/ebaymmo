import { ApolloClient, InMemoryCache } from '@apollo/client';
import axios from 'axios';

// Function để log truy cập store khi user đã đăng nhập qua API route
export const logStoreAccess = async (
    client: ApolloClient<object>,
    storeId: string,
    userId: string
): Promise<void> => {
    console.log(
        `[StoreAccess] Logging access for user ${userId} to store ${storeId}`
    );

    try {
        console.log('[StoreAccess] Calling API route with user data:', {
            storeId,
            userId
        });

        const response = await axios.post('/api/store-access', {
            storeId,
            userId
        });

        console.log('[StoreAccess] API response for user:', response.data);

        if (response.data.success) {
            console.log('[StoreAccess] Successfully logged access for user');
        } else {
            console.log(
                '[StoreAccess] API returned error:',
                response.data.message
            );
        }
    } catch (error) {
        console.error(
            '[StoreAccess] Error logging store access for user:',
            error
        );
        if (error instanceof Error) {
            console.error('[StoreAccess] Error details:', error.message);
            console.error('[StoreAccess] Error stack:', error.stack);
        }
    }
};

// Hook chính để sử dụng trong component
export const handleStoreAccess = async (
    client: ApolloClient<object>,
    storeId: string,
    userId?: string
): Promise<void> => {
    console.log('[StoreAccess] handleStoreAccess called with:', {
        storeId,
        userId
    });

    if (!userId) {
        console.log(
            '[StoreAccess] User is not logged in, skipping access logging'
        );
        return;
    }

    console.log('[StoreAccess] User is logged in, using userId:', userId);
    await logStoreAccess(client, storeId, userId);
};
