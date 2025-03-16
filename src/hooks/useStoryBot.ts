
import { useState } from "react";
import { toast } from "sonner";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// This is a temporary implementation. In a real-world scenario, 
// you would use Supabase Edge Functions and secure API keys
export const useStoryBot = () => {
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem("geminiApiKey"));
  
  const generateStoryBotResponse = async (
    messageHistory: Message[],
    userInput: string
  ): Promise<string> => {
    if (!apiKey) {
      // If no API key is found, ask for it first
      const userProvidedKey = prompt(
        "Por favor, insira sua chave de API do Gemini para continuar (isso será salvo apenas no seu navegador):"
      );
      
      if (!userProvidedKey) {
        throw new Error("API key não fornecida");
      }
      
      localStorage.setItem("geminiApiKey", userProvidedKey);
      setApiKey(userProvidedKey);
    }
    
    try {
      // Prepare the prompt for the Gemini API
      const systemPrompt = `Você é um assistente virtual especializado em criar histórias infantis personalizadas. Seu nome é **StoryBot**. Sua função é ajudar pais e crianças a criarem histórias únicas e divertidas, com base nas preferências fornecidas. Siga estas diretrizes:

1. **Interação Inicial:**
   - Cumprimente o usuário de forma amigável.
   - Pergunte o nome da criança e o tema da história que desejam criar.
   - Ofereça sugestões de temas, como 'aventura na floresta', 'viagem ao espaço', 'reino mágico', etc.

2. **Coleta de Detalhes:**
   - Pergunte sobre características da criança (ex: corajosa, curiosa, brincalhona).
   - Pergunte se há algum elemento específico que deva ser incluído na história (ex: animais, magia, amigos).
   - Pergunte se o usuário deseja que a história tenha uma moral ou lição específica.

3. **Geração da História:**
   - Crie uma história curta, envolvente e adequada para crianças de 4 a 8 anos.
   - Use o nome da criança como personagem principal.
   - Inclua diálogos engraçados e cenas emocionantes.
   - Adicione uma moral ou lição no final, se solicitado.

4. **Sugestões de Ilustrações:**
   - Para cada parte da história, sugira uma descrição visual detalhada que possa ser transformada em uma ilustração.

5. **Finalização:**
   - Pergunte se o usuário gostou da história e se deseja fazer alguma alteração.
   - Ofereça opções para salvar a história, compartilhá-la ou criar uma nova.

6. **Tom e Estilo:**
   - Use um tom amigável, divertido e encorajador.
   - Mantenha a linguagem simples e acessível para crianças.`;

      // Convert our message history to Gemini's format
      const formattedMessages = messageHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));
      
      // Add current user input
      formattedMessages.push({
        role: "user",
        parts: [{ text: userInput }]
      });

      // Make the API call to Gemini
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" + apiKey, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "system",
              parts: [{ text: systemPrompt }]
            },
            ...formattedMessages
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API error:", errorData);
        throw new Error(`Erro na API do Gemini: ${errorData.error?.message || "Erro desconhecido"}`);
      }

      const data = await response.json();
      
      // Extract the response text
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui gerar uma resposta. Por favor, tente novamente.";
      
      return responseText;
    } catch (error) {
      console.error("Error in useStoryBot:", error);
      toast.error("Erro ao processar sua solicitação. Verifique sua chave de API.");
      throw error;
    }
  };

  return {
    generateStoryBotResponse,
    hasApiKey: !!apiKey,
  };
};
