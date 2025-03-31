
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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
        
        // First check: direct email match for the admin email
        if (user.email === 'nandoesporte1@gmail.com') {
          console.log("Admin check: Direct email match for", user.email);
          localStorage.setItem('user_role', 'admin');
          setIsAdmin(true);
          setLoading(false);
          return;
        }
        
        // Second check: from the token claims (if available)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (!sessionError && session?.user?.app_metadata?.admin === true) {
          console.log("Admin check: Metadata claims indicate admin status");
          localStorage.setItem('user_role', 'admin');
          setIsAdmin(true);
          setLoading(false);
          return;
        }
        
        // Third check: database user_profiles table
        try {
          // Check the user's profile record
          const { data, error } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();
          
          console.log("useAdminCheck: Database check result:", { data, error });
            
          if (error) {
            console.error('Error checking admin status:', error);
            
            // Fall back to manual creation if query fails
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert({ 
                id: user.id, 
                display_name: user.email,
                story_credits: 5,
                is_admin: user.email === 'nandoesporte1@gmail.com'
              });
              
            if (insertError) {
              console.error("Error creating profile:", insertError);
              
              // One more try with raw SQL via functions API
              if (user.email === 'nandoesporte1@gmail.com') {
                try {
                  await supabase.rpc('exec_sql', {
                    sql_query: `
                      UPDATE public.user_profiles 
                      SET is_admin = true 
                      WHERE id = '${user.id}'
                    `
                  });
                  setIsAdmin(true);
                  localStorage.setItem('user_role', 'admin');
                } catch (sqlError) {
                  console.error("Final admin setting attempt failed:", sqlError);
                }
              }
            }
          } else if (data?.is_admin) {
            console.log("Admin check: Database confirms admin status");
            localStorage.setItem('user_role', 'admin');
            setIsAdmin(true);
          } else if (user.email === 'nandoesporte1@gmail.com') {
            // Special case: if the email is the admin email but the flag isn't set
            console.log("Admin check: Special case - updating admin status for known admin email");
            const { error: updateError } = await supabase
              .from('user_profiles')
              .update({ is_admin: true })
              .eq('id', user.id);
              
            if (!updateError) {
              localStorage.setItem('user_role', 'admin');
              setIsAdmin(true);
            }
          } else {
            console.log("Admin check: User is not an admin");
            localStorage.setItem('user_role', 'user');
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error in database admin check:', error);
          
          // Final fallback for known admin email
          if (user.email === 'nandoesporte1@gmail.com') {
            console.log("Admin check: Fallback to email-based admin status");
            localStorage.setItem('user_role', 'admin');
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  return { isAdmin, loading };
};
