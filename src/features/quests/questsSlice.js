import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import equal from 'fast-deep-equal';

import doFetchQuests from './do-fetch-quests';

const initialState = {
    quests: [],
    status: 'idle',
    error: null,
};

export const fetchQuests = createAsyncThunk('quests/fetchQuests', () =>
    doFetchQuests(),
);
const questsSlice = createSlice({
    name: 'quests',
    initialState,
    reducers: {},
    extraReducers: {
        [fetchQuests.pending]: (state, action) => {
            state.status = 'loading';
        },
        [fetchQuests.fulfilled]: (state, action) => {
            state.status = 'succeeded';

            if (!equal(state.quests, action.payload)) {
                state.quests = action.payload;
            }
        },
        [fetchQuests.rejected]: (state, action) => {
            state.status = 'failed';
            console.log(action.error);
            state.error = action.payload;
        },
    },
});

export default questsSlice.reducer;

export const selectQuests = (state) => state.quests.quests;
