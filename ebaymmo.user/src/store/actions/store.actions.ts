import {
    GET_RELATED_STORE,
    GET_RELATED_STORE_SUCCESS,
    GET_RELATED_STORE_FAILURE
} from '../type/store.types';
import { Store } from '../reducers/store.reducer';

export const getRelatedStore = (storeId: string) => ({
    type: GET_RELATED_STORE,
    payload: storeId
});

export const getRelatedStoreSuccess = (stores: Store[]) => ({
    type: GET_RELATED_STORE_SUCCESS,
    payload: stores
});

export const getRelatedStoreFailure = (error: string) => ({
    type: GET_RELATED_STORE_FAILURE,
    payload: error
});
