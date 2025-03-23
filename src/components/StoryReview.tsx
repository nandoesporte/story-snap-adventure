
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Edit, Save, RefreshCw, ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StoryReviewProps {
  story: {
    title: string;
    content: string[];
  };
  onSubmit: (updatedStory: { title: string; content: string[] }) => void;
  onCancel: () => void;
}

const StoryReview: React.FC<StoryReviewProps> = ({ story, onSubmit, onCancel }) => {
  const [editedStory, setEditedStory] = useState({ ...story });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);
  const [editingPageText, setEditingPageText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditTitle = () => {
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (!editedStory.title.trim()) {
      toast.error("O título não pode estar vazio");
      return;
    }
    
    setIsEditingTitle(false);
    toast.success("Título atualizado com sucesso!");
  };

  const handleEditPage = (index: number) => {
    setEditingPageIndex(index);
    setEditingPageText(editedStory.content[index]);
  };

  const handleSavePage = () => {
    if (editingPageIndex === null) return;
    
    if (!editingPageText.trim()) {
      toast.error("O texto da página não pode estar vazio");
      return;
    }

    const updatedContent = [...editedStory.content];
    updatedContent[editingPageIndex] = editingPageText;

    setEditedStory(prev => ({
      ...prev,
      content: updatedContent
    }));

    setEditingPageIndex(null);
    setEditingPageText("");
    
    toast.success(`Página ${editingPageIndex + 1} atualizada com sucesso!`);
  };

  const handleCancelPageEdit = () => {
    setEditingPageIndex(null);
    setEditingPageText("");
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    toast.info("Gerando ilustrações para sua história...", { duration: 2000 });
    
    // Submit after a small delay to allow the toast to be shown
    setTimeout(() => {
      onSubmit(editedStory);
    }, 500);
  };

  return (
    <motion.div 
      className="flex flex-col bg-white rounded-xl shadow-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="border-b border-violet-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text">
            Revisar História
          </h2>

          {isEditingTitle ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingTitle(false)}
                className="gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Cancelar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveTitle}
                className="gap-1"
              >
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditTitle}
              className="gap-1"
            >
              <Edit className="h-4 w-4" />
              Editar Título
            </Button>
          )}
        </div>

        {isEditingTitle ? (
          <Textarea
            value={editedStory.title}
            onChange={e => setEditedStory(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Digite o título da história..."
            className="font-bold text-lg mb-4"
          />
        ) : (
          <h3 className="text-xl font-bold mb-4">{editedStory.title}</h3>
        )}

        <div className="bg-indigo-50 p-4 rounded-lg text-sm text-indigo-700 mb-2 flex items-start gap-2">
          <Sparkles className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Revise sua história antes de continuar!</p>
            <p>Você pode editar o conteúdo antes de prosseguir para a geração das ilustrações.</p>
          </div>
        </div>
        
        <Alert variant="warning" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ao prosseguir, nossas IAs criarão ilustrações para cada página da sua história. Este processo pode levar alguns segundos.
          </AlertDescription>
        </Alert>
      </div>

      <ScrollArea className="flex-1 h-[400px]">
        <div className="p-6">
          {editedStory.content.map((pageText, index) => (
            <div key={index} className="mb-6 last:mb-0">
              {editingPageIndex === index ? (
                <div className="border border-violet-200 rounded-lg p-4 bg-violet-50">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold">Editando página {index + 1}</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelPageEdit}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={handleSavePage}
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={editingPageText}
                    onChange={e => setEditingPageText(e.target.value)}
                    placeholder="Digite o texto da página..."
                    className="min-h-[120px]"
                  />
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg p-4 hover:border-violet-200 transition-colors group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="inline-block bg-violet-100 text-violet-700 rounded-full px-2 py-0.5 text-xs font-medium mb-2">
                        Página {index + 1}
                      </div>
                      <p className="text-slate-700">{pageText}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPage(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-violet-100 p-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1 sm:flex-initial"
            disabled={isSubmitting}
          >
            Voltar
          </Button>
          <Button 
            variant="default"
            onClick={handleSubmit}
            className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 flex-1 sm:flex-initial"
            disabled={isSubmitting}
          >
            <ImageIcon className="h-4 w-4" />
            {isSubmitting ? "Gerando Ilustrações..." : "Gerar Ilustrações"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default StoryReview;
