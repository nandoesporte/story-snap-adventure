
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { saveImagePermanently } from "@/lib/imageStorage";
import { Hammer, ImageIcon, CheckCircle2, AlertTriangle, RefreshCcw } from "lucide-react";
import { isTemporaryUrl, isPermanentStorage } from "@/components/story-viewer/helpers";
import { Badge } from "@/components/ui/badge";

const StoryImageRepairTool = () => {
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

  const runImageRepair = async () => {
    try {
      setIsScanning(true);
      setScanProgress(0);
      setStoriesScanned(0);
      setTotalStories(0);
      setImagesFixed(0);
      setFailedImages(0);
      setTotalImagesProcessed(0);
      setResults([]);

      toast.info("Iniciando reparo de imagens...");

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
        if (story.cover_image_url && (isTemporaryUrl(story.cover_image_url) || !isPermanentStorage(story.cover_image_url))) {
          totalProcessed++;
          try {
            console.log(`Fixing cover image for story ${story.id}: ${story.cover_image_url}`);
            const permanentUrl = await saveImagePermanently(story.cover_image_url, `cover_${story.id}`);
            
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
            console.error(`Error fixing cover image for story ${story.id}:`, error);
            storyFailedImages++;
            totalFailed++;
          }
        }

        // Check page images
        if (Array.isArray(story.pages)) {
          const updatedPages = [...story.pages];
          
          for (let pageIndex = 0; pageIndex < updatedPages.length; pageIndex++) {
            const page = updatedPages[pageIndex];
            const imageUrl = page.imageUrl || page.image_url;
            
            if (imageUrl && (isTemporaryUrl(imageUrl) || !isPermanentStorage(imageUrl))) {
              totalProcessed++;
              try {
                console.log(`Fixing page ${pageIndex + 1} image for story ${story.id}: ${imageUrl}`);
                const permanentUrl = await saveImagePermanently(imageUrl, `${story.id}_page${pageIndex}`);
                
                if (permanentUrl && permanentUrl !== imageUrl) {
                  updatedPages[pageIndex] = {
                    ...page,
                    imageUrl: permanentUrl,
                    image_url: permanentUrl
                  };
                  storyUpdated = true;
                  storyFixedImages++;
                  totalFixed++;
                } else {
                  storyFailedImages++;
                  totalFailed++;
                }
              } catch (error) {
                console.error(`Error fixing image for page ${pageIndex + 1} of story ${story.id}:`, error);
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
            console.error(`Error updating story ${story.id}:`, updateError);
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

      toast.success(`Reparo de imagens concluído! ${totalFixed} imagens salvas permanentemente.`);
    } catch (error) {
      console.error("Erro durante o reparo de imagens:", error);
      toast.error("Erro durante o reparo de imagens");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hammer className="h-5 w-5" />
          Reparo de Imagens
        </CardTitle>
        <CardDescription>
          Busca imagens temporárias da OpenAI em histórias e salva permanentemente
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
                  Imagens corrigidas:
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
            <p>
              Esta ferramenta escaneia todas as histórias procurando por imagens temporárias da OpenAI
              que precisam ser salvas permanentemente nos servidores.
            </p>
            
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
                            <Badge variant="success" className="bg-green-500">
                              {result.fixedImages} corrigidas
                            </Badge>
                          )}
                          {result.failedImages > 0 && (
                            <Badge variant="destructive">
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
      <CardFooter className="flex justify-end">
        <Button 
          onClick={runImageRepair} 
          disabled={isScanning}
          variant="default"
          className="flex items-center gap-2"
        >
          {isScanning ? (
            <>
              <RefreshCcw className="h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4" />
              Iniciar Reparo de Imagens
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StoryImageRepairTool;
