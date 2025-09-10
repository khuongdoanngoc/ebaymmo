import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface StoreState {
    relatedStoreId: string | null;
}

const initialState: StoreState = {
    relatedStoreId: null
};

const storeSlice = createSlice({
    name: 'store',
    initialState,
    reducers: {
        getRelatedStore: (state, action: PayloadAction<string>) => {
            state.relatedStoreId = action.payload;
        }
    }
});

export const { getRelatedStore } = storeSlice.actions;
export default storeSlice.reducer;
