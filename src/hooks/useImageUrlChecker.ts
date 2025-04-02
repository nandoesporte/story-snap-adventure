
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { testImageAccess } from '@/components/story-viewer/helpers';
import { saveImagePermanently } from '@/lib/imageStorage';

interface UseImageUrlCheckerProps {
  urls?: string[];
  autoCheck?: boolean;
  onComplete?: (results: ImageCheckResults) => void;
}

export interface ImageCheckResults {
  total: number;
  accessible: number;
  fixed: number;
  failed: number;
  fixedUrls: Record<string, string>;
}

export const useImageUrlChecker = ({
  urls = [],
  autoCheck = false,
  onComplete
}: UseImageUrlCheckerProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<ImageCheckResults>({
    total: 0,
    accessible: 0,
    fixed: 0,
    failed: 0,
    fixedUrls: {}
  });

  const checkUrls = useCallback(async (imageUrls: string[]) => {
    if (isChecking || !imageUrls.length) return;

    try {
      setIsChecking(true);
      
      const uniqueUrls = [...new Set(imageUrls)].filter(url => url && url.trim() !== '');
      
      if (uniqueUrls.length === 0) {
        setResults({
          total: 0,
          accessible: 0,
          fixed: 0,
          failed: 0,
          fixedUrls: {}
        });
        return;
      }

      console.log(`Verificando ${uniqueUrls.length} URLs de imagens...`);
      toast.info(`Verificando ${uniqueUrls.length} URLs de imagens...`);
      
      let accessible = 0;
      let fixed = 0;
      let failed = 0;
      const fixedUrls: Record<string, string> = {};

      for (const url of uniqueUrls) {
        try {
          // Verificar se a URL já é do ImgBB
          if (url.includes('i.ibb.co') || url.includes('image.ibb.co')) {
            // Verificar se a URL ainda é acessível
            const isAccessible = await testImageAccess(url);
            if (isAccessible) {
              accessible++;
              continue;
            }
          }

          // Verificar se a URL é acessível
          const isAccessible = await testImageAccess(url);
          if (isAccessible) {
            accessible++;
            
            // Se for uma URL temporária, migrar para o ImgBB
            if (
              url.includes('oaidalleapiprodscus.blob.core.windows.net') || 
              url.includes('openai') ||
              url.includes('production-files')
            ) {
              try {
                const newUrl = await saveImagePermanently(url);
                if (newUrl && newUrl !== url) {
                  fixed++;
                  fixedUrls[url] = newUrl;
                  console.log(`URL migrada com sucesso: ${url} -> ${newUrl}`);
                }
              } catch (e) {
                console.error(`Erro ao migrar URL acessível: ${url}`, e);
              }
            }
          } else {
            // URL não está acessível, tentar migrar para o ImgBB
            try {
              const newUrl = await saveImagePermanently(url);
              if (newUrl && newUrl !== url) {
                fixed++;
                fixedUrls[url] = newUrl;
                console.log(`URL inacessível migrada com sucesso: ${url} -> ${newUrl}`);
              } else {
                failed++;
                console.error(`Não foi possível migrar URL inacessível: ${url}`);
              }
            } catch (e) {
              failed++;
              console.error(`Erro ao migrar URL inacessível: ${url}`, e);
            }
          }
        } catch (error) {
          console.error(`Erro ao verificar URL: ${url}`, error);
          failed++;
        }
      }
      
      const newResults = {
        total: uniqueUrls.length,
        accessible,
        fixed,
        failed,
        fixedUrls
      };
      
      setResults(newResults);
      
      if (onComplete) {
        onComplete(newResults);
      }
      
      if (fixed > 0) {
        toast.success(`${fixed} URLs de imagens foram migradas com sucesso para armazenamento permanente.`);
      }
      
      if (failed > 0) {
        toast.error(`${failed} URLs de imagens não puderam ser verificadas ou migradas.`);
      }
      
    } catch (error) {
      console.error("Erro ao verificar URLs de imagens:", error);
      toast.error("Ocorreu um erro ao verificar as URLs das imagens");
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, onComplete]);

  // Verificação automática quando o componente é montado
  useEffect(() => {
    if (autoCheck && urls.length > 0) {
      checkUrls(urls);
    }
  }, [autoCheck, urls, checkUrls]);

  return {
    isChecking,
    results,
    checkUrls
  };
};
