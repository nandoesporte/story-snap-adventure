
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, UserSession, getUser } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  session: UserSession['session'];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
};

// Criando o contexto com um valor padrão apropriado
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userSession, setUserSession] = useState<UserSession>({ user: null, session: null });
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Carregar sessão do usuário na montagem do componente
  useEffect(() => {
    let isMounted = true;
    
    const loadCurrentSession = async () => {
      try {
        console.log('Loading current session...');
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session check:', session ? 'Session found' : 'No session');
        
        if (session && isMounted) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            console.log('User from session:', user ? 'User found' : 'No user');
            if (user && isMounted) {
              setUserSession({ user, session });
            }
          } catch (userError) {
            console.error('Error getting user from session:', userError);
          }
        }
      } catch (error) {
        console.error('Error loading initial session:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    loadCurrentSession();

    // Configurar listener de estado de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'With session' : 'No session');
        
        if (session && isMounted) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            console.log('User after auth change:', user ? 'User found' : 'No user');
            if (user && isMounted) {
              setUserSession({ user, session });
            }
          } catch (error) {
            console.error('Error getting user after auth state change:', error);
          }
        } else if (isMounted) {
          console.log('No session in auth change, clearing user');
          setUserSession({ user: null, session: null });
        }
        
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      if (authListener?.subscription) {
        console.log('Cleaning up auth listener subscription');
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('AuthContext: Signing in with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      
      console.log('Sign in success:', data.user ? 'User found' : 'No user');
      return data;
    } catch (error) {
      console.error('Sign in exception:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('AuthContext: Signing up with:', email);
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('Sign up error:', error);
        throw error;
      }
      
      console.log('Sign up success:', data.user ? 'User found' : 'No user');
      return data;
    } catch (error) {
      console.error('Sign up exception:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      console.log('AuthContext: Signing out');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      console.log('Sign out successful');
      setUserSession({ user: null, session: null });
    } catch (error) {
      console.error('Sign out exception:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Mostrar uma tela de carregamento durante a inicialização
  if (!initialized && loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
        <span className="ml-3 text-lg font-medium text-violet-800">Carregando...</span>
      </div>
    );
  }

  const value = {
    user: userSession.user,
    session: userSession.session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
