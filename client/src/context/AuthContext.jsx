import { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [backendSynced, setBackendSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Whenever Clerk signs in, sync with our backend
  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user && !backendSynced) {
      setSyncing(true);
      client.post('/auth/clerk-sync', {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName || user.firstName || '',
        clerkId: user.id,
      })
        .then(res => {
          setBackendSynced(true);
        })
        .catch(err => console.error('Backend sync failed', err))
        .finally(() => setSyncing(false));
    }

    if (!isSignedIn) {
      setBackendSynced(false);
    }
  }, [isLoaded, isSignedIn, user, backendSynced]);

  const logout = async () => {
    localStorage.removeItem('ci_token');
    localStorage.removeItem('ci_user');
    setBackendToken(null);
    setBackendUser(null);
    await signOut();
  };

  const isReady = isLoaded && !syncing;
  const isAuthenticated = isSignedIn && !!backendToken;

  return (
    <AuthContext.Provider value={{
      user: backendUser,
      token: backendToken,
      isLoaded: isReady,
      isSignedIn: isAuthenticated,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);