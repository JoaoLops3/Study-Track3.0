import React, { useEffect, useState } from "react";
import { Session } from "next-auth";

const AuthContext = React.createContext<{
  session: Session | null;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  googleConnected: boolean;
  setGoogleConnected: React.Dispatch<React.SetStateAction<boolean>>;
  checkGoogleConnectionStatus: (session: Session | null) => Promise<void>;
}>({
  session: null,
  setSession: () => {},
  googleConnected: false,
  setGoogleConnected: () => {},
  checkGoogleConnectionStatus: async () => {},
});

const AuthProvider: React.FC = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [googleConnected, setGoogleConnected] = useState<boolean>(false);

  const checkGoogleConnectionStatus = async (session: Session | null) => {
    if (!session?.user) {
      setGoogleConnected(false);
      return;
    }
    // Simulação de verificação
    setGoogleConnected(false);
  };

  useEffect(() => {
    // ... existing code ...
    // Substituir checkGoogleConnection por checkGoogleConnectionStatus
    checkGoogleConnectionStatus(session);
    // ... existing code ...
  }, [hasTimeout]);

  return (
    <AuthContext.Provider
      value={{
        session,
        setSession,
        googleConnected,
        setGoogleConnected,
        checkGoogleConnectionStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
