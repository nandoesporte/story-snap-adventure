import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { VolumeIcon, Volume2Icon, Play, Pause, UserIcon, UserRoundIcon } from 'lucide-react';
import { VoiceType } from '@/hooks/useVoiceNarration';

interface VoiceNarrationControlsProps {
  isNarrating: boolean;
  isAutoplay: boolean;
  currentVoice: VoiceType;
  onStartNarration: () => void;
  onStopNarration: () => void;
  onToggleVoice: () => void;
  onToggleAutoplay: () => void;
  apiKeyMissing: boolean;
}

const VoiceNarrationControls: React.FC<VoiceNarrationControlsProps> = ({
  isNarrating,
  isAutoplay,
  currentVoice,
  onStartNarration,
  onStopNarration,
  onToggleVoice,
  onToggleAutoplay,
  apiKeyMissing
}) => {
  if (apiKeyMissing) {
    return (
      <div className="flex items-center justify-center p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
        <VolumeIcon className="h-4 w-4 mr-2 text-amber-600" />
        <span>Configure sua chave API do ElevenLabs nas configurações para ativar a narração por voz</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 p-3 bg-violet-50 border border-violet-100 rounded-md">
      <div className="flex items-center gap-2">
        <Button
          variant={isNarrating ? "secondary" : "outline"}
          size="sm"
          onClick={isNarrating ? onStopNarration : onStartNarration}
          className={isNarrating ? "bg-violet-100 text-violet-800" : ""}
        >
          {isNarrating ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pausar
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Narrar
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleVoice}
          className={`flex items-center gap-2 ${
            currentVoice === 'female' 
              ? 'text-pink-600 border-pink-200 hover:bg-pink-50'
              : 'text-blue-600 border-blue-200 hover:bg-blue-50'
          }`}
        >
          {currentVoice === 'female' ? (
            <>
              <Volume2Icon className="h-4 w-4" />
              <span>Voz Feminina</span>
            </>
          ) : (
            <>
              <VolumeIcon className="h-4 w-4" />
              <span>Voz Masculina</span>
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Switch 
          id="autoplay"
          checked={isAutoplay}
          onCheckedChange={onToggleAutoplay}
        />
        <Label htmlFor="autoplay" className="text-sm">
          Narração Automática
        </Label>
      </div>
    </div>
  );
};

export default VoiceNarrationControls;
