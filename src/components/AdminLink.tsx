
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export const AdminLink = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isOnAdminPage = location.pathname.startsWith('/admin');
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
        console.log("AdminLink: Checking admin status for", user.email);
        
        // First check: direct email match
        if (user.email === 'nandoesporte1@gmail.com') {
          console.log("Admin link visible: Direct email match for", user.email);
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
          
          console.log("AdminLink: Database check result:", { data, error });
            
          if (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          } else if (data?.is_admin) {
            console.log("Admin link visible: Database check");
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

  // Don't show the admin link if not logged in, loading, or definitely not an admin
  if (!user || loading || !isAdmin) {
    return null;
  }

  return (
    <Link to="/admin">
      <Button 
        variant={isOnAdminPage ? "default" : "outline"} 
        size="sm" 
        className={`gap-2 ${isOnAdminPage ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
      >
        <Shield className="h-4 w-4" />
        <span className="hidden md:inline">Admin</span>
      </Button>
    </Link>
  );
};
