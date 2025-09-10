import { call, put, takeEvery } from 'redux-saga/effects';
import {
    googleSignInFailure,
    googleSignInRequest,
    googleSignInSuccess
} from '../slices/auth.slice';
import { signIn } from 'next-auth/react';

interface SignInResponse {
    user: {
        id: string;
        name: string;
        email: string;
    };
    error?: string;
}

function* handleGoogleSignIn(): Generator<any, void, SignInResponse> {
    try {
        const result = yield call(signIn, 'google', {
            redirect: false
        });

        if (result?.error) {
            yield put(googleSignInFailure({ error: result.error }));
            return;
        }

        yield put(googleSignInSuccess(result));
    } catch (error: any) {
        yield put(googleSignInFailure({ error: error.message }));
    }
}

export default function* authSaga() {
    yield takeEvery(googleSignInRequest.type, handleGoogleSignIn);
}
