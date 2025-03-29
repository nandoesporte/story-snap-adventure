
import { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStoryNarration } from '@/hooks/useStoryNarration';
import { useToast } from '@/hooks/use-toast';
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
  
  // We need to pass only the properties that the hook expects
  const { isPlaying, isGenerating, playAudio } = useStoryNarration({
    storyId,
    text: pageText,
    pageIndex
  });
  
  const { toast } = useToast();
  
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
          setAudioUrl(data.audio_url);
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
  
  const handlePlayPause = async () => {
    try {
      await playAudio(voiceType);
    } catch (e: any) {
      console.error("Erro ao reproduzir áudio:", e);
      
      const errorMessage = e.message || "Não foi possível reproduzir a narração";
      
      // Handle specific API errors
      if (errorMessage.includes("API key") || errorMessage.includes("401")) {
        toast({
          title: "Erro de API",
          description: "Chave de API inválida. Verifique suas configurações.",
          variant: "destructive"
        });
      } else if (errorMessage.includes("quota") || errorMessage.includes("429")) {
        toast({
          title: "Limite de API excedido",
          description: "O limite de requisições foi atingido. Tente mais tarde.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro de reprodução",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  };
  
  // Since toggleMute doesn't exist in the hook, we'll implement a simpler mute logic
  const handleToggleMute = () => {
    // Find the audio element and mute/unmute it directly
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.muted = !isMuted;
    });
    setIsMuted(!isMuted);
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      <Button
        onClick={handlePlayPause}
        disabled={isGenerating || loading || !!error}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        {isPlaying ? (
          <>
            <Pause className="h-4 w-4" />
            <span>Pausar Narração</span>
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            <span>Ouvir Narração</span>
          </>
        )}
      </Button>
      
      {isPlaying && (
        <Button
          onClick={handleToggleMute}
          variant="ghost"
          size="sm"
          className="ml-2"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      )}
      
      {isGenerating && <span className="ml-2 text-xs text-purple-500">Gerando áudio...</span>}
      {error && <span className="ml-2 text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default NarrationPlayer;
