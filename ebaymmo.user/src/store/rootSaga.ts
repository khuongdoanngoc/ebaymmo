import { all } from 'redux-saga/effects';
import authSaga from './sagas/auth.saga';
import storeSaga from './sagas/store.saga';

export default function* rootSaga() {
    yield all([authSaga(), storeSaga()]);
}
