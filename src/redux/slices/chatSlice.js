import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    messages: [],
    input: '',
    loading: false,
    isPasswordField: false,
};

export const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setInput: (state, action) => {
            state.input = action.payload;
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setIsPasswordField: (state, action) => {
            state.isPasswordField = action.payload;
        },
    },
});

export const { setInput, addMessage, setLoading, setIsPasswordField } = chatSlice.actions;

export const selectMessages = (state) => state.chat.messages;
export const selectInput = (state) => state.chat.input;
export const selectLoading = (state) => state.chat.loading;
export const selectIsPasswordField = (state) => state.chat.isPasswordField;

export default chatSlice.reducer;
