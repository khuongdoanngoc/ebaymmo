import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useGetUserStoresQuery, useGetAllUserStoresQuery } from '@/generated/graphql';

interface SelectStoreModalProps {
    userId: string;
    categoryId?: string | null;
    onSelect: (storeId: string) => void;
    onClose: () => void;
}

interface Store {
    storeId: any;
    storeName?: string | null;
    avatar?: string | null;
    description?: string | null;
    shortDescription?: string | null;
    __typename?: string;
}

const SelectStoreModal = ({
    userId,
    categoryId,
    onSelect,
    onClose
}: SelectStoreModalProps) => {
    const isCategorySpecific = !!categoryId;
    
    // Sử dụng query GetUserStores khi có categoryId
    const { 
        data: categoryStoresData, 
        loading: categoryStoresLoading, 
        error: categoryStoresError 
    } = useGetUserStoresQuery({
        variables: { 
            userId, 
            categoryId: categoryId || '' 
        },
        skip: !isCategorySpecific // Bỏ qua query này nếu không có categoryId
    });
    
    // Sử dụng query GetAllUserStores khi không có categoryId
    const { 
        data: allStoresData, 
        loading: allStoresLoading, 
        error: allStoresError 
    } = useGetAllUserStoresQuery({
        variables: { userId },
        skip: isCategorySpecific // Bỏ qua query này nếu có categoryId
    });
    
    // Kết hợp dữ liệu từ cả hai query
    const loading = isCategorySpecific ? categoryStoresLoading : allStoresLoading;
    const error = isCategorySpecific ? categoryStoresError : allStoresError;
    const storesData = isCategorySpecific ? categoryStoresData : allStoresData;
    const stores = storesData?.stores || [];

    if (error) {
        console.error("Error loading stores:", error);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[400px]">
                <h2 className="text-xl font-bold mb-4">
                    {isCategorySpecific ? "Select a store for this category" : "Select any store"}
                </h2>

                {loading ? (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {[...Array(3)].map((_, index) => (
                            <div
                                key={index}
                                className="w-full flex items-center gap-3 p-3 rounded-lg animate-pulse"
                            >
                                {/* Avatar skeleton */}
                                <div className="w-[40px] h-[40px] bg-gray-200 rounded-full" />

                                {/* Text content skeleton */}
                                <div className="flex-1">
                                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {stores.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                                {isCategorySpecific 
                                    ? "No stores available for this category. Please create a store first." 
                                    : "No stores available. Please create a store first."}
                            </div>
                        ) : (
                            stores.map((store) => (
                                <button
                                    key={store.storeId}
                                    onClick={() => {
                                        onSelect(store.storeId);
                                        onClose();
                                    }}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition"
                                >
                                    <Image
                                        src={
                                            store.avatar ||
                                            '/images/store-default.png'
                                        }
                                        alt={store.storeName || ''}
                                        width={40}
                                        height={40}
                                        className="rounded-full"
                                    />
                                    <div className="text-left">
                                        <div className="font-semibold">
                                            {store.storeName}
                                        </div>
                                        {/* <div className="text-sm text-gray-500">{store.description}</div> */}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}

                <button
                    onClick={onClose}
                    className="mt-4 w-full py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default SelectStoreModal;
