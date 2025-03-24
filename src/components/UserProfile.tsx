
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRound, LogOut, Settings, BookOpen, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const UserProfile = () => {
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      setLoading(true);
      
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      try {
        console.log("UserProfile: Checking admin status for", user.email);
        
        // For simplicity, first check via direct email match
        if (user.email === 'nandoesporte1@gmail.com') {
          console.log("Admin dropdown visible: Direct email match for", user.email);
          localStorage.setItem('user_role', 'admin');
          setIsAdmin(true);
          setLoading(false);
          return;
        }
        
        // Second check: database
        try {
          // Try to initialize the table structure first
          await supabase.rpc('create_user_profiles_if_not_exists');
          
          const { data, error } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();
          
          console.log("UserProfile: Database check result:", { data, error });
            
          if (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          } else if (data?.is_admin) {
            console.log("Admin dropdown visible: Database check");
            localStorage.setItem('user_role', 'admin');
            setIsAdmin(true);
          } else {
            localStorage.setItem('user_role', 'user');
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      // Clear admin status on logout
      localStorage.removeItem('user_role');
      await signOut();
      toast.success('Você saiu da sua conta com sucesso');
    } catch (error: any) {
      toast.error('Erro ao sair: ' + error.message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return (
      <Link to="/auth">
        <Button variant="storyPrimary">Entrar</Button>
      </Link>
    );
  }

  const userEmail = user.email || '';
  const userInitials = userEmail.substring(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-violet-200">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={userEmail} />
            <AvatarFallback className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.user_metadata?.name || userEmail}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center cursor-pointer">
            <UserRound className="mr-2 h-4 w-4" />
            <span>Meu Perfil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/my-stories" className="flex items-center cursor-pointer">
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Minhas Histórias</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </Link>
        </DropdownMenuItem>
        
        {/* Admin link for admin users */}
        {!loading && isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="flex items-center cursor-pointer text-violet-600 font-medium">
              <Shield className="mr-2 h-4 w-4" />
              <span>Painel Admin</span>
            </Link>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-red-500 focus:text-red-500 cursor-pointer"
          disabled={isLoggingOut}
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfile;
