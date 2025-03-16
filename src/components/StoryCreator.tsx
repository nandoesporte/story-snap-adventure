
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FileUpload from "./FileUpload";
import StoryForm, { StoryFormData } from "./StoryForm";
import { generateStory } from "../utils/storyGenerator";
import { toast } from "sonner";

const StoryCreator = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };
  
  const goToNextStep = () => {
    if (step === 1 && !selectedFile) {
      toast.error("Por favor, adicione uma foto para continuar.");
      return;
    }
    
    setStep(prev => prev + 1);
  };
  
  const goToPrevStep = () => {
    setStep(prev => prev - 1);
  };
  
  const handleSubmit = async (formData: StoryFormData) => {
    if (!selectedFile) {
      toast.error("Por favor, adicione uma foto para continuar.");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Simulating API call
      const storyData = await generateStory({
        childName: formData.childName,
        childAge: formData.childAge,
        theme: formData.theme,
        setting: formData.setting,
        imageUrl: imagePreview || ""
      });
      
      // Store story data in sessionStorage
      sessionStorage.setItem("storyData", JSON.stringify({
        ...storyData,
        childImage: imagePreview
      }));
      
      // Navigate to story viewer
      navigate("/view-story");
    } catch (error) {
      console.error("Error generating story:", error);
      toast.error("Ocorreu um erro ao gerar a história. Por favor, tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="glass rounded-2xl p-8 md:p-12 shadow-xl">
        <div className="flex items-center mb-8">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-storysnap-blue text-white font-medium">
            1
            {step > 1 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-storysnap-blue text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
            )}
          </div>
          <div className="h-[2px] flex-1 bg-slate-200 mx-2">
            <div className={`h-full bg-storysnap-blue transition-all ${step > 1 ? "w-full" : "w-0"}`} />
          </div>
          <div className={`relative flex items-center justify-center w-8 h-8 rounded-full font-medium ${step >= 2 ? "bg-storysnap-blue text-white" : "bg-slate-100 text-slate-400"}`}>
            2
          </div>
        </div>
        
        <motion.div
          key={`step-${step}`}
          initial={{ opacity: 0, x: step === 1 ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="min-h-[400px]"
        >
          {step === 1 ? (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-center">
                Adicione uma foto
              </h2>
              <FileUpload
                onFileSelect={handleFileSelect}
                imagePreview={imagePreview}
              />
              <div className="mt-8 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToNextStep}
                  className="px-6 py-2 bg-storysnap-blue text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:bg-storysnap-blue/90 transition-all"
                >
                  Próximo
                </motion.button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-center">
                Personalize a história
              </h2>
              <StoryForm onSubmit={handleSubmit} />
              
              <div className="mt-8 flex justify-between">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToPrevStep}
                  className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:shadow hover:bg-slate-50 transition-all"
                >
                  Voltar
                </motion.button>
                
                {isGenerating && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Gerando história...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default StoryCreator;
