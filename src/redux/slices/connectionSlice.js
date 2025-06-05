import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    source: {
        connected: false,
        connectionType: null,
        details: {},
        missingFields: [],
    },
    target: {
        connected: false,
        connectionType: null,
        details: {},
        missingFields: [],
    },
    pipeline: {
        type: null,
        ready: false,
        schema: null,
        tables: [],
    },
    availableSchemas: [],
    availableTables: [],
    selectedTables: [],
    currentTab: 0,
};

export const connectionSlice = createSlice({
    name: 'connection',
    initialState,
    reducers: {
        setSourceConnection: (state, action) => {
            state.source = { ...state.source, ...action.payload };
        },
        setTargetConnection: (state, action) => {
            state.target = { ...state.target, ...action.payload };
        },
        setPipeline: (state, action) => {
            state.pipeline = { ...state.pipeline, ...action.payload };
        },
        setAvailableSchemas: (state, action) => {
            state.availableSchemas = action.payload;
        },
        setAvailableTables: (state, action) => {
            state.availableTables = action.payload;
        },
        addSelectedTable: (state, action) => {
            if (!state.selectedTables.includes(action.payload)) {
                state.selectedTables.push(action.payload);
            }
        },
        removeSelectedTable: (state, action) => {
            state.selectedTables = state.selectedTables.filter(
                table => table !== action.payload
            );
        },
        setCurrentTab: (state, action) => {
            state.currentTab = action.payload;
        },
        resetConnectionState: (state) => {
            return initialState;
        }
    },
});

export const {
    setSourceConnection,
    setTargetConnection,
    setPipeline,
    setAvailableSchemas,
    setAvailableTables,
    addSelectedTable,
    removeSelectedTable,
    setCurrentTab,
    resetConnectionState
} = connectionSlice.actions;

export const selectSourceConnection = (state) => state.connection.source;
export const selectTargetConnection = (state) => state.connection.target;
export const selectPipeline = (state) => state.connection.pipeline;
export const selectAvailableSchemas = (state) => state.connection.availableSchemas;
export const selectAvailableTables = (state) => state.connection.availableTables;
export const selectSelectedTables = (state) => state.connection.selectedTables;
export const selectCurrentTab = (state) => state.connection.currentTab;

export default connectionSlice.reducer;
