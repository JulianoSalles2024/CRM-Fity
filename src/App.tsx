import React from 'react';
import { useAppState } from './app/useAppState';
import AppLayout from './app/AppLayout';

const App: React.FC = () => {
    const appState = useAppState();
    return <AppLayout {...appState} />;
};

export default App;
