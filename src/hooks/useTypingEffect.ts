
import { useState, useEffect } from 'react';

/**
 * Hook que cria um efeito de digitação em tempo real para o texto
 * @param text O texto completo que será exibido
 * @param dependency Dependência que, quando alterada, reinicia o efeito
 * @param typingSpeed Velocidade da digitação em ms
 */
export const useTypingEffect = (
  text: string,
  dependency: any,
  typingSpeed: number = 30
): string => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Reinicia o efeito quando o texto ou a dependência muda
    setDisplayedText('');
    setIndex(0);
  }, [text, dependency]);

  useEffect(() => {
    // Se já exibiu todo o texto, não faz nada
    if (index >= text.length) {
      return;
    }

    // Define um timer para adicionar uma letra por vez
    const timer = setTimeout(() => {
      setDisplayedText((prevText) => prevText + text.charAt(index));
      setIndex((prevIndex) => prevIndex + 1);
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [index, text, typingSpeed]);

  return displayedText;
};
