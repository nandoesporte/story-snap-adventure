
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import UserProfile from './UserProfile';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingSpinner from './LoadingSpinner';

const NavbarUser = () => {
  try {
    const { user, loading } = useAuth();
    
    if (loading) {
      return (
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <LoadingSpinner size="sm" />
        </div>
      );
    }
    
    if (!user) {
      return (
        <div className="flex items-center gap-4">
          <Link to="/auth" className="text-violet-800 hover:text-violet-600 font-medium text-sm hidden md:block">
            Entrar
          </Link>
          <Link to="/auth">
            <Button variant="storyPrimary">Inscreva-se gratuitamente</Button>
          </Link>
        </div>
      );
    }
    
    return <UserProfile />;
  } catch (error) {
    console.error('Error in NavbarUser:', error);
    // Interface de fallback quando o contexto não está disponível
    return (
      <div className="flex items-center gap-4">
        <Link to="/auth">
          <Button variant="storyPrimary">Entrar</Button>
        </Link>
      </div>
    );
  }
};

export default NavbarUser;
