
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export const useAdminCheck = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        // First try to check from user_profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profileData && !profileError) {
          setIsAdmin(!!profileData.is_admin);
          setIsLoading(false);
          return;
        }

        // If no user_profiles or error, try to use RPC function
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('is_admin_user', { user_id: user.id });

        if (!rpcError) {
          setIsAdmin(!!rpcData);
        } else {
          console.error("Error checking admin status:", rpcError);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  return { isAdmin, isLoading };
};
