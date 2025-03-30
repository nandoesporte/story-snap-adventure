
import React from "react";
import { NavLink } from "react-router-dom";
import { Book, Facebook, Instagram, Twitter, Mail } from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-slate-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Book className="mr-2 h-6 w-6 text-indigo-400" />
              <span className="text-xl font-bold text-white">HISTÓRIAS MÁGICAS</span>
            </div>
            <p className="text-slate-400 mb-4">
              Transformando momentos de leitura em memórias mágicas para as famílias.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-slate-400 hover:text-indigo-400 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="#" 
                className="text-slate-400 hover:text-indigo-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="#" 
                className="text-slate-400 hover:text-indigo-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Links rápidos</h3>
            <ul className="space-y-2">
              <li>
                <NavLink 
                  to="/" 
                  className="text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  Início
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/create-story" 
                  className="text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  Criar História
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/planos" 
                  className="text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  Planos
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/login" 
                  className="text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  Entrar
                </NavLink>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Mail size={16} className="text-indigo-400 mr-2" />
                <a 
                  href="mailto:contato@historiasmagicas.com.br" 
                  className="text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  contato@historiasmagicas.com.br
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Sobre nós</h3>
            <p className="text-slate-400">
              A HISTÓRIAS MÁGICAS por Contos Mágicos é uma plataforma dedicada a transformar a experiência de leitura das crianças através de histórias personalizadas e ilustrações encantadoras.
            </p>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-800 text-center">
          <p className="text-slate-500">
            &copy; {year} HISTÓRIAS MÁGICAS por Contos Mágicos. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
