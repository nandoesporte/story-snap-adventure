
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, UserSession, getUser } from '../lib/supabase';
import { toast } from 'sonner';

type AuthContextType = {
  user: User | null;
  session: UserSession['session'];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, displayName?: string) => Promise<any>;
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

export const AuthProvider = ({ children }) => {
  const [userSession, setUserSession] = useState<UserSession>({ user: null, session: null });
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

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

    // Set up the auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.info('Auth state changed:', event, session ? 'session exists' : 'no session');
      
      if (isMounted.current) {
        if (session) {
          // Use setTimeout to avoid potential recursive auth state changes
          setTimeout(() => {
            if (isMounted.current) {
              supabase.auth.getUser().then(({ data: { user } }) => {
                if (isMounted.current) {
                  setUserSession({ user, session });
                  console.info('User authenticated:', user?.email);
                  
                  // Verify user profile exists
                  if (user) {
                    verifyUserProfile(user.id, user.email || '');
                  }
                }
              }).catch(error => {
                console.error('Error getting user after auth state change:', error);
              }).finally(() => {
                if (isMounted.current) {
                  setLoading(false);
                }
              });
            }
          }, 0);
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

  // Verify and create user profile if needed
  const verifyUserProfile = async (userId: string, userEmail: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .single();
        
      if (error || !profile) {
        console.log('User profile not found, creating...');
        await createUserProfile(userId, userEmail);
      }
    } catch (error) {
      console.error('Error verifying user profile:', error);
    }
  };

  // Create user profile
  const createUserProfile = async (userId: string, userEmail: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert({ 
          id: userId,
          display_name: userEmail,
          story_credits: 5,
          is_admin: userEmail === 'nandoesporte1@gmail.com'
        });
        
      if (error) {
        console.error('Error creating user profile:', error);
        
        // Try upsert approach if insert fails
        const { error: upsertError } = await supabase
          .from('user_profiles')
          .upsert({ 
            id: userId,
            display_name: userEmail,
            story_credits: 5,
            is_admin: userEmail === 'nandoesporte1@gmail.com'
          });
          
        if (upsertError) {
          console.error('Upsert also failed:', upsertError);
        }
      }
    } catch (error) {
      console.error('Unexpected error creating profile:', error);
    }
  };

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

  const signUp = async (email: string, password: string, displayName?: string) => {
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
            name: displayName || email,
          }
        }
      });
      
      if (error) {
        console.error('Sign up error:', error.message);
        return { error };
      }
      
      console.info('Sign up response:', data);
      
      // If we have a user, create profile
      if (data.user) {
        console.info('User created, creating profile for:', data.user.id);
        await createUserProfile(data.user.id, email);
        
        // Verify profile creation
        await verifyUserProfile(data.user.id, email);
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
