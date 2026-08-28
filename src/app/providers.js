"use client";
import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { FeedbackProvider } from '@/components/ui/Feedback';

export default function StoreProvider({ children }) {
    return (
        <Provider store={store}>
            {/* Above Layout, so Layout's own confirmations use the in-app
                dialog rather than falling back to window.confirm. */}
            <FeedbackProvider>{children}</FeedbackProvider>
        </Provider>
    );
}
