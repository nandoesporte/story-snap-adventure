
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface UseStoryNarrationProps {
  storyId: string;
  text: string;
  pageIndex: number;
}

export const useStoryNarration = ({ storyId, text, pageIndex }: UseStoryNarrationProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [googleTtsApiKey, setGoogleTtsApiKey] = useState<string | null>(null);
  const [maleVoice, setMaleVoice] = useState('pt-BR-Standard-B');
  const [femaleVoice, setFemaleVoice] = useState('pt-BR-Standard-A');

  // Load API key and voice configurations from the database
  useEffect(() => {
    const loadConfigurations = async () => {
      try {
        // Create table if it doesn't exist
        await supabase.rpc('create_app_config_if_not_exists');
        
        // Load Google TTS API key
        const { data: apiKeyData, error: apiKeyError } = await supabase
          .from('app_config')
          .select('value')
          .eq('key', 'google_tts_api_key')
          .single();
        
        if (!apiKeyError && apiKeyData) {
          setGoogleTtsApiKey(apiKeyData.value);
        }
        
        // Load male voice
        const { data: maleVoiceData, error: maleVoiceError } = await supabase
          .from('app_config')
          .select('value')
          .eq('key', 'male_tts_voice')
          .single();
        
        if (!maleVoiceError && maleVoiceData) {
          setMaleVoice(maleVoiceData.value);
        }
        
        // Load female voice
        const { data: femaleVoiceData, error: femaleVoiceError } = await supabase
          .from('app_config')
          .select('value')
          .eq('key', 'female_tts_voice')
          .single();
        
        if (!femaleVoiceError && femaleVoiceData) {
          setFemaleVoice(femaleVoiceData.value);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações de narração:', error);
      }
    };
    
    loadConfigurations();
  }, []);

  // When component unmounts, clean up audio
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Check if this page already has narration
  useEffect(() => {
    const checkExistingAudio = async () => {
      try {
        const { data, error } = await supabase
          .from('story_narrations')
          .select('audio_url')
          .eq('story_id', storyId)
          .eq('page_index', pageIndex)
          .single();
          
        if (!error && data?.audio_url) {
          setAudioUrl(data.audio_url);
        } else {
          setAudioUrl(null);
        }
      } catch (e) {
        console.error("Erro ao verificar narração existente:", e);
        setAudioUrl(null);
      }
    };
    
    if (storyId && pageIndex !== undefined) {
      checkExistingAudio();
    }
  }, [storyId, pageIndex]);

  const generateAudio = async (voiceType: 'male' | 'female') => {
    if (!googleTtsApiKey) {
      throw new Error("Chave da API Google TTS não configurada");
    }
    
    if (!storyId || !text) {
      throw new Error("Dados insuficientes para gerar narração");
    }
    
    setIsGenerating(true);
    
    try {
      // Determine which voice to use based on voice type
      const voiceName = voiceType === 'male' ? maleVoice : femaleVoice;
      const languageCode = voiceName.split('-')[0] + '-' + voiceName.split('-')[1];
      
      // Request TTS from Google Cloud API
      const requestBody = {
        input: { text },
        voice: { 
          languageCode, 
          name: voiceName 
        },
        audioConfig: { audioEncoding: "MP3" }
      };
      
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleTtsApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta da API Google TTS:', errorData);
        throw new Error(`Erro na resposta da API: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Decodificar o conteúdo de áudio Base64
      const audioContent = result.audioContent;
      const audioBytes = Uint8Array.from(atob(audioContent), c => c.charCodeAt(0));
      
      // Criar Blob e URL
      const audioBlob = new Blob([audioBytes], { type: 'audio/mp3' });
      
      // Upload to storage
      const filePath = `narrations/${storyId}/${pageIndex}_${Date.now()}.mp3`;
      
      const { data, error } = await supabase.storage
        .from('audio')
        .upload(filePath, audioBlob, {
          contentType: 'audio/mp3',
          cacheControl: '3600'
        });
      
      if (error) {
        throw new Error(`Erro ao salvar áudio: ${error.message}`);
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('audio')
        .getPublicUrl(filePath);
      
      const audioUrl = publicUrlData.publicUrl;
      
      // Save to database
      const { error: insertError } = await supabase
        .from('story_narrations')
        .upsert({
          story_id: storyId,
          page_index: pageIndex,
          audio_url: audioUrl,
          voice_type: voiceType,
          created_at: new Date().toISOString()
        }, { onConflict: 'story_id,page_index' });
      
      if (insertError) {
        throw new Error(`Erro ao salvar narração no banco de dados: ${insertError.message}`);
      }
      
      setAudioUrl(audioUrl);
      return audioUrl;
      
    } catch (error) {
      console.error('Erro ao gerar narração:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = async (voiceType: 'male' | 'female' = 'female') => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      let url = audioUrl;
      
      if (!url) {
        url = await generateAudio(voiceType);
      }
      
      if (!url) {
        throw new Error("Falha ao obter URL do áudio");
      }
      
      // Create audio element
      const audio = new Audio(url);
      audioRef.current = audio;
      
      // Set up event listeners
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Erro ao reproduzir áudio:', e);
        setIsPlaying(false);
      });
      
      // Play audio
      await audio.play();
      setIsPlaying(true);
      
    } catch (error) {
      console.error('Erro ao reproduzir narração:', error);
      setIsPlaying(false);
      throw error;
    }
  };

  return {
    isPlaying,
    isGenerating,
    audioUrl,
    playAudio,
    generateAudio
  };
};
