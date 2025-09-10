import { call, put, takeLatest } from 'redux-saga/effects';
import { GET_RELATED_STORE } from '../type/store.types';
import {
    getRelatedStoreSuccess,
    getRelatedStoreFailure
} from '../actions/store.actions';
import { OrderBy, useGetStoresQuery } from '@/generated/graphql';

function* getRelatedStoreSaga() {
    try {
        const { data } = yield call(useGetStoresQuery, {
            variables: {
                where: {},
                limit: 4,
                offset: 0,
                orderBy: [
                    {
                        averageRating: OrderBy.Desc
                    }
                ]
            }
        });

        if (data?.stores?.length > 0) {
            yield put(getRelatedStoreSuccess(data.stores));
        }
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : 'Failed to fetch related stores';
        yield put(getRelatedStoreFailure(errorMessage));
    }
}

export default function* storeSaga() {
    yield takeLatest(GET_RELATED_STORE, getRelatedStoreSaga);
}
