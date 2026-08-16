import React, { createContext, useContext, useState } from 'react';
import { App } from './App';
import { LoginScreen } from './screens/LoginScreen';
import { nisosBackend } from './integrations/NisosBackendAdapter';

const SessionContext = createContext<{ sessionId: string | null }>({ sessionId: null });

export function useSessionId() {
  const ctx = useContext(SessionContext);
  return ctx.sessionId;
}

export function SessionManager() {
  const [sessionId, setSessionState] = useState<string | null>(() => {
    return localStorage.getItem('nisos_session_id');
  });

  const setSession = (newSessionId: string) => {
    localStorage.setItem('nisos_session_id', newSessionId);
    nisosBackend.setSession(newSessionId);
    setSessionState(newSessionId);
  };

  // If no session, show login
  if (!sessionId) {
    return <LoginScreen onLogin={setSession} />;
  }

  return (
    <SessionContext.Provider value={{ sessionId }}>
      <App />
    </SessionContext.Provider>
  );
}
