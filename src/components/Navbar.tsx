
import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useIsMobile } from "../hooks/use-mobile";
import { Sparkles } from "lucide-react";
import NavbarUser from "./NavbarUser";

type NavItem = {
  name: string;
  path: string;
};

const Navbar = () => {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const navItems: NavItem[] = [
    { name: 'Início', path: '/' },
    { name: 'Criar História', path: '/create-story' },
    { name: 'Minhas Histórias', path: '/my-stories' },
    { name: 'Personagens', path: '/characters' },
    { name: 'Configurações', path: '/settings' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/90 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="text-violet-600 relative">
                <Sparkles className="w-6 h-6" />
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2 bg-violet-400 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
              <span className="text-2xl font-bold text-violet-700 tracking-tight">HISTÓRIAS MÁGICAS</span>
            </div>
          </Link>

          {!isMobile && (
            <ul className="flex items-center space-x-6">
              {navItems.map((link) => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    className={({ isActive }) =>
                      `relative font-medium text-sm transition-colors hover:text-violet-700 ${
                        isActive
                          ? "text-violet-700"
                          : "text-slate-600"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {link.name}
                        {isActive && (
                          <motion.div
                            layoutId="navbar-indicator"
                            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-violet-700"
                            transition={{ type: "spring", duration: 0.5 }}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}

          <NavbarUser />

          {isMobile && (
            <button
              onClick={toggleMenu}
              className="text-violet-700 focus:outline-none"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isMenuOpen ? (
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <path
                    d="M4 6H20M4 12H20M4 18H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </button>
          )}

          {isMobile && isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-lg py-4 px-4"
            >
              <ul className="space-y-3">
                {navItems.map((link) => (
                  <li key={link.path}>
                    <NavLink
                      to={link.path}
                      className={({ isActive }) =>
                        `block py-2 px-4 rounded-lg ${
                          isActive
                            ? "bg-violet-100 text-violet-700"
                            : "text-slate-600 hover:bg-slate-50"
                        }`
                      }
                    >
                      {link.name}
                    </NavLink>
                  </li>
                ))}
                <li>
                  <Link
                    to="/auth"
                    className="block py-2 px-4 mt-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg text-center font-medium shadow-sm"
                  >
                    Inscreva-se gratuitamente
                  </Link>
                </li>
              </ul>
            </motion.div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
