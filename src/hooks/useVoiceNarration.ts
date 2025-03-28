
import { useState, useEffect, useCallback, useRef } from 'react';

export type VoiceType = 'female' | 'male';

interface VoiceNarrationSettings {
  enabled: boolean;
  defaultVoice: VoiceType;
  femaleVoiceId: string;
  maleVoiceId: string;
  model: string;
  language: string;
}

interface VoiceNarrationState {
  isNarrating: boolean;
  currentVoice: VoiceType;
  isAutoplay: boolean;
  currentAudioSrc: string | null;
}

export const useVoiceNarration = (
  storyId: string,
  apiKey?: string,
  initialSettings?: Partial<VoiceNarrationSettings>
) => {
  const [settings, setSettings] = useState<VoiceNarrationSettings>({
    enabled: true,
    defaultVoice: 'female',
    femaleVoiceId: 'pFZP5JQG7iQjIQuC4Bku', // Lily voice
    maleVoiceId: 'onwK4e9ZLuTAKqWW03F9',   // Daniel voice
    model: 'eleven_multilingual_v2',       // Best for Portuguese
    language: 'pt-BR',
    ...initialSettings
  });

  const [state, setState] = useState<VoiceNarrationState>({
    isNarrating: false,
    currentVoice: settings.defaultVoice,
    isAutoplay: true,
    currentAudioSrc: null
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Record<string, string>>({});
  const currentPageRef = useRef<number>(0);
  const pagesContentRef = useRef<string[]>([]);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      audioRef.current.onended = () => {
        setState(prev => ({ ...prev, isNarrating: false }));
        
        // If autoplay is enabled, move to the next page
        if (state.isAutoplay && currentPageRef.current < pagesContentRef.current.length - 1) {
          setTimeout(() => {
            const nextPage = currentPageRef.current + 1;
            currentPageRef.current = nextPage;
            narratePage(nextPage);
          }, 1000);
        }
      };
      
      audioRef.current.onerror = (e) => {
        console.error('Audio playback error:', e);
        setState(prev => ({ ...prev, isNarrating: false }));
      };
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [state.isAutoplay]);

  // Helper to generate a cache key
  const getCacheKey = useCallback((pageIndex: number, voice: VoiceType) => {
    return `${storyId}_${pageIndex}_${voice}`;
  }, [storyId]);

  // Set pages content
  const setPagesContent = useCallback((pages: string[]) => {
    pagesContentRef.current = pages;
  }, []);

  // Generate audio for a specific text using ElevenLabs API
  const generateAudio = useCallback(async (
    text: string, 
    voiceType: VoiceType
  ): Promise<string> => {
    if (!apiKey) {
      throw new Error('API key not provided for ElevenLabs');
    }

    const voiceId = voiceType === 'female' ? settings.femaleVoiceId : settings.maleVoiceId;
    
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text,
          model_id: settings.model,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('ElevenLabs API error:', errorData);
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to generate audio:', error);
      throw error;
    }
  }, [apiKey, settings]);

  // Narrate a specific page
  const narratePage = useCallback(async (
    pageIndex: number,
    options?: { voiceType?: VoiceType }
  ) => {
    try {
      if (!settings.enabled || !apiKey || pageIndex >= pagesContentRef.current.length) {
        return;
      }

      const voiceType = options?.voiceType || state.currentVoice;
      const cacheKey = getCacheKey(pageIndex, voiceType);
      
      setState(prev => ({ 
        ...prev, 
        isNarrating: true,
        currentVoice: voiceType
      }));
      
      currentPageRef.current = pageIndex;
      
      let audioSrc = audioCache.current[cacheKey];
      
      if (!audioSrc) {
        const pageText = pagesContentRef.current[pageIndex];
        if (!pageText) return;
        
        audioSrc = await generateAudio(pageText, voiceType);
        audioCache.current[cacheKey] = audioSrc;
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = audioSrc;
        setState(prev => ({ ...prev, currentAudioSrc: audioSrc }));
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error narrating page:', error);
      setState(prev => ({ ...prev, isNarrating: false }));
    }
  }, [apiKey, generateAudio, getCacheKey, settings.enabled, state.currentVoice]);

  // Stop narration
  const stopNarration = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, isNarrating: false }));
    }
  }, []);

  // Toggle voice type
  const toggleVoice = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      currentVoice: prev.currentVoice === 'female' ? 'male' : 'female' 
    }));
  }, []);

  // Toggle autoplay
  const toggleAutoplay = useCallback(() => {
    setState(prev => ({ ...prev, isAutoplay: !prev.isAutoplay }));
  }, []);

  // Change settings
  const updateSettings = useCallback((newSettings: Partial<VoiceNarrationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    settings,
    state,
    setPagesContent,
    narratePage,
    stopNarration,
    toggleVoice,
    toggleAutoplay,
    updateSettings
  };
};
