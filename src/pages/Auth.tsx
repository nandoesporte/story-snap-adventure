
import React, { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface AuthProps {
  type?: "login" | "register";
}

const Auth: React.FC<AuthProps> = ({ type = "login" }) => {
  const isRegister = type === "register";
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isRegister) {
        await signUp(email, password);
        toast.success("Conta criada com sucesso! Você já pode fazer login.");
        navigate("/login");
      } else {
        await signIn(email, password);
        toast.success("Login realizado com sucesso!");
        navigate("/");
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      
      // Handle specific error messages
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Email ou senha incorretos");
      } else if (error.message.includes("User already registered")) {
        toast.error("Este email já está registrado");
      } else {
        toast.error(`Erro: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <form className="space-y-6" onSubmit={handleSubmit}>
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-3 px-4 text-slate-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Sua senha"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
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
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 font-bold text-white rounded-lg focus:outline-none focus:shadow-outline bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        {isRegister ? "Criando conta..." : "Entrando..."}
                      </>
                    ) : (
                      isRegister ? "Criar Conta" : "Entrar"
                    )}
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
