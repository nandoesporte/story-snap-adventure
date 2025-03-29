
import { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStoryNarration } from '@/hooks/useStoryNarration';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NarrationPlayerProps {
  storyId: string;
  pageIndex: number;
  pageText: string;
  className?: string;
  voiceType?: 'male' | 'female';
}

export const NarrationPlayer = ({ 
  storyId, 
  pageIndex, 
  pageText, 
  className = '',
  voiceType = 'female'
}: NarrationPlayerProps) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const { isPlaying, isGenerating, playAudio, toggleMute } = useStoryNarration({
    storyId,
    text: pageText,
    pageIndex,
    voiceType
  });
  
  useEffect(() => {
    const checkExistingAudio = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!storyId) {
          setError("ID da história não disponível");
          setLoading(false);
          return;
        }
        
        const { data, error: fetchError } = await supabase
          .from('story_narrations')
          .select('audio_url')
          .eq('story_id', storyId)
          .eq('page_index', pageIndex)
          .single();
          
        if (fetchError) {
          console.log("Narração não encontrada:", fetchError.message);
          setAudioUrl(null);
        } else if (data?.audio_url) {
          if (data.audio_url.startsWith('http')) {
            setAudioUrl(data.audio_url);
          } else {
            try {
              const { data: publicUrlData } = supabase
                .storage
                .from('story_narrations')
                .getPublicUrl(data.audio_url);
              
              setAudioUrl(publicUrlData.publicUrl);
              
              await supabase
                .from('story_narrations')
                .update({ audio_url: publicUrlData.publicUrl })
                .eq('story_id', storyId)
                .eq('page_index', pageIndex);
            } catch (e) {
              console.error("Erro ao processar URL de áudio:", e);
              setAudioUrl(data.audio_url);
            }
          }
        }
      } catch (e) {
        console.error("Erro ao verificar narração:", e);
        setError("Erro ao carregar narração");
      } finally {
        setLoading(false);
      }
    };
    
    checkExistingAudio();
  }, [storyId, pageIndex]);
  
  const handlePlayAudio = async () => {
    try {
      if (isPlaying) {
        toggleMute();
        return;
      }
      await playAudio(voiceType);
    } catch (e: any) {
      console.error("Erro ao reproduzir áudio:", e);
      
      const errorMessage = e.message || "Não foi possível reproduzir a narração";
      
      if (errorMessage.includes("API key") || errorMessage.includes("401") || errorMessage.includes("inválida") || errorMessage.includes("permissões")) {
        toast.error("Erro de API: Verifique as configurações da API Text-to-Speech nas Configurações");
        
        // Show a more detailed error in the UI
        setError("Erro de API Text-to-Speech");
      } else if (errorMessage.includes("quota") || errorMessage.includes("429")) {
        toast.error("Limite de API excedido: O limite de requisições foi atingido. Tente mais tarde.");
      } else if (errorMessage.includes("SERVICE_DISABLED") || errorMessage.includes("not been used")) {
        toast.error("API Text-to-Speech não está ativada no projeto Google Cloud");
        
        // Show a more detailed error in the UI
        setError("API não ativada");
      } else {
        toast.error(`Erro de reprodução: ${errorMessage}`);
      }
    }
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handlePlayAudio}
              disabled={isGenerating || loading}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              {isPlaying ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isPlaying ? "Silenciar narração" : "Ouvir narração"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {isGenerating && <span className="ml-2 text-xs text-purple-500">Gerando áudio...</span>}
      {error && (
        <div className="flex items-center">
          <span className="ml-2 text-xs text-red-500">{error}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 w-6 p-0 ml-1"
                  onClick={() => window.open('/settings?tab=narration', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 text-red-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configure a API na aba Narração nas Configurações</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
};

export default NarrationPlayer;
