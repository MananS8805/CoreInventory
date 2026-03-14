import { createContext, useContext } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const logout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  const formattedUser = user ? {
    id: user.id,
    name: user.fullName || user.firstName || 'User',
    email: user.primaryEmailAddress?.emailAddress || '',
  } : null;

  if (!isLoaded) {
    return (
      <AuthContext.Provider value={{ user: null, token: false, isLoaded: false, isSignedIn: false, logout }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{
      user: formattedUser,
      token: isSignedIn,
      isLoaded,
      isSignedIn,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);