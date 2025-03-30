
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StoryForm from "../components/StoryForm";
import { toast } from "sonner";

const CreateStoryPage = () => {
  const navigate = useNavigate();

  const handleFormSubmit = (formData) => {
    try {
      // Salva os dados do formulário no sessionStorage
      sessionStorage.setItem("create_story_data", JSON.stringify(formData));
      
      // Navega para a página de geração de história
      navigate("/story-creator");
    } catch (error) {
      console.error("Erro ao enviar o formulário:", error);
      toast.error("Ocorreu um erro ao preparar a geração da história. Por favor, tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-violet-700 to-indigo-600 text-transparent bg-clip-text">
            Crie Sua História Personalizada
          </h1>
          
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <StoryForm onSubmit={handleFormSubmit} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateStoryPage;
