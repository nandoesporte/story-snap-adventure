import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UseStoryNarrationProps {
  storyId: string;
  text: string;
  pageIndex: number;
}

interface GenerateAudioParams {
  storyId: string;
  text: string;
  pageIndex: number;
}

export const useStoryNarration = ({ storyId, text, pageIndex }: UseStoryNarrationProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  const VOICE_IDS = {
    female: "EXAVITQu4vr4xnSDxMaL", // Sarah
    male: "TX3LPaxmHKxFdv7VOQHJ"    // Liam
  };

  useEffect(() => {
    // Reset state when the page changes
    setIsPlaying(false);
    setAudioUrl(null);
    setRetryCount(0);
    checkExistingAudio();
  }, [storyId, pageIndex]);

  const checkExistingAudio = async () => {
    // Don't try to check for audio if we don't have a valid storyId
    if (!storyId || storyId === '') return;
    
    try {
      console.log(`Checking existing audio for story ${storyId}, page ${pageIndex}`);
      
      const { data: audioData, error } = await supabase
        .from('story_narrations')
        .select('audio_url')
        .eq('story_id', storyId)
        .eq('page_index', pageIndex)
        .single();

      if (error) {
        console.log(`No existing audio found: ${error.message}`);
        return;
      }
        
      if (audioData?.audio_url) {
        console.log(`Found existing audio URL: ${audioData.audio_url}`);
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

  const generateAudio = async (voiceId: string, params?: GenerateAudioParams) => {
    // Use provided params or fall back to the hook's props
    const textToUse = params?.text || text;
    const storyIdToUse = params?.storyId || storyId;
    const pageIndexToUse = params?.pageIndex !== undefined ? params.pageIndex : pageIndex;
    
    if (!textToUse || isGenerating || !storyIdToUse) {
      console.warn("Missing required data for audio generation:", {
        hasText: !!textToUse,
        isGenerating,
        hasStoryId: !!storyIdToUse
      });
      return;
    }
    
    // Get the API key from localStorage
    const apiKey = localStorage.getItem('elevenlabs_api_key');
    if (!apiKey) {
      console.error('ElevenLabs API key not configured');
      throw new Error('Chave da API ElevenLabs não configurada');
    }

    setIsGenerating(true);
    
    // Only show toast if not batch processing (when called directly, not via story generation)
    if (!params) {
      toast.info('Gerando narração...');
    }

    try {
      // Log the generation attempt for debugging
      console.log(`Generating audio for story ${storyIdToUse}, page ${pageIndexToUse}`);
      
      // Generate a unique storage key for this audio
      const localStorageKey = `audio_${storyIdToUse}_page_${pageIndexToUse}`;
      
      // Try to get cached audio first
      const cachedAudio = getAudioFromLocalStorage(localStorageKey);
      if (cachedAudio) {
        console.log(`Using cached audio for page ${pageIndexToUse}`);
        setAudioUrl(cachedAudio);
        if (!params) { // Only show toast if not batch processing
          toast.success('Narração carregada do cache!');
        }
        setIsGenerating(false);
        return cachedAudio;
      }

      console.log(`Generating audio for page ${pageIndexToUse} with ElevenLabs API`);
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: textToUse,
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
        
        // Add more specific error messages based on status codes
        if (response.status === 401) {
          throw new Error('API key inválida ou expirada');
        } else if (response.status === 429) {
          throw new Error('Limite de requisições excedido');
        } else {
          throw new Error(`Erro ao gerar áudio: ${response.status} ${response.statusText}`);
        }
      }

      const audioBlob = await response.blob();
      console.log(`Received audio blob for page ${pageIndexToUse}, size: ${audioBlob.size} bytes`);
      
      if (audioBlob.size < 100) {
        console.error(`Audio blob is suspiciously small (${audioBlob.size} bytes), might be corrupt`);
        throw new Error('Áudio gerado parece estar corrompido');
      }
      
      // First try to save to localStorage as fallback
      let audioUrlValue = null;
      
      try {
        const base64Audio = await saveAudioToLocalStorage(audioBlob, localStorageKey);
        audioUrlValue = base64Audio;
        console.log(`Successfully saved audio to localStorage for page ${pageIndexToUse}`);
      } catch (storageError) {
        console.error('Erro ao salvar no localStorage:', storageError);
        // Continue with URL.createObjectURL as final fallback
        audioUrlValue = URL.createObjectURL(audioBlob);
      }
      
      // Try to save to Supabase (but don't block on this)
      try {
        console.log("Attempting to save audio to Supabase storage");
        
        // Create a better unique filename with timestamp
        const fileName = `${storyIdToUse}_page_${pageIndexToUse}_${Date.now()}.mp3`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('story_narrations')
          .upload(fileName, audioBlob, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (uploadError) {
          console.error('Erro ao fazer upload do arquivo:', uploadError);
          
          // If it's a permission error, we'll continue with the localStorage version
          if (uploadError.message.includes('permission') || uploadError.message.includes('access denied')) {
            console.log('Permission error when uploading to storage, using localStorage fallback');
          } else {
            throw uploadError;
          }
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('story_narrations')
            .getPublicUrl(fileName);
          
          console.log(`Successfully uploaded audio to Supabase: ${publicUrl}`);
          
          // Try to save to the database too
          try {
            const { error: dbError } = await supabase
              .from('story_narrations')
              .upsert({
                story_id: storyIdToUse,
                page_index: pageIndexToUse,
                audio_url: publicUrl,
                voice_id: voiceId
              });
              
            if (dbError) {
              console.error('Erro ao salvar no banco de dados:', dbError);
              // We already have a fallback in audioUrlValue
            } else {
              console.log(`Successfully saved audio metadata to database for page ${pageIndexToUse}`);
              audioUrlValue = publicUrl;
            }
          } catch (dbError) {
            console.error('Erro ao salvar no banco de dados:', dbError);
            // We already have a fallback in audioUrlValue
          }
        }
      } catch (storageError) {
        console.error('Erro ao salvar no storage:', storageError);
        // We already have a fallback in audioUrlValue
      }
      
      setAudioUrl(audioUrlValue);
      
      if (!params) { // Only show toast if not batch processing
        toast.success('Narração gerada com sucesso!');
      }
      
      return audioUrlValue;
      
    } catch (error) {
      console.error('Erro ao gerar narração:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (!params) { // Only show toast if not batch processing
        toast.error(`Erro ao gerar narração: ${errorMessage}`);
      }
      
      // Add retry logic
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        console.log(`Retrying audio generation, attempt ${retryCount + 1} of ${maxRetries}`);
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try again with exponential backoff
        return generateAudio(voiceId, params);
      }
      
      throw error;
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
    generateAudio,
    VOICE_IDS
  };
};
