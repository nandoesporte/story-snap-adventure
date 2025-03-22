
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import UserProfile from './UserProfile';

const NavbarUser = () => {
  const { user } = useAuth();
  
  return (
    <div className="flex items-center gap-4">
      {!user && (
        <Link to="/auth" className="text-violet-800 hover:text-violet-600 font-medium text-sm hidden md:block">
          Criar Conta
        </Link>
      )}
      <UserProfile />
    </div>
  );
};

export default NavbarUser;
