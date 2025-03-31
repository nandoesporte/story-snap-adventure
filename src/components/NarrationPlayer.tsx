
import { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, ExternalLink, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStoryNarration } from '@/hooks/useStoryNarration';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NarrationPlayerProps {
  storyId: string;
  pageIndex: number;
  pageText: string;
  className?: string;
  voiceType?: 'male' | 'female';
  autoPlay?: boolean;
}

export const NarrationPlayer = ({ 
  storyId, 
  pageIndex, 
  pageText, 
  className = '',
  voiceType = 'female',
  autoPlay = false
}: NarrationPlayerProps) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<'male' | 'female'>(voiceType);
  const [voicePreset, setVoicePreset] = useState('childFriendly');
  const [hasGeneratedAudio, setHasGeneratedAudio] = useState(false);
  
  const { 
    isPlaying, 
    isGenerating, 
    playAudio,
    generateAudio,
    toggleMute,
    VOICE_PRESETS 
  } = useStoryNarration({
    storyId,
    text: pageText,
    pageIndex,
    voiceType: selectedVoice
  });
  
  useEffect(() => {
    const checkExistingAudio = async () => {
      setLoading(true);
      setError(null);
      setHasGeneratedAudio(false);
      
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
            
            if (autoPlay) {
              // Add a small delay to ensure audio plays consistently
              setTimeout(() => {
                handlePlayAudio();
              }, 500);
            }
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
                
              if (autoPlay) {
                // Add a small delay to ensure audio plays consistently
                setTimeout(() => {
                  handlePlayAudio();
                }, 500);
              }
            } catch (e) {
              console.error("Erro ao processar URL de áudio:", e);
              setAudioUrl(data.audio_url);
            }
          }
        } else if (pageText && autoPlay) {
          // Auto-generate and play narration if it doesn't exist yet
          generateAndPlay();
        }
      } catch (e) {
        console.error("Erro ao verificar narração:", e);
        setError("Erro ao carregar narração");
      } finally {
        setLoading(false);
      }
    };
    
    checkExistingAudio();
  }, [storyId, pageIndex, pageText, autoPlay]);
  
  const generateAndPlay = async () => {
    if (!pageText || isGenerating) return;
    
    try {
      console.log("Gerando narração automaticamente...");
      const generatedAudioUrl = await generateAudio(selectedVoice);
      setHasGeneratedAudio(true);
      
      if (generatedAudioUrl) {
        // Short delay to ensure audio is ready
        setTimeout(() => {
          playAudio(selectedVoice, generatedAudioUrl);
        }, 300);
      }
    } catch (error) {
      console.error("Erro ao gerar e reproduzir narração:", error);
    }
  };
  
  const handlePlayAudio = async () => {
    try {
      if (isPlaying) {
        toggleMute();
        return;
      }
      
      if (audioUrl) {
        playAudio(selectedVoice, audioUrl);
        return;
      }
      
      if (!hasGeneratedAudio && pageText) {
        await generateAndPlay();
      } else {
        await playAudio(selectedVoice);
      }
    } catch (e: any) {
      console.error("Erro ao reproduzir áudio:", e);
      
      const errorMessage = e.message || "Não foi possível reproduzir a narração";
      
      if (errorMessage.includes("API key") || errorMessage.includes("401") || errorMessage.includes("inválida") || errorMessage.includes("permissões")) {
        toast.error("Erro de API: Verifique as configurações da API Text-to-Speech nas Configurações");
        
        setError("Erro de API Text-to-Speech");
      } else if (errorMessage.includes("quota") || errorMessage.includes("429")) {
        toast.error("Limite de API excedido: O limite de requisições foi atingido. Tente mais tarde.");
      } else if (errorMessage.includes("SERVICE_DISABLED") || errorMessage.includes("not been used")) {
        toast.error("API Text-to-Speech não está ativada no projeto Google Cloud");
        
        setError("API não ativada");
      } else if (errorMessage.includes("bucket") || errorMessage.includes("storage")) {
        toast.error("Erro de armazenamento: Os arquivos de áudio serão salvos apenas localmente.");
        
        setError("Problemas com armazenamento");
      } else {
        toast.error(`Erro de reprodução: ${errorMessage}`);
      }
    }
  };
  
  return (
    <div className={`flex items-center z-20 ${className}`}>
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
            {isPlaying ? "Silenciar narração" : "Ouvir narração infantil"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" side="bottom">
          <div className="grid gap-2">
            <h4 className="text-sm font-semibold">Opções de narração</h4>
            <div className="grid gap-1.5">
              <label className="text-xs">Tipo de voz</label>
              <Select 
                value={selectedVoice} 
                onValueChange={(value) => setSelectedVoice(value as 'male' | 'female')}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Selecione o tipo de voz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Vozes</SelectLabel>
                    <SelectItem value="female">Feminina (Infantil)</SelectItem>
                    <SelectItem value="male">Masculina (Infantil)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {isGenerating && <span className="ml-2 text-xs text-purple-500">Gerando áudio humanizado...</span>}
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
