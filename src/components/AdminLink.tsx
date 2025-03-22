
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
  
  useEffect(() => {
    // For simplicity, just check if it's the target email
    // This avoids the circular reference in RLS policies
    if (user?.email === 'nandoesporte1@gmail.com') {
      setIsAdmin(true);
      return;
    }
    
    if (!user) {
      setIsAdmin(false);
      return;
    }
    
    const checkAdminStatus = async () => {
      try {
        // Try to initialize the table structure first
        await supabase.rpc('create_user_profiles_if_not_exists');
        
        const { data, error } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          return;
        }
        
        setIsAdmin(data?.is_admin || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  // Don't show the admin link if not logged in or definitely not an admin
  if (!user || !isAdmin) {
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
