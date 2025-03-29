import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'react-router-dom';
import { useAdminCheck } from '@/hooks/useAdminCheck';

export const AdminLink = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { isAdmin, isLoading } = useAdminCheck();
  const isOnAdminPage = location.pathname.startsWith('/admin');
  
  if (!user || isLoading || !isAdmin) {
    return null;
  }

  const adminPath = location.pathname === '/story-creator' ? '/admin?tab=test' : '/admin';

  return (
    <Link to={adminPath}>
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
