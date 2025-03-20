
import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useIsMobile } from "../hooks/use-mobile";
import { Sparkles } from "lucide-react";

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

  const navLinks = [
    { title: "Criar História", path: "/create-story" },
    { title: "Personagens", path: "/characters" },
    { title: "Nossas histórias", path: "/our-stories" },
    { title: "Preços", path: "/pricing" },
    { title: "FAQ", path: "/faq" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/90 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between py-4">
          {/* Logo with sparkle icon */}
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
              <span className="text-2xl font-bold text-violet-700 tracking-tight">STORY SPARK</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {!isMobile && (
            <ul className="flex items-center space-x-6">
              {navLinks.map((link) => (
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
                        {link.title}
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

          {/* Login/Signup Buttons */}
          {!isMobile && (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-violet-700 hover:text-violet-800 font-medium text-sm">
                Entrar
              </Link>
              <Link 
                to="/signup"
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-medium px-5 py-2 rounded-full text-sm transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                Inscreva-se gratuitamente
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <div className="flex items-center gap-3">
              <Link 
                to="/login" 
                className="text-violet-700 hover:text-violet-800 font-medium text-sm mr-2"
              >
                Entrar
              </Link>
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
            </div>
          )}

          {/* Mobile Menu */}
          {isMobile && isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-lg py-4 px-4"
            >
              <ul className="space-y-3">
                {navLinks.map((link) => (
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
                      {link.title}
                    </NavLink>
                  </li>
                ))}
                <li>
                  <Link
                    to="/signup"
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
