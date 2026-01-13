import { configureStore } from '@reduxjs/toolkit';
import taskReducer from './slices/taskSlice';
import uiReducer from './slices/uiSlice';
import chatReducer from './slices/chatSlice';
import connectionReducer from './slices/connectionSlice';

export const store = configureStore({
    reducer: {
        tasks: taskReducer,
        ui: uiReducer,
        chat: chatReducer,
        connection: connectionReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['tasks/addTask', 'tasks/updateTask'],
                ignoredPaths: ['tasks.tasks', 'tasks.archivedTasks', 'tasks.history']
            }
        })
});
