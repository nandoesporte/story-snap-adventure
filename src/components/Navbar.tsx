
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Book, Menu, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import NavbarUser from "./NavbarUser";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLink 
            to="/" 
            className="flex items-center"
            onClick={closeMenu}
          >
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-700 to-indigo-600 text-transparent bg-clip-text">
              HISTÓRIAS MÁGICAS
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                isActive 
                  ? "text-indigo-700 font-medium"
                  : "text-slate-600 hover:text-indigo-700 transition-colors"
              }
            >
              Início
            </NavLink>
            <NavLink 
              to="/create-story" 
              className={({ isActive }) => 
                isActive 
                  ? "text-indigo-700 font-medium"
                  : "text-slate-600 hover:text-indigo-700 transition-colors"
              }
            >
              Criar História
            </NavLink>
            {user && (
              <NavLink 
                to="/library" 
                className={({ isActive }) => 
                  isActive 
                    ? "text-indigo-700 font-medium"
                    : "text-slate-600 hover:text-indigo-700 transition-colors"
                }
              >
                Biblioteca
              </NavLink>
            )}
            <NavLink 
              to="/planos" 
              className={({ isActive }) => 
                isActive 
                  ? "text-indigo-700 font-medium"
                  : "text-slate-600 hover:text-indigo-700 transition-colors"
              }
            >
              Planos
            </NavLink>
            
            {user ? (
              <NavbarUser />
            ) : (
              <>
                <NavLink to="/login">
                  <Button variant="ghost" className="text-slate-600 hover:text-indigo-700">
                    Entrar
                  </Button>
                </NavLink>
                <NavLink to="/register">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Cadastrar
                  </Button>
                </NavLink>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-slate-600 hover:text-indigo-700 transition-colors"
            onClick={toggleMenu}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white border-t"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <NavLink 
              to="/" 
              className={`px-3 py-2 rounded-lg ${
                location.pathname === "/" 
                  ? "bg-indigo-50 text-indigo-700 font-medium" 
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              onClick={closeMenu}
            >
              Início
            </NavLink>
            <NavLink 
              to="/create-story" 
              className={`px-3 py-2 rounded-lg ${
                location.pathname === "/create-story" 
                  ? "bg-indigo-50 text-indigo-700 font-medium" 
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              onClick={closeMenu}
            >
              Criar História
            </NavLink>
            {user && (
              <NavLink 
                to="/library" 
                className={`px-3 py-2 rounded-lg ${
                  location.pathname === "/library" 
                    ? "bg-indigo-50 text-indigo-700 font-medium" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={closeMenu}
              >
                Biblioteca
              </NavLink>
            )}
            <NavLink 
              to="/planos" 
              className={`px-3 py-2 rounded-lg ${
                location.pathname === "/planos" 
                  ? "bg-indigo-50 text-indigo-700 font-medium" 
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              onClick={closeMenu}
            >
              Planos
            </NavLink>
            
            {user ? (
              <div className="border-t pt-4 mt-2">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                    <User size={16} className="text-indigo-700" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      {user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NavLink 
                    to="/profile" 
                    className="text-center px-3 py-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                    onClick={closeMenu}
                  >
                    Perfil
                  </NavLink>
                  <Button 
                    variant="ghost"
                    className="text-center px-3 py-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                    onClick={() => {
                      closeMenu();
                      // Logout logic here
                    }}
                  >
                    Sair
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-t pt-4 mt-2 grid grid-cols-2 gap-2">
                <NavLink 
                  to="/login" 
                  className="text-center px-3 py-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={closeMenu}
                >
                  Entrar
                </NavLink>
                <NavLink 
                  to="/register" 
                  className="text-center px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={closeMenu}
                >
                  Cadastrar
                </NavLink>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default Navbar;
