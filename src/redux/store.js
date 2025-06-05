import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './slices/chatSlice';
import connectionReducer from './slices/connectionSlice';

export const store = configureStore({
    reducer: {
        chat: chatReducer,
        connection: connectionReducer,
    },
});
