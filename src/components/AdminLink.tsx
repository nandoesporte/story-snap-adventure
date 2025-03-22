
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';

export const AdminLink = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isOnAdminPage = location.pathname.startsWith('/admin');
  
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['isUserAdmin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      // Check if user is admin in user_profiles
      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (error || !data) {
        console.error('Error checking admin status:', error);
        return false;
      }
      
      return data.is_admin === true;
    },
    enabled: !!user, // Only run query if user exists
  });
  
  // Also show admin link for the specific email we're making admin
  const isTargetEmail = user?.email === 'nandoesporte1@gmail.com';

  // Don't show the admin link if not logged in or definitely not an admin
  if (!user || (!isAdmin && !isTargetEmail && !isLoading)) {
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
