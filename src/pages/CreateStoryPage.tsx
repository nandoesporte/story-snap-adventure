
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CreateStoryPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar para a nova página de criação de histórias
    navigate("/create-story");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecionando...</p>
    </div>
  );
};

export default CreateStoryPage;
