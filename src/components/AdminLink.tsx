
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const AdminLink = () => {
  const { user } = useAuth();

  // Only show admin link if user is logged in
  if (!user) return null;

  return (
    <Link to="/admin">
      <Button variant="outline" size="sm" className="gap-2">
        <Settings className="h-4 w-4" />
        Admin
      </Button>
    </Link>
  );
};
