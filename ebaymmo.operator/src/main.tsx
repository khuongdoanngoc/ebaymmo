import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Create a client for React Query
const queryClient = new QueryClient();

// Initialize the app

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Suspense>
            <QueryClientProvider client={queryClient}>
                <App />
                <Toaster
                    toastOptions={{
                        position: 'top-right',
                        style: {
                            background: '#283046',
                            color: 'white'
                        }
                    }}
                />
            </QueryClientProvider>
        </Suspense>
    </React.StrictMode>
);
