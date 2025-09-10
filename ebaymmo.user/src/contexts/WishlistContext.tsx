/**
 * WishlistContext - A global context for managing wishlist state
 *
 * Usage:
 * 1. Use the wishlist hook in any component:
 * ```tsx
 * function ProductCard({ storeId }) {
 *   const { isWishlisted, handleToggleWishlist, loading } = useWishlist();
 *
 *   if (loading) return <LoadingState />;
 *
 *   return (
 *     <button onClick={() => handleToggleWishlist(storeId)}>
 *       <Image
 *         src={isWishlisted(storeId) ? "/images/heart-checked.svg" : "/images/heart.png"}
 *         alt="favorite"
 *         width={30}
 *         height={30}
 *       />
 *     </button>
 *   );
 * }
 * ```
 *
 * Features:
 * - Auto-fetches wishlist data when user is logged in
 * - Handles add/remove wishlist with optimistic UI updates
 * - Uses Apollo Cache for instant UI feedback
 * - Provides loading and error states
 * - Built-in error handling with status modals
 * - Type-safe with TypeScript
 *
 * @returns {
 *   wishlist: Array of wishlist items with storeId and wishlistId
 *   isWishlisted: Function to check if a store is in wishlist
 *   handleToggleWishlist: Function to toggle wishlist status (add/remove)
 *   loading: Boolean indicating if wishlist is loading
 *   error: Any error that occurred during fetching
 * }
 */

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
    useGetWishlistQuery,
    useInsertWishlistMutation,
    useDeleteWishlistMutation
} from '@/generated/graphql';
import { jwtDecode } from 'jwt-decode';
import { IDataTokenDecode } from '@/types/global.type';
import { useStatusModal } from './StatusModalContext';

interface WishlistContextType {
    wishlist: Array<{ storeId: string }>;
    isWishlisted: (storeId: string) => boolean;
    handleToggleWishlist: (storeId: string) => Promise<void>;
    loading: boolean;
    error: any;
}

const WishlistContext = createContext<WishlistContextType>({
    wishlist: [],
    isWishlisted: () => false,
    handleToggleWishlist: async () => {},
    loading: false,
    error: null
});

export const WishlistProvider = ({
    children
}: {
    children: React.ReactNode;
}) => {
    const { data: session } = useSession();
    const { showModal } = useStatusModal();
    const [insertWishlist] = useInsertWishlistMutation();
    const [deleteWishlist] = useDeleteWishlistMutation();

    // Get userId from session
    const userId = useMemo(() => {
        if (!session?.user?.accessToken) return null;
        return jwtDecode<IDataTokenDecode>(session.user.accessToken)[
            'https://hasura.io/jwt/claims'
        ]['X-Hasura-User-Id'];
    }, [session]);

    // Query wishlist data
    const { data, loading, error } = useGetWishlistQuery({
        variables: {
            where: {
                userId: {
                    _eq: userId
                }
            }
        },
        skip: !userId, // Skip query if no userId
        fetchPolicy: 'cache-and-network' // Use cache but also check network for updates
    });

    // Memoize wishlist data
    const [wishlist, setWishlist] = useState<Array<{ storeId: string }>>([]);

    useEffect(() => {
        setWishlist(
            data?.wishlist.map((item) => ({ storeId: item.storeId })) || []
        );
    }, [data]);

    // Helper function to check if a store is wishlisted
    const isWishlisted = (storeId: string): boolean => {
        return wishlist.some((item) => item.storeId === storeId);
    };

    const handleToggleWishlist = async (storeId: string) => {
        if (!session?.user) {
            showModal('error', 'Please login to use wishlist');
            return;
        }

        try {
            if (isWishlisted(storeId)) {
                await deleteWishlist({
                    variables: {
                        where: {
                            storeId: { _eq: storeId },
                            userId: { _eq: userId }
                        }
                    }
                });
                setWishlist((prev) =>
                    prev.filter((item) => item.storeId !== storeId)
                );
            } else {
                await insertWishlist({
                    variables: { storeId, userId: userId }
                });
                setWishlist((prev) => [...prev, { storeId }]);
            }
        } catch (error: any) {
            console.error('Wishlist operation failed:', error);
            showModal('error', 'Operation failed. Please try again.');
        }
    };

    const value = {
        wishlist,
        isWishlisted,
        handleToggleWishlist,
        loading,
        error
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};

// Custom hook to use wishlist context
export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};
