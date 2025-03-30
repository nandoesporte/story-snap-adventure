
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, UserSession, getUser, initializeDatabaseStructure } from '../lib/supabase';
import { toast } from 'sonner';

type AuthContextType = {
  user: User | null;
  session: UserSession['session'];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
};

// Create a default context value to prevent "undefined" errors
const defaultContextValue: AuthContextType = {
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userSession, setUserSession] = useState<UserSession>({ user: null, session: null });
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  // Initialize database if user is admin
  const initializeDBIfAdmin = async (user: User | null) => {
    if (!user) return;
    
    // Only init if admin user (for now, just using our hardcoded admin email)
    if (user.email === 'nandoesporte1@gmail.com') {
      try {
        await initializeDatabaseStructure();
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    }
  };

  useEffect(() => {
    // Set mounted ref for cleanup
    isMounted.current = true;
    
    // Check for active session on component mount
    const loadUser = async () => {
      try {
        console.info('Loading current session...');
        const session = await getUser();
        
        // Only update state if component is still mounted
        if (isMounted.current) {
          setUserSession({ user: session.user, session: session.session });
          if (session.user) {
            console.info('User loaded successfully:', session.user.email);
            // Initialize database if admin
            initializeDBIfAdmin(session.user);
          } else {
            console.info('No authenticated user found');
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
        if (isMounted.current) {
          toast.error('Erro ao carregar usuário');
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    loadUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.info('Auth state changed:', event, session ? 'session exists' : 'no session');
      
      if (isMounted.current) {
        if (session) {
          // Get user data
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (isMounted.current) {
              setUserSession({ user, session });
              console.info('User authenticated:', user?.email);
              
              // Initialize database if admin
              initializeDBIfAdmin(user);
            }
          }).catch(error => {
            console.error('Error getting user after auth state change:', error);
          }).finally(() => {
            if (isMounted.current) {
              setLoading(false);
            }
          });
        } else {
          if (isMounted.current) {
            setUserSession({ user: null, session: null });
            setLoading(false);
          }
        }
      }
    });

    return () => {
      // Clean up and prevent state updates after unmount
      console.info('Cleaning up auth listener subscription');
      isMounted.current = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.info('AuthContext: Signing in with:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Sign in error:', error.message);
        return { error };
      }
      
      console.info('Sign in successful for:', email);
      
      // Initialize database if admin
      if (data.user && data.user.email === 'nandoesporte1@gmail.com') {
        await initializeDBIfAdmin(data.user);
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error };
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Add more detailed logging
      console.info('AuthContext: Signing up with:', email);
      
      // Explicitly pass emailRedirectTo to ensure confirmation emails work properly
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin + '/login',
        }
      });
      
      if (error) {
        console.error('Sign up error:', error.message);
        return { error };
      }
      
      // Log whether confirmation email is required
      console.info('Sign up successful for:', email, 'Confirmation email required:', data?.user?.identities?.[0]?.identity_data?.email_confirmed_at ? 'No' : 'Yes');
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { error };
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error.message);
        throw error;
      }
      
      console.info('Sign out successful');
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

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
