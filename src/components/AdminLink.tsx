
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
  const { isAdmin, loading } = useAdminCheck();
  const isOnAdminPage = location.pathname.startsWith('/admin');
  
  // Don't show the admin link if not logged in, loading, or definitely not an admin
  if (!user || loading || !isAdmin) {
    return null;
  }

  // Definir para qual aba do admin redirecionar, se estiver no modo de teste
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
