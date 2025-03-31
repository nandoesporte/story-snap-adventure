
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import UserProfile from './UserProfile';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from './ui/navigation-menu';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                HistorAI
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <Link to="/" passHref>
                      <Button 
                        variant={isActive('/') ? 'secondary' : 'ghost'} 
                        className="font-medium text-gray-700 hover:text-violet-700"
                      >
                        Início
                      </Button>
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link to="/library" passHref>
                      <Button 
                        variant={isActive('/library') ? 'secondary' : 'ghost'} 
                        className="font-medium text-gray-700 hover:text-violet-700"
                      >
                        Biblioteca
                      </Button>
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link to="/planos" passHref>
                      <Button 
                        variant={isActive('/planos') ? 'secondary' : 'ghost'} 
                        className="font-medium text-gray-700 hover:text-violet-700"
                      >
                        Planos
                      </Button>
                    </Link>
                  </NavigationMenuItem>
                  {user && (
                    <NavigationMenuItem>
                      <Link to="/create-story" passHref>
                        <Button 
                          variant={isActive('/create-story') ? 'secondary' : 'ghost'} 
                          className="font-medium text-gray-700 hover:text-violet-700"
                        >
                          Criar História
                        </Button>
                      </Link>
                    </NavigationMenuItem>
                  )}
                </NavigationMenuList>
              </NavigationMenu>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <Link to="/create-story" className="hidden md:block">
                <Button variant="storyPrimary">Criar História</Button>
              </Link>
            )}
            
            {/* Mobile menu button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" aria-label="Menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full py-6">
                  <div className="flex items-center justify-between mb-8">
                    <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center">
                      <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                        HistorAI
                      </span>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-label="Close menu"
                    >
                      <X className="h-6 w-6" />
                    </Button>
                  </div>
                  <nav className="flex flex-col space-y-4">
                    <Link 
                      to="/" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-4 py-2 rounded-md ${isActive('/') ? 'bg-violet-100 text-violet-900' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Início
                    </Link>
                    <Link 
                      to="/library" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-4 py-2 rounded-md ${isActive('/library') ? 'bg-violet-100 text-violet-900' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Biblioteca
                    </Link>
                    <Link 
                      to="/planos" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-4 py-2 rounded-md ${isActive('/planos') ? 'bg-violet-100 text-violet-900' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Planos
                    </Link>
                    
                    {user && (
                      <>
                        <Link 
                          to="/create-story" 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`px-4 py-2 rounded-md ${isActive('/create-story') ? 'bg-violet-100 text-violet-900' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          Criar História
                        </Link>
                        <Link 
                          to="/my-stories" 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`px-4 py-2 rounded-md ${isActive('/my-stories') ? 'bg-violet-100 text-violet-900' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          Minhas Histórias
                        </Link>
                      </>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
            
            {/* User profile/login button */}
            <UserProfile />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
