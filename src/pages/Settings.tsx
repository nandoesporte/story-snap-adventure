
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import ElevenLabsSettings from "@/components/ElevenLabsSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <motion.div
        className="flex-grow pt-24 pb-10 px-4 bg-gradient-to-b from-violet-50 to-indigo-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-violet-800 mb-6">
            Configurações
          </h1>

          <Tabs defaultValue="account">
            <TabsList className="mb-6">
              <TabsTrigger value="account">Conta</TabsTrigger>
              <TabsTrigger value="api-keys">Chaves de API</TabsTrigger>
            </TabsList>
            
            <TabsContent value="account">
              <div className="space-y-6">
                <div className="p-6 bg-white rounded-lg shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Informações da Conta</h2>
                  <p>Email: {user.email}</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="api-keys">
              <div className="space-y-6">
                <ElevenLabsSettings />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
      <Footer />
    </div>
  );
};

export default Settings;
