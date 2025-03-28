
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import UserProfile from './UserProfile';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { AdminLink } from './AdminLink';

const NavbarUser = () => {
  const { user, loading } = useAuth();
  
  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center">
        <Button variant="ghost" size="sm" disabled className="gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="sr-only md:not-sr-only md:inline-block">Carregando...</span>
        </Button>
      </div>
    );
  }
  
  // Not authenticated
  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link to="/login" className="text-violet-800 hover:text-violet-600 font-medium text-sm hidden md:block">
          Entrar
        </Link>
        <Link to="/register">
          <Button variant="storyPrimary">Inscreva-se</Button>
        </Link>
      </div>
    );
  }
  
  // Authenticated
  return (
    <div className="flex items-center gap-3">
      <AdminLink />
      <UserProfile />
    </div>
  );
};

export default NavbarUser;
