
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { CheckCircle, Edit, Clock, AlertCircle, ChevronLeft, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface StoryConfirmationProps {
  storyDetails: {
    childName: string;
    childAge: string;
    theme: string;
    themeName: string;
    setting: string;
    settingName: string;
    length: string;
    lengthName: string;
    style: string;
    styleName: string;
    characterId?: string;
    characterName?: string;
    imagePreview?: string | null;
  };
  onConfirm: () => void;
  onEdit: () => void;
  apiAvailable: boolean;
}

const StoryConfirmation: React.FC<StoryConfirmationProps> = ({
  storyDetails,
  onConfirm,
  onEdit,
  apiAvailable
}) => {
  const renderThemeIcon = (theme: string) => {
    switch (theme) {
      case 'adventure': return '🧭';
      case 'fantasy': return '🧙‍♂️';
      case 'space': return '🚀';
      case 'ocean': return '🌊';
      case 'dinosaurs': return '🦖';
      default: return '📚';
    }
  };

  const renderSettingIcon = (setting: string) => {
    switch (setting) {
      case 'forest': return '🌳';
      case 'castle': return '🏰';
      case 'space': return '🪐';
      case 'underwater': return '🐠';
      case 'dinosaurland': return '🦕';
      default: return '🏞️';
    }
  };

  const handleConfirm = () => {
    if (!apiAvailable) {
      toast.info("Usando gerador local de histórias", {
        description: "Funcionalidade simplificada devido a limitações da API"
      });
    }
    onConfirm();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-3xl mx-auto"
    >
      <Card className="border-violet-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-t-xl">
          <div className="text-center py-2">
            <h2 className="text-2xl font-bold">Revise os detalhes da história</h2>
            <p className="text-white/80">Verifique se está tudo como você deseja antes de prosseguir</p>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {storyDetails.imagePreview && (
              <div className="md:w-1/3">
                <div className="aspect-square rounded-lg overflow-hidden border-4 border-white shadow-md">
                  <img 
                    src={storyDetails.imagePreview} 
                    alt={`Foto de ${storyDetails.childName}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            
            <div className={`${storyDetails.imagePreview ? 'md:w-2/3' : 'w-full'}`}>
              <div className="bg-violet-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="h-12 w-12 bg-violet-100 rounded-full flex items-center justify-center text-2xl">
                    {storyDetails.childName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{storyDetails.childName}</h3>
                    <p className="text-sm text-gray-600">{storyDetails.childAge} anos</p>
                  </div>
                </div>
                
                {storyDetails.characterName && (
                  <div className="mt-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md inline-flex items-center">
                    <span className="mr-1">✨</span>
                    Personagem: {storyDetails.characterName}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border border-violet-100 shadow-sm">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{renderThemeIcon(storyDetails.theme)}</span>
                    <div>
                      <p className="text-sm text-gray-500">Tema</p>
                      <p className="font-medium">{storyDetails.themeName}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-violet-100 shadow-sm">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{renderSettingIcon(storyDetails.setting)}</span>
                    <div>
                      <p className="text-sm text-gray-500">Cenário</p>
                      <p className="font-medium">{storyDetails.settingName}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-violet-100 shadow-sm">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{storyDetails.style === 'cartoon' ? '🎨' : storyDetails.style === 'watercolor' ? '🖌️' : storyDetails.style === 'realistic' ? '🖼️' : '📕'}</span>
                    <div>
                      <p className="text-sm text-gray-500">Estilo Visual</p>
                      <p className="font-medium">{storyDetails.styleName}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-violet-100 shadow-sm">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{storyDetails.length === 'short' ? '📄' : storyDetails.length === 'medium' ? '📑' : '📚'}</span>
                    <div>
                      <p className="text-sm text-gray-500">Tamanho</p>
                      <p className="font-medium">{storyDetails.lengthName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {!apiAvailable && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Usando gerador de histórias local</p>
                <p className="text-sm">Devido a limitações técnicas, a história será gerada usando recursos locais. A experiência será simplificada, mas totalmente funcional.</p>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="font-medium text-gray-700 mb-2">Opções Avançadas:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Páginas: {storyDetails.length === 'short' ? '5' : storyDetails.length === 'medium' ? '10' : '15'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Idioma: Português do Brasil</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Tempo estimado: {apiAvailable ? '1-2 minutos' : '30-60 segundos'}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Áudio: Sem narração</span>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-gray-50 p-4 flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 rounded-b-xl">
          <Button
            variant="outline"
            onClick={onEdit}
            className="w-full sm:w-auto"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Editar detalhes
          </Button>
          
          <Button
            variant="storyPrimary"
            onClick={handleConfirm}
            className="w-full sm:w-auto"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Criar história
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default StoryConfirmation;
