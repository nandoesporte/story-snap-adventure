
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

const Navbar = () => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/50"
    >
      <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <NavLink 
          to="/"
          className="flex items-center gap-2"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="font-semibold text-xl bg-gradient-to-r from-storysnap-blue to-storysnap-purple bg-clip-text text-transparent"
          >
            StorySnap
          </motion.div>
        </NavLink>
        
        <nav className="hidden md:flex items-center gap-6">
          <NavLink 
            to="/" 
            className={({isActive}) => 
              `text-sm font-medium transition-colors hover:text-storysnap-blue ${isActive ? 'text-storysnap-blue' : 'text-foreground/80'}`
            }
          >
            Início
          </NavLink>
          <NavLink 
            to="/create-story" 
            className={({isActive}) => 
              `text-sm font-medium transition-colors hover:text-storysnap-blue ${isActive ? 'text-storysnap-blue' : 'text-foreground/80'}`
            }
          >
            Criar História
          </NavLink>
        </nav>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <NavLink 
            to="/create-story" 
            className="bg-storysnap-blue hover:bg-storysnap-blue/90 text-white rounded-full px-4 py-2 text-sm font-medium transition-all shadow-md hover:shadow-lg"
          >
            Começar Agora
          </NavLink>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Navbar;
