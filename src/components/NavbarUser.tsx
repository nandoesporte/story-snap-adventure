
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import UserProfile from './UserProfile';
import { Button } from '@/components/ui/button';

const NavbarUser = () => {
  try {
    const { user } = useAuth();
    
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
    // Fallback UI when context is not available
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
