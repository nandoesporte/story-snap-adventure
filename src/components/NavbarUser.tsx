
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreditCard, LogOut, Settings, User } from 'lucide-react';
import { AdminLink } from './AdminLink';

export const NavbarUser = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <>
          <div className="hidden sm:flex items-center gap-4">
            <Link to="/planos">
              <Button variant="outline" className="gap-2">
                <CreditCard className="h-4 w-4" />
                <span>Assinatura</span>
              </Button>
            </Link>
            <AdminLink />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.user_metadata?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.email ? user.email[0].toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/planos')}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Assinatura</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="md:hidden">
                <AdminLink />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <Link to="/auth">
          <Button>Entrar</Button>
        </Link>
      )}
    </div>
  );
};

export default NavbarUser;
