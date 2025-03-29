
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
          // Try to initialize the table structure first
          await supabase.rpc('create_user_profiles_if_not_exists');
          
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
