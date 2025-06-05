import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import {
    setLoading,
    addMessage,
    setIsPasswordField,
    setInput
} from './slices/chatSlice';
import {
    setSourceConnection,
    setTargetConnection,
    setPipeline,
    setAvailableSchemas,
    setAvailableTables,
    resetConnectionState
} from './slices/connectionSlice';

const API_URL = 'http://localhost:5000/api';

// Initialize chat conversation
export const initializeChat = createAsyncThunk(
    'chat/initialize',
    async (_, { dispatch }) => {
        dispatch(setLoading(true));
        try {
            const response = await axios.post(`${API_URL}/chat`, {
                message: '',
                history: []
            });

            const responseData = response.data;

            // Add the welcome message
            dispatch(addMessage({ role: 'assistant', content: responseData.response }));

            // Handle special states that require UI changes
            if (responseData.password_field) {
                dispatch(setIsPasswordField(true));
            } else {
                dispatch(setIsPasswordField(false));
            }

            return responseData;
        } catch (error) {
            console.error('Error initializing chat:', error);
            dispatch(addMessage({
                role: 'assistant',
                content: 'Welcome to the Data Ingestion Assistant! I encountered an error connecting to the server. Please try again later.'
            }));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }
);

// Send a message to the chat API
export const sendMessage = createAsyncThunk(
    'chat/sendMessage',
    async (messageText, { dispatch, getState }) => {
        const state = getState();
        // Use the provided messageText or the input from state
        const inputText = messageText || state.chat.input;
        const messages = state.chat.messages;
        const isPasswordField = state.chat.isPasswordField;

        dispatch(setLoading(true));

        try {
            // Convert messages to history format for API
            const history = messages.map(msg => ({
                user: msg.role === 'user' ? msg.content : '',
                assistant: msg.role === 'assistant' ? msg.content : ''
            }));

            // Send message to API
            const response = await axios.post(`${API_URL}/chat`, {
                message: inputText,
                history: history
            });

            // Handle response
            const responseData = response.data;

            // Check if context has been reset for a new pipeline
            if (responseData.context_reset) {
                // Reset all frontend state for a new pipeline
                dispatch(resetConnectionState());
                dispatch(setIsPasswordField(false));
            } else {
                // Regular response handling
                // Check if it's a password field
                if (responseData.password_field) {
                    dispatch(setIsPasswordField(true));
                } else {
                    dispatch(setIsPasswordField(false));
                }

                // Update connection state based on context
                updateConnectionStateFromResponse(dispatch, responseData);
            }

            return responseData;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }
);

// Helper function to update connection state from API response
const updateConnectionStateFromResponse = (dispatch, responseData) => {
    // Extract source connection information
    if (responseData.source_connection) {
        dispatch(setSourceConnection({
            connectionType: responseData.source_connection.type,
            connected: responseData.source_connection.connected,
            missingFields: responseData.source_connection.missing_fields || [],
            details: responseData.source_connection.provided_fields || {}
        }));
    }

    // Extract target connection information
    if (responseData.target_connection) {
        dispatch(setTargetConnection({
            connectionType: responseData.target_connection.type,
            connected: responseData.target_connection.connected,
            missingFields: responseData.target_connection.missing_fields || [],
            details: responseData.target_connection.provided_fields || {}
        }));
    }

    // Update pipeline type
    if (responseData.pipeline_type) {
        dispatch(setPipeline({
            type: responseData.pipeline_type
        }));
    }

    // Update selected schema
    if (responseData.selected_schema) {
        dispatch(setPipeline({
            schema: responseData.selected_schema
        }));
    }

    // Update selected tables
    if (responseData.selected_tables) {
        dispatch(setPipeline({
            tables: responseData.selected_tables
        }));
    }

    // Update schemas and tables if available
    if (responseData.schemas) {
        dispatch(setAvailableSchemas(responseData.schemas));
    }

    if (responseData.tables) {
        dispatch(setAvailableTables(responseData.tables));
    }

    // Update pipeline ready status
    if (responseData.pipeline_summary) {
        dispatch(setPipeline({
            ready: true
        }));
    }
};

// Reset pipeline state
export const resetPipeline = () => (dispatch) => {
    dispatch(resetConnectionState());
};

// Handle schema selection
export const handleSchemaSelection = (schema) => (dispatch, getState) => {
    dispatch(setInput(schema));
    dispatch(sendMessage(schema));
};

// Handle table selection
export const handleTableSelection = (tables) => (dispatch, getState) => {
    try {
        // Ensure tables is a simple array of strings
        let tablesList;

        if (Array.isArray(tables)) {
            tablesList = tables.join(', ');
        } else if (typeof tables === 'string') {
            tablesList = tables;
        } else if (tables && typeof tables === 'object' && tables.type === 'click') {
            // This is a React synthetic event, get selected tables from state instead
            const state = getState();
            tablesList = state.connection.selectedTables.join(', ');
        } else {
            tablesList = '';
        }

        // Set the input to a string value (not an event object)
        dispatch(setInput(tablesList));

        // Send the message with the string value
        if (tablesList) {
            // We need to pass just the string, not the event
            dispatch(sendMessage(tablesList));
        }
    } catch (error) {
        console.error('Error in handleTableSelection:', error);
    }
};

// Update available schemas
export const updateAvailableSchemas = (schemas) => (dispatch) => {
    dispatch(setAvailableSchemas(schemas));
};

// Update available tables
export const updateAvailableTables = (tables) => (dispatch) => {
    dispatch(setAvailableTables(tables));
};
