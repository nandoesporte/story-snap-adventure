
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
    // Reset state when the page changes
    setIsPlaying(false);
    setAudioUrl(null);
    checkExistingAudio();
  }, [storyId, pageIndex]);

  const checkExistingAudio = async () => {
    // Don't try to check for audio if we don't have a valid storyId
    if (!storyId || storyId === '') return;
    
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

  // Function to save audio to local storage as fallback
  const saveAudioToLocalStorage = async (audioBlob: Blob, key: string) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      return new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          localStorage.setItem(key, base64Audio);
          resolve(base64Audio);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
    } catch (error) {
      console.error('Erro ao salvar áudio no localStorage:', error);
      throw error;
    }
  };

  // Function to get audio from local storage
  const getAudioFromLocalStorage = (key: string) => {
    return localStorage.getItem(key);
  };

  const generateAudio = async (voiceId: string) => {
    if (!text || isGenerating || !storyId) return;
    
    // Get the API key from localStorage
    const apiKey = localStorage.getItem('elevenlabs_api_key');
    if (!apiKey) {
      toast.error('Chave da API ElevenLabs não configurada. Configure em Configurações.');
      return;
    }

    setIsGenerating(true);
    toast.info('Gerando narração...');

    try {
      // Generate a unique storage key for this audio
      const localStorageKey = `audio_${storyId}_page_${pageIndex}`;
      
      // Try to get cached audio first
      const cachedAudio = getAudioFromLocalStorage(localStorageKey);
      if (cachedAudio) {
        setAudioUrl(cachedAudio);
        toast.success('Narração carregada do cache!');
        setIsGenerating(false);
        return;
      }

      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
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
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta da API ElevenLabs:', errorData);
        throw new Error(`Erro ao gerar áudio: ${response.status} ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      
      // First try to save to Supabase
      try {
        const bucketName = 'story_narrations';
        let bucketExists = false;
        
        // Check if bucket exists
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          console.error('Erro ao listar buckets:', bucketsError);
          // Continue with local storage fallback
        } else {
          bucketExists = buckets?.some(bucket => bucket.name === bucketName) || false;
          
          if (!bucketExists) {
            // Try to create bucket
            const { error: createError } = await supabase.storage.createBucket(bucketName, {
              public: true,
              fileSizeLimit: 50000000, // 50MB limit
            });
            
            if (!createError) {
              bucketExists = true;
            } else {
              console.error('Erro ao criar bucket:', createError);
            }
          }
        }
        
        // If bucket exists or was created successfully, try to upload
        if (bucketExists) {
          const fileName = `${storyId}_page_${pageIndex}_${Date.now()}.mp3`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, audioBlob);
          
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from(bucketName)
              .getPublicUrl(fileName);
            
            // Try to save to the database too
            try {
              await supabase
                .from('story_narrations')
                .upsert({
                  story_id: storyId,
                  page_index: pageIndex,
                  audio_url: publicUrl,
                  voice_id: voiceId
                });
                
              setAudioUrl(publicUrl);
              
              // Still save to localStorage as backup
              await saveAudioToLocalStorage(audioBlob, localStorageKey);
              
              toast.success('Narração gerada com sucesso!');
              return;
            } catch (dbError) {
              console.error('Erro ao salvar no banco de dados:', dbError);
              // Continue with local storage only approach
            }
          } else {
            console.error('Erro ao fazer upload do arquivo:', uploadError);
            // Fall back to local storage only
          }
        }
        
        // If we get here, we couldn't save to Supabase, so use localStorage only
        const base64Audio = await saveAudioToLocalStorage(audioBlob, localStorageKey);
        setAudioUrl(base64Audio);
        toast.success('Narração gerada e salva localmente!');
        
      } catch (storageError) {
        console.error('Erro ao salvar no storage:', storageError);
        
        // Last resort: just use the blob directly
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        toast.success('Narração gerada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao gerar narração:', error);
      toast.error('Erro ao gerar narração. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = async (voiceId: string) => {
    if (!audioUrl && !isGenerating && text) {
      await generateAudio(voiceId);
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else if (audioUrl) {
        try {
          audioRef.current.src = audioUrl;
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
