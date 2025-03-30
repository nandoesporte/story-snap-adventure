
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UseStoryNarrationProps {
  storyId: string;
  text: string;
  pageIndex: number;
  voiceType?: 'male' | 'female';
}

interface GenerateAudioParams {
  storyId: string;
  text: string;
  pageIndex: number;
  voiceType?: 'male' | 'female';
}

export const useStoryNarration = ({ storyId, text, pageIndex, voiceType = 'female' }: UseStoryNarrationProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  const VOICE_IDS = {
    female: "pt-BR-Wavenet-A",
    male: "pt-BR-Wavenet-B"
  };

  const AVAILABLE_VOICES = {
    portuguese: {
      female: ["pt-BR-Standard-A", "pt-BR-Wavenet-A"],
      male: ["pt-BR-Standard-B", "pt-BR-Wavenet-B"]
    },
    english: {
      female: ["en-US-Standard-C", "en-US-Wavenet-C", "en-US-Neural2-F"],
      male: ["en-US-Standard-B", "en-US-Wavenet-B", "en-US-Neural2-D"]
    },
    spanish: {
      female: ["es-ES-Standard-A", "es-ES-Wavenet-A", "es-ES-Neural2-A"],
      male: ["es-ES-Standard-B", "es-ES-Wavenet-B", "es-ES-Neural2-B"]
    }
  };

  const VOICE_PRESETS = {
    childFriendly: {
      pitch: 0.5,
      speakingRate: 0.85,
      volumeGainDb: 2.0
    },
    storytelling: {
      pitch: 0.2,
      speakingRate: 0.9,
      volumeGainDb: 1.0
    },
    animated: {
      pitch: 0.8,
      speakingRate: 1.0,
      volumeGainDb: 3.0
    }
  };

  useEffect(() => {
    setIsPlaying(false);
    setAudioUrl(null);
    setRetryCount(0);
    checkExistingAudio();
  }, [storyId, pageIndex]);

  const checkExistingAudio = async () => {
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

  const saveAudioToLocalStorage = async (audioBlob: Blob, key: string) => {
    try {
      const reader = new FileReader();
      return new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          try {
            const base64Audio = reader.result as string;
            localStorage.setItem(key, base64Audio);
            resolve(base64Audio);
          } catch (storageError) {
            console.error('Local storage error:', storageError);
            resolve(URL.createObjectURL(audioBlob));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
    } catch (error) {
      console.error('Erro ao salvar áudio no localStorage:', error);
      throw error;
    }
  };

  const getAudioFromLocalStorage = (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  };

  const ensureStorageBucketExists = async () => {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'story_narrations');
      
      if (!bucketExists) {
        console.log("Creating 'story_narrations' bucket...");
        const { data, error: createError } = await supabase.storage.createBucket('story_narrations', {
          public: true,
          fileSizeLimit: 5242880,
        });
        
        if (createError) {
          console.error("Error creating bucket:", createError);
          return false;
        }
        
        try {
          const { data } = supabase.storage.from('story_narrations').getPublicUrl('test');
          console.log("Successfully tested public URL policy:", data.publicUrl);
        } catch (e) {
          console.warn("Error testing public URL policy:", e);
        }
        
        console.log("Bucket 'story_narrations' created successfully");
      } else {
        console.log("Bucket 'story_narrations' already exists");
      }
      
      return true;
    } catch (error) {
      console.error("Error ensuring bucket exists:", error);
      return false;
    }
  };

  const generateAudio = async (voiceType: 'male' | 'female' = 'female', params?: GenerateAudioParams) => {
    if (!text || isGenerating || !storyId) {
      console.warn("Missing required data for audio generation:", {
        hasText: !!text,
        isGenerating,
        hasStoryId: !!storyId
      });
      return null;
    }
    
    const apiKey = localStorage.getItem('google_tts_api_key');
    if (!apiKey) {
      console.error('Google Text-to-Speech API key not configured');
      throw new Error('Chave da API Google Text-to-Speech não configurada');
    }

    setIsGenerating(true);
    
    if (!params) {
      console.log("Starting audio generation");
    }

    try {
      console.log(`Generating child-friendly audio for story ${storyId}, page ${pageIndex} with voice type: ${voiceType}`);
      
      // Use the story and page information to create a unique key
      const localStorageKey = `audio_${storyId}_page_${pageIndex}`;
      
      // First, check if we have this narration in the database
      const { data: existingNarration, error: narrationError } = await supabase
        .from('story_narrations')
        .select('audio_url')
        .eq('story_id', storyId)
        .eq('page_index', pageIndex)
        .single();
        
      if (!narrationError && existingNarration?.audio_url) {
        console.log(`Using existing narration from database for story ${storyId}, page ${pageIndex}`);
        setAudioUrl(existingNarration.audio_url);
        if (!params) {
          console.log("Found existing narration in database");
        }
        setIsGenerating(false);
        return existingNarration.audio_url;
      }
      
      // If not in database, check local storage as fallback
      let cachedAudio;
      try {
        cachedAudio = getAudioFromLocalStorage(localStorageKey);
      } catch (storageError) {
        console.warn('Error accessing localStorage, ignoring cache:', storageError);
        cachedAudio = null;
      }
      
      if (cachedAudio) {
        console.log(`Using cached audio for page ${pageIndex}`);
        setAudioUrl(cachedAudio);
        if (!params) {
          console.log("Found cached audio");
        }
        setIsGenerating(false);
        return cachedAudio;
      }

      console.log(`Generating audio for page ${pageIndex} with Google TTS API using enhanced child-friendly settings`);

      const voiceLanguage = "portuguese";
      const voiceId = VOICE_IDS[voiceType];
      
      const voicePreset = VOICE_PRESETS.childFriendly;
      
      const ssmlText = formatTextWithSSML(text);

      const requestBody = {
        input: { 
          ssml: ssmlText
        },
        voice: { 
          languageCode: voiceId.substring(0, 5),
          name: voiceId
        },
        audioConfig: { 
          audioEncoding: "MP3",
          pitch: voicePreset.pitch,
          speakingRate: voicePreset.speakingRate,
          volumeGainDb: voicePreset.volumeGainDb,
          effectsProfileId: ["small-bluetooth-speaker-class-device"]
        }
      };

      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta da API Google TTS:', errorData);
        
        if (response.status === 403) {
          throw new Error('API key inválida ou sem permissões');
        } else if (response.status === 429) {
          throw new Error('Limite de requisições excedido');
        } else {
          throw new Error(`Erro ao gerar áudio: ${response.status} ${response.statusText}`);
        }
      }

      const responseData = await response.json();
      const audioContent = responseData.audioContent;

      const byteCharacters = atob(audioContent);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      const audioBlob = new Blob(byteArrays, { type: 'audio/mp3' });
      console.log(`Received audio blob for page ${pageIndex}, size: ${audioBlob.size} bytes`);
      
      if (audioBlob.size < 100) {
        console.error(`Audio blob is suspiciously small (${audioBlob.size} bytes), might be corrupt`);
        throw new Error('Áudio gerado parece estar corrompido');
      }
      
      let audioUrlValue = null;
      
      try {
        const base64Audio = await saveAudioToLocalStorage(audioBlob, localStorageKey);
        audioUrlValue = base64Audio;
        console.log(`Successfully saved audio to localStorage for page ${pageIndex}`);
      } catch (storageError) {
        console.error('Erro ao salvar no localStorage:', storageError);
        audioUrlValue = URL.createObjectURL(audioBlob);
      }
      
      try {
        console.log("Attempting to save audio to Supabase storage");
        
        const bucketReady = await ensureStorageBucketExists();
        if (!bucketReady) {
          console.warn("Could not ensure bucket exists, using local audio only");
          throw new Error("Could not create or verify storage bucket");
        }
        
        const fileName = `${storyId}_page_${pageIndex}_${Date.now()}.mp3`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('story_narrations')
          .upload(fileName, audioBlob, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (uploadError) {
          console.error('Erro ao fazer upload do arquivo:', uploadError);
          
          if (uploadError.message.includes('permission') || uploadError.message.includes('access denied')) {
            console.log('Permission error when uploading to storage, using localStorage fallback');
          } else {
            throw uploadError;
          }
        } else {
          const { data } = supabase.storage
            .from('story_narrations')
            .getPublicUrl(fileName);
          
          const publicUrl = data.publicUrl;
          console.log(`Successfully uploaded audio to Supabase: ${publicUrl}`);
          
          try {
            const { error: dbError } = await supabase
              .from('story_narrations')
              .upsert({
                story_id: storyId,
                page_index: pageIndex,
                audio_url: publicUrl,
                voice_id: voiceId
              });
              
            if (dbError) {
              console.error('Erro ao salvar no banco de dados:', dbError);
            } else {
              console.log(`Successfully saved audio metadata to database for page ${pageIndex}`);
              audioUrlValue = publicUrl;
            }
          } catch (dbError) {
            console.error('Erro ao salvar no banco de dados:', dbError);
          }
        }
      } catch (storageError) {
        console.error('Erro ao salvar no storage:', storageError);
      }
      
      setAudioUrl(audioUrlValue);
      setIsGenerating(false);
      return audioUrlValue;
      
    } catch (error) {
      console.error('Erro ao gerar narração:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (!params) {
        console.error(`Error generating audio: ${errorMessage}`);
      }
      
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        console.log(`Retrying audio generation, attempt ${retryCount + 1} of ${maxRetries}`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return generateAudio(voiceType, params);
      }
      
      setIsGenerating(false);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = async (voiceType: 'male' | 'female' = 'female', existingAudioUrl?: string) => {
    // If an existing URL is provided, use it directly
    if (existingAudioUrl) {
      if (audioRef.current) {
        try {
          audioRef.current.src = existingAudioUrl;
          await audioRef.current.play();
          setIsPlaying(true);
          return;
        } catch (error) {
          console.error('Erro ao reproduzir áudio existente:', error);
          toast.error('Erro ao reproduzir narração existente');
        }
      }
    }
    
    // If we have an audio URL from state, use it
    if (audioUrl && !isGenerating) {
      if (audioRef.current) {
        try {
          if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
          } else {
            audioRef.current.src = audioUrl;
            await audioRef.current.play();
            setIsPlaying(true);
          }
          return;
        } catch (error) {
          console.error('Erro ao reproduzir áudio do estado:', error);
          // Continue to generate new audio if playback fails
        }
      }
    }
    
    // If we need to generate new audio
    if (!audioUrl && !isGenerating && text) {
      const generatedUrl = await generateAudio(voiceType);
      if (generatedUrl && audioRef.current) {
        audioRef.current.src = generatedUrl;
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Erro ao reproduzir áudio gerado:', error);
          toast.error('Erro ao reproduzir narração gerada');
        }
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
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

  // Helper function to convert regular text to SSML
  const formatTextWithSSML = (text: string): string => {
    let ssml = text.replace(/\./g, '.<break time="500ms"/>');
    
    ssml = ssml.replace(/([^.!?]*\?)/g, '<emphasis level="moderate">$1</emphasis>');
    ssml = ssml.replace(/([^.!?]*!)/g, '<emphasis level="strong">$1</emphasis>');
    
    ssml = `<speak>${ssml}</speak>`;
    
    return ssml;
  };

  return {
    isGenerating,
    isPlaying,
    playAudio,
    generateAudio,
    toggleMute,
    VOICE_IDS,
    AVAILABLE_VOICES,
    VOICE_PRESETS
  };
};
