
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StoryViewer from "../components/story-viewer/StoryViewer";
import { toast } from "sonner";

const StoryViewerPage = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!id) {
      toast.error("ID da história não especificado");
      navigate("/", { replace: true });
    }
    
    // Prevenir scrolling da página quando estiver na visualização de história
    document.body.style.overflow = "hidden";
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [id, navigate]);
  
  return (
    <div className="min-h-screen max-h-screen h-screen w-full bg-gray-50 overflow-hidden">
      <StoryViewer storyId={id} />
    </div>
  );
};

export default StoryViewerPage;
