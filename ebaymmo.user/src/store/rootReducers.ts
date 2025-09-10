import { combineReducers } from '@reduxjs/toolkit';
import { storeReducer } from './reducers/store.reducer';
import authReducer from './slices/auth.slice';

const rootReducer = combineReducers({
    store: storeReducer,
    auth: authReducer
});

export default rootReducer;
