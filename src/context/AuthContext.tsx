
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

  const initializeDBIfAdmin = async (user: User | null) => {
    if (!user) return;
    
    if (user.email === 'nandoesporte1@gmail.com') {
      try {
        await initializeDatabaseStructure();
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    
    const loadUser = async () => {
      try {
        console.info('Loading current session...');
        const session = await getUser();
        
        if (isMounted.current) {
          setUserSession({ user: session.user, session: session.session });
          if (session.user) {
            console.info('User loaded successfully:', session.user.email);
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

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.info('Auth state changed:', event, session ? 'session exists' : 'no session');
      
      if (isMounted.current) {
        if (session) {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (isMounted.current) {
              setUserSession({ user, session });
              console.info('User authenticated:', user?.email);
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

  // Function to ensure user profile exists
  const createUserProfile = async (userId: string, userEmail: string) => {
    try {
      // First method: Direct upsert
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ 
          id: userId,
          display_name: userEmail,
          story_credits: 5,
          is_admin: userEmail === 'nandoesporte1@gmail.com'
        });
        
      if (error) {
        console.error('Error creating profile via upsert:', error);
        
        // Second method: Try RPC function
        const { error: rpcError } = await supabase.rpc('create_user_profile', {
          user_id: userId,
          user_email: userEmail,
          user_name: userEmail.split('@')[0]
        });
        
        if (rpcError) {
          console.error('Error creating profile via RPC:', rpcError);
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error('Profile creation error:', e);
      return false;
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.info('AuthContext: Signing up with:', email);
      
      const siteUrl = window.location.origin;
      console.info('Using site URL for redirect:', siteUrl);
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${siteUrl}/login`,
          data: {
            email: email,
          }
        }
      });
      
      if (error) {
        console.error('Sign up error:', error.message);
        return { error };
      }
      
      console.info('Sign up response:', data);
      
      // If we have a user, ensure profile exists
      if (data.user) {
        console.info('User created, creating profile for:', data.user.id);
        
        // Create profile immediately
        const success = await createUserProfile(data.user.id, email);
        
        // If it fails, retry after delay
        if (!success) {
          setTimeout(async () => {
            await createUserProfile(data.user!.id, email);
          }, 1500);
        }
        
        // Also check profile after 3 seconds as final fallback
        setTimeout(async () => {
          try {
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('id')
              .eq('id', data.user!.id)
              .single();
              
            if (!profileData) {
              console.warn('Profile still not created after delay, final attempt');
              await createUserProfile(data.user!.id, email);
            }
          } catch (e) {
            console.error('Error in final profile check:', e);
          }
        }, 3000);
      }
      
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
