
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export const AuthButtonServer: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
      }
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };
  
  if (isAuthenticated) {
    return (
      <div className="flex space-x-2">
        <Link to="/profile">
          <Button variant="outline" size="sm">Profile</Button>
        </Link>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex space-x-2">
      <Link to="/auth?mode=signin">
        <Button variant="outline" size="sm">Sign In</Button>
      </Link>
      <Link to="/auth?mode=signup">
        <Button variant="default" size="sm">Sign Up</Button>
      </Link>
    </div>
  );
};
