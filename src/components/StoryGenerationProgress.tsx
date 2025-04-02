
import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ImageIcon, MessageSquare, Sparkles, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface StoryGenerationProgressProps {
  progress: number;
  currentStage: string;
  imageProgress?: {
    current: number;
    total: number;
  };
  narrationProgress?: {
    current: number;
    total: number;
  };
  onCancel?: () => void;
}

const StoryGenerationProgress: React.FC<StoryGenerationProgressProps> = ({
  progress,
  currentStage,
  imageProgress,
  narrationProgress,
  onCancel
}) => {
  // Helper function to determine the stage icon
  const getStageIcon = () => {
    if (currentStage.includes('texto') || currentStage.includes('narrativa')) {
      return <BookOpen className="h-8 w-8 text-violet-600" />;
    }
    
    if (currentStage.includes('ilustração') || currentStage.includes('imagem')) {
      return <ImageIcon className="h-8 w-8 text-indigo-600" />;
    }
    
    if (currentStage.includes('analisa') || currentStage.includes('sugestões')) {
      return <MessageSquare className="h-8 w-8 text-teal-600" />;
    }
    
    if (progress >= 100) {
      return <CheckCircle className="h-8 w-8 text-emerald-600" />;
    }
    
    return <Sparkles className="h-8 w-8 text-violet-600" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-lg border border-violet-100 p-6 md:p-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-violet-700 to-indigo-600 text-transparent bg-clip-text">
          Gerando sua história personalizada
        </h2>
        <p className="text-slate-600">
          Estamos trabalhando na criação de uma história única para você
        </p>
      </div>
      
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-violet-50 flex items-center justify-center mb-4">
          <motion.div
            animate={{ 
              rotate: progress < 100 ? 360 : 0,
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              repeat: progress < 100 ? Infinity : 0,
              duration: 3,
              ease: "easeInOut" 
            }}
          >
            {getStageIcon()}
          </motion.div>
        </div>

        <h3 className="text-xl font-semibold text-violet-900 mb-2">{currentStage}</h3>
        <p className="text-slate-500 mb-4">{progress}% concluído</p>
      </div>
      
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
      
      {imageProgress && (
        <div className="mb-6 p-3 bg-indigo-50 rounded-lg text-sm">
          <div className="flex items-center mb-1">
            <ImageIcon className="h-4 w-4 text-indigo-600 mr-2" />
            <span className="text-indigo-700 font-medium">
              Ilustrações: {imageProgress.current}/{imageProgress.total}
            </span>
          </div>
          <div className="w-full bg-indigo-100 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full" 
              style={{ width: `${(imageProgress.current / imageProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {narrationProgress && (
        <div className="mb-6 p-3 bg-teal-50 rounded-lg text-sm">
          <div className="flex items-center mb-1">
            <Sparkles className="h-4 w-4 text-teal-600 mr-2" />
            <span className="text-teal-700 font-medium">
              Narrações: {narrationProgress.current}/{narrationProgress.total}
            </span>
          </div>
          <div className="w-full bg-teal-100 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-teal-600 h-full rounded-full" 
              style={{ width: `${(narrationProgress.current / narrationProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-center">
        <div className="flex flex-wrap gap-2 justify-center">
          <div className="px-3 py-1.5 bg-violet-50 rounded-full text-sm text-violet-600 flex items-center">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            <span>Criando magia para você!</span>
          </div>
        </div>
      </div>
      
      {onCancel && (
        <div className="mt-6 text-center">
          <button 
            onClick={onCancel}
            className="text-slate-500 text-sm hover:text-slate-700 transition-colors"
          >
            Cancelar geração
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default StoryGenerationProgress;
