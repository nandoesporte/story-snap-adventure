
import { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStoryNarration } from '@/hooks/useStoryNarration';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

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
      
      if (errorMessage.includes("API key") || errorMessage.includes("401")) {
        toast.error("Erro de API: Chave de API inválida. Verifique suas configurações.");
      } else if (errorMessage.includes("quota") || errorMessage.includes("429")) {
        toast.error("Limite de API excedido: O limite de requisições foi atingido. Tente mais tarde.");
      } else {
        toast.error(`Erro de reprodução: ${errorMessage}`);
      }
    }
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      <Button
        onClick={handlePlayAudio}
        disabled={isGenerating || loading || !!error}
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
      
      {isGenerating && <span className="ml-2 text-xs text-purple-500">Gerando áudio...</span>}
      {error && <span className="ml-2 text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default NarrationPlayer;
