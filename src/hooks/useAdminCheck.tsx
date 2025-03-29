
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export const useAdminCheck = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      setLoading(true);
      
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      try {
        console.log("useAdminCheck: Checking admin status for", user.email);
        
        // First check: direct email match
        if (user.email === 'nandoesporte1@gmail.com') {
          console.log("Admin check: Direct email match for", user.email);
          localStorage.setItem('user_role', 'admin');
          setIsAdmin(true);
          setLoading(false);
          return;
        }
        
        // Second check: database
        try {
          // Check if user_profiles table exists first
          const { data: tableExists, error: tableCheckError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_name', 'user_profiles');
            
          // If table doesn't exist, create it
          if (tableCheckError || !tableExists || tableExists.length === 0) {
            console.log("Creating user_profiles table");
            const createQuery = `
              CREATE TABLE IF NOT EXISTS public.user_profiles (
                id UUID PRIMARY KEY REFERENCES auth.users(id),
                is_admin BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
              
              ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
              
              CREATE POLICY "Users can view their own profile"
                ON public.user_profiles
                FOR SELECT
                USING (auth.uid() = id);
                
              CREATE POLICY "Users can update their own profile"
                ON public.user_profiles
                FOR UPDATE
                USING (auth.uid() = id);
                
              CREATE POLICY "Admin users can view all profiles"
                ON public.user_profiles
                FOR SELECT
                USING (
                  EXISTS (
                    SELECT 1 FROM public.user_profiles
                    WHERE id = auth.uid() AND is_admin = true
                  )
                );
                
              CREATE POLICY "Admin users can update all profiles"
                ON public.user_profiles
                FOR ALL
                USING (
                  EXISTS (
                    SELECT 1 FROM public.user_profiles
                    WHERE id = auth.uid() AND is_admin = true
                  )
                );
            `;
            
            try {
              // Try using RPC function if available
              await supabase.rpc('exec_sql', { sql_query: createQuery });
            } catch (rpcError) {
              console.error("Couldn't use RPC for table creation:", rpcError);
              // Don't error out, just continue to check if the user has a profile
            }
          }
          
          // Check if user has a profile
          const { data: profileExists, error: profileCheckError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', user.id);
            
          // Create profile if it doesn't exist
          if (profileCheckError || !profileExists || profileExists.length === 0) {
            console.log("Creating user profile for", user.id);
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert({ id: user.id, is_admin: false });
              
            if (insertError) {
              console.error("Error creating user profile:", insertError);
            }
          }
          
          // Now check admin status
          const { data, error } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();
          
          console.log("useAdminCheck: Database check result:", { data, error });
            
          if (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          } else if (data?.is_admin) {
            console.log("Admin check: Database check successful");
            localStorage.setItem('user_role', 'admin');
            setIsAdmin(true);
          } else {
            localStorage.setItem('user_role', 'user');
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading };
};
