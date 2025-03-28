
import React, { useEffect, useState } from 'react';
import { VoiceType, useVoiceNarration } from '@/hooks/useVoiceNarration';
import VoiceNarrationControls from './VoiceNarrationControls';
import { toast } from 'sonner';

interface VoiceNarrationPlayerProps {
  storyId: string;
  pages: string[];
  currentPage: number;
  onPageChange?: (pageNumber: number) => void;
}

const VoiceNarrationPlayer: React.FC<VoiceNarrationPlayerProps> = ({
  storyId,
  pages,
  currentPage,
  onPageChange
}) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  useEffect(() => {
    // Load API key from localStorage
    const key = localStorage.getItem('elevenlabs_api_key');
    setApiKey(key);
  }, []);
  
  const {
    settings,
    state,
    setPagesContent,
    narratePage,
    stopNarration,
    toggleVoice,
    toggleAutoplay
  } = useVoiceNarration(storyId, apiKey || undefined);
  
  // Set pages content when it changes
  useEffect(() => {
    if (pages.length > 0) {
      setPagesContent(pages);
    }
  }, [pages, setPagesContent]);
  
  // Handle auto page turn when using autoplay
  useEffect(() => {
    if (state.isAutoplay && onPageChange && currentPage !== undefined) {
      const handleAutoPageTurn = (e: Event) => {
        const audioEl = e.target as HTMLAudioElement;
        if (audioEl.ended && currentPage < pages.length - 1) {
          setTimeout(() => {
            onPageChange(currentPage + 1);
          }, 1000);
        }
      };
      
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        audio.addEventListener('ended', handleAutoPageTurn);
      });
      
      return () => {
        audioElements.forEach(audio => {
          audio.removeEventListener('ended', handleAutoPageTurn);
        });
      };
    }
  }, [state.isAutoplay, currentPage, pages.length, onPageChange]);
  
  const handleStartNarration = async () => {
    try {
      await narratePage(currentPage);
    } catch (error) {
      console.error('Error starting narration:', error);
      toast.error('Não foi possível iniciar a narração. Verifique sua conexão e chave da API.');
    }
  };
  
  const handleStopNarration = () => {
    stopNarration();
  };
  
  const handleToggleVoice = () => {
    toggleVoice();
    
    // If currently narrating, restart with new voice
    if (state.isNarrating) {
      stopNarration();
      setTimeout(() => {
        narratePage(currentPage, { 
          voiceType: state.currentVoice === 'female' ? 'male' : 'female' 
        });
      }, 100);
    }
  };
  
  return (
    <div className="mt-4">
      <VoiceNarrationControls 
        isNarrating={state.isNarrating}
        isAutoplay={state.isAutoplay}
        currentVoice={state.currentVoice}
        onStartNarration={handleStartNarration}
        onStopNarration={handleStopNarration}
        onToggleVoice={handleToggleVoice}
        onToggleAutoplay={toggleAutoplay}
        apiKeyMissing={!apiKey}
      />
    </div>
  );
};

export default VoiceNarrationPlayer;
