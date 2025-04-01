
// Voice types for text-to-speech
export type VoiceType = 'male' | 'female';

export const voiceTypes: Record<VoiceType, string> = {
  male: 'male',
  female: 'female'
};

// Map voice types to ElevenLabs voice IDs
export const getElevenLabsVoiceId = (voiceType: VoiceType): string => {
  const voices = {
    male: 'onwK4e9ZLuTAKqWW03F9', // Daniel
    female: 'EXAVITQu4vr4xnSDxMaL' // Sarah
  };
  
  return voices[voiceType] || voices.female;
};

// Map voice types to OpenAI TTS voice names
export const getOpenAIVoiceName = (voiceType: VoiceType): string => {
  const voices = {
    male: 'echo',
    female: 'nova'
  };
  
  return voices[voiceType] || voices.female;
};
