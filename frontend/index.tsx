import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { router } from '@/src/app/Router';
import { ErrorBoundary } from '@/src/app/providers';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN as string,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,
  tracesSampleRate: 0.2,
  sendDefaultPii: false,
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Could not find root element to mount to');

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <ErrorBoundary>
            <RouterProvider router={router} />
        </ErrorBoundary>
    </React.StrictMode>
);
