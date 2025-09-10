import {
    GET_RELATED_STORE,
    GET_RELATED_STORE_FAILURE
} from '../type/store.types';

export interface Store {
    storeId: string;
    storeName: string;
    description?: string;
    avatar?: string;
    averageRating: number;
    stockCount: number;
    storePrice: number;
}

interface StoreState {
    loading: boolean;
    error: string | null;
    relatedStoreId: string | null;
}

interface StoreAction {
    type: string;
    payload?: Store | Store[] | string;
}

const initialState: StoreState = {
    loading: false,
    error: null,
    relatedStoreId: null
};

export const storeReducer = (
    state = initialState,
    action: StoreAction
): StoreState => {
    switch (action.type) {
        case GET_RELATED_STORE:
            return {
                ...state,
                loading: true,
                relatedStoreId: action.payload as string
            };
        case GET_RELATED_STORE_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload as string
            };
        default:
            return state;
    }
};
