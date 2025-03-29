
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
  const [defaultVoiceType, setDefaultVoiceType] = useState<'male' | 'female'>('female');
  
  const { isPlaying, isGenerating, playAudio } = useStoryNarration({
    storyId,
    text: pageText,
    pageIndex
  });
  
  const { toast } = useToast();
  
  // Load default voice type from app configuration
  useEffect(() => {
    const loadDefaultVoiceType = async () => {
      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('value')
          .eq('key', 'default_tts_voice_type')
          .single();
          
        if (!error && data) {
          setDefaultVoiceType(data.value as 'male' | 'female');
        }
      } catch (error) {
        console.error("Erro ao carregar configuração de voz padrão:", error);
      }
    };
    
    loadDefaultVoiceType();
  }, []);
  
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
      // Use the provided voiceType or fall back to default from database
      const voiceToUse = voiceType || defaultVoiceType;
      await playAudio(voiceToUse);
    } catch (e) {
      console.error("Erro ao reproduzir áudio:", e);
      toast({
        title: "Erro de reprodução",
        description: "Não foi possível reproduzir a narração",
        variant: "destructive"
      });
    }
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
      
      {isGenerating && <span className="ml-2 text-xs text-purple-500">Gerando áudio...</span>}
      {error && <span className="ml-2 text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default NarrationPlayer;
