
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Corrected import from button.tsx instead of card.tsx
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { uploadToImgBB } from "@/lib/imgbbUploader";
import { ImageIcon, CheckCircle2, AlertTriangle, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const OpenAIImageMigrationTool = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [storiesScanned, setStoriesScanned] = useState(0);
  const [totalStories, setTotalStories] = useState(0);
  const [imagesFixed, setImagesFixed] = useState(0);
  const [failedImages, setFailedImages] = useState(0);
  const [totalImagesProcessed, setTotalImagesProcessed] = useState(0);
  const [results, setResults] = useState<{
    storyId: string;
    title: string;
    fixedImages: number;
    failedImages: number;
  }[]>([]);

  const runImageMigration = async () => {
    try {
      setIsScanning(true);
      setScanProgress(0);
      setStoriesScanned(0);
      setTotalStories(0);
      setImagesFixed(0);
      setFailedImages(0);
      setTotalImagesProcessed(0);
      setResults([]);

      toast.info("Iniciando migração de imagens da OpenAI...");

      // Step 1: Get all stories
      const { data: stories, error } = await supabase
        .from("stories")
        .select("id, title, pages, cover_image_url")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setTotalStories(stories.length);
      toast.info(`${stories.length} histórias encontradas para análise.`);

      // Step 2: Process each story to fix images
      let totalFixed = 0;
      let totalFailed = 0;
      let totalProcessed = 0;

      for (let i = 0; i < stories.length; i++) {
        const story = stories[i];
        setStoriesScanned(i + 1);
        setScanProgress(Math.round(((i + 1) / stories.length) * 100));

        let storyFixedImages = 0;
        let storyFailedImages = 0;
        let updatedStory = { ...story };
        let storyUpdated = false;

        // Check cover image
        if (story.cover_image_url && 
          (story.cover_image_url.includes('oaidalleapiprodscus.blob.core.windows.net') || 
           story.cover_image_url.includes('openai') ||
           story.cover_image_url.includes('production-files'))) {
          totalProcessed++;
          try {
            console.log(`Migrando imagem de capa para a história ${story.id}: ${story.cover_image_url}`);
            const permanentUrl = await uploadToImgBB(story.cover_image_url, `cover_${story.id}`);
            
            if (permanentUrl && permanentUrl !== story.cover_image_url) {
              updatedStory.cover_image_url = permanentUrl;
              storyUpdated = true;
              storyFixedImages++;
              totalFixed++;
            } else {
              storyFailedImages++;
              totalFailed++;
            }
          } catch (error) {
            console.error(`Erro ao migrar imagem de capa para história ${story.id}:`, error);
            storyFailedImages++;
            totalFailed++;
          }
        }

        // Check page images
        if (Array.isArray(story.pages)) {
          const updatedPages = [...story.pages];
          
          for (let pageIndex = 0; pageIndex < updatedPages.length; pageIndex++) {
            const page = updatedPages[pageIndex];
            // Handle different page structure possibilities with type safety
            let imageUrl: string | null = null;
            
            if (typeof page === 'object' && page !== null) {
              // Check for imageUrl or image_url property
              imageUrl = (page as any).imageUrl || (page as any).image_url;
            }
            
            if (imageUrl && 
               (imageUrl.includes('oaidalleapiprodscus.blob.core.windows.net') || 
                imageUrl.includes('openai') ||
                imageUrl.includes('production-files'))) {
              totalProcessed++;
              try {
                console.log(`Migrando imagem da página ${pageIndex + 1} para história ${story.id}: ${imageUrl}`);
                const permanentUrl = await uploadToImgBB(imageUrl, `${story.id}_page${pageIndex}`);
                
                if (permanentUrl && permanentUrl !== imageUrl) {
                  if (typeof page === 'object' && page !== null) {
                    // Update both possible property names for maximum compatibility
                    updatedPages[pageIndex] = {
                      ...(page as any),
                      imageUrl: permanentUrl,
                      image_url: permanentUrl
                    };
                  }
                  
                  storyUpdated = true;
                  storyFixedImages++;
                  totalFixed++;
                } else {
                  storyFailedImages++;
                  totalFailed++;
                }
              } catch (error) {
                console.error(`Erro ao migrar imagem para página ${pageIndex + 1} da história ${story.id}:`, error);
                storyFailedImages++;
                totalFailed++;
              }
            }
          }
          
          if (storyUpdated) {
            updatedStory.pages = updatedPages;
          }
        }

        // Update the story if any images were fixed
        if (storyUpdated) {
          const { error: updateError } = await supabase
            .from("stories")
            .update({
              cover_image_url: updatedStory.cover_image_url,
              pages: updatedStory.pages
            })
            .eq("id", story.id);

          if (updateError) {
            console.error(`Erro ao atualizar história ${story.id}:`, updateError);
            toast.error(`Erro ao atualizar história ${story.title}`);
            storyFailedImages += storyFixedImages;
            totalFailed += storyFixedImages;
            totalFixed -= storyFixedImages;
            storyFixedImages = 0;
          }
        }

        // Add to results
        if (storyFixedImages > 0 || storyFailedImages > 0) {
          setResults(prev => [...prev, {
            storyId: story.id,
            title: story.title,
            fixedImages: storyFixedImages,
            failedImages: storyFailedImages
          }]);
        }

        // Update counts
        setImagesFixed(totalFixed);
        setFailedImages(totalFailed);
        setTotalImagesProcessed(totalProcessed);
        
        // Brief pause to prevent rate limiting
        if (i < stories.length - 1) {
          await new Promise(r => setTimeout(r, 100));
        }
      }

      toast.success(`Migração de imagens concluída! ${totalFixed} imagens OpenAI salvas permanentemente.`);
    } catch (error) {
      console.error("Erro durante a migração de imagens:", error);
      toast.error("Erro durante a migração de imagens");
    } finally {
      setIsScanning(false);
    }
  };

  const processBatchFromSessionStorage = async () => {
    try {
      setIsScanning(true);
      toast.info("Processando histórias do armazenamento temporário...");
      
      // Get all story data from sessionStorage
      let storyData = sessionStorage.getItem("storyData");
      let fixedCount = 0;
      
      if (storyData) {
        try {
          const parsedStory = JSON.parse(storyData);
          if (!parsedStory) {
            toast.warning("Nenhuma história encontrada no armazenamento temporário");
            return;
          }
          
          // Check cover image
          if (parsedStory.coverImageUrl || parsedStory.cover_image_url) {
            const coverUrl = parsedStory.coverImageUrl || parsedStory.cover_image_url;
            if (coverUrl && (
                coverUrl.includes('oaidalleapiprodscus') || 
                coverUrl.includes('openai') || 
                coverUrl.includes('production-files')
            )) {
              const newCoverUrl = await uploadToImgBB(coverUrl, "cover_image");
              if (newCoverUrl && newCoverUrl !== coverUrl) {
                parsedStory.coverImageUrl = newCoverUrl;
                parsedStory.cover_image_url = newCoverUrl;
                fixedCount++;
              }
            }
          }
          
          // Check page images
          if (Array.isArray(parsedStory.pages)) {
            for (let i = 0; i < parsedStory.pages.length; i++) {
              const page = parsedStory.pages[i];
              // Safely access image URL properties
              let imageUrl = null;
              if (page && typeof page === 'object') {
                imageUrl = (page as any).imageUrl || (page as any).image_url;
              }
              
              if (imageUrl && (
                  imageUrl.includes('oaidalleapiprodscus') || 
                  imageUrl.includes('openai') || 
                  imageUrl.includes('production-files')
              )) {
                const newImageUrl = await uploadToImgBB(imageUrl, `page_${i}`);
                if (newImageUrl && newImageUrl !== imageUrl) {
                  if (page && typeof page === 'object') {
                    // Update both properties for maximum compatibility
                    parsedStory.pages[i] = {
                      ...(page as any),
                      imageUrl: newImageUrl,
                      image_url: newImageUrl
                    };
                  }
                  fixedCount++;
                }
              }
            }
          }
          
          // Save updated story back to sessionStorage
          sessionStorage.setItem("storyData", JSON.stringify(parsedStory));
          
          toast.success(`Migração concluída! ${fixedCount} imagens foram salvas permanentemente.`);
          setImagesFixed(fixedCount);
        } catch (error) {
          console.error("Erro ao processar história da sessão:", error);
          toast.error("Erro ao processar história da sessão");
        }
      } else {
        toast.warning("Nenhuma história encontrada na sessão atual");
      }
      
      // Process any localStorage stories
      const keys = Object.keys(localStorage);
      const storyKeys = keys.filter(key => key.includes('storyData'));
      
      if (storyKeys.length > 0) {
        toast.info(`Processando ${storyKeys.length} histórias do localStorage...`);
        let localFixedCount = 0;
        
        for (const key of storyKeys) {
          try {
            const storyJson = localStorage.getItem(key);
            if (storyJson) {
              const story = JSON.parse(storyJson);
              let storyUpdated = false;
              
              // Same process as above for each localStorage story
              // But simplified for brevity
              if (story.coverImageUrl || story.cover_image_url) {
                const coverUrl = story.coverImageUrl || story.cover_image_url;
                if (coverUrl && (
                    coverUrl.includes('oaidalleapiprodscus') || 
                    coverUrl.includes('openai') || 
                    coverUrl.includes('production-files')
                )) {
                  const newCoverUrl = await uploadToImgBB(coverUrl, "cover_image");
                  if (newCoverUrl && newCoverUrl !== coverUrl) {
                    story.coverImageUrl = newCoverUrl;
                    story.cover_image_url = newCoverUrl;
                    localFixedCount++;
                    storyUpdated = true;
                  }
                }
              }
              
              // Process pages
              if (Array.isArray(story.pages)) {
                for (let i = 0; i < story.pages.length; i++) {
                  const page = story.pages[i];
                  if (!page || typeof page !== 'object') continue;
                  
                  const imageUrl = (page as any).imageUrl || (page as any).image_url;
                  
                  if (imageUrl && (
                      imageUrl.includes('oaidalleapiprodscus') || 
                      imageUrl.includes('openai') || 
                      imageUrl.includes('production-files')
                  )) {
                    const newImageUrl = await uploadToImgBB(imageUrl, `page_${i}`);
                    if (newImageUrl && newImageUrl !== imageUrl) {
                      story.pages[i] = {
                        ...page,
                        imageUrl: newImageUrl,
                        image_url: newImageUrl
                      };
                      localFixedCount++;
                      storyUpdated = true;
                    }
                  }
                }
              }
              
              // Save updated story back to localStorage if changed
              if (storyUpdated) {
                localStorage.setItem(key, JSON.stringify(story));
              }
            }
          } catch (error) {
            console.error(`Erro ao processar história do localStorage:`, error);
          }
        }
        
        if (localFixedCount > 0) {
          toast.success(`${localFixedCount} imagens fixadas no localStorage`);
          setImagesFixed(prev => prev + localFixedCount);
        }
      }
      
    } catch (error) {
      console.error("Erro durante o processamento de histórias temporárias:", error);
      toast.error("Erro ao processar histórias temporárias");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Migração de Imagens OpenAI
        </CardTitle>
        <CardDescription>
          Migra imagens temporárias da OpenAI para armazenamento permanente no ImgBB
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isScanning ? (
          <div className="space-y-4">
            <div className="flex justify-between mb-1">
              <p className="text-sm">Progresso ({storiesScanned} de {totalStories} histórias)</p>
              <p className="text-sm font-medium">{scanProgress}%</p>
            </div>
            <Progress value={scanProgress} />
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span>Histórias escaneadas:</span>
                <span>{storiesScanned}/{totalStories}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Imagens processadas:</span>
                <span>{totalImagesProcessed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Imagens migradas:
                </span>
                <span>{imagesFixed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Falhas:
                </span>
                <span>{failedImages}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                As URLs das imagens geradas pela OpenAI são temporárias e expiram após algum tempo, 
                fazendo com que as imagens desapareçam das histórias. Esta ferramenta migra todas as imagens 
                temporárias para o armazenamento permanente do ImgBB, independente do acesso ao banco de dados.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Button 
                onClick={runImageMigration} 
                disabled={isScanning}
                variant="default"
                className="flex items-center gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Migrar Imagens do Banco de Dados
              </Button>
              
              <Button
                onClick={processBatchFromSessionStorage}
                disabled={isScanning}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Migrar Imagens da Sessão Atual
              </Button>
            </div>
            
            {results.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Resultados:</h3>
                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
                  {results.map((result) => (
                    <div key={result.storyId} className="border-b pb-2">
                      <div className="flex justify-between">
                        <span className="font-medium truncate max-w-[200px]">{result.title}</span>
                        <div className="flex gap-2">
                          {result.fixedImages > 0 && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500">
                              {result.fixedImages} migradas
                            </Badge>
                          )}
                          {result.failedImages > 0 && (
                            <Badge variant="destructive" className="bg-red-500/10 text-red-700 border-red-500">
                              {result.failedImages} falhas
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Alert className="bg-blue-50 text-blue-800 border-blue-200">
          <AlertDescription>
            <strong>Solução alternativa:</strong> Esta ferramenta usa o ImgBB como serviço de armazenamento alternativo 
            quando o Supabase Storage não está acessível ou com problemas de permissão. Todas as imagens serão salvas 
            com URLs permanentes.
          </AlertDescription>
        </Alert>
      </CardFooter>
    </Card>
  );
};

export default OpenAIImageMigrationTool;
