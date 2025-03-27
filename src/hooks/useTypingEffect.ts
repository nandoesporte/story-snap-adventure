
import { useState, useEffect, useRef } from 'react';

/**
 * Hook que cria um efeito de digitação em tempo real para o texto
 * @param text O texto completo que será exibido
 * @param dependency Dependência que, quando alterada, reinicia o efeito
 * @param typingSpeed Velocidade da digitação em ms (padrão: 30ms)
 * @param typingVariation Se verdadeiro, adiciona variação aleatória à velocidade (mais natural)
 * @param initialDelay Atraso inicial antes de começar a digitar (ms)
 */
export const useTypingEffect = (
  text: string,
  dependency: any,
  typingSpeed: number = 30,
  typingVariation: boolean = true,
  initialDelay: number = 500
): string => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Reinicia o efeito quando o texto ou a dependência muda
    setDisplayedText('');
    setIndex(0);
    startTimeRef.current = null;
  }, [text, dependency]);

  useEffect(() => {
    // Se já exibiu todo o texto, não faz nada
    if (index >= text.length) {
      return;
    }

    // Implementa o atraso inicial apenas na primeira vez
    if (index === 0 && startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      const initialTimer = setTimeout(() => {
        setDisplayedText(text.charAt(0));
        setIndex(1);
      }, initialDelay);
      
      return () => clearTimeout(initialTimer);
    }
    
    // Calcula a velocidade com variação aleatória para tornar mais natural
    const currentSpeed = typingVariation 
      ? typingSpeed + Math.random() * (typingSpeed * 0.5) - typingSpeed * 0.25
      : typingSpeed;
    
    // Adiciona pausas maiores para pontuação
    const currentChar = text.charAt(index - 1);
    const extraDelay = ['.', '!', '?', ',', ';', ':'].includes(currentChar) 
      ? (currentChar === '.' || currentChar === '!' || currentChar === '?') ? 500 : 200
      : 0;
    
    // Define um timer para adicionar uma letra por vez
    const timer = setTimeout(() => {
      setDisplayedText((prevText) => prevText + text.charAt(index));
      setIndex((prevIndex) => prevIndex + 1);
    }, currentSpeed + extraDelay);

    return () => clearTimeout(timer);
  }, [index, text, typingSpeed, typingVariation, initialDelay]);

  return displayedText;
};
