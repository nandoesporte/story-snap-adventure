
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-violet-50 to-white px-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Página não encontrada</h1>
      <p className="text-gray-600 mb-8">A página que você está procurando não existe ou foi movida.</p>
      
      <Button 
        onClick={() => navigate("/")}
        className="bg-violet-600 hover:bg-violet-700"
      >
        Voltar para a página inicial
      </Button>
    </div>
  );
};

export default NotFound;
