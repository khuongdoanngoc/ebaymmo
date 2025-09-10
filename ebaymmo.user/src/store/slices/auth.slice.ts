import { createSlice } from '@reduxjs/toolkit';

interface AuthState {
    userInfo: {
        data: any | null;
        loading: boolean;
        error: null | string;
    };
    googleSignIn: {
        loading: boolean;
        error: null | string;
    };
    errorMessage: string;
    successMessage: string;
}

const initialState: AuthState = {
    userInfo: {
        data: null,
        loading: false,
        error: null
    },
    googleSignIn: {
        loading: false,
        error: null
    },
    errorMessage: '',
    successMessage: ''
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Google Sign In
        googleSignInRequest: (state) => {
            state.googleSignIn.loading = true;
            state.googleSignIn.error = null;
        },
        googleSignInSuccess: (state, action) => {
            state.googleSignIn.loading = false;
            state.userInfo.data = action.payload;
            state.successMessage = 'Login success!';
        },
        googleSignInFailure: (state, action) => {
            state.googleSignIn.loading = false;
            state.googleSignIn.error = action.payload.error;
            state.errorMessage = 'Login failed!';
        },

        // Logout
        logoutRequest: (state) => {
            state.userInfo.data = null;
        }
    }
});

export const {
    googleSignInRequest,
    googleSignInSuccess,
    googleSignInFailure,
    logoutRequest
} = authSlice.actions;

export default authSlice.reducer;
