import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UseStoryNarrationProps {
  storyId: string;
  text: string;
  pageIndex: number;
}

export const useStoryNarration = ({ storyId, text, pageIndex }: UseStoryNarrationProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const VOICE_IDS = {
    female: "EXAVITQu4vr4xnSDxMaL", // Sarah
    male: "TX3LPaxmHKxFdv7VOQHJ"    // Liam
  };

  useEffect(() => {
    checkExistingAudio();
  }, [storyId, pageIndex]);

  const checkExistingAudio = async () => {
    try {
      const { data: audioData } = await supabase
        .from('story_narrations')
        .select('audio_url')
        .eq('story_id', storyId)
        .eq('page_index', pageIndex)
        .single();

      if (audioData?.audio_url) {
        setAudioUrl(audioData.audio_url);
      }
    } catch (error) {
      console.error('Erro ao verificar áudio existente:', error);
    }
  };

  const generateAudio = async (voiceId: string) => {
    if (!text || isGenerating) return;

    setIsGenerating(true);
    toast.info('Gerando narração...');

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVEN_LABS_API_KEY || '',
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.7,
            use_speaker_boost: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar áudio');
      }

      const audioBlob = await response.blob();
      const fileName = `${storyId}_page_${pageIndex}_${Date.now()}.mp3`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('story_narrations')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('story_narrations')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('story_narrations')
        .upsert({
          story_id: storyId,
          page_index: pageIndex,
          audio_url: publicUrl,
          voice_id: voiceId
        });

      if (dbError) throw dbError;

      setAudioUrl(publicUrl);
      toast.success('Narração gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar narração:', error);
      toast.error('Erro ao gerar narração. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = async (voiceId: string) => {
    if (!audioUrl && !isGenerating) {
      await generateAudio(voiceId);
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          audioRef.current.src = audioUrl || '';
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Erro ao reproduzir áudio:', error);
          toast.error('Erro ao reproduzir narração');
        }
      }
    }
  };

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });

    return () => {
      audio.pause();
      audio.remove();
    };
  }, []);

  return {
    isGenerating,
    isPlaying,
    playAudio,
    VOICE_IDS
  };
};
