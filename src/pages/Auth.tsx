import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

interface AuthProps {
  type?: "login" | "register";
}

const Auth: React.FC<AuthProps> = ({ type = "login" }) => {
  const isRegister = type === "register";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto max-w-md px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden border border-violet-100"
          >
            <div className="py-12 px-8">
              <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-violet-700 to-indigo-600 text-transparent bg-clip-text">
                {isRegister ? "Criar Conta" : "Entrar"}
              </h2>
              <form className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-slate-700 text-sm font-bold mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="shadow appearance-none border rounded w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Seu email"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-slate-700 text-sm font-bold mb-2"
                  >
                    Senha
                  </label>
                  <input
                    type="password"
                    id="password"
                    className="shadow appearance-none border rounded w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Sua senha"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      className="mr-2 leading-tight"
                    />
                    <label htmlFor="remember" className="text-sm text-slate-700">
                      Lembrar-me
                    </label>
                  </div>
                  <a
                    className="inline-block align-baseline font-bold text-sm text-violet-500 hover:text-violet-800"
                    href="#"
                  >
                    Esqueceu a senha?
                  </a>
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full py-3 px-4 font-bold text-white rounded-lg focus:outline-none focus:shadow-outline bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                  >
                    {isRegister ? "Criar Conta" : "Entrar"}
                  </button>
                </div>
              </form>
              <p className="text-center mt-6 text-slate-700">
                {isRegister ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
                <a
                  href={isRegister ? "/login" : "/register"}
                  className="font-bold text-violet-500 hover:text-violet-800"
                >
                  {isRegister ? "Entrar" : "Criar uma conta"}
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
