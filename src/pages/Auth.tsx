
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthProps {
  type?: "login" | "register";
}

const Auth: React.FC<AuthProps> = ({ type = "login" }) => {
  const isRegister = type === "register";
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const validateForm = () => {
    setFormError(null);
    
    if (!email) {
      setFormError("Por favor, informe seu e-mail");
      return false;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      setFormError("Por favor, informe um e-mail válido");
      return false;
    }
    
    if (!password) {
      setFormError("Por favor, informe sua senha");
      return false;
    }
    
    if (password.length < 6) {
      setFormError("A senha deve ter pelo menos 6 caracteres");
      return false;
    }
    
    if (isRegister && password !== confirmPassword) {
      setFormError("As senhas não coincidem");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      if (isRegister) {
        console.log("Registering with:", email);
        const { error, data } = await signUp(email, password);
        
        if (error) {
          throw error;
        }

        console.log("Registration response:", data);
        
        // Check if email confirmation is required based on the response
        const emailConfirmationRequired = !data?.user?.identities?.[0]?.identity_data?.email_confirmed_at;
        
        // Show success message after registration
        toast.success("Conta criada com sucesso!");
        setRegistrationSuccess(true);
      } else {
        console.log("Logging in with:", email);
        const { error } = await signIn(email, password);
        
        if (error) {
          throw error;
        }
        
        toast.success("Login realizado com sucesso!");
        navigate("/");
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      
      // Handle specific error messages
      if (error.message?.includes("Invalid login credentials")) {
        setFormError("Email ou senha incorretos");
      } else if (error.message?.includes("User already registered")) {
        setFormError("Este email já está registrado");
      } else if (error.message?.includes("Password should be at least 6 characters")) {
        setFormError("A senha deve ter pelo menos 6 caracteres");
      } else {
        setFormError(`Erro: ${error.message}`);
      }
      
      toast.error(formError || "Erro no processamento da solicitação");
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
              {registrationSuccess && isRegister ? (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-violet-700 to-indigo-600 text-transparent bg-clip-text">
                    Conta Criada com Sucesso!
                  </h2>
                  
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <AlertTitle className="text-green-800">Verifique seu email</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Enviamos um link de confirmação para <strong>{email}</strong>. 
                      Por favor, verifique sua caixa de entrada e confirme seu email para ativar sua conta.
                    </AlertDescription>
                  </Alert>
                  
                  <p className="text-sm text-slate-600 mt-4">
                    Não recebeu o email? Verifique sua pasta de spam ou solicite um novo email de confirmação.
                  </p>
                  
                  <div className="flex items-center justify-between mt-6">
                    <button
                      onClick={() => setRegistrationSuccess(false)}
                      className="text-violet-600 hover:text-violet-800 text-sm font-medium"
                    >
                      Voltar ao formulário
                    </button>
                    
                    <button
                      onClick={() => navigate("/login")}
                      className="bg-violet-600 text-white py-2 px-4 rounded-lg hover:bg-violet-700 font-medium"
                    >
                      Ir para o Login
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-violet-700 to-indigo-600 text-transparent bg-clip-text">
                    {isRegister ? "Criar Conta" : "Entrar"}
                  </h2>
                  
                  {formError && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Seu email"
                        className="w-full"
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sua senha"
                        className="w-full"
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    {isRegister && (
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                        <Input
                          type="password"
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirme sua senha"
                          className="w-full"
                          disabled={isSubmitting}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="remember"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="mr-2 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                          disabled={isSubmitting}
                        />
                        <Label htmlFor="remember" className="text-sm text-slate-700">
                          Lembrar-me
                        </Label>
                      </div>
                      {!isRegister && (
                        <a
                          className="inline-block align-baseline font-bold text-sm text-violet-500 hover:text-violet-800"
                          href="#"
                        >
                          Esqueceu a senha?
                        </a>
                      )}
                    </div>
                    
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
                </>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
