
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'react-router-dom';

export const AdminLink = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isOnAdminPage = location.pathname.startsWith('/admin');
  
  // For simplicity, just check if it's the target email
  // This avoids the circular reference in RLS policies
  const isTargetEmail = user?.email === 'nandoesporte1@gmail.com';

  // Don't show the admin link if not logged in or definitely not an admin
  if (!user || !isTargetEmail) {
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
